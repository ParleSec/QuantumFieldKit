import os
import traceback
import json
import logging
from flask import Flask, request, render_template, jsonify, session, abort
from flask_socketio import SocketIO, emit
from werkzeug.middleware.proxy_fix import ProxyFix

# Import simulation functions from plugins
from plugins.authentication.auth import generate_quantum_fingerprint_cirq, verify_fingerprint_cirq
from plugins.encryption_bb84.bb84 import bb84_protocol_cirq
from plugins.error_correction.shor_code import run_shor_code
from plugins.grover.grover import run_grover
from plugins.handshake.handshake import handshake_cirq
from plugins.network.network import entanglement_swapping_cirq
from plugins.qrng.qrng import generate_random_number_cirq
from plugins.quantum_decryption.quantum_decryption import grover_key_search, shor_factorization
from plugins.teleportation.teleport import teleportation_circuit
from plugins.variational.vqe import run_vqe

from plugins.deutsch_jozsa.deutsch_jozsa import deutsch_jozsa_cirq
from plugins.quantum_fourier.qft import run_qft
from plugins.phase_estimation.phase_estimation import run_phase_estimation
from plugins.optimization.qaoa import run_qaoa

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

# Initialize Flask application
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', os.urandom(24))
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload

# Add proxy fix for proper IP handling behind reverse proxies
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)

# Initialize Socket.IO for real-time communication
socketio = SocketIO(app, async_mode='eventlet', cors_allowed_origins="*")

def json_safe(obj):
    """
    Recursively convert non-JSON-serializable objects to strings.
    Preserve raw SVG (under the key "circuit_svg") so it is not altered.
    """
    try:
        json.dumps(obj)
        return obj
    except (TypeError, OverflowError):
        if isinstance(obj, dict):
            new_obj = {}
            for k, v in obj.items():
                new_obj[k] = v if k == "circuit_svg" else json_safe(v)
            return new_obj
        elif isinstance(obj, (list, tuple)):
            return [json_safe(item) for item in obj]
        elif hasattr(obj, 'tolist'):  # For numpy arrays
            return obj.tolist()
        else:
            return str(obj)

def wrap_result(sim_result):
    """
    Standardize the simulation result into a dictionary with keys:
      - "output": All keys except "log"
      - "log": Detailed process log
      - "error": None if successful, or the error message.
    """
    if isinstance(sim_result, dict):
        if 'log' in sim_result:
            output = {k: v for k, v in sim_result.items() if k != 'log'}
            output = json_safe(output)
            return {"output": output, "log": sim_result['log'], "error": None}
        else:
            return {"output": json_safe(sim_result), "log": "", "error": None}
    elif isinstance(sim_result, tuple):
        if len(sim_result) > 1:
            *outputs, log = sim_result
            output = outputs[0] if len(outputs) == 1 else outputs
            output = json_safe(output)
            return {"output": output, "log": log, "error": None}
        else:
            return {"output": json_safe(sim_result[0]), "log": "", "error": None}
    else:
        return {"output": json_safe(sim_result), "log": "", "error": None}

def run_plugin(sim_func, **params):
    """
    Calls the simulation function with the given parameters.
    Returns a standardized result dictionary.
    """
    try:
        logger.info(f"Running simulation with parameters: {params}")
        sim_result = sim_func(**params)
        return wrap_result(sim_result)
    except Exception as e:
        error_msg = str(e)
        stack_trace = traceback.format_exc()
        logger.error(f"Simulation error: {error_msg}\n{stack_trace}")
        return {"output": None, "log": None, "error": f"{error_msg}\n\n{stack_trace}"}

# --- Plugin Registry ---
# Define all available quantum simulation plugins
PLUGINS = {
    "auth": {
        "name": "Quantum Authentication",
        "description": "Simulate quantum fingerprint authentication using Cirq.",
        "icon": "fa-fingerprint",
        "category": "security",
        "parameters": [
            {"name": "data", "type": "str", "default": "example_user", "description": "Data to authenticate"},
            {"name": "num_qubits", "type": "int", "default": 8, "description": "Number of qubits to use"}
        ],
        "run": lambda p: run_plugin(generate_quantum_fingerprint_cirq, data=p["data"], num_qubits=p["num_qubits"])
    },
    "bb84": {
        "name": "BB84 Protocol Simulation",
        "description": "Simulate the BB84 quantum key distribution protocol.",
        "icon": "fa-key",
        "category": "cryptography",
        "parameters": [
            {"name": "num_bits", "type": "int", "default": 10, "description": "Number of bits to simulate"},
            {"name": "noise", "type": "float", "default": 0.0, "description": "Noise probability"}
        ],
        "run": lambda p: run_plugin(bb84_protocol_cirq, num_bits=p["num_bits"], noise_prob=p["noise"])
    },
    "shor": {
        "name": "Shor's Code Simulation",
        "description": "Simulate quantum error correction using Shor's code.",
        "icon": "fa-shield-alt",
        "category": "error-correction",
        "parameters": [
            {"name": "noise", "type": "float", "default": 0.01, "description": "Noise probability"}
        ],
        "run": lambda p: run_plugin(run_shor_code, noise_prob=p["noise"])
    },
    "grover": {
        "name": "Grover's Algorithm Simulation",
        "description": "Simulate Grover's search algorithm.",
        "icon": "fa-search",
        "category": "algorithms",
        "parameters": [
            {"name": "n", "type": "int", "default": 3, "description": "Number of qubits"},
            {"name": "target_state", "type": "str", "default": "101", "description": "Target state (binary)"},
            {"name": "noise", "type": "float", "default": 0.0, "description": "Noise probability"}
        ],
        "run": lambda p: run_plugin(run_grover, n=p["n"], target_state=p["target_state"], noise_prob=p["noise"])
    },
    "handshake": {
        "name": "Quantum Handshake Simulation",
        "description": "Simulate a quantum handshake using entangled Bell pairs.",
        "icon": "fa-handshake",
        "category": "protocols",
        "parameters": [
            {"name": "noise", "type": "float", "default": 0.0, "description": "Noise probability"}
        ],
        "run": lambda p: run_plugin(handshake_cirq, noise_prob=p["noise"])
    },
    "network": {
        "name": "Entanglement Swapping Simulation",
        "description": "Simulate a quantum network using entanglement swapping.",
        "icon": "fa-network-wired",
        "category": "protocols",
        "parameters": [
            {"name": "noise", "type": "float", "default": 0.0, "description": "Noise probability"}
        ],
        "run": lambda p: run_plugin(entanglement_swapping_cirq, noise_prob=p["noise"])
    },
    "qrng": {
        "name": "Quantum Random Number Generator",
        "description": "Generate a random number using quantum superposition.",
        "icon": "fa-dice",
        "category": "utilities",
        "parameters": [
            {"name": "num_bits", "type": "int", "default": 8, "description": "Number of bits"}
        ],
        "run": lambda p: run_plugin(generate_random_number_cirq, num_bits=p["num_bits"])
    },
    "teleport": {
        "name": "Quantum Teleportation Simulation",
        "description": "Simulate quantum teleportation protocol.",
        "icon": "fa-atom",
        "category": "protocols",
        "parameters": [
            {"name": "noise", "type": "float", "default": 0.0, "description": "Noise probability"}
        ],
        "run": lambda p: run_plugin(teleportation_circuit, noise_prob=p["noise"])
    },
    "vqe": {
        "name": "Variational Quantum Eigensolver (VQE)",
        "description": "Simulate VQE to find the ground state energy of a Hamiltonian.",
        "icon": "fa-wave-square",
        "category": "algorithms",
        "parameters": [
            {"name": "num_qubits", "type": "int", "default": 2, "description": "Number of qubits"},
            {"name": "noise", "type": "float", "default": 0.01, "description": "Noise probability"},
            {"name": "max_iter", "type": "int", "default": 5, "description": "Maximum iterations"}
        ],
        "run": lambda p: run_plugin(run_vqe, num_qubits=p["num_qubits"], noise_prob=p["noise"], max_iter=p["max_iter"])
    },
    "quantum_decryption_grover": {
        "name": "Quantum Decryption via Grover Key Search",
        "description": "Use Grover's algorithm to search for a secret key.",
        "icon": "fa-unlock",
        "category": "cryptography",
        "parameters": [
            {"name": "key", "type": "int", "default": 5, "description": "Secret key (integer)"},
            {"name": "num_bits", "type": "int", "default": 4, "description": "Number of bits (search space)"},
            {"name": "noise", "type": "float", "default": 0.0, "description": "Noise probability"}
        ],
        "run": lambda p: run_plugin(grover_key_search, key=p["key"], num_bits=p["num_bits"], noise_prob=p["noise"])
    },
    "quantum_decryption_shor": {
        "name": "Quantum Decryption via Shor Factorization",
        "description": "Simulate quantum decryption using Shor's code simulation.",
        "icon": "fa-key",
        "category": "cryptography",
        "parameters": [
            {"name": "N", "type": "int", "default": 15, "description": "Composite number"}
        ],
        "run": lambda p: run_plugin(shor_factorization, N=p["N"])
    },
        "deutsch_jozsa": {
        "name": "Deutsch-Jozsa Algorithm",
        "description": "Determine if a function is constant or balanced with a single quantum query.",
        "icon": "fa-balance-scale",
        "category": "algorithms",
        "parameters": [
            {"name": "n_qubits", "type": "int", "default": 3, "description": "Number of input qubits"},
            {"name": "oracle_type", "type": "str", "default": "random", "description": "Oracle type: constant_0, constant_1, balanced, or random"},
            {"name": "noise", "type": "float", "default": 0.0, "description": "Noise probability"}
        ],
        "run": lambda p: run_plugin(deutsch_jozsa_cirq, n_qubits=p["n_qubits"], oracle_type=p["oracle_type"], noise_prob=p["noise"])
    },

    # Add the Quantum Fourier Transform
    "qft": {
        "name": "Quantum Fourier Transform",
        "description": "Implement the quantum analogue of the discrete Fourier transform.",
        "icon": "fa-wave-square",
        "category": "algorithms",
        "parameters": [
            {"name": "n_qubits", "type": "int", "default": 3, "description": "Number of qubits"},
            {"name": "input_state", "type": "str", "default": "010", "description": "Input state (binary)"},
            {"name": "include_inverse", "type": "str", "default": "False", "description": "Include inverse QFT"},
            {"name": "noise", "type": "float", "default": 0.0, "description": "Noise probability"}
        ],
        "run": lambda p: run_plugin(run_qft, n_qubits=p["n_qubits"], input_state=p["input_state"], 
                                    include_inverse=p["include_inverse"].lower() == "true", noise_prob=p["noise"])
    },

    # Add the Quantum Phase Estimation
    "phase_estimation": {
        "name": "Quantum Phase Estimation",
        "description": "Estimate eigenvalues of unitary operators with applications in quantum computing.",
        "icon": "fa-ruler-combined",
        "category": "algorithms",
        "parameters": [
            {"name": "precision_bits", "type": "int", "default": 3, "description": "Number of bits of precision"},
            {"name": "target_phase", "type": "float", "default": 0.125, "description": "Target phase to estimate (0-1)"},
            {"name": "noise", "type": "float", "default": 0.0, "description": "Noise probability"}
        ],
        "run": lambda p: run_plugin(run_phase_estimation, precision_bits=p["precision_bits"], 
                                    target_phase=p["target_phase"], noise_prob=p["noise"])
    },

    # Add the QAOA
    "qaoa": {
        "name": "Quantum Approximate Optimization Algorithm",
        "description": "Solve combinatorial optimization problems like MaxCut using a hybrid quantum-classical approach.",
        "icon": "fa-project-diagram",
        "category": "optimization",
        "parameters": [
            {"name": "n_nodes", "type": "int", "default": 4, "description": "Number of nodes in the graph"},
            {"name": "edge_probability", "type": "float", "default": 0.5, "description": "Probability of edge creation"},
            {"name": "p_layers", "type": "int", "default": 1, "description": "Number of QAOA layers"},
            {"name": "noise", "type": "float", "default": 0.0, "description": "Noise probability"},
            {"name": "num_samples", "type": "int", "default": 100, "description": "Number of samples"}
        ],
        "run": lambda p: run_plugin(run_qaoa, n_nodes=p["n_nodes"], edge_probability=p["edge_probability"], 
                                    p_layers=p["p_layers"], noise_prob=p["noise"], num_samples=p["num_samples"])
    }
}

# --- Route handlers ---
@app.route("/")
def index():
    """Render the homepage with a list of available plugins."""
    # Group plugins by category for better organization
    categories = {}
    for key, plugin in PLUGINS.items():
        category = plugin.get("category", "other")
        if category not in categories:
            categories[category] = []
        categories[category].append({"key": key, **plugin})
    
    return render_template("index.html", plugins=PLUGINS, categories=categories)

@app.route("/plugin/<plugin_key>", methods=["GET", "POST"])
def plugin_view(plugin_key):
    """Handle individual plugin pages and simulation requests."""
    if plugin_key not in PLUGINS:
        abort(404)
    
    plugin = PLUGINS[plugin_key]
    result = None
    
    if request.method == "POST":
        params = {}
        for param in plugin["parameters"]:
            raw_val = request.form.get(param["name"], param.get("default"))
            if param["type"] == "int":
                try:
                    raw_val = int(raw_val)
                except ValueError:
                    return jsonify({"error": f"Invalid integer value for {param['name']}"})
            elif param["type"] == "float":
                try:
                    raw_val = float(raw_val)
                except ValueError:
                    return jsonify({"error": f"Invalid float value for {param['name']}"})
            params[param["name"]] = raw_val
        
        # Execute the plugin with the provided parameters
        result = plugin["run"](params)
        
        # If this is an AJAX request, return JSON
        if request.headers.get("X-Requested-With") == "XMLHttpRequest":
            return jsonify(result)
    
    return render_template("plugin.html", plugin=plugin, result=result)

@app.route("/api/plugins", methods=["GET"])
def api_plugins():
    """API endpoint to get a list of all available plugins."""
    return jsonify({
        "plugins": {k: {
            "name": v["name"],
            "description": v["description"],
            "category": v["category"],
            "parameters": v["parameters"]
        } for k, v in PLUGINS.items()}
    })

@app.route("/api/run/<plugin_key>", methods=["POST"])
def api_run_plugin(plugin_key):
    """API endpoint to run a plugin with JSON parameters."""
    if plugin_key not in PLUGINS:
        return jsonify({"error": f"Plugin '{plugin_key}' not found"}), 404
    
    plugin = PLUGINS[plugin_key]
    
    # Parse JSON parameters
    try:
        params = request.json or {}
    except Exception:
        return jsonify({"error": "Invalid JSON data"}), 400
    
    # Validate and convert parameters
    for param in plugin["parameters"]:
        if param["name"] not in params and "default" in param:
            params[param["name"]] = param["default"]
        
        if param["name"] in params:
            if param["type"] == "int":
                try:
                    params[param["name"]] = int(params[param["name"]])
                except (ValueError, TypeError):
                    return jsonify({"error": f"Invalid integer value for {param['name']}"}), 400
            elif param["type"] == "float":
                try:
                    params[param["name"]] = float(params[param["name"]])
                except (ValueError, TypeError):
                    return jsonify({"error": f"Invalid float value for {param['name']}"}), 400
    
    # Run the plugin
    result = plugin["run"](params)
    return jsonify(result)

# --- Socket.IO event handlers for real-time updates ---
@socketio.on('connect')
def handle_connect():
    """Handle client connection."""
    logger.info(f"Client connected: {request.sid}")

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection."""
    logger.info(f"Client disconnected: {request.sid}")

@socketio.on('run_plugin')
def handle_run_plugin(data):
    """Run a plugin and emit progress updates."""
    plugin_key = data.get('plugin_key')
    params = data.get('params', {})
    
    if plugin_key not in PLUGINS:
        emit('plugin_error', {'error': f"Plugin '{plugin_key}' not found"})
        return
    
    plugin = PLUGINS[plugin_key]
    
    # Convert parameters to the correct types
    for param in plugin["parameters"]:
        name = param["name"]
        if name in params:
            try:
                if param["type"] == "int":
                    params[name] = int(params[name])
                elif param["type"] == "float":
                    params[name] = float(params[name])
            except (ValueError, TypeError):
                emit('plugin_error', {'error': f"Invalid {param['type']} value for {name}"})
                return
    
    # Run the plugin and emit the result
    try:
        emit('plugin_start', {'plugin_key': plugin_key})
        result = plugin["run"](params)
        emit('plugin_result', {'plugin_key': plugin_key, 'result': result})
    except Exception as e:
        emit('plugin_error', {'plugin_key': plugin_key, 'error': str(e)})

# --- Error handling ---
@app.errorhandler(404)
def page_not_found(e):
    """Handle 404 errors."""
    return render_template("error.html", error="Page not found"), 404

@app.errorhandler(500)
def server_error(e):
    """Handle 500 errors."""
    return render_template("error.html", error="Server error"), 500

# --- Main entry point ---
'''
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    debug = os.environ.get("FLASK_ENV") == "development"
    
    logger.info(f"Starting Quantum Field Kit Web Server on port {port}")
    logger.info(f"Debug mode: {debug}")
    logger.info(f"Available plugins: {', '.join(PLUGINS.keys())}")
    
    socketio.run(app, host="0.0.0.0", port=port, debug=debug)
'''
# Fly.io entry
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    socketio.run(app, host="0.0.0.0", port=port)

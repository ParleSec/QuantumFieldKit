import os
import traceback
import json
import logging
from flask import Flask, request, render_template, jsonify, session, abort
from flask_socketio import SocketIO, emit
from werkzeug.middleware.proxy_fix import ProxyFix
import signal
from functools import wraps
import threading
import multiprocessing

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

def timeout(seconds):
    """
    Decorator that adds a timeout to a function.
    If the function takes longer than 'seconds' to execute, it will be terminated.
    
    Args:
        seconds: Maximum execution time in seconds
        
    Returns:
        Decorated function with timeout capability
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            result = [None]
            error = [None]
            
            def target():
                try:
                    result[0] = func(*args, **kwargs)
                except Exception as e:
                    error[0] = e
            
            thread = threading.Thread(target=target)
            thread.daemon = True
            thread.start()
            thread.join(seconds)
            
            if thread.is_alive():
                return {"output": None, "log": None, "error": f"Execution timed out after {seconds} seconds"}
            
            if error[0] is not None:
                raise error[0]
            
            return result[0]
        
        return wrapper
    return decorator

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
        
        # Apply timeout to simulation function
        @timeout(10)
        def run_with_timeout():
            return sim_func(**params)
        
        sim_result = run_with_timeout()
        if isinstance(sim_result, dict) and "error" in sim_result and sim_result["error"] is not None:
            # This is a timeout error from our decorator
            return sim_result
        
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
            {"name": "data", "type": "str", "default": "example_user", "description": "Data to authenticate", 
             "max_length": 64},
            {"name": "num_qubits", "type": "int", "default": 8, "description": "Number of qubits to use",
             "min": 1, "max": 10}
        ],
        "run": lambda p: run_plugin(generate_quantum_fingerprint_cirq, data=p["data"], num_qubits=p["num_qubits"])
    },
    
    "bb84": {
        "name": "BB84 Protocol Simulation",
        "description": "Simulate the BB84 quantum key distribution protocol with realistic physical effects.",
        "icon": "fa-key",
        "category": "cryptography",
        "parameters": [
            {"name": "num_bits", "type": "int", "default": 10, "description": "Number of bits to simulate",
            "min": 1, "max": 16},
            
            {"name": "distance_km", "type": "float", "default": 0.0, "description": "Distance between Alice and Bob (km)",
            "min": 0.0, "max": 1000.0},
            
            {"name": "hardware_type", "type": "select", "default": "fiber", 
            "description": "Hardware type (fiber, satellite, trapped_ion)", 
            "options": ["fiber", "satellite", "trapped_ion"]},
            
            {"name": "noise", "type": "float", "default": 0.0, "description": "Additional noise probability",
            "min": 0.0, "max": 0.3},
            
            {"name": "eve_present", "type": "bool", "default": False, 
            "description": "Eavesdropper present"},
            
            {"name": "eve_strategy", "type": "select", "default": "intercept_resend", 
            "description": "Eavesdropper strategy (intercept_resend, beam_splitting, trojan)", 
            "options": ["intercept_resend", "beam_splitting", "trojan_horse"]},
            
            {"name": "detailed_simulation", "type": "bool", "default": True, 
            "description": "Run detailed quantum simulation"}
        ],
        "run": lambda p: run_plugin(bb84_protocol_cirq, 
                                num_bits=p["num_bits"],
                                distance_km=p["distance_km"],
                                hardware_type=p["hardware_type"],
                                eve_present=p["eve_present"].lower() == "true",
                                eve_strategy=p["eve_strategy"],
                                detailed_simulation=p["detailed_simulation"].lower() == "true",
                                noise_prob=p["noise"])
    },
    
    "shor": {
        "name": "Shor's Code Simulation",
        "description": "Simulate quantum error correction using Shor's code.",
        "icon": "fa-shield-alt",
        "category": "error-correction",
        "parameters": [
            {"name": "noise", "type": "float", "default": 0.01, "description": "Noise probability",
             "min": 0.0, "max": 0.3}
        ],
        "run": lambda p: run_plugin(run_shor_code, noise_prob=p["noise"])
    },
    
    "grover": {
        "name": "Grover's Algorithm Simulation",
        "description": "Simulate Grover's search algorithm.",
        "icon": "fa-search",
        "category": "algorithms",
        "parameters": [
            {"name": "n", "type": "int", "default": 3, "description": "Number of qubits",
             "min": 1, "max": 8},
            {"name": "target_state", "type": "str", "default": "101", "description": "Target state (binary)",
             "max_length": 8},
            {"name": "noise", "type": "float", "default": 0.0, "description": "Noise probability",
             "min": 0.0, "max": 0.3}
        ],
        "run": lambda p: run_plugin(run_grover, n=p["n"], target_state=p["target_state"], noise_prob=p["noise"])
    },
    
    "handshake": {
        "name": "Quantum Handshake Simulation",
        "description": "Simulate a quantum handshake using entangled Bell pairs.",
        "icon": "fa-handshake",
        "category": "protocols",
        "parameters": [
            {"name": "noise", "type": "float", "default": 0.0, "description": "Noise probability",
             "min": 0.0, "max": 0.3}
        ],
        "run": lambda p: run_plugin(handshake_cirq, noise_prob=p["noise"])
    },
    
    "network": {
        "name": "Entanglement Swapping Simulation",
        "description": "Simulate a quantum network using entanglement swapping.",
        "icon": "fa-network-wired",
        "category": "protocols",
        "parameters": [
            {"name": "noise", "type": "float", "default": 0.0, "description": "Noise probability",
             "min": 0.0, "max": 0.3}
        ],
        "run": lambda p: run_plugin(entanglement_swapping_cirq, noise_prob=p["noise"])
    },
    
    "qrng": {
        "name": "Quantum Random Number Generator",
        "description": "Generate a random number using quantum superposition.",
        "icon": "fa-dice",
        "category": "utilities",
        "parameters": [
            {"name": "num_bits", "type": "int", "default": 8, "description": "Number of bits",
             "min": 1, "max": 16}
        ],
        "run": lambda p: run_plugin(generate_random_number_cirq, num_bits=p["num_bits"])
    },
    
    "teleport": {
        "name": "Quantum Teleportation Simulation",
        "description": "Simulate quantum teleportation protocol.",
        "icon": "fa-atom",
        "category": "protocols",
        "parameters": [
            {"name": "noise", "type": "float", "default": 0.0, "description": "Noise probability",
             "min": 0.0, "max": 0.3}
        ],
        "run": lambda p: run_plugin(teleportation_circuit, noise_prob=p["noise"])
    },
    
    "vqe": {
        "name": "Variational Quantum Eigensolver (VQE)",
        "description": "Simulate VQE to find the ground state energy of a Hamiltonian.",
        "icon": "fa-wave-square",
        "category": "algorithms",
        "parameters": [
            {"name": "num_qubits", "type": "int", "default": 2, "description": "Number of qubits",
             "min": 1, "max": 6},
            {"name": "noise", "type": "float", "default": 0.01, "description": "Noise probability",
             "min": 0.0, "max": 0.3},
            {"name": "max_iter", "type": "int", "default": 5, "description": "Maximum iterations",
             "min": 1, "max": 20}
        ],
        "run": lambda p: run_plugin(run_vqe, num_qubits=p["num_qubits"], noise_prob=p["noise"], max_iter=p["max_iter"])
    },
    
    "quantum_decryption_grover": {
        "name": "Quantum Decryption via Grover Key Search",
        "description": "Use Grover's algorithm to search for a secret key.",
        "icon": "fa-unlock",
        "category": "cryptography",
        "parameters": [
            {"name": "key", "type": "int", "default": 5, "description": "Secret key (integer)",
             "min": 0, "max": 255},
            {"name": "num_bits", "type": "int", "default": 4, "description": "Number of bits (search space)",
             "min": 1, "max": 8},
            {"name": "noise", "type": "float", "default": 0.0, "description": "Noise probability",
             "min": 0.0, "max": 0.3}
        ],
        "run": lambda p: run_plugin(grover_key_search, key=p["key"], num_bits=p["num_bits"], noise_prob=p["noise"])
    },
    
    "quantum_decryption_shor": {
        "name": "Quantum Decryption via Shor Factorization",
        "description": "Simulate quantum decryption using Shor's code simulation.",
        "icon": "fa-key",
        "category": "cryptography",
        "parameters": [
            {"name": "N", "type": "int", "default": 15, "description": "Composite number",
             "min": 4, "max": 100}
        ],
        "run": lambda p: run_plugin(shor_factorization, N=p["N"])
    },
    
    "deutsch_jozsa": {
        "name": "Deutsch-Jozsa Algorithm",
        "description": "Determine if a function is constant or balanced with a single quantum query.",
        "icon": "fa-balance-scale",
        "category": "algorithms",
        "parameters": [
            {"name": "n_qubits", "type": "int", "default": 3, "description": "Number of input qubits",
             "min": 1, "max": 8},
            {"name": "oracle_type", "type": "str", "default": "random", "description": "Oracle type: constant_0, constant_1, balanced, or random",
             "options": ["constant_0", "constant_1", "balanced", "random"], "max_length": 10},
            {"name": "noise", "type": "float", "default": 0.0, "description": "Noise probability",
             "min": 0.0, "max": 0.3}
        ],
        "run": lambda p: run_plugin(deutsch_jozsa_cirq, n_qubits=p["n_qubits"], oracle_type=p["oracle_type"], noise_prob=p["noise"])
    },

    "qft": {
        "name": "Quantum Fourier Transform",
        "description": "Implement the quantum analogue of the discrete Fourier transform.",
        "icon": "fa-wave-square",
        "category": "algorithms",
        "parameters": [
            {"name": "n_qubits", "type": "int", "default": 3, "description": "Number of qubits",
             "min": 1, "max": 8}, 
            {"name": "input_state", "type": "str", "default": "010", "description": "Input state (binary)",
             "max_length": 8},
            {"name": "include_inverse", "type": "str", "default": "False", "description": "Include inverse QFT",
             "options": ["True", "False"], "max_length": 5},
            {"name": "noise", "type": "float", "default": 0.0, "description": "Noise probability",
             "min": 0.0, "max": 0.3}
        ],
        "run": lambda p: run_plugin(run_qft, n_qubits=p["n_qubits"], input_state=p["input_state"], 
                                    include_inverse=p["include_inverse"].lower() == "true", noise_prob=p["noise"])
    },

    "phase_estimation": {
        "name": "Quantum Phase Estimation",
        "description": "Estimate eigenvalues of unitary operators with applications in quantum computing.",
        "icon": "fa-ruler-combined",
        "category": "algorithms",
        "parameters": [
            {"name": "precision_bits", "type": "int", "default": 3, "description": "Number of bits of precision",
             "min": 1, "max": 6},
            {"name": "target_phase", "type": "float", "default": 0.125, "description": "Target phase to estimate (0-1)",
             "min": 0.0, "max": 1.0},
            {"name": "noise", "type": "float", "default": 0.0, "description": "Noise probability",
             "min": 0.0, "max": 0.3}
        ],
        "run": lambda p: run_plugin(run_phase_estimation, precision_bits=p["precision_bits"], 
                                    target_phase=p["target_phase"], noise_prob=p["noise"])
    },

    "qaoa": {
        "name": "Quantum Approximate Optimization Algorithm",
        "description": "Solve combinatorial optimization problems like MaxCut using a hybrid quantum-classical approach.",
        "icon": "fa-project-diagram",
        "category": "optimization",
        "parameters": [
            {"name": "n_nodes", "type": "int", "default": 4, "description": "Number of nodes in the graph",
             "min": 2, "max": 8},
            {"name": "edge_probability", "type": "float", "default": 0.5, "description": "Probability of edge creation",
             "min": 0.1, "max": 1.0},
            {"name": "p_layers", "type": "int", "default": 1, "description": "Number of QAOA layers",
             "min": 1, "max": 3},
            {"name": "noise", "type": "float", "default": 0.0, "description": "Noise probability",
             "min": 0.0, "max": 0.3},
            {"name": "num_samples", "type": "int", "default": 100, "description": "Number of samples",
             "min": 10, "max": 500}
        ],
        "run": lambda p: run_plugin(run_qaoa, n_nodes=p["n_nodes"], edge_probability=p["edge_probability"], 
                                    p_layers=p["p_layers"], noise_prob=p["noise"], num_samples=p["num_samples"])
    }
}

def get_educational_content_template(plugin_key):
    """
    Returns the appropriate template file name for the plugin's educational content
    """
    # Map plugin keys to their educational content template files
    templates = {
        'bb84': 'educational/bb84.html',
        'teleport': 'educational/teleport.html',
        'grover': 'educational/grover.html',
        'handshake': 'educational/handshake.html',
        'auth': 'educational/auth.html',
        'network': 'educational/network.html',
        'qrng': 'educational/qrng.html',
        'shor': 'educational/shor.html',
        'vqe': 'educational/vqe.html',
        'quantum_decryption_grover': 'educational/quantum_decryption_grover.html',
        'quantum_decryption_shor': 'educational/quantum_decryption_shor.html',
        'deutsch_jozsa': 'educational/deutsch_jozsa.html',
        'qft': 'educational/qft.html',
        'phase_estimation': 'educational/phase_estimation.html',
        'qaoa': 'educational/qaoa.html',
    }
    
    # Return the template name or a default if not found
    return templates.get(plugin_key, 'educational/default.html')

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
    
    educational_template = get_educational_content_template(plugin_key)

    if request.method == "POST":
        params = {}
        for param in plugin["parameters"]:
            raw_val = request.form.get(param["name"], param.get("default"))
            param_name = param["name"]
            
            # Validate and convert parameters with bounds checking
            if param["type"] == "int":
                try:
                    raw_val = int(raw_val)
                    # Check min/max bounds for integers
                    if "min" in param and raw_val < param["min"]:
                        return jsonify({"error": f"Value for {param_name} must be at least {param['min']}"})
                    if "max" in param and raw_val > param["max"]:
                        return jsonify({"error": f"Value for {param_name} cannot exceed {param['max']}"})
                except ValueError:
                    return jsonify({"error": f"Invalid integer value for {param_name}"})
            
            elif param["type"] == "float":
                try:
                    raw_val = float(raw_val)
                    # Check min/max bounds for floats
                    if "min" in param and raw_val < param["min"]:
                        return jsonify({"error": f"Value for {param_name} must be at least {param['min']}"})
                    if "max" in param and raw_val > param["max"]:
                        return jsonify({"error": f"Value for {param_name} cannot exceed {param['max']}"})
                except ValueError:
                    return jsonify({"error": f"Invalid float value for {param_name}"})
            
            elif param["type"] == "str":
                # Check max length for strings
                if "max_length" in param and len(raw_val) > param["max_length"]:
                    return jsonify({"error": f"Value for {param_name} cannot exceed {param['max_length']} characters"})
            
            params[param_name] = raw_val
        
        # Execute the plugin with the validated parameters
        result = plugin["run"](params)
        
        # If this is an AJAX request, return JSON
        if request.headers.get("X-Requested-With") == "XMLHttpRequest":
            return jsonify(result)
    
    return render_template("plugin.html", plugin=plugin, result=result, educational_template=educational_template)

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
    
    # Validate and convert parameters with bounds checking
    for param in plugin["parameters"]:
        param_name = param["name"]
        
        if param_name not in params and "default" in param:
            params[param_name] = param["default"]
        
        if param_name in params:
            if param["type"] == "int":
                try:
                    params[param_name] = int(params[param_name])
                    # Check min/max bounds for integers
                    if "min" in param and params[param_name] < param["min"]:
                        return jsonify({"error": f"Value for {param_name} must be at least {param['min']}"}), 400
                    if "max" in param and params[param_name] > param["max"]:
                        return jsonify({"error": f"Value for {param_name} cannot exceed {param['max']}"}), 400
                except (ValueError, TypeError):
                    return jsonify({"error": f"Invalid integer value for {param_name}"}), 400
            
            elif param["type"] == "float":
                try:
                    params[param_name] = float(params[param_name])
                    # Check min/max bounds for floats
                    if "min" in param and params[param_name] < param["min"]:
                        return jsonify({"error": f"Value for {param_name} must be at least {param['min']}"}), 400
                    if "max" in param and params[param_name] > param["max"]:
                        return jsonify({"error": f"Value for {param_name} cannot exceed {param['max']}"}), 400
                except (ValueError, TypeError):
                    return jsonify({"error": f"Invalid float value for {param_name}"}), 400
            
            elif param["type"] == "str" and "max_length" in param:
                # Check max length for strings
                if len(str(params[param_name])) > param["max_length"]:
                    return jsonify({"error": f"Value for {param_name} cannot exceed {param['max_length']} characters"}), 400
    
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
    port = int(os.environ.get("PORT", 5001))
    socketio.run(app, host="0.0.0.0", port=port)

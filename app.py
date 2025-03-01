### Web Application for Quantum Computing Simulations - easier to maintain than the GUI
import os
import json
import traceback
from flask import Flask, request, render_template, abort

# Import your simulation functions from your plugins.
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

app = Flask(__name__)

# --- Helper function to make objects JSON-safe ---

def json_safe(obj):
    """
    Recursively convert non-JSON-serializable objects to strings.
    """
    try:
        json.dumps(obj)
        return obj
    except TypeError:
        if isinstance(obj, dict):
            return {k: json_safe(v) for k, v in obj.items()}
        elif isinstance(obj, (list, tuple)):
            return [json_safe(item) for item in obj]
        else:
            return str(obj)

# --- Helper functions for wrapping plugin results ---

def wrap_result(sim_result):
    """
    Wrap the simulation result into a dict with keys:
      - output: the final result (converted to JSON-safe format)
      - process: the detailed log or process steps
      - error: None if no error, or the error message if an exception occurred.
    """
    if isinstance(sim_result, dict):
        if 'log' in sim_result:
            output = {k: v for k, v in sim_result.items() if k != 'log'}
            process = sim_result['log']
            output = json_safe(output)
            return {"output": output, "process": process, "error": None}
        else:
            return {"output": json_safe(sim_result), "process": "", "error": None}
    elif isinstance(sim_result, tuple):
        if len(sim_result) > 1:
            *outputs, log = sim_result
            output = outputs[0] if len(outputs) == 1 else outputs
            output = json_safe(output)
            return {"output": output, "process": log, "error": None}
        else:
            return {"output": json_safe(sim_result[0]), "process": "", "error": None}
    else:
        return {"output": json_safe(sim_result), "process": "", "error": None}

def run_plugin(sim_func, **params):
    """
    Calls the simulation function with the given parameters,
    then wraps its result. If an exception is raised, returns an error message.
    """
    try:
        sim_result = sim_func(**params)
        return wrap_result(sim_result)
    except Exception as e:
        traceback.print_exc()
        return {"output": None, "process": None, "error": f"{str(e)}\n{traceback.format_exc()}"}

# --- Updated PLUGINS mapping ---
PLUGINS = {
    "auth": {
        "name": "Quantum Authentication",
        "description": "Simulate quantum fingerprint authentication using Cirq.",
        "parameters": [
            {"name": "data", "type": "str", "default": "example_user", "description": "Data to authenticate"},
            {"name": "num_qubits", "type": "int", "default": 8, "description": "Number of qubits to use"}
        ],
        "run": lambda params: run_plugin(generate_quantum_fingerprint_cirq, data=params["data"], num_qubits=params["num_qubits"])
    },
    "bb84": {
        "name": "BB84 Protocol Simulation",
        "description": "Simulate the BB84 quantum key distribution protocol.",
        "parameters": [
            {"name": "num_bits", "type": "int", "default": 10, "description": "Number of bits to simulate"},
            {"name": "noise", "type": "float", "default": 0.0, "description": "Noise probability"}
        ],
        "run": lambda params: run_plugin(bb84_protocol_cirq, num_bits=params["num_bits"], noise_prob=params["noise"])
    },
    "shor": {
        "name": "Shor's Code Simulation",
        "description": "Simulate quantum error correction using Shor's code.",
        "parameters": [
            {"name": "noise", "type": "float", "default": 0.01, "description": "Noise probability"}
        ],
        "run": lambda params: run_plugin(run_shor_code, noise_prob=params["noise"])
    },
    "grover": {
        "name": "Grover's Algorithm Simulation",
        "description": "Simulate Grover's search algorithm.",
        "parameters": [
            {"name": "n", "type": "int", "default": 3, "description": "Number of qubits"},
            {"name": "target_state", "type": "str", "default": "101", "description": "Target state (binary)"},
            {"name": "noise", "type": "float", "default": 0.0, "description": "Noise probability"}
        ],
        "run": lambda params: run_plugin(run_grover, n=params["n"], target_state=params["target_state"], noise_prob=params["noise"])
    },
    "handshake": {
        "name": "Quantum Handshake Simulation",
        "description": "Simulate a quantum handshake using entangled Bell pairs.",
        "parameters": [
            {"name": "noise", "type": "float", "default": 0.0, "description": "Noise probability"}
        ],
        "run": lambda params: run_plugin(handshake_cirq, noise_prob=params["noise"])
    },
    "network": {
        "name": "Entanglement Swapping Simulation",
        "description": "Simulate a quantum network using entanglement swapping.",
        "parameters": [
            {"name": "noise", "type": "float", "default": 0.0, "description": "Noise probability"}
        ],
        "run": lambda params: run_plugin(entanglement_swapping_cirq, noise_prob=params["noise"])
    },
    "qrng": {
        "name": "Quantum Random Number Generator",
        "description": "Generate a random number using quantum superposition.",
        "parameters": [
            {"name": "num_bits", "type": "int", "default": 8, "description": "Number of bits"}
        ],
        "run": lambda params: run_plugin(generate_random_number_cirq, num_bits=params["num_bits"])
    },
    "teleport": {
        "name": "Quantum Teleportation Simulation",
        "description": "Simulate quantum teleportation protocol.",
        "parameters": [
            {"name": "noise", "type": "float", "default": 0.0, "description": "Noise probability"}
        ],
        "run": lambda params: run_plugin(teleportation_circuit, noise_prob=params["noise"])
    },
    "vqe": {
        "name": "Variational Quantum Eigensolver (VQE)",
        "description": "Simulate VQE to find the ground state energy of a Hamiltonian.",
        "parameters": [
            {"name": "num_qubits", "type": "int", "default": 2, "description": "Number of qubits"},
            {"name": "noise", "type": "float", "default": 0.01, "description": "Noise probability"},
            {"name": "max_iter", "type": "int", "default": 5, "description": "Maximum iterations"}
        ],
        "run": lambda params: run_plugin(run_vqe, num_qubits=params["num_qubits"], noise_prob=params["noise"], max_iter=params["max_iter"])
    },
    "quantum_decryption_grover": {
        "name": "Quantum Decryption via Grover Key Search",
        "description": "Use Grover's algorithm to search for a secret key.",
        "parameters": [
            {"name": "key", "type": "int", "default": 5, "description": "Secret key (integer)"},
            {"name": "num_bits", "type": "int", "default": 4, "description": "Number of bits (search space)"},
            {"name": "noise", "type": "float", "default": 0.0, "description": "Noise probability"}
        ],
        "run": lambda params: run_plugin(grover_key_search, key=params["key"], num_bits=params["num_bits"], noise_prob=params["noise"])
    },
    "quantum_decryption_shor": {
        "name": "Quantum Decryption via Shor Factorization",
        "description": "Simulate quantum decryption using Shor's code simulation.",
        "parameters": [
            {"name": "N", "type": "int", "default": 15, "description": "Composite number"}
        ],
        "run": lambda params: run_plugin(shor_factorization, N=params["N"])
    }
}

@app.route("/")
def index():
    return render_template("index.html", plugins=PLUGINS)

@app.route("/plugin/<plugin_key>", methods=["GET", "POST"])
def plugin_view(plugin_key):
    if plugin_key not in PLUGINS:
        abort(404)
    plugin = PLUGINS[plugin_key]
    result = None
    if request.method == "POST":
        params = {}
        for param in plugin["parameters"]:
            value = request.form.get(param["name"], param.get("default"))
            if param["type"] == "int":
                value = int(value)
            elif param["type"] == "float":
                value = float(value)
            params[param["name"]] = value
        result = plugin["run"](params)
    return render_template("plugin.html", plugin=plugin, result=result)

if __name__ == "__main__":
    app.run(debug=True)

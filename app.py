import os
from flask import Flask, request, render_template_string, abort

# Import your existing simulation functions from the plugins folder.
from plugins.authentication.auth import generate_quantum_fingerprint_cirq
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

# Define a mapping for each plugin that you wish to expose on the web.
# Each entry maps a unique key (used in the URL) to a dictionary containing:
#   - name: Display name
#   - description: Brief description
#   - parameters: A list of parameters (each a dict with name, type, default, and description)
#   - run: A lambda that accepts a params dict and calls the plugin's simulation function.
PLUGINS = {
    "auth": {
        "name": "Quantum Authentication",
        "description": "Simulate quantum fingerprint authentication using Cirq.",
        "parameters": [
            {"name": "data", "type": "str", "default": "example_user", "description": "Data to authenticate"},
            {"name": "num_qubits", "type": "int", "default": 8, "description": "Number of qubits to use"}
        ],
        "run": lambda params: generate_quantum_fingerprint_cirq(params["data"], num_qubits=params["num_qubits"])
    },
    "bb84": {
        "name": "BB84 Protocol Simulation",
        "description": "Simulate the BB84 quantum key distribution protocol.",
        "parameters": [
            {"name": "num_bits", "type": "int", "default": 10, "description": "Number of bits to simulate"},
            {"name": "noise", "type": "float", "default": 0.0, "description": "Noise probability"}
        ],
        "run": lambda params: bb84_protocol_cirq(params["num_bits"], noise_prob=params["noise"])
    },
    "shor": {
        "name": "Shor's Code Simulation",
        "description": "Simulate quantum error correction using Shor's code.",
        "parameters": [
            {"name": "noise", "type": "float", "default": 0.01, "description": "Noise probability"}
        ],
        "run": lambda params: run_shor_code(noise_prob=params["noise"])
    },
    "grover": {
        "name": "Grover's Algorithm Simulation",
        "description": "Simulate Grover's search algorithm.",
        "parameters": [
            {"name": "n", "type": "int", "default": 3, "description": "Number of qubits"},
            {"name": "target_state", "type": "str", "default": "101", "description": "Target state (binary)"},
            {"name": "noise", "type": "float", "default": 0.0, "description": "Noise probability"}
        ],
        "run": lambda params: run_grover(params["n"], params["target_state"], noise_prob=params["noise"])
    },
    "handshake": {
        "name": "Quantum Handshake Simulation",
        "description": "Simulate a quantum handshake using entangled Bell pairs.",
        "parameters": [
            {"name": "noise", "type": "float", "default": 0.0, "description": "Noise probability"}
        ],
        "run": lambda params: handshake_cirq(noise_prob=params["noise"])
    },
    "network": {
        "name": "Entanglement Swapping Simulation",
        "description": "Simulate a quantum network using entanglement swapping.",
        "parameters": [
            {"name": "noise", "type": "float", "default": 0.0, "description": "Noise probability"}
        ],
        "run": lambda params: entanglement_swapping_cirq(noise_prob=params["noise"])
    },
    "qrng": {
        "name": "Quantum Random Number Generator",
        "description": "Generate a random number using quantum superposition.",
        "parameters": [
            {"name": "num_bits", "type": "int", "default": 8, "description": "Number of bits"}
        ],
        "run": lambda params: generate_random_number_cirq(params["num_bits"])
    },
    "teleport": {
        "name": "Quantum Teleportation Simulation",
        "description": "Simulate quantum teleportation protocol.",
        "parameters": [
            {"name": "noise", "type": "float", "default": 0.0, "description": "Noise probability"}
        ],
        "run": lambda params: teleportation_circuit(noise_prob=params["noise"])
    },
    "vqe": {
        "name": "Variational Quantum Eigensolver (VQE)",
        "description": "Simulate VQE to find the ground state energy of a Hamiltonian.",
        "parameters": [
            {"name": "num_qubits", "type": "int", "default": 2, "description": "Number of qubits"},
            {"name": "noise", "type": "float", "default": 0.01, "description": "Noise probability"},
            {"name": "max_iter", "type": "int", "default": 5, "description": "Maximum iterations"}
        ],
        "run": lambda params: run_vqe(num_qubits=params["num_qubits"], noise_prob=params["noise"], max_iter=params["max_iter"])
    },
    "quantum_decryption_grover": {
        "name": "Quantum Decryption via Grover Key Search",
        "description": "Use Grover's algorithm to search for a secret key.",
        "parameters": [
            {"name": "key", "type": "int", "default": 5, "description": "Secret key (integer)"},
            {"name": "num_bits", "type": "int", "default": 4, "description": "Number of bits (search space)"},
            {"name": "noise", "type": "float", "default": 0.0, "description": "Noise probability"}
        ],
        "run": lambda params: grover_key_search(params["key"], params["num_bits"], noise_prob=params["noise"])
    },
    "quantum_decryption_shor": {
        "name": "Quantum Decryption via Shor Factorization",
        "description": "Simulate quantum decryption using Shor's code simulation.",
        "parameters": [
            {"name": "N", "type": "int", "default": 15, "description": "Composite number"}
        ],
        "run": lambda params: shor_factorization(params["N"])
    }
}

# Inline HTML templates (to keep additional files minimal)
INDEX_TEMPLATE = """
<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Quantum Field Kit Plugins</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; }
      h1 { color: #004080; }
      a { text-decoration: none; color: #0066cc; }
      a:hover { text-decoration: underline; }
    </style>
  </head>
  <body>
    <h1>Available Plugins</h1>
    <ul>
      {% for key, plugin in plugins.items() %}
        <li>
          <a href="/plugin/{{ key }}">{{ plugin.name }}</a> – {{ plugin.description }}
        </li>
      {% endfor %}
    </ul>
  </body>
</html>
"""

PLUGIN_TEMPLATE = """
<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>{{ plugin.name }}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; }
      h1 { color: #004080; }
      form div { margin-bottom: 10px; }
      label { display: inline-block; width: 150px; }
      input[type="text"] { padding: 5px; width: 200px; }
      button { padding: 8px 12px; background-color: #004080; color: #fff; border: none; cursor: pointer; }
      button:hover { background-color: #003060; }
      pre { background: #f4f4f4; padding: 10px; border: 1px solid #ddd; }
    </style>
  </head>
  <body>
    <h1>{{ plugin.name }}</h1>
    <p>{{ plugin.description }}</p>
    <form method="post">
      {% for param in plugin.parameters %}
        <div>
          <label for="{{ param.name }}">{{ param.name }} ({{ param.type }}):</label>
          <input type="text" name="{{ param.name }}" id="{{ param.name }}" value="{{ param.default }}">
        </div>
      {% endfor %}
      <button type="submit">Run Plugin</button>
    </form>
    {% if result is defined %}
      <h2>Result</h2>
      <pre>{{ result }}</pre>
    {% endif %}
    <p><a href="/">Back to Plugins</a></p>
  </body>
</html>
"""

@app.route("/")
def index():
    return render_template_string(INDEX_TEMPLATE, plugins=PLUGINS)

@app.route("/plugin/<plugin_key>", methods=["GET", "POST"])
def plugin_view(plugin_key):
    if plugin_key not in PLUGINS:
        abort(404)
    plugin = PLUGINS[plugin_key]
    result = None
    if request.method == "POST":
        params = {}
        # Process each expected parameter.
        for param in plugin["parameters"]:
            value = request.form.get(param["name"], param.get("default"))
            # Convert to proper type.
            if param["type"] == "int":
                value = int(value)
            elif param["type"] == "float":
                value = float(value)
            # For strings, no conversion needed.
            params[param["name"]] = value
        # Run the plugin's simulation.
        result = plugin["run"](params)
    return render_template_string(PLUGIN_TEMPLATE, plugin=plugin, result=result)

if __name__ == "__main__":
    # Run the web app (debug=True for development)
    app.run(debug=True)
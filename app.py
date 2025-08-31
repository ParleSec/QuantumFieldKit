import os
import traceback
import json
import logging
from flask import Flask, request, render_template, jsonify, session, abort, send_from_directory
from flask_socketio import SocketIO, emit
from werkzeug.middleware.proxy_fix import ProxyFix
import signal
from functools import wraps
#import threading
#import multiprocessing
import concurrent.futures
from datetime import datetime
import psutil
import re
from flask_cors import CORS

# Import simulation functions from plugins
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
from plugins.deutsch_jozsa.deutsch_jozsa import deutsch_jozsa_cirq
from plugins.quantum_fourier.qft import run_qft
from plugins.phase_estimation.phase_estimation import run_phase_estimation
from plugins.optimization.qaoa import run_qaoa

# Configure Errors
class SimulationError(Exception):
    """Base class for simulation errors"""
    def __init__(self, message, param_info=None, suggestion=None):
        self.message = message
        self.param_info = param_info
        self.suggestion = suggestion
        super().__init__(self.message)

class ParameterError(SimulationError):
    """Error for invalid simulation parameters"""
    pass

class QuantumCircuitError(SimulationError):
    """Error in quantum circuit construction or execution"""
    pass

class ResourceExceededError(SimulationError):
    """Error when simulation exceeds available resources"""
    pass



def configure_logging():
    # Create logs directory if it doesn't exist
    if not os.path.exists('logs'):
        os.makedirs('logs')
        
    # Create log file with date-based naming
    log_filename = f"logs/quantum_field_kit_{datetime.now().strftime('%Y-%m-%d')}.log"
    
    # Configure root logger
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
        handlers=[
            # Console handler for immediate feedback
            logging.StreamHandler(),
            # File handler for persistent logs
            logging.FileHandler(log_filename)
        ]
    )
    
    # Set specific logger levels
    logging.getLogger('werkzeug').setLevel(logging.WARNING)
    logging.getLogger('socketio').setLevel(logging.WARNING)
    
    return logging.getLogger('quantum_field_kit')

# Create application logger
logger = configure_logging()

# Initialize Flask application (serve React build in production)
app = Flask(__name__, static_folder='frontend/build', static_url_path='/')
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5000", "http://127.0.0.1:5000"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})
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
            plugin_name = kwargs.get('_plugin_name', 'Unknown plugin')
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(func, *args, **kwargs)
                try:
                    return future.result(timeout=seconds)
                except concurrent.futures.TimeoutError:
                    # More detailed timeout message
                    return {
                        "output": None, 
                        "log": f"Simulation for {plugin_name} started but could not complete within {seconds} seconds.\n"
                               f"This may be due to complex parameters or high precision settings.",
                        "error": f"Execution timed out after {seconds} seconds. Try reducing complexity of the simulation."
                    }
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

def check_memory_usage():
    """Check if memory usage is within acceptable limits"""
    try:
        process = psutil.Process(os.getpid())
        memory_usage = process.memory_info().rss / (1024 * 1024) # MB
        memory_percent = process.memory_percent()
        
        if memory_percent > 85:
            logger.warning(f"High memory usage detected: {memory_usage:.2f} MB ({memory_percent:.1f}%)")
            return False
        
        return True
    except Exception as e:
        logger.error(f"Error checking memory usage: {e}")
        return True  # Assume it's safe if we can't check

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
    Returns a standardized result dictionary with improved error handling.
    """
    # Check memory before running simulation
    if not check_memory_usage():
        return {
            "output": None,
            "log": "Server is currently experiencing high memory usage. Please try again later.",
            "error": "Insufficient memory available for simulation. Try reducing simulation complexity."
        }
    
    try:
        # Extract plugin key for error reporting but don't pass it to the simulation function
        plugin_key = params.pop('_plugin_key', 'unknown_plugin')
        
        # Also remove _plugin_name if it exists (backward compatibility)
        params.pop('_plugin_name', None)
        
        logger.info(f"Running {plugin_key} simulation with parameters: {params}")
        
        # Apply timeout to simulation function
        @timeout(15)  # Increased timeout for complex simulations
        def run_with_timeout():
            # Don't pass plugin identifiers to the actual simulation function
            return sim_func(**params)
        
        sim_result = run_with_timeout()
        if isinstance(sim_result, dict) and "error" in sim_result and sim_result["error"] is not None:
            # This is a timeout error from our decorator
            return sim_result
        
        return wrap_result(sim_result)
    except ParameterError as e:
        # Handle parameter errors with helpful suggestions
        error_msg = f"Parameter error: {e.message}"
        if e.param_info:
            error_msg += f"\nParameter: {e.param_info}"
        if e.suggestion:
            error_msg += f"\nSuggestion: {e.suggestion}"
        
        logger.error(f"Parameter error in {plugin_key}: {error_msg}")
        return {"output": None, "log": None, "error": error_msg}
    except QuantumCircuitError as e:
        # Handle quantum circuit specific errors
        error_msg = f"Quantum circuit error: {e.message}"
        if e.suggestion:
            error_msg += f"\nSuggestion: {e.suggestion}"
        
        logger.error(f"Circuit error in {plugin_key}: {error_msg}")
        return {"output": None, "log": None, "error": error_msg}
    except Exception as e:
        # Generic exception handling with improved context
        error_type = type(e).__name__
        error_msg = str(e)
        stack_trace = traceback.format_exc()
        
        # Create a user-friendly error message
        user_error = f"Error ({error_type}): {error_msg}"
        
        # Log the full technical details
        logger.error(f"Simulation error in {plugin_key}: {error_type} - {error_msg}\n{stack_trace}")
        
        return {
            "output": None, 
            "log": f"Simulation failed. See error tab for details.",
            "error": user_error
        }
    
def validate_parameters(plugin, params):
    """Enhanced parameter validation with detailed error messages"""
    validated_params = {}
    
    for param in plugin["parameters"]:
        param_name = param["name"]
        
        # Check if required parameter is missing
        if param_name not in params and "default" not in param:
            raise ParameterError(
                f"Missing required parameter: {param_name}",
                param_info=f"{param_name} ({param['type']})",
                suggestion="Please provide a value for this required parameter."
            )
        
        # Use default if parameter is missing
        if param_name not in params and "default" in param:
            validated_params[param_name] = param["default"]
            continue
            
        # Validate parameter based on type
        raw_val = params[param_name]
        
        if param["type"] == "int":
            try:
                val = int(raw_val)
                # Check min/max bounds
                if "min" in param and val < param["min"]:
                    raise ParameterError(
                        f"Value for {param_name} is too small",
                        param_info=f"{param_name} = {val}",
                        suggestion=f"Minimum allowed value is {param['min']}."
                    )
                if "max" in param and val > param["max"]:
                    raise ParameterError(
                        f"Value for {param_name} is too large",
                        param_info=f"{param_name} = {val}",
                        suggestion=f"Maximum allowed value is {param['max']}."
                    )
                validated_params[param_name] = val
            except ValueError:
                raise ParameterError(
                    f"Invalid integer value for {param_name}",
                    param_info=f"Received: {raw_val}",
                    suggestion="Please provide a valid integer value."
                )
                
        elif param["type"] == "float":
            try:
                val = float(raw_val)
                # Check min/max bounds
                if "min" in param and val < param["min"]:
                    raise ParameterError(
                        f"Value for {param_name} is too small",
                        param_info=f"{param_name} = {val}",
                        suggestion=f"Minimum allowed value is {param['min']}."
                    )
                if "max" in param and val > param["max"]:
                    raise ParameterError(
                        f"Value for {param_name} is too large",
                        param_info=f"{param_name} = {val}",
                        suggestion=f"Maximum allowed value is {param['max']}."
                    )
                validated_params[param_name] = val
            except ValueError:
                raise ParameterError(
                    f"Invalid float value for {param_name}",
                    param_info=f"Received: {raw_val}",
                    suggestion="Please provide a valid decimal number."
                )
                
        elif param["type"] == "bool":
            if isinstance(raw_val, bool):
                validated_params[param_name] = raw_val
            elif isinstance(raw_val, str):
                validated_params[param_name] = raw_val.lower() == "true"
            else:
                raise ParameterError(
                    f"Invalid boolean value for {param_name}",
                    param_info=f"Received: {raw_val}",
                    suggestion="Please provide 'true' or 'false'."
                )
                
        elif param["type"] == "str":
            if not isinstance(raw_val, str):
                raw_val = str(raw_val)
                
            # Check max length for strings
            if "max_length" in param and len(raw_val) > param["max_length"]:
                raise ParameterError(
                    f"Value for {param_name} is too long",
                    param_info=f"Length: {len(raw_val)} characters",
                    suggestion=f"Maximum allowed length is {param['max_length']} characters."
                )
                
            # Check if value is in allowed options
            if "options" in param and raw_val not in param["options"]:
                raise ParameterError(
                    f"Invalid option for {param_name}",
                    param_info=f"Received: {raw_val}",
                    suggestion=f"Allowed options are: {', '.join(param['options'])}"
                )
                
            validated_params[param_name] = raw_val
        
        elif param["type"] == "select":
            if "options" in param and raw_val not in param["options"]:
                raise ParameterError(
                    f"Invalid selection for {param_name}",
                    param_info=f"Received: {raw_val}",
                    suggestion=f"Please select one of: {', '.join(param['options'])}"
                )
            validated_params[param_name] = raw_val
            
        else:
            # For unrecognized types, just pass through the value
            validated_params[param_name] = raw_val
            
    return validated_params


# --- Plugin Registry ---
# Define all available quantum simulation plugins
PLUGINS = {
    'auth': {
        'name': 'Post-Quantum Authentication',
        'description': 'Simulate a lattice-based authentication system that remains secure against quantum computer attacks, based on the Ring-LWE problem.',
        'icon': 'fa-lock',
        'category': 'security',
        'parameters': [
            {'name': 'username', 'type': 'str', 'default': 'Bob', 'description': 'Username for authentication'},
            {'name': 'noise', 'type': 'float', 'default': 0.0, 'description': 'Noise level (0.0 - 0.2)',"min": 0, "max": 0.2},
            {'name': 'dimension', 'type': 'int', 'default': 4, 'description': 'Lattice dimension parameter',"min": 1, "max": 32}
        ],
        'function': generate_quantum_fingerprint_cirq,
        # Standardized runner to match other plugins and Socket.IO flow
        'run': lambda p: run_plugin(
            generate_quantum_fingerprint_cirq,
            _plugin_key="auth",
            data=p.get("username", "Bob"),
            num_qubits=p.get("dimension", 4)
        )
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
                                _plugin_key="bb84",
                                num_bits=p["num_bits"],
                                distance_km=p["distance_km"],
                                hardware_type=p["hardware_type"],
                                eve_present=p["eve_present"] if isinstance(p["eve_present"], bool) else p["eve_present"].lower() == "true",
                                eve_strategy=p["eve_strategy"],
                                detailed_simulation=p["detailed_simulation"] if isinstance(p["detailed_simulation"], bool) else p["detailed_simulation"].lower() == "true",
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
        "run": lambda p: run_plugin(run_shor_code, _plugin_key="shor", noise_prob=p["noise"])
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
        "run": lambda p: run_plugin(run_grover, _plugin_key="grover", n=p["n"], target_state=p["target_state"], noise_prob=p["noise"])
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
        "run": lambda p: run_plugin(handshake_cirq, _plugin_key="handshake", noise_prob=p["noise"])
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
        "run": lambda p: run_plugin(entanglement_swapping_cirq, _plugin_key="network", noise_prob=p["noise"])
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
        "run": lambda p: run_plugin(generate_random_number_cirq, _plugin_key="qrng", num_bits=p["num_bits"])
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
        "run": lambda p: run_plugin(teleportation_circuit, _plugin_key="teleport", noise_prob=p["noise"])
    },
    
    "vqe": {
        "name": "Variational Quantum Eigensolver (VQE)",
        "description": "Simulate VQE to find the ground state energy of a hydrogen molecule with quantum chemical accuracy.",
        "icon": "fa-wave-square",
        "category": "algorithms",
        "parameters": [
            {"name": "num_qubits", "type": "int", "default": 2, "description": "Number of qubits",
            "min": 2, "max": 4},
            {"name": "noise_prob", "type": "float", "default": 0.01, "description": "Noise probability",
            "min": 0.0, "max": 0.3},
            {"name": "max_iter", "type": "int", "default": 3, "description": "Maximum iterations",
            "min": 1, "max": 5},
            {"name": "bond_distance", "type": "float", "default": 0.7414, "description": "H-H bond distance (Å)",
            "min": 0.0, "max": 2.5}
        ],
        "run": lambda p: run_plugin(run_vqe, 
                                _plugin_key="vqe", 
                                num_qubits=p["num_qubits"], 
                                noise_prob=p["noise_prob"], 
                                max_iter=p["max_iter"],
                                bond_distance=p["bond_distance"])
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
        "run": lambda p: run_plugin(grover_key_search, _plugin_key="quantum_decryption_grover", key=p["key"], num_bits=p["num_bits"], noise_prob=p["noise"])
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
        "run": lambda p: run_plugin(shor_factorization, _plugin_key="quantum_decryption_shor", N=p["N"])
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
        "run": lambda p: run_plugin(deutsch_jozsa_cirq, _plugin_key="deutsch_jozsa", n_qubits=p["n_qubits"], oracle_type=p["oracle_type"], noise_prob=p["noise"])
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
        "run": lambda p: run_plugin(run_qft, _plugin_key="qft", n_qubits=p["n_qubits"], input_state=p["input_state"], 
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
        "run": lambda p: run_plugin(run_phase_estimation, _plugin_key="phase_estimation", precision_bits=p["precision_bits"], 
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
        "run": lambda p: run_plugin(run_qaoa, _plugin_key="qaoa", n_nodes=p["n_nodes"], edge_probability=p["edge_probability"], 
                                    p_layers=p["p_layers"], noise_prob=p["noise"], num_samples=p["num_samples"])
    }
}

def get_template_path(plugin_key):
    """
    Returns the appropriate template file path for the plugin's educational content.
    This function only returns the path, it doesn't extract content.
    """
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
        'quantum_decryption_grover': 'educational/grover.html',
        'quantum_decryption_shor': 'educational/shor.html',
        'deutsch_jozsa': 'educational/deutsch_jozsa.html',
        'qft': 'educational/qft.html',
        'phase_estimation': 'educational/phase_estimation.html',
        'qaoa': 'educational/qaoa.html',
    }
    
    # Return the template path or a default
    template_name = templates.get(plugin_key, 'educational/default.html')
    return os.path.join('templates', template_name)

def extract_educational_content(template_path):
    """
    Extracts the full educational content from a template file.
    Looks for content between <!-- EDUCATIONAL-CONTENT BEGIN --> and <!-- EDUCATIONAL-CONTENT END -->
    """
    try:
        if not os.path.exists(template_path):
            logger.warning(f"Template file not found: {template_path}")
            return None
            
        with open(template_path, 'r') as f:
            content = f.read()
            
        # Use regex to extract content between markers
        content_pattern = re.compile(r'<!-- EDUCATIONAL-CONTENT BEGIN -->(.*?)<!-- EDUCATIONAL-CONTENT END -->', 
                                    re.DOTALL)
        match = content_pattern.search(content)
        
        if match:
            return match.group(1).strip()
        else:
            logger.warning(f"Educational content markers not found in {template_path}")
            return None
            
    except Exception as e:
        logger.error(f"Error extracting educational content: {e}")
        return None

def extract_mini_explanation(template_path):
    """
    Extracts mini explanation from a template file.
    """
    try:
        if not os.path.exists(template_path):
            logger.warning(f"Template file not found: {template_path}")
            return None
            
        with open(template_path, 'r') as f:
            content = f.read()
        
        # Try all possible marker formats
        marker_patterns = [
            r'<!-- MINI_EXPLANATION_START -->(.*?)<!-- MINI_EXPLANATION_END -->'
        ]
        
        for pattern in marker_patterns:
            mini_pattern = re.compile(pattern, re.DOTALL)
            match = mini_pattern.search(content)
            
            if match:
                logger.info(f"Found mini explanation using pattern: {pattern}")
                return match.group(1).strip()
        
        logger.warning(f"No mini explanation markers found in {template_path}")
        return None
    except Exception as e:
        logger.error(f"Error extracting mini explanation: {e}")
        return None

def get_mini_explanation(plugin_key):
    """
    Gets the mini explanation for a plugin, either from its template file
    or returns a default explanation based on the plugin info.
    """
    # Get the template path
    template_path = get_template_path(plugin_key)
    
    # Try to extract from template file
    mini_content = extract_mini_explanation(template_path)
    
    if mini_content:
        return mini_content
        
    # If no template or no mini section, generate default mini explanation
    plugin = PLUGINS.get(plugin_key, {})
    plugin_name = plugin.get('name', plugin_key.replace('_', ' ').title())
    
    return f"""
    <h5 class="fw-bold">{plugin_name}</h5>
    <p>This simulation demonstrates key quantum computing concepts including superposition, entanglement, and measurement.</p>
    <div class="alert alert-primary">
        <strong>Key Quantum Concept:</strong> Quantum simulations provide insight into quantum behavior without requiring actual quantum hardware.
    </div>
    """

def get_educational_content(plugin_key):
    """
    Gets the educational content for a plugin's modal.
    """
    template_path = get_template_path(plugin_key)
    print(f"Template path: {template_path}")
    return extract_educational_content(template_path)

# --- Route handlers ---
@app.route("/")
def index():
    # Serve React index.html
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/sitemap.xml')
def sitemap():
    """Generate the sitemap.xml file dynamically."""
    # Get base URL from request or use production URL
    if app.config.get('ENV') == 'production':
        base_url = "https://quantumfieldkit.com"
    else:
        base_url = request.url_root.rstrip('/')
    
    # Current date for lastmod
    import datetime
    today = datetime.date.today().isoformat()
    
    # Build the sitemap XML string
    xml = ['<?xml version="1.0" encoding="UTF-8"?>',
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
           '  <url>',
           f'    <loc>{base_url}/</loc>',
           f'    <lastmod>{today}</lastmod>',
           '    <changefreq>weekly</changefreq>',
           '    <priority>1.0</priority>',
           '  </url>']
    
     # Add glossary page
    xml.append('  <url>')
    xml.append(f'    <loc>{base_url}/glossary</loc>')
    xml.append(f'    <lastmod>{today}</lastmod>')
    xml.append('    <changefreq>monthly</changefreq>')
    xml.append('    <priority>0.8</priority>')
    xml.append('  </url>')
    
    
    # Add all plugin pages with categorization
    for plugin_key, plugin in PLUGINS.items():
        # Group plugins by category for better SEO
        category = plugin.get("category", "other")
        xml.append('  <url>')
        xml.append(f'    <loc>{base_url}/plugin/{plugin_key}</loc>')
        xml.append(f'    <lastmod>{today}</lastmod>')
        xml.append('    <changefreq>monthly</changefreq>')
        xml.append('    <priority>0.8</priority>')
        xml.append('  </url>')
    
    # Add category pages if you implement them
    categories = set(plugin.get("category", "other") for plugin in PLUGINS.values())
    for category in categories:
        xml.append('  <url>')
        xml.append(f'    <loc>{base_url}/category/{category}</loc>')
        xml.append(f'    <lastmod>{today}</lastmod>')
        xml.append('    <changefreq>monthly</changefreq>')
        xml.append('    <priority>0.7</priority>')
        xml.append('  </url>')
    
    xml.append('</urlset>')
    
    return app.response_class(
        response='\n'.join(xml),
        status=200,
        mimetype='application/xml'
    )

@app.route("/sitemap")
def html_sitemap():
    # Serve SPA index for HTML sitemap requests
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/robots.txt')
def robots():
    """Serve robots.txt dynamically."""
    if app.config.get('ENV') == 'production':
        base_url = "https://quantumfieldkit.com"
    else:
        base_url = request.url_root.rstrip('/')
    
    robots_txt = f"""User-agent: *
Allow: /

Sitemap: {base_url}/sitemap.xml
"""
    return app.response_class(
        response=robots_txt,
        status=200,
        mimetype='text/plain'
    )

@app.route("/category/<category>")
def category_view(category):
    return send_from_directory(app.static_folder, 'index.html')

@app.route("/glossary")
def glossary():
    return send_from_directory(app.static_folder, 'index.html')

@app.after_request
def add_cache_headers(response):
    """Add cache headers to responses to improve performance."""
    import datetime
    # Don't cache dynamic content
    if request.path.startswith('/static/'):
        # Cache static files for 1 week
        expiry = datetime.datetime.now() + datetime.timedelta(days=7)
        response.headers['Cache-Control'] = 'public, max-age=604800'
        response.headers['Expires'] = expiry.strftime("%a, %d %b %Y %H:%M:%S GMT")
    else:
        # Don't cache dynamic content
        response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    
    return response

@app.route("/plugin/<plugin_key>", methods=["GET", "POST"])
def plugin_view(plugin_key):
    if request.method == 'POST':
        # Support legacy AJAX POSTs from static JS (if any)
        if plugin_key not in PLUGINS:
            return jsonify({"error": "Plugin not found"}), 404
        plugin = PLUGINS[plugin_key]
        try:
            raw_params = {}
            for param in plugin.get('parameters', []):
                param_name = param['name']
                if param_name in request.form:
                    raw_params[param_name] = request.form.get(param_name)
            params = validate_parameters(plugin, raw_params)
            if 'run' not in plugin:
                return jsonify({"error": "Plugin runner not defined"}), 500
            result = plugin['run'](params)
            return jsonify(result)
        except Exception as e:
            return jsonify({"error": str(e)}), 400
    # GET falls back to React
    return send_from_directory(app.static_folder, 'index.html')

@app.route("/api/plugins", methods=["GET"])
def api_plugins():
    """Return a list of available plugins."""
    categories = {}
    for key, plugin in PLUGINS.items():
        category = plugin.get("category", "other")
        if category not in categories:
            categories[category] = []
        # Only include serializable data
        serializable_plugin = {
            "key": key,
            "name": plugin.get("name"),
            "description": plugin.get("description"),
            "icon": plugin.get("icon"),
            "category": plugin.get("category"),
            "parameters": plugin.get("parameters", [])
        }
        categories[category].append(serializable_plugin)
    return jsonify(categories)

@app.route("/api/plugin/<plugin_key>", methods=["GET"])
def api_plugin(plugin_key):
    """Return details for a specific plugin."""
    if plugin_key not in PLUGINS:
        return jsonify({"error": "Plugin not found"}), 404
    
    plugin = PLUGINS[plugin_key]
    # Only include serializable data
    serializable_plugin = {
        "key": plugin_key,
        "name": plugin.get("name"),
        "description": plugin.get("description"),
        "icon": plugin.get("icon"),
        "category": plugin.get("category"),
        "parameters": plugin.get("parameters", [])
    }
    return jsonify(serializable_plugin)

@app.route("/api/run/<plugin_key>", methods=["POST"])
def api_run_plugin(plugin_key):
    """Run a plugin simulation."""
    if plugin_key not in PLUGINS:
        return jsonify({"error": "Plugin not found"}), 404
    try:
        params = request.get_json()
        plugin = PLUGINS[plugin_key]
        if 'run' in plugin and callable(plugin['run']):
            # Use standardized runner which already wraps results
            result = plugin['run'](params or {})
        elif 'function' in plugin and callable(plugin['function']):
            # Fallback for legacy plugins
            result = run_plugin(plugin['function'], _plugin_key=plugin_key, **(params or {}))
        else:
            return jsonify({"error": "Plugin is misconfigured"}), 500
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/api/glossary", methods=["GET"])
def api_glossary():
    """Return glossary terms."""
    # Prefer glossary shipped with the built SPA, then public, then repo static fallback
    candidates = [
        os.path.join(os.path.dirname(__file__), 'frontend', 'build', 'data', 'glossary_terms.json'),
        os.path.join(os.path.dirname(__file__), 'frontend', 'public', 'data', 'glossary_terms.json'),
        os.path.join(os.path.dirname(__file__), 'static', 'data', 'glossary_terms.json'),
    ]
    terms_file = next((p for p in candidates if os.path.exists(p)), None)
    try:
        with open(terms_file, 'r') as f:
            terms = json.load(f)
        return jsonify(terms)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        app.logger.error(f"Error loading glossary terms: {e}")
        return jsonify([{"term": "Qubit", "definition": "The fundamental unit of quantum information."},
                       {"term": "Superposition", "definition": "A quantum property allowing particles to exist in multiple states."}])

@app.route("/api/category/<category>", methods=["GET"])
def api_category(category):
    """Return plugins in a specific category."""
    plugins_in_category = {k: v for k, v in PLUGINS.items() if v.get("category", "other") == category}
    if not plugins_in_category:
        return jsonify({"error": "Category not found"}), 404
    return jsonify(plugins_in_category)

@app.route("/api/educational/<plugin_key>", methods=["GET"])
def api_educational(plugin_key):
    """Return educational content for a specific plugin."""
    if plugin_key not in PLUGINS:
        return jsonify({"error": "Plugin not found"}), 404
    
    try:
        # Get the template path for the plugin
        template_path = get_template_path(plugin_key)
        
        # Extract educational content
        content = extract_educational_content(template_path)
        
        if content:
            return jsonify({"content": content})
        else:
            return jsonify({"error": "Educational content not found"}), 404
            
    except Exception as e:
        logger.error(f"Error loading educational content: {e}")
        return jsonify({"error": "Failed to load educational content"}), 500

@app.route("/api/validate/<plugin_key>", methods=["POST", "OPTIONS"])
def api_validate(plugin_key):
    """Validate parameters for a specific plugin."""
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200
        
    if plugin_key not in PLUGINS:
        return jsonify({"error": "Plugin not found"}), 404
        
    try:
        params = request.get_json()
        plugin = PLUGINS[plugin_key]
        validated_params = validate_parameters(plugin, params)
        return jsonify({"status": "valid", "params": validated_params})
    except ParameterError as e:
        return jsonify({
            "status": "invalid",
            "error": e.message,
            "param_info": e.param_info,
            "suggestion": e.suggestion
        }), 400
    except Exception as e:
        return jsonify({"status": "error", "error": str(e)}), 500

@app.route("/circuit")
def circuit_designer():
    # SPA route
    return send_from_directory(app.static_folder, 'index.html')

# API routes for Circuit Designer

@app.route("/api/circuit/gates", methods=["GET"])
def api_circuit_gates():
    """Get available quantum gates for the circuit designer"""
    try:
        # Basic set of gates organized by categories
        gates = {
            "single_qubit": [
                {"id": "x", "name": "X", "description": "Pauli-X gate (NOT gate)", "symbol": "X"},
                {"id": "y", "name": "Y", "description": "Pauli-Y gate", "symbol": "Y"},
                {"id": "z", "name": "Z", "description": "Pauli-Z gate", "symbol": "Z"},
                {"id": "h", "name": "H", "description": "Hadamard gate", "symbol": "H"},
                {"id": "s", "name": "S", "description": "Phase gate (S)", "symbol": "S"},
                {"id": "t", "name": "T", "description": "π/8 gate (T)", "symbol": "T"},
                {"id": "rx", "name": "RX", "description": "Rotation around X-axis", "symbol": "RX", "params": [{"name": "theta", "default": "π/2"}]},
                {"id": "ry", "name": "RY", "description": "Rotation around Y-axis", "symbol": "RY", "params": [{"name": "theta", "default": "π/2"}]},
                {"id": "rz", "name": "RZ", "description": "Rotation around Z-axis", "symbol": "RZ", "params": [{"name": "theta", "default": "π/2"}]}
            ],
            "multi_qubit": [
                {"id": "cnot", "name": "CNOT", "description": "Controlled-NOT gate", "symbol": "CNOT", "qubits": 2},
                {"id": "cz", "name": "CZ", "description": "Controlled-Z gate", "symbol": "CZ", "qubits": 2},
                {"id": "swap", "name": "SWAP", "description": "SWAP gate", "symbol": "SWAP", "qubits": 2},
                {"id": "ccx", "name": "Toffoli", "description": "Toffoli gate (CCX)", "symbol": "CCX", "qubits": 3},
                {"id": "cswap", "name": "Fredkin", "description": "Fredkin gate (CSWAP)", "symbol": "CSWAP", "qubits": 3}
            ],
            "special": [
                {"id": "measure", "name": "Measure", "description": "Measurement operation", "symbol": "M"},
                {"id": "reset", "name": "Reset", "description": "Reset qubit to |0⟩", "symbol": "R"}
            ]
        }
        return jsonify(gates)
    except Exception as e:
        logger.error(f"Error getting available gates: {str(e)}")
        return jsonify({"error": "Failed to get available gates"}), 500

@app.route("/api/circuit/simulate", methods=["POST"])
def api_circuit_simulate():
    """Simulate a quantum circuit"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No circuit data provided"}), 400
            
        circuit = data.get("circuit")
        shots = data.get("shots", 1024)
        
        if not circuit:
            return jsonify({"error": "No circuit definition provided"}), 400
            
        # Ensure shots is an integer and within reasonable limits
        try:
            shots = int(shots)
            if shots < 1 or shots > 10000:
                return jsonify({"error": "Shots must be between 1 and 10000"}), 400
        except ValueError:
            return jsonify({"error": "Shots must be an integer"}), 400
        
        # This is where we'd build and simulate the circuit using Cirq
        # For now, we'll use mock data
        
        import numpy as np
        import cirq
        
        # Convert JSON circuit representation to a Cirq circuit
        cirq_circuit = cirq.Circuit()
        qubits = [cirq.LineQubit(i) for i in range(circuit.get("num_qubits", 3))]
        
        # Add gates to circuit based on the circuit data
        # This would need to be implemented based on your circuit JSON schema
        
        # For now, return mock simulation results
        result = {
            "state_vector": {
                "amplitudes": [
                    {"state": "000", "amplitude": 1.0, "probability": 1.0}
                    # Additional states would be added here in a real implementation
                ],
                "visualization_data": {}  # Visualization data would go here
            },
            "measurements": {
                "counts": {"000": shots},
                "probabilities": {"000": 1.0}
            },
            "circuit_representation": {
                "qubits": circuit.get("num_qubits", 3),
                "depth": len(circuit.get("gates", [])),
                "gates": circuit.get("gates", [])
            }
        }
        
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error simulating circuit: {str(e)}\n{traceback.format_exc()}")
        return jsonify({"error": f"Failed to simulate circuit: {str(e)}"}), 500

@app.route("/api/circuit/save", methods=["POST"])
def api_circuit_save():
    """Save a quantum circuit"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No circuit data provided"}), 400
            
        # Here you would save the circuit to a database or file
        # For this example, we'll pretend to save it and return a mock ID
        
        circuit_id = datetime.now().strftime("%Y%m%d%H%M%S")
        
        return jsonify({
            "id": circuit_id,
            "name": data.get("name", "Unnamed Circuit"),
            "saved": True,
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Error saving circuit: {str(e)}")
        return jsonify({"error": f"Failed to save circuit: {str(e)}"}), 500

@app.route("/api/circuit/load/<circuit_id>", methods=["GET"])
def api_circuit_load(circuit_id):
    """Load a saved quantum circuit"""
    try:
        # Here you would load the circuit from a database or file
        # For this example, we'll return a mock circuit
        
        mock_circuit = {
            "id": circuit_id,
            "name": f"Circuit {circuit_id}",
            "num_qubits": 3,
            "gates": [
                {"type": "h", "targets": [0]},
                {"type": "cnot", "controls": [0], "targets": [1]},
                {"type": "measure", "targets": [0, 1]}
            ],
            "created_at": datetime.now().isoformat()
        }
        
        return jsonify(mock_circuit)
    except Exception as e:
        logger.error(f"Error loading circuit {circuit_id}: {str(e)}")
        return jsonify({"error": f"Failed to load circuit: {str(e)}"}), 500

@app.route("/api/circuit/saved", methods=["GET"])
def api_circuit_saved():
    """Get list of saved circuits"""
    try:
        # Here you would query a database for saved circuits
        # For this example, we'll return mock data
        
        mock_saved_circuits = [
            {"id": "20230512120000", "name": "Bell State", "num_qubits": 2, "created_at": "2023-05-12T12:00:00"},
            {"id": "20230513130000", "name": "GHZ State", "num_qubits": 3, "created_at": "2023-05-13T13:00:00"},
            {"id": "20230514140000", "name": "Quantum Teleportation", "num_qubits": 3, "created_at": "2023-05-14T14:00:00"}
        ]
        
        return jsonify(mock_saved_circuits)
    except Exception as e:
        logger.error(f"Error getting saved circuits: {str(e)}")
        return jsonify({"error": f"Failed to get saved circuits: {str(e)}"}), 500

@app.route("/api/circuit/export", methods=["POST"])
def api_circuit_export():
    """Export circuit to code (Cirq, Qiskit, etc.)"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No circuit data provided"}), 400
            
        circuit = data.get("circuit")
        format = data.get("format", "cirq").lower()
        
        if not circuit:
            return jsonify({"error": "No circuit definition provided"}), 400
            
        if format not in ["cirq", "qiskit"]:
            return jsonify({"error": f"Unsupported export format: {format}"}), 400
            
        # Generate code based on the circuit definition
        num_qubits = circuit.get("num_qubits", 3)
        
        if format == "cirq":
            code = f"""
import cirq
import numpy as np

# Create a circuit with {num_qubits} qubits
circuit = cirq.Circuit()

# Define qubits
qubits = [cirq.LineQubit(i) for i in range({num_qubits})]

# Add gates
"""
            # Here you would iterate through the gates and add them to the code
            
            code += """
# Simulate
simulator = cirq.Simulator()
result = simulator.simulate(circuit)

print("Final state vector:")
print(result.final_state_vector)
"""
        elif format == "qiskit":
            code = f"""
from qiskit import QuantumCircuit, Aer, execute
import numpy as np

# Create a circuit with {num_qubits} qubits and {num_qubits} classical bits
qc = QuantumCircuit({num_qubits}, {num_qubits})

# Add gates
"""
            # Here you would iterate through the gates and add them to the code
            
            code += """
# Simulate
simulator = Aer.get_backend('statevector_simulator')
result = execute(qc, simulator).result()
statevector = result.get_statevector()

print("Final state vector:")
print(statevector)
"""
        
        return jsonify({
            "code": code,
            "format": format
        })
    except Exception as e:
        logger.error(f"Error exporting circuit: {str(e)}")
        return jsonify({"error": f"Failed to export circuit: {str(e)}"}), 500

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
    raw_params = data.get('params', {})
    
    if plugin_key not in PLUGINS:
        emit('plugin_error', {'error': f"Plugin '{plugin_key}' not found"})
        return
    
    plugin = PLUGINS[plugin_key]
    
    try:
        # Validate parameters
        params = validate_parameters(plugin, raw_params)
        
        # Add plugin key for better error reporting
        params['_plugin_key'] = plugin_key
        
        # Set up progress tracking
        session_id = request.sid
        
        def progress_callback(step, total, message):
            progress = int(100 * step / total) if total > 0 else 0
            emit('plugin_progress', {
                'plugin_key': plugin_key,
                'progress': progress,
                'message': message
            })
        
        # Add progress callback to parameters if supported
        params['progress_callback'] = progress_callback
        
        # Run the plugin and emit the result
        emit('plugin_start', {'plugin_key': plugin_key})
        result = plugin["run"](params)
        emit('plugin_result', {'plugin_key': plugin_key, 'result': result})
        
    except SimulationError as e:
        # Handle validation errors
        error_msg = str(e)
        if hasattr(e, 'suggestion') and e.suggestion:
            error_msg += f"\n\nSuggestion: {e.suggestion}"
            
        emit('plugin_error', {'plugin_key': plugin_key, 'error': error_msg})
    except Exception as e:
        emit('plugin_error', {'plugin_key': plugin_key, 'error': str(e)})

# --- Error handling ---
@app.errorhandler(404)
def page_not_found(e):
    # SPA fallback
    try:
        return send_from_directory(app.static_folder, 'index.html')
    except Exception:
        return jsonify({"error": "Not found"}), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Server error"}), 500

# --- Main entry point ---
if __name__ == "__main__":
    # SSL Configuration for production
    if os.environ.get('FLASK_ENV') == 'production' and os.path.exists('cert.pem') and os.path.exists('key.pem'):
        socketio.run(app, debug=False, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)),
                     certfile='cert.pem', keyfile='key.pem')
    else:
        # Development environment
        socketio.run(app, debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))

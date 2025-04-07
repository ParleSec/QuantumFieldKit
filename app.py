import os
import traceback
import json
import logging
from flask import Flask, request, render_template, jsonify, session, abort
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
        "run": lambda p: run_plugin(generate_quantum_fingerprint_cirq, _plugin_key="auth", data=p["data"], num_qubits=p["num_qubits"])
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
        "run": lambda p: run_plugin(run_vqe, _plugin_key="vqe", num_qubits=p["num_qubits"], noise_prob=p["noise"], max_iter=p["max_iter"])
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
    return extract_educational_content(template_path)

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

@app.route('/sitemap.xml')
def sitemap():
    """Generate the sitemap.xml file dynamically."""
    # Get base URL from request or use production URL
    if app.config.get('ENV') == 'production':
        base_url = "https://quantumfieldkit.com"
    else:
        base_url = request.url_root.rstrip('/')
    
    # Build the sitemap XML string
    xml = ['<?xml version="1.0" encoding="UTF-8"?>',
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
           '  <url>',
           f'    <loc>{base_url}/</loc>',
           '    <changefreq>monthly</changefreq>',
           '    <priority>1.0</priority>',
           '  </url>']
    
    # Add all plugin pages
    for plugin_key in PLUGINS:
        xml.append('  <url>')
        xml.append(f'    <loc>{base_url}/plugin/{plugin_key}</loc>')
        xml.append('    <changefreq>monthly</changefreq>')
        xml.append('    <priority>0.8</priority>')
        xml.append('  </url>')
    
    xml.append('</urlset>')
    
    # Return the sitemap with the correct MIME type
    return app.response_class(
        response='\n'.join(xml),
        status=200,
        mimetype='application/xml'
    )

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

@app.route("/plugin/<plugin_key>", methods=["GET", "POST"])
def plugin_view(plugin_key):
    """Handle individual plugin pages and simulation requests."""
    if plugin_key not in PLUGINS:
        abort(404)
    
    plugin = PLUGINS[plugin_key]
    result = None
    
    mini_explanation = get_mini_explanation(plugin_key)
    educational_content = get_educational_content(plugin_key)

    if request.method == "POST":
        # Extract parameters from the form
        raw_params = {}
        for param in plugin["parameters"]:
            raw_params[param["name"]] = request.form.get(param["name"], param.get("default", ""))
        
        try:
            # Validate parameters
            params = validate_parameters(plugin, raw_params)
            
            # Add plugin key for better error reporting
            params['_plugin_key'] = plugin_key
            
            # Execute the plugin with the validated parameters
            result = plugin["run"](params)
            
            # If this is an AJAX request, return JSON
            if request.headers.get("X-Requested-With") == "XMLHttpRequest":
                return jsonify(result)
                
        except SimulationError as e:
            # Handle validation errors
            error_msg = str(e)
            if hasattr(e, 'suggestion') and e.suggestion:
                error_msg += f"\n\nSuggestion: {e.suggestion}"
                
            result = {"output": None, "log": None, "error": error_msg}
            
            if request.headers.get("X-Requested-With") == "XMLHttpRequest":
                return jsonify(result)
    
    return render_template("plugin.html", plugin=plugin, result=result, educational_content=educational_content, mini_explanation=mini_explanation)

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
        raw_params = request.json or {}
    except Exception:
        return jsonify({"error": "Invalid JSON data"}), 400
    
    try:
        # Validate and convert parameters
        params = validate_parameters(plugin, raw_params)
        
        # Add plugin key for better error reporting
        params['_plugin_key'] = plugin_key
        
        # Run the plugin
        result = plugin["run"](params)
        return jsonify(result)
        
    except SimulationError as e:
        # Handle validation errors
        error_msg = str(e)
        if hasattr(e, 'suggestion') and e.suggestion:
            error_msg += f"\n\nSuggestion: {e.suggestion}"
            
        return jsonify({"output": None, "log": None, "error": error_msg}), 400
    except Exception as e:
        logger.error(f"Unexpected error running plugin {plugin_key} via API: {str(e)}\n{traceback.format_exc()}")
        return jsonify({"output": None, "log": None, "error": f"Server error: {str(e)}"}), 500

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

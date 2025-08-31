"""
Quantum Gate Explorer module for Quantum Field Kit.

This module provides a way to visualize the effects of various quantum gates
on different input states. It calculates the resulting state vectors and 
matrix representations for educational purposes.
"""
import cirq
import numpy as np
import json
from cirq.contrib.svg import circuit_to_svg

# Constants for common quantum states
STATES = {
    '|0>': [1, 0],
    '|1>': [0, 1],
    '|+>': [1/np.sqrt(2), 1/np.sqrt(2)],
    '|->': [1/np.sqrt(2), -1/np.sqrt(2)],
    '|i+>': [1/np.sqrt(2), 1j/np.sqrt(2)],
    '|i->': [1/np.sqrt(2), -1j/np.sqrt(2)]
}

# Map of supported gates with their cirq implementations
GATES = {
    'X': cirq.X,
    'Y': cirq.Y,
    'Z': cirq.Z,
    'H': cirq.H,
    'S': cirq.S,
    'T': cirq.T,
    'Rx_pi/4': lambda q: cirq.rx(np.pi/4)(q),
    'Ry_pi/4': lambda q: cirq.ry(np.pi/4)(q),
    'Rz_pi/4': lambda q: cirq.rz(np.pi/4)(q),
    'Rx_pi/2': lambda q: cirq.rx(np.pi/2)(q),
    'Ry_pi/2': lambda q: cirq.ry(np.pi/2)(q),
    'Rz_pi/2': lambda q: cirq.rz(np.pi/2)(q)
}

# Two-qubit gates
TWO_QUBIT_GATES = {
    'CNOT': cirq.CNOT,
    'CZ': cirq.CZ,
    'SWAP': cirq.SWAP
}

def complex_to_json(complex_num):
    """Convert a complex number to a JSON-serializable format."""
    return {
        'real': float(np.real(complex_num)),
        'imag': float(np.imag(complex_num))
    }

def matrix_to_json(matrix):
    """Convert a numpy matrix containing complex numbers to JSON-serializable format."""
    if isinstance(matrix, np.ndarray):
        return [[complex_to_json(cell) for cell in row] for row in matrix]
    return matrix

def create_initial_state(state_name, num_qubits):
    """
    Creates the initial state vector based on the state name.
    
    Args:
        state_name: Name of the initial state (e.g., |00>, |+>|+>, |Bell>)
        num_qubits: Number of qubits in the system
        
    Returns:
        Numpy array representing the initial state vector
    """
    # Handle standard basis states like |00>, |01>, etc.
    if state_name.startswith('|') and state_name.endswith('>'):
        bits = state_name[1:-1]
        # If the length matches num_qubits, it's a computational basis state
        if len(bits) == num_qubits and all(bit in '01' for bit in bits):
            # Create a one-hot vector for the basis state
            index = int(bits, 2)
            state = np.zeros(2**num_qubits, dtype=complex)
            state[index] = 1.0
            return state
    
    # Handle special states
    if state_name == '|+>|+>' and num_qubits == 2:
        # Tensor product of |+> and |+>
        plus_state = np.array([1, 1]) / np.sqrt(2)
        return np.kron(plus_state, plus_state)
    
    if state_name == '|Bell>' and num_qubits == 2:
        # Bell state (|00> + |11>)/sqrt(2)
        bell_state = np.zeros(4, dtype=complex)
        bell_state[0] = 1 / np.sqrt(2)
        bell_state[3] = 1 / np.sqrt(2)
        return bell_state
    
    # Default to all zeros state if not recognized
    state = np.zeros(2**num_qubits, dtype=complex)
    state[0] = 1.0
    return state

def build_circuit_from_drag_drop(circuit_data):
    """
    Builds a Cirq circuit from the drag-and-drop circuit data.
    
    Args:
        circuit_data: Dictionary containing circuit information from the frontend
        
    Returns:
        Tuple of (Cirq circuit, list of qubits, initial state vector)
    """
    # Extract circuit parameters
    num_qubits = circuit_data.get('qubits', 2)
    initial_state_name = circuit_data.get('initial_state', '|' + '0' * num_qubits + '>')
    gates_data = circuit_data.get('gates', [])
    
    # Create qubits
    qubits = [cirq.NamedQubit(f'q{i}') for i in range(num_qubits)]
    
    # Create circuit
    circuit = cirq.Circuit()
    
    # Prepare initial state
    initial_state_vector = create_initial_state(initial_state_name, num_qubits)
    
    # Special circuit for Bell state preparation
    if initial_state_name == '|Bell>' and num_qubits == 2:
        circuit.append([cirq.H(qubits[0]), cirq.CNOT(qubits[0], qubits[1])])
    # Circuit for |+>|+> state
    elif initial_state_name == '|+>|+>' and num_qubits == 2:
        circuit.append([cirq.H(qubits[0]), cirq.H(qubits[1])])
    # Standard computational basis states
    elif initial_state_name.startswith('|') and initial_state_name.endswith('>'):
        bits = initial_state_name[1:-1]
        if len(bits) == num_qubits:
            for i, bit in enumerate(bits):
                if bit == '1':
                    circuit.append(cirq.X(qubits[i]))
    
    # Sort gates by slot
    sorted_gates = sorted(gates_data, key=lambda g: g.get('slot', 0))
    
    # Add gates to circuit
    for gate_data in sorted_gates:
        gate_name = gate_data.get('gate')
        
        if 'qubit' in gate_data:
            # Single-qubit gate
            qubit_idx = gate_data.get('qubit')
            if qubit_idx < num_qubits and gate_name in GATES:
                gate_op = GATES[gate_name]
                if callable(gate_op):
                    circuit.append(gate_op(qubits[qubit_idx]))
                else:
                    circuit.append(gate_op(qubits[qubit_idx]))
        else:
            # Two-qubit gate
            control_idx = gate_data.get('control')
            target_idx = gate_data.get('target')
            if (control_idx < num_qubits and target_idx < num_qubits and 
                gate_name in TWO_QUBIT_GATES):
                gate_op = TWO_QUBIT_GATES[gate_name]
                circuit.append(gate_op(qubits[control_idx], qubits[target_idx]))
    
    return circuit, qubits, initial_state_vector

def run_interactive_circuit(circuit_data_json):
    """
    Runs a quantum circuit defined by the interactive drag-and-drop interface.
    
    Args:
        circuit_data_json: JSON string containing circuit data from the frontend
        
    Returns:
        Dictionary with simulation results
    """
    log = []
    log.append("=== Quantum Gate Explorer: Interactive Circuit Simulation ===")
    
    try:
        # Parse the circuit data
        circuit_data = json.loads(circuit_data_json)
        
        # Build the circuit
        circuit, qubits, initial_state = build_circuit_from_drag_drop(circuit_data)
        
        # Log the circuit information
        num_qubits = len(qubits)
        log.append(f"Created circuit with {num_qubits} qubits")
        log.append(f"Initial state: {circuit_data.get('initial_state', '|' + '0' * num_qubits + '>')}")
        log.append(f"Circuit has {len(circuit)} operations")
        
        # Generate circuit visualization
        circuit_svg = circuit_to_svg(circuit)
        
        # Simulate the circuit
        simulator = cirq.Simulator()
        result = simulator.simulate(circuit)
        final_state = result.final_state_vector
        
        # Calculate probabilities
        initial_probs = np.abs(initial_state)**2
        final_probs = np.abs(final_state)**2
        
        # Determine phase information
        initial_phases = np.angle(initial_state)
        final_phases = np.angle(final_state)
        
        # Format for JSON serialization
        return {
            'num_qubits': num_qubits,
            'initial_state_name': circuit_data.get('initial_state', '|' + '0' * num_qubits + '>'),
            'initial_state': [complex_to_json(c) for c in initial_state],
            'output_state': [complex_to_json(c) for c in final_state],
            'input_probabilities': initial_probs.tolist(),
            'output_probabilities': final_probs.tolist(),
            'input_phases': initial_phases.tolist(),
            'output_phases': final_phases.tolist(),
            'circuit_svg': circuit_svg,
            'log': "\n".join(log)
        }
    except Exception as e:
        log.append(f"Error: {str(e)}")
        return {
            'error': str(e),
            'log': "\n".join(log)
        }

def calculate_gate_effect(gate_name, input_state_name, is_two_qubit=False):
    """
    Calculate the effect of applying a quantum gate to an input state.
    
    Args:
        gate_name: Name of the quantum gate to apply
        input_state_name: Name of the input state
        is_two_qubit: Whether the calculation is for a two-qubit gate
        
    Returns:
        Dictionary with gate information, input state, output state, and visualization
    """
    log = []
    log.append(f"=== Quantum Gate Explorer: {gate_name} on {input_state_name} ===")
    
    try:
        # Set up the input state
        if not is_two_qubit:
            # Single-qubit case
            if input_state_name in STATES:
                input_state = np.array(STATES[input_state_name])
                log.append(f"Input state {input_state_name}: {input_state}")
            else:
                raise ValueError(f"Unknown input state: {input_state_name}")
            
            if gate_name not in GATES:
                raise ValueError(f"Unknown gate: {gate_name}")
            
            # Create qubit and circuit
            q = cirq.NamedQubit('q')
            circuit = cirq.Circuit()
            
            # Prepare input state
            if input_state_name == '|1>':
                circuit.append(cirq.X(q))
                log.append("Applied X gate to prepare |1> state")
            elif input_state_name == '|+>':
                circuit.append(cirq.H(q))
                log.append("Applied H gate to prepare |+> state")
            elif input_state_name == '|->':
                circuit.append([cirq.H(q), cirq.Z(q)])
                log.append("Applied H and Z gates to prepare |-> state")
            elif input_state_name == '|i+>':
                circuit.append([cirq.H(q), cirq.S(q)])
                log.append("Applied H and S gates to prepare |i+> state")
            elif input_state_name == '|i->':
                circuit.append([cirq.H(q), cirq.S(q), cirq.Z(q)])
                log.append("Applied H, S and Z gates to prepare |i-> state")
            
            # Get the gate to apply
            gate_func = GATES[gate_name]
            
            # Apply the gate
            if callable(gate_func):
                gate = gate_func(q)
                circuit.append(gate)
                log.append(f"Applied {gate_name} gate")
            else:
                circuit.append(gate_func(q))
                log.append(f"Applied {gate_name} gate")
            
            # Simulate the circuit
            simulator = cirq.Simulator()
            result = simulator.simulate(circuit)
            output_state = result.final_state_vector
            
            # Get the gate's matrix representation
            gate_matrix = cirq.unitary(gate)
            
            # Create a visualization
            circuit_svg = circuit_to_svg(circuit)
            
            # Calculate probabilities
            input_probs = np.abs(input_state)**2
            output_probs = np.abs(output_state)**2
            
            # Determine phase information
            input_phases = np.angle(input_state)
            output_phases = np.angle(output_state)
            
            # Format for JSON serialization
            return {
                'gate_name': gate_name,
                'input_state_name': input_state_name,
                'input_state': [complex_to_json(c) for c in input_state],
                'output_state': [complex_to_json(c) for c in output_state],
                'gate_matrix': matrix_to_json(gate_matrix),
                'input_probabilities': input_probs.tolist(),
                'output_probabilities': output_probs.tolist(),
                'input_phases': input_phases.tolist(),
                'output_phases': output_phases.tolist(),
                'circuit_svg': circuit_svg,
                'log': "\n".join(log)
            }
        else:
            # Two-qubit case
            if gate_name not in TWO_QUBIT_GATES:
                raise ValueError(f"Unknown two-qubit gate: {gate_name}")
            
            # For two-qubit gates, we use a simple |00> state as input by default
            # or the first Bell state (|00> + |11>)/sqrt(2) if specified
            q0 = cirq.NamedQubit('q0')
            q1 = cirq.NamedQubit('q1')
            circuit = cirq.Circuit()
            
            # Prepare input state
            if input_state_name == '|00>':
                # Default state, no preparation needed
                input_state = np.array([1, 0, 0, 0])
                log.append("Using default |00> input state.")
            elif input_state_name == 'Bell':
                # Create a Bell state (|00> + |11>)/sqrt(2)
                circuit.append([cirq.H(q0), cirq.CNOT(q0, q1)])
                input_state = np.array([1/np.sqrt(2), 0, 0, 1/np.sqrt(2)])
                log.append("Created Bell state (|00> + |11>)/sqrt(2)")
            else:
                raise ValueError(f"Unsupported two-qubit input state: {input_state_name}")
            
            # Apply the two-qubit gate
            gate_func = TWO_QUBIT_GATES[gate_name]
            circuit.append(gate_func(q0, q1))
            log.append(f"Applied {gate_name} gate")
            
            # Simulate the circuit
            simulator = cirq.Simulator()
            result = simulator.simulate(circuit)
            output_state = result.final_state_vector
            
            # Get the gate's matrix representation
            gate_matrix = cirq.unitary(gate_func)
            
            # Create a visualization
            circuit_svg = circuit_to_svg(circuit)
            
            # Calculate probabilities
            input_probs = np.abs(input_state)**2
            output_probs = np.abs(output_state)**2
            
            # Determine phase information
            input_phases = np.angle(input_state)
            output_phases = np.angle(output_state)
            
            # Format for JSON serialization
            return {
                'gate_name': gate_name,
                'input_state_name': input_state_name,
                'is_two_qubit': True,
                'input_state': [complex_to_json(c) for c in input_state],
                'output_state': [complex_to_json(c) for c in output_state],
                'gate_matrix': matrix_to_json(gate_matrix),
                'input_probabilities': input_probs.tolist(),
                'output_probabilities': output_probs.tolist(),
                'input_phases': input_phases.tolist(),
                'output_phases': output_phases.tolist(),
                'circuit_svg': circuit_svg,
                'log': "\n".join(log)
            }
    except Exception as e:
        log.append(f"Error: {str(e)}")
        return {
            'gate_name': gate_name,
            'input_state_name': input_state_name,
            'error': str(e),
            'log': "\n".join(log)
        }

def run_gate_explorer(gate_name=None, input_state=None, is_two_qubit=False, circuit=None):
    """
    Run the gate explorer with specified parameters.
    
    Args:
        gate_name: Name of the gate to apply
        input_state: Name of the input state
        is_two_qubit: Whether to use a two-qubit gate
        circuit: JSON string describing a circuit for the interactive mode
        
    Returns:
        Dictionary with gate exploration results
    """
    # If circuit data is provided, use the interactive mode
    if circuit:
        return run_interactive_circuit(circuit)
    
    # Otherwise, use the single gate mode
    return calculate_gate_effect(gate_name, input_state, is_two_qubit)
"""
High-Fidelity Grover's Algorithm Simulation using Google Cirq with Detailed Math Logging.

Implements Grover's quantum search algorithm, which provides a quadratic speedup
for searching an unstructured database. The algorithm amplifies the probability of
measuring the target state through amplitude amplification.
"""
import cirq
import numpy as np
import math
from cirq.contrib.svg import circuit_to_svg

def add_noise(circuit, noise_prob):
    """
    Adds realistic quantum noise to the circuit.
    
    Args:
        circuit: A Cirq circuit
        noise_prob: Probability of depolarizing noise
        
    Returns:
        A circuit with added noise operations
    """
    if noise_prob <= 0:
        return circuit
        
    ops = []
    for op in circuit.all_operations():
        ops.append(op)
        for q in op.qubits:
            ops.append(cirq.DepolarizingChannel(noise_prob).on(q))
    return cirq.Circuit(ops)

def create_oracle(qubits, target_state):
    """
    Creates a phase oracle that marks the target state by flipping its phase.
    
    In Grover's algorithm, the oracle performs a phase flip on the target state:
    |x⟩ → -|x⟩ if x is the target state, otherwise |x⟩ → |x⟩
    
    Args:
        qubits: List of qubits
        target_state: Binary string representing the target state
        
    Returns:
        Cirq circuit implementing the oracle
    """
    n = len(qubits)
    
    # Ensure target_state is the right length
    if len(target_state) < n:
        target_state = target_state.zfill(n)
    elif len(target_state) > n:
        target_state = target_state[-n:]  # Take the last n bits
    
    circuit = cirq.Circuit()
    
    # Apply X gates to qubits that should be |0⟩ in the target state
    for i in range(n):
        if target_state[i] == '0':
            circuit.append(cirq.X(qubits[i]))
    
    # Apply multi-controlled Z gate
    # For simplicity in small qubit counts, we use a decomposition approach
    if n == 1:
        # For 1 qubit, just apply Z if target is |1⟩
        if target_state[0] == '1':
            circuit.append(cirq.Z(qubits[0]))
    elif n == 2:
        # For 2 qubits, use CZ gate
        circuit.append(cirq.CZ(qubits[0], qubits[1]))
    else:
        # For more qubits, use a helper qubit approach
        # This is a simplified multi-controlled Z implementation
        circuit.append(cirq.H(qubits[-1]))
        for i in range(n-1):
            circuit.append(cirq.CNOT(qubits[i], qubits[-1]))
        circuit.append(cirq.H(qubits[-1]))
    
    # Undo the X gates
    for i in range(n):
        if target_state[i] == '0':
            circuit.append(cirq.X(qubits[i]))
            
    return circuit

def create_diffuser(qubits):
    """
    Creates the diffusion operator (amplitude amplification) circuit.
    
    The diffuser performs a reflection about the average amplitude:
    2|s⟩⟨s| - I, where |s⟩ is the uniform superposition state.
    
    Args:
        qubits: List of qubits
        
    Returns:
        Cirq circuit implementing the diffuser
    """
    n = len(qubits)
    circuit = cirq.Circuit()
    
    # Apply H gates to all qubits
    circuit.append([cirq.H(q) for q in qubits])
    
    # Apply X gates to all qubits
    circuit.append([cirq.X(q) for q in qubits])
    
    # Apply conditional phase shift (similar to oracle but targeting |11...1⟩)
    # This implements the -I + 2|0⟩⟨0| operation in the X-basis
    if n == 1:
        circuit.append(cirq.Z(qubits[0]))
    elif n == 2:
        circuit.append(cirq.CZ(qubits[0], qubits[1]))
    else:
        # Multi-controlled Z implementation
        circuit.append(cirq.H(qubits[-1]))
        for i in range(n-1):
            circuit.append(cirq.CNOT(qubits[i], qubits[-1]))
        circuit.append(cirq.H(qubits[-1]))
    
    # Undo X gates
    circuit.append([cirq.X(q) for q in qubits])
    
    # Undo H gates
    circuit.append([cirq.H(q) for q in qubits])
    
    return circuit

def run_grover(n, target_state, noise_prob=0.0):
    """
    Runs Grover's search algorithm.
    
    Args:
        n: Number of qubits (log2 of search space size)
        target_state: Binary string representing the target state
        noise_prob: Probability of depolarizing noise
        
    Returns:
        Dictionary with search results and circuit visualization
    """
    log = []
    log.append("=== Grover's Algorithm Simulation ===")
    
    # Calculate optimal number of iterations
    N = 2**n
    num_iterations = int(round(math.pi/4 * math.sqrt(N)))
    log.append(f"Search space size: {N} (using {n} qubits)")
    log.append(f"Target state: |{target_state}⟩")
    log.append(f"Optimal number of iterations: {num_iterations}")
    
    # Create qubits
    qubits = [cirq.NamedQubit(f'q{i}') for i in range(n)]
    
    # Create circuit
    circuit = cirq.Circuit()
    
    # Initialize qubits in superposition
    circuit.append([cirq.H(q) for q in qubits])
    log.append("Initialized qubits in uniform superposition.")
    
    # Apply Grover iterations
    for i in range(num_iterations):
        log.append(f"Iteration {i+1}:")
        
        # Apply oracle
        oracle_circuit = create_oracle(qubits, target_state)
        circuit.append(oracle_circuit)
        log.append("  Applied oracle (phase flip on target state).")
        
        # Apply diffuser
        diffuser_circuit = create_diffuser(qubits)
        circuit.append(diffuser_circuit)
        log.append("  Applied diffuser (amplification step).")
        
        # Add noise if requested
        if noise_prob > 0:
            circuit = add_noise(circuit, noise_prob)
            log.append(f"  Added noise (p={noise_prob}).")
    
    # Add measurements
    circuit.append([cirq.measure(q, key=f'm{i}') for i, q in enumerate(qubits)])
    log.append("Added final measurements.")
    
    # Simulate the circuit
    simulator = cirq.Simulator()
    result = simulator.run(circuit, repetitions=1)
    
    # Process results
    measured_bits = [int(result.measurements[f'm{i}'][0][0]) for i in range(n)]
    measured_bitstring = ''.join(str(bit) for bit in measured_bits)
    success = measured_bitstring == target_state
    
    log.append(f"Measured: |{measured_bitstring}⟩")
    log.append(f"Search successful: {success}")
    
    # Generate circuit diagram for visualization
    circuit_svg = circuit_to_svg(circuit)
    
    # Calculate theoretical success probability
    # For ideal Grover's algorithm: sin^2((2k+1)θ/2) where sin^2(θ/2) = M/N and k = iterations
    theoretical_prob = math.sin((2 * num_iterations + 1) * math.asin(1/math.sqrt(N)))**2
    log.append(f"Theoretical success probability: {theoretical_prob:.4f}")
    
    return {
        "n": n,
        "target_state": target_state,
        "measured_state": measured_bitstring,
        "success": success,
        "num_iterations": num_iterations,
        "theoretical_probability": float(theoretical_prob),
        "circuit_svg": circuit_svg,
        "log": "\n".join(log)
    }

if __name__ == '__main__':
    # Run algorithm with various parameters
    result = run_grover(3, '101', noise_prob=0.0)
    print("Grover's Algorithm Simulation:")
    print(f"Target state: |{result['target_state']}⟩")
    print(f"Measured state: |{result['measured_state']}⟩")
    print(f"Search success: {result['success']}")
    print(f"Theoretical success probability: {result['theoretical_probability']:.4f}")
    
    # Run with noise
    noisy_result = run_grover(3, '101', noise_prob=0.01)
    print("\nWith noise:")
    print(f"Search success: {noisy_result['success']}")
    
    print("\nDetailed Log:")
    print(result['log'])
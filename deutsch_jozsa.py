"""
High-Fidelity Deutsch-Jozsa Algorithm Simulation using Google Cirq with Detailed Math Logging.

The Deutsch-Jozsa algorithm demonstrates quantum parallelism by determining whether a function 
is constant or balanced with a single evaluation, a task that would require multiple evaluations
classically.
"""
import cirq
import numpy as np
import random
from cirq.contrib.svg import circuit_to_svg

def create_oracle(qubits, oracle_type, secret_string=None):
    """
    Creates a quantum oracle for the Deutsch-Jozsa algorithm.
    
    Args:
        qubits: List of qubits
        oracle_type: 'constant_0', 'constant_1', 'balanced', or 'random'
        secret_string: For 'balanced' type, a bitstring that defines the balanced function
        
    Returns:
        A cirq.Circuit implementing the oracle
    """
    circuit = cirq.Circuit()
    n = len(qubits) - 1  # Number of input qubits (excluding the output qubit)
    output_qubit = qubits[-1]
    
    # Define the oracle behavior
    if oracle_type == 'constant_0':
        # f(x) = 0 for all x - Do nothing (identity)
        pass
    
    elif oracle_type == 'constant_1':
        # f(x) = 1 for all x - Flip the output qubit
        circuit.append(cirq.X(output_qubit))
    
    elif oracle_type == 'balanced':
        # Create a balanced function using the secret string as a mask
        if secret_string is None or len(secret_string) != n:
            # Default to alternating 0s and 1s if no valid secret string
            secret_string = ''.join(['1' if i % 2 == 0 else '0' for i in range(n)])
        
        # Apply X gates to input qubits where secret_string has a '1'
        for i, bit in enumerate(secret_string):
            if bit == '1':
                circuit.append(cirq.CNOT(qubits[i], output_qubit))
    
    elif oracle_type == 'random':
        # Randomly choose between constant and balanced
        if random.random() < 0.5:
            # Constant (0 or 1)
            if random.random() < 0.5:
                circuit.append(cirq.X(output_qubit))
        else:
            # Balanced - randomly set which qubits affect the output
            for i in range(n):
                if random.random() < 0.5:
                    circuit.append(cirq.CNOT(qubits[i], output_qubit))
    
    return circuit

def add_noise(circuit, noise_prob):
    """
    Adds realistic quantum noise to the circuit.
    
    Args:
        circuit: A Cirq circuit
        noise_prob: Probability of depolarizing noise
        
    Returns:
        A circuit with added noise operations
    """
    noisy_ops = []
    for op in circuit.all_operations():
        noisy_ops.append(op)
        for q in op.qubits:
            noisy_ops.append(cirq.DepolarizingChannel(noise_prob).on(q))
    return cirq.Circuit(noisy_ops)

def deutsch_jozsa_cirq(n_qubits=3, oracle_type='random', secret_string=None, noise_prob=0.0):
    """
    Runs the Deutsch-Jozsa algorithm.
    
    Args:
        n_qubits: Number of input qubits (total qubits will be n_qubits + 1)
        oracle_type: 'constant_0', 'constant_1', 'balanced', or 'random'
        secret_string: For 'balanced' type, a bitstring that defines the balanced function
        noise_prob: Probability of depolarizing noise
        
    Returns:
        Dictionary with algorithm results and visualization
    """
    log = []
    log.append("=== Deutsch-Jozsa Algorithm Simulation ===")
    
    # Total number of qubits (n input qubits + 1 output qubit)
    qubits = [cirq.NamedQubit(f'q{i}') for i in range(n_qubits + 1)]
    output_qubit = qubits[-1]
    input_qubits = qubits[:-1]
    
    # Create oracle
    if oracle_type == 'random':
        is_constant = random.random() < 0.5
        if is_constant:
            oracle_type = 'constant_0' if random.random() < 0.5 else 'constant_1'
            log.append(f"Randomly chosen oracle type: {oracle_type}")
        else:
            oracle_type = 'balanced'
            # Create a random balanced function
            secret_string = ''.join(['0' if random.random() < 0.5 else '1' for _ in range(n_qubits)])
            log.append(f"Randomly chosen balanced oracle with secret: {secret_string}")
    else:
        is_constant = oracle_type.startswith('constant')
        log.append(f"Oracle type: {oracle_type}")
        if oracle_type == 'balanced' and secret_string:
            log.append(f"Secret string for balanced function: {secret_string}")
    
    # Create the circuit
    circuit = cirq.Circuit()
    
    # Step 1: Initialize output qubit to |1⟩
    circuit.append(cirq.X(output_qubit))
    log.append("Initialized output qubit to |1⟩")
    
    # Step 2: Apply Hadamard gates to all qubits
    circuit.append(cirq.H.on_each(*qubits))
    log.append("Applied Hadamard gates to create superposition")
    
    # Step 3: Apply the oracle
    oracle_circuit = create_oracle(qubits, oracle_type, secret_string)
    circuit.append(oracle_circuit)
    log.append("Applied oracle function f(x)")
    
    # Step 4: Apply Hadamard gates to the input qubits
    circuit.append(cirq.H.on_each(*input_qubits))
    log.append("Applied Hadamard gates to input qubits")
    
    # Apply noise if specified
    if noise_prob > 0:
        noisy_circuit = add_noise(circuit, noise_prob)
        log.append(f"Added noise with probability {noise_prob}")
        circuit = noisy_circuit
    
    # Step 5: Measure the input qubits
    circuit.append(cirq.measure(*input_qubits, key='result'))
    
    # Simulate the circuit
    simulator = cirq.Simulator()
    result = simulator.run(circuit, repetitions=1)
    
    # Process the measurement results
    measurements = result.measurements['result'][0]
    measured_state = ''.join([str(bit) for bit in measurements])
    
    # Determine if the function is constant or balanced
    is_measured_constant = (measured_state == '0' * n_qubits)
    
    log.append(f"Measured state: |{measured_state}⟩")
    
    if is_measured_constant:
        log.append("Conclusion: Function is constant")
    else:
        log.append("Conclusion: Function is balanced")
    
    # Generate circuit SVG for visualization
    circuit_svg = circuit_to_svg(circuit)
    
    # Calculate expected result for verification
    log.append(f"Expected result: Function is {'constant' if is_constant else 'balanced'}")
    correct = (is_measured_constant == is_constant)
    log.append(f"Determination correct: {correct}")
    
    return {
        "oracle_type": oracle_type,
        "n_qubits": n_qubits,
        "secret_string": secret_string,
        "measured_state": measured_state,
        "is_function_constant": is_measured_constant,
        "actual_function_constant": is_constant,
        "correct_determination": correct,
        "circuit_svg": circuit_svg,
        "log": "\n".join(log)
    }

if __name__ == '__main__':
    # Run the Deutsch-Jozsa algorithm with different oracle types
    constant_0_result = deutsch_jozsa_cirq(3, oracle_type='constant_0')
    constant_1_result = deutsch_jozsa_cirq(3, oracle_type='constant_1')
    balanced_result = deutsch_jozsa_cirq(3, oracle_type='balanced', secret_string='101')
    random_result = deutsch_jozsa_cirq(3, oracle_type='random')
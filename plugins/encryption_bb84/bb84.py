"""
High-Fidelity BB84 Protocol Simulation using Google Cirq with Detailed Math Logging.

This module builds a circuit for state preparation, measurement, and key sifting,
while logging the mathematical operations and intermediate state vectors.
"""
import cirq
import random
import numpy as np
from cirq.contrib.svg import circuit_to_svg

def add_noise(circuit, noise_prob=0.01):
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

def bb84_protocol_cirq(num_bits=10, noise_prob=0.0):
    log = []
    log.append("=== BB84 Protocol Simulation ===")
    alice_bits = [random.randint(0, 1) for _ in range(num_bits)]
    alice_bases = [random.choice(['Z', 'X']) for _ in range(num_bits)]
    bob_bases = [random.choice(['Z', 'X']) for _ in range(num_bits)]
    
    log.append(f"Alice's random bits: {alice_bits}")
    log.append(f"Alice's random bases: {alice_bases}")
    log.append(f"Bob's random bases: {bob_bases}")
    
    circuits = []
    qubits = [cirq.NamedQubit(f'q{i}') for i in range(num_bits)]
    
    # Create a sample circuit visualization using only the first qubit
    # This ensures we always have a valid circuit for SVG generation
    sample_circuit = cirq.Circuit()
    sample_q = cirq.NamedQubit('q0')
    
    # Add representative operations to sample circuit
    sample_circuit.append(cirq.H(sample_q))
    sample_circuit.append(cirq.measure(sample_q))
    
    circuit_svg = circuit_to_svg(sample_circuit)
    
    for i in range(num_bits):
        log.append(f"\n-- Bit {i} --")
        circuit = cirq.Circuit()
        # State preparation for Alice.
        if alice_bits[i] == 1:
            circuit.append(cirq.X(qubits[i]))
            log.append("Applied X gate: |0> -> |1>.")
        else:
            log.append("No X gate applied: remains |0>.")
        if alice_bases[i] == 'X':
            circuit.append(cirq.H(qubits[i]))
            log.append("Applied H gate: Creates superposition.")
        else:
            log.append("Using Z basis; no H applied.")
        if noise_prob > 0:
            circuit = add_noise(circuit, noise_prob)
            log.append(f"Noise added (p = {noise_prob}).")
        state = cirq.Simulator().simulate(circuit).final_state_vector
        log.append(f"Resulting state: {np.around(state, 3)}")
        circuits.append(circuit)
    
    meas_circuits = []
    for i in range(num_bits):
        circuit = cirq.Circuit()
        if bob_bases[i] == 'X':
            circuit.append(cirq.H(qubits[i]))
            log.append(f"Bob applies H on q{i} for X basis measurement.")
        circuit.append(cirq.measure(qubits[i], key=f'm{i}'))
        if noise_prob > 0:
            circuit = add_noise(circuit, noise_prob)
            log.append(f"Noise added for measurement on q{i}.")
        meas_circuits.append(circuit)
    
    simulator = cirq.Simulator()
    bob_measurements = []
    for i in range(num_bits):
        full_circuit = circuits[i] + meas_circuits[i]
        result = simulator.run(full_circuit, repetitions=1)
        meas = int(result.measurements[f'm{i}'][0][0])
        bob_measurements.append(meas)
        log.append(f"Bob's measurement for bit {i}: {meas}")
    
    # Sift key - keep only bits where Alice and Bob used the same basis
    matching_bases = [i for i in range(num_bits) if alice_bases[i] == bob_bases[i]]
    shared_key = [alice_bits[i] for i in matching_bases]
    bob_key = [bob_measurements[i] for i in matching_bases]
    
    # Calculate error rate to detect eavesdropping
    errors = sum(shared_key[i] != bob_key[i] for i in range(len(shared_key))) if shared_key else 0
    error_rate = errors / len(shared_key) if shared_key else 0
    
    log.append(f"\nMatching bases indices: {matching_bases}")
    log.append(f"Alice's sifted key: {shared_key}")
    log.append(f"Bob's measured key: {bob_key}")
    log.append(f"Error rate: {error_rate:.2%}")
    
    return {
        'alice_bits': alice_bits,
        'alice_bases': alice_bases,
        'bob_bases': bob_bases,
        'bob_measurements': bob_measurements,
        'matching_bases': matching_bases,
        'shared_key': shared_key,
        'bob_key': bob_key,
        'error_rate': error_rate,
        'circuit_svg': circuit_svg,
        'log': "\n".join(log)
    }

if __name__ == '__main__':
    result = bb84_protocol_cirq(5, noise_prob=0.02)
    print("Cirq BB84 Simulation Result:")
    print("Shared key:", result['shared_key'])
    print("Error rate:", f"{result['error_rate']:.2%}")
    print("\nDetailed Log:\n", result['log'])
"""
High-Fidelity BB84 Protocol Simulation using Google Cirq with Detailed Math Logging.

This module builds a circuit for state preparation, measurement, and key sifting,
while logging the mathematical operations and intermediate state vectors.
"""
import cirq
import random
import numpy as np

def add_noise(circuit, noise_prob=0.01):
    noisy_ops = []
    for op in circuit.all_operations():
        noisy_ops.append(op)
        for q in op.qubits:
            noisy_ops.append(cirq.DepolarizingChannel(noise_prob).on(q))
    return cirq.Circuit(noisy_ops)

def bb84_protocol_cirq(num_bits=10, noise_prob=0.0):
    log = []
    log.append("=== BB84 Protocol Simulation (Cirq Edition) ===")
    alice_bits = [random.randint(0, 1) for _ in range(num_bits)]
    alice_bases = [random.choice(['Z', 'X']) for _ in range(num_bits)]
    bob_bases = [random.choice(['Z', 'X']) for _ in range(num_bits)]
    
    circuits = []
    qubits = [cirq.NamedQubit(f'q{i}') for i in range(num_bits)]
    
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
    
    shared_key = [alice_bits[i] for i in range(num_bits) if alice_bases[i] == bob_bases[i]]
    log.append(f"\nFinal shared key: {shared_key}")
    return {
        'alice_bits': alice_bits,
        'alice_bases': alice_bases,
        'bob_bases': bob_bases,
        'bob_measurements': bob_measurements,
        'shared_key': shared_key,
        'log': "\n".join(log)
    }

if __name__ == '__main__':
    result = bb84_protocol_cirq(5, noise_prob=0.02)
    print("Cirq BB84 Simulation Result:")
    print("Shared key:", result['shared_key'])
    print("\nDetailed Log:\n", result['log'])
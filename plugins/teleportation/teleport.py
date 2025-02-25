"""
High-Fidelity Quantum Teleportation using Google Cirq with Detailed Math Logging.

Implements a three-qubit teleportation protocol. Logs operations, state evolution,
and measurement outcomes, showing the mathematical effects of each gate.
"""
import cirq
import numpy as np

def add_noise(circuit, noise_prob):
    noisy_ops = []
    for op in circuit.all_operations():
        noisy_ops.append(op)
        for q in op.qubits:
            noisy_ops.append(cirq.DepolarizingChannel(noise_prob).on(q))
    return cirq.Circuit(noisy_ops)

def teleportation_circuit(noise_prob=0.0):
    log = []
    log.append("=== Quantum Teleportation Simulation ===")
    q0, q1, q2 = cirq.LineQubit.range(3)
    circuit = cirq.Circuit()
    log.append("Preparing unknown state on q0 using H and Z gates.")
    circuit.append([cirq.H(q0), cirq.Z(q0)])
    log.append("Creating Bell pair between q1 and q2 using H and CNOT.")
    circuit.append([cirq.H(q1), cirq.CNOT(q1, q2)])
    if noise_prob > 0:
        circuit = add_noise(circuit, noise_prob)
        log.append(f"Noise added with probability {noise_prob} after Bell pair creation.")
    log.append("Performing Bell measurement on q0 and q1.")
    circuit.append(cirq.CNOT(q0, q1))
    circuit.append(cirq.H(q0))
    circuit.append([cirq.measure(q0, key='m0'), cirq.measure(q1, key='m1')])
    if noise_prob > 0:
        circuit = add_noise(circuit, noise_prob)
        log.append(f"Noise added before measurement.")
    simulator = cirq.Simulator()
    result = simulator.run(circuit, repetitions=1)
    m0 = int(result.measurements['m0'][0][0])
    m1 = int(result.measurements['m1'][0][0])
    log.append(f"Measurement outcomes: m0 = {m0}, m1 = {m1}.")
    log.append("Applying conditional corrections to q2 based on measurements.")
    correction_circuit = cirq.Circuit()
    if m1 == 1:
        correction_circuit.append(cirq.X(q2))
        log.append("Applied X gate on q2 (m1=1).")
    if m0 == 1:
        correction_circuit.append(cirq.Z(q2))
        log.append("Applied Z gate on q2 (m0=1).")
    full_circuit = circuit + correction_circuit
    final_state = simulator.simulate(full_circuit).final_state_vector
    log.append(f"Final state vector of q2: {np.around(final_state, 3)}")
    return final_state, (m0, m1), full_circuit, "\n".join(log)

if __name__ == '__main__':
    state, measurements, circuit, log_str = teleportation_circuit(noise_prob=0.02)
    print("Cirq Teleportation Simulation:")
    print("Final state vector of q2:", state)
    print("Measurement outcomes:", measurements)
    print("Circuit:")
    print(circuit)
    print("\nDetailed Log:\n", log_str)
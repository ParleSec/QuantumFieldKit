"""
High-Fidelity Quantum Communication Network Simulation using Cirq with Detailed Math Logging.

Simulates entanglement swapping by creating two Bell pairs, performing a Bell measurement,
and logging the intermediate and final measurement outcomes.
"""
import cirq

def add_noise(circuit, noise_prob):
    noisy_ops = []
    for op in circuit.all_operations():
        noisy_ops.append(op)
        for q in op.qubits:
            noisy_ops.append(cirq.DepolarizingChannel(noise_prob).on(q))
    return cirq.Circuit(noisy_ops)

def entanglement_swapping_cirq(noise_prob=0.0):
    log = []
    log.append("=== Entanglement Swapping Simulation (Cirq Edition) ===")
    q0, q1, q2, q3 = cirq.LineQubit.range(4)
    circuit = cirq.Circuit()
    log.append("Creating Bell pair between q0 and q1.")
    circuit.append([cirq.H(q0), cirq.CNOT(q0, q1)])
    log.append("Creating Bell pair between q2 and q3.")
    circuit.append([cirq.H(q2), cirq.CNOT(q2, q3)])
    log.append("Performing Bell measurement on intermediate qubits q1 and q2.")
    circuit.append(cirq.CNOT(q1, q2))
    circuit.append(cirq.H(q1))
    circuit.append([cirq.measure(q1, key='m1'), cirq.measure(q2, key='m2')])
    if noise_prob > 0:
        circuit = add_noise(circuit, noise_prob)
        log.append(f"Noise added with p = {noise_prob}.")
    simulator = cirq.Simulator()
    result = simulator.run(circuit, repetitions=1)
    m1 = int(result.measurements['m1'][0][0])
    m2 = int(result.measurements['m2'][0][0])
    log.append(f"Intermediate measurements: m1 = {m1}, m2 = {m2}.")
    log.append("Measuring outer qubits (q0 and q3).")
    circuit.append([cirq.measure(q0, key='m0'), cirq.measure(q3, key='m3')])
    final_result = simulator.run(circuit, repetitions=1)
    m0 = int(final_result.measurements['m0'][0][0])
    m3 = int(final_result.measurements['m3'][0][0])
    log.append(f"Final measurements: q0 = {m0}, q3 = {m3}.")
    return {'intermediate_measurements': (m1, m2),
            'node_A_measurement': m0,
            'node_C_measurement': m3,
            'log': "\n".join(log)}

if __name__ == '__main__':
    result = entanglement_swapping_cirq(noise_prob=0.02)
    print("Cirq Entanglement Swapping Simulation Result:")
    print(result['log'])
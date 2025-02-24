"""
High-Fidelity Quantum Handshake Simulation using Google Cirq with Detailed Math Logging.

Creates an entangled Bell pair and logs the operations and measurements for authentication.
"""
import cirq

def add_noise(circuit, noise_prob):
    noisy_ops = []
    for op in circuit.all_operations():
        noisy_ops.append(op)
        for q in op.qubits:
            noisy_ops.append(cirq.DepolarizingChannel(noise_prob).on(q))
    return cirq.Circuit(noisy_ops)

def handshake_cirq(noise_prob=0.0):
    log = []
    log.append("=== Quantum Handshake Simulation (Cirq Edition) ===")
    q0, q1 = cirq.LineQubit.range(2)
    circuit = cirq.Circuit()
    circuit.append([cirq.H(q0), cirq.CNOT(q0, q1)])
    log.append("Created Bell pair using H and CNOT.")
    if noise_prob > 0:
        circuit = add_noise(circuit, noise_prob)
        log.append(f"Noise added with p = {noise_prob}.")
    circuit.append([cirq.measure(q0, key='m0'), cirq.measure(q1, key='m1')])
    simulator = cirq.Simulator()
    result = simulator.run(circuit, repetitions=1)
    m0 = int(result.measurements['m0'][0][0])
    m1 = int(result.measurements['m1'][0][0])
    log.append(f"Measurement outcomes: m0 = {m0}, m1 = {m1}.")
    handshake_success = (m0 == m1)
    log.append(f"Handshake success: {handshake_success}.")
    return {'alice_result': m0, 'bob_result': m1, 'handshake_success': handshake_success, 'log': "\n".join(log)}

if __name__ == '__main__':
    result = handshake_cirq(noise_prob=0.02)
    print("Cirq Handshake Simulation Result:")
    print(result['log'])
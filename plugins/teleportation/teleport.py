import cirq
import numpy as np
from cirq.contrib.svg import circuit_to_svg

def add_noise(circuit, noise_prob):
    ops = []
    for op in circuit.all_operations():
        ops.append(op)
        for q in op.qubits:
            ops.append(cirq.DepolarizingChannel(noise_prob).on(q))
    return cirq.Circuit(ops)

def teleportation_circuit(noise_prob=0.0):
    log = []
    log.append("=== Quantum Teleportation Simulation ===")

    q0, q1, q2 = cirq.LineQubit.range(3)
    circuit = cirq.Circuit()
    log.append("Preparing unknown state on q0 (H, Z).")
    circuit.append([cirq.H(q0), cirq.Z(q0)])
    log.append("Creating Bell pair between q1 and q2 (H, CNOT).")
    circuit.append([cirq.H(q1), cirq.CNOT(q1, q2)])

    if noise_prob > 0:
        circuit = add_noise(circuit, noise_prob)
        log.append(f"Noise added (p={noise_prob}).")

    log.append("Performing Bell measurement on q0 and q1.")
    circuit.append(cirq.CNOT(q0, q1))
    circuit.append(cirq.H(q0))
    circuit.append([cirq.measure(q0, key='m0'), cirq.measure(q1, key='m1')])

    if noise_prob > 0:
        circuit = add_noise(circuit, noise_prob)
        log.append("Noise added before measurement.")

    simulator = cirq.Simulator()
    result = simulator.run(circuit, repetitions=1)
    m0 = int(result.measurements['m0'][0][0])
    m1 = int(result.measurements['m1'][0][0])
    log.append(f"Measurement outcomes: m0={m0}, m1={m1}.")

    log.append("Applying conditional corrections to q2.")
    correction = cirq.Circuit()
    if m1 == 1:
        correction.append(cirq.X(q2))
        log.append("Applied X on q2.")
    if m0 == 1:
        correction.append(cirq.Z(q2))
        log.append("Applied Z on q2.")

    full_circuit = circuit + correction
    final_state = simulator.simulate(full_circuit).final_state_vector
    log.append(f"Final state vector of q2: {np.round(final_state,3)}")

    # Convert to SVG
    circuit_svg = circuit_to_svg(full_circuit)

    return {
        "final_state": final_state.tolist(),  # or str
        "measurements": (m0, m1),
        "circuit_svg": circuit_svg,
        "log": "\n".join(log)
    }

if __name__ == '__main__':
    r = teleportation_circuit(noise_prob=0.02)
    print("Final state:", r["final_state"])
    print("Measurements:", r["measurements"])
    print("Circuit SVG:\n", r["circuit_svg"])
    print("Log:\n", r["log"])

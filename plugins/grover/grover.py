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

def oracle(qubits, target_state):
    n = len(qubits)
    # Pad or truncate target_state to length n
    if len(target_state) < n:
        target_state = target_state.zfill(n)
    elif len(target_state) > n:
        target_state = target_state[:n]

    ops = []
    # For bits that are '0', apply X
    for i in range(n):
        if target_state[i] == '0':
            ops.append(cirq.X(qubits[i]))
    # Ancilla qubit for demonstration
    ancilla = cirq.NamedQubit("ancilla")
    ops.append(cirq.Z(ancilla))
    # Revert the X gates
    for i in range(n):
        if target_state[i] == '0':
            ops.append(cirq.X(qubits[i]))
    return ops

def diffuser(qubits):
    circuit = cirq.Circuit()
    circuit.append([cirq.H(q) for q in qubits])
    circuit.append([cirq.X(q) for q in qubits])
    circuit.append(cirq.H(qubits[-1]))
    circuit.append(cirq.CNOT(qubits[-2], qubits[-1]))
    circuit.append(cirq.H(qubits[-1]))
    circuit.append([cirq.X(q) for q in qubits])
    circuit.append([cirq.H(q) for q in qubits])
    return circuit

def grover_circuit(n, target_state, iterations, noise_prob=0.0):
    qubits = [cirq.NamedQubit(f'q{i}') for i in range(n)]
    ancilla = cirq.NamedQubit("ancilla")
    circuit = cirq.Circuit()
    # Initialize qubits
    circuit.append([cirq.H(q) for q in qubits])
    circuit.append([cirq.X(ancilla), cirq.H(ancilla)])
    # Oracle + diffuser steps
    for _ in range(iterations):
        circuit += oracle(qubits, target_state)
        circuit += diffuser(qubits)
        if noise_prob > 0:
            circuit = add_noise(circuit, noise_prob)
    # Measure
    circuit.append([cirq.measure(q, key=f'm{i}') for i, q in enumerate(qubits)])
    return circuit

def run_grover(n, target_state, noise_prob=0.0):
    log = []
    log.append("=== Grover's Algorithm Simulation ===")
    iterations = int(np.floor(np.pi/4 * np.sqrt(2**n)))
    log.append(f"Using {n} qubits, target_state={target_state}, iterations={iterations}")
    circuit = grover_circuit(n, target_state, iterations, noise_prob)
    circuit_svg = circuit_to_svg(circuit)

    simulator = cirq.Simulator()
    result = simulator.run(circuit, repetitions=1)
    outcome = "".join(str(int(result.measurements[f'm{i}'][0][0])) for i in range(n))
    log.append(f"Outcome: {outcome}")

    return {
        "outcome": outcome,
        "circuit_svg": circuit_svg,
        "log": "\n".join(log)
    }

if __name__ == '__main__':
    r = run_grover(3, '101', noise_prob=0.01)
    print("Outcome:", r["outcome"])
    print("Circuit SVG:\n", r["circuit_svg"])
    print("Log:\n", r["log"])

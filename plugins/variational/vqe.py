import cirq
import numpy as np
import sympy
from cirq.contrib.svg import circuit_to_svg

def create_ansatz(qubits, params):
    circuit = cirq.Circuit()
    # For each qubit, add rx and ry rotations
    for i, q in enumerate(qubits):
        circuit.append(cirq.rx(params[i])(q))
        circuit.append(cirq.ry(params[i + len(qubits)])(q))
    # Entangle qubits
    for i in range(len(qubits)-1):
        circuit.append(cirq.CNOT(qubits[i], qubits[i+1]))
    return circuit

def measure_hamiltonian(circuit, qubits):
    circuit.append([cirq.measure(q, key=f'm{i}') for i, q in enumerate(qubits)])
    return circuit

def add_noise(circuit, noise_prob):
    ops = []
    for op in circuit.all_operations():
        ops.append(op)
        for q in op.qubits:
            ops.append(cirq.DepolarizingChannel(noise_prob).on(q))
    return cirq.Circuit(ops)

def run_vqe(num_qubits=2, noise_prob=0.0, max_iter=10):
    log = []
    log.append("=== VQE Simulation ===")
    qubits = [cirq.NamedQubit(f'q{i}') for i in range(num_qubits)]
    param_count = 2 * num_qubits
    params = sympy.symbols('theta0:'+str(param_count))
    log.append(f"Number of qubits: {num_qubits}, param_count: {param_count}")

    circuit = create_ansatz(qubits, params)
    if noise_prob > 0:
        circuit = add_noise(circuit, noise_prob)
        log.append(f"Noise applied (p={noise_prob}).")

    measure_hamiltonian(circuit, qubits)
    simulator = cirq.Simulator()

    current_params = np.random.rand(param_count) * np.pi
    best_energy = float('inf')
    best_params = current_params.copy()

    for iteration in range(max_iter):
        resolver = {s: current_params[i] for i, s in enumerate(params)}
        result = simulator.run(circuit, param_resolver=resolver, repetitions=100)
        total_ones = 0
        for i in range(num_qubits):
            total_ones += sum(result.measurements[f'm{i}'][0])
        energy = total_ones / (100.0 * num_qubits)
        log.append(f"Iteration {iteration}: energy={energy:.3f}, params={np.round(current_params,3)}")
        if energy < best_energy:
            best_energy = energy
            best_params = current_params.copy()
        # A trivial "gradient" step
        current_params -= 0.1 * (np.random.rand(param_count) - 0.5)

    log.append(f"Best energy: {best_energy:.3f}, best params={np.round(best_params,3)}")
    circuit_svg = circuit_to_svg(circuit)

    return {
        "best_energy": best_energy,
        "best_params": best_params.tolist(),
        "circuit_svg": circuit_svg,
        "log": "\n".join(log)
    }

if __name__ == '__main__':
    r = run_vqe(num_qubits=2, noise_prob=0.01, max_iter=5)
    print("Best energy:", r["best_energy"])
    print("Best params:", r["best_params"])
    print("Circuit SVG:\n", r["circuit_svg"])
    print("Log:\n", r["log"])

"""
Variational Quantum Eigensolver (VQE) using Cirq with Detailed Logging.

This module demonstrates a simplified VQE approach to find the ground state energy
of a small Hamiltonian (e.g., H2 molecule in a minimal basis).
"""

import cirq
import numpy as np
import sympy

def create_ansatz(qubits, params):
    """A simple ansatz circuit for demonstration."""
    circuit = cirq.Circuit()
    # Example: One rotation per qubit
    for i, q in enumerate(qubits):
        circuit.append(cirq.rx(params[i])(q))
        circuit.append(cirq.ry(params[i+len(qubits)])(q))
    # Add entangling gates
    for i in range(len(qubits)-1):
        circuit.append(cirq.CNOT(qubits[i], qubits[i+1]))
    return circuit

def measure_hamiltonian(circuit, qubits):
    """Placeholder for measuring a Hamiltonian. For demonstration, measure Z on all qubits."""
    circuit.append([cirq.measure(q, key=f'm{i}') for i, q in enumerate(qubits)])
    return circuit

def run_vqe(num_qubits=2, noise_prob=0.0, max_iter=10):
    log = []
    log.append("=== Variational Quantum Eigensolver (VQE) Simulation ===")
    qubits = [cirq.NamedQubit(f'q{i}') for i in range(num_qubits)]
    param_count = 2 * num_qubits
    params = sympy.symbols('theta0:'+str(param_count))
    log.append(f"Number of qubits: {num_qubits}, param_count: {param_count}")

    # Build circuit with symbolic parameters
    circuit = create_ansatz(qubits, params)
    # Optional noise
    if noise_prob > 0:
        circuit = add_noise(circuit, noise_prob)
        log.append(f"Noise applied with p={noise_prob}.")
    measure_hamiltonian(circuit, qubits)
    simulator = cirq.Simulator()

    # Very simplified gradient-based approach
    current_params = np.random.rand(param_count) * np.pi
    best_energy = 999
    best_params = current_params.copy()

    for iteration in range(max_iter):
        # Convert current_params into a dict
        param_resolver = {s: current_params[i] for i, s in enumerate(params)}
        result = simulator.run(circuit, param_resolver=param_resolver, repetitions=100)
        # Dummy "energy" = average # of 1s measured
        total_ones = 0
        for i in range(num_qubits):
            total_ones += sum(result.measurements[f'm{i}'][0])
        energy = total_ones / (100.0 * num_qubits)
        log.append(f"Iteration {iteration}, params={np.round(current_params, 3)}, energy={energy:.3f}")
        if energy < best_energy:
            best_energy = energy
            best_params = current_params.copy()
        # Update params in a trivial way
        current_params -= 0.1 * (np.random.rand(param_count) - 0.5)

    log.append(f"Best energy found: {best_energy:.3f}, best params={np.round(best_params, 3)}")
    return {
        'best_energy': best_energy,
        'best_params': best_params,
        'log': "\n".join(log),
        'circuit': circuit
    }

def add_noise(circuit, noise_prob):
    noisy_ops = []
    for op in circuit.all_operations():
        noisy_ops.append(op)
        for q in op.qubits:
            noisy_ops.append(cirq.DepolarizingChannel(noise_prob).on(q))
    return cirq.Circuit(noisy_ops)

if __name__ == '__main__':
    result = run_vqe(num_qubits=2, noise_prob=0.01, max_iter=5)
    print("Best energy:", result['best_energy'])
    print("Best params:", result['best_params'])
    print("\nCircuit:\n", result['circuit'])
    print("\nDetailed Log:\n", result['log'])
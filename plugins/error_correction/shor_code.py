import cirq
import numpy as np

def add_noise(circuit, noise_prob=0.01):
    noisy_ops = []
    for op in circuit.all_operations():
        noisy_ops.append(op)
        for q in op.qubits:
            noisy_ops.append(cirq.DepolarizingChannel(noise_prob).on(q))
    return cirq.Circuit(noisy_ops)

def shor_encode(qubits):
    """Encodes one logical qubit into nine physical qubits."""
    # For simplicity, assume the logical qubit is in |0>.
    circuit = cirq.Circuit()
    # First triple repetition
    circuit.append([cirq.CNOT(qubits[0], qubits[1]), cirq.CNOT(qubits[0], qubits[2])])
    # Second triple repetition (Hadamard-based)
    circuit.append(cirq.H(qubits[0]))
    circuit.append(cirq.H(qubits[1]))
    circuit.append(cirq.H(qubits[2]))
    circuit.append([cirq.CNOT(qubits[0], qubits[3]), cirq.CNOT(qubits[0], qubits[4])])
    circuit.append([cirq.CNOT(qubits[1], qubits[5]), cirq.CNOT(qubits[1], qubits[6])])
    circuit.append([cirq.CNOT(qubits[2], qubits[7]), cirq.CNOT(qubits[2], qubits[8])])
    return circuit

def shor_correct(circuit, qubits):
    """Applies a simplified error-correction procedure for single-qubit errors."""
    # In a full Shor code, you'd measure syndrome bits. Here we do a minimal demonstration.
    # For brevity, this is a placeholder. Real code would measure ancillas to detect phase/bit flips.
    return circuit

def run_shor_code(noise_prob=0.01):
    log = []
    log.append("=== Shor's Code Error Correction Simulation ===")

    # We need 9 qubits for Shor's code
    qubits = [cirq.NamedQubit(f'q{i}') for i in range(9)]
    circuit = cirq.Circuit()
    # Encode
    encode_circuit = shor_encode(qubits)
    circuit += encode_circuit
    log.append("Encoded one logical qubit into 9 physical qubits.")

    # Optional noise
    if noise_prob > 0:
        circuit = add_noise(circuit, noise_prob)
        log.append(f"Applied depolarizing noise (p={noise_prob}).")

    # Error correction
    circuit = shor_correct(circuit, qubits)
    log.append("Applied simplified error correction procedure (placeholder).")

    # Measure all qubits
    circuit.append([cirq.measure(q) for q in qubits])
    log.append("Measured all 9 physical qubits to retrieve logical state.")

    simulator = cirq.Simulator()
    result = simulator.run(circuit, repetitions=1)
    measurements = {}
    for i, q in enumerate(qubits):
        bit = int(result.measurements[q.name][0][0])
        measurements[q.name] = bit
    log.append(f"Measurement results: {measurements}")

    return {
        'measurements': measurements,
        'log': "\n".join(log),
        'circuit': circuit
    }

if __name__ == '__main__':
    result = run_shor_code(noise_prob=0.02)
    print("Measurement results:", result['measurements'])
    print("\nCircuit:\n", result['circuit'])
    print("\nDetailed Log:\n", result['log'])
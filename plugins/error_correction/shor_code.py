import cirq
import numpy as np
from cirq.contrib.svg import circuit_to_svg

def add_noise(circuit, noise_prob=0.01):
    noisy_ops = []
    for op in circuit.all_operations():
        noisy_ops.append(op)
        for q in op.qubits:
            noisy_ops.append(cirq.DepolarizingChannel(noise_prob).on(q))
    return cirq.Circuit(noisy_ops)

def shor_encode(qubits):
    """Encodes one logical qubit into nine physical qubits."""
    circuit = cirq.Circuit()
    circuit.append([cirq.CNOT(qubits[0], qubits[1]), cirq.CNOT(qubits[0], qubits[2])])
    circuit.append(cirq.H(qubits[0]))
    circuit.append(cirq.H(qubits[1]))
    circuit.append(cirq.H(qubits[2]))
    circuit.append([cirq.CNOT(qubits[0], qubits[3]), cirq.CNOT(qubits[0], qubits[4])])
    circuit.append([cirq.CNOT(qubits[1], qubits[5]), cirq.CNOT(qubits[1], qubits[6])])
    circuit.append([cirq.CNOT(qubits[2], qubits[7]), cirq.CNOT(qubits[2], qubits[8])])
    return circuit

def shor_correct(circuit, qubits):
    """Implements error correction for Shor's 9-qubit code."""
    # Syndrome measurements for bit flip errors
    for i in range(0, 9, 3):
        ancilla = cirq.NamedQubit(f'a{i//3}')
        circuit.append(cirq.H(ancilla))
        circuit.append([cirq.CNOT(ancilla, q) for q in qubits[i:i+3]])
        circuit.append(cirq.H(ancilla))
        circuit.append(cirq.measure(ancilla, key=f'bit_syndrome_{i//3}'))
    
    # Syndrome measurements for phase flip errors
    phase_ancillas = [cirq.NamedQubit(f'p{i}') for i in range(3)]
    for i, anc in enumerate(phase_ancillas):
        circuit.append(cirq.H(anc))
        circuit.append([cirq.CNOT(anc, qubits[i+j*3]) for j in range(3)])
        circuit.append(cirq.H(anc))
        circuit.append(cirq.measure(anc, key=f'phase_syndrome_{i}'))
    
    # Note: In a full implementation, we'd apply corrections based on syndrome
    # measurements, but for simplicity we're just measuring syndromes
    
    return circuit

def run_shor_code(noise_prob=0.01):
    log = []
    log.append("=== Shor's Code Error Correction Simulation ===")

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

    # Convert the circuit to an SVG diagram
    circuit_svg = circuit_to_svg(circuit)

    return {
        'measurements': measurements,
        'circuit_svg': circuit_svg,     # <-- Return the SVG markup
        'log': "\n".join(log)
    }

if __name__ == '__main__':
    result = run_shor_code(noise_prob=0.02)
    print("Measurement results:", result['measurements'])
    print("\nCircuit SVG:\n", result['circuit_svg'])
    print("\nDetailed Log:\n", result['log'])
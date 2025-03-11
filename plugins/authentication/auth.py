"""
High-Fidelity Quantum Authentication using Cirq with Detailed Math Logging.

Generates a quantum fingerprint from input data by hashing the data and influencing the state preparation.
Deterministic seeding ensures reproducibility. Logs the entire process.
"""
import cirq
import hashlib
from cirq.contrib.svg import circuit_to_svg

def generate_quantum_fingerprint_cirq(data, num_qubits=4):
    log = []
    log.append("=== Quantum Authentication Simulation ===")
    
    # Generate deterministic hash from data
    hash_digest = hashlib.sha256(data.encode()).hexdigest()
    
    # Convert hash to binary and take first num_qubits bits
    binary_string = bin(int(hash_digest, 16))[2:].zfill(256)[:num_qubits]
    log.append(f"Data hash (binary): {binary_string}")
    
    # Create entangled state based on hash
    qubits = [cirq.NamedQubit(f"q{i}") for i in range(num_qubits)]
    circuit = cirq.Circuit()
    
    # Apply Hadamard to create superposition
    circuit.append([cirq.H(q) for q in qubits])
    
    # Entangle qubits based on hash
    for i in range(num_qubits-1):
        if binary_string[i] == '1':
            circuit.append(cirq.CNOT(qubits[i], qubits[i+1]))
            log.append(f"Bit {i}: '1' → Applied CNOT from q{i} to q{i+1}")
        else:
            log.append(f"Bit {i}: '0' → No CNOT applied")
    
    # Apply additional rotations based on hash
    for i, bit in enumerate(binary_string):
        if bit == '1':
            circuit.append(cirq.Z(qubits[i]))
            log.append(f"Applied Z rotation to q{i}")
    
    # Measure all qubits
    circuit.append([cirq.measure(q, key=f'm{i}') for i, q in enumerate(qubits)])
    
    # Use deterministic seed based on data for reproducibility
    seed = int(hashlib.sha256(data.encode()).hexdigest(), 16) % (2**32)
    simulator = cirq.Simulator(seed=seed)
    result = simulator.run(circuit, repetitions=1)
    
    # Collect measurements as fingerprint
    fingerprint = [int(result.measurements[f'm{i}'][0][0]) for i in range(num_qubits)]
    
    log.append(f"Final fingerprint: {fingerprint}")
    circuit_svg = circuit_to_svg(circuit)  # Add SVG visualization
    
    return {
        'fingerprint': fingerprint,
        'circuit_svg': circuit_svg,
        'log': "\n".join(log)
    }

def verify_fingerprint_cirq(data, fingerprint, num_qubits=4):
    """
    Verifies if a given fingerprint matches the one generated from data.
    
    Args:
        data: The input data string
        fingerprint: The fingerprint to verify
        num_qubits: Number of qubits used in the fingerprint
        
    Returns:
        Boolean indicating whether verification succeeded
    """
    result = generate_quantum_fingerprint_cirq(data, num_qubits)
    return result['fingerprint'] == fingerprint

if __name__ == '__main__':
    data = "example_user"
    result = generate_quantum_fingerprint_cirq(data, num_qubits=8)
    fingerprint = result['fingerprint']
    valid = verify_fingerprint_cirq(data, fingerprint, num_qubits=8)
    
    print("Cirq Authentication Fingerprint:", fingerprint)
    print("Verification:", valid)
    print("\nCircuit SVG:\n", result['circuit_svg'])
    print("\nDetailed Log:\n", result['log'])
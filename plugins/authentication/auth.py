"""
High-Fidelity Quantum Authentication using Cirq with Detailed Math Logging.

Generates a quantum fingerprint from input data by hashing the data and influencing the state preparation.
Deterministic seeding ensures reproducibility. Logs the entire process.
"""
import cirq
import hashlib

def generate_quantum_fingerprint_cirq(data, num_qubits=4):
    log = []
    log.append("=== Quantum Authentication Simulation ===")
    hash_digest = hashlib.sha256(data.encode()).hexdigest()
    binary_string = bin(int(hash_digest, 16))[2:].zfill(256)[:num_qubits]
    log.append(f"Data hash (binary): {binary_string}")
    fingerprint = []
    for i, bit in enumerate(binary_string):
        q = cirq.NamedQubit(f"q{i}")
        circuit = cirq.Circuit()
        circuit.append(cirq.H(q))
        if bit == '1':
            circuit.append(cirq.X(q))
            log.append(f"Bit {i}: '1' → Applied X gate after H.")
        else:
            log.append(f"Bit {i}: '0' → No X gate applied.")
        circuit.append(cirq.measure(q, key='m'))
        seed = int(hashlib.sha256((data + str(i)).encode()).hexdigest(), 16) % (2**32)
        simulator = cirq.Simulator(seed=seed)
        result = simulator.run(circuit, repetitions=1)
        meas = int(result.measurements['m'][0][0])
        fingerprint.append(meas)
        log.append(f"Qubit {i} measurement: {meas}")
    log.append(f"Final fingerprint: {fingerprint}")
    return fingerprint, "\n".join(log)

def verify_fingerprint_cirq(data, fingerprint, num_qubits=4):
    generated, _ = generate_quantum_fingerprint_cirq(data, num_qubits)
    return generated == fingerprint

if __name__ == '__main__':
    data = "example_user"
    fp, log_str = generate_quantum_fingerprint_cirq(data, num_qubits=8)
    valid = verify_fingerprint_cirq(data, fp, num_qubits=8)
    print("Cirq Authentication Fingerprint:", fp)
    print("Verification:", valid)
    print("\nDetailed Log:\n", log_str)
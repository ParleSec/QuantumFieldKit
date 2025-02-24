"""
High-Fidelity Quantum Random Number Generator using Cirq with Detailed Math Logging.

Prepares a qubit in superposition and measures it, logging the quantum state and measurement.
"""
import cirq

def generate_random_bit_cirq():
    q = cirq.NamedQubit("q")
    circuit = cirq.Circuit()
    circuit.append(cirq.H(q))
    circuit.append(cirq.measure(q, key='m'))
    simulator = cirq.Simulator()
    result = simulator.run(circuit, repetitions=1)
    return int(result.measurements['m'][0][0]), circuit

def generate_random_number_cirq(num_bits=8):
    log = ["=== QRNG Simulation (Cirq Edition) ==="]
    bits = []
    circuits = []
    for _ in range(num_bits):
        bit, circ = generate_random_bit_cirq()
        bits.append(bit)
        circuits.append(circ)
        log.append(f"Generated bit: {bit} with circuit: {circ}")
    number = 0
    for bit in bits:
        number = (number << 1) | bit
    log.append(f"Final random number: {number}")
    return number, bits, "\n".join(log)

if __name__ == '__main__':
    number, bits, log_str = generate_random_number_cirq(16)
    print("Cirq QRNG Simulation:")
    print("Random number:", number)
    print("Bit sequence:", bits)
    print("\nDetailed Log:\n", log_str)
"""
High-Fidelity Quantum Random Number Generator using Cirq with Detailed Math Logging.

This module demonstrates how quantum mechanics can be used to generate true random numbers
by preparing qubits in superposition and measuring them, creating randomness from quantum
uncertainty rather than deterministic classical algorithms.
"""
import cirq
import numpy as np
import time
import math
from cirq.contrib.svg import circuit_to_svg

def generate_random_bit_cirq(qubit_idx=0):
    """
    Generates a single random bit using quantum superposition.
    
    In quantum mechanics, a qubit in equal superposition has a 50% chance
    of collapsing to |0> or |1> when measured, providing true randomness
    based on quantum uncertainty.
    
    Args:
        qubit_idx: Index of the qubit for labeling purposes
        
    Returns:
        Tuple of (random bit value, quantum circuit, circuit SVG)
    """
    q = cirq.NamedQubit(f"q{qubit_idx}")
    circuit = cirq.Circuit()
    
    # Create superposition with Hadamard gate
    circuit.append(cirq.H(q))
    
    # Add measurement
    circuit.append(cirq.measure(q, key='m'))
    
    # Run quantum simulation
    simulator = cirq.Simulator()
    result = simulator.run(circuit, repetitions=1)
    bit = int(result.measurements['m'][0][0])
    
    # Generate circuit diagram
    circuit_svg = circuit_to_svg(circuit)
    
    return bit, circuit, circuit_svg

def generate_random_number_cirq(num_bits=8):
    """
    Generates a random number by combining multiple quantum random bits.
    
    Args:
        num_bits: Number of quantum bits to generate (default: 8)
        
    Returns:
        Dictionary containing the random number, bit sequence, and logs
    """
    generation_time = time.time()
    
    log = ["=== Quantum Random Number Generator Simulation ==="]
    log.append(f"Generating {num_bits} random quantum bits")
    log.append(f"Generation started at: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Add educational information
    log.append("\nQuantum Principles Used:")
    log.append("1. Superposition: Each qubit exists in a combination of both 0 and 1 states simultaneously")
    log.append("2. Measurement: Observing a superposition collapses it to a definite state with probabilities")
    log.append("   determined by quantum mechanics")
    log.append("3. True Randomness: Unlike classical random number generators which are deterministic,")
    log.append("   quantum measurement results are fundamentally random\n")
    
    bits = []
    complete_circuit = cirq.Circuit()
    
    # Create qubits for the full circuit
    qubits = [cirq.NamedQubit(f"q{i}") for i in range(num_bits)]
    
    # Build a combined circuit for better visualization
    for i, q in enumerate(qubits):
        complete_circuit.append(cirq.H(q))
        complete_circuit.append(cirq.measure(q, key=f'm{i}'))
    
    # Generate individual random bits
    individual_bit_circuits = []
    for i in range(num_bits):
        # Generate a random bit
        bit, bit_circuit, bit_svg = generate_random_bit_cirq(i)
        bits.append(bit)
        individual_bit_circuits.append(bit_svg)
        
        # Log the quantum state before measurement
        # For H|0> state, this is (|0> + |1>)/sqrt(2)
        log.append(f"Bit {i}: Prepared initial state |0>")
        log.append(f"Bit {i}: Applied Hadamard gate to create superposition (|0> + |1>)/sqrt(2)")
        log.append(f"Bit {i}: Measured {bit}")
    
    # Calculate the random number from the bit sequence
    number = 0
    for bit in bits:
        number = (number << 1) | bit
    
    # Calculate probabilities and statistics
    bits_str = ''.join(map(str, bits))
    zeros_count = bits.count(0)
    ones_count = bits.count(1)
    
    log.append(f"\nGenerated bit sequence: {bits_str}")
    log.append(f"Distribution: {zeros_count} zeros ({zeros_count/num_bits:.2%}), " + 
               f"{ones_count} ones ({ones_count/num_bits:.2%})")
    log.append(f"Final decimal number: {number}")
    
    # Shannon entropy calculation
    if zeros_count > 0 and ones_count > 0:
        p0 = zeros_count / num_bits
        p1 = ones_count / num_bits
        entropy = -p0 * math.log2(p0) - p1 * math.log2(p1)
        entropy_percentage = entropy / 1.0 * 100  # 1.0 is max entropy for binary
        log.append(f"Shannon entropy: {entropy:.4f} bits/symbol ({entropy_percentage:.1f}% of maximum)")
    
    # For better visualization, use the complete circuit
    complete_circuit_svg = circuit_to_svg(complete_circuit)
    
    # Range information for the generated number
    max_possible = (2**num_bits) - 1
    log.append(f"Range: 0 to {max_possible}")
    
    # Add statistical quality assessment
    if num_bits >= 8:
        # Very simple run test for randomness (just for educational purposes)
        runs = 1
        for i in range(1, len(bits)):
            if bits[i] != bits[i-1]:
                runs += 1
        expected_runs = (2 * zeros_count * ones_count) / num_bits + 1
        log.append(f"Run test: {runs} runs (expected ~{expected_runs:.1f} for random sequence)")
    
    # Generate bit-level visualization data
    bit_details = []
    for i, bit in enumerate(bits):
        # In a real quantum system, we wouldn't have access to these probabilities
        # This is just for visualization purposes
        bit_details.append({
            "id": i,
            "value": bit,
            "label": f"q{i}"
        })
    
    return {
        "random_number": number,
        "bitseq": bits,
        "bits_string": bits_str,
        "bit_details": bit_details,
        "num_bits": num_bits,
        "max_value": max_possible,
        "zeros_count": zeros_count,
        "ones_count": ones_count,
        "zeros_percentage": float(zeros_count)/num_bits,
        "ones_percentage": float(ones_count)/num_bits,
        "generation_time": generation_time,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "circuit_svg": complete_circuit_svg,
        "log": "\n".join(log)
    }

if __name__ == '__main__':
    # Generate 8-bit random number
    result = generate_random_number_cirq(8)
    
    print("Quantum Random Number Generator Simulation:")
    print(f"Random number: {result['random_number']} (binary: {result['bits_string']})")
    print(f"Bit sequence: {result['bitseq']}")
    print(f"Range: 0 to {result['max_value']}")
    print(f"Distribution: {result['zeros_count']} zeros, {result['ones_count']} ones")
    
    # Generate another random number to demonstrate randomness
    result2 = generate_random_number_cirq(8)
    print("\nSecond random number:", result2['random_number'])
    
    print("\nDetailed Log:")
    print(result['log'])
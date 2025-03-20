"""
High-Fidelity Quantum Fourier Transform Simulation using Google Cirq with Detailed Math Logging.

The Quantum Fourier Transform (QFT) is a quantum circuit that implements the discrete Fourier transform,
a fundamental building block for many quantum algorithms including Shor's factoring algorithm
and quantum phase estimation.
"""
import cirq
import numpy as np
import math
from cirq.contrib.svg import circuit_to_svg

def qft_circuit(qubits, inverse=False):
    """
    Constructs a circuit that performs the Quantum Fourier Transform (QFT)
    or its inverse (QFT†) on the given qubits.
    
    Args:
        qubits: List of qubits
        inverse: If True, constructs the inverse QFT
        
    Returns:
        A cirq.Circuit implementing the (inverse) QFT
    """
    n = len(qubits)
    circuit = cirq.Circuit()
    
    if inverse:
        # For inverse QFT, we reverse the operations and conjugate the phases
        # Process qubits in reverse order
        for i in range(n-1, -1, -1):
            # Apply H gate
            circuit.append(cirq.H(qubits[i]))
            
            # Apply controlled phase rotations with conjugated phases
            for j in range(i):
                k = i - j
                # Phase rotation by -2π/2^k
                circuit.append(cirq.CZPowGate(exponent=-1/(2**(k))).on(qubits[j], qubits[i]))
    else:
        # QFT algorithm
        for i in range(n):
            # Apply H gate
            circuit.append(cirq.H(qubits[i]))
            
            # Apply controlled phase rotations
            for j in range(i+1, n):
                k = j - i
                # Phase rotation by 2π/2^k
                circuit.append(cirq.CZPowGate(exponent=1/(2**(k))).on(qubits[i], qubits[j]))
    
    return circuit

def swap_register(qubits):
    """
    Creates a circuit that swaps the order of qubits, which is often done
    after QFT due to the way the transform is structured.
    
    Args:
        qubits: List of qubits
        
    Returns:
        A cirq.Circuit implementing the swap operations
    """
    n = len(qubits)
    circuit = cirq.Circuit()
    for i in range(n // 2):
        circuit.append(cirq.SWAP(qubits[i], qubits[n-i-1]))
    return circuit

def add_noise(circuit, noise_prob):
    """
    Adds realistic quantum noise to the circuit.
    
    Args:
        circuit: A Cirq circuit
        noise_prob: Probability of depolarizing noise
        
    Returns:
        A circuit with added noise operations
    """
    if noise_prob <= 0:
        return circuit
        
    noisy_ops = []
    for op in circuit.all_operations():
        noisy_ops.append(op)
        for q in op.qubits:
            noisy_ops.append(cirq.DepolarizingChannel(noise_prob).on(q))
    return cirq.Circuit(noisy_ops)

def binary_to_phase(binary_str):
    """
    Converts a binary string to a phase between 0 and 1.
    
    Args:
        binary_str: A string of '0's and '1's
        
    Returns:
        A float representing the phase
    """
    if not binary_str:
        return 0.0
    return sum(int(bit) * 2**(-i-1) for i, bit in enumerate(binary_str))

def run_qft(n_qubits=3, input_state='010', include_inverse=False, swap_qubits=True, noise_prob=0.0):
    """
    Runs the Quantum Fourier Transform on a specified input state.
    
    Args:
        n_qubits: Number of qubits
        input_state: Binary string representing the input state
        include_inverse: If True, runs QFT followed by inverse QFT
        swap_qubits: If True, includes qubit swapping for proper ordering
        noise_prob: Probability of depolarizing noise
        
    Returns:
        Dictionary with QFT results and visualization
    """
    log = []
    log.append("=== Quantum Fourier Transform Simulation ===")
    
    # Ensure input_state is the right length
    if len(input_state) < n_qubits:
        input_state = input_state.zfill(n_qubits)
    elif len(input_state) > n_qubits:
        input_state = input_state[-n_qubits:]
    
    log.append(f"Input state: |{input_state}⟩")
    log.append(f"Number of qubits: {n_qubits}")
    
    # Create qubits
    qubits = [cirq.NamedQubit(f'q{i}') for i in range(n_qubits)]
    
    # Create circuit
    circuit = cirq.Circuit()
    
    # Prepare input state
    for i, bit in enumerate(input_state):
        if bit == '1':
            circuit.append(cirq.X(qubits[i]))
    log.append("Prepared input state")
    
    # Record state before QFT for verification
    simulator = cirq.Simulator()
    initial_state = simulator.simulate(circuit).final_state_vector
    log.append(f"Initial state vector shape: {initial_state.shape}")
    
    # Apply QFT
    qft = qft_circuit(qubits)
    circuit.append(qft)
    log.append("Applied Quantum Fourier Transform")
    
    # Apply qubit swapping if requested
    if swap_qubits:
        swap = swap_register(qubits)
        circuit.append(swap)
        log.append("Applied qubit swapping for proper ordering")
    
    # Record state after QFT
    qft_state = simulator.simulate(circuit).final_state_vector
    
    # Apply inverse QFT if requested
    if include_inverse:
        inverse_qft = qft_circuit(qubits, inverse=True)
        circuit.append(inverse_qft)
        log.append("Applied Inverse Quantum Fourier Transform")
        
        # Apply qubit swapping again if needed
        if swap_qubits:
            swap = swap_register(qubits)
            circuit.append(swap)
            log.append("Applied qubit swapping again for proper ordering")
    
    # Add noise if specified
    if noise_prob > 0:
        circuit = add_noise(circuit, noise_prob)
        log.append(f"Added noise with probability {noise_prob}")
    
    # Add measurements
    circuit.append(cirq.measure(*qubits, key='result'))
    
    # Run the circuit
    result = simulator.run(circuit, repetitions=1)
    
    # Process the measurement results
    measurements = result.measurements['result'][0]
    measured_state = ''.join([str(bit) for bit in measurements])
    
    log.append(f"Measured state: |{measured_state}⟩")
    
    # Generate circuit SVG for visualization
    circuit_svg = circuit_to_svg(circuit)
    
    # Provide theoretical explanation of the QFT output
    if not include_inverse:
        # Convert input to phase for a conceptual explanation
        input_decimal = int(input_state, 2)
        phase = input_decimal / (2**n_qubits)
        log.append(f"\nTheoretically, the QFT transforms |{input_state}⟩ (decimal {input_decimal}) into a superposition where:")
        log.append(f"- The phase of the superposition encodes the value {phase}")
        log.append("- This is equivalent to a complex-valued wave with frequency corresponding to the input number")
    else:
        if measured_state == input_state:
            log.append("\nThe inverse QFT successfully recovered the original input state")
        else:
            log.append(f"\nThe inverse QFT produced |{measured_state}⟩, which does not match the input |{input_state}⟩")
            log.append("This is likely due to the introduced noise or measurement randomness")
    
    # Return results
    return {
        "n_qubits": n_qubits,
        "input_state": input_state,
        "measured_state": measured_state,
        "include_inverse": include_inverse,
        "swap_qubits": swap_qubits,
        "noise_prob": noise_prob,
        "circuit_svg": circuit_svg,
        "log": "\n".join(log)
    }

if __name__ == '__main__':
    # Run QFT examples
    qft_only = run_qft(3, input_state='101', include_inverse=False)
    qft_inverse = run_qft(3, input_state='110', include_inverse=True)
    qft_noisy = run_qft(3, input_state='111', include_inverse=True, noise_prob=0.01)
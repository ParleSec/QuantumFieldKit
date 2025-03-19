"""
High-Fidelity Quantum Phase Estimation Simulation using Google Cirq with Detailed Math Logging.

Quantum Phase Estimation (QPE) is a quantum algorithm used to estimate the eigenphase of an
eigenvector of a unitary operator. It is a critical subroutine in many quantum algorithms including
Shor's algorithm and HHL algorithm for linear systems.
"""
import cirq
import numpy as np
import math
from cirq.contrib.svg import circuit_to_svg

def inverse_qft_circuit(qubits):
    """
    Constructs a circuit that performs the inverse Quantum Fourier Transform (QFT†).
    
    Args:
        qubits: List of qubits
        
    Returns:
        A cirq.Circuit implementing the inverse QFT
    """
    n = len(qubits)
    circuit = cirq.Circuit()
    
    # Process qubits in reverse order for inverse QFT
    for i in range(n-1, -1, -1):
        # Apply H gate
        circuit.append(cirq.H(qubits[i]))
        
        # Apply controlled phase rotations with conjugated phases
        for j in range(i):
            k = i - j
            # Phase rotation by -2π/2^k
            circuit.append(cirq.CZPowGate(exponent=-1/(2**(k))).on(qubits[j], qubits[i]))
    
    return circuit

def controlled_unitary(control, target, phase_angle):
    """
    Creates a controlled unitary operation for a given phase angle.
    
    Args:
        control: Control qubit
        target: Target qubit
        phase_angle: Phase angle (in radians)
        
    Returns:
        A cirq.Circuit implementing the controlled unitary
    """
    # For simplicity, we use controlled phase rotations
    # In a real QPE, this would be a controlled version of the unitary operator
    return cirq.Circuit([
        cirq.CZPowGate(exponent=phase_angle/(2*math.pi)).on(control, target)
    ])

def phase_estimation_circuit(phase_qubits, target_qubit, phase_angle, precision_bits):
    """
    Constructs a circuit that performs Quantum Phase Estimation.
    
    Args:
        phase_qubits: Qubits used for phase estimation
        target_qubit: Qubit that is an eigenstate of the unitary operator
        phase_angle: True phase angle to estimate (in radians)
        precision_bits: Number of bits of precision
        
    Returns:
        A cirq.Circuit implementing QPE
    """
    n = len(phase_qubits)
    circuit = cirq.Circuit()
    
    # Step 1: Initialize target qubit to the eigenstate of the unitary
    # For a phase gate, |1⟩ is an eigenstate
    circuit.append(cirq.X(target_qubit))
    
    # Step 2: Apply Hadamard gates to create superposition of phase qubits
    circuit.append(cirq.H.on_each(*phase_qubits))
    
    # Step 3: Apply controlled unitary operations
    for i, qubit in enumerate(phase_qubits):
        # Apply U^(2^i) controlled by the i-th qubit
        power = 2**(n-i-1)  # Powers decrease from most significant to least
        for _ in range(power):
            circuit.append(controlled_unitary(qubit, target_qubit, phase_angle))
    
    # Step 4: Apply inverse QFT to the phase register
    circuit.append(inverse_qft_circuit(phase_qubits))
    
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

def phase_to_binary(phase, precision_bits):
    """
    Converts a phase between 0 and 1 to a binary string.
    
    Args:
        phase: A float between 0 and 1
        precision_bits: Number of binary digits to include
        
    Returns:
        A binary string representation
    """
    binary = ""
    for i in range(precision_bits):
        phase *= 2
        bit = int(phase)
        binary += str(bit)
        phase -= bit
    return binary

def run_phase_estimation(precision_bits=3, target_phase=0.125, noise_prob=0.0):
    """
    Runs the Quantum Phase Estimation algorithm.
    
    Args:
        precision_bits: Number of bits of precision
        target_phase: True phase to estimate (between 0 and 1)
        noise_prob: Probability of depolarizing noise
        
    Returns:
        Dictionary with QPE results and visualization
    """
    log = []
    log.append("=== Quantum Phase Estimation Simulation ===")
    
    # Validate target phase
    target_phase = max(0.0, min(1.0, target_phase))
    phase_angle = 2 * math.pi * target_phase
    log.append(f"Target phase: {target_phase} (fraction of 2π)")
    log.append(f"Phase angle: {phase_angle} radians")
    
    # Create qubits
    phase_qubits = [cirq.NamedQubit(f'p{i}') for i in range(precision_bits)]
    target_qubit = cirq.NamedQubit('t')
    
    # Create circuit
    circuit = phase_estimation_circuit(phase_qubits, target_qubit, phase_angle, precision_bits)
    log.append(f"Created QPE circuit with {precision_bits} precision qubits")
    
    # Add noise if specified
    if noise_prob > 0:
        circuit = add_noise(circuit, noise_prob)
        log.append(f"Added noise with probability {noise_prob}")
    
    # Add measurements
    measure_circuit = cirq.Circuit()
    measure_circuit.append(cirq.measure(*phase_qubits, key='phase'))
    
    # Combine circuits
    full_circuit = circuit + measure_circuit
    
    # Run the circuit
    simulator = cirq.Simulator()
    result = simulator.run(full_circuit, repetitions=1)
    
    # Process the measurement results
    measurements = result.measurements['phase'][0]
    measured_state = ''.join([str(bit) for bit in measurements])
    
    # Convert binary result to phase
    estimated_phase = binary_to_phase(measured_state)
    phase_error = abs(estimated_phase - target_phase)
    
    log.append(f"Measured state: |{measured_state}⟩")
    log.append(f"Estimated phase: {estimated_phase}")
    log.append(f"Absolute error: {phase_error}")
    
    # Generate circuit SVG for visualization
    circuit_svg = circuit_to_svg(full_circuit)
    
    # Theoretical analysis
    expected_accuracy = 1 / (2**precision_bits)
    log.append(f"\nTheoretical Notes:")
    log.append(f"- With {precision_bits} qubits, we expect accuracy of approximately {expected_accuracy}")
    log.append(f"- Theoretical best binary approximation with {precision_bits} bits: {phase_to_binary(target_phase, precision_bits)}")
    log.append(f"- Corresponding phase: {binary_to_phase(phase_to_binary(target_phase, precision_bits))}")
    
    if noise_prob > 0:
        log.append(f"- Noise will reduce accuracy, with more effect on higher-precision bits")
    
    # Return results
    return {
        "precision_bits": precision_bits,
        "target_phase": target_phase,
        "measured_state": measured_state,
        "estimated_phase": float(estimated_phase),
        "phase_error": float(phase_error),
        "theoretical_accuracy": float(expected_accuracy),
        "noise_prob": noise_prob,
        "circuit_svg": circuit_svg,
        "log": "\n".join(log)
    }

if __name__ == '__main__':
    # Run QPE examples
    qpe_simple = run_phase_estimation(3, 0.125)  # 1/8 = 0.001 in binary
    qpe_complex = run_phase_estimation(5, 0.3)    # 0.3 is not precisely representable in binary
    qpe_noisy = run_phase_estimation(4, 0.25, 0.01)  # 1/4 = 0.01 in binary, with noise
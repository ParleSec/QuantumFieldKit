"""
High-Fidelity Quantum Handshake Simulation using Google Cirq with Detailed Math Logging.

Creates an entangled Bell pair and logs the operations and measurements for authentication.
Demonstrates quantum entanglement properties for secure handshake protocols.
"""
import cirq
import numpy as np
from cirq.contrib.svg import circuit_to_svg

def add_noise(circuit, noise_prob):
    """
    Adds realistic quantum noise to the circuit.
    
    Args:
        circuit: A Cirq circuit
        noise_prob: Probability of depolarizing noise
        
    Returns:
        A circuit with added noise operations
    """
    noisy_ops = []
    for op in circuit.all_operations():
        noisy_ops.append(op)
        for q in op.qubits:
            noisy_ops.append(cirq.DepolarizingChannel(noise_prob).on(q))
    return cirq.Circuit(noisy_ops)

def handshake_cirq(noise_prob=0.0):
    """
    Simulates a quantum handshake protocol using Bell pairs.
    
    In a quantum handshake:
    1. Two parties create a shared entangled state (Bell pair)
    2. They measure their qubits and check for correlation
    3. If measurements are perfectly correlated, the handshake is successful
    4. Any eavesdropping would disturb the entanglement and be detected
    
    Args:
        noise_prob: Probability of depolarizing noise
        
    Returns:
        Dictionary with handshake results and log
    """
    log = []
    log.append("=== Quantum Handshake Simulation ===")
    
    # Create qubits for Alice and Bob
    q_alice, q_bob = cirq.LineQubit.range(2)
    circuit = cirq.Circuit()
    
    # Create Bell pair |Φ+⟩ = (|00⟩ + |11⟩)/√2
    log.append("Creating Bell pair |Φ+⟩ = (|00⟩ + |11⟩)/√2")
    circuit.append([cirq.H(q_alice), cirq.CNOT(q_alice, q_bob)])
    log.append("Applied H gate to Alice's qubit.")
    log.append("Applied CNOT gate with Alice's qubit as control and Bob's qubit as target.")
    
    # Simulate the quantum state before measurement
    simulator = cirq.Simulator()
    state_vector = simulator.simulate(circuit).final_state_vector
    log.append(f"Bell state before measurement: {np.round(state_vector, 3)}")
    
    # Add optional noise (simulates channel noise or eavesdropping)
    if noise_prob > 0:
        circuit = add_noise(circuit, noise_prob)
        log.append(f"Noise added with probability {noise_prob}.")
        # Recalculate state after noise
        noisy_state = simulator.simulate(circuit).final_state_vector
        log.append(f"State after noise: {np.round(noisy_state, 3)}")
    
    # Add measurements
    circuit.append([cirq.measure(q_alice, key='alice'), 
                    cirq.measure(q_bob, key='bob')])
    log.append("Measuring both qubits.")
    
    # Run the circuit
    result = simulator.run(circuit, repetitions=1)
    alice_result = int(result.measurements['alice'][0][0])
    bob_result = int(result.measurements['bob'][0][0])
    
    log.append(f"Alice measured: {alice_result}")
    log.append(f"Bob measured: {bob_result}")
    
    # Determine if handshake was successful (measurements should match)
    handshake_success = (alice_result == bob_result)
    log.append(f"Handshake success: {handshake_success}")
    
    # Generate circuit diagram for visualization
    circuit_svg = circuit_to_svg(circuit)
    
    # Calculate correlation probability
    ideal_correlation_prob = 1.0
    actual_correlation_prob = 1.0 - noise_prob  # Simplified model
    log.append(f"Theoretical correlation probability: {actual_correlation_prob:.4f}")
    
    return {
        'alice_result': alice_result, 
        'bob_result': bob_result, 
        'handshake_success': handshake_success,
        'correlation_probability': actual_correlation_prob,
        'circuit_svg': circuit_svg,
        'final_state': state_vector.tolist(),
        'log': "\n".join(log)
    }

if __name__ == '__main__':
    # Run with no noise
    result = handshake_cirq(noise_prob=0.0)
    print("Quantum Handshake Simulation (No Noise):")
    print(f"Handshake successful: {result['handshake_success']}")
    print(f"Alice measured: {result['alice_result']}, Bob measured: {result['bob_result']}")
    
    # Run with some noise to show effect
    noisy_result = handshake_cirq(noise_prob=0.2)
    print("\nQuantum Handshake Simulation (With Noise):")
    print(f"Handshake successful: {noisy_result['handshake_success']}")
    print(f"Alice measured: {noisy_result['alice_result']}, Bob measured: {noisy_result['bob_result']}")
    
    print("\nDetailed Log:")
    print(result['log'])
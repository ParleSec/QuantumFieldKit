"""
High-Fidelity Quantum Communication Network Simulation using Cirq with Detailed Math Logging.

Simulates entanglement swapping by creating two Bell pairs, performing a Bell measurement,
and logging the intermediate and final measurement outcomes. This demonstrates how
entanglement can be extended across a network without direct interaction between end nodes.
"""
import cirq
import numpy as np
from cirq.contrib.svg import circuit_to_svg

def add_noise(circuit, noise_prob):
    """Add depolarizing noise to all qubits after each operation."""
    noisy_ops = []
    for op in circuit.all_operations():
        noisy_ops.append(op)
        for q in op.qubits:
            noisy_ops.append(cirq.DepolarizingChannel(noise_prob).on(q))
    return cirq.Circuit(noisy_ops)

def entanglement_swapping_cirq(noise_prob=0.0):
    """
    Simulates quantum entanglement swapping for a quantum repeater network.
    
    Entanglement swapping allows two parties who have never interacted to become
    entangled through an intermediate node:
    
    1. Node A and B share entangled qubits q0-q1
    2. Node B and C share entangled qubits q2-q3
    3. Node B performs a Bell measurement on q1 and q2
    4. Based on B's measurement, q0 and q3 become entangled
    
    Args:
        noise_prob: Probability of depolarizing noise
        
    Returns:
        Dictionary with measurement results and log
    """
    log = []
    log.append("=== Entanglement Swapping Simulation ===")
    
    # Create 4 qubits representing:
    # q0: Node A's qubit
    # q1: Node B's first qubit (shared with A)
    # q2: Node B's second qubit (shared with C)
    # q3: Node C's qubit
    q0, q1, q2, q3 = cirq.LineQubit.range(4)
    
    circuit = cirq.Circuit()
    
    # Step 1: Create Bell pair between Node A and B (q0-q1)
    log.append("Creating Bell pair between Node A (q0) and Node B (q1).")
    circuit.append([cirq.H(q0), cirq.CNOT(q0, q1)])
    
    # Step 2: Create Bell pair between Node B and C (q2-q3)
    log.append("Creating Bell pair between Node B (q2) and Node C (q3).")
    circuit.append([cirq.H(q2), cirq.CNOT(q2, q3)])
    
    # Get state after Bell pair creation
    simulator = cirq.Simulator()
    initial_state = simulator.simulate(circuit).final_state_vector
    log.append(f"State after creating Bell pairs: {np.round(initial_state[:4], 3)}")
    
    # Add noise if specified
    if noise_prob > 0:
        circuit = add_noise(circuit, noise_prob)
        log.append(f"Noise added with probability {noise_prob}.")
    
    # Step 3: Node B performs Bell measurement on q1 and q2
    log.append("Node B performing Bell measurement on q1 and q2.")
    circuit.append(cirq.CNOT(q1, q2))
    circuit.append(cirq.H(q1))
    
    # Measure the middle qubits
    circuit.append([cirq.measure(q1, key='m1'), cirq.measure(q2, key='m2')])
    
    # Run simulation to get intermediate measurement
    intermediate_result = simulator.run(circuit, repetitions=1)
    m1 = int(intermediate_result.measurements['m1'][0][0])
    m2 = int(intermediate_result.measurements['m2'][0][0])
    
    log.append(f"Node B's measurement results: m1={m1}, m2={m2}")
    
    # Step 4: Conditional operations on q3 based on Bell measurement
    correction_circuit = cirq.Circuit()
    
    if m1 == 1:
        correction_circuit.append(cirq.Z(q3))
        log.append("Applying Z correction to Node C's qubit (q3).")
        
    if m2 == 1:
        correction_circuit.append(cirq.X(q3))
        log.append("Applying X correction to Node C's qubit (q3).")
    
    # Measure the end nodes to verify entanglement
    correction_circuit.append([cirq.measure(q0, key='m0'), cirq.measure(q3, key='m3')])
    
    # Combine circuits
    full_circuit = circuit + correction_circuit
    
    # Run final simulation
    final_result = simulator.run(full_circuit, repetitions=1)
    
    m0 = int(final_result.measurements['m0'][0][0])
    m3 = int(final_result.measurements['m3'][0][0])
    
    log.append(f"Node A's measurement (q0): {m0}")
    log.append(f"Node C's measurement (q3): {m3}")
    
    # In ideal entanglement swapping, these measurements should be correlated
    entanglement_success = (m0 == m3) if m1 == 0 else (m0 != m3)
    log.append(f"Entanglement swapping successful: {entanglement_success}")
    
    # Generate SVG diagram for visualization
    circuit_svg = circuit_to_svg(full_circuit)
    
    return {
        'intermediate_measurements': (m1, m2),
        'node_A_measurement': m0,
        'node_C_measurement': m3,
        'entanglement_success': entanglement_success,
        'circuit_svg': circuit_svg,
        'log': "\n".join(log)
    }

if __name__ == '__main__':
    # Run simulation
    result = entanglement_swapping_cirq(noise_prob=0.0)
    print("Quantum Entanglement Swapping Simulation:")
    print(f"Node B's Bell measurement: {result['intermediate_measurements']}")
    print(f"Node A measured: {result['node_A_measurement']}")
    print(f"Node C measured: {result['node_C_measurement']}")
    print(f"Entanglement swapping successful: {result['entanglement_success']}")
    
    # Run with noise
    noisy_result = entanglement_swapping_cirq(noise_prob=0.1)
    print("\nWith noise:")
    print(f"Entanglement swapping successful: {noisy_result['entanglement_success']}")
    
    print("\nDetailed Log:")
    print(result['log'])
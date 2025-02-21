"""
Quantum Communication Network Simulation Module

This module simulates a simple network scenario using entanglement swapping.
For example, nodes A and B share an entangled pair, as do nodes B and C.
Node B performs a measurement (simulated as a Bell measurement), resulting in nodes A and C becoming entangled.
"""

import random
from core.qubit import Qubit

def create_entangled_pair():
    """
    Create an entangled pair for network simulation.
    For simplicity, randomly choose an outcome and create two qubits sharing that outcome.
    """
    outcome = random.choice([0, 1])
    q1 = Qubit([1.0, 0.0]) if outcome == 0 else Qubit([0.0, 1.0])
    q2 = Qubit([1.0, 0.0]) if outcome == 0 else Qubit([0.0, 1.0])
    return q1, q2

def entanglement_swapping():
    """
    Simulate entanglement swapping between three nodes: A, B, and C.
    A and B share an entangled pair; B and C share another.
    A Bell measurement at node B (simulated) causes nodes A and C to become entangled.
    """
    # Create entangled pairs for A-B and B-C.
    qA, qB1 = create_entangled_pair()
    qB2, qC = create_entangled_pair()
    # Simulate a Bell measurement at node B on qB1 and qB2.
    classical_bits = (random.randint(0, 1), random.randint(0, 1))
    # For simulation, set nodes A and C to a correlated state.
    swapped_outcome = random.choice([0, 1])
    qA.state = [1.0, 0.0] if swapped_outcome == 0 else [0.0, 1.0]
    qC.state = [1.0, 0.0] if swapped_outcome == 0 else [0.0, 1.0]
    return {
        'classical_bits': classical_bits,
        'node_A_state': qA.state,
        'node_C_state': qC.state
    }

if __name__ == '__main__':
    result = entanglement_swapping()
    print("Quantum Communication Network (Entanglement Swapping) Simulation Result:")
    print("Classical bits from swapping:", result['classical_bits'])
    print("Node A state:", result['node_A_state'])
    print("Node C state:", result['node_C_state'])

"""
Quantum Teleportation Simulation Module

This module simulates the quantum teleportation protocol.
Alice has an unknown qubit state and shares an entangled pair with Bob.
She performs a Bell measurement on her unknown qubit and her half of the entangled pair,
then sends the classical bits to Bob, who applies corrections.
After corrections, Bob's qubit is measured to collapse it into a classical basis state.
"""

import random
import math
from core.qubit import Qubit

def create_bell_pair():
    """
    Simulate creation of a Bell pair (entangled pair in the state (|00> + |11>)/sqrt2).
    Here, we use a simplified simulation: we create two qubits and assign a flag to indicate entanglement.
    """
    q1 = Qubit()
    q2 = Qubit()
    q1.apply_hadamard()
    # In a full simulation, a CNOT would entangle the qubits.
    # For our simulation, we simply note that they are entangled.
    q1.entangled_with = q2
    q2.entangled_with = q1
    return q1, q2

def bell_measurement(q_unknown, q_alice):
    """
    Simulate a Bell state measurement on two qubits.
    Returns two classical bits (simulated as random bits).
    """
    return random.randint(0, 1), random.randint(0, 1)

def apply_correction(q_bob, classical_bits):
    """
    Apply corrections to Bob's qubit based on the classical bits received.
    For simulation:
      - If classical_bits[0] is 1, apply Pauli-X.
      - If classical_bits[1] is 1, apply Pauli-Z.
    """
    from core.gates import pauli_x, pauli_z
    bit1, bit2 = classical_bits
    if bit1 == 1:
        pauli_x(q_bob)
    if bit2 == 1:
        pauli_z(q_bob)
    return q_bob

def teleport(q_unknown):
    """
    Simulate the quantum teleportation protocol.
    :param q_unknown: The Qubit to be teleported.
    :return: A dictionary with the classical bits and Bob's qubit state after correction.
    """
    # Create an entangled pair between Alice and Bob.
    q_alice, q_bob = create_bell_pair()
    # Alice performs a Bell measurement on her unknown qubit and her half of the Bell pair.
    classical_bits = bell_measurement(q_unknown, q_alice)
    # Simulate classical communication: Bob applies corrections based on the measurement.
    q_bob = apply_correction(q_bob, classical_bits)
    # Collapse Bob's qubit state by measuring it, ensuring a basis state outcome.
    q_bob.measure()
    return {
        'classical_bits': classical_bits,
        'bob_state': q_bob.state
    }

if __name__ == '__main__':
    # Prepare an unknown qubit state, e.g., |ψ> = (sqrt(3)/2)|0> + (1/2)|1>
    q_unknown = Qubit([math.sqrt(3)/2, 1/2])
    result = teleport(q_unknown)
    print("Quantum Teleportation Simulation Result:")
    print("Classical bits sent:        ", result['classical_bits'])
    print("Bob's qubit state after teleportation:", result['bob_state'])

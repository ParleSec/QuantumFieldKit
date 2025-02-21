"""
Quantum Handshake Simulation Module

This module simulates a quantum handshake where two parties (Alice and Bob)
share an entangled pair. Each measures their qubit, and if the results are
correlated (i.e. identical), the handshake is considered successful.
"""

import random
from core.qubit import Qubit

def create_entangled_pair():
    """
    Simulate the creation of an entangled pair.
    For simulation, randomly choose an outcome and create two qubits that share it.
    """
    outcome = random.choice([0, 1])
    q1 = Qubit([1.0, 0.0]) if outcome == 0 else Qubit([0.0, 1.0])
    q2 = Qubit([1.0, 0.0]) if outcome == 0 else Qubit([0.0, 1.0])
    return q1, q2

def perform_handshake():
    """
    Simulate a quantum handshake between two parties.
    Returns the measurement results and whether the handshake was successful.
    """
    alice_qubit, bob_qubit = create_entangled_pair()
    alice_result = alice_qubit.measure()
    bob_result = bob_qubit.measure()
    handshake_success = (alice_result == bob_result)
    return {
        'alice_result': alice_result,
        'bob_result': bob_result,
        'handshake_success': handshake_success
    }

if __name__ == '__main__':
    result = perform_handshake()
    print("Quantum Handshake Simulation Result:")
    print("Alice measurement:", result['alice_result'])
    print("Bob measurement:  ", result['bob_result'])
    print("Handshake success:", result['handshake_success'])

"""
BB84 Protocol Simulation Module

This module simulates the BB84 quantum key distribution protocol.
Alice prepares qubits using a random bit and random basis.
Bob measures each qubit in his randomly chosen basis.
Afterward, they sift the results (keep only those with matching bases) to form a shared key.
"""

import random
import math
from core.qubit import Qubit

def prepare_qubit(bit, basis):
    """
    Prepare a qubit in a given basis.
    :param bit: 0 or 1.
    :param basis: 'standard' or 'hadamard'.
    :return: A Qubit object prepared in the specified state.
    """
    if basis == 'standard':
        state = [1.0, 0.0] if bit == 0 else [0.0, 1.0]
        return Qubit(state)
    elif basis == 'hadamard':
        # Prepare qubit in Hadamard basis: start with |0>, apply Hadamard, then optionally flip phase.
        q = Qubit()
        q.apply_hadamard()
        if bit == 1:
            # Applying a phase flip converts |+> to |-> in our simulation.
            from core.gates import pauli_z
            pauli_z(q)
        return q
    else:
        raise ValueError("Invalid basis specified.")

def measure_qubit(qubit, basis):
    """
    Measure a qubit in a given basis.
    If 'hadamard', apply a Hadamard gate before measurement.
    :param qubit: The Qubit to measure.
    :param basis: 'standard' or 'hadamard'.
    :return: The measurement outcome (0 or 1).
    """
    if basis == 'hadamard':
        # Clone the qubit state to avoid collapsing the original state prematurely.
        q = Qubit(qubit.state)
        q.apply_hadamard()
        return q.measure()
    elif basis == 'standard':
        return qubit.measure()
    else:
        raise ValueError("Invalid basis specified.")

def run_bb84_protocol(num_bits=10):
    """
    Run a simulation of the BB84 protocol.
    :param num_bits: Number of qubits/bits to be exchanged.
    :return: Dictionary with Alice's bits, bases; Bob's bases, measurements; and the shared key.
    """
    alice_bits = [random.randint(0, 1) for _ in range(num_bits)]
    alice_bases = [random.choice(['standard', 'hadamard']) for _ in range(num_bits)]
    bob_bases = [random.choice(['standard', 'hadamard']) for _ in range(num_bits)]

    alice_qubits = [prepare_qubit(bit, basis) for bit, basis in zip(alice_bits, alice_bases)]
    bob_measurements = [measure_qubit(q, b_basis) for q, b_basis in zip(alice_qubits, bob_bases)]

    # Sifting: Keep bits where Alice and Bob used the same basis.
    shared_key = []
    for a_bit, a_basis, b_basis, b_measure in zip(alice_bits, alice_bases, bob_bases, bob_measurements):
        if a_basis == b_basis:
            shared_key.append(a_bit)
    return {
        'alice_bits': alice_bits,
        'alice_bases': alice_bases,
        'bob_bases': bob_bases,
        'bob_measurements': bob_measurements,
        'shared_key': shared_key
    }

if __name__ == '__main__':
    result = run_bb84_protocol(20)
    print("BB84 Simulation Result:")
    print("Alice bits:      ", result['alice_bits'])
    print("Alice bases:     ", result['alice_bases'])
    print("Bob bases:       ", result['bob_bases'])
    print("Bob measurements:", result['bob_measurements'])
    print("Shared key:      ", result['shared_key'])

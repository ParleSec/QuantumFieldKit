"""
Quantum Authentication Simulation Module

This module simulates quantum fingerprinting for authentication.
It generates a fingerprint from user data by hashing the data and using the hash
to influence quantum measurements. For testing purposes, the randomness is
made deterministic by seeding a local random generator with the input data.
The fingerprint is then used for verification.
"""

import hashlib
import random
import math
from core.qubit import Qubit

def generate_quantum_fingerprint(data, num_qubits=4):
    """
    Generate a quantum fingerprint from the input data.
    The randomness during measurement is seeded deterministically based on the input data.
    
    :param data: Input string (e.g., username).
    :param num_qubits: Number of qubits/bits to generate for the fingerprint.
    :return: A list representing the quantum fingerprint.
    """
    # Hash the data to produce a consistent binary string.
    hash_digest = hashlib.sha256(data.encode()).hexdigest()
    # Convert hash to binary and take the first num_qubits bits.
    binary_string = bin(int(hash_digest, 16))[2:].zfill(256)[:num_qubits]
    
    # Create a local random generator seeded with the input data to ensure determinism.
    local_random = random.Random(data)
    
    fingerprint = []
    for bit in binary_string:
        # Prepare a qubit in superposition.
        q = Qubit()
        q.apply_hadamard()
        if bit == '1':
            from core.gates import pauli_x
            pauli_x(q)
        # Temporarily override random.random with the local random instance.
        original_random = random.random
        random.random = local_random.random
        measure_result = q.measure()
        random.random = original_random
        fingerprint.append(measure_result)
    return fingerprint

def verify_fingerprint(data, fingerprint, num_qubits=4):
    """
    Verify that the fingerprint generated from the data matches the provided fingerprint.
    
    :param data: Input string to verify.
    :param fingerprint: The fingerprint to compare against.
    :param num_qubits: Number of qubits used in fingerprinting.
    :return: True if fingerprints match; otherwise, False.
    """
    generated_fp = generate_quantum_fingerprint(data, num_qubits)
    return generated_fp == fingerprint

if __name__ == '__main__':
    user_data = "example_user"
    fingerprint = generate_quantum_fingerprint(user_data, num_qubits=8)
    is_valid = verify_fingerprint(user_data, fingerprint, num_qubits=8)
    print("Generated fingerprint:", fingerprint)
    print("Verification result:", is_valid)

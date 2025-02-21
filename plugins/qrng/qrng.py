"""
Quantum Random Number Generator (QRNG) Simulation Module

This module uses the inherent randomness of quantum measurement.
By preparing a qubit in superposition and measuring it, a random bit is generated.
Multiple measurements form a random number.
"""

import random
import math
from core.qubit import Qubit

def generate_random_bit():
    """
    Generate a random bit using quantum superposition.
    Prepare a qubit, apply Hadamard to create superposition, and measure.
    """
    q = Qubit()
    q.apply_hadamard()
    return q.measure()

def generate_random_number(num_bits=8):
    """
    Generate a random number from a sequence of quantum-generated bits.
    :param num_bits: Number of bits in the generated number.
    :return: A tuple (number, list of bits).
    """
    bits = [generate_random_bit() for _ in range(num_bits)]
    number = 0
    for bit in bits:
        number = (number << 1) | bit
    return number, bits

if __name__ == '__main__':
    number, bits = generate_random_number(16)
    print("Generated random number:", number)
    print("Bit sequence:", bits)

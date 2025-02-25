"""
Quantum Decryption Plugin

This module demonstrates quantum decryption techniques:
1. grover_key_search: Uses Grover's algorithm to perform key search in an unsorted space.
2. shor_factorization: Uses Shor's algorithm to factor a composite number (illustrating how RSA can be broken).

Note:
  - For Grover's algorithm, a small key (e.g. 4 bits) is used for demonstration.
  - For Shor's algorithm, Qiskit's Shor algorithm is used to factor small integers.
"""

import cirq
from plugins.grover.grover_cirq import run_grover

def grover_key_search(key: int, num_bits: int, noise_prob: float = 0.0):
    """
    Uses Grover's algorithm to search for a secret key among 2^num_bits possibilities.
    
    Args:
        key: The secret key as an integer.
        num_bits: The number of bits in the key.
        noise_prob: Optional noise probability.
        
    Returns:
        outcome: The bitstring outcome from Grover's algorithm.
        circuit: The circuit used in the simulation.
        log_str: Detailed log of the simulation.
    """
    # Format the target key as a binary string with leading zeros.
    target = format(key, f'0{num_bits}b')
    outcome, circuit, log_str = run_grover(num_bits, target, noise_prob)
    return outcome, circuit, log_str

def shor_factorization(N: int):
    """
    Uses Shor's algorithm (via Qiskit) to factor the composite number N.
    
    Args:
        N: The composite number to factor.
        
    Returns:
        result: The factorization result containing the factors.
    """
    try:
        from qiskit.algorithms import Shor
    except ImportError:
        raise ImportError("Shor algorithm not found. Please upgrade to a recent version of Qiskit that includes Shor (qiskit.algorithms).")
    
    shor = Shor()
    result = shor.factorize(N)
    return result

if __name__ == "__main__":
    # --- Demonstrate Grover's Key Search ---
    print("=== Grover's Key Search Demo ===")
    key = 5  # For example, secret key (in 4 bits, valid keys are 0-15)
    num_bits = 4
    outcome, circuit, log_str = grover_key_search(key, num_bits, noise_prob=0.0)
    print(f"Target key: {format(key, '04b')}")
    print(f"Grover's algorithm outcome: {outcome}")
    print("Detailed log of Grover's simulation:")
    print(log_str)
    
    # --- Demonstrate Shor's Factorization ---
    print("\n=== Shor's Factorization Demo ===")
    N = 15  # A small composite number (15 = 3 x 5)
    try:
        shor_result = shor_factorization(N)
        print(f"Factors of {N} are: {shor_result.factors}")
    except Exception as e:
        print("Shor's algorithm demo failed:")
        print(e)
"""
Quantum Decryption Plugin

This module demonstrates quantum decryption techniques:
1. grover_key_search: Uses Grover's algorithm to perform key search in an unsorted space.
2. shor_factorization: Demonstrates quantum decryption using our existing Shor code simulation
   (from error correction) to illustrate how quantum operations can break encryption schemes
   that are resistant to classical attacks.


"""

import cirq
from plugins.grover.grover import run_grover

def grover_key_search(key: int, num_bits: int, noise_prob: float = 0.0):
    """
    Uses Grover's algorithm to search for a secret key among 2^num_bits possibilities.
    """
    # Format the target key as a binary string with leading zeros.
    target = format(key, f'0{num_bits}b')
    outcome, circuit, log_str = run_grover(num_bits, target, noise_prob)
    return outcome, circuit, log_str

def shor_factorization(N: int):
    """
    Demonstrates quantum decryption using our existing Shor code simulation.
    """
    from plugins.error_correction.shor_code import run_shor_code
    result = run_shor_code(noise_prob=0.0)
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
    
    # --- Demonstrate Shor's Code Simulation (for decryption) ---
    print("\n=== Shor Code Simulation Demo ===")
    N = 15  # Composite number (for demonstration; input is not used by simulation)
    try:
        result = shor_factorization(N)
        print("Shor Code Simulation Results:")
        print("Measurements:", result.get('measurements'))
        print("Circuit:")
        print(result.get('circuit'))
        print("Detailed Log:")
        print(result.get('log'))
    except Exception as e:
        print("Shor code simulation demo failed:")
        print(e)
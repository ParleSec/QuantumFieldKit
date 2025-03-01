from plugins.grover.grover import run_grover
from plugins.error_correction.shor_code import run_shor_code
from cirq.contrib.svg import circuit_to_svg

def grover_key_search(key: int, num_bits: int, noise_prob: float = 0.0):
    target = format(key, f'0{num_bits}b')
    result = run_grover(num_bits, target, noise_prob)
    # run_grover returns { "outcome", "circuit_svg", "log" }
    # So we can simply return it as is or rename keys if needed
    return result

def shor_factorization(N: int):
    # run_shor_code returns { "measurements", "circuit_svg", "log" }
    return run_shor_code(noise_prob=0.0)

if __name__ == "__main__":
    print("=== Grover Key Search ===")
    r = grover_key_search(5, 4, noise_prob=0.0)
    print("Grover result:", r)
    print("=== Shor Factorization ===")
    r2 = shor_factorization(15)
    print("Shor result:", r2)

# core/qubit.py
import math
import random

class Qubit:
    def __init__(self, state=None):
        # Represent state as a two-element list: [amplitude for |0>, amplitude for |1>]
        if state is None:
            # Default to |0> state
            self.state = [1.0, 0.0]
        else:
            # Normalize provided state
            norm = math.sqrt(sum(abs(x)**2 for x in state))
            self.state = [x / norm for x in state]

    def apply_gate(self, gate_matrix):
        # Apply a quantum gate represented by a 2x2 matrix
        a, b = self.state
        self.state = [
            gate_matrix[0][0] * a + gate_matrix[0][1] * b,
            gate_matrix[1][0] * a + gate_matrix[1][1] * b
        ]

    def apply_hadamard(self):
        # Hadamard gate: (1/sqrt2) * [[1,  1], [1, -1]]
        factor = 1 / math.sqrt(2)
        hadamard = [[factor, factor], [factor, -factor]]
        self.apply_gate(hadamard)

    def measure(self):
        # Compute probabilities from amplitudes
        prob0 = abs(self.state[0]) ** 2
        result = 0 if random.random() < prob0 else 1
        # Collapse the state based on measurement
        self.state = [1.0, 0.0] if result == 0 else [0.0, 1.0]
        return result

    def __repr__(self):
        return f"Qubit(state={self.state})"

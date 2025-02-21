# core/quantum_state.py
from core.qubit import Qubit

class QuantumState:
    def __init__(self, num_qubits):
        # Create a register of qubits initialized to |0>
        self.qubits = [Qubit() for _ in range(num_qubits)]

    def apply_to_all(self, gate_function):
        # Apply a gate function (like apply_hadamard) to all qubits
        for qubit in self.qubits:
            getattr(qubit, gate_function)()

    def measure_all(self):
        # Measure each qubit in the register and return results as a list
        return [qubit.measure() for qubit in self.qubits]

    def __repr__(self):
        return f"QuantumState({self.qubits})"

# core/simulator.py
from core.quantum_state import QuantumState

class Simulator:
    def __init__(self, num_qubits):
        self.state = QuantumState(num_qubits)

    def run_simulation(self, operations):
        """
        operations: List of tuples (operation_name, qubit_indices)
        Example: [('hadamard', [0]), ('pauli_x', [1])]
        """
        for op, indices in operations:
            for idx in indices:
                qubit = self.state.qubits[idx]
                if op == 'hadamard':
                    qubit.apply_hadamard()
                elif op == 'pauli_x':
                    from core.gates import pauli_x
                    pauli_x(qubit)
                elif op == 'pauli_z':
                    from core.gates import pauli_z
                    pauli_z(qubit)
                # Extend with additional operations as needed

    def measure_state(self):
        return self.state.measure_all()

if __name__ == '__main__':
    # Example simulation: two qubits, apply Hadamard to first qubit and measure
    sim = Simulator(2)
    sim.run_simulation([('hadamard', [0])])
    results = sim.measure_state()
    print("Measurement results:", results)

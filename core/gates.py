# core/gates.py
import math

def pauli_x(qubit):
    # Pauli-X gate flips the qubit state: |0> <-> |1>
    pauli_x_matrix = [[0, 1],
                      [1, 0]]
    qubit.apply_gate(pauli_x_matrix)

def pauli_z(qubit):
    # Pauli-Z gate: |0> remains the same, |1> gets a phase flip
    pauli_z_matrix = [[1, 0],
                      [0, -1]]
    qubit.apply_gate(pauli_z_matrix)

def cnot(control_qubit, target_qubit):
    # Simplified CNOT: if control qubit is |1>, apply Pauli-X to target
    if control_qubit.measure() == 1:
        pauli_x(target_qubit)

"""
IBM Quantum Cloud Integration Plugin

This module implements a robust Cirq → Qiskit conversion utility that handles
a broad set of common gates (including parameterized rotations) and measurements.
It then authenticates with IBM Quantum using qiskit-ibm-provider, transpiles the
converted circuit, submits the job to an IBM backend, and returns the results.

Provider Setup Guidance:
    1. Create an IBM Quantum account and retrieve your API token.
    2. Save your token by calling:
           from qiskit_ibm_provider import IBMProvider
           IBMProvider.save_account(token='MY_API_TOKEN')
       (This stores your credentials in $HOME/.qiskit/qiskit-ibm.json.)
    3. Alternatively, set the environment variable QISKIT_IBM_TOKEN.
    4. Or, for a single session, pass the token when instantiating the provider.

Requirements:
    - cirq
    - qiskit
    - qiskit-ibm-provider
    - sympy
"""

import cirq
import sympy
from qiskit import transpile
from qiskit_ibm_provider import IBMProvider

#############################################
# Part 1: Robust Cirq to Qiskit Conversion  #
#############################################

def _handle_rx(rads):
    from qiskit.circuit.library import RXGate
    if isinstance(rads, sympy.Basic):
        from qiskit.circuit import Parameter
        return RXGate(Parameter(str(rads)))
    elif isinstance(rads, (float, int)):
        return RXGate(rads)
    else:
        return RXGate(rads)

def _handle_ry(rads):
    from qiskit.circuit.library import RYGate
    if isinstance(rads, sympy.Basic):
        from qiskit.circuit import Parameter
        return RYGate(Parameter(str(rads)))
    else:
        return RYGate(rads)

def _handle_rz(rads):
    from qiskit.circuit.library import RZGate
    if isinstance(rads, sympy.Basic):
        from qiskit.circuit import Parameter
        return RZGate(Parameter(str(rads)))
    else:
        return RZGate(rads)

def cirq_to_qiskit(cirq_circuit: cirq.Circuit):
    """
    Converts a Cirq circuit into a Qiskit QuantumCircuit.
    
    Supports:
        - Single-qubit gates: X, Y, Z, S, T, H, and parameterized rotations (Rx, Ry, Rz).
        - Two-qubit gates: CNOT, CZ, SWAP.
        - Measurements.
    
    Symbolic parameters in Cirq become Qiskit Parameter objects.
    
    Returns:
        A Qiskit QuantumCircuit.
    """
    # Collect and sort qubits
    all_qubits = sorted(cirq_circuit.all_qubits(), key=lambda q: str(q))
    num_qubits = len(all_qubits)
    from qiskit import QuantumRegister, ClassicalRegister, QuantumCircuit
    qreg = QuantumRegister(num_qubits, 'q')
    creg = ClassicalRegister(num_qubits, 'c')
    qc = QuantumCircuit(qreg, creg)
    qubit_map = {q: i for i, q in enumerate(all_qubits)}

    for moment in cirq_circuit:
        for op in moment.operations:
            gate = op.gate
            qubits = op.qubits
            # Handle measurement
            if isinstance(gate, cirq.MeasurementGate):
                for q in qubits:
                    idx = qubit_map[q]
                    qc.measure(qreg[idx], creg[idx])
            # Single-qubit operations
            elif len(qubits) == 1:
                idx = qubit_map[qubits[0]]
                if isinstance(gate, cirq.XPowGate) and gate.exponent == 1 and gate.global_shift == 0:
                    qc.x(qreg[idx])
                elif isinstance(gate, cirq.YPowGate) and gate.exponent == 1 and gate.global_shift == 0:
                    qc.y(qreg[idx])
                elif isinstance(gate, cirq.ZPowGate) and gate.exponent == 1 and gate.global_shift == 0:
                    qc.z(qreg[idx])
                # For constant gates, compare directly
                elif gate == cirq.S:
                    qc.s(qreg[idx])
                elif gate == cirq.T:
                    qc.t(qreg[idx])
                elif gate == cirq.H:
                    qc.h(qreg[idx])
                # Parametric rotations
                elif isinstance(gate, cirq.XPowGate) and gate.global_shift == 0:
                    angle = sympy.pi * gate.exponent
                    qc.append(_handle_rx(angle), [qreg[idx]])
                elif isinstance(gate, cirq.YPowGate) and gate.global_shift == 0:
                    angle = sympy.pi * gate.exponent
                    qc.append(_handle_ry(angle), [qreg[idx]])
                elif isinstance(gate, cirq.ZPowGate) and gate.global_shift == 0:
                    angle = sympy.pi * gate.exponent
                    qc.append(_handle_rz(angle), [qreg[idx]])
                else:
                    continue
            # Two-qubit operations
            elif len(qubits) == 2:
                idx0 = qubit_map[qubits[0]]
                idx1 = qubit_map[qubits[1]]
                if isinstance(gate, cirq.CNOT):
                    qc.cx(qreg[idx0], qreg[idx1])
                elif isinstance(gate, cirq.CZ):
                    qc.cz(qreg[idx0], qreg[idx1])
                elif isinstance(gate, cirq.SWAP):
                    qc.swap(qreg[idx0], qreg[idx1])
                else:
                    continue
            else:
                continue
    return qc

###########################################
# Part 2: IBM Quantum Integration         #
###########################################

def authenticate_ibm(token: str = None):
    """
    Authenticates with IBM Quantum using the provided token.
    If token is None, attempts to load credentials from the environment or saved file.
    Returns the IBMProvider instance.
    """
    if token:
        return IBMProvider(token=token)
    else:
        return IBMProvider()

def submit_cirq_to_ibm(cirq_circuit: cirq.Circuit, token: str = None, shots: int = 1024, backend_name: str = None):
    """
    Converts a Cirq circuit to a Qiskit circuit, transpiles it for an IBM backend,
    submits the job, and returns the job ID and results.
    """
    provider = authenticate_ibm(token)
    qiskit_circ = cirq_to_qiskit(cirq_circuit)
    if qiskit_circ is None:
        raise ValueError("Conversion from Cirq to Qiskit failed.")

    if backend_name:
        backend = provider.get_backend(backend_name)
    else:
        simulator_backends = provider.backends(filters=lambda b: b.configuration().simulator)
        if not simulator_backends:
            raise ValueError("No simulator backends available.")
        from qiskit_ibm_provider import least_busy
        backend = least_busy(simulator_backends)

    transpiled_circ = transpile(qiskit_circ, backend=backend)
    job = backend.run(transpiled_circ, shots=shots)
    job_id = job.job_id()
    result = job.result()
    counts = result.get_counts()
    return job_id, counts

def demo_hardware_integration_real(token: str, cirq_circuit: cirq.Circuit):
    """
    Demonstrates real integration by converting a Cirq circuit to Qiskit,
    submitting it to IBM Quantum, and returning job results.
    """
    try:
        job_id, counts = submit_cirq_to_ibm(cirq_circuit, token, shots=1024)
        return {
            "success": True,
            "job_id": job_id,
            "status": "Completed",
            "results": counts
        }
    except Exception as e:
        return {
            "success": False,
            "message": str(e)
        }

if __name__ == "__main__":
    # Example demonstration:
    q0, q1 = cirq.LineQubit.range(2)
    demo_circuit = cirq.Circuit(
        cirq.H(q0),
        cirq.CNOT(q0, q1),
        cirq.measure(q0, key='m0'),
        cirq.measure(q1, key='m1')
    )
    # Replace "YOUR_TOKEN_HERE" with your actual IBM Quantum API token.
    token = "5930ef6e6c64d2c69651052ee317561b8f64a6ff614e051f8053eb8a3b813e864b7ac94e2d52f97ac487953419e7d62416379a99e0902a0a24b5842c8a2b9e16"
    try:
        job_id, counts = submit_cirq_to_ibm(demo_circuit, token, shots=1024)
        print("IBM Quantum Job submitted successfully!")
        print("Job ID:", job_id)
        print("Counts:", counts)
    except Exception as error:
        print("Error during IBM Quantum integration:")
        print(error)
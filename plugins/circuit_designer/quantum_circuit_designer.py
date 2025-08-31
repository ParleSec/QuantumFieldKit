"""
Quantum Circuit Designer

This module handles the creation, validation, simulation, and storage of custom quantum circuits.
It leverages Cirq for the quantum operations and simulation, with a Flask API interface.
"""
import cirq
import numpy as np
import json
import uuid
import os
from flask import jsonify, request, abort
from typing import Dict, List, Optional, Tuple, Any, Union

# Circuit storage directory
CIRCUIT_DIR = os.path.join(os.path.dirname(__file__), 'user_circuits')
os.makedirs(CIRCUIT_DIR, exist_ok=True)

class QuantumCircuitDesigner:

    """Handles creation and simulation of custom quantum circuits"""
    
    # Available gates and their parameters - store string identifiers instead of actual gate objects
    SINGLE_QUBIT_GATES = {
        'H': {'name': 'Hadamard', 'cirq_gate_id': 'cirq.H'},
        'X': {'name': 'Pauli-X', 'cirq_gate_id': 'cirq.X'},
        'Y': {'name': 'Pauli-Y', 'cirq_gate_id': 'cirq.Y'},
        'Z': {'name': 'Pauli-Z', 'cirq_gate_id': 'cirq.Z'},
        'S': {'name': 'Phase Gate', 'cirq_gate_id': 'cirq.S'},
        'T': {'name': 'T Gate', 'cirq_gate_id': 'cirq.T'},
        'Rx': {'name': 'Rotation-X', 'cirq_gate_id': 'cirq.rx', 'params': ['angle']},
        'Ry': {'name': 'Rotation-Y', 'cirq_gate_id': 'cirq.ry', 'params': ['angle']},
        'Rz': {'name': 'Rotation-Z', 'cirq_gate_id': 'cirq.rz', 'params': ['angle']}
    }
    
    MULTI_QUBIT_GATES = {
        'CNOT': {'name': 'Controlled-NOT', 'cirq_gate_id': 'cirq.CNOT', 'num_qubits': 2},
        'CZ': {'name': 'Controlled-Z', 'cirq_gate_id': 'cirq.CZ', 'num_qubits': 2},
        'SWAP': {'name': 'SWAP', 'cirq_gate_id': 'cirq.SWAP', 'num_qubits': 2},
        'CSWAP': {'name': 'Controlled-SWAP', 'cirq_gate_id': 'cirq.CSWAP', 'num_qubits': 3},
        'TOFFOLI': {'name': 'Toffoli', 'cirq_gate_id': 'cirq.TOFFOLI', 'num_qubits': 3}
    }
    
    def __init__(self):
        """Initialize the circuit designer"""
        self.reset_circuit()
    
    def reset_circuit(self) -> None:
        """Reset the current circuit"""
        self.qubits = []
        self.circuit = cirq.Circuit()
        self.circuit_data = {
            'id': str(uuid.uuid4()),
            'name': 'New Circuit',
            'num_qubits': 0,
            'depth': 0,
            'gates': []
        }
    
    def create_empty_circuit(self, num_qubits: int, name: str = 'New Circuit') -> Dict[str, Any]:
        """Create a new empty circuit with the specified number of qubits"""
        if num_qubits <= 0 or num_qubits > 20:  # Reasonable limits
            raise ValueError("Number of qubits must be between 1 and 20")
        
        self.reset_circuit()
        self.qubits = [cirq.NamedQubit(f'q{i}') for i in range(num_qubits)]
        self.circuit_data = {
            'id': str(uuid.uuid4()),
            'name': name,
            'num_qubits': num_qubits,
            'depth': 0,
            'gates': []
        }
        
        return self.circuit_data
    
    def add_gate(self, gate_type: str, targets: List[int], params: Optional[Dict[str, float]] = None) -> Dict[str, Any]:
        """
        Add a gate to the circuit
        
        Args:
            gate_type: Type of gate (e.g., 'H', 'CNOT')
            targets: List of target qubit indices
            params: Optional parameters for parametrized gates
            
        Returns:
            Updated circuit data
        """
        if not self.qubits:
            raise ValueError("No circuit initialized. Call create_empty_circuit first.")
        
        # Ensure targets are integers
        targets = [int(t) for t in targets]
        
        # Handle single-qubit gates
        if gate_type in self.SINGLE_QUBIT_GATES:
            if len(targets) != 1:
                raise ValueError(f"{gate_type} gate requires exactly 1 target qubit")
            
            gate_info = self.SINGLE_QUBIT_GATES[gate_type]
            target_qubit = self.qubits[targets[0]]
            
            # Handle parameterized gates
            if 'params' in gate_info:
                if not params:
                    raise ValueError(f"{gate_type} gate requires parameters: {gate_info['params']}")
                
                # Create the appropriate parameterized gate
                if gate_type == 'Rx':
                    gate = cirq.rx(rads=params.get('angle', 0))
                elif gate_type == 'Ry':
                    gate = cirq.ry(rads=params.get('angle', 0))
                elif gate_type == 'Rz':
                    gate = cirq.rz(rads=params.get('angle', 0))
                
                self.circuit.append(gate(target_qubit))
            else:
                # Simple gate with no parameters - use appropriate Cirq gate based on type
                if gate_type == 'H':
                    self.circuit.append(cirq.H(target_qubit))
                elif gate_type == 'X':
                    self.circuit.append(cirq.X(target_qubit))
                elif gate_type == 'Y':
                    self.circuit.append(cirq.Y(target_qubit))
                elif gate_type == 'Z':
                    self.circuit.append(cirq.Z(target_qubit))
                elif gate_type == 'S':
                    self.circuit.append(cirq.S(target_qubit))
                elif gate_type == 'T':
                    self.circuit.append(cirq.T(target_qubit))
        
        # Handle multi-qubit gates
        elif gate_type in self.MULTI_QUBIT_GATES:
            gate_info = self.MULTI_QUBIT_GATES[gate_type]
            required_qubits = gate_info['num_qubits']
            
            if len(targets) != required_qubits:
                raise ValueError(f"{gate_type} gate requires exactly {required_qubits} target qubits")
            
            # Get target qubits
            target_qubits = [self.qubits[i] for i in targets]
            
            # Apply the appropriate gate based on type
            if gate_type == 'CNOT':
                self.circuit.append(cirq.CNOT(*target_qubits))
            elif gate_type == 'CZ':
                self.circuit.append(cirq.CZ(*target_qubits))
            elif gate_type == 'SWAP':
                self.circuit.append(cirq.SWAP(*target_qubits))
            elif gate_type == 'CSWAP':
                self.circuit.append(cirq.CSWAP(*target_qubits))
            elif gate_type == 'TOFFOLI':
                self.circuit.append(cirq.TOFFOLI(*target_qubits))
        
        # Handle measurement
        elif gate_type == 'MEASURE':
            if len(targets) != 1:
                raise ValueError("MEASURE requires exactly 1 target qubit")
            
            target_qubit = self.qubits[targets[0]]
            self.circuit.append(cirq.measure(target_qubit, key=f'q{targets[0]}'))
            
        else:
            raise ValueError(f"Unknown gate type: {gate_type}")
        
        # Update circuit data (same as before)
        gate_data = {
            'type': gate_type,
            'targets': targets,
        }
        
        if params:
            gate_data['params'] = params
            
        self.circuit_data['gates'].append(gate_data)
        
        # Update circuit depth (simplified approach)
        self.circuit_data['depth'] = len(self.circuit_data['gates'])
        
        return self.circuit_data
    
    def remove_gate(self, gate_index: int) -> Dict[str, Any]:
        """
        Remove a gate from the circuit by its index
        
        Args:
            gate_index: Index of the gate to remove
            
        Returns:
            Updated circuit data
        """
        if gate_index < 0 or gate_index >= len(self.circuit_data['gates']):
            raise ValueError(f"Gate index out of range: {gate_index}")
        
        # Remove the gate from circuit data
        self.circuit_data['gates'].pop(gate_index)
        
        # Rebuild the circuit from scratch
        self.circuit = cirq.Circuit()
        for gate_data in self.circuit_data['gates']:
            gate_type = gate_data['type']
            targets = gate_data['targets']
            params = gate_data.get('params')
            
            # Reapply gates (simplified - would need to match logic in add_gate)
            if gate_type in self.SINGLE_QUBIT_GATES:
                gate_info = self.SINGLE_QUBIT_GATES[gate_type]
                target_qubit = self.qubits[targets[0]]
                
                if 'params' in gate_info:
                    # Parameterized gates
                    angle = params.get('angle', 0) if params else 0
                    if gate_type == 'Rx':
                        gate = cirq.rx(rads=angle)
                    elif gate_type == 'Ry':
                        gate = cirq.ry(rads=angle)
                    elif gate_type == 'Rz':
                        gate = cirq.rz(rads=angle)
                    self.circuit.append(gate(target_qubit))
                else:
                    # Simple gates
                    self.circuit.append(gate_info['cirq_gate'](target_qubit))
            
            elif gate_type in self.MULTI_QUBIT_GATES:
                gate_info = self.MULTI_QUBIT_GATES[gate_type]
                target_qubits = [self.qubits[i] for i in targets]
                self.circuit.append(gate_info['cirq_gate'](*target_qubits))
            
            elif gate_type == 'MEASURE':
                target_qubit = self.qubits[targets[0]]
                self.circuit.append(cirq.measure(target_qubit, key=f'q{targets[0]}'))
        
        # Update circuit depth
        self.circuit_data['depth'] = len(self.circuit_data['gates'])
        
        return self.circuit_data
    
    def simulate_circuit(self, shots: int = 1024) -> Dict[str, Any]:
        """
        Simulate the current circuit
        
        Args:
            shots: Number of measurement shots for statistics
            
        Returns:
            Simulation results including statevector and measurements
        """
        if not self.circuit.has_measurements():
            # If there are no measurements, add them to all qubits for statistics
            measure_circuit = cirq.Circuit()
            for i, qubit in enumerate(self.qubits):
                measure_circuit.append(cirq.measure(qubit, key=f'q{i}'))
            
            sim_circuit = self.circuit + measure_circuit
        else:
            sim_circuit = self.circuit
        
        # Run simulation without measurements to get statevector
        simulator = cirq.Simulator()
        
        try:
            # First, get the statevector
            no_measure_circuit = cirq.Circuit()
            for op in self.circuit.all_operations():
                if not isinstance(op.gate, cirq.MeasurementGate):
                    no_measure_circuit.append(op)
            
            result = simulator.simulate(no_measure_circuit)
            statevector = result.final_state_vector
            
            # Calculate probabilities
            num_qubits = len(self.qubits)
            probabilities = np.abs(statevector)**2
            
            # Format statevector data
            state_data = []
            for i, amplitude in enumerate(statevector):
                if abs(probabilities[i]) > 1e-10:  # Threshold for numerical precision
                    state_data.append({
                        'state': format(i, f'0{num_qubits}b'),
                        'amplitude': {
                            'real': float(amplitude.real),
                            'imag': float(amplitude.imag)
                        },
                        'probability': float(probabilities[i])
                    })
            
            # Now run with measurements to get statistics
            sampler = cirq.Simulator()
            result = sampler.run(sim_circuit, repetitions=shots)
            
            # Process measurement results
            measurement_keys = sorted(result.measurements.keys())
            
            # Convert to bitstring representation
            counts = {}
            for i in range(shots):
                bitstring = ''.join([str(int(result.measurements[key][i][0])) for key in measurement_keys])
                counts[bitstring] = counts.get(bitstring, 0) + 1
            
            return {
                'success': True,
                'statevector': state_data,
                'measurements': {
                    'counts': counts,
                    'totalShots': shots
                },
                'circuit_data': self.circuit_data
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def generate_circuit_svg(self) -> str:
        """Generate SVG visualization of the circuit"""
        try:
            from cirq.contrib.svg import circuit_to_svg
            return circuit_to_svg(self.circuit)
        except Exception as e:
            return f"<svg><text>Error generating circuit visualization: {str(e)}</text></svg>"
    
    def export_to_cirq_code(self) -> str:
        """Export the circuit to executable Cirq Python code"""
        code = ["import cirq", ""]
        code.append(f"# {self.circuit_data['name']}")
        code.append(f"# Created with Quantum Field Kit Circuit Designer")
        code.append("")
        code.append(f"# Initialize {self.circuit_data['num_qubits']} qubits")
        code.append(f"qubits = [cirq.NamedQubit(f'q{{i}}') for i in range({self.circuit_data['num_qubits']})]")
        code.append("circuit = cirq.Circuit()")
        code.append("")
        
        # Generate gate operations
        for gate_data in self.circuit_data['gates']:
            gate_type = gate_data['type']
            targets = gate_data['targets']
            params = gate_data.get('params')
            
            if gate_type in self.SINGLE_QUBIT_GATES:
                # Handle parameterized gates
                if gate_type in ['Rx', 'Ry', 'Rz'] and params:
                    angle = params.get('angle', 0)
                    if gate_type == 'Rx':
                        code.append(f"circuit.append(cirq.rx(rads={angle})(qubits[{targets[0]}]))")
                    elif gate_type == 'Ry':
                        code.append(f"circuit.append(cirq.ry(rads={angle})(qubits[{targets[0]}]))")
                    elif gate_type == 'Rz':
                        code.append(f"circuit.append(cirq.rz(rads={angle})(qubits[{targets[0]}]))")
                else:
                    # Simple gates
                    code.append(f"circuit.append(cirq.{gate_type}(qubits[{targets[0]}]))")
            
            elif gate_type in self.MULTI_QUBIT_GATES:
                target_strs = [f"qubits[{t}]" for t in targets]
                code.append(f"circuit.append(cirq.{gate_type}({', '.join(target_strs)}))")
            
            elif gate_type == 'MEASURE':
                code.append(f"circuit.append(cirq.measure(qubits[{targets[0]}], key='q{targets[0]}'))")
        
        # Add simulation code
        code.append("")
        code.append("# Simulate the circuit")
        code.append("simulator = cirq.Simulator()")
        code.append("result = simulator.simulate(circuit)")
        code.append("")
        code.append("# Print the final state vector")
        code.append("print('Final state vector:')")
        code.append("print(result.final_state_vector)")
        code.append("")
        code.append("# Run with measurements")
        code.append("sampler = cirq.Simulator()")
        code.append("result = sampler.run(circuit, repetitions=1000)")
        code.append("print('Measurement results:')")
        code.append("print(result)")
        
        return "\n".join(code)
    
    def save_circuit(self) -> str:
        """Save the circuit to a file and return the ID"""
        circuit_id = self.circuit_data['id']
        filepath = os.path.join(CIRCUIT_DIR, f"{circuit_id}.json")
        
        with open(filepath, 'w') as f:
            json.dump(self.circuit_data, f, indent=2)
        
        return circuit_id
    
    def load_circuit(self, circuit_id: str) -> Dict[str, Any]:
        """Load a circuit from a file by ID"""
        filepath = os.path.join(CIRCUIT_DIR, f"{circuit_id}.json")
        
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Circuit with ID {circuit_id} not found")
        
        with open(filepath, 'r') as f:
            self.circuit_data = json.load(f)
        
        # Recreate qubits and circuit
        self.qubits = [cirq.NamedQubit(f'q{i}') for i in range(self.circuit_data['num_qubits'])]
        self.circuit = cirq.Circuit()
        
        # Rebuild the circuit
        for gate_data in self.circuit_data['gates']:
            gate_type = gate_data['type']
            targets = gate_data['targets']
            params = gate_data.get('params')
            
            self.add_gate(gate_type, targets, params)
        
        return self.circuit_data
    
    def list_saved_circuits(self) -> List[Dict[str, Any]]:
        """List all saved circuits"""
        circuits = []
        
        for filename in os.listdir(CIRCUIT_DIR):
            if filename.endswith('.json'):
                filepath = os.path.join(CIRCUIT_DIR, filename)
                
                try:
                    with open(filepath, 'r') as f:
                        circuit_data = json.load(f)
                        
                    # Include minimal information
                    circuits.append({
                        'id': circuit_data['id'],
                        'name': circuit_data['name'],
                        'num_qubits': circuit_data['num_qubits'],
                        'depth': circuit_data['depth']
                    })
                except:
                    # Skip invalid files
                    pass
        
        return sorted(circuits, key=lambda c: c['name'])

# Flask routes for circuit designer API
def register_circuit_designer_routes(app):
    """Register Flask routes for the circuit designer API"""
    
    designer = QuantumCircuitDesigner()
    
    @app.route('/api/circuit/new', methods=['POST'])
    def create_circuit():
        """Create a new empty circuit"""
        data = request.json
        
        try:
            num_qubits = int(data.get('num_qubits', 3))
            name = data.get('name', 'New Circuit')
            
            circuit_data = designer.create_empty_circuit(num_qubits, name)
            return jsonify({'success': True, 'circuit': circuit_data})
        
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 400
    
    @app.route('/api/circuit/add_gate', methods=['POST'])
    def add_gate():
        """Add a gate to the circuit"""
        data = request.json
        
        try:
            gate_type = data.get('gate_type')
            targets = data.get('targets', [])
            params = data.get('params')
            
            if not gate_type:
                return jsonify({'success': False, 'error': 'Gate type is required'}), 400
                
            circuit_data = designer.add_gate(gate_type, targets, params)
            return jsonify({'success': True, 'circuit': circuit_data})
        
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 400
    
    @app.route('/api/circuit/remove_gate', methods=['POST'])
    def remove_gate():
        """Remove a gate from the circuit"""
        data = request.json
        
        try:
            gate_index = int(data.get('gate_index', -1))
            
            if gate_index < 0:
                return jsonify({'success': False, 'error': 'Valid gate index is required'}), 400
                
            circuit_data = designer.remove_gate(gate_index)
            return jsonify({'success': True, 'circuit': circuit_data})
        
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 400
    
    @app.route('/api/circuit/simulate', methods=['POST'])
    def simulate_circuit():
        """Simulate the current circuit"""
        data = request.json
        
        try:
            shots = int(data.get('shots', 1024))
            
            result = designer.simulate_circuit(shots)
            result['svg'] = designer.generate_circuit_svg()
            
            return jsonify(result)
        
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 400
    
    @app.route('/api/circuit/export_code', methods=['GET'])
    def export_code():
        """Export the circuit to Cirq code"""
        try:
            code = designer.export_to_cirq_code()
            return jsonify({'success': True, 'code': code})
        
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 400
    
    @app.route('/api/circuit/save', methods=['POST'])
    def save_circuit():
        """Save the current circuit"""
        data = request.json
        
        try:
            if data and 'name' in data:
                designer.circuit_data['name'] = data['name']
                
            circuit_id = designer.save_circuit()
            return jsonify({'success': True, 'circuit_id': circuit_id})
        
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 400
    
    @app.route('/api/circuit/load/<circuit_id>', methods=['GET'])
    def load_circuit(circuit_id):
        """Load a circuit by ID"""
        try:
            circuit_data = designer.load_circuit(circuit_id)
            return jsonify({'success': True, 'circuit': circuit_data})
        
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 404
    
    @app.route('/api/circuit/list', methods=['GET'])
    def list_circuits():
        """List all saved circuits"""
        try:
            circuits = designer.list_saved_circuits()
            return jsonify({'success': True, 'circuits': circuits})
        
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    @app.route('/api/circuit/available_gates', methods=['GET'])
    def get_available_gates():
        """Get list of available gates"""
        try:
            # Create serializable versions of the gate dictionaries
            single_qubit_gates = {}
            for gate_id, gate_info in designer.SINGLE_QUBIT_GATES.items():
                single_qubit_gates[gate_id] = {
                    'name': gate_info['name'],
                    'type': 'single'
                }
                if 'params' in gate_info:
                    single_qubit_gates[gate_id]['params'] = gate_info['params']
            
            multi_qubit_gates = {}
            for gate_id, gate_info in designer.MULTI_QUBIT_GATES.items():
                multi_qubit_gates[gate_id] = {
                    'name': gate_info['name'],
                    'type': 'multi',
                    'num_qubits': gate_info['num_qubits']
                }
            
            gates = {
                'single_qubit_gates': single_qubit_gates,
                'multi_qubit_gates': multi_qubit_gates,
                'special_gates': [
                    {'id': 'MEASURE', 'name': 'Measurement', 'type': 'special'}
                ]
            }
            return jsonify({'success': True, 'gates': gates})
        
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
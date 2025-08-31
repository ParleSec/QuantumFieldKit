import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Nav, Tab, Spinner, Modal, InputGroup, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAtom, faPlay, faTrash, faSave, faCode, faChartBar, faPoll, faProjectDiagram, faCopy } from '@fortawesome/free-solid-svg-icons';
import { getAvailableGates, runCircuitSimulation, saveCircuit, getSavedCircuits, exportCircuitCode } from '../services/api';

const CircuitDesigner = () => {
  // State variables
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [numQubits, setNumQubits] = useState(3);
  const [circuitName, setCircuitName] = useState('My Custom Circuit');
  const [simulationShots, setSimulationShots] = useState(1024);
  const [showResults, setShowResults] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportedCode, setExportedCode] = useState('');

  // Gate categories
  const [singleQubitGates, setSingleQubitGates] = useState([]);
  const [multiQubitGates, setMultiQubitGates] = useState([]);
  const [specialGates, setSpecialGates] = useState([]);
  
  // Results state
  const [stateVectorResults, setStateVectorResults] = useState(null);
  const [measurementResults, setMeasurementResults] = useState(null);
  const [blochVisualization, setBlochVisualization] = useState(null);
  
  // Saved circuits
  const [savedCircuits, setSavedCircuits] = useState([]);

  // Test API connection
  useEffect(() => {
    const testApiConnection = async () => {
      try {
        // Try to get the saved circuits to test API connectivity
        setLoading(true);
        const savedCircuits = await getSavedCircuits();
        setSavedCircuits(savedCircuits);
        setError(null);
      } catch (error) {
        console.error('API connection error:', error);
        setError(`API connection error: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    testApiConnection();
  }, []);

  useEffect(() => {
    // Initialize the circuit designer
    initializeCircuitDesigner();
  }, []);

  const initializeCircuitDesigner = async () => {
    setLoading(true);
    try {
      // Load available gates from the API
      const gates = await getAvailableGates();
      
      // Set the gates state from the API response
      if (gates && gates.single_qubit) {
        setSingleQubitGates(gates.single_qubit.map(gate => gate.name));
      } else {
        // Fallback to default gates if API fails
        setSingleQubitGates(['H', 'X', 'Y', 'Z', 'S', 'T']);
      }
      
      if (gates && gates.multi_qubit) {
        setMultiQubitGates(gates.multi_qubit.map(gate => gate.name));
      } else {
        setMultiQubitGates(['CNOT', 'SWAP', 'CZ']);
      }
      
      if (gates && gates.special) {
        setSpecialGates(gates.special.map(gate => gate.name));
      } else {
        setSpecialGates(['Measure', 'Reset']);
      }
      
      setError(null);
    } catch (error) {
      console.error('Error loading gates:', error);
      // Fallback to default gates
      setSingleQubitGates(['H', 'X', 'Y', 'Z', 'S', 'T']);
      setMultiQubitGates(['CNOT', 'SWAP', 'CZ']);
      setSpecialGates(['Measure', 'Reset']);
      
      setError(`Error loading gates: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRunSimulation = async () => {
    setLoading(true);
    try {
      // Create a circuit object based on the current state
      const circuit = {
        num_qubits: numQubits,
        name: circuitName,
        gates: [] // In a real implementation, this would contain the actual gates
      };
      
      // Call the API to simulate the circuit
      const result = await runCircuitSimulation(circuit, simulationShots);
      
      // Update the state with the simulation results
      setStateVectorResults(result.state_vector);
      setMeasurementResults(result.measurements);
      setBlochVisualization(result.circuit_representation);
      
      setShowResults(true);
      setError(null);
    } catch (error) {
      console.error('Simulation error:', error);
      setError(`Simulation error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClearCircuit = () => {
    // Clear the circuit
    // This would be implemented with actual logic
  };

  const handleSaveCircuit = async () => {
    setLoading(true);
    try {
      // Create a circuit object based on the current state
      const circuitData = {
        name: circuitName,
        num_qubits: numQubits,
        gates: [] // In a real implementation, this would contain the actual gates
      };
      
      // Call the API to save the circuit
      const result = await saveCircuit(circuitData);
      
      // Add the saved circuit to the list
      setSavedCircuits([...savedCircuits, {
        id: result.id,
        name: result.name,
        created_at: result.timestamp
      }]);
      
      setError(null);
    } catch (error) {
      console.error('Error saving circuit:', error);
      setError(`Error saving circuit: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCode = async () => {
    setLoading(true);
    try {
      // Create a circuit object based on the current state
      const circuit = {
        num_qubits: numQubits,
        name: circuitName,
        gates: [] // In a real implementation, this would contain the actual gates
      };
      
      // Call the API to export the circuit code
      const result = await exportCircuitCode(circuit, 'cirq');
      
      // Set the exported code from the API response
      setExportedCode(result.code);
      setShowExportModal(true);
      setError(null);
    } catch (error) {
      console.error('Error exporting code:', error);
      // Fallback to generate code locally
      setExportedCode(`
import cirq
import numpy as np

# Create a circuit with ${numQubits} qubits
circuit = cirq.Circuit()

# Define qubits
qubits = [cirq.LineQubit(i) for i in range(${numQubits})]

# Add gates
# ... this would be generated based on the actual circuit

# Simulate
simulator = cirq.Simulator()
result = simulator.simulate(circuit)

print("Final state vector:")
print(result.final_state_vector)
      `);
      setShowExportModal(true);
      setError(`Error exporting code: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(exportedCode);
    // Would add a notification toast here
  };

  return (
    <div className="container-fluid py-4">
      {error && (
        <Alert variant="danger" className="mb-4">
          <strong>Error:</strong> {error}
        </Alert>
      )}
      <div className="row">
        <div className="col-12">
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">
                <FontAwesomeIcon icon={faAtom} className="me-2" />
                Quantum Circuit Designer
              </h5>
            </Card.Header>
            <Card.Body id="circuit-designer-app">
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3">Loading circuit designer...</p>
                </div>
              ) : (
                <div>
                  {/* Circuit canvas would go here */}
                  <div className="circuit-canvas p-3 border rounded" style={{ minHeight: '200px' }}>
                    <div className="text-center text-muted">
                      Circuit visualization will appear here
                    </div>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>
      
      {/* Circuit Tools Panel */}
      <div className="row">
        {/* Available Gates */}
        <div className="col-md-4">
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-dark text-white">
              <h5 className="mb-0">Available Gates</h5>
            </Card.Header>
            <Card.Body>
              <h6 className="fw-bold mb-2">Single-Qubit Gates</h6>
              <div className="d-flex flex-wrap gap-2 mb-3" id="single-qubit-gates">
                {singleQubitGates.map((gate, index) => (
                  <Button key={index} variant="outline-primary" size="sm">{gate}</Button>
                ))}
              </div>
              
              <h6 className="fw-bold mb-2">Multi-Qubit Gates</h6>
              <div className="d-flex flex-wrap gap-2 mb-3" id="multi-qubit-gates">
                {multiQubitGates.map((gate, index) => (
                  <Button key={index} variant="outline-success" size="sm">{gate}</Button>
                ))}
              </div>
              
              <h6 className="fw-bold mb-2">Special Operations</h6>
              <div className="d-flex flex-wrap gap-2" id="special-gates">
                {specialGates.map((gate, index) => (
                  <Button key={index} variant="outline-danger" size="sm">{gate}</Button>
                ))}
              </div>
            </Card.Body>
          </Card>
        </div>
        
        {/* Circuit Controls */}
        <div className="col-md-4">
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-info text-white">
              <h5 className="mb-0">Circuit Controls</h5>
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label htmlFor="circuit-name">Circuit Name</Form.Label>
                <Form.Control 
                  type="text" 
                  id="circuit-name" 
                  value={circuitName} 
                  onChange={(e) => setCircuitName(e.target.value)}
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label htmlFor="num-qubits">Number of Qubits</Form.Label>
                <div className="d-flex align-items-center">
                  <Form.Range
                    className="w-75"
                    id="num-qubits"
                    min="1"
                    max="10"
                    value={numQubits}
                    onChange={(e) => setNumQubits(parseInt(e.target.value))}
                  />
                  <span className="ms-2 fw-bold" id="num-qubits-value">{numQubits}</span>
                </div>
              </Form.Group>
              
              <Form.Group className="mb-4">
                <Form.Label htmlFor="simulation-shots">Simulation Shots</Form.Label>
                <Form.Control
                  type="number"
                  id="simulation-shots"
                  value={simulationShots}
                  onChange={(e) => setSimulationShots(parseInt(e.target.value))}
                  min="1"
                  max="10000"
                />
              </Form.Group>
              
              <div className="d-grid gap-2">
                <Button variant="success" onClick={handleRunSimulation}>
                  <FontAwesomeIcon icon={faPlay} className="me-2" /> Run Simulation
                </Button>
                <Button variant="outline-secondary" onClick={handleClearCircuit}>
                  <FontAwesomeIcon icon={faTrash} className="me-2" /> Clear Circuit
                </Button>
              </div>
            </Card.Body>
          </Card>
        </div>
        
        {/* Circuit Management */}
        <div className="col-md-4">
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-secondary text-white">
              <h5 className="mb-0">Circuit Management</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button variant="primary" onClick={handleSaveCircuit}>
                  <FontAwesomeIcon icon={faSave} className="me-2" /> Save Circuit
                </Button>
                <Button variant="outline-primary" onClick={handleExportCode}>
                  <FontAwesomeIcon icon={faCode} className="me-2" /> Export Cirq Code
                </Button>
              </div>
              
              <hr />
              
              <h6 className="fw-bold mb-2">Saved Circuits</h6>
              <div className="list-group" id="saved-circuits-list">
                {savedCircuits.length > 0 ? (
                  savedCircuits.map((circuit) => (
                    <Button 
                      key={circuit.id}
                      variant="outline-secondary" 
                      className="list-group-item list-group-item-action text-start"
                    >
                      {circuit.name}
                    </Button>
                  ))
                ) : (
                  <div className="text-center py-2 text-muted">
                    <small>No saved circuits found</small>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>
      
      {/* Simulation Results Panel */}
      {showResults && (
        <div className="row">
          <div className="col-12">
            <Card className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-success text-white">
                <h5 className="mb-0">Simulation Results</h5>
              </Card.Header>
              <Card.Body>
                <Tab.Container defaultActiveKey="statevector">
                  <Nav variant="tabs">
                    <Nav.Item>
                      <Nav.Link eventKey="statevector">
                        <FontAwesomeIcon icon={faChartBar} className="me-2" /> State Vector
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="measurements">
                        <FontAwesomeIcon icon={faPoll} className="me-2" /> Measurements
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="visualization">
                        <FontAwesomeIcon icon={faProjectDiagram} className="me-2" /> Bloch Sphere
                      </Nav.Link>
                    </Nav.Item>
                  </Nav>
                  
                  <Tab.Content className="pt-4">
                    <Tab.Pane eventKey="statevector">
                      <div className="row" id="statevector-results">
                        <div className="col-12">
                          <p>State vector results would be displayed here</p>
                        </div>
                      </div>
                    </Tab.Pane>
                    
                    <Tab.Pane eventKey="measurements">
                      <div className="row" id="measurement-results">
                        <div className="col-12">
                          <p>Measurement results would be displayed here</p>
                        </div>
                      </div>
                    </Tab.Pane>
                    
                    <Tab.Pane eventKey="visualization">
                      <div className="row" id="bloch-visualization">
                        <div className="col-12">
                          <p>Bloch sphere visualization would be displayed here</p>
                        </div>
                      </div>
                    </Tab.Pane>
                  </Tab.Content>
                </Tab.Container>
              </Card.Body>
            </Card>
          </div>
        </div>
      )}
      
      {/* Export Code Modal */}
      <Modal show={showExportModal} onHide={() => setShowExportModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Export to Cirq Code</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <pre className="bg-light p-3 rounded" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {exportedCode}
          </pre>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowExportModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={copyToClipboard}>
            <FontAwesomeIcon icon={faCopy} className="me-2" /> Copy to Clipboard
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CircuitDesigner; 
/**
 * Quantum Visualization Adapter
 * This script helps initialize the visualizations and connect them to UI controls
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Quantum visualization adapter loaded');
    
    // Initialize Bloch sphere if container exists
    initializeBlochSphere();
    
    // Initialize buttons for state changes
    setupStateButtons();
    
    // Initialize circuit demo if needed
    initializeCircuitDemo();
    
    function initializeBlochSphere() {
      // Look for either of the possible container IDs
      const container = document.getElementById('bloch-sphere-container') || 
                        document.getElementById('quantum-state-viz');
      
      if (!container) {
        console.log('No Bloch sphere container found');
        return;
      }
      
      console.log('Initializing Bloch sphere in:', container.id);
      
      try {
        // Create new Bloch sphere visualization
        const blochSphere = new quantumViz.BlochSphere(container.id);
        
        // Set initial state to |+⟩
        blochSphere.setStateByAngles(Math.PI/2, 0);
        
        // Store in window for debugging and access from other scripts
        window.blochSphere = blochSphere;
        
        console.log('Bloch sphere initialized successfully');
      } catch (error) {
        console.error('Error initializing Bloch sphere:', error);
        container.innerHTML = `
          <div class="p-3 bg-danger text-white rounded">
            Error initializing visualization: ${error.message}
          </div>`;
      }
    }
    
    function setupStateButtons() {
      // Map button IDs to state methods
      const buttonMappings = [
        { id: 'setState-plus', state: [Math.PI/2, 0] },          // |+⟩
        { id: 'setState-minus', state: [Math.PI/2, Math.PI] },   // |-⟩
        { id: 'setState-zero', state: [0, 0] },                  // |0⟩
        { id: 'setState-one', state: [Math.PI, 0] },             // |1⟩
        { id: 'setState-plus-i', state: [Math.PI/2, Math.PI/2] },// |+i⟩
        { id: 'setState-minus-i', state: [Math.PI/2, -Math.PI/2] }// |-i⟩
      ];
      
      // Add click handlers to buttons
      buttonMappings.forEach(mapping => {
        const button = document.getElementById(mapping.id);
        if (button) {
          button.addEventListener('click', function() {
            if (window.blochSphere) {
              window.blochSphere.setStateByAngles(mapping.state[0], mapping.state[1]);
              console.log(`Set state to ${button.textContent.trim()}`);
            } else {
              console.warn('Bloch sphere not initialized');
            }
          });
        }
      });
    }
    
    function initializeCircuitDemo() {
      const container = document.getElementById('circuit-demo-container');
      if (!container) return;
      
      try {
        console.log('Initializing circuit demo');
        const renderer = new quantumViz.QuantumCircuitRenderer(container.id);
        
        // Create a simple demo circuit
        const demoCircuit = {
          qubits: ['q0', 'q1', 'q2'],
          gates: [
            { type: 'H', qubit: 0, time: 0 },
            { type: 'H', qubit: 1, time: 0 },
            { type: 'CNOT', control: 1, target: 2, time: 1 }
          ]
        };
        
        renderer.render(demoCircuit);
      } catch (error) {
        console.error('Error initializing circuit demo:', error);
        container.innerHTML = `
          <div class="p-3 bg-danger text-white rounded">
            Error initializing circuit demo: ${error.message}
          </div>`;
      }
    }
  });
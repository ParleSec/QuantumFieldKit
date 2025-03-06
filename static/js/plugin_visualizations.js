/**
 * Quantum Field Kit - Plugin Visualizations
 * Handles all visualization logic for quantum simulation results
 */

// Global namespace to avoid conflicts
const QuantumVisualizer = {
    // Initialize all visualizations based on plugin data
    init: function(pluginKey, resultData) {
      if (!resultData || resultData.error) {
        console.log('No valid result data available for visualization');
        return;
      }
      
      // Initialize visualizations based on the plugin type
      switch(pluginKey) {
        case 'teleport':
        case 'handshake':
        case 'auth':
          this.initQuantumStateViz(resultData);
          break;
        case 'qrng':
        case 'bb84':
          this.initBitDistribution(resultData, pluginKey);
          break;
        case 'grover':
        case 'quantum_decryption_grover':
          this.initProbabilityDistribution(resultData, pluginKey);
          break;
        case 'vqe':
          this.initEnergyConvergence(resultData);
          break;
        default:
          // For other plugins, just log that no specific visualization is available
          console.log('No specific visualization for plugin type: ' + pluginKey);
      }
    },
    
    // Initialize Bloch sphere for quantum state visualization
    initQuantumStateViz: function(resultData) {
      const vizContainer = document.getElementById('quantum-state-viz');
      if (!vizContainer) return;
      
      try {
        // Initialize Bloch sphere visualization
        const blochSphere = new quantumViz.BlochSphere('quantum-state-viz');
        
        // Set state based on the result data
        if (resultData.output && resultData.output.final_state) {
          // Get the state data
          const stateData = resultData.output.final_state;
          
          if (Array.isArray(stateData) && stateData.length >= 2) {
            // Use the first two components for the quantum state
            blochSphere.setStateByVector(stateData[0], stateData[1]);
          } else {
            // Default to a simple state
            blochSphere.setStateByAngles(Math.PI/4, 0);
          }
        } else {
          // If no final_state data is available, show a default state
          blochSphere.setStateByAngles(Math.PI/4, 0);
        }
      } catch (e) {
        console.error('Error initializing quantum state visualization:', e);
        // Display error message in the container
        vizContainer.innerHTML = '<div class="alert alert-warning">Failed to initialize visualization</div>';
      }
    },
    
    // Initialize bit distribution chart
    initBitDistribution: function(resultData, pluginKey) {
      const chartContainer = document.getElementById('bit-distribution-chart');
      if (!chartContainer) return;
      
      try {
        let bitData = [];
        let bitLabels = ['0', '1'];
        
        if (pluginKey === 'qrng' && resultData.output && resultData.output.bitseq) {
          // Process QRNG bit sequence
          const bitSeq = resultData.output.bitseq;
          const zeroes = bitSeq.filter(bit => bit === 0).length;
          const ones = bitSeq.filter(bit => bit === 1).length;
          bitData = [zeroes, ones];
        } else if (pluginKey === 'bb84' && resultData.output && resultData.output.shared_key) {
          // Process BB84 shared key
          const sharedKey = resultData.output.shared_key;
          const zeroes = sharedKey.filter(bit => bit === 0).length;
          const ones = sharedKey.filter(bit => bit === 1).length;
          bitData = [zeroes, ones];
        } else {
          // Default data for demonstration if no real data available
          bitData = [Math.floor(Math.random() * 5) + 3, Math.floor(Math.random() * 5) + 3];
        }
        
        // Create chart
        const ctx = chartContainer.getContext('2d');
        new Chart(ctx, {
          type: 'bar',
          data: {
            labels: bitLabels,
            datasets: [{
              label: 'Bit Count',
              data: bitData,
              backgroundColor: ['rgba(54, 162, 235, 0.5)', 'rgba(255, 99, 132, 0.5)'],
              borderColor: ['rgba(54, 162, 235, 1)', 'rgba(255, 99, 132, 1)'],
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  precision: 0
                }
              }
            }
          }
        });
      } catch (e) {
        console.error('Error initializing bit distribution chart:', e);
        chartContainer.innerHTML = '<div class="alert alert-warning">Failed to initialize chart</div>';
      }
    },
    
    // Initialize probability distribution visualization for Grover and related algorithms
    initProbabilityDistribution: function(resultData, pluginKey) {
      const chartContainer = document.getElementById('probability-distribution');
      if (!chartContainer) return;
      
      try {
        let labels = [];
        let probData = [];
        
        if (pluginKey === 'grover' && resultData.output) {
          // Extract number of qubits from output or default to 3
          const n = resultData.output.n || 3;
          const targetState = resultData.output.target_state || '101';
          const numStates = Math.pow(2, n);
          
          // Create labels and probability data
          for (let i = 0; i < numStates; i++) {
            const stateBinary = i.toString(2).padStart(n, '0');
            labels.push(`|${stateBinary}⟩`);
            // Highlight the target state with high probability
            probData.push(stateBinary === targetState ? 0.9 : 0.1 / (numStates - 1));
          }
        } else {
          // Default data for demonstration
          for (let i = 0; i < 8; i++) {
            labels.push(`|${i.toString(2).padStart(3, '0')}⟩`);
            probData.push(Math.random() * 0.2);
          }
          // Make one state prominent
          probData[3] = 0.8;
        }
        
        // Create chart
        const ctx = chartContainer.getContext('2d');
        new Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Probability',
              data: probData,
              backgroundColor: 'rgba(153, 102, 255, 0.5)',
              borderColor: 'rgba(153, 102, 255, 1)',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                max: 1
              }
            }
          }
        });
      } catch (e) {
        console.error('Error initializing probability distribution chart:', e);
        chartContainer.innerHTML = '<div class="alert alert-warning">Failed to initialize chart</div>';
      }
    },
    
    // Initialize energy convergence chart for VQE
    initEnergyConvergence: function(resultData) {
      const chartContainer = document.getElementById('energy-convergence');
      if (!chartContainer) return;
      
      try {
        let iterations = [];
        let energyValues = [];
        
        if (resultData.output && resultData.output.energy_iterations) {
          // Use actual energy iteration data if available
          energyValues = resultData.output.energy_iterations;
          iterations = Array.from({length: energyValues.length}, (_, i) => i + 1);
        } else {
          // Create mock energy convergence data for demonstration
          iterations = Array.from({length: 10}, (_, i) => i + 1);
          // Simulate decreasing energy values converging to a minimum
          energyValues = iterations.map(i => 1.0 / (i + 1) + 0.1 * Math.random());
        }
        
        // Create chart
        const ctx = chartContainer.getContext('2d');
        new Chart(ctx, {
          type: 'line',
          data: {
            labels: iterations,
            datasets: [{
              label: 'Energy',
              data: energyValues,
              borderColor: 'rgba(75, 192, 192, 1)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              tension: 0.1,
              fill: true
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                title: {
                  display: true,
                  text: 'Energy'
                }
              },
              x: {
                title: {
                  display: true,
                  text: 'Iteration'
                }
              }
            }
          }
        });
      } catch (e) {
        console.error('Error initializing energy convergence chart:', e);
        chartContainer.innerHTML = '<div class="alert alert-warning">Failed to initialize chart</div>';
      }
    }
  };
  
  // Additional utility functions
  document.addEventListener('DOMContentLoaded', function() {
    // Handle form submission via AJAX
    const setupFormHandling = () => {
      const form = document.getElementById('simulation-form');
      const statusBadge = document.getElementById('status-badge');
      const resetBtn = document.getElementById('reset-form');
      
      if (form) {
        form.addEventListener('submit', function(e) {
          e.preventDefault();
          
          // Update status badge
          if (statusBadge) {
            statusBadge.textContent = 'Running...';
            statusBadge.className = 'badge bg-warning';
          }
          
          // Create FormData from form
          const formData = new FormData(form);
          const url = window.location.href;
          
          // Submit form via AJAX
          fetch(url, {
            method: 'POST',
            body: formData,
            headers: {
              'X-Requested-With': 'XMLHttpRequest'
            }
          })
          .then(response => response.json())
          .then(data => {
            // Update status badge based on result
            if (statusBadge) {
              if (data.error) {
                statusBadge.textContent = 'Error';
                statusBadge.className = 'badge bg-danger';
                alert('Error: ' + data.error);
              } else {
                statusBadge.textContent = 'Completed';
                statusBadge.className = 'badge bg-success';
                // Reload the page to show results
                window.location.reload();
              }
            }
          })
          .catch(error => {
            console.error('Error:', error);
            if (statusBadge) {
              statusBadge.textContent = 'Error';
              statusBadge.className = 'badge bg-danger';
            }
            alert('Network error occurred. Please try again.');
          });
        });
      }
      
      // Handle form reset
      if (resetBtn) {
        resetBtn.addEventListener('click', function() {
          if (form) {
            form.reset();
            // Reset range inputs which might have custom handling
            document.querySelectorAll('input[type="range"]').forEach(range => {
              const targetInput = document.getElementById(range.id.replace('_range', ''));
              if (targetInput) {
                targetInput.value = targetInput.defaultValue;
                range.value = targetInput.defaultValue;
              }
            });
          }
        });
      }
    };
    
    // Initialize form handling
    setupFormHandling();
    
    // Initialize range input synchronization
    const syncRangeInputs = () => {
      document.querySelectorAll('input[type="range"]').forEach(range => {
        const numberInputId = range.id.replace('_range', '');
        const numberInput = document.getElementById(numberInputId);
        
        if (numberInput) {
          // Initial sync
          if (range.value !== numberInput.value) {
            numberInput.value = range.value;
          }
          
          // Listen for input events on range
          range.addEventListener('input', () => {
            numberInput.value = range.value;
          });
          
          // Listen for input events on number input
          numberInput.addEventListener('input', () => {
            range.value = numberInput.value;
          });
        }
      });
    };
    
    // Initialize range inputs
    syncRangeInputs();
  });
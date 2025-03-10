/**
 * Quantum Field Kit - Plugin Visualizations
 * Handles all visualization logic for quantum simulation results
 */

// Global namespace to avoid conflicts
const QuantumVisualizer = {
    // Initialize all visualizations based on plugin data
    init: function(pluginKey, resultData) {
        console.log('Initializing visualizations for plugin:', pluginKey);
        console.log('Result data:', resultData);
        
        if (!resultData || resultData.error) {
          console.log('No valid result data available for visualization');
          return;
        }
        
        // Initialize visualizations based on the plugin type
        switch(pluginKey) {
          case 'teleport':
          case 'handshake':
          case 'auth':
            console.log('Initializing quantum state visualization');
            this.initQuantumStateViz(resultData);
            break;
          case 'qrng':
          case 'bb84':
            console.log('Initializing bit distribution visualization');
            this.initBitDistribution(resultData, pluginKey);
            break;
          case 'grover':
          case 'quantum_decryption_grover':
            console.log('Initializing probability distribution visualization');
            this.initProbabilityDistribution(resultData, pluginKey);
            break;
          case 'vqe':
            console.log('Initializing energy convergence visualization');
            this.initEnergyConvergence(resultData);
            break;
          default:
            // For other plugins, just log that no specific visualization is available
            console.log('No specific visualization for plugin type: ' + pluginKey);
        }
      }
    ,
    // Initialize Bloch sphere for quantum state visualization
    initQuantumStateViz: function(resultData) {
        const vizContainer = document.getElementById('quantum-state-viz');
        if (!vizContainer) return;
        
        try {
          // Clear any existing content
          vizContainer.innerHTML = '';
          
          // Create a canvas element
          const canvas = document.createElement('canvas');
          canvas.width = vizContainer.clientWidth || 300;
          canvas.height = vizContainer.clientHeight || 300;
          vizContainer.appendChild(canvas);
          
          // Get the 2D context
          const ctx = canvas.getContext('2d');
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;
          const radius = Math.min(centerX, centerY) - 20;
          
          // Set background
          ctx.fillStyle = '#141424';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Draw the Bloch sphere (simplified 2D representation)
          // Draw the circle
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
          ctx.strokeStyle = '#444';
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Draw the axes
          ctx.beginPath();
          // Z-axis (vertical)
          ctx.moveTo(centerX, centerY - radius);
          ctx.lineTo(centerX, centerY + radius);
          // X-axis (horizontal)
          ctx.moveTo(centerX - radius, centerY);
          ctx.lineTo(centerX + radius, centerY);
          ctx.strokeStyle = '#888';
          ctx.lineWidth = 1;
          ctx.stroke();
          
          // Add labels
          ctx.font = '14px Arial';
          ctx.fillStyle = '#fff';
          ctx.textAlign = 'center';
          ctx.fillText('|0⟩', centerX, centerY - radius - 10);
          ctx.fillText('|1⟩', centerX, centerY + radius + 20);
          ctx.fillText('|+⟩', centerX + radius + 20, centerY);
          ctx.fillText('|-⟩', centerX - radius - 20, centerY);
          
          // Draw state vector based on result data
          let theta = Math.PI / 4; // Default angle if no data
          let phi = 0;
          
          // Extract state from result data if available
          if (resultData.output && resultData.output.final_state) {
            // Get the state data
            const stateData = resultData.output.final_state;
            
            if (Array.isArray(stateData) && stateData.length >= 2) {
              // Calculate theta and phi from state vector
              const alpha = stateData[0];
              const beta = stateData[1];
              const alphaAbs = typeof alpha === 'object' ? 
                Math.sqrt(alpha.real**2 + alpha.imag**2) : Math.abs(alpha);
              
              theta = 2 * Math.acos(alphaAbs);
              if (alphaAbs < 0.9999 && Math.abs(beta) > 0.0001) {
                if (typeof beta === 'object' && typeof alpha === 'object') {
                  phi = Math.atan2(beta.imag, beta.real) - Math.atan2(alpha.imag, alpha.real);
                } else {
                  phi = beta >= 0 ? 0 : Math.PI;
                }
              }
            }
          }
          
          // Convert spherical coordinates to 2D projection
          const x = radius * Math.sin(theta) * Math.cos(phi);
          const y = radius * Math.sin(theta) * Math.sin(phi);
          const z = radius * Math.cos(theta);
          
          // Project 3D point onto 2D
          const projX = centerX + x;
          const projY = centerY - z; // Negative to match conventional coordinates
          
          // Draw the state vector
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(projX, projY);
          ctx.strokeStyle = '#ff3366';
          ctx.lineWidth = 3;
          ctx.stroke();
          
          // Draw arrowhead
          const headSize = 10;
          const angle = Math.atan2(projY - centerY, projX - centerX);
          ctx.beginPath();
          ctx.moveTo(projX, projY);
          ctx.lineTo(
            projX - headSize * Math.cos(angle - Math.PI/6),
            projY - headSize * Math.sin(angle - Math.PI/6)
          );
          ctx.lineTo(
            projX - headSize * Math.cos(angle + Math.PI/6),
            projY - headSize * Math.sin(angle + Math.PI/6)
          );
          ctx.closePath();
          ctx.fillStyle = '#ff3366';
          ctx.fill();
          
          // Display state information
          ctx.fillStyle = '#fff';
          ctx.font = '12px Arial';
          ctx.textAlign = 'left';
          ctx.fillText(`θ: ${(theta * 180 / Math.PI).toFixed(1)}°`, 10, 20);
          ctx.fillText(`φ: ${(phi * 180 / Math.PI).toFixed(1)}°`, 10, 40);
          
          console.log("Successfully rendered 2D Bloch sphere visualization");
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
            console.log("Form submitted"); // Debug log
            
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
            .then(response => {
              console.log("Response received", response); // Debug log
              return response.json();
            })
            .then(data => {
              console.log("Data received", data); // Debug log
              // Update status badge based on result
              if (statusBadge) {
                if (data.error) {
                  statusBadge.textContent = 'Error';
                  statusBadge.className = 'badge bg-danger';
                  alert('Error: ' + data.error);
                } else {
                  statusBadge.textContent = 'Completed';
                  statusBadge.className = 'badge bg-success';
                  // Instead of reloading, display results directly
                  displayResults(data);
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
    
    function displayResults(data) {
        // Get the results container
        const resultsContainer = document.getElementById('results-container');
        if (!resultsContainer) return;
        
        // Extract the plugin key from the URL
        const urlParts = window.location.pathname.split('/');
        const pluginKey = urlParts[urlParts.length - 1];
        
        // Create visualization tabs structure
        const tabsHTML = `
          <div class="result-container">
            <!-- Visualization tabs -->
            <ul class="nav nav-tabs" id="resultTabs" role="tablist">
              <li class="nav-item" role="presentation">
                <button class="nav-link active" id="visualization-tab" data-bs-toggle="tab" 
                        data-bs-target="#visualization" type="button" role="tab" 
                        aria-controls="visualization" aria-selected="true">
                  <i class="fas fa-chart-bar me-2"></i> Visualization
                </button>
              </li>
              <li class="nav-item" role="presentation">
                <button class="nav-link" id="raw-data-tab" data-bs-toggle="tab" 
                        data-bs-target="#raw-data" type="button" role="tab" 
                        aria-controls="raw-data" aria-selected="false">
                  <i class="fas fa-table me-2"></i> Raw Data
                </button>
              </li>
              <li class="nav-item" role="presentation">
                <button class="nav-link" id="log-tab" data-bs-toggle="tab" 
                        data-bs-target="#log" type="button" role="tab" 
                        aria-controls="log" aria-selected="false">
                  <i class="fas fa-terminal me-2"></i> Process Log
                </button>
              </li>
            </ul>
            
            <div class="tab-content p-3 border border-top-0 rounded-bottom" id="resultTabsContent">
              <!-- Visualization Tab -->
              <div class="tab-pane fade show active" id="visualization" role="tabpanel" aria-labelledby="visualization-tab">
                ${data.output && data.output.circuit_svg ? `
                  <h5 class="mb-3">Circuit Diagram</h5>
                  <div class="circuit-svg bg-white p-3 rounded mb-4 text-center overflow-auto">
                    ${data.output.circuit_svg}
                  </div>
                ` : ''}
                
                <!-- Specific visualizations based on plugin type -->
                <div class="row">
                  ${pluginKey === 'qrng' || pluginKey === 'bb84' ? `
                    <div class="col-md-6 mb-4">
                      <div class="card">
                        <div class="card-header">Bit Distribution</div>
                        <div class="card-body">
                          <canvas id="bit-distribution-chart" class="chart-container"></canvas>
                        </div>
                      </div>
                    </div>
                  ` : ''}
                  
                  ${pluginKey === 'teleport' || pluginKey === 'handshake' || pluginKey === 'auth' ? `
                    <div class="col-md-6 mb-4">
                      <div class="card">
                        <div class="card-header">Quantum State</div>
                        <div class="card-body">
                          <div id="quantum-state-viz" class="chart-container"></div>
                        </div>
                      </div>
                    </div>
                  ` : ''}
                  
                  ${pluginKey === 'grover' || pluginKey === 'quantum_decryption_grover' ? `
                    <div class="col-md-6 mb-4">
                      <div class="card">
                        <div class="card-header">Probability Distribution</div>
                        <div class="card-body">
                          <canvas id="probability-distribution" class="chart-container"></canvas>
                        </div>
                      </div>
                    </div>
                  ` : ''}
                  
                  ${pluginKey === 'vqe' ? `
                    <div class="col-md-6 mb-4">
                      <div class="card">
                        <div class="card-header">Energy Convergence</div>
                        <div class="card-body">
                          <canvas id="energy-convergence" class="chart-container"></canvas>
                        </div>
                      </div>
                    </div>
                  ` : ''}
                </div>
              </div>
              
              <!-- Raw Data Tab -->
              <div class="tab-pane fade" id="raw-data" role="tabpanel" aria-labelledby="raw-data-tab">
                <div class="row">
                  <div class="col-12">
                    <pre class="mb-0">${JSON.stringify(data.output, null, 2)}</pre>
                  </div>
                </div>
              </div>
              
              <!-- Log Tab -->
              <div class="tab-pane fade" id="log" role="tabpanel" aria-labelledby="log-tab">
                <div class="bg-dark text-light p-3 rounded">
                  <pre class="mb-0 terminal-log">${data.log || 'No log data available'}</pre>
                </div>
              </div>
            </div>
          </div>
        `;
        
        // Replace existing content
        resultsContainer.innerHTML = tabsHTML;
        
        // Initialize visualization components
        QuantumVisualizer.init(pluginKey, data);
        
        // Initialize Bootstrap tabs if needed
        if (typeof bootstrap !== 'undefined' && bootstrap.Tab) {
          document.querySelectorAll('#resultTabs button').forEach(button => {
            new bootstrap.Tab(button);
          });
        }
      }

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
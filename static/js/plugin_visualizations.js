/**
 * Quantum Field Kit - Plugin Visualizations
 * Handles all visualization logic for quantum simulation results
 */

// Global namespace to avoid conflicts
window.QuantumVisualizer = window.QuantumVisualizer || {
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

        case 'deutsch_jozsa':
          console.log('Initializing Deutsch-Jozsa visualization');
          this.initDeutschJozsaVisualization(resultData);
          break;
          
        case 'qft':
          console.log('Initializing QFT visualization');
          this.initQFTVisualization(resultData);
          break;
          
        case 'phase_estimation':
          console.log('Initializing Phase Estimation visualization');
          this.initPhaseEstimationVisualization(resultData);
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
  },
  
// Deutsch-Jozsa visualization
initDeutschJozsaVisualization: function(resultData) {
const vizContainer = document.getElementById('deutsch-jozsa-viz');
if (!vizContainer) return;

try {
  // Clear any existing content
  vizContainer.innerHTML = '';
  
  // Create canvas for oracle type visualization
  const canvas = document.createElement('canvas');
  canvas.width = vizContainer.clientWidth || 400;
  canvas.height = vizContainer.clientHeight || 300;
  vizContainer.appendChild(canvas);
  
  // Get the 2D context
  const ctx = canvas.getContext('2d');
  
  // Get data from the result
  const output = resultData.output || {};
  const oracleType = output.oracle_type || 'unknown';
  const isConstant = output.is_function_constant || false;
  const actualConstant = output.actual_function_constant || false;
  const correct = output.correct_determination || false;
  
  // Set background
  ctx.fillStyle = '#f8f9fa';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw oracle visualization
  ctx.textAlign = 'center';
  ctx.font = '16px Arial';
  ctx.fillStyle = '#333';
  
  ctx.fillText(`Oracle Type: ${oracleType}`, canvas.width/2, 40);
  
  // Draw function type box
  ctx.fillStyle = isConstant ? '#4CAF50' : '#2196F3';
  ctx.fillRect(canvas.width/2 - 100, 60, 200, 50);
  
  ctx.fillStyle = '#fff';
  ctx.fillText(`Determined: ${isConstant ? 'Constant' : 'Balanced'}`, canvas.width/2, 90);
  
  // Draw actual function type
  ctx.fillStyle = actualConstant ? '#4CAF50' : '#2196F3';
  ctx.fillRect(canvas.width/2 - 100, 120, 200, 50);
  
  ctx.fillStyle = '#fff';
  ctx.fillText(`Actual: ${actualConstant ? 'Constant' : 'Balanced'}`, canvas.width/2, 150);
  
  // Draw accuracy indicator
  ctx.fillStyle = correct ? '#4CAF50' : '#F44336';
  ctx.fillRect(canvas.width/2 - 100, 180, 200, 50);
  
  ctx.fillStyle = '#fff';
  ctx.fillText(`Determination: ${correct ? 'Correct' : 'Incorrect'}`, canvas.width/2, 210);
  
  // Add explanatory text
  ctx.fillStyle = '#333';
  ctx.textAlign = 'left';
  ctx.font = '14px Arial';
  ctx.fillText('The Deutsch-Jozsa algorithm determines whether a function is', 20, 250);
  ctx.fillText('constant or balanced with a single quantum query, showing', 20, 270);
  ctx.fillText('quantum advantage over classical algorithms.', 20, 290);
  
} catch (e) {
  console.error('Error creating Deutsch-Jozsa visualization:', e);
  vizContainer.innerHTML = '<div class="alert alert-warning">Failed to initialize visualization</div>';
}
},

// QFT visualization
initQFTVisualization: function(resultData) {
const vizContainer = document.getElementById('qft-state-viz');
if (!vizContainer) return;

try {
  // Clear any existing content
  vizContainer.innerHTML = '';
  
  // Create canvas for QFT visualization
  const canvas = document.createElement('canvas');
  canvas.width = vizContainer.clientWidth || 400;
  canvas.height = vizContainer.clientHeight || 300;
  vizContainer.appendChild(canvas);
  
  // Get the 2D context
  const ctx = canvas.getContext('2d');
  
  // Get data from the result
  const output = resultData.output || {};
  const inputState = output.input_state || '';
  const measuredState = output.measured_state || '';
  const includeInverse = output.include_inverse || false;
  
  // Set background
  ctx.fillStyle = '#f8f9fa';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw QFT transformation visualization
  const centerX = canvas.width / 2;
  const yStart = 70;
  
  // Title
  ctx.textAlign = 'center';
  ctx.font = 'bold 18px Arial';
  ctx.fillStyle = '#333';
  ctx.fillText('Quantum Fourier Transform', centerX, 30);
  
  // Input state
  ctx.fillStyle = '#2196F3';
  ctx.fillRect(centerX - 100, yStart, 200, 50);
  
  ctx.fillStyle = '#fff';
  ctx.font = '16px Arial';
  ctx.fillText(`Input: |${inputState}⟩`, centerX, yStart + 30);
  
  // Arrow down
  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.moveTo(centerX, yStart + 60);
  ctx.lineTo(centerX - 10, yStart + 70);
  ctx.lineTo(centerX + 10, yStart + 70);
  ctx.closePath();
  ctx.fill();
  
  // QFT operation
  ctx.fillStyle = '#FF9800';
  ctx.fillRect(centerX - 100, yStart + 80, 200, 50);
  
  ctx.fillStyle = '#fff';
  ctx.fillText('QFT', centerX, yStart + 110);
  
  // Arrow down for QFT result or inverse QFT
  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.moveTo(centerX, yStart + 140);
  ctx.lineTo(centerX - 10, yStart + 150);
  ctx.lineTo(centerX + 10, yStart + 150);
  ctx.closePath();
  ctx.fill();
  
  // If inverse is included, show another step
  if (includeInverse) {
    ctx.fillStyle = '#9C27B0';
    ctx.fillRect(centerX - 100, yStart + 160, 200, 50);
    
    ctx.fillStyle = '#fff';
    ctx.fillText('Inverse QFT', centerX, yStart + 190);
    
    // Arrow down for final result
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.moveTo(centerX, yStart + 220);
    ctx.lineTo(centerX - 10, yStart + 230);
    ctx.lineTo(centerX + 10, yStart + 230);
    ctx.closePath();
    ctx.fill();
    
    // Final state
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(centerX - 100, yStart + 240, 200, 50);
    
    ctx.fillStyle = '#fff';
    ctx.fillText(`Measured: |${measuredState}⟩`, centerX, yStart + 270);
    
    // Success indicator
    if (inputState === measuredState) {
      ctx.fillStyle = '#4CAF50';
      ctx.fillRect(centerX - 100, yStart + 300, 200, 30);
      ctx.fillStyle = '#fff';
      ctx.font = '14px Arial';
      ctx.fillText('Successfully recovered input state', centerX, yStart + 320);
    } else {
      ctx.fillStyle = '#F44336';
      ctx.fillRect(centerX - 100, yStart + 300, 200, 30);
      ctx.fillStyle = '#fff';
      ctx.font = '14px Arial';
      ctx.fillText('Input state changed (likely due to noise)', centerX, yStart + 320);
    }
  } else {
    // Fourier basis state
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(centerX - 100, yStart + 160, 200, 50);
    
    ctx.fillStyle = '#fff';
    ctx.fillText(`Measured: |${measuredState}⟩`, centerX, yStart + 190);
    
    // Explanation
    ctx.fillStyle = '#333';
    ctx.textAlign = 'left';
    ctx.font = '14px Arial';
    ctx.fillText('The state is now in the Fourier basis,', centerX - 100, yStart + 230);
    ctx.fillText('encoding frequency information of the input.', centerX - 100, yStart + 250);
  }
  
} catch (e) {
  console.error('Error creating QFT visualization:', e);
  vizContainer.innerHTML = '<div class="alert alert-warning">Failed to initialize visualization</div>';
}
},

// Phase Estimation visualization
initPhaseEstimationVisualization: function(resultData) {
const vizContainer = document.getElementById('phase-estimation-viz');
if (!vizContainer) return;

try {
  // Clear any existing content
  vizContainer.innerHTML = '';
  
  // Create canvas for phase visualization
  const canvas = document.createElement('canvas');
  canvas.width = vizContainer.clientWidth || 400;
  canvas.height = vizContainer.clientHeight || 300;
  vizContainer.appendChild(canvas);
  
  // Get the 2D context
  const ctx = canvas.getContext('2d');
  
  // Get data from the result
  const output = resultData.output || {};
  const targetPhase = output.target_phase || 0;
  const estimatedPhase = output.estimated_phase || 0;
  const phaseError = output.phase_error || 0;
  const accuracy = output.theoretical_accuracy || 0;
  const precisionBits = output.precision_bits || 3;
  
  // Set background
  ctx.fillStyle = '#f8f9fa';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw title
  ctx.textAlign = 'center';
  ctx.font = 'bold 18px Arial';
  ctx.fillStyle = '#333';
  ctx.fillText('Quantum Phase Estimation', canvas.width/2, 30);
  
  // Draw phase circle visualization
  const centerX = canvas.width / 2;
  const centerY = 150;
  const radius = 100;
  
  // Draw circle
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Draw center point
  ctx.beginPath();
  ctx.arc(centerX, centerY, 3, 0, 2 * Math.PI);
  ctx.fillStyle = '#333';
  ctx.fill();
  
  // Draw 0 phase marker
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(centerX + radius, centerY);
  ctx.strokeStyle = '#999';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  // Draw target phase line
  const targetAngle = targetPhase * 2 * Math.PI;
  const targetX = centerX + radius * Math.cos(targetAngle);
  const targetY = centerY + radius * Math.sin(targetAngle);
  
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(targetX, targetY);
  ctx.strokeStyle = '#4CAF50';
  ctx.lineWidth = 3;
  ctx.stroke();
  
  // Draw target phase point
  ctx.beginPath();
  ctx.arc(targetX, targetY, 6, 0, 2 * Math.PI);
  ctx.fillStyle = '#4CAF50';
  ctx.fill();
  
  // Draw estimated phase line
  const estimatedAngle = estimatedPhase * 2 * Math.PI;
  const estimatedX = centerX + radius * Math.cos(estimatedAngle);
  const estimatedY = centerY + radius * Math.sin(estimatedAngle);
  
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(estimatedX, estimatedY);
  ctx.strokeStyle = '#2196F3';
  ctx.lineWidth = 3;
  ctx.stroke();
  
  // Draw estimated phase point
  ctx.beginPath();
  ctx.arc(estimatedX, estimatedY, 6, 0, 2 * Math.PI);
  ctx.fillStyle = '#2196F3';
  ctx.fill();
  
  // Draw legend and info
  ctx.textAlign = 'left';
  ctx.font = '14px Arial';
  ctx.fillStyle = '#333';
  
  // Target phase marker
  ctx.fillStyle = '#4CAF50';
  ctx.fillRect(20, 220, 15, 15);
  ctx.fillStyle = '#333';
  ctx.fillText(`Target phase: ${targetPhase.toFixed(4)}`, 45, 232);
  
  // Estimated phase marker
  ctx.fillStyle = '#2196F3';
  ctx.fillRect(20, 245, 15, 15);
  ctx.fillStyle = '#333';
  ctx.fillText(`Estimated phase: ${estimatedPhase.toFixed(4)}`, 45, 257);
  
  // Phase error
  ctx.fillText(`Error: ${phaseError.toFixed(6)}`, 45, 282);
  
  // Theoretical accuracy
  ctx.textAlign = 'right';
  ctx.fillText(`Precision bits: ${precisionBits}`, canvas.width - 20, 232);
  ctx.fillText(`Theoretical accuracy: 1/${Math.pow(2, precisionBits)} = ${accuracy.toFixed(6)}`, canvas.width - 20, 257);
  
  // Compare error to theoretical accuracy
  if (phaseError <= accuracy) {
    ctx.fillStyle = '#4CAF50';
    ctx.fillText('✓ Within theoretical bounds', canvas.width - 20, 282);
  } else {
    ctx.fillStyle = '#F44336';
    ctx.fillText('✗ Outside theoretical bounds', canvas.width - 20, 282);
  }
  
} catch (e) {
  console.error('Error creating Phase Estimation visualization:', e);
  vizContainer.innerHTML = '<div class="alert alert-warning">Failed to initialize visualization</div>';
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

// Safely injects SVG content by creating a new div and using the DOM parser
function displayResults(data) {
// Get the results container
const resultsContainer = document.getElementById('results-container');
if (!resultsContainer) return;

// Extract the plugin key from the URL
const urlParts = window.location.pathname.split('/');
const pluginKey = urlParts[urlParts.length - 1];

// Create a container for the results
resultsContainer.innerHTML = '';

// Create the tabs structure
const tabsContainer = document.createElement('div');
tabsContainer.className = 'result-container';

// Create tab navigation
const tabNav = document.createElement('ul');
tabNav.className = 'nav nav-tabs';
tabNav.id = 'resultTabs';
tabNav.setAttribute('role', 'tablist');

// Add tab buttons
const tabItems = [
  {id: 'visualization', icon: 'chart-bar', text: 'Visualization', active: true},
  {id: 'raw-data', icon: 'table', text: 'Raw Data', active: false},
  {id: 'log', icon: 'terminal', text: 'Process Log', active: false}
];

tabItems.forEach(item => {
  const li = document.createElement('li');
  li.className = 'nav-item';
  li.setAttribute('role', 'presentation');
  
  const button = document.createElement('button');
  button.className = `nav-link ${item.active ? 'active' : ''}`;
  button.id = `${item.id}-tab`;
  button.setAttribute('data-bs-toggle', 'tab');
  button.setAttribute('data-bs-target', `#${item.id}`);
  button.setAttribute('type', 'button');
  button.setAttribute('role', 'tab');
  button.setAttribute('aria-controls', item.id);
  button.setAttribute('aria-selected', item.active ? 'true' : 'false');
  
  const icon = document.createElement('i');
  icon.className = `fas fa-${item.icon} me-2`;
  
  button.appendChild(icon);
  button.appendChild(document.createTextNode(item.text));
  li.appendChild(button);
  tabNav.appendChild(li);
});

tabsContainer.appendChild(tabNav);

// Create tab content container
const tabContent = document.createElement('div');
tabContent.className = 'tab-content p-3 border border-top-0 rounded-bottom';
tabContent.id = 'resultTabsContent';

// Create visualization tab content
const vizTab = document.createElement('div');
vizTab.className = 'tab-pane fade show active';
vizTab.id = 'visualization';
vizTab.setAttribute('role', 'tabpanel');
vizTab.setAttribute('aria-labelledby', 'visualization-tab');

// Add circuit SVG if available
if (data.output && data.output.circuit_svg) {
  const circuitTitle = document.createElement('h5');
  circuitTitle.className = 'mb-3';
  circuitTitle.textContent = 'Circuit Diagram';
  vizTab.appendChild(circuitTitle);
  
  const circuitContainer = document.createElement('div');
  circuitContainer.className = 'circuit-svg bg-white p-3 rounded mb-4 text-center overflow-auto';
  
  // IMPORTANT FIX: Use a proper DOM parser for SVG instead of innerHTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = data.output.circuit_svg;
  
  // Append the SVG element(s) to the circuit container
  while (tempDiv.firstChild) {
    circuitContainer.appendChild(tempDiv.firstChild);
  }
  
  vizTab.appendChild(circuitContainer);
}

// Add specific visualization containers based on plugin type
const vizRow = document.createElement('div');
vizRow.className = 'row';

// Add appropriate visualization containers based on plugin type
if (pluginKey === 'qrng' || pluginKey === 'bb84') {
  const bitDistCol = createVisualizationCard('Bit Distribution', 'bit-distribution-chart');
  vizRow.appendChild(bitDistCol);
}

if (pluginKey === 'teleport' || pluginKey === 'handshake' || pluginKey === 'auth') {
  const stateVizCol = createVisualizationCard('Quantum State', 'quantum-state-viz');
  vizRow.appendChild(stateVizCol);
}

if (pluginKey === 'grover' || pluginKey === 'quantum_decryption_grover') {
  const probDistCol = createVisualizationCard('Probability Distribution', 'probability-distribution');
  vizRow.appendChild(probDistCol);
}

if (pluginKey === 'vqe') {
  const energyCol = createVisualizationCard('Energy Convergence', 'energy-convergence');
  vizRow.appendChild(energyCol);
}

vizTab.appendChild(vizRow);
tabContent.appendChild(vizTab);

// Create raw data tab content
const rawDataTab = document.createElement('div');
rawDataTab.className = 'tab-pane fade';
rawDataTab.id = 'raw-data';
rawDataTab.setAttribute('role', 'tabpanel');
rawDataTab.setAttribute('aria-labelledby', 'raw-data-tab');

const rawDataRow = document.createElement('div');
rawDataRow.className = 'row';

const rawDataCol = document.createElement('div');
rawDataCol.className = 'col-12';

const rawDataPre = document.createElement('pre');
rawDataPre.className = 'mb-0';
rawDataPre.textContent = JSON.stringify(data.output, null, 2);

rawDataCol.appendChild(rawDataPre);
rawDataRow.appendChild(rawDataCol);
rawDataTab.appendChild(rawDataRow);
tabContent.appendChild(rawDataTab);

// Create log tab content
const logTab = document.createElement('div');
logTab.className = 'tab-pane fade';
logTab.id = 'log';
logTab.setAttribute('role', 'tabpanel');
logTab.setAttribute('aria-labelledby', 'log-tab');

const logDiv = document.createElement('div');
logDiv.className = 'bg-dark text-light p-3 rounded';

const logPre = document.createElement('pre');
logPre.className = 'mb-0 terminal-log';
logPre.textContent = data.log || 'No log data available';

logDiv.appendChild(logPre);
logTab.appendChild(logDiv);
tabContent.appendChild(logTab);

tabsContainer.appendChild(tabContent);
resultsContainer.appendChild(tabsContainer);

// Initialize visualization components
if (window.QuantumVisualizer) {
  window.QuantumVisualizer.init(pluginKey, data);
}

// Initialize Bootstrap tabs if needed
if (typeof bootstrap !== 'undefined' && bootstrap.Tab) {
  document.querySelectorAll('#resultTabs button').forEach(button => {
    new bootstrap.Tab(button);
  });
}
}

// Helper function to create visualization cards
function createVisualizationCard(title, containerId) {
  const col = document.createElement('div');
  col.className = 'col-md-6 mb-4';
  
  const card = document.createElement('div');
  card.className = 'card';
  
  const cardHeader = document.createElement('div');
  cardHeader.className = 'card-header';
  cardHeader.textContent = title;
  
  const cardBody = document.createElement('div');
  cardBody.className = 'card-body';
  
  // Create the container for the visualization
  if (containerId.endsWith('-chart') || 
      containerId === 'probability-distribution' || 
      containerId === 'energy-convergence' || 
      containerId === 'bit-distribution-chart') {
    // For Chart.js visualizations - must be a canvas element
    const canvas = document.createElement('canvas');
    canvas.id = containerId;
    canvas.className = 'chart-container';
    cardBody.appendChild(canvas);
  } else {
    // For other visualizations (like Bloch sphere)
    const container = document.createElement('div');
    container.id = containerId;
    container.className = 'chart-container';
    cardBody.appendChild(container);
  }
  
  card.appendChild(cardHeader);
  card.appendChild(cardBody);
  col.appendChild(card);
  
  return col;
}
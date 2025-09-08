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
        console.log('Initializing quantum state visualization');
        this.initQuantumStateViz(resultData);
        break;
      case 'auth':
        console.log('Initializing lattice-based authentication visualization');
        this.initLatticeAuthViz(resultData);
        break;
      case 'qrng':
        console.log('Initializing enhanced QRNG visualization');
        this.initQRNG(resultData, pluginKey);
        break;
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
  },

  initLatticeAuthViz: function(resultData) {
    console.log('Setting up lattice-based authentication visualizations');
    
    // Get the output data from the result
    const outputData = resultData.output || {};
    
    // Create the lattice visualization from base64 image if provided
    if (outputData.lattice_viz) {
      this.createLatticeVizFromImage(outputData.lattice_viz);
    }
    
    // Create the authentication protocol visualization
    this.createAuthProtocolViz(outputData);
    
    // Initialize quantum state visualization for compatibility
    this.initQuantumStateViz(resultData);
    
    // Create security strength visualization
    this.createSecurityStrengthViz(outputData);
  },
  
  // Create lattice visualization from base64 image
  createLatticeVizFromImage: function(base64Data) {
    const container = document.getElementById('lattice-visualization');
    if (!container) {
      console.warn('Lattice visualization container not found');
      return;
    }
    
    // Clear existing content
    container.innerHTML = '';
    
    // Create the image element
    const img = document.createElement('img');
    img.src = 'data:image/png;base64,' + base64Data;
    img.className = 'img-fluid rounded';
    img.alt = 'Lattice Coefficient Distribution';
    
    // Add the image to the container
    container.appendChild(img);
    
    // Add explanation text
    const explanation = document.createElement('div');
    explanation.className = 'mt-3 text-center lattice-explanation';
    explanation.innerHTML = `
      <p class="text-muted">
        <i class="fas fa-info-circle me-1"></i>
        The lattice visualization shows the distribution of coefficients used in the Ring-LWE cryptographic system.
        These coefficients form the mathematical foundation of the post-quantum secure authentication protocol.
      </p>
    `;
    container.appendChild(explanation);
    
    console.log('Lattice visualization created from base64 image');
  },
  
  // Create authentication protocol visualization
  createAuthProtocolViz: function(outputData) {
    const container = document.getElementById('auth-protocol-visualization');
    if (!container) {
      console.warn('Auth protocol visualization container not found');
      return;
    }
    
    // Clear existing content
    container.innerHTML = '';
    
    // Create auth status banner
    const authSuccess = outputData.auth_success;
    const statusBanner = document.createElement('div');
    statusBanner.className = 'auth-status-banner text-center p-3 mb-4 rounded ' + 
                           (authSuccess ? 'bg-success' : 'bg-danger');
    
    statusBanner.innerHTML = `
      <h4 class="text-white mb-0">
        <i class="fas ${authSuccess ? 'fa-check-circle' : 'fa-times-circle'} me-2"></i>
        Authentication ${authSuccess ? 'Successful' : 'Failed'}
      </h4>
    `;
    container.appendChild(statusBanner);
    
    // Create protocol steps visualization
    const protocolSteps = document.createElement('div');
    protocolSteps.className = 'protocol-steps';
    
    // Define the steps of the lattice authentication protocol
    const steps = [
      {
        icon: 'key',
        title: 'Key Generation',
        description: 'Generate public and private keys based on lattice problems',
        details: 'A lattice-based key pair is generated using the Ring-LWE (Ring Learning With Errors) problem. The public key consists of two polynomials (a,b), where b = a*s + e, with s being the private key and e a small error term.'
      },
      {
        icon: 'question-circle', 
        title: 'Challenge Creation',
        description: 'Verifier creates a mathematical challenge based on the public key',
        details: 'The verifier creates a challenge consisting of two polynomials (u,v), where u = a*r + e₁ and v = b*r + e₂. Here r, e₁, and e₂ are small error polynomials only known to the verifier.'
      },
      {
        icon: 'reply',
        title: 'Response Computation',
        description: 'Prover computes response using private key',
        details: 'The prover uses their private key s to compute w = v - u*s ≈ e₂ - e₁*s. From this, they can extract an approximation of r and hash it to create the response.'
      },
      {
        icon: 'check-circle',
        title: 'Verification',
        description: 'Verifier checks if the response matches the expected value',
        details: 'The verifier compares the prover\'s hashed response with the hash of the original r polynomial. If they match, authentication succeeds.'
      }
    ];
    
    // Create the step cards
    steps.forEach((step, index) => {
      const stepCard = document.createElement('div');
      stepCard.className = 'card mb-3 protocol-step';
      
      stepCard.innerHTML = `
        <div class="card-header d-flex align-items-center">
          <div class="step-number rounded-circle bg-primary text-white me-3">
            ${index + 1}
          </div>
          <h5 class="mb-0">
            <i class="fas fa-${step.icon} me-2"></i>
            ${step.title}
          </h5>
        </div>
        <div class="card-body">
          <p class="step-description">${step.description}</p>
          <div class="step-details text-muted small">
            ${step.details}
          </div>
        </div>
      `;
      
      protocolSteps.appendChild(stepCard);
    });
    
    container.appendChild(protocolSteps);
    
    // Add comparison with traditional crypto
    const comparison = document.createElement('div');
    comparison.className = 'crypto-comparison mt-4 p-3 bg-light rounded';
    comparison.innerHTML = `
      <h5 class="mb-3">Post-Quantum Security Advantage</h5>
      <div class="row">
        <div class="col-md-6">
          <div class="card h-100 bg-danger bg-opacity-10">
            <div class="card-body">
              <h5 class="card-title">
                <i class="fas fa-unlock me-2"></i>
                Traditional Cryptography
              </h5>
              <p class="card-text">RSA and ECC rely on integer factorization and discrete logarithm problems that can be efficiently solved by quantum computers using Shor's algorithm.</p>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card h-100 bg-success bg-opacity-10">
            <div class="card-body">
              <h5 class="card-title">
                <i class="fas fa-lock me-2"></i>
                Lattice-Based Cryptography
              </h5>
              <p class="card-text">Based on the hardness of solving lattice problems that remain difficult even for quantum computers, making it a foundation for post-quantum security.</p>
            </div>
          </div>
        </div>
      </div>
    `;
    container.appendChild(comparison);
    
    console.log('Authentication protocol visualization created');
  },
  
  // Create security strength visualization
  createSecurityStrengthViz: function(outputData) {
    const container = document.getElementById('security-strength-visualization');
    if (!container) {
      console.warn('Security strength visualization container not found');
      return;
    }
    
    // Clear existing content
    container.innerHTML = '';
    
    // Security levels comparison
    const securityLevels = document.createElement('div');
    securityLevels.className = 'security-levels';
    
    // Create a canvas for the security strength chart
    const canvas = document.createElement('canvas');
    canvas.id = 'security-strength-chart';
    canvas.height = 250;
    securityLevels.appendChild(canvas);
    
    // Add the security levels to the container
    container.appendChild(securityLevels);
    
    // Create the security strength chart
    const ctx = canvas.getContext('2d');
    
    // Security strength data (bits)
    const securityData = {
      labels: ['RSA-2048', 'ECC-256', 'AES-256', 'Lattice-Based (n=512)', 'Lattice-Based (n=1024)'],
      datasets: [
        {
          label: 'Classical Security (bits)',
          data: [112, 128, 256, 128, 256],
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        },
        {
          label: 'Quantum Security (bits)',
          data: [0, 0, 128, 128, 256], // RSA and ECC are broken by quantum computers
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }
      ]
    };
    
    new Chart(ctx, {
      type: 'bar',
      data: securityData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Security Strength (bits)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Cryptographic Algorithm'
            }
          }
        },
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            callbacks: {
              afterLabel: function(context) {
                const datasetIndex = context.datasetIndex;
                const dataIndex = context.dataIndex;
                
                if (datasetIndex === 1 && dataIndex <= 1 && context.raw === 0) {
                  return 'Vulnerable to quantum attacks';
                }
              }
            }
          }
        }
      }
    });
    
    // Add explanation
    const explanation = document.createElement('div');
    explanation.className = 'mt-3 security-explanation alert alert-info';
    explanation.innerHTML = `
      <h5><i class="fas fa-shield-alt me-2"></i>Security Strength Explanation</h5>
      <p>
        <strong>Quantum Security:</strong> Lattice-based cryptography maintains its security level even against quantum computers, 
        while traditional methods like RSA and ECC are compromised by quantum algorithms like Shor's.
      </p>
      <p class="mb-0">
        <strong>NIST Standardization:</strong> Lattice-based cryptography forms the foundation of several NIST post-quantum 
        cryptography standards, acknowledging its robustness against both classical and quantum attacks.
      </p>
    `;
    container.appendChild(explanation);
    
    console.log('Security strength visualization created');
  },

  // Existing implementation for bit distribution visualization
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
      
      // Add this line to invoke the enhanced BB84 visualizations
      if (pluginKey === 'bb84' && resultData.output) {
        this.createBB84EnhancedVisualizations(resultData.output);
      }
    } catch (e) {
      console.error('Error initializing bit distribution chart:', e);
      chartContainer.innerHTML = '<div class="alert alert-warning">Failed to initialize chart</div>';
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
      ctx.fillText('|0>', centerX, centerY - radius - 10);
      ctx.fillText('|1>', centerX, centerY + radius + 20);
      ctx.fillText('|+>', centerX + radius + 20, centerY);
      ctx.fillText('|->', centerX - radius - 20, centerY);
      
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
      } else if (resultData.output && resultData.output.fingerprint) {
        // For auth plugin, use fingerprint to represent state
        const fingerprint = resultData.output.fingerprint;
        
        // Calculate theta and phi based on fingerprint values
        let stateVector = [0, 0, 0]; // Default state
        
        // Convert fingerprint to a 3D vector
        if (fingerprint.length >= 3) {
          // Use first 3 bits to determine state vector components
          stateVector = [
            fingerprint[0] === 1 ? 0.5 : -0.5,
            fingerprint[1] === 1 ? 0.5 : -0.5,
            fingerprint[2] === 1 ? 0.5 : -0.5
          ];
        } else if (fingerprint.length > 0) {
          // With fewer bits, use simple mapping
          if (fingerprint[0] === 1) {
            // Map to |+> state
            theta = Math.PI/2;
            phi = 0;
          } else {
            // Map to |0> state
            theta = 0;
            phi = 0;
          }
        }
        
        // Only calculate theta/phi from vector if we didn't set it directly above
        if (fingerprint.length >= 3) {
          // Normalize the vector
          const magnitude = Math.sqrt(stateVector[0]**2 + stateVector[1]**2 + stateVector[2]**2);
          const normalizedVector = stateVector.map(v => v/magnitude);
          
          // Convert to spherical coordinates
          theta = Math.acos(normalizedVector[2]);
          phi = Math.atan2(normalizedVector[1], normalizedVector[0]);
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
      ctx.fillText(`theta: ${(theta * 180 / Math.PI).toFixed(1)}°`, 10, 20);
      ctx.fillText(`phi: ${(phi * 180 / Math.PI).toFixed(1)}°`, 10, 40);
      
      // For auth plugin, add explanation about lattice-state mapping
      if (resultData.output && resultData.output.fingerprint) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillRect(10, canvas.height - 70, canvas.width - 20, 60);
        ctx.fillStyle = '#000';
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Lattice Coefficient Representation', centerX, canvas.height - 55);
        ctx.fillText('The lattice coefficients from the authentication protocol', centerX, canvas.height - 40);
        ctx.fillText('are mapped to this quantum state for visualization.', centerX, canvas.height - 25);
      }
      
      console.log("Successfully rendered 2D Bloch sphere visualization");
    } catch (e) {
      console.error('Error initializing quantum state visualization:', e);
      // Display error message in the container
      vizContainer.innerHTML = '<div class="alert alert-warning">Failed to initialize visualization</div>';
    }
  },
  
  // New function to create enhanced BB84 visualizations
  createBB84EnhancedVisualizations: function(outputData) {
    // Create container for enhanced visualizations if it doesn't exist
    let enhancedContainer = document.getElementById('bb84-enhanced-viz');
    
    // If container doesn't exist, create and add it to the DOM
    if (!enhancedContainer) {
      // Find the parent container (likely the tab content)
      const parentContainer = document.getElementById('visualization');
      if (!parentContainer) return;
      
      // Create container
      enhancedContainer = document.createElement('div');
      enhancedContainer.id = 'bb84-enhanced-viz';
      enhancedContainer.className = 'row mt-4';
      parentContainer.appendChild(enhancedContainer);
    } else {
      // Clear existing content
      enhancedContainer.innerHTML = '';
    }
    
    // Create visualizations only if we have the enhanced data
    if (!outputData.transmission_efficiency && !outputData.error_rate) {
      // This appears to be the basic BB84 implementation, not the enhanced version
      return;
    }
    
    // Create Key Metrics visualization
    this.createKeyMetricsChart(enhancedContainer, outputData);
    
    // Create QBER visualization
    this.createQBERViz(enhancedContainer, outputData);
    
    // Create eavesdropper visualization if present
    if (outputData.eavesdropper_results) {
      this.createEavesdropperViz(enhancedContainer, outputData);
    }
    
    // Create key generation pipeline visualization
    this.createKeyPipelineViz(enhancedContainer, outputData);
    
    // Create hardware effect visualization
    this.createHardwareEffectsViz(enhancedContainer, outputData);
  },

  // Create visualization for key metrics
  createKeyMetricsChart: function(container, data) {
    // Create card for the visualization
    const cardContainer = document.createElement('div');
    cardContainer.className = 'col-md-6 mb-4';
    
    const card = document.createElement('div');
    card.className = 'card h-100';
    
    const cardHeader = document.createElement('div');
    cardHeader.className = 'card-header';
    cardHeader.textContent = 'BB84 Key Metrics';
    
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';
    
    // Create a container div with fixed height
    const chartContainer = document.createElement('div');
    chartContainer.style.height = '250px'; // Fixed height constraint
    chartContainer.style.position = 'relative';
    
    // Create canvas for chart inside the container
    const canvas = document.createElement('canvas');
    canvas.id = 'bb84-key-metrics-chart';
    chartContainer.appendChild(canvas);
    cardBody.appendChild(chartContainer);
    
    // Assemble card
    card.appendChild(cardHeader);
    card.appendChild(cardBody);
    cardContainer.appendChild(card);
    container.appendChild(cardContainer);
    
    // Get key metrics data
    const rawKeyLength = data.alice_bits ? data.alice_bits.length : 0;
    const siftedKeyLength = data.shared_key ? data.shared_key.length : 0;
    const finalKeyLength = data.final_key ? data.final_key.length : 0;
    
    // Create chart with explicit maintainAspectRatio: false
    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Raw Key', 'Sifted Key', 'Final Secure Key'],
        datasets: [{
          label: 'Bits',
          data: [rawKeyLength, siftedKeyLength, finalKeyLength],
          backgroundColor: [
            'rgba(54, 162, 235, 0.5)',
            'rgba(75, 192, 192, 0.5)',
            'rgba(153, 102, 255, 0.5)'
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Bits'
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              afterLabel: function(context) {
                const index = context.dataIndex;
                if (index === 0) {
                  return `Original bits generated`;
                } else if (index === 1) {
                  const efficiency = (siftedKeyLength / rawKeyLength * 100).toFixed(1);
                  return `${efficiency}% of raw key (after basis reconciliation)`;
                } else if (index === 2) {
                  const efficiency = finalKeyLength > 0 ? (finalKeyLength / rawKeyLength * 100).toFixed(1) : 0;
                  return `${efficiency}% of raw key (after privacy amplification)`;
                }
              }
            }
          }
        }
      }
    });
  },

  createQBERViz: function(container, data) {
    // Create card for the visualization
    const cardContainer = document.createElement('div');
    cardContainer.className = 'col-md-6 mb-4';
    
    const card = document.createElement('div');
    card.className = 'card h-100';
    
    const cardHeader = document.createElement('div');
    cardHeader.className = 'card-header';
    cardHeader.textContent = 'Error Analysis';
    
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';
    
    // Create a height-constrained wrapper for the chart
    const chartWrapper = document.createElement('div');
    chartWrapper.style.height = '200px'; // Fixed height
    chartWrapper.style.position = 'relative';
    chartWrapper.style.width = '100%';
    
    // Create canvas for chart (inside the wrapper)
    const canvas = document.createElement('canvas');
    canvas.id = 'bb84-qber-chart';
    chartWrapper.appendChild(canvas);
    cardBody.appendChild(chartWrapper);
    
    // Assemble card
    card.appendChild(cardHeader);
    card.appendChild(cardBody);
    cardContainer.appendChild(card);
    container.appendChild(cardContainer);
    
    // Get error rate data
    const qber = data.error_rate || 0;
    const securityThreshold = 0.11; // BB84 security threshold
    
    // Determine whether QBER indicates eavesdropping
    const indicatesEavesdropping = qber > securityThreshold;
    
    // Calculate remaining error rate after reconciliation
    const remainingErrorRate = data.reconciliation_results ? 
      data.reconciliation_results.remaining_error_rate || 0 : 0;
    
    // Add QBER interpretation text
    const interpretation = document.createElement('div');
    interpretation.className = 'mt-3 text-center';
    
    if (indicatesEavesdropping) {
      interpretation.innerHTML = `
        <div class="alert alert-danger mb-0">
          <strong>QBER: ${(qber * 100).toFixed(2)}%</strong> - Above security threshold (${(securityThreshold * 100).toFixed(2)}%)
          <br>Possible eavesdropping detected!
        </div>
      `;
    } else {
      interpretation.innerHTML = `
        <div class="alert alert-success mb-0">
          <strong>QBER: ${(qber * 100).toFixed(2)}%</strong> - Below security threshold (${(securityThreshold * 100).toFixed(2)}%)
          <br>No evidence of eavesdropping
        </div>
      `;
    }
    
    cardBody.appendChild(interpretation);
    
    // Add note about information reconciliation if available
    if (data.reconciliation_results) {
      const reconciliation = document.createElement('div');
      reconciliation.className = 'mt-2 small text-muted';
      reconciliation.innerHTML = `After information reconciliation: ${(remainingErrorRate * 100).toFixed(4)}% error rate`;
      cardBody.appendChild(reconciliation);
    }
  },

  // Create visualization for eavesdropper detection
  createEavesdropperViz: function(container, data) {
    // Only create if we have eavesdropper data
    if (!data.eavesdropper_results) return;
    
    const eveResults = data.eavesdropper_results;
    
    // Create card for the visualization
    const cardContainer = document.createElement('div');
    cardContainer.className = 'col-md-6 mb-4';
    
    const card = document.createElement('div');
    card.className = 'card h-100';
    
    const cardHeader = document.createElement('div');
    cardHeader.className = 'card-header bg-danger text-white';
    cardHeader.innerHTML = '<i class="fas fa-user-secret me-2"></i> Eavesdropper Analysis';
    
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';
    
    // Create eavesdropper metrics display
    const eveMetrics = document.createElement('div');
    
    // Add eavesdropper strategy
    const strategy = document.createElement('div');
    strategy.className = 'mb-3';
    strategy.innerHTML = `
      <strong>Attack Strategy:</strong> ${data.eve_strategy || 'intercept_resend'}
      <div class="progress mt-1">
        <div class="progress-bar bg-info" role="progressbar" style="width: 100%"></div>
      </div>
    `;
    eveMetrics.appendChild(strategy);
    
    // Add information leakage metric
    const leakage = document.createElement('div');
    leakage.className = 'mb-3';
    const leakageRatio = eveResults.information_leak_ratio || 0;
    leakage.innerHTML = `
      <strong>Information Leakage:</strong> ${(leakageRatio * 100).toFixed(1)}%
      <div class="progress mt-1">
        <div class="progress-bar bg-warning" role="progressbar" 
             style="width: ${leakageRatio * 100}%"></div>
      </div>
    `;
    eveMetrics.appendChild(leakage);
    
    // Add detection probability
    const detection = document.createElement('div');
    detection.className = 'mb-3';
    const detectionProb = eveResults.detection_probability || 0;
    detection.innerHTML = `
      <strong>Detection Probability:</strong> ${(detectionProb * 100).toFixed(1)}%
      <div class="progress mt-1">
        <div class="progress-bar bg-success" role="progressbar" 
             style="width: ${detectionProb * 100}%"></div>
      </div>
    `;
    eveMetrics.appendChild(detection);
    
    // Add detection status
    const detectionStatus = document.createElement('div');
    detectionStatus.className = 'alert ' + (eveResults.eve_detected ? 'alert-success' : 'alert-warning');
    detectionStatus.innerHTML = eveResults.eve_detected 
      ? '<i class="fas fa-check-circle me-2"></i> Eavesdropper detected!' 
      : '<i class="fas fa-exclamation-triangle me-2"></i> Eavesdropper not detected';
    eveMetrics.appendChild(detectionStatus);
    
    cardBody.appendChild(eveMetrics);
    
    // Assemble card
    card.appendChild(cardHeader);
    card.appendChild(cardBody);
    cardContainer.appendChild(card);
    container.appendChild(cardContainer);
  },

  // Create visualization for key generation pipeline
  createKeyPipelineViz: function(container, data) {
    // Create card for the visualization
    const cardContainer = document.createElement('div');
    cardContainer.className = 'col-md-6 mb-4';
    
    const card = document.createElement('div');
    card.className = 'card h-100';
    
    const cardHeader = document.createElement('div');
    cardHeader.className = 'card-header';
    cardHeader.textContent = 'Key Generation Pipeline';
    
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body pb-0';
    
    // Create pipeline visualization
    const pipeline = document.createElement('div');
    pipeline.className = 'key-pipeline';
    
    // Step 1: Quantum Transmission
    const rawKeyLength = data.alice_bits ? data.alice_bits.length : 0;
    const transmissionEfficiency = data.transmission_efficiency || 1;
    
    const step1 = document.createElement('div');
    step1.className = 'pipeline-step mb-4';
    step1.innerHTML = `
      <div class="step-header">
        <span class="badge bg-primary me-2">1</span>
        <strong>Quantum Transmission</strong>
        <span class="ms-auto">${Math.round(transmissionEfficiency * 100)}% efficiency</span>
      </div>
      <div class="progress mt-2">
        <div class="progress-bar bg-primary" role="progressbar" 
             style="width: ${transmissionEfficiency * 100}%" 
             aria-valuenow="${transmissionEfficiency * 100}" aria-valuemin="0" aria-valuemax="100">
          ${Math.round(rawKeyLength * transmissionEfficiency)} qubits received
        </div>
      </div>
      <div class="step-footer small text-muted mt-1">
        Raw qubits: ${rawKeyLength} → ${Math.round(rawKeyLength * transmissionEfficiency)} received
      </div>
    `;
    pipeline.appendChild(step1);
    
    // Step 2: Basis Reconciliation
    const siftedKeyLength = data.shared_key ? data.shared_key.length : 0;
    const siftedRatio = rawKeyLength > 0 ? siftedKeyLength / rawKeyLength : 0;
    
    const step2 = document.createElement('div');
    step2.className = 'pipeline-step mb-4';
    step2.innerHTML = `
      <div class="step-header">
        <span class="badge bg-success me-2">2</span>
        <strong>Basis Reconciliation</strong>
        <span class="ms-auto">${Math.round(siftedRatio * 100)}% retention</span>
      </div>
      <div class="progress mt-2">
        <div class="progress-bar bg-success" role="progressbar" 
             style="width: ${siftedRatio * 100}%" 
             aria-valuenow="${siftedRatio * 100}" aria-valuemin="0" aria-valuemax="100">
          ${siftedKeyLength} matching bases
        </div>
      </div>
      <div class="step-footer small text-muted mt-1">
        Sifted key: ${siftedKeyLength} bits (bases matched ${Math.round(siftedRatio * 100)}% of the time)
      </div>
    `;
    pipeline.appendChild(step2);
    
    // Step 3: Information Reconciliation
    if (data.reconciliation_results) {
      const reconciliationSuccess = data.reconciliation_results.success;
      const bitsUsed = data.reconciliation_results.bits_used || 0;
      const correctedBits = data.reconciliation_results.corrected_bits || 0;
      const remainingErrors = data.reconciliation_results.remaining_error_rate || 0;
      
      const reconciliationRatio = siftedKeyLength > 0 ? 
        (siftedKeyLength - bitsUsed) / siftedKeyLength : 0;
      
      const step3 = document.createElement('div');
      step3.className = 'pipeline-step mb-4';
      step3.innerHTML = `
        <div class="step-header">
          <span class="badge bg-info me-2">3</span>
          <strong>Information Reconciliation</strong>
          <span class="ms-auto">${Math.round(reconciliationRatio * 100)}% retention</span>
        </div>
        <div class="progress mt-2">
          <div class="progress-bar bg-info" role="progressbar" 
               style="width: ${reconciliationRatio * 100}%" 
               aria-valuenow="${reconciliationRatio * 100}" aria-valuemin="0" aria-valuemax="100">
            ${siftedKeyLength - bitsUsed} bits
          </div>
        </div>
        <div class="step-footer small text-muted mt-1">
          Error correction: ${correctedBits} errors fixed using ${bitsUsed} bits
          <br>Remaining error rate: ${(remainingErrors * 100).toFixed(4)}%
        </div>
      `;
      pipeline.appendChild(step3);
    }
    
    // Step 4: Privacy Amplification
    if (data.final_key) {
      const finalKeyLength = data.final_key.length;
      const finalRatio = siftedKeyLength > 0 ? finalKeyLength / siftedKeyLength : 0;
      
      const step4 = document.createElement('div');
      step4.className = 'pipeline-step mb-4';
      step4.innerHTML = `
        <div class="step-header">
          <span class="badge bg-warning me-2">4</span>
          <strong>Privacy Amplification</strong>
          <span class="ms-auto">${Math.round(finalRatio * 100)}% retention</span>
        </div>
        <div class="progress mt-2">
          <div class="progress-bar bg-warning" role="progressbar" 
               style="width: ${finalRatio * 100}%" 
               aria-valuenow="${finalRatio * 100}" aria-valuemin="0" aria-valuemax="100">
            ${finalKeyLength} bits
          </div>
        </div>
        <div class="step-footer small text-muted mt-1">
          Final secure key: ${finalKeyLength} bits (${(finalKeyLength / rawKeyLength * 100).toFixed(1)}% of raw qubits)
        </div>
      `;
      pipeline.appendChild(step4);
    }
    
    cardBody.appendChild(pipeline);
    
    // Assemble card
    card.appendChild(cardHeader);
    card.appendChild(cardBody);
    cardContainer.appendChild(card);
    container.appendChild(cardContainer);
  },

  // Create visualization for hardware effects
  createHardwareEffectsViz: function(container, data) {
    // Only create if we have noise model data
    if (!data.noise_model) return;
    
    // Create card for the visualization
    const cardContainer = document.createElement('div');
    cardContainer.className = 'col-md-6 mb-4';
    
    const card = document.createElement('div');
    card.className = 'card h-100';
    
    const cardHeader = document.createElement('div');
    cardHeader.className = 'card-header';
    const distanceInfo = data.distance_km ? ` (${data.distance_km}km)` : '';
    cardHeader.textContent = `Hardware Effects: ${data.hardware_type || 'fiber'}${distanceInfo}`;
    
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';
    
    // Extract hardware parameters
    const noiseModel = data.noise_model;
    const secureKeyRate = data.secure_key_rate || 0;
    
    // Create metrics table
    const table = document.createElement('table');
    table.className = 'table table-sm';
    
    const tbody = document.createElement('tbody');
    
    // Add photon loss row
    const photonLossRow = document.createElement('tr');
    photonLossRow.innerHTML = `
      <td>Photon Loss</td>
      <td>${(noiseModel.photon_loss * 100).toFixed(2)}%</td>
      <td>
        <div class="progress">
          <div class="progress-bar bg-danger" role="progressbar" 
               style="width: ${noiseModel.photon_loss * 100}%"></div>
        </div>
      </td>
    `;
    tbody.appendChild(photonLossRow);
    
    // Add polarization drift row
    const polarizationRow = document.createElement('tr');
    polarizationRow.innerHTML = `
      <td>Polarization Drift</td>
      <td>${(noiseModel.polarization_drift * 100).toFixed(2)}%</td>
      <td>
        <div class="progress">
          <div class="progress-bar bg-warning" role="progressbar" 
               style="width: ${Math.min(100, noiseModel.polarization_drift * 1000)}%"></div>
        </div>
      </td>
    `;
    tbody.appendChild(polarizationRow);
    
    // Add phase drift row
    const phaseRow = document.createElement('tr');
    phaseRow.innerHTML = `
      <td>Phase Drift</td>
      <td>${(noiseModel.phase_drift * 100).toFixed(2)}%</td>
      <td>
        <div class="progress">
          <div class="progress-bar bg-info" role="progressbar" 
               style="width: ${Math.min(100, noiseModel.phase_drift * 1000)}%"></div>
        </div>
      </td>
    `;
    tbody.appendChild(phaseRow);
    
    // Add detector efficiency row
    const detectorRow = document.createElement('tr');
    detectorRow.innerHTML = `
      <td>Detector Efficiency</td>
      <td>${(noiseModel.detector_efficiency * 100).toFixed(2)}%</td>
      <td>
        <div class="progress">
          <div class="progress-bar bg-success" role="progressbar" 
               style="width: ${noiseModel.detector_efficiency * 100}%"></div>
        </div>
      </td>
    `;
    tbody.appendChild(detectorRow);
    
    table.appendChild(tbody);
    cardBody.appendChild(table);
    
    // Add theoretical key rate
    const keyRateDiv = document.createElement('div');
    keyRateDiv.className = 'alert alert-primary mt-2 mb-0';
    keyRateDiv.innerHTML = `
      <strong>Theoretical Secure Key Rate:</strong> ${secureKeyRate.toFixed(2)} bits/second
      <div class="progress mt-2">
        <div class="progress-bar bg-primary" role="progressbar" 
             style="width: ${Math.min(100, secureKeyRate / 1000 * 100)}%"></div>
      </div>
    `;
    cardBody.appendChild(keyRateDiv);
    
    // Assemble card
    card.appendChild(cardHeader);
    card.appendChild(cardBody);
    cardContainer.appendChild(card);
    container.appendChild(cardContainer);
  },

  // Create visualization for key generation pipeline
  createKeyPipelineViz: function(container, data) {
    // Create card for the visualization
    const cardContainer = document.createElement('div');
    cardContainer.className = 'col-md-6 mb-4';
    
    const card = document.createElement('div');
    card.className = 'card h-100';
    
    const cardHeader = document.createElement('div');
    cardHeader.className = 'card-header';
    cardHeader.textContent = 'Key Generation Pipeline';
    
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body pb-0';
    
    // Create pipeline visualization
    const pipeline = document.createElement('div');
    pipeline.className = 'key-pipeline';
    
    // Step 1: Quantum Transmission
    const rawKeyLength = data.alice_bits ? data.alice_bits.length : 0;
    const transmissionEfficiency = data.transmission_efficiency || 1;
    
    const step1 = document.createElement('div');
    step1.className = 'pipeline-step mb-4';
    step1.innerHTML = `
      <div class="step-header">
        <span class="badge bg-primary me-2">1</span>
        <strong>Quantum Transmission</strong>
        <span class="ms-auto">${Math.round(transmissionEfficiency * 100)}% efficiency</span>
      </div>
      <div class="progress mt-2">
        <div class="progress-bar bg-primary" role="progressbar" 
             style="width: ${transmissionEfficiency * 100}%" 
             aria-valuenow="${transmissionEfficiency * 100}" aria-valuemin="0" aria-valuemax="100">
          ${Math.round(rawKeyLength * transmissionEfficiency)} qubits received
        </div>
      </div>
      <div class="step-footer small text-muted mt-1">
        Raw qubits: ${rawKeyLength} → ${Math.round(rawKeyLength * transmissionEfficiency)} received
      </div>
    `;
    pipeline.appendChild(step1);
    
    // Step 2: Basis Reconciliation
    const siftedKeyLength = data.shared_key ? data.shared_key.length : 0;
    const siftedRatio = rawKeyLength > 0 ? siftedKeyLength / rawKeyLength : 0;
    
    const step2 = document.createElement('div');
    step2.className = 'pipeline-step mb-4';
    step2.innerHTML = `
      <div class="step-header">
        <span class="badge bg-success me-2">2</span>
        <strong>Basis Reconciliation</strong>
        <span class="ms-auto">${Math.round(siftedRatio * 100)}% retention</span>
      </div>
      <div class="progress mt-2">
        <div class="progress-bar bg-success" role="progressbar" 
             style="width: ${siftedRatio * 100}%" 
             aria-valuenow="${siftedRatio * 100}" aria-valuemin="0" aria-valuemax="100">
          ${siftedKeyLength} matching bases
        </div>
      </div>
      <div class="step-footer small text-muted mt-1">
        Sifted key: ${siftedKeyLength} bits (bases matched ${Math.round(siftedRatio * 100)}% of the time)
      </div>
    `;
    pipeline.appendChild(step2);
    
    // Step 3: Information Reconciliation
    if (data.reconciliation_results) {
      const reconciliationSuccess = data.reconciliation_results.success;
      const bitsUsed = data.reconciliation_results.bits_used || 0;
      const correctedBits = data.reconciliation_results.corrected_bits || 0;
      const remainingErrors = data.reconciliation_results.remaining_error_rate || 0;
      
      const reconciliationRatio = siftedKeyLength > 0 ? 
        (siftedKeyLength - bitsUsed) / siftedKeyLength : 0;
      
      const step3 = document.createElement('div');
      step3.className = 'pipeline-step mb-4';
      step3.innerHTML = `
        <div class="step-header">
          <span class="badge bg-info me-2">3</span>
          <strong>Information Reconciliation</strong>
          <span class="ms-auto">${Math.round(reconciliationRatio * 100)}% retention</span>
        </div>
        <div class="progress mt-2">
          <div class="progress-bar bg-info" role="progressbar" 
               style="width: ${reconciliationRatio * 100}%" 
               aria-valuenow="${reconciliationRatio * 100}" aria-valuemin="0" aria-valuemax="100">
            ${siftedKeyLength - bitsUsed} bits
          </div>
        </div>
        <div class="step-footer small text-muted mt-1">
          Error correction: ${correctedBits} errors fixed using ${bitsUsed} bits
          <br>Remaining error rate: ${(remainingErrors * 100).toFixed(4)}%
        </div>
      `;
      pipeline.appendChild(step3);
    }
    
    // Step 4: Privacy Amplification
    if (data.final_key) {
      const finalKeyLength = data.final_key.length;
      const finalRatio = siftedKeyLength > 0 ? finalKeyLength / siftedKeyLength : 0;
      
      const step4 = document.createElement('div');
      step4.className = 'pipeline-step mb-4';
      step4.innerHTML = `
        <div class="step-header">
          <span class="badge bg-warning me-2">4</span>
          <strong>Privacy Amplification</strong>
          <span class="ms-auto">${Math.round(finalRatio * 100)}% retention</span>
        </div>
        <div class="progress mt-2">
          <div class="progress-bar bg-warning" role="progressbar" 
               style="width: ${finalRatio * 100}%" 
               aria-valuenow="${finalRatio * 100}" aria-valuemin="0" aria-valuemax="100">
            ${finalKeyLength} bits
          </div>
        </div>
        <div class="step-footer small text-muted mt-1">
          Final secure key: ${finalKeyLength} bits (${(finalKeyLength / rawKeyLength * 100).toFixed(1)}% of raw qubits)
        </div>
      `;
      pipeline.appendChild(step4);
    }
    
    cardBody.appendChild(pipeline);
    
    // Assemble card
    card.appendChild(cardHeader);
    card.appendChild(cardBody);
    cardContainer.appendChild(card);
    container.appendChild(cardContainer);
  },

  // Create visualization for hardware effects
  createHardwareEffectsViz: function(container, data) {
    // Only create if we have noise model data
    if (!data.noise_model) return;
    
    // Create card for the visualization
    const cardContainer = document.createElement('div');
    cardContainer.className = 'col-md-6 mb-4';
    
    const card = document.createElement('div');
    card.className = 'card h-100';
    
    const cardHeader = document.createElement('div');
    cardHeader.className = 'card-header';
    const distanceInfo = data.distance_km ? ` (${data.distance_km}km)` : '';
    cardHeader.textContent = `Hardware Effects: ${data.hardware_type || 'fiber'}${distanceInfo}`;
    
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';
    
    // Extract hardware parameters
    const noiseModel = data.noise_model;
    const secureKeyRate = data.secure_key_rate || 0;
    
    // Create metrics table
    const table = document.createElement('table');
    table.className = 'table table-sm';
    
    const tbody = document.createElement('tbody');
    
    // Add photon loss row
    const photonLossRow = document.createElement('tr');
    photonLossRow.innerHTML = `
      <td>Photon Loss</td>
      <td>${(noiseModel.photon_loss * 100).toFixed(2)}%</td>
      <td>
        <div class="progress">
          <div class="progress-bar bg-danger" role="progressbar" 
               style="width: ${noiseModel.photon_loss * 100}%"></div>
        </div>
      </td>
    `;
    tbody.appendChild(photonLossRow);
    
    // Add polarization drift row
    const polarizationRow = document.createElement('tr');
    polarizationRow.innerHTML = `
      <td>Polarization Drift</td>
      <td>${(noiseModel.polarization_drift * 100).toFixed(2)}%</td>
      <td>
        <div class="progress">
          <div class="progress-bar bg-warning" role="progressbar" 
               style="width: ${Math.min(100, noiseModel.polarization_drift * 1000)}%"></div>
        </div>
      </td>
    `;
    tbody.appendChild(polarizationRow);
    
    // Add phase drift row
    const phaseRow = document.createElement('tr');
    phaseRow.innerHTML = `
      <td>Phase Drift</td>
      <td>${(noiseModel.phase_drift * 100).toFixed(2)}%</td>
      <td>
        <div class="progress">
          <div class="progress-bar bg-info" role="progressbar" 
               style="width: ${Math.min(100, noiseModel.phase_drift * 1000)}%"></div>
        </div>
      </td>
    `;
    tbody.appendChild(phaseRow);
    
    // Add detector efficiency row
    const detectorRow = document.createElement('tr');
    detectorRow.innerHTML = `
      <td>Detector Efficiency</td>
      <td>${(noiseModel.detector_efficiency * 100).toFixed(2)}%</td>
      <td>
        <div class="progress">
          <div class="progress-bar bg-success" role="progressbar" 
               style="width: ${noiseModel.detector_efficiency * 100}%"></div>
        </div>
      </td>
    `;
    tbody.appendChild(detectorRow);
    
    table.appendChild(tbody);
    cardBody.appendChild(table);
    
    // Add theoretical key rate
    const keyRateDiv = document.createElement('div');
    keyRateDiv.className = 'alert alert-primary mt-2 mb-0';
    keyRateDiv.innerHTML = `
      <strong>Theoretical Secure Key Rate:</strong> ${secureKeyRate.toFixed(2)} bits/second
      <div class="progress mt-2">
        <div class="progress-bar bg-primary" role="progressbar" 
             style="width: ${Math.min(100, secureKeyRate / 1000 * 100)}%"></div>
      </div>
    `;
    cardBody.appendChild(keyRateDiv);
    
    // Assemble card
    card.appendChild(cardHeader);
    card.appendChild(cardBody);
    cardContainer.appendChild(card);
    container.appendChild(cardContainer);
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
      ctx.fillText('|0>', centerX, centerY - radius - 10);
      ctx.fillText('|1>', centerX, centerY + radius + 20);
      ctx.fillText('|+>', centerX + radius + 20, centerY);
      ctx.fillText('|->', centerX - radius - 20, centerY);
      
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
      ctx.fillText(`theta: ${(theta * 180 / Math.PI).toFixed(1)}°`, 10, 20);
      ctx.fillText(`phi: ${(phi * 180 / Math.PI).toFixed(1)}°`, 10, 40);
      
      console.log("Successfully rendered 2D Bloch sphere visualization");
    } catch (e) {
      console.error('Error initializing quantum state visualization:', e);
      // Display error message in the container
      vizContainer.innerHTML = '<div class="alert alert-warning">Failed to initialize visualization</div>';
    }
  },

initProbabilityDistribution : function(resultData, pluginKey) {
  const chartContainer = document.getElementById('probability-distribution');
  if (!chartContainer) return;
  
  try {
    console.log('Initializing probability distribution chart for', pluginKey);
    
    let labels = [];
    let probData = [];
    
    if (pluginKey === 'grover' && resultData.output) {
      // Extract number of qubits from output or default to 3
      const n = resultData.output.n || 3;
      const targetState = resultData.output.target_state || '101';
      const measuredState = resultData.output.measured_state || '';
      const numStates = Math.pow(2, n);
      
      // Create labels and probability data
      for (let i = 0; i < numStates; i++) {
        const stateBinary = i.toString(2).padStart(n, '0');
        labels.push(`|${stateBinary}⟩`);
        
        // Set high probability for target state and measured state, low for others
        if (stateBinary === targetState) {
          probData.push(0.9); // Target state has high probability
        } else if (stateBinary === measuredState && measuredState !== targetState) {
          probData.push(0.7); // Actually measured state (if different from target)
        } else {
          probData.push(0.1 / (numStates - 1)); // Low probability for other states
        }
      }
    } else if (pluginKey === 'quantum_decryption_grover' && resultData.output) {
      // Similar handling for quantum_decryption_grover
      const n = resultData.output.n || 4;
      const targetState = resultData.output.target_state || '0101';
      const numStates = Math.pow(2, n);
      
      for (let i = 0; i < numStates; i++) {
        const stateBinary = i.toString(2).padStart(n, '0');
        labels.push(`|${stateBinary}⟩`);
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
    
    // Check if Chart is available
    if (typeof Chart === 'undefined') {
      console.error('Chart.js library not available');
      chartContainer.innerHTML = '<div class="alert alert-warning">Chart.js library not available</div>';
      return;
    }
    
    // Destroy existing chart if it exists
    if (window.groverChart) {
      window.groverChart.destroy();
    }
    
    window.groverChart = new Chart(ctx, {
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
            max: 1,
            title: {
              display: true,
              text: 'Probability'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Quantum States'
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `Probability: ${context.raw.toFixed(4)}`;
              }
            }
          }
        }
      }
    });
    
    console.log('Probability distribution chart created successfully');
  } catch (e) {
    console.error('Error initializing probability distribution chart:', e);
    chartContainer.innerHTML = '<div class="alert alert-warning">Failed to initialize chart</div>';
  }
},

// QAOA visualization
initQAOAVisualization: function(resultData) {
const vizContainer = document.getElementById('qaoa-graph-viz');
if (!vizContainer) return;

try {
  // Clear any existing content
  vizContainer.innerHTML = '';
  
  // Create canvas for graph visualization
  const canvas = document.createElement('canvas');
  canvas.width = vizContainer.clientWidth || 400;
  canvas.height = vizContainer.clientHeight || 400;
  vizContainer.appendChild(canvas);
  
  // Get the 2D context
  const ctx = canvas.getContext('2d');
  
  // Get data from the result
  const output = resultData.output || {};
  const nNodes = output.n_nodes || 4;
  const graphEdges = output.graph_edges || [];
  const partition0 = output.partition_0 || [];
  const partition1 = output.partition_1 || [];
  const approxRatio = output.approximation_ratio || 0;
  
  // Set background
  ctx.fillStyle = '#f8f9fa';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw title
  ctx.textAlign = 'center';
  ctx.font = 'bold 18px Arial';
  ctx.fillStyle = '#333';
  ctx.fillText('MaxCut Graph Partitioning', canvas.width/2, 30);
  
  // Draw approximation ratio
  ctx.font = '14px Arial';
  ctx.fillText(`Approximation Ratio: ${approxRatio.toFixed(4)}`, canvas.width/2, 55);
  
  // Generate node positions in a circle
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = Math.min(centerX, centerY) - 60;
  
  const nodePositions = {};
  for (let i = 0; i < nNodes; i++) {
    const angle = (i / nNodes) * 2 * Math.PI;
    nodePositions[i] = {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  }
  
  // Draw edges
  ctx.lineWidth = 2;
  graphEdges.forEach(edge => {
    const [i, j] = edge;
    const startPos = nodePositions[i];
    const endPos = nodePositions[j];
    
    // Check if this edge is cut (nodes in different partitions)
    const isCut = (partition0.includes(i) && partition1.includes(j)) || 
                (partition1.includes(i) && partition0.includes(j));
    
    // Draw edge with appropriate color
    ctx.beginPath();
    ctx.moveTo(startPos.x, startPos.y);
    ctx.lineTo(endPos.x, endPos.y);
    ctx.strokeStyle = isCut ? '#e53935' : '#90caf9';
    ctx.stroke();
    
    // Add a label for cut edges
    if (isCut) {
      const midX = (startPos.x + endPos.x) / 2;
      const midY = (startPos.y + endPos.y) / 2;
      ctx.fillStyle = '#e53935';
      ctx.textAlign = 'center';
      ctx.font = '12px Arial';
      ctx.fillText('cut', midX, midY - 5);
    }
  });
  
  // Draw nodes
  const nodeRadius = 20;
  
  // Draw partition 0 nodes
  partition0.forEach(nodeIdx => {
    const pos = nodePositions[nodeIdx];
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, nodeRadius, 0, 2 * Math.PI);
    ctx.fillStyle = '#4CAF50';
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Add node label
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(nodeIdx.toString(), pos.x, pos.y);
  }
);
  
  // Draw partition 1 nodes
  partition1.forEach(nodeIdx => {
    const pos = nodePositions[nodeIdx];
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, nodeRadius, 0, 2 * Math.PI);
    ctx.fillStyle = '#2196F3';
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Add node label
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(nodeIdx.toString(), pos.x, pos.y);
  });
  
  // Add legend
  const legendY = canvas.height - 60;
  
  // Partition 0
  ctx.beginPath();
  ctx.arc(40, legendY, 10, 0, 2 * Math.PI);
  ctx.fillStyle = '#4CAF50';
  ctx.fill();
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#333';
  ctx.font = '14px Arial';
  ctx.fillText('Partition 0', 60, legendY);
  
  // Partition 1
  ctx.beginPath();
  ctx.arc(160, legendY, 10, 0, 2 * Math.PI);
  ctx.fillStyle = '#2196F3';
  ctx.fill();
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  ctx.fillStyle = '#333';
  ctx.fillText('Partition 1', 180, legendY);
  
  // Cut edge
  ctx.beginPath();
  ctx.moveTo(260, legendY);
  ctx.lineTo(310, legendY);
  ctx.strokeStyle = '#e53935';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  ctx.fillStyle = '#333';
  ctx.fillText('Cut edge', 320, legendY);
  
} catch (e) {
  console.error('Error creating QAOA visualization:', e);
  vizContainer.innerHTML = '<div class="alert alert-warning">Failed to initialize visualization</div>';
}
},

initQRNG: function(resultData) {
  if (!resultData || !resultData.output) return;
  const output = resultData.output;
  
  // Find the visualization container
  const visualizationTab = document.querySelector('#visualization');
  if (!visualizationTab) return;
  
  // Create enhanced QRNG visualization container
  if (!document.getElementById('qrng-enhanced-viz')) {
    const container = document.createElement('div');
    container.id = 'qrng-enhanced-viz';
    container.className = 'mt-4';
    visualizationTab.appendChild(container);
    
    // Create comprehensive visualization structure
    container.innerHTML = `
      <div class="row">
        <!-- Main Statistics Dashboard -->
        <div class="col-md-8">
          <div class="card mb-4">
            <div class="card-header bg-gradient-primary text-white d-flex justify-content-between align-items-center">
              <h5 class="mb-0"><i class="fas fa-chart-line me-2"></i>Quantum Randomness Dashboard</h5>
              <div class="badge bg-light text-dark" id="qrng-quality-badge">Quality: --</div>
            </div>
            <div class="card-body">
              <!-- Key Metrics Row -->
              <div class="row mb-4">
                <div class="col-md-3">
                  <div class="text-center p-3 border rounded bg-light">
                    <h3 class="text-primary mb-1" id="qrng-random-number">--</h3>
                    <small class="text-muted">Random Number</small>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="text-center p-3 border rounded bg-light">
                    <h3 class="text-success mb-1" id="qrng-entropy">--</h3>
                    <small class="text-muted">Entropy %</small>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="text-center p-3 border rounded bg-light">
                    <h3 class="text-info mb-1" id="qrng-bias">--</h3>
                    <small class="text-muted">Bias</small>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="text-center p-3 border rounded bg-light">
                    <h3 class="text-warning mb-1" id="qrng-performance">--</h3>
                    <small class="text-muted">Bits/sec</small>
                  </div>
                </div>
              </div>
              
              <!-- Bit Visualization -->
              <div class="mb-4">
                <h6><i class="fas fa-binary me-2"></i>Bit Sequence Visualization</h6>
                <div id="qrng-bit-sequence" class="p-3 bg-dark text-white rounded font-monospace" style="overflow-x: auto; white-space: nowrap;"></div>
              </div>
              
              <!-- Statistical Charts -->
              <div class="row">
                <div class="col-md-6">
                  <canvas id="qrng-distribution-chart" width="300" height="200"></canvas>
                </div>
                <div class="col-md-6">
                  <canvas id="qrng-quality-radar" width="300" height="200"></canvas>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Control Panel & Information -->
        <div class="col-md-4">
          <!-- Source Information -->
          <div class="card mb-3">
            <div class="card-header bg-info text-white">
              <h6 class="mb-0"><i class="fas fa-atom me-2"></i>Quantum Source</h6>
            </div>
            <div class="card-body">
              <div id="qrng-source-info">
                <h6 id="qrng-source-name" class="text-primary">--</h6>
                <p id="qrng-source-description" class="small text-muted">--</p>
                <div class="progress mb-2" style="height: 5px;">
                  <div id="qrng-noise-indicator" class="progress-bar bg-warning" style="width: 0%"></div>
                </div>
                <small class="text-muted">Noise Level: <span id="qrng-noise-level">0%</span></small>
              </div>
            </div>
          </div>
          
          <!-- Real-time Controls -->
          <div class="card mb-3">
            <div class="card-header bg-secondary text-white">
              <h6 class="mb-0"><i class="fas fa-sliders-h me-2"></i>Interactive Controls</h6>
            </div>
            <div class="card-body">
              <div class="mb-3">
                <label class="form-label small">Export Format:</label>
                <select id="qrng-export-format" class="form-select form-select-sm">
                  <option value="binary">Binary</option>
                  <option value="hex">Hexadecimal</option>
                  <option value="base64">Base64</option>
                  <option value="csv">CSV</option>
                </select>
              </div>
              <div class="d-grid gap-2">
                <button id="qrng-export-btn" class="btn btn-outline-primary btn-sm">
                  <i class="fas fa-download me-1"></i>Export Data
                </button>
                <button id="qrng-regenerate-btn" class="btn btn-outline-success btn-sm">
                  <i class="fas fa-refresh me-1"></i>Generate New
                </button>
              </div>
            </div>
          </div>
          
          <!-- Applications Demo -->
          <div class="card">
            <div class="card-header bg-success text-white">
              <h6 class="mb-0"><i class="fas fa-lightbulb me-2"></i>Applications</h6>
            </div>
            <div class="card-body">
              <div id="qrng-applications">
                <div class="mb-3">
                  <label class="small fw-bold">Cryptographic Key:</label>
                  <div class="input-group input-group-sm">
                    <input id="qrng-crypto-key" class="form-control font-monospace" readonly>
                    <button class="btn btn-outline-secondary" onclick="this.previousElementSibling.select(); document.execCommand('copy');">
                      <i class="fas fa-copy"></i>
                    </button>
                  </div>
                </div>
                <div class="mb-3">
                  <label class="small fw-bold">Dice Roll (1-6):</label>
                  <div class="text-center">
                    <span id="qrng-dice-result" class="badge bg-primary fs-6">-</span>
                  </div>
                </div>
                <div>
                  <label class="small fw-bold">UUID:</label>
                  <div class="input-group input-group-sm">
                    <input id="qrng-uuid" class="form-control font-monospace" readonly>
                    <button class="btn btn-outline-secondary" onclick="this.previousElementSibling.select(); document.execCommand('copy');">
                      <i class="fas fa-copy"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Detailed Analysis Tabs -->
      <div class="card mt-4">
        <div class="card-header">
          <ul class="nav nav-tabs card-header-tabs">
            <li class="nav-item">
              <button class="nav-link active" id="qrng-tab-stats" data-bs-toggle="tab" data-bs-target="#qrng-stats-content">
                <i class="fas fa-chart-bar me-1"></i>Statistical Tests
              </button>
            </li>
            <li class="nav-item">
              <button class="nav-link" id="qrng-tab-bits" data-bs-toggle="tab" data-bs-target="#qrng-bits-content">
                <i class="fas fa-microchip me-1"></i>Bit Analysis
              </button>
            </li>
            <li class="nav-item">
              <button class="nav-link" id="qrng-tab-history" data-bs-toggle="tab" data-bs-target="#qrng-history-content">
                <i class="fas fa-history me-1"></i>Generation History
              </button>
            </li>
            <li class="nav-item">
              <button class="nav-link" id="qrng-tab-education" data-bs-toggle="tab" data-bs-target="#qrng-education-content">
                <i class="fas fa-graduation-cap me-1"></i>Learn More
              </button>
            </li>
          </ul>
        </div>
        <div class="card-body">
          <div class="tab-content">
            <div class="tab-pane fade show active" id="qrng-stats-content">
              <div id="qrng-statistical-tests"></div>
            </div>
            <div class="tab-pane fade" id="qrng-bits-content">
              <div id="qrng-bit-details"></div>
            </div>
            <div class="tab-pane fade" id="qrng-history-content">
              <div id="qrng-history-container"></div>
            </div>
            <div class="tab-pane fade" id="qrng-education-content">
              <div id="qrng-educational-content"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  // Initialize history if it doesn't exist
  if (!window.qrngHistory) {
    window.qrngHistory = [];
  }
  
  // Update the visualization with new data
  this.updateQRNGVisualization(output);
},

updateQRNGVisualization: function(output) {
  try {
    // Update main metrics
    document.getElementById('qrng-random-number').textContent = output.random_number || '--';
    
    // Update quality metrics
    if (output.statistics && !output.statistics.error) {
      const stats = output.statistics;
      document.getElementById('qrng-entropy').textContent = Math.round(stats.entropy_percentage) + '%';
      document.getElementById('qrng-bias').textContent = (stats.bias * 100).toFixed(2) + '%';
      document.getElementById('qrng-quality-badge').textContent = `Quality: ${Math.round(stats.quality_score)}/100`;
      
      // Color code quality badge
      const qualityBadge = document.getElementById('qrng-quality-badge');
      qualityBadge.className = 'badge ' + (stats.quality_score >= 80 ? 'bg-success' : 
                                         stats.quality_score >= 60 ? 'bg-warning' : 'bg-danger');
    }
    
    // Update performance metrics
    if (output.bits_per_second) {
      document.getElementById('qrng-performance').textContent = Math.round(output.bits_per_second);
    }
    
    // Update source information
    document.getElementById('qrng-source-name').textContent = output.source_name || 'Unknown';
    document.getElementById('qrng-source-description').textContent = output.source_description || '';
    
    // Update noise level
    const noiseLevel = (output.noise_level * 100).toFixed(1);
    document.getElementById('qrng-noise-level').textContent = noiseLevel + '%';
    document.getElementById('qrng-noise-indicator').style.width = noiseLevel + '%';
    
    // Update bit sequence visualization
    this.updateBitSequenceVisualization(output);
    
    // Update statistical charts
    this.updateQRNGCharts(output);
    
    // Update detailed tabs
    this.updateQRNGStatisticalTests(output);
    this.updateQRNGBitDetails(output);
    this.updateQRNGApplications(output);
    this.updateQRNGEducationalContent(output);
    
    // Add to history
    this.addToQRNGHistory(output);
    
    // Setup event listeners for interactive controls
    this.setupQRNGControls(output);
    
  } catch (error) {
    console.error('Error updating QRNG visualization:', error);
  }
},

updateBitSequenceVisualization: function(output) {
  const container = document.getElementById('qrng-bit-sequence');
  if (!container) return;
  
  const bits = output.bits_string || '';
  let html = '';
  
  // Detect theme for better color choices
  const isDarkMode = document.documentElement.getAttribute('data-theme') === 'quantumdark';
  
  // Create colored bit representation with theme-aware colors
  for (let i = 0; i < bits.length; i++) {
    const bit = bits[i];
    let bgClass, textClass;
    
    if (bit === '1') {
      bgClass = 'bg-success';
      textClass = isDarkMode ? 'text-dark' : 'text-white';
    } else {
      bgClass = isDarkMode ? 'bg-secondary' : 'bg-dark';
      textClass = isDarkMode ? 'text-light' : 'text-white';
    }
    
    html += `<span class="badge ${bgClass} ${textClass} me-1 mb-1" style="font-size: 0.9em;" 
                   title="Bit ${i}: ${bit}">${bit}</span>`;
  }
  
  container.innerHTML = html;
},

updateQRNGCharts: function(output) {
  // Distribution Chart
  this.createDistributionChart(output);
  
  // Quality Radar Chart  
  this.createQualityRadarChart(output);
},

createDistributionChart: function(output) {
  const canvas = document.getElementById('qrng-distribution-chart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  
  // Clear previous chart
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  if (!output.statistics || output.statistics.error) return;
  
  const stats = output.statistics;
  const zeros = stats.zeros_count;
  const ones = stats.ones_count;
  
  // Detect theme for colors
  const isDarkMode = document.documentElement.getAttribute('data-theme') === 'quantumdark';
  const colors = {
    zero: isDarkMode ? '#6b7280' : '#3498db',
    one: isDarkMode ? '#34d399' : '#e74c3c',
    text: isDarkMode ? '#f9fafb' : '#333333',
    grid: isDarkMode ? '#4b5563' : '#e5e7eb'
  };
  
  // Simple bar chart
  const maxCount = Math.max(zeros, ones);
  const barWidth = canvas.width / 3;
  const barHeight = canvas.height - 60;
  
  // Draw bars
  ctx.fillStyle = colors.zero;
  const zeroHeight = (zeros / maxCount) * barHeight;
  ctx.fillRect(barWidth / 2, canvas.height - 40 - zeroHeight, barWidth / 2, zeroHeight);
  
  ctx.fillStyle = colors.one;
  const oneHeight = (ones / maxCount) * barHeight;
  ctx.fillRect(barWidth * 1.5, canvas.height - 40 - oneHeight, barWidth / 2, oneHeight);
  
  // Draw labels
  ctx.fillStyle = colors.text;
  ctx.font = '12px Inter, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('0s: ' + zeros, barWidth * 0.75, canvas.height - 20);
  ctx.fillText('1s: ' + ones, barWidth * 1.75, canvas.height - 20);
  ctx.fillText('Bit Distribution', canvas.width / 2, 15);
},

// Additional stub functions for the enhanced QRNG visualization
createQualityRadarChart: function(output) {
  // Placeholder for quality radar chart
  console.log('Quality radar chart would be implemented here');
},

updateQRNGStatisticalTests: function(output) {
  const container = document.getElementById('qrng-statistical-tests');
  if (!container) return;
  
  if (!output.statistics || output.statistics.error) {
    container.innerHTML = '<div class="alert alert-info">Insufficient data for statistical analysis</div>';
    return;
  }
  
  const stats = output.statistics;
  container.innerHTML = `
    <div class="alert alert-success">
      <strong>Quality Score:</strong> ${Math.round(stats.quality_score)}/100<br>
      <strong>Entropy:</strong> ${(stats.entropy_percentage || 0).toFixed(1)}%<br>
      <strong>Bias:</strong> ${((stats.bias || 0) * 100).toFixed(2)}%
    </div>
  `;
},

updateQRNGBitDetails: function(output) {
  const container = document.getElementById('qrng-bit-details');
  if (!container) return;
  
  // Determine configuration type for better user understanding
  let configType = 'Educational';
  let configColor = 'primary';
  let configIcon = 'graduation-cap';
  
  if (output.post_processing_enabled && output.noise_level > 0.05) {
    configType = 'Cryptographic';
    configColor = 'success';
    configIcon = 'lock';
  } else if (output.noise_level > 0 || output.hardware_simulation) {
    configType = 'Research/Advanced';
    configColor = 'warning';
    configIcon = 'cogs';
  }
  
  container.innerHTML = `
    <div class="row">
      <div class="col-md-8">
        <div class="alert alert-${configColor}">
          <h6><i class="fas fa-${configIcon} me-2"></i>Configuration: ${configType}</h6>
          <div class="row">
            <div class="col-md-6">
              <strong>Bits Generated:</strong> ${output.num_bits}<br>
              <strong>Source:</strong> ${output.source_name || 'Unknown'}<br>
              <strong>Noise Level:</strong> ${(output.noise_level * 100).toFixed(1)}%
            </div>
            <div class="col-md-6">
              <strong>Post-Processing:</strong> ${output.post_processing_enabled ? '✓ Enabled' : '✗ Disabled'}<br>
              <strong>Hardware Simulation:</strong> ${output.hardware_simulation ? '✓ Enabled' : '✗ Disabled'}<br>
              <strong>Generation Time:</strong> ${output.generation_time_ms ? output.generation_time_ms.toFixed(1) + 'ms' : 'N/A'}
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card">
          <div class="card-header">
            <h6 class="mb-0">Feature Guide</h6>
          </div>
          <div class="card-body">
            <small>
              ${output.post_processing_enabled ? 
                '<div class="text-success mb-2"><i class="fas fa-check me-1"></i><strong>Bias Correction:</strong> Applied von Neumann extraction for cryptographic quality</div>' : 
                '<div class="text-muted mb-2"><i class="fas fa-info me-1"></i><strong>Raw Output:</strong> Pure quantum measurements without processing</div>'
              }
              ${output.noise_level > 0 ? 
                `<div class="text-warning mb-2"><i class="fas fa-exclamation-triangle me-1"></i><strong>Realistic Noise:</strong> Simulating ${(output.noise_level * 100).toFixed(1)}% hardware imperfections</div>` : 
                '<div class="text-info mb-2"><i class="fas fa-star me-1"></i><strong>Ideal Simulation:</strong> Perfect quantum operations</div>'
              }
              ${output.hardware_simulation ? 
                '<div class="text-primary"><i class="fas fa-clock me-1"></i><strong>Hardware Timing:</strong> Realistic delays included</div>' : 
                '<div class="text-muted"><i class="fas fa-zap me-1"></i><strong>Instant Mode:</strong> No hardware delays</div>'
              }
            </small>
          </div>
        </div>
      </div>
    </div>
  `;
},

updateQRNGApplications: function(output) {
  // Generate applications from the random number
  const cryptoKey = output.random_number.toString(16).padStart(8, '0').toUpperCase();
  const diceRoll = (output.random_number % 6) + 1;
  const uuid = `${cryptoKey}-4000-8000-${cryptoKey}`;
  
  const cryptoEl = document.getElementById('qrng-crypto-key');
  const diceEl = document.getElementById('qrng-dice-result');
  const uuidEl = document.getElementById('qrng-uuid');
  
  if (cryptoEl) cryptoEl.value = cryptoKey;
  if (diceEl) diceEl.textContent = diceRoll;
  if (uuidEl) uuidEl.value = uuid;
},

updateQRNGEducationalContent: function(output) {
  const container = document.getElementById('qrng-educational-content');
  if (!container) return;
  
  container.innerHTML = `
    <div class="row">
      <div class="col-md-12">
        <h5>Quantum Random Number Generation</h5>
        <p>This simulation demonstrates how quantum mechanics provides true randomness through:</p>
        <ul>
          <li><strong>Superposition:</strong> ${output.quantum_principles?.superposition || 'Quantum states existing in multiple possibilities simultaneously'}</li>
          <li><strong>Measurement:</strong> ${output.quantum_principles?.measurement || 'Random collapse upon observation'}</li>
          <li><strong>Uncertainty:</strong> ${output.quantum_principles?.uncertainty || 'Fundamental unpredictability'}</li>
        </ul>
        <div class="alert alert-primary">
          <strong>Source Used:</strong> ${output.source_description || 'Quantum superposition'}
        </div>
      </div>
    </div>
  `;
},

addToQRNGHistory: function(output) {
  if (!window.qrngHistory) {
    window.qrngHistory = [];
  }
  
  window.qrngHistory.unshift({
    timestamp: output.timestamp || new Date().toLocaleTimeString(),
    number: output.random_number,
    binary: output.bits_string,
    source: output.source_name,
    quality: output.statistics && !output.statistics.error ? Math.round(output.statistics.quality_score) : 0
  });
  
  // Keep only last 20 entries
  if (window.qrngHistory.length > 20) {
    window.qrngHistory = window.qrngHistory.slice(0, 20);
  }
  
  this.updateQRNGHistoryDisplay();
},

updateQRNGHistoryDisplay: function() {
  const container = document.getElementById('qrng-history-container');
  if (!container || !window.qrngHistory) return;
  
  if (window.qrngHistory.length === 0) {
    container.innerHTML = '<div class="alert alert-info">No generation history available</div>';
    return;
  }
  
  let html = '<div class="table-responsive"><table class="table table-sm"><thead><tr><th>Time</th><th>Number</th><th>Binary</th><th>Source</th><th>Quality</th></tr></thead><tbody>';
  
  window.qrngHistory.slice(0, 10).forEach(entry => {
    html += `<tr>
      <td><small>${entry.timestamp}</small></td>
      <td><code>${entry.number}</code></td>
      <td><code class="small">${entry.binary}</code></td>
      <td><small>${entry.source}</small></td>
      <td><span class="badge ${entry.quality >= 80 ? 'bg-success' : entry.quality >= 60 ? 'bg-warning' : 'bg-danger'}">${entry.quality}</span></td>
    </tr>`;
  });
  
  html += '</tbody></table></div>';
  container.innerHTML = html;
},

setupQRNGControls: function(output) {
  // Setup export functionality
  const exportBtn = document.getElementById('qrng-export-btn');
  if (exportBtn) {
    exportBtn.onclick = () => {
      const data = `Random Number: ${output.random_number}\nBinary: ${output.bits_string}\nSource: ${output.source_name}`;
      const blob = new Blob([data], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'qrng_data.txt';
      a.click();
      URL.revokeObjectURL(url);
    };
  }
}

}; // End of QuantumVisualizer object

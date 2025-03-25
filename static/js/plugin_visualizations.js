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
      default:
        // For other plugins, just log that no specific visualization is available
        console.log('No specific visualization for plugin type: ' + pluginKey);
    }
  },

  // Modify the existing initBitDistribution function:
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

  // Add all the new functions as properties of the QuantumVisualizer object:
  
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
  circuitContainer.className = 'circuit-svg bg-white p-3 rounded mb-4 text-center overflow-auto position-relative';
  
  // IMPORTANT FIX: Use a proper DOM parser for SVG instead of innerHTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = data.output.circuit_svg;
  
  // Append the SVG element(s) to the circuit container
  while (tempDiv.firstChild) {
    circuitContainer.appendChild(tempDiv.firstChild);
  }
  
  vizTab.appendChild(circuitContainer);
}

// When dynamically loading results, call our new function to add download buttons
setTimeout(addCircuitDownloadButtons, 100); // Short delay to ensure DOM is updated

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

/**
 * Downloads the circuit SVG visualization as a file
 * 
 * @param {string} containerSelector - CSS selector for the container holding the SVG
 * @param {string} filename - Desired filename for the downloaded SVG
 */
function downloadCircuitSVG(containerSelector, filename = 'quantum-circuit.svg') {
  // Get the SVG element from the container
  const container = document.querySelector(containerSelector);
  if (!container) {
    console.error(`Container not found: ${containerSelector}`);
    return;
  }
  
  const svgElement = container.querySelector('svg');
  if (!svgElement) {
    console.error('SVG element not found within container');
    return;
  }
  
  // Clone the SVG to avoid modifying the displayed one
  const clonedSvg = svgElement.cloneNode(true);
  
  // Ensure the SVG has proper dimensions
  if (!clonedSvg.getAttribute('width') || !clonedSvg.getAttribute('height')) {
    const bbox = svgElement.getBBox();
    clonedSvg.setAttribute('width', bbox.width);
    clonedSvg.setAttribute('height', bbox.height);
    clonedSvg.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
  }
  
  // Get SVG source
  const serializer = new XMLSerializer();
  let source = serializer.serializeToString(clonedSvg);
  
  // Add namespaces if they're missing
  if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
    source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  
  // Add XML declaration
  source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
  
  // Convert SVG source to URL data
  const svgBlob = new Blob([source], {type: "image/svg+xml;charset=utf-8"});
  const svgUrl = URL.createObjectURL(svgBlob);
  
  // Create download link
  const downloadLink = document.createElement('a');
  downloadLink.href = svgUrl;
  downloadLink.download = filename;
  
  // Trigger download
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  
  // Clean up
  URL.revokeObjectURL(svgUrl);
  
  console.log(`Downloaded circuit diagram as: ${filename}`);
}

/**
 * Adds download buttons to all circuit SVG visualizations on the page
 */
function addCircuitDownloadButtons() {
  // Find the circuit SVG container
  const circuitContainers = document.querySelectorAll('.circuit-svg');
  
  if (circuitContainers.length === 0) {
    console.log('No circuit visualizations found on page');
    return;
  }
  
  console.log(`Found ${circuitContainers.length} circuit visualization(s)`);
  
  // Get the plugin key from the URL to use in the filename
  const urlParts = window.location.pathname.split('/');
  const pluginKey = urlParts[urlParts.length - 1] || 'quantum';
  
  // Add a download button to each circuit container
  circuitContainers.forEach((container, index) => {
    // Check if container already has a download button
    if (container.querySelector('.circuit-download-btn')) {
      return;
    }
    
    // Create download button
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'btn btn-sm btn-primary circuit-download-btn';
    downloadBtn.innerHTML = '<i class="fas fa-download me-1"></i> Download SVG';
    downloadBtn.title = 'Download circuit diagram as SVG';
    downloadBtn.style.position = 'absolute';
    downloadBtn.style.top = '10px';
    downloadBtn.style.right = '10px';
    downloadBtn.style.zIndex = '100';
    
    // Add click event listener
    downloadBtn.addEventListener('click', function(e) {
      e.stopPropagation(); // Prevent event from interfering with scrolling
      const filename = `${pluginKey}_circuit${index > 0 ? '_' + index : ''}.svg`;
      downloadCircuitSVG(`.circuit-svg:nth-of-type(${index + 1})`, filename);
    });
    
    // Add button to container
    container.appendChild(downloadBtn);
    console.log(`Added download button to circuit visualization ${index + 1}`);
  });
}

// Add the initialization to the document ready event
document.addEventListener('DOMContentLoaded', function() {
  // Initialize download buttons when the page loads
  addCircuitDownloadButtons();
  
  // Also add buttons after any results are loaded via AJAX
  // This ensures buttons are added to dynamically generated content
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.addedNodes.length > 0) {
        addCircuitDownloadButtons();
      }
    });
  });
  
  // Observe the results container for changes
  const resultsContainer = document.getElementById('results-container');
  if (resultsContainer) {
    observer.observe(resultsContainer, { childList: true, subtree: true });
  }
});
/**
 * Quantum Field Kit - Visualization Adapter
 * Fixed version that ensures Bloch sphere and circuit visualizations render properly
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Enhanced visualization adapter loaded');
    
    // Initialize a Bloch sphere visualization
    initBlochSphere();
    
    // Initialize circuit visualizer if needed
    initCircuitVisualizer();
    
    // Setup state change buttons
    setupStateButtons();
  });
  
  function initBlochSphere() {
    // Look for Bloch sphere containers in various locations
    const containers = [
      document.getElementById('bloch-sphere-container'),
      document.getElementById('quantum-state-viz')
    ];
    
    const container = containers.find(c => c !== null);
    
    if (!container) {
      console.log('No Bloch sphere container found on page');
      return;
    }
    
    console.log('Initializing Bloch sphere in:', container.id);
    
    try {
      // Ensure THREE.js is available
      if (typeof THREE === 'undefined') {
        // Load THREE.js dynamically if not available
        loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', function() {
          createBlochSphere(container);
        });
      } else {
        createBlochSphere(container);
      }
    } catch (e) {
      console.error('Error initializing Bloch sphere:', e);
      container.innerHTML = `
        <div class="alert alert-warning p-3 text-center">
          <i class="fas fa-exclamation-triangle me-2"></i>
          Error initializing visualization: ${e.message}
        </div>`;
    }
  }
  
  function createBlochSphere(container) {
    // Check if we should use the QuantumViz namespace implementation
    if (window.QuantumViz && window.QuantumViz.BlochSphere) {
      try {
        // Use the namespaced version
        console.log('Using QuantumViz.BlochSphere implementation');
        const blochSphere = new QuantumViz.BlochSphere(container.id);
        
        // Store reference to the created instance
        window.blochSphere = {
          setStateByAngles: function(theta, phi) {
            blochSphere.setStateByAngles(theta, phi);
          },
          setToState0: function() { this.setStateByAngles(0, 0); },
          setToState1: function() { this.setStateByAngles(Math.PI, 0); },
          setToStatePlus: function() { this.setStateByAngles(Math.PI/2, 0); },
          setToStateMinus: function() { this.setStateByAngles(Math.PI/2, Math.PI); },
          setToPlusI: function() { this.setStateByAngles(Math.PI/2, Math.PI/2); },
          setToMinusI: function() { this.setStateByAngles(Math.PI/2, -Math.PI/2); }
        };
        
        // Set initial state to |+⟩
        window.blochSphere.setStateByAngles(Math.PI/2, 0);
        return;
      } catch (e) {
        console.error('Error using QuantumViz implementation:', e);
        // Fall back to custom implementation
      }
    }
  
    // Clean container first
    container.innerHTML = '';
    
    // Set up scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#141424');
    
    // Set up camera
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 400;
    
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 0, 2.5);
    camera.lookAt(0, 0, 0);
    
    // Set up renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);
    
    // Add sphere
    const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
    const sphereMaterial = new THREE.MeshPhongMaterial({
      color: '#2a2a4a',
      transparent: true,
      opacity: 0.3,
      wireframe: false
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    scene.add(sphere);
    
    // Add wireframe
    const wireGeometry = new THREE.SphereGeometry(1.001, 16, 16);
    const wireMaterial = new THREE.MeshBasicMaterial({
      color: '#4a4a8a',
      wireframe: true,
      transparent: true,
      opacity: 0.5
    });
    const wireframe = new THREE.Mesh(wireGeometry, wireMaterial);
    scene.add(wireframe);
    
    // Add axes
    const axesGroup = new THREE.Group();
    
    // Z-axis (|0⟩ to |1⟩)
    const zMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    const zPoints = [
      new THREE.Vector3(0, 0, -1.2),
      new THREE.Vector3(0, 0, 1.2)
    ];
    const zGeometry = new THREE.BufferGeometry().setFromPoints(zPoints);
    const zLine = new THREE.Line(zGeometry, zMaterial);
    axesGroup.add(zLine);
    
    // X-axis (|+⟩ to |-⟩)
    const xMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
    const xPoints = [
      new THREE.Vector3(-1.2, 0, 0),
      new THREE.Vector3(1.2, 0, 0)
    ];
    const xGeometry = new THREE.BufferGeometry().setFromPoints(xPoints);
    const xLine = new THREE.Line(xGeometry, xMaterial);
    axesGroup.add(xLine);
    
    // Y-axis (|i+⟩ to |i-⟩)
    const yMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff });
    const yPoints = [
      new THREE.Vector3(0, -1.2, 0),
      new THREE.Vector3(0, 1.2, 0)
    ];
    const yGeometry = new THREE.BufferGeometry().setFromPoints(yPoints);
    const yLine = new THREE.Line(yGeometry, yMaterial);
    axesGroup.add(yLine);
    
    scene.add(axesGroup);
    
    // Add state vector
    const arrowDirection = new THREE.Vector3(0, 0, 1);
    const arrowOrigin = new THREE.Vector3(0, 0, 0);
    const arrowLength = 1;
    const arrowColor = 0xff3366;
    const headLength = 0.2;
    const headWidth = 0.1;
    
    const stateVector = new THREE.ArrowHelper(
      arrowDirection, 
      arrowOrigin, 
      arrowLength, 
      arrowColor,
      headLength,
      headWidth
    );
    scene.add(stateVector);
    
    // Add equator circle
    // Create points for circle manually to avoid using deprecated vertices property
    const points = [];
    const segments = 64;
    for (let i = 0; i < segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(theta), Math.sin(theta), 0));
    }
    const equatorGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const equatorMaterial = new THREE.MeshBasicMaterial({
      color: '#4a4a8a',
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    
    const equator = new THREE.Mesh(equatorGeometry, equatorMaterial);
    equator.rotation.x = Math.PI / 2;
    scene.add(equator);
    
    // Add simple orbit controls if available
    let controls = null;
    if (typeof THREE.OrbitControls !== 'undefined') {
      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.rotateSpeed = 0.5;
    } else {
      console.warn('OrbitControls not available, using auto-rotation instead');
    }
    
    // Add labels for quantum states
    addStateLabel(scene, '|0⟩', 0, 0, 1.3);
    addStateLabel(scene, '|1⟩', 0, 0, -1.3);
    addStateLabel(scene, '|+⟩', 1.3, 0, 0);
    addStateLabel(scene, '|-⟩', -1.3, 0, 0);
    addStateLabel(scene, '|i+⟩', 0, 1.3, 0);
    addStateLabel(scene, '|i-⟩', 0, -1.3, 0);
    
    // Animation loop
    function animate() {
      requestAnimationFrame(animate);
      
      if (controls) {
        controls.update();
      } else {
        // Auto-rotate if no controls
        sphere.rotation.y += 0.005;
        wireframe.rotation.y += 0.005;
        axesGroup.rotation.y += 0.005;
        equator.rotation.y += 0.005;
        stateVector.rotation.y += 0.005;
      }
      
      renderer.render(scene, camera);
    }
    
    animate();
    
    // Add window resize handler
    window.addEventListener('resize', () => {
      const width = container.clientWidth;
      const height = container.clientHeight || 400;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    });
    
    // Create the interface for state changes
    window.blochSphere = {
      setStateByAngles: function(theta, phi) {
        // Convert spherical coordinates to Cartesian
        const x = Math.sin(theta) * Math.cos(phi);
        const y = Math.sin(theta) * Math.sin(phi);
        const z = Math.cos(theta);
        
        // Update arrow direction
        const newDirection = new THREE.Vector3(x, y, z);
        stateVector.setDirection(newDirection);
      },
      setToState0: function() { this.setStateByAngles(0, 0); },
      setToState1: function() { this.setStateByAngles(Math.PI, 0); },
      setToStatePlus: function() { this.setStateByAngles(Math.PI/2, 0); },
      setToStateMinus: function() { this.setStateByAngles(Math.PI/2, Math.PI); },
      setToPlusI: function() { this.setStateByAngles(Math.PI/2, Math.PI/2); },
      setToMinusI: function() { this.setStateByAngles(Math.PI/2, -Math.PI/2); }
    };
    
    // Set initial state to |+⟩
    window.blochSphere.setStateByAngles(Math.PI/2, 0);
    
    console.log('Bloch sphere created successfully');
  }
  
  function addStateLabel(scene, text, x, y, z) {
    // Create a canvas for the label
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 64, 32);
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    // Create a sprite material with the texture
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true
    });
    
    // Create the sprite
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.set(x, y, z);
    sprite.scale.set(0.5, 0.25, 1);
    scene.add(sprite);
    
    return sprite;
  }
  
  function initCircuitVisualizer() {
    const container = document.getElementById('circuit-demo-container');
    if (!container) {
      return;
    }
    
    console.log('Initializing circuit visualizer');
    
    // Check if we should use the QuantumViz namespace implementation
    if (window.QuantumViz && window.QuantumViz.QuantumCircuitRenderer) {
      try {
        console.log('Using QuantumViz.QuantumCircuitRenderer implementation');
        const circuit = {
          qubits: ['q0', 'q1', 'q2'],
          gates: [
            { type: 'H', qubit: 0, time: 0 },
            { type: 'X', qubit: 1, time: 0 },
            { type: 'CNOT', control: 0, target: 1, time: 1 },
            { type: 'H', qubit: 0, time: 2 },
            { type: 'CNOT', control: 1, target: 2, time: 2 },
            { type: 'M', qubit: 0, time: 3 },
            { type: 'M', qubit: 1, time: 3 }
          ]
        };
        
        const circuitVisualizer = new QuantumViz.QuantumCircuitRenderer(container.id);
        circuitVisualizer.render(circuit);
        return;
      } catch (e) {
        console.error('Error using QuantumViz circuit implementation:', e);
        // Fall back to custom implementation
      }
    }
    
    // SVG-based circuit visualizer (fallback)
    createCircuitVisualizer(container);
  }
  
  function createCircuitVisualizer(container) {
    // Parameters
    const padding = 20;
    const qubitSpacing = 50;
    const gateSpacing = 60;
    const labelWidth = 50;
    
    // Sample circuit data (can be replaced with real data)
    const circuit = {
      qubits: ['q0', 'q1', 'q2'],
      gates: [
        { type: 'H', qubit: 0, time: 0 },
        { type: 'X', qubit: 1, time: 0 },
        { type: 'CNOT', control: 0, target: 1, time: 1 },
        { type: 'H', qubit: 0, time: 2 },
        { type: 'CNOT', control: 1, target: 2, time: 2 },
        { type: 'M', qubit: 0, time: 3 },
        { type: 'M', qubit: 1, time: 3 },
        { type: 'M', qubit: 2, time: 4 }
      ]
    };
    
    // Calculate dimensions
    const width = labelWidth + (getMaxTime(circuit.gates) * gateSpacing) + (2 * padding);
    const height = (circuit.qubits.length * qubitSpacing) + (2 * padding);
    
    // Create SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.style.backgroundColor = '#ffffff';
    container.appendChild(svg);
    
    // Draw qubit lines
    drawQubitLines(svg, circuit.qubits, labelWidth, padding, qubitSpacing, width);
    
    // Draw gates
    drawGates(svg, circuit.gates, labelWidth, padding, qubitSpacing, gateSpacing);
    
    console.log('Circuit visualizer created successfully');
  }
  
  function getMaxTime(gates) {
    let maxTime = 0;
    for (const gate of gates) {
      if (gate.time > maxTime) {
        maxTime = gate.time;
      }
    }
    return maxTime + 2; // Add space for the end
  }
  
  function drawQubitLines(svg, qubits, labelWidth, padding, qubitSpacing, width) {
    qubits.forEach((qubit, index) => {
      const y = padding + (index * qubitSpacing);
      
      // Draw qubit label
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', padding);
      label.setAttribute('y', y + 5); // Slight adjustment for text centering
      label.setAttribute('fill', '#000000');
      label.setAttribute('text-anchor', 'start');
      label.setAttribute('dominant-baseline', 'middle');
      label.textContent = qubit;
      svg.appendChild(label);
      
      // Draw qubit line
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', labelWidth);
      line.setAttribute('y1', y);
      line.setAttribute('x2', width - padding);
      line.setAttribute('y2', y);
      line.setAttribute('stroke', '#888888');
      line.setAttribute('stroke-width', 2);
      svg.appendChild(line);
    });
  }
  
  function drawGates(svg, gates, labelWidth, padding, qubitSpacing, gateSpacing) {
    gates.forEach(gate => {
      const x = labelWidth + (gate.time * gateSpacing) + padding;
      
      if (gate.type === 'CNOT') {
        drawCNOTGate(svg, x, gate.control, gate.target, padding, qubitSpacing);
      } else if (gate.type === 'M') {
        drawMeasurementGate(svg, x, gate.qubit, padding, qubitSpacing);
      } else {
        // Single-qubit gate
        drawSingleQubitGate(svg, x, gate.qubit, gate.type, padding, qubitSpacing);
      }
    });
  }
  
  function drawSingleQubitGate(svg, x, qubitIndex, gateType, padding, qubitSpacing) {
    const y = padding + (qubitIndex * qubitSpacing);
    const size = 30;
    
    // Use different colors for different gate types
    let color;
    switch (gateType) {
      case 'H': color = '#3498db'; break;    // Blue
      case 'X': color = '#e74c3c'; break;    // Red
      case 'Y': color = '#2ecc71'; break;    // Green
      case 'Z': color = '#f39c12'; break;    // Orange
      default: color = '#9b59b6';            // Purple
    }
    
    // Draw gate box
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', x - size/2);
    rect.setAttribute('y', y - size/2);
    rect.setAttribute('width', size);
    rect.setAttribute('height', size);
    rect.setAttribute('fill', color);
    rect.setAttribute('stroke', '#444444');
    rect.setAttribute('stroke-width', 2);
    rect.setAttribute('rx', 4);
    svg.appendChild(rect);
    
    // Draw gate label
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', x);
    text.setAttribute('y', y);
    text.setAttribute('fill', '#ffffff');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.textContent = gateType;
    svg.appendChild(text);
  }
  
  function drawCNOTGate(svg, x, controlIndex, targetIndex, padding, qubitSpacing) {
    const controlY = padding + (controlIndex * qubitSpacing);
    const targetY = padding + (targetIndex * qubitSpacing);
    const radius = 15;
    
    // Draw vertical line connecting control and target
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x);
    line.setAttribute('y1', controlY);
    line.setAttribute('x2', x);
    line.setAttribute('y2', targetY);
    line.setAttribute('stroke', '#e74c3c');
    line.setAttribute('stroke-width', 2);
    svg.appendChild(line);
    
    // Draw control point
    const controlPoint = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    controlPoint.setAttribute('cx', x);
    controlPoint.setAttribute('cy', controlY);
    controlPoint.setAttribute('r', 5);
    controlPoint.setAttribute('fill', '#e74c3c');
    svg.appendChild(controlPoint);
    
    // Draw target (⊕ symbol)
    const targetCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    targetCircle.setAttribute('cx', x);
    targetCircle.setAttribute('cy', targetY);
    targetCircle.setAttribute('r', radius);
    targetCircle.setAttribute('fill', 'white');
    targetCircle.setAttribute('stroke', '#e74c3c');
    targetCircle.setAttribute('stroke-width', 2);
    svg.appendChild(targetCircle);
    
    // Draw the "+" in the target
    const vLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    vLine.setAttribute('x1', x);
    vLine.setAttribute('y1', targetY - radius);
    vLine.setAttribute('x2', x);
    vLine.setAttribute('y2', targetY + radius);
    vLine.setAttribute('stroke', '#e74c3c');
    vLine.setAttribute('stroke-width', 2);
    svg.appendChild(vLine);
    
    const hLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    hLine.setAttribute('x1', x - radius);
    hLine.setAttribute('y1', targetY);
    hLine.setAttribute('x2', x + radius);
    hLine.setAttribute('y2', targetY);
    hLine.setAttribute('stroke', '#e74c3c');
    hLine.setAttribute('stroke-width', 2);
    svg.appendChild(hLine);
  }
  
  function drawMeasurementGate(svg, x, qubitIndex, padding, qubitSpacing) {
    const y = padding + (qubitIndex * qubitSpacing);
    const size = 30;
    
    // Draw measurement box
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', x - size/2);
    rect.setAttribute('y', y - size/2);
    rect.setAttribute('width', size);
    rect.setAttribute('height', size);
    rect.setAttribute('fill', '#2ecc71');
    rect.setAttribute('stroke', '#444444');
    rect.setAttribute('stroke-width', 2);
    rect.setAttribute('rx', 4);
    svg.appendChild(rect);
    
    // Draw measurement symbol (M)
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', x);
    text.setAttribute('y', y);
    text.setAttribute('fill', '#ffffff');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.textContent = 'M';
    svg.appendChild(text);
  }
  
  function setupStateButtons() {
    // Define button mappings
    const buttonMappings = [
      { selector: '[id="setState-plus"], button:contains("|+⟩")', method: 'setToStatePlus' },
      { selector: '[id="setState-minus"], button:contains("|-⟩")', method: 'setToStateMinus' },
      { selector: '[id="setState-zero"], button:contains("|0⟩")', method: 'setToState0' },
      { selector: '[id="setState-one"], button:contains("|1⟩")', method: 'setToState1' },
      { selector: '[id="setState-plus-i"], button:contains("|+i⟩")', method: 'setToPlusI' },
      { selector: '[id="setState-minus-i"], button:contains("|-i⟩")', method: 'setToMinusI' }
    ];
    
    buttonMappings.forEach(mapping => {
      try {
        // Find buttons by ID
        const idSelector = mapping.selector.split(',')[0].trim();
        const buttons = document.querySelectorAll(idSelector);
        
        // Add click handlers
        buttons.forEach(button => {
          if (button) {
            button.addEventListener('click', function() {
              if (window.blochSphere && typeof window.blochSphere[mapping.method] === 'function') {
                window.blochSphere[mapping.method]();
                console.log(`Set state using ${mapping.method}`);
              } else {
                console.warn(`blochSphere.${mapping.method} not available`);
              }
            });
          }
        });
      } catch (e) {
        console.warn(`Error setting up button for ${mapping.method}:`, e);
      }
    });
  }
  
  function loadScript(url, callback) {
    const script = document.createElement('script');
    script.src = url;
    script.onload = callback;
    script.onerror = function() {
      console.error(`Failed to load script: ${url}`);
    };
    document.head.appendChild(script);
  }
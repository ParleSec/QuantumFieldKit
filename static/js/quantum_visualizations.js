// Quantum Visualization Components for Web UI
// Provides interactive visualizations for quantum states and circuits

class BlochSphere {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.width = this.container.clientWidth || 400;
    this.height = this.container.clientHeight || 400;
    this.options = Object.assign({
      backgroundColor: '#121212',
      sphereColor: '#444444',
      vectorColor: '#ff3366',
      axisColor: '#ffffff',
      labelColor: '#ffffff'
    }, options);
    
    this.initScene();
    this.initSphere();
    this.initAxes();
    this.initStateVector();
    this.initLabels();
    this.animate();
    
    // Add event listener for window resize
    window.addEventListener('resize', this.onResize.bind(this));
  }
  
  initScene() {
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.options.backgroundColor);
    
    // Camera setup
    this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.1, 1000);
    this.camera.position.z = 2.5;
    
    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);
    
    // Controls for orbit/rotation
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.25;
  }
  
  initSphere() {
    // Create the Bloch sphere
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: this.options.sphereColor,
      wireframe: true,
      transparent: true,
      opacity: 0.5
    });
    this.sphere = new THREE.Mesh(geometry, material);
    this.scene.add(this.sphere);
    
    // Add equator circle
    // Fix for newer versions of Three.js where CircleGeometry no longer has vertices property
    const equatorGeometry = new THREE.CircleGeometry(1, 64);
    const points = [];
    // Create points for the circle manually
    for (let i = 0; i < 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      const x = Math.cos(angle);
      const y = Math.sin(angle);
      points.push(new THREE.Vector3(x, y, 0));
    }
    
    const equatorBufferGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const equatorMaterial = new THREE.LineBasicMaterial({ color: this.options.sphereColor });
    this.equator = new THREE.LineLoop(equatorBufferGeometry, equatorMaterial);
    this.equator.rotation.x = Math.PI/2;
    this.scene.add(this.equator);
  }
  
  initAxes() {
    // Create axes
    const axes = new THREE.Group();
    
    // Z-axis (|0⟩ to |1⟩)
    const zGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, -1.2),
      new THREE.Vector3(0, 0, 1.2)
    ]);
    const zLine = new THREE.Line(zGeo, new THREE.LineBasicMaterial({ color: this.options.axisColor }));
    axes.add(zLine);
    
    // X-axis (|+⟩ to |-⟩)
    const xGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-1.2, 0, 0),
      new THREE.Vector3(1.2, 0, 0)
    ]);
    const xLine = new THREE.Line(xGeo, new THREE.LineBasicMaterial({ color: this.options.axisColor }));
    axes.add(xLine);
    
    // Y-axis (|i+⟩ to |i-⟩)
    const yGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -1.2, 0),
      new THREE.Vector3(0, 1.2, 0)
    ]);
    const yLine = new THREE.Line(yGeo, new THREE.LineBasicMaterial({ color: this.options.axisColor }));
    axes.add(yLine);
    
    this.scene.add(axes);
    this.axes = axes;
  }
  
  initStateVector() {
    // Arrow representing the current state
    const dir = new THREE.Vector3(0, 0, 1); // Default to |0⟩ state
    const origin = new THREE.Vector3(0, 0, 0);
    const length = 1;
    const headLength = 0.1;
    const headWidth = 0.05;
    
    this.stateVector = new THREE.ArrowHelper(
      dir, origin, length, this.options.vectorColor, headLength, headWidth
    );
    this.scene.add(this.stateVector);
  }
  
  initLabels() {
    // Add state labels using sprites
    this.addLabel('|0⟩', 0, 0, 1.3);
    this.addLabel('|1⟩', 0, 0, -1.3);
    this.addLabel('|+⟩', 1.3, 0, 0);
    this.addLabel('|-⟩', -1.3, 0, 0);
    this.addLabel('|i+⟩', 0, 1.3, 0);
    this.addLabel('|i-⟩', 0, -1.3, 0);
  }
  
  addLabel(text, x, y, z) {
    // Create canvas for text rendering
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = this.options.labelColor;
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 64, 32);
    
    // Convert canvas to texture
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(x, y, z);
    sprite.scale.set(0.5, 0.25, 1);
    this.scene.add(sprite);
  }
  
  setState(theta, phi) {
    // Convert spherical coordinates to cartesian
    const x = Math.sin(theta) * Math.cos(phi);
    const y = Math.sin(theta) * Math.sin(phi);
    const z = Math.cos(theta);
    
    // Update state vector direction
    const dir = new THREE.Vector3(x, y, z);
    this.stateVector.setDirection(dir);
    
    // Trigger onUpdate callback if defined
    if (typeof this.options.onUpdate === 'function') {
      this.options.onUpdate({ theta, phi, x, y, z });
    }
  }
  
  // Set state from Bloch sphere coordinates
  setStateByAngles(theta, phi) {
    this.setState(theta, phi);
  }
  
  // Set state from quantum state vector [alpha, beta]
  setStateByVector(alpha, beta) {
    // Convert quantum state to Bloch sphere coordinates
    // |ψ⟩ = α|0⟩ + β|1⟩ → (θ, φ) on Bloch sphere
    
    // Handle complex numbers
    const alphaAbs = typeof alpha === 'object' ? 
      Math.sqrt(alpha.real**2 + alpha.imag**2) : Math.abs(alpha);
    
    const theta = 2 * Math.acos(alphaAbs);
    
    let phi = 0;
    if (alphaAbs < 0.9999 && Math.abs(beta) > 0.0001) {
      // Calculate phase difference
      if (typeof beta === 'object' && typeof alpha === 'object') {
        // Complex numbers
        phi = Math.atan2(beta.imag, beta.real) - Math.atan2(alpha.imag, alpha.real);
      } else {
        // Real numbers
        phi = beta >= 0 ? 0 : Math.PI;
      }
    }
    
    this.setState(theta, phi);
  }
  
  onResize() {
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;
    
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }
  
  animate() {
    requestAnimationFrame(this.animate.bind(this));
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

// Quantum Circuit Renderer
class QuantumCircuitRenderer {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = Object.assign({
      padding: 20,
      qubitSpacing: 50,
      gateSpacing: 60,
      qubitLabelWidth: 50,
      qubitLineColor: '#888888',
      gateStrokeColor: '#444444',
      gateFillColor: '#3498db',
      textColor: '#ffffff',
      controlColor: '#e74c3c',
      measurementColor: '#2ecc71'
    }, options);
    
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.container.appendChild(this.svg);
    
    this.circuit = null;
    this.qubits = [];
    this.width = 0;
    this.height = 0;
    
    // Add event listener for window resize
    window.addEventListener('resize', this.onResize.bind(this));
  }
  
  onResize() {
    if (this.circuit) {
      this.render(this.circuit);
    }
  }
  
  clear() {
    while (this.svg.firstChild) {
      this.svg.removeChild(this.svg.firstChild);
    }
  }
  
  render(circuit) {
    this.clear();
    this.circuit = circuit;
    
    // Extract qubit and gate information
    this.qubits = this.extractQubits(circuit);
    const gates = this.extractGates(circuit);
    
    // Calculate dimensions
    const width = this.options.qubitLabelWidth + 
                 (gates.length * this.options.gateSpacing) + 
                 (2 * this.options.padding);
    const height = (this.qubits.length * this.options.qubitSpacing) + 
                  (2 * this.options.padding);
    
    // Set SVG dimensions
    this.svg.setAttribute('width', width);
    this.svg.setAttribute('height', height);
    this.svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    
    // Draw qubit lines
    this.drawQubitLines();
    
    // Draw gates
    this.drawGates(gates);
  }
  
  extractQubits(circuit) {
    // This would parse the Cirq circuit to extract qubit information
    // For demonstration, we'll simulate a circuit with 3 qubits
    return ['q0', 'q1', 'q2'];
  }
  
  extractGates(circuit) {
    // This would parse the Cirq circuit to extract gate information
    // For demonstration, we'll create some sample gates
    return [
      { type: 'H', qubit: 0, time: 0 },
      { type: 'X', qubit: 1, time: 0 },
      { type: 'CNOT', control: 0, target: 1, time: 1 },
      { type: 'H', qubit: 0, time: 2 },
      { type: 'M', qubit: 0, time: 3 },
      { type: 'M', qubit: 1, time: 3 }
    ];
  }
  
  drawQubitLines() {
    const startX = this.options.qubitLabelWidth;
    const endX = this.svg.width.baseVal.value - this.options.padding;
    
    this.qubits.forEach((qubit, index) => {
      const y = this.options.padding + (index * this.options.qubitSpacing);
      
      // Draw qubit label
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', this.options.padding);
      label.setAttribute('y', y + 5); // Slight adjustment for text centering
      label.setAttribute('fill', this.options.textColor);
      label.setAttribute('text-anchor', 'start');
      label.setAttribute('dominant-baseline', 'middle');
      label.textContent = qubit;
      this.svg.appendChild(label);
      
      // Draw qubit line
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', startX);
      line.setAttribute('y1', y);
      line.setAttribute('x2', endX);
      line.setAttribute('y2', y);
      line.setAttribute('stroke', this.options.qubitLineColor);
      line.setAttribute('stroke-width', 2);
      this.svg.appendChild(line);
    });
  }
  
  drawGates(gates) {
    gates.forEach(gate => {
      const x = this.options.qubitLabelWidth + 
               (gate.time * this.options.gateSpacing) + 
               this.options.padding;
      
      if (gate.type === 'CNOT') {
        this.drawCNOT(x, gate.control, gate.target);
      } else if (gate.type === 'M') {
        this.drawMeasurement(x, gate.qubit);
      } else {
        this.drawSingleQubitGate(x, gate.qubit, gate.type);
      }
    });
  }
  
  drawSingleQubitGate(x, qubitIndex, gateType) {
    const y = this.options.padding + (qubitIndex * this.options.qubitSpacing);
    const size = 30;
    
    // Draw gate box
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', x - size/2);
    rect.setAttribute('y', y - size/2);
    rect.setAttribute('width', size);
    rect.setAttribute('height', size);
    rect.setAttribute('fill', this.options.gateFillColor);
    rect.setAttribute('stroke', this.options.gateStrokeColor);
    rect.setAttribute('stroke-width', 2);
    rect.setAttribute('rx', 4);
    this.svg.appendChild(rect);
    
    // Draw gate label
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', x);
    text.setAttribute('y', y);
    text.setAttribute('fill', this.options.textColor);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.textContent = gateType;
    this.svg.appendChild(text);
  }
  
  drawCNOT(x, controlIndex, targetIndex) {
    const controlY = this.options.padding + (controlIndex * this.options.qubitSpacing);
    const targetY = this.options.padding + (targetIndex * this.options.qubitSpacing);
    const radius = 15;
    
    // Draw vertical line connecting control and target
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x);
    line.setAttribute('y1', controlY);
    line.setAttribute('x2', x);
    line.setAttribute('y2', targetY);
    line.setAttribute('stroke', this.options.controlColor);
    line.setAttribute('stroke-width', 2);
    this.svg.appendChild(line);
    
    // Draw control point
    const controlPoint = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    controlPoint.setAttribute('cx', x);
    controlPoint.setAttribute('cy', controlY);
    controlPoint.setAttribute('r', 5);
    controlPoint.setAttribute('fill', this.options.controlColor);
    this.svg.appendChild(controlPoint);
    
    // Draw target (⊕ symbol)
    const targetCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    targetCircle.setAttribute('cx', x);
    targetCircle.setAttribute('cy', targetY);
    targetCircle.setAttribute('r', radius);
    targetCircle.setAttribute('fill', 'none');
    targetCircle.setAttribute('stroke', this.options.controlColor);
    targetCircle.setAttribute('stroke-width', 2);
    this.svg.appendChild(targetCircle);
    
    // Draw the "+" in the target
    const vLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    vLine.setAttribute('x1', x);
    vLine.setAttribute('y1', targetY - radius);
    vLine.setAttribute('x2', x);
    vLine.setAttribute('y2', targetY + radius);
    vLine.setAttribute('stroke', this.options.controlColor);
    vLine.setAttribute('stroke-width', 2);
    this.svg.appendChild(vLine);
    
    const hLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    hLine.setAttribute('x1', x - radius);
    hLine.setAttribute('y1', targetY);
    hLine.setAttribute('x2', x + radius);
    hLine.setAttribute('y2', targetY);
    hLine.setAttribute('stroke', this.options.controlColor);
    hLine.setAttribute('stroke-width', 2);
    this.svg.appendChild(hLine);
  }
  
  drawMeasurement(x, qubitIndex) {
    const y = this.options.padding + (qubitIndex * this.options.qubitSpacing);
    const size = 30;
    
    // Draw measurement box
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', x - size/2);
    rect.setAttribute('y', y - size/2);
    rect.setAttribute('width', size);
    rect.setAttribute('height', size);
    rect.setAttribute('fill', this.options.measurementColor);
    rect.setAttribute('stroke', this.options.gateStrokeColor);
    rect.setAttribute('stroke-width', 2);
    rect.setAttribute('rx', 4);
    this.svg.appendChild(rect);
    
    // Draw measurement symbol (M)
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', x);
    text.setAttribute('y', y);
    text.setAttribute('fill', this.options.textColor);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.textContent = 'M';
    this.svg.appendChild(text);
  }
}

// Probability Distribution Visualizer
class QuantumStateProbability {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = Object.assign({
      width: this.container.clientWidth || 500,
      height: 300,
      barColor: '#3498db',
      textColor: '#ffffff',
      axisColor: '#888888',
      gridColor: '#333333',
      padding: 40
    }, options);
    
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.options.width;
    this.canvas.height = this.options.height;
    this.container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    
    // Add event listener for window resize
    window.addEventListener('resize', this.onResize.bind(this));
  }
  
  onResize() {
    this.options.width = this.container.clientWidth;
    this.canvas.width = this.options.width;
    if (this.data) {
      this.render(this.data);
    }
  }
  
  render(stateVector) {
    this.data = stateVector;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Calculate probabilities
    const probabilities = this.calculateProbabilities(stateVector);
    
    // Draw axes and labels
    this.drawAxes(probabilities.length);
    
    // Draw probability bars
    this.drawBars(probabilities);
  }
  
  calculateProbabilities(stateVector) {
    // Calculate probability for each basis state
    return stateVector.map(amplitude => {
      if (typeof amplitude === 'object') {
        // Complex number
        return amplitude.real**2 + amplitude.imag**2;
      } else {
        // Real number
        return amplitude**2;
      }
    });
  }
  
  drawAxes(numStates) {
    const { ctx, options } = this;
    const { width, height, padding, axisColor, gridColor, textColor } = options;
    
    // Draw axes
    ctx.strokeStyle = axisColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    // X-axis
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    
    // Y-axis
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(padding, padding);
    
    ctx.stroke();
    
    // Draw grid lines and labels
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.fillStyle = textColor;
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    
    // Y-axis labels and grid (probabilities)
    for (let i = 0; i <= 10; i++) {
      const y = height - padding - ((height - 2 * padding) * i / 10);
      const prob = i / 10;
      
      // Grid line
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
      
      // Label
      ctx.fillText(prob.toFixed(1), padding - 15, y + 4);
    }
    
    // X-axis labels (basis states)
    const barWidth = (width - 2 * padding) / numStates;
    for (let i = 0; i < numStates; i++) {
      const x = padding + (i * barWidth) + (barWidth / 2);
      const label = i.toString(2).padStart(Math.log2(numStates), '0');
      
      // Label
      ctx.fillText(`|${label}⟩`, x, height - padding + 20);
    }
    
    // Axis titles
    ctx.font = '14px Arial';
    ctx.fillText('Basis States', width / 2, height - 10);
    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Probability', 0, 0);
    ctx.restore();
  }
  
  drawBars(probabilities) {
    const { ctx, options } = this;
    const { width, height, padding, barColor } = options;
    
    const numBars = probabilities.length;
    const barWidth = (width - 2 * padding) / numBars;
    const maxBarHeight = height - 2 * padding;
    
    ctx.fillStyle = barColor;
    
    // Draw bars
    probabilities.forEach((prob, i) => {
      const barHeight = prob * maxBarHeight;
      const x = padding + (i * barWidth);
      const y = height - padding - barHeight;
      
      ctx.fillRect(x, y, barWidth * 0.8, barHeight);
      
      // Draw probability value on top of bar if it's significant
      if (prob > 0.05) {
        ctx.fillStyle = options.textColor;
        ctx.fillText(prob.toFixed(2), x + barWidth * 0.4, y - 5);
        ctx.fillStyle = barColor;
      }
    });
  }
}

// Export visualization components
window.quantumViz = {
  BlochSphere,
  QuantumCircuitRenderer,
  QuantumStateProbability
};
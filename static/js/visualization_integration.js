document.addEventListener('DOMContentLoaded', function() {
    console.log('Visualization integration initializing...');
    
    // Check if THREE.js is already loaded, if not, load it
    if (typeof THREE === 'undefined') {
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', function() {
        // Load OrbitControls after THREE is loaded
        loadScript('/static/js/OrbitControls.js', initVisualizations);
      });
    } else {
      // If THREE is already loaded, just make sure OrbitControls is loaded
      if (typeof THREE.OrbitControls === 'undefined') {
        loadScript('/static/js/OrbitControls.js', initVisualizations);
      } else {
        initVisualizations();
      }
    }
    
    function initVisualizations() {
      // Initialize visualizations once dependencies are loaded
      console.log('Dependencies loaded, initializing visualizations...');
      
      // Load our visualization adapter
      loadScript('/static/js/visualization_adapter.js', function() {
        console.log('Visualization adapter loaded successfully');
      });
      
      // Connect to plugin visualizations if needed
      if (typeof QuantumVisualizer !== 'undefined') {
        console.log('QuantumVisualizer found, connecting...');
        // Override the init method if needed
        const originalInit = QuantumVisualizer.init;
        QuantumVisualizer.init = function(pluginKey, resultData) {
          console.log(`Initializing visualization for plugin: ${pluginKey}`);
          
          // Call original init
          originalInit.call(this, pluginKey, resultData);
          
          // Additional initialization for quantum state visualization
          if (['teleport', 'handshake', 'auth'].includes(pluginKey)) {
            // Check if the quantum state viz needs initialization
            const stateViz = document.getElementById('quantum-state-viz');
            if (stateViz && stateViz.childNodes.length === 0) {
              console.log('Initializing quantum state visualization');
              initBlochSphere(stateViz);
            }
          }
          
          // Future: Additional plugin-specific visualization handling
        };
      }
    }
    
    function initBlochSphere(container) {
      if (!container) return;
      
      try {
        if (typeof THREE === 'undefined') {
          throw new Error('THREE.js library not available');
        }
        
        console.log('Creating Bloch sphere visualization');
        
        // Scene setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color('#141424');
        
        // Camera setup
        const width = container.clientWidth || 300;
        const height = container.clientHeight || 300;
        const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
        camera.position.set(0, 0, 2.5);
        
        // Renderer setup
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        container.appendChild(renderer.domElement);
        
        // Add sphere, axes, and state vector
        addBlochComponents(scene);
        
        // Add orbit controls if available
        let controls = null;
        if (typeof THREE.OrbitControls !== 'undefined') {
          controls = new THREE.OrbitControls(camera, renderer.domElement);
          controls.enableDamping = true;
          controls.dampingFactor = 0.05;
        }
        
        // Animation loop
        function animate() {
          requestAnimationFrame(animate);
          
          if (controls) {
            controls.update();
          } else {
            // Auto-rotation fallback
            scene.rotation.y += 0.005;
          }
          
          renderer.render(scene, camera);
        }
        
        animate();
        
        // Handle window/container resizing
        window.addEventListener('resize', function() {
          if (container.clientWidth > 0 && container.clientHeight > 0) {
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
          }
        });
        
        // Expose a method to update state vector
        container.updateStateVector = function(theta, phi) {
          const stateVector = scene.getObjectByName('stateVector');
          if (stateVector) {
            const x = Math.sin(theta) * Math.cos(phi);
            const y = Math.sin(theta) * Math.sin(phi);
            const z = Math.cos(theta);
            
            const direction = new THREE.Vector3(x, y, z);
            stateVector.setDirection(direction);
          }
        };
        
        // Default to |+⟩ state
        container.updateStateVector(Math.PI/2, 0);
      } catch (e) {
        console.error('Error initializing Bloch sphere:', e);
        container.innerHTML = `
          <div class="alert alert-danger p-3 text-center">
            <i class="fas fa-exclamation-triangle me-2"></i>
            Error: ${e.message}
          </div>`;
      }
    }
    
    function addBlochComponents(scene) {
      // Add sphere
      const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
      const sphereMaterial = new THREE.MeshBasicMaterial({
        color: '#2a2a4a',
        transparent: true,
        opacity: 0.3,
        wireframe: true
      });
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      scene.add(sphere);
      
      // Add axes
      const axisLength = 1.2;
      const axisWidth = 2;
      
      // X-axis (red)
      const xAxisGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-axisLength, 0, 0),
        new THREE.Vector3(axisLength, 0, 0)
      ]);
      const xAxisMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: axisWidth });
      const xAxis = new THREE.Line(xAxisGeometry, xAxisMaterial);
      scene.add(xAxis);
      
      // Y-axis (green)
      const yAxisGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, -axisLength, 0),
        new THREE.Vector3(0, axisLength, 0)
      ]);
      const yAxisMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: axisWidth });
      const yAxis = new THREE.Line(yAxisGeometry, yAxisMaterial);
      scene.add(yAxis);
      
      // Z-axis (blue)
      const zAxisGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, -axisLength),
        new THREE.Vector3(0, 0, axisLength)
      ]);
      const zAxisMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff, linewidth: axisWidth });
      const zAxis = new THREE.Line(zAxisGeometry, zAxisMaterial);
      scene.add(zAxis);
      
      // Add state vector
      const arrowDir = new THREE.Vector3(0, 0, 1);
      const arrowOrigin = new THREE.Vector3(0, 0, 0);
      const arrowLength = 1;
      const arrowColor = 0xff3366;
      const headLength = 0.2;
      const headWidth = 0.1;
      
      const stateVector = new THREE.ArrowHelper(
        arrowDir, arrowOrigin, arrowLength, arrowColor, headLength, headWidth
      );
      stateVector.name = 'stateVector';
      scene.add(stateVector);
      
      // Add equator circle
      const circleGeometry = new THREE.CircleGeometry(1, 32);
      circleGeometry.rotateX(Math.PI / 2);
      const circleMaterial = new THREE.MeshBasicMaterial({
        color: '#4a4a8a',
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
      });
      const circle = new THREE.Mesh(circleGeometry, circleMaterial);
      scene.add(circle);
      
      // Add state labels
      addStateLabel(scene, '|0⟩', 0, 0, 1.3);
      addStateLabel(scene, '|1⟩', 0, 0, -1.3);
      addStateLabel(scene, '|+⟩', 1.3, 0, 0);
      addStateLabel(scene, '|-⟩', -1.3, 0, 0);
      addStateLabel(scene, '|i+⟩', 0, 1.3, 0);
      addStateLabel(scene, '|i-⟩', 0, -1.3, 0);
    }
    
    function addStateLabel(scene, text, x, y, z) {
      // Create canvas for text rendering
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 64;
      
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 64, 32);
      
      // Create texture from canvas
      const texture = new THREE.CanvasTexture(canvas);
      
      // Create sprite material with the texture
      const material = new THREE.SpriteMaterial({ 
        map: texture,
        transparent: true 
      });
      
      // Create sprite and position it
      const sprite = new THREE.Sprite(material);
      sprite.position.set(x, y, z);
      sprite.scale.set(0.5, 0.25, 1);
      scene.add(sprite);
      
      return sprite;
    }
    
    // Initialize circuit visualizer if needed
    function initCircuitVisualizer() {
      const container = document.getElementById('circuit-demo-container');
      if (!container) return;
      
      console.log('Initializing circuit visualizer');
      container.innerHTML = ''; // Clear container
      
      // Create SVG element
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', '100%');
      svg.setAttribute('viewBox', '0 0 800 400');
      container.appendChild(svg);
      
      // Define circuit
      const circuit = {
        qubits: ['q0', 'q1', 'q2'],
        gates: [
          { type: 'H', qubit: 0, time: 0 },
          { type: 'H', qubit: 1, time: 0 },
          { type: 'CNOT', control: 1, target: 2, time: 1 },
          { type: 'CNOT', control: 0, target: 1, time: 2 },
          { type: 'H', qubit: 0, time: 3 },
          { type: 'M', qubit: 0, time: 4 },
          { type: 'M', qubit: 1, time: 4 },
          { type: 'X', qubit: 2, time: 5, condition: [0, 1] },
          { type: 'Z', qubit: 2, time: 6, condition: [0] }
        ]
      };
      
      // Configuration
      const config = {
        qubitSpacing: 70,
        gateSpacing: 80,
        labelWidth: 60,
        padding: 40
      };
      
      // Draw circuit
      drawCircuit(svg, circuit, config);
    }
    
    function drawCircuit(svg, circuit, config) {
      const { qubitSpacing, gateSpacing, labelWidth, padding } = config;
      
      // Calculate circuit dimensions
      const maxTime = Math.max(...circuit.gates.map(g => g.time)) + 1;
      const width = labelWidth + (maxTime * gateSpacing) + (2 * padding);
      const height = (circuit.qubits.length * qubitSpacing) + (2 * padding);
      
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      
      // Draw qubit lines
      circuit.qubits.forEach((qubit, i) => {
        const y = padding + (i * qubitSpacing);
        
        // Draw qubit label
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', padding);
        label.setAttribute('y', y + 5);
        label.setAttribute('fill', '#ffffff');
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
      
      // Draw gates
      circuit.gates.forEach(gate => {
        const x = labelWidth + (gate.time * gateSpacing) + padding;
        
        if (gate.type === 'CNOT') {
          drawCnotGate(svg, x, gate.control, gate.target, padding, qubitSpacing);
        } else if (gate.type === 'M') {
          drawMeasurementGate(svg, x, gate.qubit, padding, qubitSpacing);
        } else {
          // Single-qubit gate
          drawSingleQubitGate(svg, x, gate.qubit, gate.type, padding, qubitSpacing, gate.condition);
        }
      });
    }
    
    function drawSingleQubitGate(svg, x, qubitIndex, gateType, padding, qubitSpacing, conditions) {
      const y = padding + (qubitIndex * qubitSpacing);
      const size = 30;
      
      // Determine gate color based on type
      let color;
      switch (gateType) {
        case 'H': color = '#3498db'; break; // Blue
        case 'X': color = '#e74c3c'; break; // Red
        case 'Y': color = '#2ecc71'; break; // Green
        case 'Z': color = '#f39c12'; break; // Orange
        default:  color = '#9b59b6'; break; // Purple
      }
      
      // Draw control lines if this gate is conditional
      if (conditions) {
        conditions.forEach(controlQubit => {
          const controlY = padding + (controlQubit * qubitSpacing);
          drawControlLine(svg, x, y, controlY);
        });
      }
      
      // Draw gate
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
      
      // Add gate label
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', x);
      text.setAttribute('y', y);
      text.setAttribute('fill', '#ffffff');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'middle');
      text.textContent = gateType;
      svg.appendChild(text);
    }
    
    function drawCnotGate(svg, x, controlIndex, targetIndex, padding, qubitSpacing) {
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
      
      // Draw target circle
      const targetCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      targetCircle.setAttribute('cx', x);
      targetCircle.setAttribute('cy', targetY);
      targetCircle.setAttribute('r', radius);
      targetCircle.setAttribute('fill', 'none');
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
      
      // Add M label
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', x);
      text.setAttribute('y', y);
      text.setAttribute('fill', '#ffffff');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'middle');
      text.textContent = 'M';
      svg.appendChild(text);
    }
    
    function drawControlLine(svg, x, targetY, controlY) {
      // Draw line from control to target
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x);
      line.setAttribute('y1', controlY);
      line.setAttribute('x2', x);
      line.setAttribute('y2', targetY);
      line.setAttribute('stroke', '#888888');
      line.setAttribute('stroke-width', 2);
      line.setAttribute('stroke-dasharray', '5,5');
      svg.appendChild(line);
      
      // Add control point
      const controlPoint = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      controlPoint.setAttribute('cx', x);
      controlPoint.setAttribute('cy', controlY);
      controlPoint.setAttribute('r', 4);
      controlPoint.setAttribute('fill', '#888888');
      svg.appendChild(controlPoint);
    }
    
    function loadScript(url, callback) {
      const script = document.createElement('script');
      script.src = url;
      
      script.onload = function() {
        console.log(`Loaded script: ${url}`);
        if (callback) callback();
      };
      
      script.onerror = function() {
        console.error(`Failed to load script: ${url}`);
      };
      
      document.head.appendChild(script);
    }
  });
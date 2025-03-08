document.addEventListener('DOMContentLoaded', function() {
    console.log('Simple visualization adapter loaded');
    
    // Initialize a simple Bloch sphere visualization
    const container = document.getElementById('bloch-sphere-container') || 
                      document.getElementById('quantum-state-viz');
    
    if (!container) {
      console.log('No visualization container found');
      return;
    }
    
    // Create a simple Bloch sphere without OrbitControls
    createSimpleBlochSphere(container);
    
    // Setup state change buttons
    setupStateButtons();
    
    function createSimpleBlochSphere(container) {
      try {
        if (typeof THREE === 'undefined') {
          throw new Error('THREE.js is not loaded');
        }
        
        console.log('Creating simple Bloch sphere in:', container.id);
        
        // Set up scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color('#141424');
        
        // Set up camera
        const width = container.clientWidth;
        const height = container.clientHeight || 400;
        const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
        camera.position.set(0, 0, 2.5);
        
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
          color: '#2a2a4a',
          wireframe: true,
          transparent: true,
          opacity: 0.3
        });
        const wireframe = new THREE.Mesh(wireGeometry, wireMaterial);
        scene.add(wireframe);
        
        // Add state vector
        const arrowDirection = new THREE.Vector3(0, 0, 1);
        const arrowOrigin = new THREE.Vector3(0, 0, 0);
        const arrowLength = 1;
        const arrowColor = 0xff3366;
        const stateVector = new THREE.ArrowHelper(
          arrowDirection, arrowOrigin, arrowLength, arrowColor, 0.1, 0.05
        );
        scene.add(stateVector);
        
        // Add circle guides
        const circleGeometry = new THREE.CircleGeometry(1, 32);
        const circleMaterial = new THREE.MeshBasicMaterial({
          color: '#2a2a4a',
          transparent: true,
          opacity: 0.3,
          side: THREE.DoubleSide
        });
        
        const equator = new THREE.Mesh(circleGeometry, circleMaterial);
        equator.rotation.x = Math.PI / 2;
        scene.add(equator);
        
        // Animation loop with auto-rotation
        function animate() {
          requestAnimationFrame(animate);
          
          // Auto-rotate the sphere
          sphere.rotation.y += 0.005;
          wireframe.rotation.y += 0.005;
          
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
            stateVector.setDirection(new THREE.Vector3(x, y, z));
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
        
        console.log('Simple Bloch sphere created successfully');
      } catch (error) {
        console.error('Error creating Bloch sphere:', error);
        container.innerHTML = `
          <div class="p-3 bg-danger text-white rounded text-center">
            Error: ${error.message}<br>
            <small>Check console for details</small>
          </div>`;
      }
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
      
      // Find all buttons
      buttonMappings.forEach(mapping => {
        try {
          // Try various methods to find buttons
          document.querySelectorAll(mapping.selector.split(',')[0]).forEach(button => {
            button.addEventListener('click', function() {
              if (window.blochSphere && window.blochSphere[mapping.method]) {
                window.blochSphere[mapping.method]();
                console.log(`Set state using ${mapping.method}`);
              }
            });
            console.log(`Added event listener to button: ${button.textContent.trim()}`);
          });
        } catch (e) {
          console.warn(`Error setting up button for ${mapping.method}:`, e);
        }
      });
    }
  });
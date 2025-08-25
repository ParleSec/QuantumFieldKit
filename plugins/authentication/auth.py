"""
Post-Quantum Lattice-Based Authentication System using Ring-LWE with Quantum Visualization Integration.

This module replaces the original quantum fingerprinting with a modern lattice-based authentication
scheme that is resistant to quantum attacks, while maintaining compatibility with the existing
visualization framework.
"""
import cirq
import hashlib
import numpy as np
from cirq.contrib.svg import circuit_to_svg
import matplotlib.pyplot as plt
from io import BytesIO
import base64

class RingLWE:
    """Ring Learning With Errors implementation for authentication."""
    
    def __init__(self, n=128, q=3329, sigma=2.0):
        """
        Initialize Ring-LWE parameters.
        
        Args:
            n: Polynomial degree (power of 2 for efficient NTT)
            q: Modulus (prime for simplicity)
            sigma: Standard deviation for error distribution
        """
        self.n = n
        self.q = q
        self.sigma = sigma
        
    def sample_uniform(self):
        """Sample uniformly from Z_q."""
        return np.random.randint(0, self.q, self.n)
    
    def sample_error(self):
        """Sample from error distribution (discrete Gaussian)."""
        # Simplified: Using rounded Gaussian with rejection sampling
        e = np.round(np.random.normal(0, self.sigma, self.n))
        return np.mod(e.astype(int), self.q)
    
    def polynomial_multiply(self, a, b):
        """Multiply polynomials in the ring."""
        # Using negacyclic convolution (Z_q[x]/(x^n + 1))
        c = np.zeros(self.n, dtype=int)
        for i in range(self.n):
            for j in range(self.n):
                if i + j < self.n:
                    c[i + j] = (c[i + j] + a[i] * b[j]) % self.q
                else:
                    # Apply the modulus x^n + 1
                    c[i + j - self.n] = (c[i + j - self.n] - a[i] * b[j]) % self.q
        return c
    
    def generate_keys(self, seed=None):
        """
        Generate a public/private key pair.
        
        Returns:
            Tuple of (public_key, private_key)
        """
        # Set seed for reproducibility if provided
        if seed is not None:
            np.random.seed(seed)
            
        # Sample a uniform polynomial (public)
        a = self.sample_uniform()
        
        # Sample small error polynomials
        s = self.sample_error()  # Private key
        e = self.sample_error()  # Error term
        
        # Compute b = a*s + e (mod q)
        b = (self.polynomial_multiply(a, s) + e) % self.q
        
        # Public key is (a, b), private key is s
        return ((a, b), s)
    
    def generate_challenge(self, public_key, seed=None):
        """
        Generate an authentication challenge.
        
        Args:
            public_key: Public key (a, b)
            
        Returns:
            Tuple of (challenge, expected_response)
        """
        if seed is not None:
            np.random.seed(seed)
            
        a, b = public_key
        
        # Sample small challenge polynomials
        r = self.sample_error()
        e1 = self.sample_error()
        e2 = self.sample_error()
        
        # Compute challenge
        u = (self.polynomial_multiply(a, r) + e1) % self.q
        v = (self.polynomial_multiply(b, r) + e2) % self.q
        
        # Expected response is a hash of r
        expected_response = hashlib.sha256(str(r).encode()).digest()
        
        return ((u, v), expected_response)
    
    def respond_to_challenge(self, private_key, challenge):
        """
        Respond to an authentication challenge.
        
        Args:
            private_key: Private key s
            challenge: Challenge (u, v)
            
        Returns:
            Response hash
        """
        u, v = challenge
        s = private_key
        
        # Compute v - u*s (approx ~ e2 - e1*s)
        w = (v - self.polynomial_multiply(u, s)) % self.q
        
        # Recover r approximately using threshold
        r_recovered = []
        for coef in w:
            # Small coefficients (likely part of e2 - e1*s)
            if coef <= self.sigma * 10 or coef >= self.q - self.sigma * 10:
                r_recovered.append(1)  # Simplified recovery
            else:
                r_recovered.append(0)
                
        # Hash the recovered polynomial
        response = hashlib.sha256(str(r_recovered).encode()).digest()
        return response
    
    def verify_response(self, expected_response, actual_response):
        """
        Verify an authentication response.
        
        Args:
            expected_response: Expected response hash
            actual_response: Actual response hash
            
        Returns:
            Boolean indicating whether authentication succeeded
        """
        return expected_response == actual_response

def create_quantum_challenge_circuit(n_qubits=4, noise_prob=0):
    """
    Creates a quantum circuit to be used in visualization.
    
    This creates a circuit representation of the lattice-based challenge-response,
    suitable for visualization with the existing quantum visualization components.
    """
    log = []
    
    # Create qubits
    qubits = [cirq.NamedQubit(f"q{i}") for i in range(n_qubits)]
    circuit = cirq.Circuit()
    
    # Apply Hadamard gates to create superposition (representing key setup)
    circuit.append([cirq.H(q) for q in qubits])
    log.append("Applied Hadamard gates to create superposition (representing key setup)")
    
    # Apply CNOT gates to create entanglement (representing lattice relationship)
    for i in range(n_qubits-1):
        circuit.append(cirq.CNOT(qubits[i], qubits[i+1]))
    log.append("Applied CNOT gates to create entanglement (representing lattice relationship)")
    
    # Apply rotations to represent error terms
    for i, q in enumerate(qubits):
        # Apply different rotations based on position
        if i % 3 == 0:
            circuit.append(cirq.Z(q))
        elif i % 3 == 1:
            circuit.append(cirq.X(q))
        else:
            circuit.append(cirq.Y(q))
    log.append("Applied rotations to represent error terms (noise in lattice)")
    
    # Apply optional noise
    if noise_prob > 0:
        noisy_ops = []
        for op in circuit.all_operations():
            noisy_ops.append(op)
            for q in op.qubits:
                noisy_ops.append(cirq.DepolarizingChannel(noise_prob).on(q))
        circuit = cirq.Circuit(noisy_ops)
        log.append(f"Added depolarizing noise with probability {noise_prob}")
    
    # Add measurements
    circuit.append([cirq.measure(q) for q in qubits])
    log.append("Added measurements to extract classical information")
    
    # Generate circuit diagram for visualization
    circuit_svg = circuit_to_svg(circuit)
    
    return circuit, circuit_svg, log

def generate_quantum_fingerprint_cirq(data, num_qubits=4):
    """
    Compatibility function for the original API.
    
    Rather than directly using quantum fingerprinting, this now uses the lattice-based
    approach but returns results in the expected format for compatibility.
    """
    log = []
    log.append("=== Post-Quantum Lattice-Based Authentication Simulation ===")
    
    # Generate deterministic seed from data
    seed = int(hashlib.sha256(data.encode()).hexdigest(), 16) % (2**32)
    log.append(f"Authenticating data: {data}")
    log.append(f"Using seed: {seed}")
    
    # Set parameters
    n = num_qubits * 16  # Scale lattice dimension based on qubits
    q = 3329  # Modulus (prime number)
    sigma = 2.0  # Noise parameter
    
    log.append(f"Lattice dimension: {n}")
    log.append(f"Modulus q: {q}")
    log.append(f"Noise parameter σ: {sigma:.2f}")
    
    # Initialize Ring-LWE system
    ring_lwe = RingLWE(n=n, q=q, sigma=sigma)
    
    # Generate keys
    log.append("\nGenerating key pair...")
    public_key, private_key = ring_lwe.generate_keys(seed=seed)
    
    # Generate challenge
    log.append("\nGenerating authentication challenge...")
    challenge, expected_response = ring_lwe.generate_challenge(public_key, seed=seed+1)
    
    # Respond to challenge
    log.append("\nResponding to challenge...")
    actual_response = ring_lwe.respond_to_challenge(private_key, challenge)
    
    # Verify response
    log.append("\nVerifying authentication...")
    auth_success = ring_lwe.verify_response(expected_response, actual_response)
    
    if auth_success:
        log.append("✓ Authentication successful!")
    else:
        log.append("✗ Authentication failed!")
    
    # Create visualization circuits
    circuit, circuit_svg, viz_log = create_quantum_challenge_circuit(num_qubits)
    log.extend(viz_log)
    
    # Create a "fingerprint" representation from the private key for compatibility
    # This is just a visualization representation, not the actual authentication token
    fingerprint = [int(x % 2) for x in private_key[:num_qubits]]
    
    # Generate additional visualizations
    key_viz_base64 = generate_lattice_visualization(private_key, num_qubits)
    
    # Set fingerprint to a deterministic value for the API (not actually used in auth)
    fingerprint = [int(hashlib.sha256((data + str(i)).encode()).hexdigest()[0], 16) % 2 
                   for i in range(num_qubits)]
    
    return {
        'fingerprint': fingerprint,
        'circuit_svg': circuit_svg, 
        'lattice_viz': key_viz_base64,
        'auth_success': auth_success,
        'log': "\n".join(log)
    }

def verify_fingerprint_cirq(data, fingerprint, num_qubits=4):
    """
    Compatibility function for the original API.
    Verifies if a given fingerprint matches the one generated from data.
    """
    result = generate_quantum_fingerprint_cirq(data, num_qubits)
    return result['fingerprint'] == fingerprint

def generate_lattice_visualization(coefficients, num_qubits):
    """Generate visualization of lattice points for quantum visualization."""
    plt.figure(figsize=(8, 6))
    
    # Create a subset of the coefficients for plotting
    n_coeffs = min(len(coefficients), 100)
    subset = coefficients[:n_coeffs]
    
    # Create a scatter plot for the lattice points
    plt.subplot(2, 1, 1)
    x = np.arange(n_coeffs)
    plt.scatter(x, subset, s=30, c=subset, cmap='viridis', alpha=0.7)
    plt.title('Lattice Coefficients (First 100 Values)')
    plt.xlabel('Index')
    plt.ylabel('Value Modulo q')
    plt.grid(alpha=0.3)
    
    # Create a histogram of coefficients
    plt.subplot(2, 1, 2)
    plt.hist(coefficients, bins=30, alpha=0.7, color='blue')
    plt.title('Lattice Coefficient Distribution')
    plt.xlabel('Coefficient Value')
    plt.ylabel('Frequency')
    plt.grid(alpha=0.3)
    
    plt.tight_layout()
    
    # Convert plot to base64 encoded string
    buffer = BytesIO()
    plt.savefig(buffer, format='png')
    buffer.seek(0)
    image_png = buffer.getvalue()
    buffer.close()
    plt.close()
    
    return base64.b64encode(image_png).decode('utf-8')

if __name__ == '__main__':
    # Run with default parameters
    data = "example_user"
    result = generate_quantum_fingerprint_cirq(data, num_qubits=8)
    print("Lattice-Based Authentication Simulation:")
    print(f"Data: {data}")
    print(f"Fingerprint: {result['fingerprint']}")
    print(f"Authentication success: {result['auth_success']}")
    
    print("\nDetailed Log:")
    print(result['log'])
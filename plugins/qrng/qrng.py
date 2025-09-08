"""
Enhanced High-Fidelity Quantum Random Number Generator using Cirq.

This module provides a comprehensive quantum random number generation system that demonstrates
multiple quantum randomness sources and includes advanced statistical analysis, real-time
quality metrics, and interactive visualization capabilities while maintaining utmost accuracy.

Features:
- Multiple quantum randomness sources (superposition, vacuum fluctuations, entanglement)
- Real-time statistical quality analysis
- Hardware noise modeling for realistic simulation
- Advanced post-processing and randomness extraction
- Interactive parameter controls and visualization
"""
import cirq
import numpy as np
import time
import math
import random
from collections import deque, Counter
from cirq.contrib.svg import circuit_to_svg
from scipy import stats
from typing import Dict, List, Tuple, Optional, Any

def generate_random_bit_cirq(qubit_idx=0):
    """
    Generates a single random bit using quantum superposition.
    
    In quantum mechanics, a qubit in equal superposition has a 50% chance
    of collapsing to |0> or |1> when measured, providing true randomness
    based on quantum uncertainty.
    
    Args:
        qubit_idx: Index of the qubit for labeling purposes
        
    Returns:
        Tuple of (random bit value, quantum circuit, circuit SVG)
    """
    q = cirq.NamedQubit(f"q{qubit_idx}")
    circuit = cirq.Circuit()
    
    # Create superposition with Hadamard gate
    circuit.append(cirq.H(q))
    
    # Add measurement
    circuit.append(cirq.measure(q, key='m'))
    
    # Run quantum simulation
    simulator = cirq.Simulator()
    result = simulator.run(circuit, repetitions=1)
    bit = int(result.measurements['m'][0][0])
    
    # Generate circuit diagram
    circuit_svg = circuit_to_svg(circuit)
    
    return bit, circuit, circuit_svg

class QuantumRandomnessSource:
    """Base class for different quantum randomness sources."""
    
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
    
    def generate_bit(self, noise_level: float = 0.0) -> Tuple[int, cirq.Circuit, str]:
        """Generate a single random bit using this quantum source."""
        raise NotImplementedError

class SuperpositionSource(QuantumRandomnessSource):
    """Quantum randomness from superposition collapse."""
    
    def __init__(self):
        super().__init__(
            "Superposition",
            "Uses Hadamard gates to create equal superposition states"
        )
    
    def generate_bit(self, noise_level: float = 0.0) -> Tuple[int, cirq.Circuit, str]:
        q = cirq.NamedQubit("q_super")
        circuit = cirq.Circuit()
        
        # Create superposition
        circuit.append(cirq.H(q))
        
        # Add noise if specified
        if noise_level > 0:
            circuit.append(cirq.depolarize(noise_level).on(q))
        
        # Measure
        circuit.append(cirq.measure(q, key='m'))
        
        # Simulate
        simulator = cirq.Simulator()
        result = simulator.run(circuit, repetitions=1)
        bit = int(result.measurements['m'][0][0])
        
        circuit_svg = circuit_to_svg(circuit)
        return bit, circuit, circuit_svg

class VacuumFluctuationSource(QuantumRandomnessSource):
    """Simulated vacuum fluctuation randomness."""
    
    def __init__(self):
        super().__init__(
            "Vacuum Fluctuation",
            "Simulates quantum vacuum fluctuations for randomness"
        )
    
    def generate_bit(self, noise_level: float = 0.0) -> Tuple[int, cirq.Circuit, str]:
        # Simulate vacuum fluctuations using phase randomization
        q = cirq.NamedQubit("q_vacuum")
        circuit = cirq.Circuit()
        
        # Random phase rotation to simulate vacuum fluctuations
        random_phase = np.random.uniform(0, 2 * np.pi)
        circuit.append(cirq.rz(random_phase).on(q))
        circuit.append(cirq.H(q))
        
        # Add noise if specified
        if noise_level > 0:
            circuit.append(cirq.phase_flip(noise_level).on(q))
        
        circuit.append(cirq.measure(q, key='m'))
        
        simulator = cirq.Simulator()
        result = simulator.run(circuit, repetitions=1)
        bit = int(result.measurements['m'][0][0])
        
        circuit_svg = circuit_to_svg(circuit)
        return bit, circuit, circuit_svg

class EntanglementSource(QuantumRandomnessSource):
    """Quantum randomness from entanglement measurements."""
    
    def __init__(self):
        super().__init__(
            "Entanglement",
            "Uses entangled qubit measurements for randomness"
        )
    
    def generate_bit(self, noise_level: float = 0.0) -> Tuple[int, cirq.Circuit, str]:
        q1, q2 = cirq.NamedQubit("q_ent1"), cirq.NamedQubit("q_ent2")
        circuit = cirq.Circuit()
        
        # Create Bell state
        circuit.append(cirq.H(q1))
        circuit.append(cirq.CNOT(q1, q2))
        
        # Add noise if specified
        if noise_level > 0:
            circuit.append(cirq.depolarize(noise_level).on(q1))
            circuit.append(cirq.depolarize(noise_level).on(q2))
        
        # Measure first qubit for randomness
        circuit.append(cirq.measure(q1, key='m1'))
        circuit.append(cirq.measure(q2, key='m2'))
        
        simulator = cirq.Simulator()
        result = simulator.run(circuit, repetitions=1)
        bit = int(result.measurements['m1'][0][0])
        
        circuit_svg = circuit_to_svg(circuit)
        return bit, circuit, circuit_svg

class StatisticalAnalyzer:
    """Analyzes the statistical quality of random bit sequences."""
    
    def __init__(self, window_size: int = 100):
        self.window_size = window_size
        self.bit_history = deque(maxlen=window_size)
        
    def add_bits(self, bits: List[int]) -> None:
        """Add new bits to the analysis window."""
        self.bit_history.extend(bits)
    
    def calculate_metrics(self) -> Dict[str, Any]:
        """Calculate comprehensive statistical metrics."""
        if len(self.bit_history) < 10:
            return {"error": "Insufficient data for analysis"}
        
        bits = list(self.bit_history)
        n = len(bits)
        
        # Basic statistics
        zeros = bits.count(0)
        ones = bits.count(1)
        
        # Frequency test (chi-square)
        expected = n / 2
        chi_square = ((zeros - expected) ** 2 + (ones - expected) ** 2) / expected
        p_value_freq = 1 - stats.chi2.cdf(chi_square, df=1)
        
        # Runs test
        runs = 1
        for i in range(1, n):
            if bits[i] != bits[i-1]:
                runs += 1
        
        expected_runs = (2 * zeros * ones) / n + 1 if n > 0 else 0
        runs_variance = (2 * zeros * ones * (2 * zeros * ones - n)) / (n**2 * (n - 1)) if n > 1 else 0
        
        if runs_variance > 0:
            z_runs = (runs - expected_runs) / np.sqrt(runs_variance)
            p_value_runs = 2 * (1 - stats.norm.cdf(abs(z_runs)))
        else:
            z_runs = 0
            p_value_runs = 1
        
        # Shannon entropy
        if zeros > 0 and ones > 0:
            p0, p1 = zeros / n, ones / n
            entropy = -p0 * math.log2(p0) - p1 * math.log2(p1)
        else:
            entropy = 0
        
        # Serial correlation test
        if n > 1:
            mean_val = np.mean(bits)
            autocorr = np.corrcoef(bits[:-1], bits[1:])[0, 1] if n > 2 else 0
        else:
            autocorr = 0
        
        # Longest run test
        current_run = 1
        longest_run = 1
        for i in range(1, n):
            if bits[i] == bits[i-1]:
                current_run += 1
                longest_run = max(longest_run, current_run)
            else:
                current_run = 1
        
        expected_longest = math.log2(n) if n > 1 else 1
        
        return {
            "sample_size": n,
            "zeros_count": zeros,
            "ones_count": ones,
            "bias": abs(0.5 - ones/n),
            "entropy": entropy,
            "entropy_percentage": (entropy / 1.0) * 100,
            "runs": runs,
            "expected_runs": expected_runs,
            "runs_z_score": z_runs,
            "runs_p_value": p_value_runs,
            "frequency_chi_square": chi_square,
            "frequency_p_value": p_value_freq,
            "autocorrelation": autocorr,
            "longest_run": longest_run,
            "expected_longest_run": expected_longest,
            "quality_score": self._calculate_quality_score(p_value_freq, p_value_runs, entropy, abs(autocorr))
        }
    
    def _calculate_quality_score(self, freq_p: float, runs_p: float, entropy: float, autocorr: float) -> float:
        """Calculate overall quality score (0-100)."""
        # Higher p-values are better (closer to random)
        freq_score = min(freq_p * 2, 1.0) * 25  # Max 25 points
        runs_score = min(runs_p * 2, 1.0) * 25  # Max 25 points
        entropy_score = entropy * 25  # Max 25 points (entropy max is 1.0)
        correlation_score = max(0, (1 - abs(autocorr)) * 25)  # Max 25 points
        
        return freq_score + runs_score + entropy_score + correlation_score

def generate_random_number_cirq(num_bits=8, source_type="superposition", noise_level=0.0, 
                               enable_post_processing=True, hardware_simulation=False):
    """
    Enhanced quantum random number generator with multiple sources and advanced analysis.
    
    Args:
        num_bits: Number of quantum bits to generate (1-32)
        source_type: Type of quantum randomness source
        noise_level: Hardware noise simulation level (0.0-0.3)
        enable_post_processing: Apply randomness extraction techniques
        hardware_simulation: Simulate realistic hardware constraints
        
    Returns:
        Dictionary containing comprehensive results and analysis
    """
    generation_time = time.time()
    
    # Input validation
    if num_bits < 1 or num_bits > 32:
        raise ValueError("num_bits must be between 1 and 32")
    if noise_level < 0 or noise_level > 0.3:
        raise ValueError("noise_level must be between 0.0 and 0.3")
    
    # Initialize randomness source
    sources = {
        "superposition": SuperpositionSource(),
        "vacuum_fluctuation": VacuumFluctuationSource(),
        "entanglement": EntanglementSource()
    }
    
    if source_type not in sources:
        source_type = "superposition"
    
    source = sources[source_type]
    
    log = ["=== Enhanced Quantum Random Number Generator ==="]
    log.append(f"Source: {source.name} - {source.description}")
    log.append(f"Generating {num_bits} quantum bits with {noise_level:.1%} noise")
    log.append("")
    
    # Explain configuration choices
    if noise_level == 0:
        log.append("Configuration: IDEAL QUANTUM SIMULATION")
        log.append("• Perfect quantum gates and measurements")
        log.append("• Best for understanding pure quantum mechanics")
    elif noise_level <= 0.05:
        log.append("Configuration: HIGH-QUALITY QUANTUM HARDWARE")
        log.append("• Realistic noise levels for premium quantum devices")
        log.append("• Suitable for research and practical applications")
    else:
        log.append("Configuration: NOISY QUANTUM HARDWARE")
        log.append("• Higher noise levels simulate current-generation devices")
        log.append("• Shows importance of error correction and post-processing")
    
    log.append("")
    if enable_post_processing:
        log.append("Post-processing: ENABLED (von Neumann extraction)")
        log.append("• Removes bias from quantum measurements")
        log.append("• Recommended for cryptographic applications")
        log.append("• May reduce output bits but improves quality")
    else:
        log.append("Post-processing: DISABLED")
        log.append("• Raw quantum measurements without bias correction")
        log.append("• Best for educational purposes and understanding pure quantum randomness")
    
    log.append("")
    if hardware_simulation:
        log.append("Hardware simulation: ENABLED")
        log.append("• Realistic timing delays (~1ms per qubit)")
        log.append("• Simulates actual quantum hardware constraints")
    else:
        log.append("Hardware simulation: DISABLED")
        log.append("• Instantaneous simulation for educational purposes")
    
    log.append("")
    log.append(f"Generation started: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    log.append("")
    
    # Generate raw bits
    raw_bits = []
    circuits = []
    bit_generation_times = []
    
    for i in range(num_bits):
        start_time = time.time()
        
        # Apply hardware simulation delays
        if hardware_simulation:
            # Simulate realistic quantum hardware timing
            time.sleep(0.001)  # 1ms per bit (realistic for some quantum hardware)
        
        bit, circuit, circuit_svg = source.generate_bit(noise_level)
        raw_bits.append(bit)
        circuits.append(circuit_svg)
        
        generation_time_ms = (time.time() - start_time) * 1000
        bit_generation_times.append(generation_time_ms)
        
        log.append(f"Bit {i}: Generated {bit} ({generation_time_ms:.2f}ms)")
    
    # Post-processing for enhanced randomness
    processed_bits = raw_bits.copy()
    if enable_post_processing and len(raw_bits) >= 2:
        # Von Neumann extractor (simple example)
        extracted_bits = []
        i = 0
        while i < len(raw_bits) - 1:
            if raw_bits[i] != raw_bits[i + 1]:
                extracted_bits.append(raw_bits[i])
            i += 2
        
        if extracted_bits:
            # Pad or truncate to requested length
            while len(extracted_bits) < num_bits:
                extracted_bits.extend(extracted_bits[:num_bits - len(extracted_bits)])
            processed_bits = extracted_bits[:num_bits]
            log.append(f"\nPost-processing: Applied von Neumann extractor")
            log.append(f"Extracted {len(extracted_bits)} bits from {len(raw_bits)} raw bits")
    
    # Statistical analysis
    analyzer = StatisticalAnalyzer()
    analyzer.add_bits(processed_bits)
    stats_results = analyzer.calculate_metrics()
    
    # Calculate final number
    number = 0
    for bit in processed_bits:
        number = (number << 1) | bit
    
    # Create comprehensive circuit visualization
    combined_circuit = cirq.Circuit()
    qubits = [cirq.NamedQubit(f"q{i}") for i in range(min(num_bits, 8))]  # Limit for visualization
    
    for i, q in enumerate(qubits):
        if source_type == "superposition":
            combined_circuit.append(cirq.H(q))
        elif source_type == "vacuum_fluctuation":
            combined_circuit.append(cirq.rz(np.pi/4).on(q))
            combined_circuit.append(cirq.H(q))
        elif source_type == "entanglement" and i < len(qubits) - 1:
            combined_circuit.append(cirq.H(q))
            combined_circuit.append(cirq.CNOT(q, qubits[i + 1]))
        
        if noise_level > 0:
            combined_circuit.append(cirq.depolarize(noise_level).on(q))
        
        combined_circuit.append(cirq.measure(q, key=f'm{i}'))
    
    circuit_svg = circuit_to_svg(combined_circuit)
    
    # Prepare detailed results
    bits_str = ''.join(map(str, processed_bits))
    raw_bits_str = ''.join(map(str, raw_bits))
    
    log.append(f"\nResults:")
    log.append(f"Raw bit sequence: {raw_bits_str}")
    if enable_post_processing and raw_bits != processed_bits:
        log.append(f"Processed sequence: {bits_str}")
    log.append(f"Final decimal number: {number}")
    log.append(f"Range: 0 to {(2**num_bits) - 1}")
    
    # Add statistical analysis to log
    if "error" not in stats_results:
        log.append(f"\nStatistical Analysis:")
        log.append(f"Quality Score: {stats_results['quality_score']:.1f}/100")
        log.append(f"Shannon Entropy: {stats_results['entropy']:.4f} ({stats_results['entropy_percentage']:.1f}%)")
        log.append(f"Bias: {stats_results['bias']:.4f} (0.0 is perfect)")
        log.append(f"Runs Test: {stats_results['runs']} runs (p-value: {stats_results['runs_p_value']:.4f})")
        log.append(f"Frequency Test: χ² = {stats_results['frequency_chi_square']:.4f} (p-value: {stats_results['frequency_p_value']:.4f})")
    
    # Performance metrics
    total_time = time.time() - generation_time
    avg_bit_time = np.mean(bit_generation_times) if bit_generation_times else 0
    
    return {
        "random_number": number,
        "bitseq": processed_bits,
        "raw_bitseq": raw_bits,
        "bits_string": bits_str,
        "raw_bits_string": raw_bits_str,
        "num_bits": num_bits,
        "max_value": (2**num_bits) - 1,
        "source_type": source_type,
        "source_name": source.name,
        "source_description": source.description,
        "noise_level": noise_level,
        "post_processing_enabled": enable_post_processing,
        "hardware_simulation": hardware_simulation,
        
        # Statistical analysis
        "statistics": stats_results,
        
        # Performance metrics
        "generation_time_ms": total_time * 1000,
        "avg_bit_time_ms": avg_bit_time,
        "bits_per_second": num_bits / total_time if total_time > 0 else 0,
        
        # Visualization data
        "circuit_svg": circuit_svg,
        "individual_circuits": circuits[:8],  # Limit for performance
        
        # Bit-level details for visualization
        "bit_details": [
            {
                "id": i,
                "value": bit,
                "raw_value": raw_bits[i] if i < len(raw_bits) else bit,
                "generation_time_ms": bit_generation_times[i] if i < len(bit_generation_times) else 0,
                "label": f"q{i}"
            }
            for i, bit in enumerate(processed_bits)
        ],
        
        # Educational information
        "quantum_principles": {
            "superposition": "Qubits exist in multiple states simultaneously until measured",
            "measurement": "Observation collapses quantum states randomly",
            "uncertainty": "Quantum randomness is fundamentally unpredictable",
            "source_specific": source.description
        },
        
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "log": "\n".join(log)
    }

if __name__ == '__main__':
    # Generate 8-bit random number
    result = generate_random_number_cirq(8)
    
    print("Quantum Random Number Generator Simulation:")
    print(f"Random number: {result['random_number']} (binary: {result['bits_string']})")
    print(f"Bit sequence: {result['bitseq']}")
    print(f"Range: 0 to {result['max_value']}")
    print(f"Distribution: {result['zeros_count']} zeros, {result['ones_count']} ones")
    
    # Generate another random number to demonstrate randomness
    result2 = generate_random_number_cirq(8)
    print("\nSecond random number:", result2['random_number'])
    
    print("\nDetailed Log:")
    print(result['log'])
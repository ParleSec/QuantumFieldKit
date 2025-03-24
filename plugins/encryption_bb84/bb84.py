"""
High-Fidelity BB84 Protocol Simulation using Google Cirq with Realistic Quantum Effects.

This module builds a comprehensive BB84 quantum key distribution simulation that accounts for:
- Realistic photon loss based on distance in fiber optics
- Hardware-specific quantum noise models
- Eavesdropper detection and information leakage analysis
- Information reconciliation and privacy amplification
- Realistic security parameter estimation
"""
import cirq
import random
import numpy as np
import math
from cirq.contrib.svg import circuit_to_svg

# Physical constants
SPEED_OF_LIGHT = 299792458  # m/s
FIBER_LOSS_DB_PER_KM = 0.2  # Standard telecom fiber loss
DETECTOR_EFFICIENCY = 0.85  # Typical superconducting detector efficiency

def create_hardware_noise_model(hardware_type='fiber', distance_km=0, detector_dark_count=1e-6):
    """
    Creates a realistic hardware-specific noise model.
    
    Args:
        hardware_type: Type of quantum hardware ('fiber', 'satellite', 'trapped_ion')
        distance_km: Distance between Alice and Bob in kilometers
        detector_dark_count: Dark count probability per detection window
        
    Returns:
        Dictionary with noise parameters
    """
    models = {
        'fiber': {
            'photon_loss': 1 - 10**(-FIBER_LOSS_DB_PER_KM * distance_km / 10),
            'polarization_drift': min(0.01 * distance_km, 0.1),  # Polarization drift in fiber
            'phase_drift': min(0.005 * distance_km, 0.1),  # Phase drift
            'detector_efficiency': DETECTOR_EFFICIENCY,
            'dark_count_probability': detector_dark_count,
            'timing_jitter': 50e-12 * (1 + 0.01 * distance_km),  # Timing jitter in seconds
            'coherence_time': 1e-9  # 1 nanosecond coherence time in fiber
        },
        'satellite': {
            'photon_loss': 1 - 10**(-0.07 * distance_km / 10),  # Lower atmospheric loss
            'polarization_drift': 0.001 * distance_km,
            'phase_drift': 0.002 * distance_km,
            'detector_efficiency': 0.7,  # Lower efficiency in space-based detectors
            'dark_count_probability': 1e-7,  # Lower dark counts in space
            'timing_jitter': 100e-12,
            'coherence_time': 5e-9  # Longer coherence in free space
        },
        'trapped_ion': {
            'photon_loss': 0.1,  # Minimal loss in controlled environment
            'polarization_drift': 0.001,
            'phase_drift': 0.001,
            'detector_efficiency': 0.95,  # High efficiency
            'dark_count_probability': 1e-8,
            'timing_jitter': 10e-12,
            'coherence_time': 1e-6  # Much longer coherence in trapped ion systems
        }
    }
    
    return models.get(hardware_type, models['fiber'])

def add_realistic_noise(circuit, noise_model, qubit):
    """Add realistic hardware-specific noise to the circuit."""
    noisy_circuit = cirq.Circuit()
    
    # Add original operations
    for op in circuit.all_operations():
        noisy_circuit.append(op)
        
        # Add depolarizing channel to model general noise
        depolarizing_prob = min(0.01, noise_model['phase_drift'] + noise_model['polarization_drift'])
        noisy_circuit.append(cirq.depolarize(depolarizing_prob).on(qubit))
        
        # Add amplitude damping to model photon loss during computation
        if noise_model['photon_loss'] > 0:
            amp_damp_prob = min(0.1, noise_model['photon_loss'] / 10)  # Scale down for gate operations
            noisy_circuit.append(cirq.amplitude_damp(amp_damp_prob).on(qubit))
        
        # Add phase damping to model decoherence
        coherence_error = min(0.05, 1e-9 / noise_model['coherence_time'])
        noisy_circuit.append(cirq.phase_damp(coherence_error).on(qubit))
    
    return noisy_circuit

def simulate_eavesdropping(alice_bits, alice_bases, eve_strategy, detection_probability=0.5):
    """
    Simulate an eavesdropper with various attack strategies.
    
    Args:
        alice_bits: Alice's original random bits
        alice_bases: Alice's chosen bases
        eve_strategy: Strategy ('intercept_resend', 'beam_splitting', 'trojan_horse')
        detection_probability: Probability of Eve being detected per intercepted bit
        
    Returns:
        Dictionary with eavesdropping results and analysis
    """
    eve_bases = [random.choice(['Z', 'X']) for _ in range(len(alice_bits))]
    eve_measurements = []
    modified_states = []
    detection_events = []
    information_gain = 0
    
    for i in range(len(alice_bits)):
        if eve_strategy == 'intercept_resend':
            # Eve measures in her random basis
            if eve_bases[i] == alice_bases[i]:
                # If Eve uses same basis as Alice, she gets correct result
                eve_measurement = alice_bits[i]
                detection = False  # Eve won't be detected here
            else:
                # If Eve uses wrong basis, she gets random result
                eve_measurement = random.randint(0, 1)
                detection = random.random() < detection_probability  # Eve might be detected
            
            # Eve resends based on her measurement and basis
            if eve_bases[i] == alice_bases[i]:
                # If Eve measured in correct basis, state is unchanged
                modified_state = alice_bits[i]
            else:
                # If Eve measured in wrong basis, state is randomized
                modified_state = random.randint(0, 1)
                
        elif eve_strategy == 'beam_splitting':
            # Eve captures a portion of photons in a beam splitting attack
            # She only gets information when measuring in correct basis
            if eve_bases[i] == alice_bases[i]:
                eve_measurement = alice_bits[i]
                information_gain += 1
            else:
                eve_measurement = random.randint(0, 1)
            
            # Original state is preserved, harder to detect
            modified_state = alice_bits[i]
            detection = random.random() < (detection_probability / 3)  # Much harder to detect
            
        elif eve_strategy == 'trojan_horse':
            # Eve sends additional photons to probe the system
            eve_measurement = alice_bits[i]  # Gets perfect information
            modified_state = alice_bits[i]  # State is preserved
            detection = random.random() < (detection_probability * 2)  # Easier to detect
            information_gain += 1
            
        else:  # No eavesdropping or unknown strategy
            eve_measurement = None
            modified_state = alice_bits[i]
            detection = False
        
        eve_measurements.append(eve_measurement)
        modified_states.append(modified_state)
        detection_events.append(detection)
    
    # Calculate information leakage
    if eve_strategy != 'none':
        information_leak_ratio = information_gain / len(alice_bits)
    else:
        information_leak_ratio = 0
        
    # Calculate detection probability
    if any(detection_events):
        eve_detected = True
        detection_probability = sum(detection_events) / len(detection_events)
    else:
        eve_detected = False
        detection_probability = 0
    
    return {
        'eve_bases': eve_bases,
        'eve_measurements': eve_measurements,
        'modified_states': modified_states,
        'eve_detected': eve_detected,
        'detection_probability': detection_probability,
        'information_leak_ratio': information_leak_ratio
    }

def information_reconciliation(alice_key, bob_key, error_rate, reconciliation_efficiency=0.8):
    """
    Simulate information reconciliation to correct errors in the sifted key.
    
    Args:
        alice_key: Alice's sifted key bits
        bob_key: Bob's sifted key bits
        error_rate: Estimated quantum bit error rate
        reconciliation_efficiency: Efficiency of the reconciliation protocol
        
    Returns:
        Dictionary with reconciliation results
    """
    if not alice_key or not bob_key:
        return {'success': False, 'corrected_bits': 0, 'bits_used': 0, 'remaining_error_rate': 0, 'final_key': []}
    
    # Calculate theoretical bits needed for correction
    if error_rate <= 0:
        return {'success': True, 'corrected_bits': 0, 'bits_used': 0, 'remaining_error_rate': 0, 'final_key': alice_key}
    
    # Shannon entropy for binary symmetric channel
    h_binary = -error_rate * math.log2(error_rate) - (1-error_rate) * math.log2(1-error_rate) if 0 < error_rate < 1 else 0
    bits_needed = len(alice_key) * h_binary / reconciliation_efficiency
    
    # Simulate error correction
    errors_identified = 0
    corrected_key = bob_key.copy()
    
    # Error correction simulation (simplified CASCADE protocol)
    block_size = max(1, int(1 / error_rate))
    
    for block_start in range(0, len(alice_key), block_size):
        block_end = min(block_start + block_size, len(alice_key))
        alice_block = alice_key[block_start:block_end]
        bob_block = corrected_key[block_start:block_end]
        
        # Check parity
        alice_parity = sum(alice_block) % 2
        bob_parity = sum(bob_block) % 2
        
        # If parity differs, find and fix an error
        if alice_parity != bob_parity:
            # Binary search for error (simplified)
            if len(bob_block) > 1:
                mid = len(bob_block) // 2
                if sum(alice_block[:mid]) % 2 != sum(bob_block[:mid]) % 2:
                    # Error is in first half
                    for i in range(mid):
                        if bob_block[i] != alice_block[i]:
                            corrected_key[block_start + i] = alice_block[i]
                            errors_identified += 1
                            break
                else:
                    # Error is in second half
                    for i in range(mid, len(bob_block)):
                        if bob_block[i] != alice_block[i]:
                            corrected_key[block_start + i] = alice_block[i]
                            errors_identified += 1
                            break
            else:
                # Single bit block with error
                corrected_key[block_start] = alice_block[0]
                errors_identified += 1
    
    # Calculate remaining error rate
    remaining_errors = sum(1 for a, b in zip(alice_key, corrected_key) if a != b)
    remaining_error_rate = remaining_errors / len(alice_key) if alice_key else 0
    
    return {
        'success': remaining_error_rate < error_rate / 10,
        'corrected_bits': errors_identified,
        'bits_used': min(len(alice_key), int(bits_needed)),
        'remaining_error_rate': remaining_error_rate,
        'final_key': corrected_key
    }

def privacy_amplification(reconciled_key, leaked_bits, security_parameter=0.1):
    """
    Perform privacy amplification to reduce potential knowledge by eavesdropper.
    
    Args:
        reconciled_key: Key after information reconciliation
        leaked_bits: Estimated bits of information leaked to Eve
        security_parameter: Extra security margin (0-1)
        
    Returns:
        Final secure key after privacy amplification
    """
    if not reconciled_key:
        return []
    
    # Calculate final key length after privacy amplification
    final_length = max(1, len(reconciled_key) - int(leaked_bits) - int(security_parameter * len(reconciled_key)))
    
    if final_length <= 0:
        return []
    
    # Apply universal hash function (simplified as XOR with random bit masks)
    secure_key = []
    for i in range(final_length):
        # Create random bit mask (Toeplitz matrix row)
        mask = [random.randint(0, 1) for _ in range(len(reconciled_key))]
        
        # XOR the key with mask
        secure_bit = sum(k * m for k, m in zip(reconciled_key, mask)) % 2
        secure_key.append(secure_bit)
    
    return secure_key

def calculate_theoretical_key_rate(distance_km, hardware_type='fiber', eavesdropping=False):
    """
    Calculate theoretical key rate based on distance and hardware parameters.
    
    Args:
        distance_km: Distance between Alice and Bob
        hardware_type: Type of quantum hardware
        eavesdropping: Whether eavesdropping is present
        
    Returns:
        Estimated key rate in bits/second
    """
    # Get hardware parameters
    noise_model = create_hardware_noise_model(hardware_type, distance_km)
    
    # Calculate photon transmission probability
    transmission_prob = (1 - noise_model['photon_loss']) * noise_model['detector_efficiency']
    
    # Calculate QBER from noise parameters
    qber = min(0.5, noise_model['polarization_drift'] + noise_model['phase_drift'] + 
              noise_model['dark_count_probability'] / max(1e-15, transmission_prob))
    
    if eavesdropping:
        qber = min(0.5, qber + 0.15)  # Increased QBER due to eavesdropping
    
    # Source rate (typical for QKD systems)
    source_rate = 1e9  # 1 GHz photon generation rate
    
    # Calculate raw key rate
    raw_rate = source_rate * transmission_prob
    
    # Calculate sifted key rate (50% of raw due to basis mismatch)
    sifted_rate = raw_rate * 0.5
    
    # Error correction efficiency factor
    ec_efficiency = 1.2  # Typical CASCADE efficiency
    
    # Calculate final key rate using GLLP formula (simplified)
    if qber >= 0.11:  # Above threshold for secure BB84
        return 0
    
    # Asymptotic key rate formula
    h_binary = lambda x: 0 if x <= 0 or x >= 1 else -x*math.log2(x)-(1-x)*math.log2(1-x)
    final_rate = sifted_rate * (1 - h_binary(qber) - ec_efficiency * h_binary(qber))
    
    # Apply practical limitations
    final_rate = max(0, final_rate)  # Can't be negative
    
    return final_rate

def bb84_protocol_cirq(num_bits=10, distance_km=0, hardware_type='fiber', 
                       eve_present=False, eve_strategy='intercept_resend',
                       detector_dark_count=1e-6, detailed_simulation=True,
                       perform_reconciliation=True, perform_amplification=True,
                       noise_prob=0.0):
    """
    Simulates the BB84 quantum key distribution protocol with realistic physical effects.
    
    Args:
        num_bits: Number of qubits to transmit
        distance_km: Distance between Alice and Bob in kilometers
        hardware_type: Type of quantum hardware ('fiber', 'satellite', 'trapped_ion')
        eve_present: Whether an eavesdropper is present
        eve_strategy: Eve's attack strategy if present
        detector_dark_count: Dark count probability per detection window
        detailed_simulation: Whether to run full quantum circuit simulation for each qubit
        perform_reconciliation: Whether to perform information reconciliation
        perform_amplification: Whether to perform privacy amplification
        
    Returns:
        Dictionary with BB84 protocol results and analysis
    """
    log = []
    log.append("=== BB84 Protocol Simulation with Realistic Quantum Effects ===")
    
    # Create noise model based on hardware parameters
    noise_model = create_hardware_noise_model(hardware_type, distance_km, detector_dark_count)
    log.append(f"Hardware configuration: {hardware_type} over {distance_km} km")
    log.append(f"Noise model parameters: {noise_model}")
    
    # Calculate theoretical key rate
    theoretical_key_rate = calculate_theoretical_key_rate(distance_km, hardware_type, eve_present)
    log.append(f"Theoretical key rate: {theoretical_key_rate:.2f} bits/second")
    
    # Alice generates random bits and basis choices
    alice_bits = [random.randint(0, 1) for _ in range(num_bits)]
    alice_bases = [random.choice(['Z', 'X']) for _ in range(num_bits)]
    log.append(f"Alice generated {num_bits} random bits and basis choices")
    
    # Bob generates random basis choices
    bob_bases = [random.choice(['Z', 'X']) for _ in range(num_bits)]
    log.append(f"Bob generated {num_bits} random basis choices")
    
    # Quantum transmission simulation
    transmitted_states = []
    bob_received_states = []
    bob_measurements = []
    
    # Create a sample circuit visualization using only the first qubit
    # This ensures we always have a valid circuit for SVG generation
    sample_circuit = cirq.Circuit()
    sample_q = cirq.NamedQubit('q0')
    
    # Add representative operations to sample circuit
    sample_circuit.append(cirq.H(sample_q))
    sample_circuit.append(cirq.measure(sample_q))
    
    circuit_svg = circuit_to_svg(sample_circuit)
    
    # Process each bit for quantum transmission
    for i in range(num_bits):
        log.append(f"\n-- Bit {i} --")
        q = cirq.NamedQubit(f'q{i}')
        circuit = cirq.Circuit()
        
        # State preparation by Alice
        if alice_bits[i] == 1:
            circuit.append(cirq.X(q))
            log.append(f"Alice prepares |1⟩ state for bit {i}")
        else:
            log.append(f"Alice prepares |0⟩ state for bit {i}")
            
        # Basis selection by Alice
        if alice_bases[i] == 'X':
            circuit.append(cirq.H(q))
            log.append(f"Alice uses X basis (Hadamard applied)")
        else:
            log.append(f"Alice uses Z basis (computational basis)")
        
        # Simulate photon loss based on distance
        photon_lost = random.random() < noise_model['photon_loss']
        if photon_lost:
            log.append(f"Photon lost in transmission (probability: {noise_model['photon_loss']:.4f})")
            bob_received_states.append(None)
            bob_measurements.append(None)
            continue
        
        # Eve's interaction if present
        if eve_present:
            if i == 0:  # Log once for clarity
                log.append(f"Eve is present using '{eve_strategy}' strategy")
                
            # Create Eve's circuit for interception (detailed simulation only for first few bits)
            if i < 5 and detailed_simulation:
                eve_q = cirq.NamedQubit(f'eve_q{i}')
                eve_circuit = cirq.Circuit()
                
                # Eve measures in her chosen basis
                if eve_strategy == 'intercept_resend':
                    eve_basis = random.choice(['Z', 'X'])
                    if eve_basis == 'X':
                        eve_circuit.append(cirq.H(eve_q))
                    eve_circuit.append(cirq.measure(eve_q, key='eve_meas'))
                    
                    # Prepare state to send to Bob based on Eve's measurement
                    eve_result = random.randint(0, 1)  # Simplified for non-executed circuit
                    if eve_result == 1:
                        circuit.append(cirq.X(q))
                    if eve_basis == 'X':
                        circuit.append(cirq.H(q))
                        
                log.append(f"Eve intercepted bit {i} using {eve_strategy}")
        
        # Add realistic hardware noise
        if detailed_simulation:
            circuit = add_realistic_noise(circuit, noise_model, q)
            
        # Bob's basis selection and measurement
        if bob_bases[i] == 'X':
            circuit.append(cirq.H(q))
            log.append(f"Bob uses X basis (Hadamard applied)")
        else:
            log.append(f"Bob uses Z basis (computational basis)")
            
        # Detector dark count simulation
        dark_count_occurred = random.random() < noise_model['dark_count_probability']
        if dark_count_occurred:
            bob_measurement = random.randint(0, 1)
            log.append(f"Detector dark count occurred, random measurement: {bob_measurement}")
        else:
            # Measurement simulation
            if detailed_simulation:
                circuit.append(cirq.measure(q, key='meas'))
                simulator = cirq.Simulator()
                result = simulator.run(circuit, repetitions=1)
                bob_measurement = int(result.measurements['meas'][0][0])
            else:
                # Simplified measurement model without full circuit simulation
                correct_basis = alice_bases[i] == bob_bases[i]
                
                if correct_basis:
                    # With probability (1-error_rate), Bob gets correct result
                    error_prob = noise_model['polarization_drift'] + noise_model['phase_drift']
                    if random.random() < error_prob:
                        bob_measurement = 1 - alice_bits[i]  # Error in measurement
                    else:
                        bob_measurement = alice_bits[i]      # Correct measurement
                else:
                    # Different bases, random outcome
                    bob_measurement = random.randint(0, 1)
                    
            log.append(f"Bob's measurement: {bob_measurement}")
        
        bob_measurements.append(bob_measurement)
        bob_received_states.append(True)  # Successfully received
            
    # Sift key - keep only bits where both used same basis and photon wasn't lost
    matching_bases = [i for i in range(num_bits) if 
                     bob_received_states[i] is not None and
                     alice_bases[i] == bob_bases[i]]
    
    shared_key = [alice_bits[i] for i in matching_bases]
    bob_key = [bob_measurements[i] for i in matching_bases]
    
    # Calculate QBER (Quantum Bit Error Rate)
    errors = sum(a != b for a, b in zip(shared_key, bob_key))
    qber = errors / len(shared_key) if shared_key else 0
    
    log.append(f"\nMatching bases indices: {matching_bases}")
    log.append(f"Raw key length: {num_bits}")
    log.append(f"Sifted key length: {len(shared_key)}")
    log.append(f"Transmission efficiency: {len(bob_received_states) - bob_received_states.count(None)}/{num_bits}")
    log.append(f"Sifted key efficiency: {len(shared_key)}/{num_bits}")
    log.append(f"Alice's sifted key: {shared_key}")
    log.append(f"Bob's measured key: {bob_key}")
    log.append(f"QBER: {qber:.4f}")
    
    # Eavesdropper detection using QBER
    qber_threshold = 0.11  # Theoretical threshold for BB84
    eve_detected_by_qber = qber > qber_threshold
    
    if eve_detected_by_qber:
        log.append(f"WARNING: QBER ({qber:.4f}) exceeds threshold ({qber_threshold}), possible eavesdropper detected!")
    else:
        log.append(f"QBER within acceptable limits, no evidence of eavesdropping")
    
    # Eavesdropping simulation results
    eve_results = None
    if eve_present:
        eve_results = simulate_eavesdropping(alice_bits, alice_bases, eve_strategy)
        log.append(f"\nEavesdropping simulation:")
        log.append(f"Eve detected: {eve_results['eve_detected']}")
        log.append(f"Information leak ratio: {eve_results['information_leak_ratio']:.4f}")
    
    # Information reconciliation
    reconciliation_results = None
    if shared_key and perform_reconciliation:
        reconciliation_results = information_reconciliation(shared_key, bob_key, qber)
        log.append(f"\nInformation reconciliation:")
        log.append(f"Errors corrected: {reconciliation_results['corrected_bits']}")
        log.append(f"Bits used for correction: {reconciliation_results['bits_used']}")
        log.append(f"Remaining error rate: {reconciliation_results['remaining_error_rate']:.6f}")
        log.append(f"Reconciliation success: {reconciliation_results['success']}")
        
        bob_key = reconciliation_results['final_key']
    
    # Privacy amplification
    final_key = None
    if shared_key and bob_key and perform_amplification:
        # Estimate information leakage
        leaked_bits = 0
        if eve_present and eve_results:
            leaked_bits = int(eve_results['information_leak_ratio'] * len(shared_key))
        elif qber > 0:
            # Conservative estimate based on QBER
            leaked_bits = int(qber * len(shared_key) * 2)
            
        final_key = privacy_amplification(bob_key, leaked_bits)
        
        log.append(f"\nPrivacy amplification:")
        log.append(f"Estimated information leakage: {leaked_bits} bits")
        log.append(f"Final secure key length: {len(final_key)}")
        log.append(f"Final key rate: {len(final_key)/(num_bits)} bits per transmitted qubit")
    
    # Calculate theoretical secure key rate for this setup
    secure_key_rate = calculate_theoretical_key_rate(distance_km, hardware_type, eve_present)
    log.append(f"\nTheoretical secure key rate: {secure_key_rate:.2f} bits/second")
    
    # Return comprehensive results
    return {
        'alice_bits': alice_bits,
        'alice_bases': alice_bases,
        'bob_bases': bob_bases,
        'bob_measurements': bob_measurements,
        'matching_bases': matching_bases,
        'shared_key': shared_key,
        'bob_key': bob_key,
        'final_key': final_key,
        'error_rate': qber,
        'eve_detected_by_qber': eve_detected_by_qber,
        'photon_loss_rate': noise_model['photon_loss'],
        'transmission_efficiency': (len(bob_received_states) - bob_received_states.count(None))/num_bits,
        'sifted_key_ratio': len(shared_key)/num_bits if num_bits > 0 else 0,
        'final_key_ratio': len(final_key)/num_bits if final_key and num_bits > 0 else 0,
        'secure_key_rate': secure_key_rate,
        'noise_model': noise_model,
        'eavesdropper_results': eve_results,
        'reconciliation_results': reconciliation_results,
        'circuit_svg': circuit_svg,
        'log': "\n".join(log)
    }

if __name__ == '__main__':
    # Basic simulation
    result = bb84_protocol_cirq(10, distance_km=0)
    print("Cirq BB84 Simulation Result:")
    print("Shared key:", result['shared_key'])
    print("Error rate:", f"{result['error_rate']:.2%}")
    
    # Run realistic range test
    distances = [0, 10, 50, 100, 200]
    print("\nDistance Test:")
    for dist in distances:
        dist_result = bb84_protocol_cirq(100, distance_km=dist, detailed_simulation=False)
        print(f"{dist} km: Key rate = {dist_result['secure_key_rate']:.2f} bits/s, "
              f"QBER = {dist_result['error_rate']:.4f}")
    
    # Eavesdropper test
    eve_result = bb84_protocol_cirq(100, distance_km=50, eve_present=True, 
                                    eve_strategy='intercept_resend')
    print("\nWith Eavesdropper:")
    print(f"QBER = {eve_result['error_rate']:.4f}")
    print(f"Eve detected: {eve_result['eve_detected_by_qber']}")
    print(f"Final key length: {len(eve_result['final_key']) if eve_result['final_key'] else 0}")
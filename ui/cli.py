import argparse
import math
import sys
import os
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

from plugins.encryption_bb84.bb84 import bb84_protocol_cirq
from plugins.handshake.handshake import handshake_cirq
from plugins.teleportation.teleport import teleportation_circuit
from plugins.network.network import entanglement_swapping_cirq
from plugins.qrng.qrng import generate_random_number_cirq
from plugins.authentication.auth import generate_quantum_fingerprint_cirq, verify_fingerprint_cirq



def run_bb84(args):
    result = bb84_protocol_cirq(args.num_bits, noise_prob=args.noise)
    print("\nBB84 Protocol Simulation Results:")
    print("---------------------------------")
    print(f"Shared key: {result['shared_key']}")
    print("\nDetailed Log:")
    print(result['log'])

def run_handshake(args):
    result = handshake_cirq(noise_prob=args.noise)
    print("\nQuantum Handshake Simulation Results:")
    print("------------------------------------")
    print(f"Alice's measurement: {result['alice_result']}")
    print(f"Bob's measurement: {result['bob_result']}")
    print(f"Handshake success: {result['handshake_success']}")
    print("\nDetailed Log:")
    print(result['log'])

def run_teleport(args):
    state, measurements, circuit, log = teleportation_circuit(noise_prob=args.noise)
    print("\nQuantum Teleportation Simulation Results:")
    print("----------------------------------------")
    print(f"Final state: {state}")
    print(f"Bell measurements: {measurements}")
    print("\nCircuit:")
    print(circuit)
    print("\nDetailed Log:")
    print(log)

def run_network(args):
    result = entanglement_swapping_cirq(noise_prob=args.noise)
    print("\nQuantum Network Simulation Results:")
    print("---------------------------------")
    print(f"Intermediate measurements: {result['intermediate_measurements']}")
    print(f"Node A measurement: {result['node_A_measurement']}")
    print(f"Node C measurement: {result['node_C_measurement']}")
    print("\nDetailed Log:")
    print(result['log'])

def run_qrng(args):
    number, bits, log = generate_random_number_cirq(args.num_bits)
    print("\nQuantum Random Number Generator Results:")
    print("--------------------------------------")
    print(f"Generated number: {number}")
    print(f"Bit sequence: {bits}")
    print("\nDetailed Log:")
    print(log)

def run_auth(args):
    print("\nQuantum Authentication Simulation:")
    print("--------------------------------")
    print(f"Generating fingerprint for: {args.data}")
    fingerprint, log = generate_quantum_fingerprint_cirq(args.data, num_qubits=8)
    valid = verify_fingerprint_cirq(args.data, fingerprint, num_qubits=8)
    print(f"\nFingerprint: {fingerprint}")
    print(f"Verification result: {valid}")
    print("\nDetailed Log:")
    print(log)

def main():
    parser = argparse.ArgumentParser(
        description="Quantum Field Kit - A quantum protocol simulation toolkit",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    
    # Global optional arguments
    parser.add_argument('--noise', type=float, default=0.0,
                       help='Noise probability for quantum operations (default: 0.0)')

    subparsers = parser.add_subparsers(dest='command', help='Available commands')

    # BB84 command
    bb84_parser = subparsers.add_parser('bb84', help='Run BB84 quantum key distribution protocol')
    bb84_parser.add_argument('--num-bits', type=int, default=10,
                            help='Number of bits to use in the protocol (default: 10)')

    # Handshake command
    subparsers.add_parser('handshake', help='Run quantum handshake protocol')

    # Teleport command
    subparsers.add_parser('teleport', help='Run quantum teleportation protocol')

    # Network command
    subparsers.add_parser('network', help='Run quantum network simulation with entanglement swapping')

    # QRNG command
    qrng_parser = subparsers.add_parser('qrng', help='Run quantum random number generator')
    qrng_parser.add_argument('--num-bits', type=int, default=8,
                            help='Number of random bits to generate (default: 8)')

    # Authentication command
    auth_parser = subparsers.add_parser('auth', help='Run quantum authentication protocol')
    auth_parser.add_argument('--data', type=str, default='example_user',
                            help='Data to authenticate (default: example_user)')

    args = parser.parse_args()

    if args.command is None:
        parser.print_help()
        return

    # Command dispatch
    commands = {
        'bb84': run_bb84,
        'handshake': run_handshake,
        'teleport': run_teleport,
        'network': run_network,
        'qrng': run_qrng,
        'auth': run_auth
    }

    if args.command in commands:
        try:
            commands[args.command](args)
        except Exception as e:
            print(f"Error running {args.command}: {str(e)}")
            sys.exit(1)
    else:
        parser.print_help()

if __name__ == '__main__':
    main()
# ui/cli.py
import argparse
import math
from plugins.encryption_bb84.bb84 import run_bb84_protocol
from plugins.handshake.handshake import perform_handshake
from plugins.teleportation.teleport import teleport
from plugins.network.network import entanglement_swapping
from plugins.qrng.qrng import generate_random_number
from plugins.authentication.auth import generate_quantum_fingerprint, verify_fingerprint
from core.qubit import Qubit

def run_bb84(num_bits):
    result = run_bb84_protocol(num_bits)
    print("BB84 Protocol Simulation:")
    print("Alice bits:      ", result['alice_bits'])
    print("Alice bases:     ", result['alice_bases'])
    print("Bob bases:       ", result['bob_bases'])
    print("Bob measurements:", result['bob_measurements'])
    print("Shared key:      ", result['shared_key'])

def run_handshake():
    result = perform_handshake()
    print("Quantum Handshake Simulation:")
    print("Alice measurement:", result['alice_result'])
    print("Bob measurement:  ", result['bob_result'])
    print("Handshake success:", result['handshake_success'])

def run_teleportation():
    # For demonstration, we use a known state.
    q_unknown = Qubit([math.sqrt(3)/2, 1/2])
    result = teleport(q_unknown)
    print("Quantum Teleportation Simulation:")
    print("Classical bits sent:        ", result['classical_bits'])
    print("Bob's qubit state after teleportation:", result['bob_state'])

def run_network():
    result = entanglement_swapping()
    print("Quantum Communication Network Simulation (Entanglement Swapping):")
    print("Classical bits from swapping:", result['classical_bits'])
    print("Node A state:", result['node_A_state'])
    print("Node C state:", result['node_C_state'])

def run_qrng(num_bits):
    number, bits = generate_random_number(num_bits)
    print("Quantum Random Number Generator (QRNG) Simulation:")
    print("Generated random number:", number)
    print("Bit sequence:", bits)

def run_authentication(data):
    fingerprint = generate_quantum_fingerprint(data, num_qubits=8)
    print("Quantum Authentication Simulation:")
    print(f"Generated fingerprint for '{data}':", fingerprint)
    valid = verify_fingerprint(data, fingerprint, num_qubits=8)
    print("Fingerprint verification result:", valid)

def main():
    parser = argparse.ArgumentParser(description="Quantum Field Kit CLI")
    subparsers = parser.add_subparsers(dest="command", help="Available commands")
    
    # BB84 command
    parser_bb84 = subparsers.add_parser("bb84", help="Run BB84 protocol simulation")
    parser_bb84.add_argument("--num", type=int, default=10, help="Number of bits to simulate")
    
    # Handshake command
    subparsers.add_parser("handshake", help="Run quantum handshake simulation")
    
    # Teleportation command
    subparsers.add_parser("teleport", help="Run quantum teleportation simulation")
    
    # Network command
    subparsers.add_parser("network", help="Run quantum network (entanglement swapping) simulation")
    
    # QRNG command
    parser_qrng = subparsers.add_parser("qrng", help="Run quantum random number generator simulation")
    parser_qrng.add_argument("--num", type=int, default=8, help="Number of random bits to generate")
    
    # Authentication command
    parser_auth = subparsers.add_parser("auth", help="Run quantum authentication simulation")
    parser_auth.add_argument("--data", type=str, default="example_user", help="Data for fingerprint generation")
    
    args = parser.parse_args()
    
    if args.command == "bb84":
        run_bb84(args.num)
    elif args.command == "handshake":
        run_handshake()
    elif args.command == "teleport":
        run_teleportation()
    elif args.command == "network":
        run_network()
    elif args.command == "qrng":
        run_qrng(args.num)
    elif args.command == "auth":
        run_authentication(args.data)
    else:
        parser.print_help()

if __name__ == '__main__':
    main()

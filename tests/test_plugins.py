# tests/test_plugins.py
import unittest
import math
from plugins.encryption_bb84.bb84 import run_bb84_protocol
from plugins.handshake.handshake import perform_handshake
from plugins.teleportation.teleport import teleport
from plugins.network.network import entanglement_swapping
from plugins.qrng.qrng import generate_random_number
from plugins.authentication.auth import generate_quantum_fingerprint, verify_fingerprint
from core.qubit import Qubit

class TestPlugins(unittest.TestCase):
    def test_bb84(self):
        result = run_bb84_protocol(10)
        # Shared key length should be between 0 and 10.
        self.assertTrue(0 <= len(result['shared_key']) <= 10)

    def test_handshake(self):
        result = perform_handshake()
        self.assertIn(result['alice_result'], [0, 1])
        self.assertIn(result['bob_result'], [0, 1])
        self.assertIn(result['handshake_success'], [True, False])

    def test_teleportation(self):
        q_unknown = Qubit([math.sqrt(3)/2, 1/2])
        result = teleport(q_unknown)
        self.assertEqual(len(result['classical_bits']), 2)
        # Check that Bob's qubit state is a valid basis state.
        self.assertTrue(result['bob_state'] in ([1.0, 0.0], [0.0, 1.0]))
    
    def test_network(self):
        result = entanglement_swapping()
        self.assertTrue(result['node_A_state'] in ([1.0, 0.0], [0.0, 1.0]))
        self.assertTrue(result['node_C_state'] in ([1.0, 0.0], [0.0, 1.0]))

    def test_qrng(self):
        number, bits = generate_random_number(8)
        self.assertEqual(len(bits), 8)

    def test_authentication(self):
        data = "test_user"
        fingerprint = generate_quantum_fingerprint(data, num_qubits=8)
        valid = verify_fingerprint(data, fingerprint, num_qubits=8)
        self.assertTrue(valid)

if __name__ == '__main__':
    unittest.main()

import unittest
import numpy as np
from plugins.encryption_bb84.bb84 import bb84_protocol_cirq
from plugins.handshake.handshake import handshake_cirq
from plugins.teleportation.teleport import teleportation_circuit
from plugins.network.network import entanglement_swapping_cirq
from plugins.qrng.qrng import generate_random_number_cirq
from plugins.authentication.auth import generate_quantum_fingerprint_cirq, verify_fingerprint_cirq
from plugins.grover.grover import run_grover

class TestPlugins(unittest.TestCase):
    def test_bb84(self):
        result = bb84_protocol_cirq(10, noise_prob=0.01)
        self.assertTrue(0 <= len(result['shared_key']) <= 10)

    def test_handshake(self):
        result = handshake_cirq(noise_prob=0.01)
        self.assertIn(result['alice_result'], [0, 1])
        self.assertIn(result['bob_result'], [0, 1])
        self.assertIn(result['handshake_success'], [True, False])

    def test_teleportation(self):
        state, measurements, circuit, log_str = teleportation_circuit(noise_prob=0.01)
        self.assertEqual(len(measurements), 2)
        norm = np.linalg.norm(state)
        self.assertAlmostEqual(norm, 1.0, places=5)

    def test_network(self):
        result = entanglement_swapping_cirq(noise_prob=0.01)
        self.assertIn(result['node_A_measurement'], [0, 1])
        self.assertIn(result['node_C_measurement'], [0, 1])

    def test_qrng(self):
        number, bits, log_str = generate_random_number_cirq(8)
        self.assertEqual(len(bits), 8)

    def test_authentication(self):
        data = "test_user"
        fingerprint, log_str = generate_quantum_fingerprint_cirq(data, num_qubits=8)
        valid = verify_fingerprint_cirq(data, fingerprint, num_qubits=8)
        self.assertTrue(valid)

    def test_grover(self):
        outcome, circuit, log_str = run_grover(3, '101', noise_prob=0.01)
        self.assertEqual(len(outcome), 3)

if __name__ == '__main__':
    unittest.main()
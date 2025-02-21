# tests/test_core.py
import unittest
from core.qubit import Qubit

class TestQubitOperations(unittest.TestCase):

    def test_hadamard_measurement(self):
        q = Qubit()
        q.apply_hadamard()
        result = q.measure()
        # Since Hadamard on |0> produces a superposition, result should be 0 or 1.
        self.assertIn(result, [0, 1])

    def test_measurement_collapse(self):
        q = Qubit([0.6, 0.8])
        result = q.measure()
        # After measurement, the state should collapse to a basis state.
        if result == 0:
            self.assertEqual(q.state, [1.0, 0.0])
        else:
            self.assertEqual(q.state, [0.0, 1.0])

if __name__ == '__main__':
    unittest.main()

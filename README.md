# Quantum Field Kit

## Overview

Quantum Field Kit is a basic quantum computing simulation toolkit designed to demonstrate and explore various quantum protocols and concepts in a binary environment. The toolkit provides both a command-line interface (CLI) and a graphical user interface (GUI) for running quantum simulations.

This is a simulation toolkit and does not represent a full quantum computing environment. It provides conceptual demonstrations of quantum protocols.

## Features

The Quantum Field Kit includes simulations of the following quantum protocols:

1. **BB84 Protocol**: A quantum key distribution simulation demonstrating secure communication.
2. **Quantum Handshake**: A simulation of quantum handshake using entangled pairs.
3. **Quantum Teleportation**: Simulates teleporting an unknown qubit state between two parties.
4. **Quantum Network**: Demonstrates entanglement swapping in a quantum communication network.
5. **Quantum Random Number Generator (QRNG)**: Generates random numbers using quantum measurement.
6. **Quantum Authentication**: Simulates quantum fingerprinting for authentication.


## Requirements

- Python 3.8+
- tkinter (for GUI)
- unittest (for testing)

## Installation

```bash
git clone https://github.com/Bobfrog93/quantum-field-kit
cd quantum-field-kit
pip install -r requirements.txt
```

## Usage

### Command-Line Interface

Run the CLI with various quantum protocol simulations:

```bash
python -m ui.cli bb84 --num 10
python -m ui.cli handshake
python -m ui.cli teleport
python -m ui.cli network
python -m ui.cli qrng --num 16
python -m ui.cli auth --data example_user
```

### Graphical User Interface

Launch the GUI:

```bash
python -m ui.gui
OR
npm start
```

## Running Tests

```bash
python -m unittest tests.test_core
python -m unittest tests.test_plugins
OR
npm test
```

## Quantum Protocols Explained

### BB84 Protocol
- Demonstrates quantum key distribution
- Alice prepares qubits in random bases
- Bob measures qubits in random bases
- They compare bases to create a shared secret key

### Quantum Handshake
- Uses entangled qubit pairs
- Parties measure their qubits
- Successful handshake if measurements are correlated

### Quantum Teleportation
- Transfers an unknown qubit state from Alice to Bob
- Uses an entangled pair and Bell state measurement
- Requires classical communication for state correction

### Quantum Network (Entanglement Swapping)
- Demonstrates quantum entanglement across multiple nodes
- Nodes A and B share an entangled pair
- Nodes B and C share another entangled pair
- Bell measurement at node B creates entanglement between A and C

### Quantum Random Number Generator
- Leverages quantum superposition and measurement
- Generates truly random bits by measuring qubits in superposition

### Quantum Authentication
- Uses quantum fingerprinting for secure authentication
- Generates a fingerprint from user data using quantum measurements
- Provides a method to verify identity
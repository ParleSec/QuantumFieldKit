import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import qdarkstyle
from PyQt5 import QtWidgets, QtCore
from PyQt5.QtWidgets import (
    QApplication, QMainWindow, QWidget, QTabWidget, QVBoxLayout,
    QHBoxLayout, QPushButton, QLabel, QLineEdit, QTextEdit,
    QFileDialog, QMessageBox, QDoubleSpinBox, QGroupBox, QSplitter
)
from PyQt5.QtCore import Qt

import matplotlib
matplotlib.use("Qt5Agg")
import matplotlib.pyplot as plt
from matplotlib.backends.backend_qt5agg import FigureCanvasQTAgg as FigureCanvas
import numpy as np

# Plugin Modules
from plugins.encryption_bb84.bb84 import bb84_protocol_cirq
from plugins.handshake.handshake import handshake_cirq
from plugins.teleportation.teleport import teleportation_circuit
from plugins.network.network import entanglement_swapping_cirq
from plugins.qrng.qrng import generate_random_number_cirq
from plugins.authentication.auth import generate_quantum_fingerprint_cirq, verify_fingerprint_cirq
from plugins.grover.grover import run_grover
from plugins.error_correction.shor_code import run_shor_code
from plugins.variational.vqe import run_vqe
from plugins.kyber.kyber512 import kyber_keygen, kyber_encapsulate, kyber_decapsulate, encrypt_message, decrypt_message
from plugins.quantum_decryption.quantum_decryption import grover_key_search, shor_factorization

class BlochSphereCanvas(FigureCanvas):
    def __init__(self, parent=None):
        self.fig = plt.Figure(figsize=(4,4))
        self.ax = self.fig.add_subplot(111, projection='3d')
        super().__init__(self.fig)
        self.setParent(parent)
        self.plot_sphere()

    def plot_sphere(self):
        self.ax.clear()
        u, v = np.mgrid[0:2*np.pi:100j, 0:np.pi:100j]
        x = np.cos(u)*np.sin(v)
        y = np.sin(u)*np.sin(v)
        z = np.cos(v)
        self.ax.plot_wireframe(x, y, z, color='gray', alpha=0.4)
        self.ax.set_xlabel('X')
        self.ax.set_ylabel('Y')
        self.ax.set_zlabel('Z')
        self.ax.set_title("Bloch Sphere (|+> state)")
        self.draw()

    def update_state(self, theta, phi):
        self.plot_sphere()
        # Convert spherical coordinates (theta, phi) to Cartesian coordinates.
        x = np.sin(theta) * np.cos(phi)
        y = np.sin(theta) * np.sin(phi)
        z = np.cos(theta)
        self.ax.quiver(0, 0, 0, x, y, z, color="red", linewidth=3, arrow_length_ratio=0.2)
        self.draw()

class QuantumFieldKitGUI(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Quantum Field Kit")
        self.resize(1500, 900)

        # Minimal style
        self.setStyleSheet("""
            QMainWindow { background-color: #fafafa; }
            QLabel, QGroupBox { font-size: 14px; color: #333; }
            QPushButton { font-size: 13px; background-color: #e0e0e0; border: 1px solid #ccc; padding: 8px 16px; margin: 4px; }
            QPushButton:hover { background-color: #d8d8d8; }
            QLineEdit, QTextEdit, QDoubleSpinBox { font-size: 13px; color: #333; background-color: #ffffff; border: 1px solid #ccc; margin: 4px; }
            QTabBar::tab { font-size: 14px; padding: 8px 16px; color: #333; background: #f3f3f3; border: 1px solid #ccc; margin: 2px; }
            QTabBar::tab:selected { background: #e7e7e7; }
            QStatusBar { font-size: 12px; color: #333; }
        """)

        self.noise_prob = 0.0
        self.initUI()

    def initUI(self):
        self.tabs = QTabWidget()
        self.setCentralWidget(self.tabs)

        # Original tabs
        self.tab_bb84 = QWidget()
        self.tab_handshake = QWidget()
        self.tab_teleport = QWidget()
        self.tab_network = QWidget()
        self.tab_qrng = QWidget()
        self.tab_auth = QWidget()
        self.tab_grover = QWidget()
        self.tab_visuals = QWidget()
        self.tab_error_correction = QWidget()
        self.tab_variational = QWidget()
        self.tab_decryption = QWidget()
        self.tab_kyber = QWidget()

        for tab, name in [
            (self.tab_bb84, "BB84"),
            (self.tab_handshake, "Handshake"),
            (self.tab_teleport, "Teleportation"),
            (self.tab_network, "Network"),
            (self.tab_qrng, "QRNG"),
            (self.tab_auth, "Authentication"),
            (self.tab_grover, "Grover"),
            (self.tab_visuals, "Visuals"),
            (self.tab_error_correction, "Error Correction"),
            (self.tab_variational, "Variational (VQE)"),
            (self.tab_decryption, "Decryption"),
            (self.tab_kyber, "Kyber Encryption")
        ]:
            self.tabs.addTab(tab, name)

        # Setup tabs
        self.setup_bb84_tab()
        self.setup_handshake_tab()
        self.setup_teleport_tab()
        self.setup_network_tab()
        self.setup_qrng_tab()
        self.setup_auth_tab()
        self.setup_grover_tab()
        self.setup_visuals_tab()
        self.setup_error_correction_tab()
        self.setup_variational_tab()
        self.setup_decryption_tab()
        self.setup_kyber_tab()

        self.create_menu()
        self.statusBar().showMessage("Welcome to Quantum Field Kit!")

    def create_menu(self):
        menubar = self.menuBar()
        fileMenu = menubar.addMenu("File")
        helpMenu = menubar.addMenu("Help")

        saveAction = QtWidgets.QAction("Save Output", self)
        saveAction.triggered.connect(self.save_output)
        fileMenu.addAction(saveAction)

        exitAction = QtWidgets.QAction("Exit", self)
        exitAction.triggered.connect(self.close)
        fileMenu.addAction(exitAction)

        guideAction = QtWidgets.QAction("User Guide", self)
        guideAction.triggered.connect(self.show_user_guide)
        helpMenu.addAction(guideAction)

        aboutAction = QtWidgets.QAction("About", self)
        aboutAction.triggered.connect(self.show_about)
        helpMenu.addAction(aboutAction)

    # --------------------- BB84 Tab ---------------------
    def setup_bb84_tab(self):
        splitter = QSplitter(Qt.Horizontal)
        left_widget = QWidget()
        left_layout = QVBoxLayout()
        group_box = QGroupBox("BB84 Parameters")
        group_layout = QVBoxLayout()
        hlayout = QHBoxLayout()
        hlayout.addWidget(QLabel("Number of bits:"))
        self.bb84_bits = QLineEdit("10")
        hlayout.addWidget(self.bb84_bits)
        group_layout.addLayout(hlayout)
        btn_layout = QHBoxLayout()
        run_btn = QPushButton("Run BB84")
        run_btn.clicked.connect(self.run_bb84)
        btn_layout.addWidget(run_btn)
        clear_btn = QPushButton("Clear")
        clear_btn.clicked.connect(lambda: self.bb84_output.clear())
        btn_layout.addWidget(clear_btn)
        group_layout.addLayout(btn_layout)
        group_box.setLayout(group_layout)
        left_layout.addWidget(group_box)
        left_layout.addStretch(1)
        left_widget.setLayout(left_layout)
        right_widget = QWidget()
        right_layout = QVBoxLayout()
        self.bb84_output = QTextEdit()
        self.bb84_output.setReadOnly(True)
        right_layout.addWidget(self.bb84_output)
        right_widget.setLayout(right_layout)
        splitter.addWidget(left_widget)
        splitter.addWidget(right_widget)
        splitter.setStretchFactor(1, 1)
        main_layout = QVBoxLayout()
        main_layout.addWidget(splitter)
        self.tab_bb84.setLayout(main_layout)

    def run_bb84(self):
        try:
            bits = int(self.bb84_bits.text())
        except ValueError:
            bits = 10
        result = bb84_protocol_cirq(bits, noise_prob=self.noise_prob)
        output = f"Shared key: {result['shared_key']}\n\nDetailed Log:\n{result['log']}"
        self.bb84_output.setPlainText(output)
        self.statusBar().showMessage("BB84 simulation completed.")

    # --------------------- Handshake Tab ---------------------
    def setup_handshake_tab(self):
        splitter = QSplitter(Qt.Horizontal)
        left_widget = QWidget()
        left_layout = QVBoxLayout()
        group_box = QGroupBox("Handshake")
        group_layout = QVBoxLayout()
        run_btn = QPushButton("Run Handshake")
        run_btn.clicked.connect(self.run_handshake)
        group_layout.addWidget(run_btn)
        clear_btn = QPushButton("Clear")
        clear_btn.clicked.connect(lambda: self.handshake_output.clear())
        group_layout.addWidget(clear_btn)
        group_box.setLayout(group_layout)
        left_layout.addWidget(group_box)
        left_layout.addStretch(1)
        left_widget.setLayout(left_layout)
        right_widget = QWidget()
        right_layout = QVBoxLayout()
        self.handshake_output = QTextEdit()
        self.handshake_output.setReadOnly(True)
        right_layout.addWidget(self.handshake_output)
        right_widget.setLayout(right_layout)
        splitter.addWidget(left_widget)
        splitter.addWidget(right_widget)
        splitter.setStretchFactor(1, 1)
        main_layout = QVBoxLayout()
        main_layout.addWidget(splitter)
        self.tab_handshake.setLayout(main_layout)

    def run_handshake(self):
        result = handshake_cirq(noise_prob=self.noise_prob)
        output = f"Handshake success: {result['handshake_success']}\n\nDetailed Log:\n{result['log']}"
        self.handshake_output.setPlainText(output)
        self.statusBar().showMessage("Handshake simulation completed.")

    # --------------------- Teleportation Tab ---------------------
    def setup_teleport_tab(self):
        splitter = QSplitter(Qt.Horizontal)
        left_widget = QWidget()
        left_layout = QVBoxLayout()
        group_box = QGroupBox("Teleportation")
        group_layout = QVBoxLayout()
        run_btn = QPushButton("Run Teleportation")
        run_btn.clicked.connect(self.run_teleportation)
        group_layout.addWidget(run_btn)
        clear_btn = QPushButton("Clear")
        clear_btn.clicked.connect(lambda: self.teleport_output.clear())
        group_layout.addWidget(clear_btn)
        group_box.setLayout(group_layout)
        left_layout.addWidget(group_box)
        left_layout.addStretch(1)
        left_widget.setLayout(left_layout)
        right_widget = QWidget()
        right_layout = QVBoxLayout()
        self.teleport_output = QTextEdit()
        self.teleport_output.setReadOnly(True)
        right_layout.addWidget(self.teleport_output)
        right_widget.setLayout(right_layout)
        splitter.addWidget(left_widget)
        splitter.addWidget(right_widget)
        splitter.setStretchFactor(1, 1)
        main_layout = QVBoxLayout()
        main_layout.addWidget(splitter)
        self.tab_teleport.setLayout(main_layout)

    def run_teleportation(self):
        state, measurements, circuit, log_str = teleportation_circuit(noise_prob=self.noise_prob)
        output = (f"Final state vector: {state}\n"
                  f"Measurement outcomes: {measurements}\n"
                  f"Circuit:\n{circuit}\n\nDetailed Log:\n{log_str}")
        self.teleport_output.setPlainText(output)
        self.statusBar().showMessage("Teleportation simulation completed.")

    # --------------------- Network Tab ---------------------
    def setup_network_tab(self):
        splitter = QSplitter(Qt.Horizontal)
        left_widget = QWidget()
        left_layout = QVBoxLayout()
        group_box = QGroupBox("Network (Entanglement Swapping)")
        group_layout = QVBoxLayout()
        run_btn = QPushButton("Run Network Simulation")
        run_btn.clicked.connect(self.run_network)
        group_layout.addWidget(run_btn)
        clear_btn = QPushButton("Clear")
        clear_btn.clicked.connect(lambda: self.network_output.clear())
        group_layout.addWidget(clear_btn)
        group_box.setLayout(group_layout)
        left_layout.addWidget(group_box)
        left_layout.addStretch(1)
        left_widget.setLayout(left_layout)
        right_widget = QWidget()
        right_layout = QVBoxLayout()
        self.network_output = QTextEdit()
        self.network_output.setReadOnly(True)
        right_layout.addWidget(self.network_output)
        right_widget.setLayout(right_layout)
        splitter.addWidget(left_widget)
        splitter.addWidget(right_widget)
        splitter.setStretchFactor(1, 1)
        main_layout = QVBoxLayout()
        main_layout.addWidget(splitter)
        self.tab_network.setLayout(main_layout)

    def run_network(self):
        result = entanglement_swapping_cirq(noise_prob=self.noise_prob)
        output = (f"Intermediate measurements: {result['intermediate_measurements']}\n"
                  f"Node A measurement: {result['node_A_measurement']}\n"
                  f"Node C measurement: {result['node_C_measurement']}\n\nDetailed Log:\n{result['log']}")
        self.network_output.setPlainText(output)
        self.statusBar().showMessage("Network simulation completed.")

    # --------------------- QRNG Tab ---------------------
    def setup_qrng_tab(self):
        splitter = QSplitter(Qt.Horizontal)
        left_widget = QWidget()
        left_layout = QVBoxLayout()
        group_box = QGroupBox("QRNG Parameters")
        group_layout = QVBoxLayout()
        hlayout = QHBoxLayout()
        hlayout.addWidget(QLabel("Number of bits:"))
        self.qrng_bits = QLineEdit("8")
        hlayout.addWidget(self.qrng_bits)
        group_layout.addLayout(hlayout)
        run_btn = QPushButton("Run QRNG")
        run_btn.clicked.connect(self.run_qrng)
        group_layout.addWidget(run_btn)
        clear_btn = QPushButton("Clear")
        clear_btn.clicked.connect(lambda: self.qrng_output.clear())
        group_layout.addWidget(clear_btn)
        group_box.setLayout(group_layout)
        left_layout.addWidget(group_box)
        left_layout.addStretch(1)
        left_widget.setLayout(left_layout)
        right_widget = QWidget()
        right_layout = QVBoxLayout()
        self.qrng_output = QTextEdit()
        self.qrng_output.setReadOnly(True)
        right_layout.addWidget(self.qrng_output)
        right_widget.setLayout(right_layout)
        splitter.addWidget(left_widget)
        splitter.addWidget(right_widget)
        splitter.setStretchFactor(1, 1)
        main_layout = QVBoxLayout()
        main_layout.addWidget(splitter)
        self.tab_qrng.setLayout(main_layout)

    def run_qrng(self):
        try:
            bits = int(self.qrng_bits.text())
        except ValueError:
            bits = 8
        number, bitseq, log_str = generate_random_number_cirq(bits)
        output = f"Random number: {number}\nBit sequence: {bitseq}\n\nDetailed Log:\n{log_str}"
        self.qrng_output.setPlainText(output)
        self.statusBar().showMessage("QRNG simulation completed.")

    # --------------------- Authentication Tab ---------------------
    def setup_auth_tab(self):
        splitter = QSplitter(Qt.Horizontal)
        left_widget = QWidget()
        left_layout = QVBoxLayout()
        group_box = QGroupBox("Quantum Authentication")
        group_layout = QVBoxLayout()
        hlayout = QHBoxLayout()
        hlayout.addWidget(QLabel("Data for fingerprint:"))
        self.auth_data = QLineEdit("example_user")
        hlayout.addWidget(self.auth_data)
        group_layout.addLayout(hlayout)
        run_btn = QPushButton("Run Authentication")
        run_btn.clicked.connect(self.run_authentication)
        group_layout.addWidget(run_btn)
        clear_btn = QPushButton("Clear")
        clear_btn.clicked.connect(lambda: self.auth_output.clear())
        group_layout.addWidget(clear_btn)
        group_box.setLayout(group_layout)
        left_layout.addWidget(group_box)
        left_layout.addStretch(1)
        left_widget.setLayout(left_layout)
        right_widget = QWidget()
        right_layout = QVBoxLayout()
        self.auth_output = QTextEdit()
        self.auth_output.setReadOnly(True)
        right_layout.addWidget(self.auth_output)
        right_widget.setLayout(right_layout)
        splitter.addWidget(left_widget)
        splitter.addWidget(right_widget)
        splitter.setStretchFactor(1, 1)
        main_layout = QVBoxLayout()
        main_layout.addWidget(splitter)
        self.tab_auth.setLayout(main_layout)

    def run_authentication(self):
        data = self.auth_data.text()
        fingerprint, log_str = generate_quantum_fingerprint_cirq(data, num_qubits=8)
        valid = verify_fingerprint_cirq(data, fingerprint, num_qubits=8)
        output = f"Fingerprint: {fingerprint}\nVerification: {valid}\n\nDetailed Log:\n{log_str}"
        self.auth_output.setPlainText(output)
        self.statusBar().showMessage("Authentication simulation completed.")

    # --------------------- Grover Tab ---------------------
    def setup_grover_tab(self):
        splitter = QSplitter(Qt.Horizontal)
        left_widget = QWidget()
        left_layout = QVBoxLayout()
        group_box = QGroupBox("Grover's Algorithm")
        group_layout = QVBoxLayout()
        row1 = QHBoxLayout()
        row1.addWidget(QLabel("Number of qubits:"))
        self.grover_qubits = QLineEdit("3")
        row1.addWidget(self.grover_qubits)
        group_layout.addLayout(row1)
        row2 = QHBoxLayout()
        row2.addWidget(QLabel("Target state:"))
        self.grover_target = QLineEdit("101")
        row2.addWidget(self.grover_target)
        group_layout.addLayout(row2)
        run_btn = QPushButton("Run Grover's Search")
        run_btn.clicked.connect(self.run_grover)
        group_layout.addWidget(run_btn)
        clear_btn = QPushButton("Clear")
        clear_btn.clicked.connect(lambda: self.grover_output.clear())
        group_layout.addWidget(clear_btn)
        group_box.setLayout(group_layout)
        left_layout.addWidget(group_box)
        left_layout.addStretch(1)
        left_widget.setLayout(left_layout)
        right_widget = QWidget()
        right_layout = QVBoxLayout()
        self.grover_output = QTextEdit()
        self.grover_output.setReadOnly(True)
        right_layout.addWidget(self.grover_output)
        right_widget.setLayout(right_layout)
        splitter.addWidget(left_widget)
        splitter.addWidget(right_widget)
        splitter.setStretchFactor(1, 1)
        main_layout = QVBoxLayout()
        main_layout.addWidget(splitter)
        self.tab_grover.setLayout(main_layout)

    def run_grover(self):
        try:
            n = int(self.grover_qubits.text())
        except ValueError:
            n = 3
        target = self.grover_target.text()
        outcome, circuit, log_str = run_grover(n, target, noise_prob=self.noise_prob)
        output = f"Outcome: {outcome}\n\nCircuit:\n{circuit}\n\nDetailed Log:\n{log_str}"
        self.grover_output.setPlainText(output)
        self.statusBar().showMessage("Grover simulation completed.")

    # --------------------- Error Correction Tab ---------------------
    def setup_error_correction_tab(self):
        splitter = QSplitter(Qt.Horizontal)
        left_widget = QWidget()
        left_layout = QVBoxLayout()
        group_box = QGroupBox("Shor's Code Error Correction")
        group_layout = QVBoxLayout()
        row = QHBoxLayout()
        label = QLabel("Noise Probability:")
        self.shor_noise_spin = QDoubleSpinBox()
        self.shor_noise_spin.setRange(0.0, 0.2)
        self.shor_noise_spin.setSingleStep(0.005)
        self.shor_noise_spin.setValue(0.01)
        row.addWidget(label)
        row.addWidget(self.shor_noise_spin)
        group_layout.addLayout(row)
        run_btn = QPushButton("Run Shor's Code")
        run_btn.clicked.connect(self.run_shor_code)
        group_layout.addWidget(run_btn)
        clear_btn = QPushButton("Clear")
        clear_btn.clicked.connect(lambda: self.error_correction_output.clear())
        group_layout.addWidget(clear_btn)
        group_box.setLayout(group_layout)
        left_layout.addWidget(group_box)
        left_layout.addStretch(1)
        left_widget.setLayout(left_layout)
        right_widget = QWidget()
        right_layout = QVBoxLayout()
        self.error_correction_output = QTextEdit()
        self.error_correction_output.setReadOnly(True)
        right_layout.addWidget(self.error_correction_output)
        right_widget.setLayout(right_layout)
        splitter.addWidget(left_widget)
        splitter.addWidget(right_widget)
        splitter.setStretchFactor(1, 1)
        main_layout = QVBoxLayout()
        main_layout.addWidget(splitter)
        self.tab_error_correction.setLayout(main_layout)

    def run_shor_code(self):
        noise_val = self.shor_noise_spin.value()
        result = run_shor_code(noise_prob=noise_val)
        output = (
            f"Measurement results: {result['measurements']}\n\n"
            f"Circuit:\n{result['circuit']}\n\n"
            f"Detailed Log:\n{result['log']}"
        )
        self.error_correction_output.setPlainText(output)
        self.statusBar().showMessage("Shor's code simulation completed.")

    # --------------------- Variational (VQE) Tab ---------------------
    def setup_variational_tab(self):
        splitter = QSplitter(Qt.Horizontal)
        left_widget = QWidget()
        left_layout = QVBoxLayout()
        group_box = QGroupBox("Variational Quantum Eigensolver (VQE)")
        group_layout = QVBoxLayout()
        row1 = QHBoxLayout()
        row1.addWidget(QLabel("Number of qubits:"))
        self.vqe_qubits = QLineEdit("2")
        row1.addWidget(self.vqe_qubits)
        group_layout.addLayout(row1)
        row2 = QHBoxLayout()
        row2.addWidget(QLabel("Noise Probability:"))
        self.vqe_noise_spin = QDoubleSpinBox()
        self.vqe_noise_spin.setRange(0.0, 0.2)
        self.vqe_noise_spin.setSingleStep(0.005)
        self.vqe_noise_spin.setValue(0.01)
        row2.addWidget(self.vqe_noise_spin)
        group_layout.addLayout(row2)
        row3 = QHBoxLayout()
        row3.addWidget(QLabel("Max Iterations:"))
        self.vqe_iterations = QLineEdit("5")
        row3.addWidget(self.vqe_iterations)
        group_layout.addLayout(row3)
        run_btn = QPushButton("Run VQE")
        run_btn.clicked.connect(self.run_vqe)
        group_layout.addWidget(run_btn)
        clear_btn = QPushButton("Clear")
        clear_btn.clicked.connect(lambda: self.variational_output.clear())
        group_layout.addWidget(clear_btn)
        group_box.setLayout(group_layout)
        left_layout.addWidget(group_box)
        left_layout.addStretch(1)
        left_widget.setLayout(left_layout)
        right_widget = QWidget()
        right_layout = QVBoxLayout()
        self.variational_output = QTextEdit()
        self.variational_output.setReadOnly(True)
        right_layout.addWidget(self.variational_output)
        right_widget.setLayout(right_layout)
        splitter.addWidget(left_widget)
        splitter.addWidget(right_widget)
        splitter.setStretchFactor(1, 1)
        main_layout = QVBoxLayout()
        main_layout.addWidget(splitter)
        self.tab_variational.setLayout(main_layout)

    def run_vqe(self):
        try:
            n = int(self.vqe_qubits.text())
        except ValueError:
            n = 2
        noise_val = self.vqe_noise_spin.value()
        try:
            max_iter = int(self.vqe_iterations.text())
        except ValueError:
            max_iter = 5
        result = run_vqe(num_qubits=n, noise_prob=noise_val, max_iter=max_iter)
        output = (
            f"Best energy found: {result['best_energy']}\n"
            f"Best params: {result['best_params']}\n\n"
            f"Circuit:\n{result['circuit']}\n\n"
            f"Detailed Log:\n{result['log']}"
        )
        self.variational_output.setPlainText(output)
        self.statusBar().showMessage("VQE simulation completed.")

    # --------------------- Decryption Tab ---------------------
    def setup_decryption_tab(self):
        # Create a vertical splitter for two sections: Grover's and Shor's.
        splitter = QSplitter(Qt.Vertical)
        
        # Top: Grover's Key Search
        top_widget = QWidget()
        top_layout = QVBoxLayout(top_widget)
        group_box_grover = QGroupBox("Grover's Key Search")
        group_layout = QVBoxLayout()
        grover_input_layout = QHBoxLayout()
        grover_input_layout.addWidget(QLabel("Secret Key (int):"))
        self.decry_grover_key = QLineEdit("5")
        grover_input_layout.addWidget(self.decry_grover_key)
        grover_input_layout.addWidget(QLabel("Number of Bits:"))
        self.decry_grover_bits = QLineEdit("4")
        grover_input_layout.addWidget(self.decry_grover_bits)
        grover_input_layout.addWidget(QLabel("Noise Prob:"))
        self.decry_grover_noise = QDoubleSpinBox()
        self.decry_grover_noise.setRange(0.0, 0.2)
        self.decry_grover_noise.setSingleStep(0.005)
        self.decry_grover_noise.setValue(0.0)
        grover_input_layout.addWidget(self.decry_grover_noise)
        group_layout.addLayout(grover_input_layout)
        grover_btn_layout = QHBoxLayout()
        grover_run_btn = QPushButton("Run Grover Key Search")
        grover_run_btn.clicked.connect(self.run_grover_decryption)
        grover_btn_layout.addWidget(grover_run_btn)
        grover_clear_btn = QPushButton("Clear")
        grover_clear_btn.clicked.connect(lambda: self.decry_grover_output.clear())
        grover_btn_layout.addWidget(grover_clear_btn)
        group_layout.addLayout(grover_btn_layout)
        group_box_grover.setLayout(group_layout)
        top_layout.addWidget(group_box_grover)
        self.decry_grover_output = QTextEdit()
        self.decry_grover_output.setReadOnly(True)
        top_layout.addWidget(self.decry_grover_output)
        top_widget.setLayout(top_layout)
        
        # Bottom: Shor's Factorization
        bottom_widget = QWidget()
        bottom_layout = QVBoxLayout(bottom_widget)
        group_box_shor = QGroupBox("Shor's Factorization")
        group_layout_shor = QVBoxLayout()
        shor_input_layout = QHBoxLayout()
        shor_input_layout.addWidget(QLabel("Composite Number:"))
        self.decry_shor_number = QLineEdit("15")
        shor_input_layout.addWidget(self.decry_shor_number)
        group_layout_shor.addLayout(shor_input_layout)
        shor_btn_layout = QHBoxLayout()
        shor_run_btn = QPushButton("Run Shor's Factorization")
        shor_run_btn.clicked.connect(self.run_shor_decryption)
        shor_btn_layout.addWidget(shor_run_btn)
        shor_clear_btn = QPushButton("Clear")
        shor_clear_btn.clicked.connect(lambda: self.decry_shor_output.clear())
        shor_btn_layout.addWidget(shor_clear_btn)
        group_layout_shor.addLayout(shor_btn_layout)
        group_box_shor.setLayout(group_layout_shor)
        bottom_layout.addWidget(group_box_shor)
        self.decry_shor_output = QTextEdit()
        self.decry_shor_output.setReadOnly(True)
        bottom_layout.addWidget(self.decry_shor_output)
        bottom_widget.setLayout(bottom_layout)
        
        splitter.addWidget(top_widget)
        splitter.addWidget(bottom_widget)
        splitter.setStretchFactor(0, 1)
        splitter.setStretchFactor(1, 1)
        
        main_layout = QVBoxLayout()
        main_layout.addWidget(splitter)
        self.tab_decryption.setLayout(main_layout)

    def run_grover_decryption(self):
        try:
            key_int = int(self.decry_grover_key.text())
            num_bits = int(self.decry_grover_bits.text())
            noise_val = self.decry_grover_noise.value()
        except ValueError:
            QMessageBox.warning(self, "Input Error", "Please enter valid numbers for Grover decryption inputs.")
            return
        outcome, circuit, log_str = grover_key_search(key_int, num_bits, noise_prob=noise_val)
        output = (f"Target key (binary): {format(key_int, '0{}b'.format(num_bits))}\n"
                  f"Grover's algorithm outcome: {outcome}\n\nDetailed Log:\n{log_str}")
        self.decry_grover_output.setPlainText(output)
        self.statusBar().showMessage("Grover key search completed.")

    def run_shor_decryption(self):
        try:
            comp_num = int(self.decry_shor_number.text())
        except ValueError:
            QMessageBox.warning(self, "Input Error", "Please enter a valid composite number for Shor's factorization.")
            return
        try:
            result = shor_factorization(comp_num)
            # Instead of result.factors, we display the measurements and log from our simulation.
            output = (f"Composite Number: {comp_num}\n"
                      f"Measurements: {result.get('measurements')}\n"
                      f"Circuit:\n{result.get('circuit')}\n\n"
                      f"Detailed Log:\n{result.get('log')}")
        except Exception as e:
            output = f"Error in Shor's factorization: {str(e)}"
        self.decry_shor_output.setPlainText(output)
        self.statusBar().showMessage("Shor factorization completed.")



    # --------------------- Kyber Tab ---------------------
    def setup_kyber_tab(self):
        splitter = QSplitter(Qt.Horizontal)
        
        # Left side: Controls for key generation and encryption.
        left_widget = QWidget()
        left_layout = QVBoxLayout(left_widget)
        
        # Key Generation Group
        key_group = QGroupBox("Key Generation")
        key_layout = QVBoxLayout()
        gen_btn = QPushButton("Generate Keys")
        gen_btn.clicked.connect(self.run_kyber_keygen)
        key_layout.addWidget(gen_btn)
        self.kyber_keys_output = QTextEdit()
        self.kyber_keys_output.setReadOnly(True)
        key_layout.addWidget(self.kyber_keys_output)
        key_group.setLayout(key_layout)
        left_layout.addWidget(key_group)
        
        # Encryption Group
        encrypt_group = QGroupBox("Encryption / Decryption")
        encrypt_layout = QVBoxLayout()
        msg_layout = QHBoxLayout()
        msg_layout.addWidget(QLabel("Message:"))
        self.kyber_message = QLineEdit("Hello Quantum World!")
        msg_layout.addWidget(self.kyber_message)
        encrypt_layout.addLayout(msg_layout)
        
        btn_layout = QHBoxLayout()
        enc_btn = QPushButton("Encrypt")
        enc_btn.clicked.connect(self.run_kyber_encrypt)
        btn_layout.addWidget(enc_btn)
        dec_btn = QPushButton("Decrypt")
        dec_btn.clicked.connect(self.run_kyber_decrypt)
        btn_layout.addWidget(dec_btn)
        encrypt_layout.addLayout(btn_layout)
        
        self.kyber_output = QTextEdit()
        self.kyber_output.setReadOnly(True)
        encrypt_layout.addWidget(self.kyber_output)
        encrypt_group.setLayout(encrypt_layout)
        left_layout.addWidget(encrypt_group)
        
        left_layout.addStretch(1)
        left_widget.setLayout(left_layout)
        
        # Right side: Details/Logs
        right_widget = QWidget()
        right_layout = QVBoxLayout(right_widget)
        self.kyber_details = QTextEdit()
        self.kyber_details.setReadOnly(True)
        right_layout.addWidget(self.kyber_details)
        right_widget.setLayout(right_layout)
        
        splitter.addWidget(left_widget)
        splitter.addWidget(right_widget)
        splitter.setStretchFactor(1, 1)
        
        main_layout = QVBoxLayout()
        main_layout.addWidget(splitter)
        self.tab_kyber.setLayout(main_layout)

    def run_kyber_keygen(self):
        # Generate keys using the Kyber-512 simulation
        public_key, secret_key = kyber_keygen()
        output = f"Public Key:\n{public_key}\n\nSecret Key:\n{secret_key}"
        self.kyber_keys_output.setPlainText(output)
        self.statusBar().showMessage("Kyber keys generated.")
        # Store keys for later use
        self.kyber_public_key = public_key
        self.kyber_secret_key = secret_key

    def run_kyber_encrypt(self):
        if not hasattr(self, "kyber_public_key"):
            QMessageBox.warning(self, "Key Error", "Please generate keys first.")
            return
        ciphertext, shared_secret = kyber_encapsulate(self.kyber_public_key)
        message = self.kyber_message.text()
        encrypted_msg = encrypt_message(message, shared_secret)
        output = (f"Ciphertext (Encapsulation):\n{ciphertext}\n\n"
                f"Shared Secret:\n{shared_secret}\n\n"
                f"Encrypted Message:\n{encrypted_msg}")
        self.kyber_details.setPlainText(output)
        self.kyber_output.setPlainText(output)
        self.statusBar().showMessage("Message encrypted using Kyber-512 simulation.")
        # Store for decryption demonstration
        self.kyber_ciphertext = ciphertext
        self.kyber_shared_secret = shared_secret
        self.kyber_encrypted_msg = encrypted_msg

    def run_kyber_decrypt(self):
        if not (hasattr(self, "kyber_shared_secret") and hasattr(self, "kyber_encrypted_msg")):
            QMessageBox.warning(self, "Decryption Error", "Please encrypt a message first.")
            return
        decrypted_msg = decrypt_message(self.kyber_encrypted_msg, self.kyber_shared_secret)
        output = (f"Ciphertext (Encapsulation):\n{self.kyber_ciphertext}\n\n"
                f"Shared Secret:\n{self.kyber_shared_secret}\n\n"
                f"Encrypted Message:\n{self.kyber_encrypted_msg}\n\n"
                f"Decrypted Message:\n{decrypted_msg}")
        self.kyber_details.setPlainText(output)
        self.statusBar().showMessage("Message decrypted using Kyber-512 simulation.")

    # --------------------- Visuals Tab ---------------------
    def setup_visuals_tab(self):
        splitter = QSplitter(Qt.Horizontal)
        left_widget = QWidget()
        left_layout = QVBoxLayout()
        group_box = QGroupBox("Global Settings & Bloch Sphere")
        group_layout = QVBoxLayout()
        row = QHBoxLayout()
        row.addWidget(QLabel("Noise Probability:"))
        self.noise_spin = QDoubleSpinBox()
        self.noise_spin.setRange(0.0, 0.2)
        self.noise_spin.setSingleStep(0.005)
        self.noise_spin.setValue(0.0)
        self.noise_spin.valueChanged.connect(self.update_noise_prob)
        row.addWidget(self.noise_spin)
        group_layout.addLayout(row)
        refresh_btn = QPushButton("Refresh Bloch Sphere")
        refresh_btn.clicked.connect(self.refresh_bloch_sphere)
        group_layout.addWidget(refresh_btn)
        tut_btn = QPushButton("Show Tutorial")
        tut_btn.clicked.connect(self.show_tutorial)
        group_layout.addWidget(tut_btn)
        group_box.setLayout(group_layout)
        left_layout.addWidget(group_box)
        left_layout.addStretch(1)
        left_widget.setLayout(left_layout)
        right_widget = QWidget()
        right_layout = QVBoxLayout()
        self.bloch_canvas = BlochSphereCanvas(self)
        right_layout.addWidget(self.bloch_canvas)
        right_widget.setLayout(right_layout)
        splitter.addWidget(left_widget)
        splitter.addWidget(right_widget)
        splitter.setStretchFactor(1, 1)
        main_layout = QVBoxLayout()
        main_layout.addWidget(splitter)
        self.tab_visuals.setLayout(main_layout)

    def update_noise_prob(self, val):
        self.noise_prob = val
        self.statusBar().showMessage(f"Noise probability set to {val:.3f}")

    def refresh_bloch_sphere(self):
        self.bloch_canvas.plot_sphere()
        self.statusBar().showMessage("Bloch sphere refreshed.")

    # --------------------- Menu Actions ---------------------
    def save_output(self):
        current_widget = self.tabs.currentWidget().findChild(QTextEdit)
        if current_widget:
            content = current_widget.toPlainText()
            if content.strip():
                fname, _ = QFileDialog.getSaveFileName(self, "Save Output", "", "Text Files (*.txt)")
                if fname:
                    with open(fname, "w", encoding="utf-8") as f:
                        f.write(content)
                    QMessageBox.information(self, "Save Output", f"Output saved to {fname}")
            else:
                QMessageBox.warning(self, "Save Output", "No output to save.")
        else:
            QMessageBox.warning(self, "Save Output", "No output widget found in current tab.")

    def show_user_guide(self):
        guide_text = (
            "Quantum Field Kit - User Guide\n\n"
            "Use the tabs to run each protocol or feature.\n"
            "Adjust noise probability or parameters, then click 'Run'.\n"
            "Check logs for detailed quantum operations.\n"
        )
        QMessageBox.information(self, "User Guide", guide_text)

    def show_about(self):
        about_text = (
            "Quantum Field Kit V1\n"
            "https://github.com/parlesec\n"
        )
        QMessageBox.information(self, "About", about_text)

    def show_tutorial(self):
        tutorial_text = (
            "Tutorial:\n\n"
            "1. Select a protocol tab (BB84, Teleportation, etc.) on the top.\n"
            "2. On the left, set parameters and click 'Run'.\n"
            "3. Output logs and results appear on the right side.\n"
            "4. Save logs using 'File → Save Output'.\n"
        )
        QMessageBox.information(self, "Tutorial", tutorial_text)

if __name__ == '__main__':
    app = QApplication(sys.argv)
    gui = QuantumFieldKitGUI()
    gui.show()
    sys.exit(app.exec_())
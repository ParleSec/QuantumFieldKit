# ui/gui.py
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import tkinter as tk
from tkinter import ttk, scrolledtext, messagebox, filedialog
import math
import datetime

# Import simulation functions from the plugins and core engine.
from plugins.encryption_bb84.bb84 import run_bb84_protocol
from plugins.handshake.handshake import perform_handshake
from plugins.teleportation.teleport import teleport
from plugins.network.network import entanglement_swapping
from plugins.qrng.qrng import generate_random_number
from plugins.authentication.auth import generate_quantum_fingerprint, verify_fingerprint
from core.qubit import Qubit

class QuantumFieldKitGUI(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Quantum Field Kit")
        self.geometry("1000x700")
        self.create_menu()
        self.create_widgets()
        self.create_status_bar()

    def create_menu(self):
        menubar = tk.Menu(self)
        
        # File menu
        file_menu = tk.Menu(menubar, tearoff=0)
        file_menu.add_command(label="Save Output", command=self.save_output)
        file_menu.add_separator()
        file_menu.add_command(label="Exit", command=self.quit)
        menubar.add_cascade(label="File", menu=file_menu)
        
        # Help menu
        help_menu = tk.Menu(menubar, tearoff=0)
        help_menu.add_command(label="User Guide", command=self.show_user_guide)
        help_menu.add_command(label="About", command=self.show_about)
        menubar.add_cascade(label="Help", menu=help_menu)
        
        self.config(menu=menubar)

    def create_widgets(self):
        # Create a Notebook (tabbed interface)
        self.notebook = ttk.Notebook(self)
        self.notebook.pack(expand=True, fill='both')
        
        # Create frames for each simulation tab
        self.frame_bb84 = ttk.Frame(self.notebook)
        self.frame_handshake = ttk.Frame(self.notebook)
        self.frame_teleportation = ttk.Frame(self.notebook)
        self.frame_network = ttk.Frame(self.notebook)
        self.frame_qrng = ttk.Frame(self.notebook)
        self.frame_authentication = ttk.Frame(self.notebook)
        
        self.notebook.add(self.frame_bb84, text="BB84")
        self.notebook.add(self.frame_handshake, text="Handshake")
        self.notebook.add(self.frame_teleportation, text="Teleportation")
        self.notebook.add(self.frame_network, text="Network")
        self.notebook.add(self.frame_qrng, text="QRNG")
        self.notebook.add(self.frame_authentication, text="Authentication")
        
        # Create UI for each tab
        self.create_bb84_tab()
        self.create_handshake_tab()
        self.create_teleportation_tab()
        self.create_network_tab()
        self.create_qrng_tab()
        self.create_authentication_tab()

    def create_status_bar(self):
        self.status_var = tk.StringVar()
        self.status_var.set("Welcome to Quantum Field Kit!")
        self.status_bar = ttk.Label(self, textvariable=self.status_var, relief=tk.SUNKEN, anchor="w")
        self.status_bar.pack(side=tk.BOTTOM, fill=tk.X)

    def log_status(self, message):
        timestamp = datetime.datetime.now().strftime("[%Y-%m-%d %H:%M:%S]")
        self.status_var.set(f"{timestamp} {message}")
    
    # Tab creation functions
    def create_bb84_tab(self):
        frame = self.frame_bb84
        input_frame = ttk.LabelFrame(frame, text="Parameters")
        input_frame.pack(fill=tk.X, padx=10, pady=10)
        
        ttk.Label(input_frame, text="Number of bits:").grid(row=0, column=0, padx=5, pady=5, sticky="w")
        self.bb84_bits_entry = ttk.Entry(input_frame, width=10)
        self.bb84_bits_entry.insert(0, "10")
        self.bb84_bits_entry.grid(row=0, column=1, padx=5, pady=5)
        
        run_button = ttk.Button(input_frame, text="Run BB84 Simulation", command=self.run_bb84)
        run_button.grid(row=0, column=2, padx=10, pady=5)
        
        clear_button = ttk.Button(input_frame, text="Clear Output", command=lambda: self.clear_output(self.bb84_output))
        clear_button.grid(row=0, column=3, padx=10, pady=5)
        
        self.bb84_output = scrolledtext.ScrolledText(frame, width=100, height=20)
        self.bb84_output.pack(padx=10, pady=10)
    
    def create_handshake_tab(self):
        frame = self.frame_handshake
        input_frame = ttk.LabelFrame(frame, text="Quantum Handshake")
        input_frame.pack(fill=tk.X, padx=10, pady=10)
        
        run_button = ttk.Button(input_frame, text="Run Handshake Simulation", command=self.run_handshake)
        run_button.pack(side=tk.LEFT, padx=10, pady=5)
        
        clear_button = ttk.Button(input_frame, text="Clear Output", command=lambda: self.clear_output(self.handshake_output))
        clear_button.pack(side=tk.LEFT, padx=10, pady=5)
        
        self.handshake_output = scrolledtext.ScrolledText(frame, width=100, height=20)
        self.handshake_output.pack(padx=10, pady=10)
    
    def create_teleportation_tab(self):
        frame = self.frame_teleportation
        input_frame = ttk.LabelFrame(frame, text="Quantum Teleportation")
        input_frame.pack(fill=tk.X, padx=10, pady=10)
        
        run_button = ttk.Button(input_frame, text="Run Teleportation Simulation", command=self.run_teleportation)
        run_button.pack(side=tk.LEFT, padx=10, pady=5)
        
        clear_button = ttk.Button(input_frame, text="Clear Output", command=lambda: self.clear_output(self.teleportation_output))
        clear_button.pack(side=tk.LEFT, padx=10, pady=5)
        
        self.teleportation_output = scrolledtext.ScrolledText(frame, width=100, height=20)
        self.teleportation_output.pack(padx=10, pady=10)
    
    def create_network_tab(self):
        frame = self.frame_network
        input_frame = ttk.LabelFrame(frame, text="Quantum Network (Entanglement Swapping)")
        input_frame.pack(fill=tk.X, padx=10, pady=10)
        
        run_button = ttk.Button(input_frame, text="Run Network Simulation", command=self.run_network)
        run_button.pack(side=tk.LEFT, padx=10, pady=5)
        
        clear_button = ttk.Button(input_frame, text="Clear Output", command=lambda: self.clear_output(self.network_output))
        clear_button.pack(side=tk.LEFT, padx=10, pady=5)
        
        self.network_output = scrolledtext.ScrolledText(frame, width=100, height=20)
        self.network_output.pack(padx=10, pady=10)
    
    def create_qrng_tab(self):
        frame = self.frame_qrng
        input_frame = ttk.LabelFrame(frame, text="Quantum Random Number Generator")
        input_frame.pack(fill=tk.X, padx=10, pady=10)
        
        ttk.Label(input_frame, text="Number of bits:").grid(row=0, column=0, padx=5, pady=5, sticky="w")
        self.qrng_bits_entry = ttk.Entry(input_frame, width=10)
        self.qrng_bits_entry.insert(0, "8")
        self.qrng_bits_entry.grid(row=0, column=1, padx=5, pady=5)
        
        run_button = ttk.Button(input_frame, text="Run QRNG Simulation", command=self.run_qrng)
        run_button.grid(row=0, column=2, padx=10, pady=5)
        
        clear_button = ttk.Button(input_frame, text="Clear Output", command=lambda: self.clear_output(self.qrng_output))
        clear_button.grid(row=0, column=3, padx=10, pady=5)
        
        self.qrng_output = scrolledtext.ScrolledText(frame, width=100, height=20)
        self.qrng_output.pack(padx=10, pady=10)
    
    def create_authentication_tab(self):
        frame = self.frame_authentication
        input_frame = ttk.LabelFrame(frame, text="Quantum Authentication")
        input_frame.pack(fill=tk.X, padx=10, pady=10)
        
        ttk.Label(input_frame, text="Data for fingerprint:").grid(row=0, column=0, padx=5, pady=5, sticky="w")
        self.auth_data_entry = ttk.Entry(input_frame, width=30)
        self.auth_data_entry.insert(0, "example_user")
        self.auth_data_entry.grid(row=0, column=1, padx=5, pady=5)
        
        run_button = ttk.Button(input_frame, text="Run Authentication Simulation", command=self.run_authentication)
        run_button.grid(row=0, column=2, padx=10, pady=5)
        
        clear_button = ttk.Button(input_frame, text="Clear Output", command=lambda: self.clear_output(self.auth_output))
        clear_button.grid(row=0, column=3, padx=10, pady=5)
        
        self.auth_output = scrolledtext.ScrolledText(frame, width=100, height=20)
        self.auth_output.pack(padx=10, pady=10)

    # Utility function to clear text outputs
    def clear_output(self, widget):
        widget.delete("1.0", tk.END)

    # Simulation functions integrated with the GUI
    def run_bb84(self):
        try:
            num_bits = int(self.bb84_bits_entry.get())
        except ValueError:
            num_bits = 10
        result = run_bb84_protocol(num_bits)
        output = (
            f"BB84 Protocol Simulation:\n"
            f"Alice bits:      {result['alice_bits']}\n"
            f"Alice bases:     {result['alice_bases']}\n"
            f"Bob bases:       {result['bob_bases']}\n"
            f"Bob measurements:{result['bob_measurements']}\n"
            f"Shared key:      {result['shared_key']}\n"
        )
        self.bb84_output.delete("1.0", tk.END)
        self.bb84_output.insert(tk.END, output)
        self.log_status("BB84 simulation completed.")

    def run_handshake(self):
        result = perform_handshake()
        output = (
            f"Quantum Handshake Simulation:\n"
            f"Alice measurement: {result['alice_result']}\n"
            f"Bob measurement:   {result['bob_result']}\n"
            f"Handshake success: {result['handshake_success']}\n"
        )
        self.handshake_output.delete("1.0", tk.END)
        self.handshake_output.insert(tk.END, output)
        self.log_status("Handshake simulation completed.")

    def run_teleportation(self):
        # Prepare an unknown qubit state, e.g., |ψ> = (sqrt(3)/2)|0> + (1/2)|1>
        q_unknown = Qubit([math.sqrt(3)/2, 1/2])
        result = teleport(q_unknown)
        output = (
            f"Quantum Teleportation Simulation:\n"
            f"Classical bits sent: {result['classical_bits']}\n"
            f"Bob's qubit state after teleportation: {result['bob_state']}\n"
        )
        self.teleportation_output.delete("1.0", tk.END)
        self.teleportation_output.insert(tk.END, output)
        self.log_status("Teleportation simulation completed.")

    def run_network(self):
        result = entanglement_swapping()
        output = (
            f"Quantum Communication Network Simulation (Entanglement Swapping):\n"
            f"Classical bits from swapping: {result['classical_bits']}\n"
            f"Node A state: {result['node_A_state']}\n"
            f"Node C state: {result['node_C_state']}\n"
        )
        self.network_output.delete("1.0", tk.END)
        self.network_output.insert(tk.END, output)
        self.log_status("Network simulation completed.")

    def run_qrng(self):
        try:
            num_bits = int(self.qrng_bits_entry.get())
        except ValueError:
            num_bits = 8
        number, bits = generate_random_number(num_bits)
        output = (
            f"Quantum Random Number Generator (QRNG) Simulation:\n"
            f"Generated random number: {number}\n"
            f"Bit sequence: {bits}\n"
        )
        self.qrng_output.delete("1.0", tk.END)
        self.qrng_output.insert(tk.END, output)
        self.log_status("QRNG simulation completed.")

    def run_authentication(self):
        data = self.auth_data_entry.get()
        fingerprint = generate_quantum_fingerprint(data, num_qubits=8)
        valid = verify_fingerprint(data, fingerprint, num_qubits=8)
        output = (
            f"Quantum Authentication Simulation:\n"
            f"Data: {data}\n"
            f"Generated fingerprint: {fingerprint}\n"
            f"Verification result: {valid}\n"
        )
        self.auth_output.delete("1.0", tk.END)
        self.auth_output.insert(tk.END, output)
        self.log_status("Authentication simulation completed.")

    # Menu command functions
    def save_output(self):
        # Save output from current active tab's scrolled text widget to a file
        current_tab = self.notebook.select()
        current_frame = self.nametowidget(current_tab)
        output_widget = None
        for child in current_frame.winfo_children():
            if isinstance(child, scrolledtext.ScrolledText):
                output_widget = child
                break
        if output_widget:
            content = output_widget.get("1.0", tk.END)
            if content.strip():
                file_path = filedialog.asksaveasfilename(defaultextension=".txt", filetypes=[("Text Files", "*.txt")])
                if file_path:
                    with open(file_path, "w") as file:
                        file.write(content)
                    messagebox.showinfo("Save Output", f"Output saved to {file_path}")
            else:
                messagebox.showwarning("Save Output", "No output to save.")
        else:
            messagebox.showwarning("Save Output", "Could not determine output widget.")

    def show_user_guide(self):
        guide_text = (
            "Quantum Field Kit User Guide\n\n"
            "This application simulates various quantum protocols:\n"
            "1. BB84: Quantum key distribution simulation.\n"
            "2. Handshake: Quantum handshake simulation using entangled pairs.\n"
            "3. Teleportation: Simulates quantum teleportation of an unknown qubit state.\n"
            "4. Network: Simulates entanglement swapping for quantum communication networks.\n"
            "5. QRNG: Quantum Random Number Generator simulation.\n"
            "6. Authentication: Quantum fingerprinting for authentication simulation.\n\n"
            "Use the input fields to set parameters, click the corresponding simulation button, "
            "and view results in the output area. You can save outputs using the File menu."
        )
        messagebox.showinfo("User Guide", guide_text)

    def show_about(self):
        about_text = (
            "Quantum Field Kit\n"
            "Version 0.1\n"
            "A simulation toolkit for quantum concepts in a binary environment.\n"
        )
        messagebox.showinfo("About", about_text)

if __name__ == '__main__':
    app = QuantumFieldKitGUI()
    app.mainloop()

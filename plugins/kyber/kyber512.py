import os
import hashlib
import binascii

def kyber_keygen():
    """
    Simulated key generation for Kyber-512.
    Returns a tuple (public_key, secret_key) as hex strings.
    (In a real implementation, these would be generated via lattice-based algorithms.)
    """
    public_key = os.urandom(32)   # simulate 256-bit public key
    secret_key = os.urandom(32)   # simulate 256-bit secret key
    return binascii.hexlify(public_key).decode(), binascii.hexlify(secret_key).decode()

def kyber_encapsulate(public_key_hex):
    """
    Simulated encapsulation for Kyber-512.
    Given a public key (as hex), returns a tuple (ciphertext, shared_secret) as hex strings.
    In a real KEM, the ciphertext encapsulates the shared secret.
    Here we simulate by hashing the public key with random bytes.
    """
    public_key = binascii.unhexlify(public_key_hex)
    randomness = os.urandom(32)
    shared_secret = hashlib.sha256(public_key + randomness).digest()
    ciphertext = os.urandom(64)  # simulated ciphertext
    return binascii.hexlify(ciphertext).decode(), binascii.hexlify(shared_secret).decode()

def kyber_decapsulate(ciphertext_hex, secret_key_hex):
    """
    Simulated decapsulation for Kyber-512.
    In a real KEM, this would recover the shared secret from the ciphertext using the secret key.
    Here we simulate by hashing the secret key with the ciphertext.
    """
    ciphertext = binascii.unhexlify(ciphertext_hex)
    secret_key = binascii.unhexlify(secret_key_hex)
    shared_secret = hashlib.sha256(secret_key + ciphertext).digest()
    return binascii.hexlify(shared_secret).decode()

def encrypt_message(message: str, key_hex: str):
    """
    Simulated symmetric encryption using XOR with the shared secret.
    (This is NOT secure encryption; it's for demonstration only.)
    """
    key = binascii.unhexlify(key_hex)
    message_bytes = message.encode()
    # Repeat the key to match the message length.
    repeated_key = (key * ((len(message_bytes) // len(key)) + 1))[:len(message_bytes)]
    ciphertext = bytes([mb ^ rb for mb, rb in zip(message_bytes, repeated_key)])
    return binascii.hexlify(ciphertext).decode()

def decrypt_message(ciphertext_hex: str, key_hex: str):
    """
    Simulated symmetric decryption (reversing the XOR encryption).
    """
    key = binascii.unhexlify(key_hex)
    ciphertext = binascii.unhexlify(ciphertext_hex)
    repeated_key = (key * ((len(ciphertext) // len(key)) + 1))[:len(ciphertext)]
    message_bytes = bytes([cb ^ rb for cb, rb in zip(ciphertext, repeated_key)])
    return message_bytes.decode()

if __name__ == "__main__":
    print("Kyber-512 Simulation Demo")
    pub_key, sec_key = kyber_keygen()
    print("Public Key:", pub_key)
    print("Secret Key:", sec_key)
    
    ct, shared_enc = kyber_encapsulate(pub_key)
    print("Ciphertext (encapsulation):", ct)
    print("Shared Secret (Encapsulation):", shared_enc)
    
    # For demonstration, simulate decapsulation (note: this simulation is not consistent with encapsulation)
    shared_dec = kyber_decapsulate(ct, sec_key)
    print("Shared Secret (Decapsulation):", shared_dec)
    
    message = "Hello Quantum World!"
    encrypted_msg = encrypt_message(message, shared_enc)
    print("Encrypted Message:", encrypted_msg)
    
    decrypted_msg = decrypt_message(encrypted_msg, shared_enc)
    print("Decrypted Message:", decrypted_msg)
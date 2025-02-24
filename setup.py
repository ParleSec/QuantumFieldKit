from setuptools import setup, find_packages

setup(
    name="quantum_field_kit",
    version="1.0.0",
    description="A  quantum computing simulation toolkit for demonstrating quantum protocols and algorithms",
    long_description=open("README.md").read(),
    long_description_content_type="text/markdown",
    author="ParleSec",
    url="https://github.com/ParleSec/quantum-field-kit",
    packages=find_packages(),
    install_requires=[
        "cirq>=0.17.0",
        "qiskit>=0.40.0",
        "numpy>=1.21.0",
        "matplotlib>=3.5.0",
        "PyQt5>=5.15.0",
        "qdarkstyle>=3.0.2",
        "sympy>=1.8"
    ],
    classifiers=[
        "Intended Audience :: Education",
        "Intended Audience :: Science/Research",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Topic :: Scientific/Engineering",
        "Topic :: Education",
        "Topic :: Security :: Cryptography"
    ],
    entry_points={
        'console_scripts': [
            'qfk-cli=ui.cli:main',
            'qfk-gui=ui.gui:main',
        ],
    },
    python_requires='>=3.8',
)
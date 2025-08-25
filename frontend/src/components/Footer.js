import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="bg-dark text-white py-4 mt-5">
      <div className="container">
        <div className="row">
          <div className="col-md-4 mb-3">
            <h5>Quantum Field Kit</h5>
            <p className="text-muted">
              A high-fidelity quantum computing simulation platform for exploring quantum protocols,
              algorithms, and concepts with scientific accuracy.
            </p>
          </div>
          <div className="col-md-4 mb-3">
            <h5>Quick Links</h5>
            <ul className="list-unstyled">
              <li>
                <Link to="/" className="text-muted text-decoration-none">
                  <i className="fas fa-home me-2"></i> Home
                </Link>
              </li>
              <li>
                <Link to="/glossary" className="text-muted text-decoration-none">
                  <i className="fas fa-book me-2"></i> Glossary
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/ParleSec/QuantumFieldKit"
                  className="text-muted text-decoration-none"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="fab fa-github me-2"></i> GitHub
                </a>
              </li>
            </ul>
          </div>
          <div className="col-md-4 mb-3">
            <h5>Contact</h5>
            <ul className="list-unstyled">
              <li>
                <a
                  href="mailto:contact@quantumfieldkit.com"
                  className="text-muted text-decoration-none"
                >
                  <i className="fas fa-envelope me-2"></i> Email
                </a>
              </li>
              <li>
                <a
                  href="https://twitter.com/quantumfieldkit"
                  className="text-muted text-decoration-none"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="fab fa-twitter me-2"></i> Twitter
                </a>
              </li>
            </ul>
          </div>
        </div>
        <hr className="my-4" />
        <div className="row">
          <div className="col-md-6 text-center text-md-start">
            <p className="mb-0">
              &copy; {new Date().getFullYear()} Quantum Field Kit. All rights reserved.
            </p>
          </div>
          <div className="col-md-6 text-center text-md-end">
            <p className="mb-0">
              Made with <i className="fas fa-heart text-danger"></i> for quantum computing
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer; 
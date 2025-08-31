import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="border-t border-base-200 mt-12">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h5 className="font-semibold mb-2">Quantum Field Kit</h5>
            <p className="text-base-content/60">
              A high-fidelity quantum computing simulation platform for exploring quantum protocols,
              algorithms, and concepts.
            </p>
          </div>
          <div>
            <h5 className="font-semibold mb-2">Quick Links</h5>
            <ul className="space-y-2 text-base-content/70">
              <li>
                <Link to="/" className="hover:text-primary transition-colors">
                  <i className="fas fa-home mr-2"></i>Home
                </Link>
              </li>
              <li>
                <Link to="/glossary" className="hover:text-primary transition-colors">
                  <i className="fas fa-book mr-2"></i>Glossary
                </Link>
              </li>
              <li>
                <a href="https://github.com/ParleSec/QuantumFieldKit" className="hover:text-primary transition-colors" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-github mr-2"></i>GitHub
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h5 className="font-semibold mb-2">Contact</h5>
            <ul className="space-y-2 text-base-content/70">
              <li>
                <a href="mailto:qfk@masonparle.com" className="hover:text-primary transition-colors">
                  <i className="fas fa-envelope mr-2"></i>Email
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 flex flex-col md:flex-row items-center justify-between text-sm text-base-content/60">
          <p>&copy; {new Date().getFullYear()} ParleSec</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer; 
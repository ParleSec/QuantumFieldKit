import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const toggleNavbar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark fixed-top">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <i className="fas fa-atom me-2"></i>
          Quantum Field Kit
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          onClick={toggleNavbar}
          aria-expanded={isOpen}
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className={`collapse navbar-collapse ${isOpen ? 'show' : ''}`}>
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link
                className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
                to="/"
              >
                <i className="fas fa-home me-1"></i> Home
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className={`nav-link ${location.pathname === '/circuit-designer' ? 'active' : ''}`}
                to="/circuit-designer"
              >
                <i className="fas fa-project-diagram me-1"></i> Circuit Designer
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className={`nav-link ${location.pathname === '/glossary' ? 'active' : ''}`}
                to="/glossary"
              >
                <i className="fas fa-book me-1"></i> Glossary
              </Link>
            </li>
            <li className="nav-item">
              <a
                className="nav-link"
                href="https://github.com/ParleSec/QuantumFieldKit"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fab fa-github me-1"></i> GitHub
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar; 
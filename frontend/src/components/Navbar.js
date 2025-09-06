import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Menu, X } from 'lucide-react';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    // Check for saved theme in localStorage or default to quantumlight
    return localStorage.getItem('theme') || 'quantumlight';
  });
  const location = useLocation();

  useEffect(() => {
    const html = document.documentElement;
    const head = document.querySelector('head');
    
    // Set data-theme on both html and head for compatibility
    html.setAttribute('data-theme', theme);
    head.setAttribute('data-theme', theme);
    
    // Handle Tailwind dark mode
    if (theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
    
    // Save theme to localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleNavbar = () => setIsOpen(!isOpen);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="fixed top-0 w-full z-50 bg-base-100/80 backdrop-blur-md border-b border-base-200/50"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link className="flex items-center gap-2 text-xl font-bold" to="/">
              <motion.i
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="fas fa-atom text-primary"
              />
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Quantum Field Kit
              </span>
            </Link>
          </motion.div>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center space-x-1">
            {[
              { path: '/', label: 'Home', icon: 'fas fa-home' },
              //{ path: '/circuit-designer', label: 'Circuit Designer', icon: 'fas fa-project-diagram' },
              { path: '/glossary', label: 'Glossary', icon: 'fas fa-book' },
            ].map((item) => (
              <motion.div key={item.path} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to={item.path}
                  className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                    location.pathname === item.path
                      ? 'bg-primary text-primary-content'
                      : 'hover:bg-base-200'
                  }`}
                >
                  <i className={`${item.icon} text-sm`}></i>
                  {item.label}
                </Link>
              </motion.div>
            ))}
            
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href="https://github.com/ParleSec/QuantumFieldKit"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg hover:bg-base-200 transition-all flex items-center gap-2"
            >
              <i className="fab fa-github text-sm"></i>
              GitHub
            </motion.a>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setTheme(theme === 'quantumlight' ? 'dark' : 'quantumlight')}
              className="p-2 rounded-lg hover:bg-base-200 transition-all"
            >
              <AnimatePresence mode="wait">
                {theme === 'quantumlight' ? (
                  <motion.div
                    key="sun"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Sun size={20} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="moon"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Moon size={20} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Mobile Menu Toggle */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleNavbar}
              className="lg:hidden p-2 rounded-lg hover:bg-base-200 transition-all"
            >
              <AnimatePresence mode="wait">
                {isOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X size={20} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu size={20} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden border-t border-base-200/50 mt-2 pt-4 pb-4"
            >
              <div className="space-y-2">
                {[
                  { path: '/', label: 'Home', icon: 'fas fa-home' },
                  //{ path: '/circuit-designer', label: 'Circuit Designer', icon: 'fas fa-project-diagram' },
                  { path: '/glossary', label: 'Glossary', icon: 'fas fa-book' },
                ].map((item, index) => (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className={`block px-4 py-3 rounded-lg transition-all flex items-center gap-3 ${
                        location.pathname === item.path
                          ? 'bg-primary text-primary-content'
                          : 'hover:bg-base-200'
                      }`}
                    >
                      <i className={item.icon}></i>
                      {item.label}
                    </Link>
                  </motion.div>
                ))}
                
                <motion.a
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  href="https://github.com/ParleSec/QuantumFieldKit"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 rounded-lg hover:bg-base-200 transition-all flex items-center gap-3"
                >
                  <i className="fab fa-github"></i>
                  GitHub
                </motion.a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}

export default Navbar; 
import React, { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const AccessibilityContext = createContext();

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

const AccessibilityProvider = ({ children }) => {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState('medium');
  const [announcements, setAnnouncements] = useState([]);

  // Detect user preferences
  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    
    const handleChange = (e) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    // Check for high contrast preference
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setHighContrast(mediaQuery.matches);
    
    const handleChange = (e) => setHighContrast(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Announce to screen readers
  const announce = (message, priority = 'polite') => {
    const id = Date.now();
    const announcement = { id, message, priority };
    
    setAnnouncements(prev => [...prev, announcement]);
    
    // Remove announcement after it's been read
    setTimeout(() => {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    }, 1000);
  };

  // Skip to main content
  const skipToMain = () => {
    const main = document.querySelector('main');
    if (main) {
      main.focus();
      main.scrollIntoView();
    }
  };

  // Focus management
  const focusElement = (selector) => {
    const element = document.querySelector(selector);
    if (element) {
      element.focus();
      return true;
    }
    return false;
  };

  const value = {
    reducedMotion,
    highContrast,
    fontSize,
    setFontSize,
    announce,
    skipToMain,
    focusElement,
    announcements,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
      
      {/* Screen reader announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcements
          .filter(a => a.priority === 'polite')
          .map(a => (
            <div key={a.id}>{a.message}</div>
          ))}
      </div>
      
      <div className="sr-only" aria-live="assertive" aria-atomic="true">
        {announcements
          .filter(a => a.priority === 'assertive')
          .map(a => (
            <div key={a.id}>{a.message}</div>
          ))}
      </div>
      
      {/* Skip to main content link */}
      <button
        onClick={skipToMain}
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary-500 text-white px-4 py-2 rounded-lg z-50 focus:z-[9999]"
      >
        Skip to main content
      </button>
    </AccessibilityContext.Provider>
  );
};

AccessibilityProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AccessibilityProvider;

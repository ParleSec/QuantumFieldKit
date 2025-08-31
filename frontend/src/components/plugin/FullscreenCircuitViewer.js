import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCcw, Maximize2 } from 'lucide-react';
import PropTypes from 'prop-types';

const FullscreenCircuitViewer = ({ circuitSvg, isOpen, onClose }) => {
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scrollPos, setScrollPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.3, 5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.3, 0.3));
  const handleResetZoom = () => setZoom(1);

  // Keyboard support
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case '+':
        case '=':
          e.preventDefault();
          handleZoomIn();
          break;
        case '-':
          e.preventDefault();
          handleZoomOut();
          break;
        case '0':
          e.preventDefault();
          handleResetZoom();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleMouseDown = (e) => {
    if (e.target.closest('.zoom-controls')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    if (containerRef.current) {
      setScrollPos({
        x: containerRef.current.scrollLeft,
        y: containerRef.current.scrollTop
      });
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !containerRef.current) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    containerRef.current.scrollLeft = scrollPos.x - deltaX;
    containerRef.current.scrollTop = scrollPos.y - deltaY;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (!isOpen || !circuitSvg) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full h-full max-w-7xl max-h-[90vh] bg-white dark:bg-neutral-900 rounded-lg shadow-2xl overflow-hidden m-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Quantum Circuit Diagram
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Full-screen view with advanced zoom and pan controls
              </p>
            </div>
            
            {/* Controls */}
            <div className="flex items-center gap-2">
              <div className="zoom-controls flex items-center gap-1 bg-white dark:bg-neutral-800 rounded-lg p-1 border border-neutral-200 dark:border-neutral-600">
                <button
                  onClick={handleZoomOut}
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded text-neutral-600 dark:text-neutral-400 transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut size={16} />
                </button>
                
                <span className="text-sm text-neutral-600 dark:text-neutral-400 min-w-[4rem] text-center px-2">
                  {Math.round(zoom * 100)}%
                </span>
                
                <button
                  onClick={handleZoomIn}
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded text-neutral-600 dark:text-neutral-400 transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn size={16} />
                </button>
                
                <button
                  onClick={handleResetZoom}
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded text-neutral-600 dark:text-neutral-400 transition-colors"
                  title="Reset Zoom"
                >
                  <RotateCcw size={16} />
                </button>
              </div>
              
              <button
                onClick={onClose}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded text-neutral-600 dark:text-neutral-400 transition-colors"
                title="Close Fullscreen"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Circuit Container */}
          <div 
            ref={containerRef}
            className="flex-1 overflow-auto bg-neutral-50 dark:bg-neutral-900 cursor-grab active:cursor-grabbing"
            style={{ 
              height: 'calc(100% - 80px)',
              scrollbarWidth: 'thin',
              scrollbarColor: '#cbd5e1 #f1f5f9'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <div className="flex items-center justify-center min-h-full p-8">
              <div
                dangerouslySetInnerHTML={{ __html: circuitSvg }}
                className="transition-transform duration-200 bg-white dark:bg-neutral-800 rounded-lg p-6 shadow-lg"
                style={{ 
                  transform: `scale(${zoom})`,
                  transformOrigin: 'center center'
                }}
              />
            </div>
          </div>

          {/* Footer with instructions */}
          <div className="p-3 bg-neutral-50 dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-center gap-6 text-xs text-neutral-500 dark:text-neutral-400">
              <span className="flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11H1m22 0h-8M9 11l3-3m-3 3l3 3"/>
                </svg>
                Drag to pan around the circuit
              </span>
              <span className="flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35"/>
                </svg>
                Use zoom controls or mouse wheel
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-neutral-200 dark:bg-neutral-700 rounded text-xs">Esc</kbd>
                Close fullscreen
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

FullscreenCircuitViewer.propTypes = {
  circuitSvg: PropTypes.string,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default FullscreenCircuitViewer;

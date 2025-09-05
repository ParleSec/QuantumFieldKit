import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Activity, Zap, Info, Maximize2 } from 'lucide-react';
import PropTypes from 'prop-types';
import FullscreenCircuitViewer from './FullscreenCircuitViewer';

const QuantumVisualization = ({ result, type = 'auto' }) => {
  const [activeVisualization, setActiveVisualization] = useState('circuit');
  const [showFullscreen, setShowFullscreen] = useState(false);

  // Bloch Sphere Visualization
  const BlochSphere = ({ stateVector }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
      if (!canvasRef.current || !stateVector) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(centerX, centerY) - 20;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw sphere outline
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw axes
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 1;
      
      // X axis
      ctx.beginPath();
      ctx.moveTo(centerX - radius, centerY);
      ctx.lineTo(centerX + radius, centerY);
      ctx.stroke();
      
      // Y axis (vertical)
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - radius);
      ctx.lineTo(centerX, centerY + radius);
      ctx.stroke();

      // Calculate state vector position on Bloch sphere
      if (stateVector && stateVector.length >= 2) {
        const alpha = stateVector[0];
        const beta = stateVector[1];
        
        // Convert to Bloch sphere coordinates
        const theta = 2 * Math.acos(Math.abs(alpha));
        const phi = Math.arg ? Math.arg(beta / alpha) : 0;
        
        const x = radius * Math.sin(theta) * Math.cos(phi);
        const z = radius * Math.cos(theta);

        // Project to 2D (simple projection)
        const projX = centerX + x;
        const projY = centerY - z; // Flip Y for canvas coordinates

        // Draw state vector
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(projX, projY);
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Draw state point
        ctx.beginPath();
        ctx.arc(projX, projY, 6, 0, 2 * Math.PI);
        ctx.fillStyle = '#6366f1';
        ctx.fill();
      }

      // Add labels
      ctx.fillStyle = '#374151';
      ctx.font = '12px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('|0⟩', centerX, centerY - radius - 10);
      ctx.fillText('|1⟩', centerX, centerY + radius + 20);
      ctx.textAlign = 'left';
      ctx.fillText('|+⟩', centerX + radius + 10, centerY + 5);
      ctx.textAlign = 'right';
      ctx.fillText('|-⟩', centerX - radius - 10, centerY + 5);
    }, [stateVector]);

    return (
      <canvas
        ref={canvasRef}
        width={300}
        height={300}
        className="border border-neutral-200 rounded-lg bg-white"
      />
    );
  };

  // Probability Bar Chart
  const ProbabilityChart = ({ probabilities }) => {
    if (!probabilities || typeof probabilities !== 'object') return null;

    const entries = Object.entries(probabilities);
    const maxProb = Math.max(...entries.map(([, prob]) => prob));

    return (
      <div className="space-y-3">
        {entries.map(([state, probability]) => (
          <motion.div
            key={state}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-12 text-sm font-mono text-neutral-600">|{state}⟩</div>
            <div className="flex-1 bg-neutral-100 rounded-full h-6 relative overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(probability / maxProb) * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full"
              />
              <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-neutral-700">
                {(probability * 100).toFixed(1)}%
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  // Circuit SVG Display
  const CircuitDisplay = ({ circuitSvg }) => {
    const [zoom, setZoom] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [scrollPos, setScrollPos] = useState({ x: 0, y: 0 });
    const containerRef = useRef(null);

    if (!circuitSvg) return null;

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));
    const handleResetZoom = () => setZoom(1);

    const handleMouseDown = (e) => {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e) => {
      if (!isDragging || !containerRef.current) return;
      
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      containerRef.current.scrollLeft = scrollPos.x - deltaX;
      containerRef.current.scrollTop = scrollPos.y - deltaY;
    };

    const handleMouseUp = () => {
      if (containerRef.current) {
        setScrollPos({
          x: containerRef.current.scrollLeft,
          y: containerRef.current.scrollTop
        });
      }
      setIsDragging(false);
    };

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Quantum Circuit Diagram
            </h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Scroll or drag to navigate • Use zoom controls for better viewing
            </p>
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 sm:gap-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
              <button
                onClick={handleZoomOut}
                className="p-2 sm:p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded text-neutral-600 dark:text-neutral-400 transition-colors min-h-[44px] sm:min-h-[32px] min-w-[44px] sm:min-w-[32px] flex items-center justify-center"
                title="Zoom Out"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35"/>
                  <line x1="8" y1="11" x2="14" y2="11"/>
                </svg>
              </button>
              
              <span className="text-xs text-neutral-600 dark:text-neutral-400 min-w-[3rem] text-center px-1">
                {Math.round(zoom * 100)}%
              </span>
              
              <button
                onClick={handleZoomIn}
                className="p-2 sm:p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded text-neutral-600 dark:text-neutral-400 transition-colors min-h-[44px] sm:min-h-[32px] min-w-[44px] sm:min-w-[32px] flex items-center justify-center"
                title="Zoom In"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35"/>
                  <line x1="8" y1="11" x2="14" y2="11"/>
                  <line x1="11" y1="8" x2="11" y2="14"/>
                </svg>
              </button>
              
              <button
                onClick={handleResetZoom}
                className="p-2 sm:p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded text-neutral-600 dark:text-neutral-400 transition-colors text-xs min-h-[44px] sm:min-h-[32px] px-2 sm:px-1"
                title="Reset Zoom"
              >
                <span className="hidden sm:inline">Reset</span>
                <span className="sm:hidden">↺</span>
              </button>
            </div>
            
            {/* Fullscreen Button */}
            <button
              onClick={() => setShowFullscreen(true)}
              className="p-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors min-h-[44px] sm:min-h-[40px] min-w-[44px] sm:min-w-[40px] flex items-center justify-center"
              title="View in Fullscreen"
            >
              <Maximize2 size={16} />
            </button>
          </div>
        </div>
        
        <div 
          ref={containerRef}
          className="overflow-auto bg-white dark:bg-neutral-800 rounded-lg border border-neutral-100 dark:border-neutral-600 p-2 sm:p-4 cursor-grab active:cursor-grabbing touch-pan-x touch-pan-y"
          style={{ 
            maxHeight: '400px',
            scrollbarWidth: 'thin',
            scrollbarColor: '#cbd5e1 #f1f5f9',
            WebkitOverflowScrolling: 'touch'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={(e) => {
            const touch = e.touches[0];
            handleMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
          }}
          onTouchMove={(e) => {
            const touch = e.touches[0];
            handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
          }}
          onTouchEnd={handleMouseUp}
        >
          <div
            dangerouslySetInnerHTML={{ __html: circuitSvg }}
            className="min-w-max transition-transform duration-200"
            style={{ 
              minWidth: 'fit-content',
              display: 'inline-block',
              transform: `scale(${zoom})`,
              transformOrigin: 'top left'
            }}
          />
        </div>
        
        {/* Navigation hints */}
        <div className="mt-3 flex items-center justify-between text-xs text-neutral-400 dark:text-neutral-500">
          <span className="flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 11H1m22 0h-8M9 11l3-3m-3 3l3 3"/>
            </svg>
            <span className="hidden sm:inline">Drag to pan • Scroll to navigate</span>
            <span className="sm:hidden">Drag or swipe to navigate</span>
          </span>
          
          <span className="flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            Use zoom controls for detail
          </span>
        </div>
      </motion.div>
    );
  };

  const visualizations = [
    {
      id: 'circuit',
      label: 'Circuit',
      icon: <Activity size={16} />,
      component: <CircuitDisplay circuitSvg={result?.output?.circuit_svg} />,
      available: !!result?.output?.circuit_svg,
    },
    {
      id: 'probabilities',
      label: 'Probabilities',
      icon: <BarChart3 size={16} />,
      component: <ProbabilityChart probabilities={result?.output?.probabilities} />,
      available: !!result?.output?.probabilities,
    },
    {
      id: 'bloch',
      label: 'Bloch Sphere',
      icon: <Zap size={16} />,
      component: <BlochSphere stateVector={result?.output?.state_vector} />,
      available: !!result?.output?.state_vector,
    },
  ];

  const availableVisualizations = visualizations.filter(viz => viz.available);

  if (!result || availableVisualizations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
        <Info size={48} className="mb-4 opacity-50" />
        <p className="text-lg font-medium">No visualization data available</p>
        <p className="text-sm">Run a simulation to see results</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {availableVisualizations.length > 1 && (
        <div className="flex gap-2 p-1 bg-neutral-100 rounded-lg">
          {availableVisualizations.map((viz) => (
            <button
              key={viz.id}
              onClick={() => setActiveVisualization(viz.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all
                ${activeVisualization === viz.id
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
                }
              `}
            >
              {viz.icon}
              {viz.label}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {availableVisualizations.map((viz) => (
          viz.id === activeVisualization && (
            <motion.div
              key={viz.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {viz.component}
            </motion.div>
          )
        ))}
      </AnimatePresence>

      {/* Fullscreen Circuit Viewer */}
      <FullscreenCircuitViewer
        circuitSvg={result?.output?.circuit_svg}
        isOpen={showFullscreen}
        onClose={() => setShowFullscreen(false)}
      />
    </div>
  );
};

QuantumVisualization.propTypes = {
  result: PropTypes.object,
  type: PropTypes.string,
};

export default QuantumVisualization;

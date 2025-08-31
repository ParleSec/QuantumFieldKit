import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  BarChart3, 
  FileText, 
  Download, 
  Share2, 
  Maximize2,
  Copy,
  CheckCircle2
} from 'lucide-react';
import PropTypes from 'prop-types';
import Button from '../../design-system/components/Button';
import Card from '../../design-system/components/Card';
import SimpleTabs from './SimpleTabs';
import QuantumVisualization from './QuantumVisualization';

const EnhancedPluginResultsPanel = ({ result, loading, onExport, onShare }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyData = useCallback(async () => {
    if (!result || !result.output) return;
    
    try {
      await navigator.clipboard.writeText(JSON.stringify(result.output, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy data:', err);
    }
  }, [result]);

  const tabs = useMemo(() => {
    if (!result) {
      return [
        {
          id: 'visualization',
          label: 'Visualization',
          icon: <Activity size={16} />,
          available: true,
          content: <QuantumVisualization result={null} />
        }
      ];
    }

    return [
      {
        id: 'visualization',
        label: 'Visualization',
        icon: <Activity size={16} />,
        available: true,
        content: <QuantumVisualization result={result} />
      },
      {
        id: 'data',
        label: 'Raw Data',
        icon: <BarChart3 size={16} />,
        available: !!(result && result.output),
        content: (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-neutral-700">Raw Output Data</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyData}
                icon={copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
              >
                {copied ? 'Copied!' : 'Copy JSON'}
              </Button>
            </div>
            
            <div className="bg-neutral-50 rounded-lg p-4 max-h-96 overflow-auto">
              <pre className="text-sm text-neutral-800 whitespace-pre-wrap">
                {result && result.output ? JSON.stringify(result.output, null, 2) : 'No data available'}
              </pre>
            </div>
          </motion.div>
        )
      },
      {
        id: 'log',
        label: 'Process Log',
        icon: <FileText size={16} />,
        available: !!(result && result.log),
        content: (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <h4 className="text-sm font-medium text-neutral-700">Process Log</h4>
            
            <div className="bg-neutral-900 rounded-lg p-4 max-h-96 overflow-auto">
              <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">
                {(result && result.log) ? result.log : 'No log data available.'}
              </pre>
            </div>
          </motion.div>
        )
      },
    ].filter(tab => tab.available);
  }, [result, copied, handleCopyData]);

  const handleExport = () => {
    if (!result?.output) return;
    
    const dataStr = JSON.stringify(result.output, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `quantum-simulation-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    onExport?.(result);
  };

  if (loading) {
    return (
      <Card variant="elevated" padding="lg">
        <div className="flex flex-col items-center justify-center py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="mb-4"
          >
            <Activity size={48} className="text-primary-500" />
          </motion.div>
          <motion.h3
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-lg font-semibold text-neutral-900 mb-2"
          >
            Processing Quantum Simulation
          </motion.h3>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-neutral-600 text-center max-w-md"
          >
            Your quantum computation is being executed. This may take a few moments depending on the complexity.
          </motion.p>
          
          {/* Animated progress indicators */}
          <div className="flex gap-2 mt-6">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 1, 0.3]
                }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity,
                  delay: i * 0.2
                }}
                className="w-2 h-2 bg-primary-500 rounded-full"
              />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (!result) {
    return (
      <Card variant="outlined" padding="lg">
        <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
          <Activity size={48} className="mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">Ready for Simulation</h3>
          <p className="text-center max-w-md">
            Configure your parameters and run a simulation to see quantum results and visualizations.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={isFullscreen ? 'fixed inset-4 z-50 bg-white rounded-xl shadow-2xl' : ''}
    >
      <Card variant="elevated" padding="none" className="h-full">
        <div className="p-6 border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                <Activity size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">
                  Simulation Results
                </h3>
                <p className="text-sm text-neutral-600">
                  Quantum computation completed successfully
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyData}
                icon={copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                disabled={!result?.output}
              >
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExport}
                icon={<Download size={16} />}
                disabled={!result?.output}
              >
                Export
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onShare?.(result)}
                icon={<Share2 size={16} />}
                disabled={!result?.output}
              >
                Share
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
                icon={<Maximize2 size={16} />}
              >
                {isFullscreen ? 'Exit' : 'Fullscreen'}
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <SimpleTabs tabs={tabs} defaultTab="visualization" />
        </div>
      </Card>
      
      {isFullscreen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsFullscreen(false)}
        />
      )}
    </motion.div>
  );
};

EnhancedPluginResultsPanel.propTypes = {
  result: PropTypes.object,
  loading: PropTypes.bool,
  onExport: PropTypes.func,
  onShare: PropTypes.func,
};

export default EnhancedPluginResultsPanel;

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  BookOpen, 
  Github, 
  ExternalLink, 
  Lightbulb,
  Zap,
  AlertCircle,
  X
} from 'lucide-react';
import { fetchPlugin, runPlugin, fetchEducationalContent } from '../services/api';
import Button from '../design-system/components/Button';
import Card from '../design-system/components/Card';
import EnhancedPluginParameterForm from '../components/plugin/EnhancedPluginParameterForm';
import EnhancedPluginResultsPanel from '../components/plugin/EnhancedPluginResultsPanel';
import SkeletonLoader from '../components/SkeletonLoader';
import analytics from '../services/analytics';

const EnhancedPlugin = () => {
  const { pluginKey } = useParams();
  const navigate = useNavigate();
  
  // State management
  const [plugin, setPlugin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [educationalContent, setEducationalContent] = useState('');
  const [currentParameters, setCurrentParameters] = useState({});
  const [showEducational, setShowEducational] = useState(false);

  // Load plugin data
  useEffect(() => {
    const loadPluginData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [pluginData, eduData] = await Promise.all([
          fetchPlugin(pluginKey),
          fetchEducationalContent(pluginKey).catch(() => ({ content: '' }))
        ]);
        
        setPlugin(pluginData);
        setEducationalContent(eduData.content || '');
        
        // Track plugin view
        analytics.trackPluginInteraction(pluginKey, 'view');
        
        // Set initial parameter values
        const initialValues = pluginData.parameters.reduce(
          (acc, param) => ({ ...acc, [param.name]: param.default }),
          {}
        );
        setCurrentParameters(initialValues);
        
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (pluginKey) {
      loadPluginData();
    }
  }, [pluginKey]);

  // Run simulation
  const handleRunSimulation = useCallback(async (params) => {
    try {
      setSimulating(true);
      setError(null);
      setResult(null);
      
      // Track simulation run
      analytics.trackSimulationRun(pluginKey, params);
      
      const simResult = await runPlugin(pluginKey, params);
      setResult(simResult);
      
      // Track successful simulation
      analytics.trackPluginInteraction(pluginKey, 'simulation_success', params);
      
    } catch (err) {
      setError(err.message);
      
      // Track simulation error
      analytics.trackError('simulation_error', err.message, `plugin_${pluginKey}`);
    } finally {
      setSimulating(false);
    }
  }, [pluginKey]);

  // Handle parameter changes
  const handleParameterChange = useCallback((newParams) => {
    setCurrentParameters(newParams);
  }, []);

  // Memoized plugin info
  const pluginInfo = useMemo(() => {
    if (!plugin) return null;
    
    return {
      category: plugin.category || 'Quantum Computing',
      complexity: plugin.complexity || 'Intermediate',
      estimatedTime: plugin.estimated_time || '< 1 minute',
      description: plugin.description || '',
    };
  }, [plugin]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
            <div className="lg:col-span-4">
              <SkeletonLoader count={1} />
            </div>
            <div className="lg:col-span-8">
              <SkeletonLoader count={1} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !plugin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <AlertCircle size={64} className="text-error-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Plugin Not Found</h1>
          <p className="text-neutral-600 mb-6">{error}</p>
          <Button onClick={() => navigate('/')} icon={<ArrowLeft size={16} />}>
            Back to Home
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-md border-b border-neutral-200 sticky top-16 z-40"
      >
        <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                icon={<ArrowLeft size={16} />}
                className="hidden sm:flex"
              >
                Back
              </Button>
              
              {/* Mobile back button */}
              <button
                onClick={() => navigate('/')}
                className="sm:hidden p-2 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center flex-shrink-0">
                  <i className={`fas ${plugin?.icon || 'fa-atom'} text-white text-xs sm:text-sm`} />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-xl font-bold truncate">
                    {plugin?.name || 'Loading...'}
                  </h1>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowEducational(!showEducational)}
                icon={<Lightbulb size={16} />}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-0 hidden sm:flex"
              >
                Learn More
              </Button>
              
              {/* Mobile learn button */}
              <button
                onClick={() => setShowEducational(!showEducational)}
                className="sm:hidden p-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 text-white"
              >
                <Lightbulb size={16} />
              </button>
              
              <Button
                variant="ghost"
                size="sm"
                icon={<BookOpen size={16} />}
                onClick={() => navigate('/glossary')}
                className="hidden md:flex"
              >
                Glossary
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                icon={<Github size={16} />}
                onClick={() => window.open('https://github.com/ParleSec/QuantumFieldKit', '_blank')}
                className="hidden md:flex"
              >
                GitHub
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 min-h-[calc(100vh-12rem)]">
          
          {/* Left Sidebar - Parameters & Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-4 space-y-4 sm:space-y-6"
          >
            {/* Plugin Description */}
            <Card variant="elevated" padding="lg">
              <Card.Header>
                <Card.Title className="flex items-center gap-2">
                  <Zap size={20} className="text-primary-500" />
                  About This Simulation
                </Card.Title>
              </Card.Header>
              <Card.Content>
                <p className="text-neutral-700 leading-relaxed">
                  {pluginInfo?.description}
                </p>
              </Card.Content>
            </Card>

            {/* Parameter Form */}
            {plugin && (
              <EnhancedPluginParameterForm
                parameters={plugin.parameters}
                initialValues={currentParameters}
                onSubmit={handleRunSimulation}
                onParameterChange={handleParameterChange}
                loading={simulating}
              />
            )}

            {/* Quick Actions */}
            <Card variant="outlined" padding="md">
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-neutral-700 flex items-center gap-2">
                  <ExternalLink size={16} />
                  Quick Links
                </h4>
                <div className="space-y-2">
                  <Link
                    to="/glossary"
                    className="block text-sm text-neutral-600 hover:text-primary-600 transition-colors"
                  >
                    → Quantum Computing Glossary
                  </Link>
                  <a
                    href="https://quantum.country/qcvc"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-neutral-600 hover:text-primary-600 transition-colors"
                  >
                    → Learning Resources
                  </a>
                  <a
                    href="https://github.com/ParleSec/QuantumFieldKit"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-neutral-600 hover:text-primary-600 transition-colors"
                  >
                    → Documentation
                  </a>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Right Main Area - Results */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-8 min-w-0"
          >
            {/* Error Display */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6"
                >
                  <Card variant="outlined" padding="md" className="border-error-200 bg-error-50">
                    <div className="flex items-center gap-3">
                      <AlertCircle size={20} className="text-error-500 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-medium text-error-800">Simulation Error</h4>
                        <p className="text-sm text-error-700 mt-1">{error}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results Panel */}
            <EnhancedPluginResultsPanel
              result={result}
              loading={simulating}
              onExport={(data) => console.log('Export:', data)}
              onShare={(data) => console.log('Share:', data)}
            />
          </motion.div>
        </div>
      </div>

      {/* Enhanced Educational Content Overlay */}
      <AnimatePresence>
        {showEducational && educationalContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-2 sm:p-4"
            onClick={() => setShowEducational(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-neutral-900 rounded-2xl sm:rounded-3xl shadow-2xl max-w-6xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden border border-neutral-200 dark:border-neutral-700"
            >
              {/* Enhanced Header */}
              <div className="bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 p-4 sm:p-6 lg:p-8 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                      <Lightbulb size={20} className="sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-yellow-200" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold mb-1 truncate">Learn About {plugin?.name}</h2>
                      <p className="text-blue-100 text-sm sm:text-base lg:text-lg hidden sm:block">
                        Master quantum concepts through interactive learning
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowEducational(false)}
                    className="p-2 sm:p-3 hover:bg-white/20 rounded-lg sm:rounded-xl transition-all duration-200 hover:scale-105 group flex-shrink-0"
                  >
                    <X size={20} className="sm:w-6 sm:h-6 lg:w-7 lg:h-7 group-hover:rotate-90 transition-transform duration-200" />
                  </button>
                </div>
              </div>
              
              {/* Scrollable Content Container */}
              <div className="overflow-y-auto max-h-[calc(95vh-100px)] sm:max-h-[calc(90vh-140px)] bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-800">
                <div className="p-4 sm:p-6 lg:p-10 space-y-6 sm:space-y-8 lg:space-y-10">
                  
                  {/* Key Quantum Principles */}
                  <section className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 sm:p-6 border border-blue-200 dark:border-blue-800">
                    <h3 className="text-base sm:text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                      <Zap size={16} className="sm:w-5 sm:h-5 text-blue-600" />
                      Key Quantum Principles in {plugin?.name}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="bg-white/60 dark:bg-blue-800/30 p-4 rounded-lg">
                        <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">No-Cloning Theorem</h4>
                        <p className="text-blue-700 dark:text-blue-300 text-sm">Prevents perfect copying of quantum authentication tokens, making them inherently secure against duplication.</p>
                      </div>
                      <div className="bg-white/60 dark:bg-blue-800/30 p-4 rounded-lg">
                        <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Quantum Superposition</h4>
                        <p className="text-blue-700 dark:text-blue-300 text-sm">Allows encoding information in multiple quantum basis states simultaneously.</p>
                      </div>
                      <div className="bg-white/60 dark:bg-blue-800/30 p-4 rounded-lg">
                        <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Quantum Measurement</h4>
                        <p className="text-blue-700 dark:text-blue-300 text-sm">Ensures any unauthorized measurement attempt will disturb the quantum state.</p>
                      </div>
                      <div className="bg-white/60 dark:bg-blue-800/30 p-4 rounded-lg">
                        <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Quantum Entanglement</h4>
                        <p className="text-blue-700 dark:text-blue-300 text-sm">Can provide additional security by correlating authentication tokens across multiple systems.</p>
                      </div>
                    </div>
                  </section>

                  {/* How Algorithm Works */}
                  <section className="space-y-6">
                    <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-700 pb-2">
                      How {plugin?.name} Works
                    </h3>
                    
                    <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
                      <div
                        dangerouslySetInnerHTML={{ __html: educationalContent }}
                        className="prose prose-neutral dark:prose-invert max-w-none
                          prose-headings:text-neutral-900 dark:prose-headings:text-neutral-100 prose-headings:font-semibold prose-headings:mb-3 prose-headings:mt-4 first:prose-headings:mt-0
                          prose-h1:text-lg prose-h2:text-base prose-h3:text-sm prose-h4:text-sm
                          prose-p:text-neutral-700 dark:prose-p:text-neutral-300 prose-p:leading-6 prose-p:mb-3 prose-p:text-sm
                          prose-strong:text-neutral-900 dark:prose-strong:text-neutral-100 prose-strong:font-semibold
                          prose-em:text-neutral-600 dark:prose-em:text-neutral-400
                          prose-code:bg-neutral-100 dark:prose-code:bg-neutral-700 prose-code:text-neutral-800 dark:prose-code:text-neutral-200 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
                          prose-ul:space-y-1 prose-ol:space-y-1 prose-ul:my-3 prose-ol:my-3
                          prose-li:text-neutral-700 dark:prose-li:text-neutral-300 prose-li:text-sm prose-li:leading-5
                          prose-blockquote:border-l-2 prose-blockquote:border-neutral-300 dark:prose-blockquote:border-neutral-600 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-neutral-600 dark:prose-blockquote:text-neutral-400"
                      />
                    </div>
                  </section>

                  {/* Applications & Benefits */}
                  <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
                      <h4 className="font-semibold text-green-900 dark:text-green-100 mb-3 flex items-center gap-2">
                        <span className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">✓</span>
                        Security Advantages
                      </h4>
                      <ul className="space-y-2 text-sm text-green-800 dark:text-green-200">
                        <li>• Unforgeable quantum tokens</li>
                        <li>• Tamper-evident security</li>
                        <li>• Information-theoretic security</li>
                        <li>• One-time use protection</li>
                      </ul>
                    </div>
                    
                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-6 border border-orange-200 dark:border-orange-800">
                      <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-3 flex items-center gap-2">
                        <span className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs">⚡</span>
                        Practical Applications
                      </h4>
                      <ul className="space-y-2 text-sm text-orange-800 dark:text-orange-200">
                        <li>• Quantum key distribution</li>
                        <li>• Secure communications</li>
                        <li>• Identity verification</li>
                        <li>• Quantum fingerprinting</li>
                      </ul>
                    </div>
                  </section>



                  {/* Call to Action */}
                  <section className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-2xl p-8 text-center">
                    <div className="max-w-2xl mx-auto">
                      <h3 className="text-2xl font-bold mb-4 text-white">Ready to Experiment?</h3>
                      <p className="text-blue-100 mb-6 leading-relaxed">
                        Now that you understand the theory, it's time to see these quantum concepts in action. 
                        Try running the simulation with different parameters!
                      </p>
                      <button
                        onClick={() => setShowEducational(false)}
                        className="bg-white text-blue-700 hover:bg-blue-50 px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-0"
                      >
                        🚀 Start Experimenting
                      </button>
                    </div>
                  </section>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedPlugin;

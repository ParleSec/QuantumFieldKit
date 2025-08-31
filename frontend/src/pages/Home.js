import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Sparkles, ArrowRight, Zap, Shield, Cpu, Atom } from 'lucide-react';
import { fetchPlugins } from '../services/api';
import QuantumParticles from '../components/QuantumParticles';
import SkeletonLoader from '../components/SkeletonLoader';

function Home() {
  const [categories, setCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, -50]);


  const [heroRef, heroInView] = useInView({ threshold: 0.3, triggerOnce: true });
  const [categoriesRef, categoriesInView] = useInView({ threshold: 0.1, triggerOnce: true });

  useEffect(() => {
    const loadPlugins = async () => {
      try {
        const data = await fetchPlugins();
        setCategories(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    loadPlugins();
  }, []);

  const categoryIcons = {
    protocols: Zap,
    cryptography: Shield,
    algorithms: Cpu,
    'error-correction': Shield,
    utilities: Atom,
    security: Shield,
  };

  if (error) return (
    <div className="container mx-auto px-4 mt-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="alert alert-error max-w-md mx-auto"
      >
        Error: {error}
      </motion.div>
    </div>
  );

  return (
    <div className="overflow-hidden">
      {/* Revolutionary Hero Section with Glassmorphism */}
      <section 
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <QuantumParticles />
        
        {/* Glassmorphism overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent backdrop-blur-sm" style={{ zIndex: 2 }} />
        
        <motion.div 
          style={{ y: y1, zIndex: 3 }}
          className="relative text-center text-white px-4 max-w-4xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="mb-6"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="inline-block mb-4"
            >
              <Atom size={64} className="text-white/80" />
            </motion.div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-7xl font-black tracking-tight mb-6"
          >
            Quantum Field Kit
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-block ml-2"
            >
              <Sparkles className="inline" size={40} />
            </motion.span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto leading-relaxed"
          >
            Experience the future of quantum computing with our revolutionary simulation platform.
            Explore protocols, algorithms, and concepts with unprecedented scientific accuracy.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <motion.a
              href="#quantum-simulations"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn btn-lg bg-white/20 backdrop-blur-md border-white/30 text-white hover:bg-white/30 px-8 py-4 rounded-full font-semibold flex items-center gap-2 shadow-xl"
            >
              <Zap size={20} />
              Explore Simulations
              <ArrowRight size={20} />
            </motion.a>
            
            <motion.a
              href="https://github.com/ParleSec/QuantumFieldKit"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn btn-lg btn-outline border-white/30 text-white hover:bg-white/10 px-8 py-4 rounded-full font-semibold"
            >
              View Source
            </motion.a>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={heroInView ? { opacity: 1 } : {}}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/70"
          style={{ zIndex: 3 }}
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="flex flex-col items-center gap-2"
          >
            <span className="text-sm">Scroll to explore</span>
            <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-1 h-3 bg-white/50 rounded-full mt-2"
              />
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Enhanced Categories Section */}
      <section 
        id="quantum-simulations"
        ref={categoriesRef}
        className="py-20 bg-gradient-to-b from-base-100 to-base-200"
      >
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={categoriesInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Quantum Simulations
            </h2>
            <p className="text-xl text-base-content/70 max-w-2xl mx-auto">
              Dive into the quantum realm with our cutting-edge simulation categories
            </p>
          </motion.div>

          {loading ? (
            <SkeletonLoader type="grid" count={6} />
          ) : (
            <div className="space-y-16">
              {Object.entries(categories).map(([category, plugins], categoryIndex) => {
                const IconComponent = categoryIcons[category] || Atom;
                
                return (
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, y: 50 }}
                    animate={categoriesInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8, delay: categoryIndex * 0.2 }}
                  >
                    <div className="flex items-center gap-4 mb-8">
                      <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                        className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center"
                      >
                        <IconComponent size={24} className="text-white" />
                      </motion.div>
                      <h3 className="text-2xl md:text-3xl font-bold">
                        {category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </h3>
                    </div>
                    
                    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                      {plugins.map((plugin, pluginIndex) => (
                        <motion.div
                          key={plugin.key}
                          initial={{ opacity: 0, y: 30 }}
                          animate={categoriesInView ? { opacity: 1, y: 0 } : {}}
                          transition={{ 
                            duration: 0.5, 
                            delay: categoryIndex * 0.2 + pluginIndex * 0.1 
                          }}
                          whileHover={{ y: -5 }}
                          className="group"
                        >
                          <div className="card bg-base-100 border border-base-200 shadow-lg hover:shadow-xl transition-all duration-300 h-full backdrop-blur-sm bg-white/50">
                            <div className="card-body">
                              <div className="flex items-center mb-4">
                                <motion.div
                                  whileHover={{ scale: 1.1, rotate: 5 }}
                                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mr-4 group-hover:from-primary/30 group-hover:to-secondary/30 transition-all"
                                >
                                  <i className={`fas ${plugin.icon} text-primary text-lg`}></i>
                                </motion.div>
                                <h5 className="card-title text-lg font-semibold">{plugin.name}</h5>
                              </div>
                              
                              <p className="text-base-content/70 mb-6 leading-relaxed">
                                {plugin.description}
                              </p>
                              
                              <Link 
                                to={`/plugin/${plugin.key}`}
                                className="btn btn-primary group-hover:btn-secondary transition-all mt-auto"
                              >
                                <motion.span
                                  whileHover={{ x: 5 }}
                                  className="flex items-center gap-2"
                                >
                                  Run Simulation
                                  <ArrowRight size={16} />
                                </motion.span>
                              </Link>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Home; 
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Zap, BookOpen, Github, Settings } from 'lucide-react';

const FloatingActionButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    //{ icon: Search, label: 'Search', action: () => console.log('Search') },
    //{ icon: Zap, label: 'Quick Run', action: () => console.log('Quick Run') },
    { icon: BookOpen, label: 'Docs', action: () => window.open('/glossary', '_blank') },
    { icon: Github, label: 'GitHub', action: () => window.open('https://github.com/ParleSec/QuantumFieldKit', '_blank') },
    //{ icon: Settings, label: 'Settings', action: () => console.log('Settings') },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute bottom-16 right-0 space-y-3"
          >
            {actions.map((action, index) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, x: 20 }}
                animate={{ 
                  opacity: 1, 
                  x: 0,
                  transition: { delay: index * 0.1 }
                }}
                exit={{ 
                  opacity: 0, 
                  x: 20,
                  transition: { delay: (actions.length - index) * 0.05 }
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={action.action}
                className="flex items-center gap-3 bg-white/90 backdrop-blur-md rounded-full px-4 py-3 shadow-lg border border-white/20 hover:bg-white/95 transition-all group"
              >
                <action.icon size={20} className="text-primary group-hover:text-primary-focus" />
                <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  {action.label}
                </span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-r from-primary to-secondary rounded-full shadow-lg flex items-center justify-center text-white hover:shadow-xl transition-all"
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 10 }}
        >
          <Zap size={24} />
        </motion.div>
      </motion.button>
    </div>
  );
};

export default FloatingActionButton;

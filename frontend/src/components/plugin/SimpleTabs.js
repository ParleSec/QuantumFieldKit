import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';

const SimpleTabs = ({ tabs, defaultTab = null }) => {
  const [activeTab, setActiveTab] = useState(defaultTab || (tabs.length > 0 ? tabs[0].id : ''));

  return (
    <div className="w-full">
      {/* Tab Headers */}
      <div className="flex bg-neutral-100 rounded-lg p-1 mb-4 gap-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 px-3 py-3 sm:px-4 sm:py-2 rounded-md border-0 text-sm font-medium cursor-pointer transition-all duration-200 whitespace-nowrap min-h-[44px] sm:min-h-[36px] flex-1 sm:flex-initial
              ${activeTab === tab.id 
                ? 'bg-white text-neutral-900 shadow-sm' 
                : 'bg-transparent text-neutral-600 hover:text-neutral-800'
              }
            `}
          >
            {tab.icon}
            <span className="hidden sm:inline">
              {tab.label}
            </span>
            <span className="sm:hidden">
              {tab.label.split(' ')[0]}
            </span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {tabs.map((tab) => (
          activeTab === tab.id && (
            <motion.div
              key={tab.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {tab.content}
            </motion.div>
          )
        ))}
      </AnimatePresence>
    </div>
  );
};

SimpleTabs.propTypes = {
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.node,
      content: PropTypes.node.isRequired,
    })
  ).isRequired,
  defaultTab: PropTypes.string,
};

export default SimpleTabs;

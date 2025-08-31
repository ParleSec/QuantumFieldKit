import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';

const SimpleTabs = ({ tabs, defaultTab = null }) => {
  const [activeTab, setActiveTab] = useState(defaultTab || (tabs.length > 0 ? tabs[0].id : ''));

  return (
    <div style={{ width: '100%' }}>
      {/* Tab Headers */}
      <div 
        style={{
          display: 'flex',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          padding: '4px',
          marginBottom: '24px',
          gap: '4px'
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: activeTab === tab.id ? '#ffffff' : 'transparent',
              color: activeTab === tab.id ? '#111827' : '#6b7280',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: activeTab === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            {tab.icon}
            {tab.label}
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

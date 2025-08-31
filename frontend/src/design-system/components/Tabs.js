import React, { useState, createContext, useContext } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

const TabsContext = createContext();

const Tabs = ({ children, defaultValue, value, onValueChange, className = '' }) => {
  const [activeTab, setActiveTab] = useState(defaultValue || value);
  
  const handleTabChange = (newValue) => {
    if (value === undefined) {
      setActiveTab(newValue);
    }
    onValueChange?.(newValue);
  };

  const currentValue = value !== undefined ? value : activeTab;

  return (
    <TabsContext.Provider value={{ activeTab: currentValue, setActiveTab: handleTabChange }}>
      <div className={`w-full ${className}`}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

const TabsList = ({ children, className = '' }) => {
  return (
    <div 
      className={`inline-flex h-10 items-center justify-center rounded-lg bg-neutral-100 p-1 text-neutral-500 ${className}`}
      style={{ 
        display: 'inline-flex', 
        height: '2.5rem', 
        alignItems: 'center', 
        justifyContent: 'center', 
        borderRadius: '0.5rem', 
        backgroundColor: '#f5f5f5', 
        padding: '0.25rem',
        color: '#6b7280'
      }}
    >
      {children}
    </div>
  );
};

const TabsTrigger = ({ children, value, className = '' }) => {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  const isActive = activeTab === value;

  return (
    <button
      type="button"
      onClick={() => setActiveTab(value)}
      className={`
        inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium 
        ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 
        focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:pointer-events-none 
        disabled:opacity-50 relative
        ${isActive 
          ? 'bg-white text-neutral-950 shadow-sm' 
          : 'hover:bg-white/50 hover:text-neutral-900'
        }
        ${className}
      `}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        whiteSpace: 'nowrap',
        borderRadius: '0.375rem',
        padding: '0.375rem 0.75rem',
        fontSize: '0.875rem',
        fontWeight: '500',
        transition: 'all 0.2s',
        position: 'relative',
        backgroundColor: isActive ? '#ffffff' : 'transparent',
        color: isActive ? '#111827' : '#6b7280',
        boxShadow: isActive ? '0 1px 2px 0 rgb(0 0 0 / 0.05)' : 'none',
        border: 'none',
        cursor: 'pointer'
      }}
    >
      {children}
      {isActive && (
        <motion.div
          layoutId="activeTab"
          className="absolute inset-0 bg-white rounded-md shadow-sm"
          style={{ zIndex: -1 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}
    </button>
  );
};

const TabsContent = ({ children, value, className = '' }) => {
  const { activeTab } = useContext(TabsContext);
  
  if (activeTab !== value) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={`mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 ${className}`}
    >
      {children}
    </motion.div>
  );
};

Tabs.propTypes = {
  children: PropTypes.node.isRequired,
  defaultValue: PropTypes.string,
  value: PropTypes.string,
  onValueChange: PropTypes.func,
  className: PropTypes.string,
};

TabsList.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

TabsTrigger.propTypes = {
  children: PropTypes.node.isRequired,
  value: PropTypes.string.isRequired,
  className: PropTypes.string,
};

TabsContent.propTypes = {
  children: PropTypes.node.isRequired,
  value: PropTypes.string.isRequired,
  className: PropTypes.string,
};

Tabs.List = TabsList;
Tabs.Trigger = TabsTrigger;
Tabs.Content = TabsContent;

export default Tabs;

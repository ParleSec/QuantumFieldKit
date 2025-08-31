import React from 'react';
import PropTypes from 'prop-types';
import './PluginLayout.css';

const PluginLayout = ({ sidebar, children }) => (
  <div className="container mx-auto px-4 plugin-layout">
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <aside className="lg:col-span-3 xl:col-span-2 plugin-sidebar">
        {sidebar}
      </aside>
      <main className="lg:col-span-9 xl:col-span-10 plugin-main-content">
        {children}
      </main>
    </div>
  </div>
);

PluginLayout.propTypes = {
  sidebar: PropTypes.node,
  children: PropTypes.node,
};

export default PluginLayout; 
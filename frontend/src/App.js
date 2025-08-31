import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Plugin from './pages/Plugin';
import EnhancedPlugin from './pages/EnhancedPlugin';
import Glossary from './pages/Glossary';
import Category from './pages/Category';
import CircuitDesigner from './pages/CircuitDesigner';
import Error from './pages/Error';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import FloatingActionButton from './components/FloatingActionButton';
import ErrorBoundary from './components/ErrorBoundary';
import analytics from './services/analytics';

function App() {
  const location = useLocation();

  // Initialize Google Analytics
  useEffect(() => {
    analytics.initialize();
  }, []);

  // Track page views on route changes
  useEffect(() => {
    const getPageTitle = (pathname) => {
      const routes = {
        '/': 'Home - Quantum Field Kit',
        '/glossary': 'Glossary - Quantum Field Kit',
        '/circuit-designer': 'Circuit Designer - Quantum Field Kit'
      };

      // Handle dynamic routes
      if (pathname.startsWith('/plugin/')) {
        const pluginKey = pathname.split('/')[2];
        return `${pluginKey} Plugin - Quantum Field Kit`;
      }
      
      if (pathname.startsWith('/legacy-plugin/')) {
        const pluginKey = pathname.split('/')[2];
        return `${pluginKey} Legacy Plugin - Quantum Field Kit`;
      }
      
      if (pathname.startsWith('/category/')) {
        const category = pathname.split('/')[2];
        return `${category} Category - Quantum Field Kit`;
      }

      return routes[pathname] || 'Quantum Field Kit';
    };

    const title = getPageTitle(location.pathname);
    analytics.trackPageView(location.pathname, title);
  }, [location]);

  return (
    <ErrorBoundary>
      <div className="App app-shell min-h-screen bg-base-100 text-base-content">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/plugin/:pluginKey" element={<EnhancedPlugin />} />
            <Route path="/legacy-plugin/:pluginKey" element={<Plugin />} />
            <Route path="/glossary" element={<Glossary />} />
            <Route path="/category/:category" element={<Category />} />
            <Route path="/circuit-designer" element={<CircuitDesigner />} />
            <Route path="*" element={<Error />} />
          </Routes>
        </main>
        <Footer />
        <FloatingActionButton />
      </div>
    </ErrorBoundary>
  );
}

export default App; 
import React from 'react';
import { Routes, Route } from 'react-router-dom';
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

function App() {
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
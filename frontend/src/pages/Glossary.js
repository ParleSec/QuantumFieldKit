import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchGlossary } from '../services/api';
import { ChevronDown, Search, BookOpen, Tag, Filter, X } from 'lucide-react';
import { Card } from '../design-system';
import SkeletonLoader from '../components/SkeletonLoader';
import analytics from '../services/analytics';

// Component to render mathematical notation properly
const MathText = ({ text }) => {
  const formatMath = (str) => {
    return str
      .replace(/sqrt\(([^)]+)\)/g, '√$1')
      .replace(/\|([01])\>/g, '|$1⟩')
      .replace(/O\(sqrt\(N\)\)/g, 'O(√N)')
      .replace(/O\(N\)/g, 'O(N)');
  };

  return <span>{formatMath(text)}</span>;
};

function Glossary() {
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('alphabetical');

  useEffect(() => {
    const loadGlossary = async () => {
      try {
        const data = await fetchGlossary();
        setTerms(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    loadGlossary();
  }, []);

  const toggleExpanded = (index) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const expandAll = () => {
    setExpandedItems(new Set(filteredTerms.map((_, index) => index)));
  };

  const collapseAll = () => {
    setExpandedItems(new Set());
  };

  // Get unique categories from terms
  const categories = [...new Set(terms.map(term => term.category || 'General'))];

  // Filter and sort terms
  const filteredTerms = terms
    .filter(term => {
      const matchesSearch = term.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           term.definition.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (term.tags && term.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
      const matchesCategory = selectedCategory === 'all' || (term.category || 'General') === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'alphabetical') {
        return a.term.localeCompare(b.term);
      } else if (sortBy === 'category') {
        return (a.category || 'General').localeCompare(b.category || 'General');
      }
      return 0;
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-base-200 via-base-100 to-base-200">
        <div className="container mx-auto px-4 py-8">
          <SkeletonLoader />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-base-200 via-base-100 to-base-200">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto text-center p-8">
            <div className="text-red-500 mb-4">
              <BookOpen size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
              Error Loading Glossary
            </h3>
            <p className="text-neutral-600 dark:text-neutral-200">
              {error}
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-200 via-base-100 to-base-200">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6">
            <BookOpen size={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Quantum Computing Glossary
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto">
            Explore comprehensive definitions of quantum computing concepts, algorithms, and terminology.
          </p>
        </motion.div>

        {/* Search and Filter Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={20} className="text-neutral-400 dark:text-neutral-200" />
                </div>
                <input
                  type="text"
                  className="w-full pl-10 pr-10 py-3 border border-neutral-300 dark:border-neutral-500 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Search terms, definitions, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 dark:text-neutral-200 hover:text-neutral-600 dark:hover:text-neutral-100"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>

              {/* Category Filter */}
              <div className="flex gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-3 border border-neutral-300 dark:border-neutral-500 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-3 border border-neutral-300 dark:border-neutral-500 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="alphabetical">A-Z</option>
                  <option value="category">By Category</option>
                </select>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-500">
              <button
                onClick={expandAll}
                className="px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors"
              >
                Expand All
              </button>
              <button
                onClick={collapseAll}
                className="px-3 py-1.5 text-sm bg-neutral-100 dark:bg-neutral-600 text-neutral-700 dark:text-neutral-100 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-500 transition-colors"
              >
                Collapse All
              </button>
              <div className="text-sm text-neutral-500 dark:text-neutral-200 flex items-center ml-auto">
                {filteredTerms.length} term{filteredTerms.length !== 1 ? 's' : ''} found
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Glossary Terms */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <AnimatePresence>
            {filteredTerms.map((term, index) => (
              <motion.div
                key={`${term.term}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
                  <button
                    onClick={() => toggleExpanded(index)}
                    className="w-full p-6 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {term.term.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                            {term.term}
                          </h3>
                          {term.category && (
                            <div className="flex items-center mt-1">
                              <Tag size={14} className="text-neutral-400 dark:text-neutral-200 mr-1" />
                              <span className="text-sm text-neutral-500 dark:text-neutral-200">
                                {term.category}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <motion.div
                        animate={{ rotate: expandedItems.has(index) ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown size={20} className="text-neutral-400 dark:text-neutral-200" />
                      </motion.div>
                    </div>
                  </button>

                  <AnimatePresence>
                    {expandedItems.has(index) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6 border-t border-neutral-200 dark:border-neutral-500 pt-4">
                          <p className="text-neutral-700 dark:text-neutral-100 leading-relaxed">
                            <MathText text={term.definition} />
                          </p>
                          {term.tags && term.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-4">
                              {term.tags.map((tag, tagIndex) => (
                                <span
                                  key={tagIndex}
                                  className="px-2 py-1 text-xs bg-neutral-100 dark:bg-neutral-600 text-neutral-600 dark:text-neutral-100 rounded-md"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredTerms.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Card className="max-w-md mx-auto p-8">
                <Search size={48} className="text-neutral-400 dark:text-neutral-200 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                  No terms found
                </h3>
                <p className="text-neutral-600 dark:text-neutral-200">
                  Try adjusting your search criteria or browse all terms.
                </p>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default Glossary; 
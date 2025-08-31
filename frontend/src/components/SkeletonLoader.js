import React from 'react';
import { motion } from 'framer-motion';

const SkeletonCard = () => (
  <div className="card bg-base-100 border border-base-200 shadow-sm">
    <div className="card-body">
      <div className="flex items-center mb-3">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-10 h-10 rounded-full bg-base-300 mr-3"
        />
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
          className="h-6 bg-base-300 rounded w-32"
        />
      </div>
      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
        className="space-y-2 mb-4"
      >
        <div className="h-4 bg-base-300 rounded w-full" />
        <div className="h-4 bg-base-300 rounded w-3/4" />
      </motion.div>
      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
        className="h-10 bg-base-300 rounded w-32"
      />
    </div>
  </div>
);

const SkeletonGrid = ({ count = 6 }) => (
  <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: count }, (_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

const SkeletonLoader = ({ type = 'grid', count }) => {
  if (type === 'grid') {
    return <SkeletonGrid count={count} />;
  }

  return <SkeletonCard />;
};

export default SkeletonLoader;

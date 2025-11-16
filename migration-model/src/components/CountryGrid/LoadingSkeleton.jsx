/**
 * Loading Skeleton Component
 */

import React from 'react';
import { motion } from 'framer-motion';
import { skeletonPulse } from '../../animations/variants';

const LoadingSkeleton = ({ count = 24, layout = 'grid' }) => {
  const items = Array(count).fill(0);

  if (layout === 'grid') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {items.map((_, i) => (
          <motion.div
            key={i}
            variants={skeletonPulse}
            animate="animate"
            transition={{ delay: i * 0.05 }}
            className="h-12 bg-slate-700/50 rounded"
          />
        ))}
      </div>
    );
  }

  if (layout === 'list') {
    return (
      <div className="space-y-3">
        {items.map((_, i) => (
          <motion.div
            key={i}
            variants={skeletonPulse}
            animate="animate"
            transition={{ delay: i * 0.05 }}
            className="h-16 bg-slate-700/50 rounded"
          />
        ))}
      </div>
    );
  }

  return null;
};

export const SkeletonCard = ({ width = '100%', height = '200px', delay = 0 }) => {
  return (
    <motion.div
      variants={skeletonPulse}
      animate="animate"
      transition={{ delay }}
      style={{ width, height }}
      className="bg-slate-700/50 rounded-lg"
    />
  );
};

export const SkeletonText = ({ lines = 3, delay = 0 }) => {
  return (
    <div className="space-y-2">
      {Array(lines).fill(0).map((_, i) => (
        <motion.div
          key={i}
          variants={skeletonPulse}
          animate="animate"
          transition={{ delay: delay + i * 0.05 }}
          className="h-4 bg-slate-700/50 rounded"
          style={{ width: i === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  );
};

export default LoadingSkeleton;
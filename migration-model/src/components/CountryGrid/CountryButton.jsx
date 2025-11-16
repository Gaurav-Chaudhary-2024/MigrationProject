/**
 * Country Button Component
 * NO spring animations per user request
 */

import React from 'react';
import { motion } from 'framer-motion';

const CountryButton = ({
  country,
  isSelected,
  isJustSelected,
  onToggle,
  delay = 0,
  virtualized = false
}) => {
  const buttonVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { 
        delay: virtualized ? 0 : delay,
        duration: 0.3 
      }
    }
  };

  return (
    <motion.button
      onClick={() => onToggle(country)}
      variants={buttonVariants}
      initial={!virtualized ? "initial" : false}
      animate={isJustSelected ? { scale: [1, 1.08, 1] } : "animate"}
      whileHover={{ 
        scale: 1.03, 
        y: -2,
        transition: { duration: 0.2 }
      }}
      whileTap={{ 
        scale: 0.97,
        transition: { duration: 0.1 }
      }}
      transition={{ duration: 0.3 }}
      style={{ width: virtualized ? '100%' : 'auto', height: virtualized ? '100%' : 'auto' }}
      className={`
        px-3 py-2 rounded text-sm font-medium
        transition-all duration-300
        ${isSelected
          ? 'bg-gradient-to-r from-green-600 to-emerald-500 shadow-lg text-white ring-2 ring-green-400/50'
          : 'bg-slate-700 hover:bg-slate-600 text-slate-100 hover:shadow-md'
        }
      `}
    >
      {country}
    </motion.button>
  );
};

export default CountryButton;
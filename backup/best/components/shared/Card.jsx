/**
 * Reusable Card Component with animations
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cardHover, cardGlowHover } from '../../animations/variants';

export const Card = ({ 
  children, 
  className = '', 
  hover = 'lift',
  glow = false,
  onClick,
  ...props 
}) => {
  const hoverVariant = glow ? cardGlowHover : cardHover;

  return (
    <motion.div
      className={`bg-slate-800 rounded-lg border border-slate-700 ${className}`}
      initial="rest"
      whileHover="hover"
      variants={hoverVariant}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const MetricCard = ({ 
  label, 
  value, 
  description, 
  color = 'text-green-400',
  icon: Icon,
  delay = 0 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ scale: 1.02, y: -4 }}
      className="bg-slate-800 p-4 rounded-lg border border-slate-700 cursor-pointer"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-slate-400">{label}</div>
        {Icon && <Icon size={18} className={color} />}
      </div>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: delay + 0.1, type: "spring", stiffness: 200 }}
        className={`text-2xl font-bold ${color}`}
      >
        {value}
      </motion.div>
      {description && (
        <div className="text-xs text-slate-500 mt-1">{description}</div>
      )}
    </motion.div>
  );
};

export const GlowCard = ({ 
  children, 
  className = '',
  glowColor = 'rgba(16, 185, 129, 0.4)',
  ...props 
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <motion.div
      className={`bg-slate-800 rounded-lg border border-slate-700 transition-all duration-300 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      animate={{
        boxShadow: isHovered
          ? `0 8px 30px ${glowColor}`
          : '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}
      transition={{ duration: 0.3 }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default Card;
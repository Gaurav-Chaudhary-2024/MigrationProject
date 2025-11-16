/**
 * Reusable Button Component with animations
 */

import React from 'react';
import { motion } from 'framer-motion';
import { buttonPrimary } from '../../animations/variants';

export const Button = ({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'medium',
  icon: Icon,
  loading = false,
  className = '',
  ...props
}) => {
  const baseClasses = 'flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200';
  
  const variantClasses = {
    primary: 'bg-green-600 hover:bg-green-700 text-white shadow-lg',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-white',
    outline: 'border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white',
    ghost: 'bg-transparent hover:bg-slate-800 text-slate-300',
    danger: 'bg-red-600 hover:bg-red-700 text-white'
  };
  
  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg'
  };
  
  const disabledClasses = 'bg-slate-600 cursor-not-allowed opacity-50';

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${baseClasses}
        ${disabled || loading ? disabledClasses : variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      initial="rest"
      whileHover={disabled || loading ? {} : "hover"}
      whileTap={disabled || loading ? {} : "tap"}
      variants={buttonPrimary}
      {...props}
    >
      {loading ? (
        <>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
          />
          Loading...
        </>
      ) : (
        <>
          {Icon && <Icon size={size === 'small' ? 16 : size === 'large' ? 24 : 18} />}
          {children}
        </>
      )}
    </motion.button>
  );
};

export const IconButton = ({
  icon: Icon,
  onClick,
  tooltip,
  size = 'medium',
  variant = 'ghost',
  className = '',
  ...props
}) => {
  const sizeClasses = {
    small: 'p-1.5',
    medium: 'p-2.5',
    large: 'p-3.5'
  };

  const iconSizes = {
    small: 16,
    medium: 20,
    large: 24
  };

  return (
    <motion.button
      onClick={onClick}
      className={`
        rounded-lg transition-colors
        ${variant === 'ghost' ? 'hover:bg-slate-700' : 'bg-slate-700 hover:bg-slate-600'}
        ${sizeClasses[size]}
        ${className}
      `}
      whileHover={{ scale: 1.05, rotate: variant === 'ghost' ? 0 : 5 }}
      whileTap={{ scale: 0.95 }}
      title={tooltip}
      {...props}
    >
      {Icon && <Icon size={iconSizes[size]} />}
    </motion.button>
  );
};

export default Button;
/**
 * Scroll Progress Indicator Component
 */

import React from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';

export const ScrollProgressBar = ({ 
  color = '#10b981',
  height = 3,
  position = 'top',
  ...props 
}) => {
  // Use useScroll directly here instead of through a hook
  const { scrollYProgress } = useScroll();
  
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const positionStyles = {
    top: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1020
    },
    bottom: {
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 1020
    }
  };

  return (
    <div
      style={{
        ...positionStyles[position],
        height: `${height}px`,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(10px)'
      }}
      {...props}
    >
      <motion.div
        style={{
          scaleX,
          transformOrigin: '0%',
          height: '100%',
          background: `linear-gradient(90deg, ${color}, ${color}dd)`
        }}
      />
    </div>
  );
};

export const CircularScrollProgress = ({ 
  size = 60,
  strokeWidth = 4,
  color = '#10b981'
}) => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });
  
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const unsubscribe = scaleX.on('change', (v) => setProgress(v * 100));
    return () => unsubscribe();
  }, [scaleX]);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: progress > 5 ? 1 : 0, scale: progress > 5 ? 1 : 0.8 }}
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 1030,
        width: size,
        height: size
      }}
    >
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(71, 85, 105, 0.3)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{
            transition: 'stroke-dashoffset 0.3s ease'
          }}
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          fill="#fff"
          fontSize="12"
          fontWeight="bold"
        >
          {Math.round(progress)}%
        </text>
      </svg>
    </motion.div>
  );
};

export default ScrollProgressBar;
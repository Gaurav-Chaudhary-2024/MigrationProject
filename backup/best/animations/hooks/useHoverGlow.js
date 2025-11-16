/**
 * useHoverGlow Hook
 * Creates gradient glow effects on hover
 */

import { useState, useCallback } from 'react';
import { GLOW_COLORS, TIMING } from '../config';

/**
 * Main hover glow hook
 */
export const useHoverGlow = (options = {}) => {
  const {
    color = GLOW_COLORS.PRIMARY,
    intensity = 0.4,
    spread = 30,
    transition = TIMING.NORMAL
  } = options;

  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  const glowStyle = {
    boxShadow: isHovered 
      ? `0 0 ${spread}px ${color}` 
      : 'none',
    transition: `box-shadow ${transition}ms ease-in-out`
  };

  return {
    isHovered,
    handleMouseEnter,
    handleMouseLeave,
    glowStyle
  };
};

export default useHoverGlow;
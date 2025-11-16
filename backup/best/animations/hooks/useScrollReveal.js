/**
 * useScrollReveal Hook
 * Detects when elements enter viewport and triggers reveal animations
 */

import { useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";

/**
 * Custom hook for scroll-triggered reveal animations
 */
export const useScrollReveal = (options = {}) => {
  const ref = useRef(null);
  const [hasBeenInView, setHasBeenInView] = useState(false);

  const {
    once = true,
    margin = "-100px",
    threshold = 0.1,
    delay = 0,
  } = options;

  const isInView = useInView(ref, {
    once,
    margin,
    amount: threshold,
  });

  useEffect(() => {
    if (isInView && !hasBeenInView) {
      if (delay > 0) {
        const timer = setTimeout(() => {
          setHasBeenInView(true);
        }, delay);
        return () => clearTimeout(timer);
      } else {
        setHasBeenInView(true);
      }
    }
  }, [isInView, hasBeenInView, delay]);

  return {
    ref,
    isInView: delay > 0 ? hasBeenInView : isInView,
    hasBeenInView,
  };
};

/**
 * Hook for staggered scroll reveals (useful for lists)
 */
export const useStaggeredScrollReveal = (index, options = {}) => {
  const { baseDelay = 0, staggerDelay = 50, ...restOptions } = options;

  const totalDelay = baseDelay + index * staggerDelay;

  return useScrollReveal({
    ...restOptions,
    delay: totalDelay,
  });
};

export default useScrollReveal;

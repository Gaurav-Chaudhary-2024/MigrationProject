/**
 * Animation configuration constants
 * Centralized timing, easing, and animation settings
 */

// Timing constants (in milliseconds)
export const TIMING = {
  INSTANT: 100,
  FAST: 200,
  NORMAL: 300,
  MEDIUM: 400,
  SLOW: 600,
  VERY_SLOW: 800,
  EXTRA_SLOW: 1000
};

// Easing functions
export const EASING = {
  LINEAR: [0, 0, 1, 1],
  EASE: [0.25, 0.1, 0.25, 1],
  EASE_IN: [0.42, 0, 1, 1],
  EASE_OUT: [0, 0, 0.58, 1],
  EASE_IN_OUT: [0.42, 0, 0.58, 1],
  BOUNCE: [0.68, -0.55, 0.265, 1.55],
  SMOOTH: [0.4, 0, 0.2, 1],
  SPRING: [0.16, 1, 0.3, 1]
};

// Spring physics configurations
export const SPRING = {
  GENTLE: {
    type: "spring",
    stiffness: 100,
    damping: 15
  },
  NORMAL: {
    type: "spring",
    stiffness: 260,
    damping: 20
  },
  SNAPPY: {
    type: "spring",
    stiffness: 400,
    damping: 25
  },
  BOUNCY: {
    type: "spring",
    stiffness: 300,
    damping: 10
  },
  STIFF: {
    type: "spring",
    stiffness: 500,
    damping: 30
  }
};

// Stagger delays (in seconds)
export const STAGGER = {
  FAST: 0.03,
  NORMAL: 0.05,
  MEDIUM: 0.1,
  SLOW: 0.15
};

// Scroll reveal thresholds
export const SCROLL_REVEAL = {
  THRESHOLD: 0.1,
  MARGIN: "-100px",
  ONCE: true
};

// Animation distances (in pixels)
export const DISTANCE = {
  SMALL: 10,
  MEDIUM: 20,
  LARGE: 30,
  XLARGE: 50
};

// Scale values
export const SCALE = {
  TINY: 0.95,
  SMALL: 0.98,
  HOVER: 1.02,
  MEDIUM: 1.05,
  LARGE: 1.1,
  XLARGE: 1.2
};

// Opacity values
export const OPACITY = {
  HIDDEN: 0,
  FAINT: 0.3,
  MEDIUM: 0.6,
  VISIBLE: 1
};

// Colors for glow effects
export const GLOW_COLORS = {
  PRIMARY: "rgba(16, 185, 129, 0.4)",
  PRIMARY_STRONG: "rgba(16, 185, 129, 0.6)",
  SUCCESS: "rgba(34, 197, 94, 0.4)",
  ERROR: "rgba(239, 68, 68, 0.4)",
  WARNING: "rgba(245, 158, 11, 0.4)",
  INFO: "rgba(59, 130, 246, 0.4)",
  NEUTRAL: "rgba(0, 0, 0, 0.15)"
};

// Shadow configurations
export const SHADOWS = {
  SMALL: "0 2px 4px rgba(0, 0, 0, 0.1)",
  MEDIUM: "0 4px 6px rgba(0, 0, 0, 0.1)",
  LARGE: "0 10px 15px rgba(0, 0, 0, 0.1)",
  XLARGE: "0 20px 25px rgba(0, 0, 0, 0.15)",
  GLOW_PRIMARY: "0 8px 30px rgba(16, 185, 129, 0.4)",
  GLOW_STRONG: "0 10px 40px rgba(16, 185, 129, 0.6)"
};

// Z-index layers
export const Z_INDEX = {
  BASE: 0,
  DROPDOWN: 1000,
  STICKY: 1020,
  FIXED: 1030,
  MODAL_BACKDROP: 1040,
  MODAL: 1050,
  POPOVER: 1060,
  TOOLTIP: 1070,
  NOTIFICATION: 1080,
  CELEBRATION: 9999
};

// Breakpoints (matches Tailwind defaults)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  XXL: 1536
};

// Animation presets for common use cases
export const PRESETS = {
  FADE_IN: {
    duration: TIMING.NORMAL,
    ease: EASING.EASE_OUT
  },
  SLIDE_UP: {
    duration: TIMING.MEDIUM,
    ease: EASING.SMOOTH
  },
  SCALE_IN: {
    duration: TIMING.FAST,
    ease: EASING.EASE_OUT
  },
  BUTTON_PRESS: {
    duration: TIMING.INSTANT,
    ease: EASING.EASE_IN_OUT
  },
  LOADING: {
    duration: TIMING.SLOW,
    repeat: Infinity,
    ease: EASING.LINEAR
  }
};

// Reduced motion preferences
export const REDUCED_MOTION = {
  enabled: false,
  fallbackDuration: 10
};

// Performance settings
export const PERFORMANCE = {
  ENABLE_GPU: true,
  LAZY_LOAD_THRESHOLD: 0.1,
  THROTTLE_SCROLL: 16,
  DEBOUNCE_RESIZE: 150
};

// Celebration animation config
export const CELEBRATION = {
  DURATION: 2000,
  PARTICLE_COUNT: 1,
  COLORS: ['#10b981', '#34d399', '#059669', '#6ee7b7']
};

// Progress indicator config
export const PROGRESS = {
  MIN_DURATION: 300,
  SMOOTH_FACTOR: 0.3,
  UPDATE_INTERVAL: 100
};

// Tooltip config
export const TOOLTIP = {
  DELAY: 200,
  DURATION: [200, 150],
  OFFSET: 10
};

// Scroll progress indicator
export const SCROLL_PROGRESS = {
  HEIGHT: 3,
  COLOR: '#10b981',
  SMOOTH: true,
  STIFFNESS: 100,
  DAMPING: 30
};

// Export helper function to check reduced motion
export const shouldReduceMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Export helper to get duration based on motion preference
export const getDuration = (normalDuration) => {
  return shouldReduceMotion() ? REDUCED_MOTION.fallbackDuration : normalDuration;
};

// Export helper to conditionally apply animations
export const getAnimationProps = (normalProps) => {
  if (shouldReduceMotion()) {
    return {
      ...normalProps,
      transition: { duration: 0.01 }
    };
  }
  return normalProps;
};
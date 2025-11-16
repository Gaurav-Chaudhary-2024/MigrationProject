/**
 * Centralized Framer Motion animation variants
 * All animation configurations for consistent behavior across components
 */

// Basic transitions
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.3 }
};

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.4 }
};

export const fadeInDown = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: { duration: 0.4 }
};

export const slideInLeft = {
  initial: { opacity: 0, x: -30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 30 },
  transition: { duration: 0.4 }
};

export const slideInRight = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
  transition: { duration: 0.4 }
};

// Scale animations
export const scaleIn = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
  transition: { duration: 0.3 }
};

export const scalePop = {
  initial: { scale: 0 },
  animate: { scale: 1 },
  exit: { scale: 0 },
  transition: { 
    type: "spring",
    stiffness: 260,
    damping: 20
  }
};

// Hover states
export const hoverLift = {
  rest: { scale: 1, y: 0 },
  hover: { 
    scale: 1.02, 
    y: -2,
    transition: { duration: 0.2 }
  }
};

export const hoverScale = {
  rest: { scale: 1 },
  hover: { 
    scale: 1.05,
    transition: { duration: 0.2 }
  }
};

export const hoverGlow = {
  rest: { 
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" 
  },
  hover: { 
    boxShadow: "0 10px 25px rgba(16, 185, 129, 0.3)",
    transition: { duration: 0.3 }
  }
};

// Stagger animations
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

export const staggerFastContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05
    }
  }
};

export const staggerSlowContainer = {
  animate: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
};

export const staggerItem = {
  initial: { opacity: 0, y: 10 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4 }
  }
};

// Error animations
export const shakeError = {
  initial: { x: 0 },
  animate: { 
    x: [0, -10, 10, -10, 10, 0],
    transition: { duration: 0.4 }
  }
};

export const pulseError = {
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 0.5,
      repeat: 2
    }
  }
};

// Loading animations
export const skeletonPulse = {
  animate: {
    opacity: [0.3, 0.6, 0.3],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

export const spinLoader = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "linear"
    }
  }
};

// Progress animations
export const progressBar = {
  initial: { width: 0 },
  animate: (progress) => ({
    width: `${progress}%`,
    transition: { duration: 0.3, ease: "easeOut" }
  })
};

// Celebration animations
export const celebrationBurst = {
  initial: { scale: 0.3, opacity: 0 },
  animate: { 
    scale: [0.3, 1.2, 1],
    opacity: [0, 1, 1],
    transition: { duration: 0.6, times: [0, 0.6, 1] }
  },
  exit: { 
    scale: 0.8, 
    opacity: 0,
    transition: { duration: 0.3 }
  }
};

export const floatAnimation = {
  animate: {
    y: [-5, 5, -5],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

export const rotateLoop = {
  animate: {
    rotate: [0, 360],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "linear"
    }
  }
};

// Scroll reveal animations
export const revealOnScroll = {
  hidden: { opacity: 0, y: 50 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
};

export const revealOnScrollFast = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  }
};

// Card animations
export const cardHover = {
  rest: { 
    scale: 1, 
    y: 0,
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
  },
  hover: { 
    scale: 1.02,
    y: -4,
    boxShadow: "0 12px 24px rgba(0, 0, 0, 0.15)",
    transition: { duration: 0.3 }
  }
};

export const cardGlowHover = {
  rest: { 
    scale: 1,
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
  },
  hover: { 
    scale: 1.02,
    boxShadow: "0 8px 30px rgba(16, 185, 129, 0.4)",
    transition: { duration: 0.3 }
  }
};

// Modal animations
export const modalOverlay = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 }
};

export const modalContent = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { 
      type: "spring",
      stiffness: 300,
      damping: 30
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    y: 20,
    transition: { duration: 0.2 }
  }
};

// Button animations
export const buttonTap = {
  whileTap: { scale: 0.95 }
};

export const buttonHover = {
  whileHover: { scale: 1.05 },
  whileTap: { scale: 0.98 }
};

export const buttonPrimary = {
  rest: { scale: 1 },
  hover: { 
    scale: 1.05,
    boxShadow: "0 8px 20px rgba(16, 185, 129, 0.4)"
  },
  tap: { scale: 0.98 }
};

// Selection feedback
export const selectionPulse = {
  animate: {
    scale: [1, 1.1, 1],
    transition: { duration: 0.3 }
  }
};

export const selectionGlow = {
  animate: {
    boxShadow: [
      "0 0 0 0 rgba(16, 185, 129, 0.7)",
      "0 0 0 10px rgba(16, 185, 129, 0)"
    ],
    transition: { duration: 0.6 }
  }
};

// Notification/Toast animations
export const toastSlideIn = {
  initial: { opacity: 0, x: 100, scale: 0.8 },
  animate: { 
    opacity: 1, 
    x: 0, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25
    }
  },
  exit: { 
    opacity: 0, 
    x: 100,
    scale: 0.8,
    transition: { duration: 0.2 }
  }
};

// Equation animations
export const equationHighlight = {
  rest: { 
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    borderColor: "rgba(71, 85, 105, 0.5)"
  },
  hover: { 
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderColor: "rgba(16, 185, 129, 0.5)",
    transition: { duration: 0.3 }
  }
};

// Matrix animations
export const matrixRowReveal = {
  hidden: { opacity: 0, x: -20 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.06,
      duration: 0.45
    }
  })
};

export const matrixCellGlow = {
  rest: { scale: 1 },
  hover: { 
    scale: 1.05,
    boxShadow: "0 0 15px rgba(16, 185, 129, 0.5)",
    transition: { duration: 0.2 }
  }
};

// Export groups for convenience
export const basicAnimations = {
  fadeIn,
  fadeInUp,
  fadeInDown,
  slideInLeft,
  slideInRight,
  scaleIn,
  scalePop
};

export const hoverAnimations = {
  hoverLift,
  hoverScale,
  hoverGlow,
  cardHover,
  cardGlowHover
};

export const staggerAnimations = {
  staggerContainer,
  staggerFastContainer,
  staggerSlowContainer,
  staggerItem
};

export const feedbackAnimations = {
  shakeError,
  pulseError,
  selectionPulse,
  selectionGlow
};

export const loadingAnimations = {
  skeletonPulse,
  spinLoader,
  progressBar
};

export const scrollAnimations = {
  revealOnScroll,
  revealOnScrollFast
};
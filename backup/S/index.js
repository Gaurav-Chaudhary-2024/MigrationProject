import React from 'react';
import ReactDOM from 'react-dom/client';
import { motion, AnimatePresence } from 'framer-motion';

// Core styles
import './index.css';
import './styles/animations.css';
import './styles/effects.css';
import 'katex/dist/katex.min.css';

// Components
import App from './App';
import { PerformanceWrapper } from './components/PerformanceWrapper';

// Animation Components
import { ParticleEffect } from './components/animations/ParticleEffect';
import { FadeInSection, ParallaxSection } from './components/animations/ScrollAnimations';
import { SpringEffect } from './components/animations/SpringAnimations';
import { StaggeredList } from './components/animations/StaggerAnimations';
import { PathAnimation } from './components/animations/PathAnimations';

// UI Components
import { Toast } from './components/ui/Toast';
import { Modal } from './components/ui/Modal';
import { FloatingButton } from './components/ui/FloatingButton';
import { DragDrop } from './components/ui/DragDrop';
import { Tooltip } from './components/ui/Tooltip';
import { ProgressBar } from './components/ui/ProgressBar';
import { NavigationBar } from './components/ui/NavigationBar';
import { EnhancedButton } from './components/ui/EnhancedButton';

// Hooks
import { useScrollAnimation } from './components/hooks/useScrollAnimation';
import { useAnimationControls } from './components/hooks/useAnimationControls';
import { useMagneticEffect } from './components/hooks/useMagneticEffect';
import { usePerformance } from './components/hooks/usePerformance';

// Utilities
import { easings, animations } from './utils/animationHelpers';
import { useAnimationFrameLoop } from './utils/animationOptimizations';
import { useVirtualization, useDeferredLoading } from './utils/advancedPerformance';

// Build information
const BUILD_TIME = "2025-11-06 18:41:39";
const USER = "dfyhgvfdghjerghdthy";

// Global animation configuration
const globalAnimationConfig = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: {
    duration: 0.3,
    ease: easings.easeOutExpo
  }
};

// Performance optimization setup
const performanceConfig = {
  enableHardwareAcceleration: true,
  useWillChange: true,
  batchAnimations: true
};

// Development logging
if (process.env.NODE_ENV === 'development') {
  console.log(`Build Time (UTC): ${BUILD_TIME}`);
  console.log(`User: ${USER}`);
}

// App wrapper with animations and performance optimization
const AnimatedApp = () => (
  <PerformanceWrapper priority="high">
    <AnimatePresence mode="wait">
      <motion.div
        {...globalAnimationConfig}
        className={performanceConfig.enableHardwareAcceleration ? 'hardware-accelerated' : ''}
      >
        <App />
      </motion.div>
    </AnimatePresence>
  </PerformanceWrapper>
);

// Create root and render app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AnimatedApp />
  </React.StrictMode>
);

// Export configurations and components
export {
  // Components
  PerformanceWrapper,
  
  // Animation Components
  ParticleEffect,
  FadeInSection,
  ParallaxSection,
  SpringEffect,
  StaggeredList,
  PathAnimation,
  
  // UI Components
  Toast,
  Modal,
  FloatingButton,
  DragDrop,
  Tooltip,
  ProgressBar,
  NavigationBar,
  EnhancedButton,
  
  // Hooks
  useScrollAnimation,
  useAnimationControls,
  useMagneticEffect,
  usePerformance,
  
  // Utilities
  animations,
  easings,
  useAnimationFrameLoop,
  useVirtualization,
  useDeferredLoading,
  
  // Configurations
  globalAnimationConfig,
  performanceConfig
};

// Export build information
export const config = {
  buildTime: BUILD_TIME,
  user: USER,
  version: process.env.REACT_APP_VERSION || '1.0.0',
  isDevelopment: process.env.NODE_ENV === 'development'
};
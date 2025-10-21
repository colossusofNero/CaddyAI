/**
 * Animation Utilities
 * Reusable Framer Motion animation variants and helpers
 */

import { Variants } from 'framer-motion';

// Fade In Animations
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

// Scale Animations
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export const scaleOnHover = {
  scale: 1.05,
  transition: {
    duration: 0.2,
    ease: 'easeInOut',
  },
};

// Stagger Children Animation
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

// Slide Animations
export const slideInLeft: Variants = {
  hidden: { x: '-100%' },
  visible: {
    x: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: {
    x: '-100%',
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export const slideInRight: Variants = {
  hidden: { x: '100%' },
  visible: {
    x: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: {
    x: '100%',
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

// Page Transitions
export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.4,
      ease: 'easeIn',
    },
  },
};

// Card Hover Effects
export const cardHover = {
  y: -8,
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
  transition: {
    duration: 0.3,
    ease: 'easeOut',
  },
};

// Button Hover Effects
export const buttonHover = {
  scale: 1.05,
  transition: {
    duration: 0.2,
    ease: 'easeInOut',
  },
};

export const buttonTap = {
  scale: 0.95,
  transition: {
    duration: 0.1,
  },
};

// Parallax Scroll Effect
export const parallaxVariants = (offset: number): Variants => ({
  hidden: { y: 0 },
  visible: {
    y: offset,
    transition: {
      duration: 0,
    },
  },
});

// Smooth Scroll Configuration
export const smoothScrollConfig = {
  type: 'spring',
  stiffness: 50,
  damping: 20,
};

// Viewport Animation Settings
export const viewportAnimationSettings = {
  once: true, // Only animate once when element comes into view
  amount: 0.3, // Trigger animation when 30% of element is visible
  margin: '0px 0px -100px 0px', // Trigger slightly before element is fully visible
};

// Carousel/Slider Animations
export const slideVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 1000 : -1000,
    opacity: 0,
  }),
};

export const swipeConfidenceThreshold = 10000;
export const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

// Loading/Spinner Animations
export const spinnerVariants: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      ease: 'linear',
      repeat: Infinity,
    },
  },
};

// Text Reveal Animation
export const textReveal: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

// Number Counter Animation
export const counterAnimation = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

// Pulse Animation (for attention-grabbing elements)
export const pulse: Variants = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      ease: 'easeInOut',
      repeat: Infinity,
    },
  },
};

// Bounce Animation (for scroll indicators)
export const bounce: Variants = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 1.5,
      ease: 'easeInOut',
      repeat: Infinity,
    },
  },
};

// Modal/Overlay Animations
export const modalOverlay: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.3,
    },
  },
};

export const modalContent: Variants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 20,
    transition: {
      duration: 0.2,
    },
  },
};

// Border Glow Effect
export const glowEffect = {
  boxShadow: [
    '0 0 0 0 rgba(5, 161, 70, 0)',
    '0 0 0 10px rgba(5, 161, 70, 0.2)',
    '0 0 0 0 rgba(5, 161, 70, 0)',
  ],
  transition: {
    duration: 1.5,
    ease: 'easeInOut',
    repeat: Infinity,
  },
};

// 3D Tilt Effect (for hero elements)
export const tiltConfig = {
  max: 10, // Maximum tilt rotation (in degrees)
  perspective: 1000, // Transform perspective
  scale: 1.02, // Scale on hover
  speed: 400, // Speed of the enter/exit transition
  easing: 'cubic-bezier(.03,.98,.52,.99)', // Easing function
};

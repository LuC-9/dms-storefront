import type { Transition, Variants } from "framer-motion";

/** Primary ease — smooth deceleration (Gromuse-style UI demos) */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** Snappy spring for micro-interactions (cart badge, stepper expand) */
export const SPRING_SNAP = { type: "spring" as const, stiffness: 420, damping: 28 };

/** Page and section transitions */
export const TRANSITION_PAGE: Transition = { duration: 0.35, ease: EASE_OUT };
export const TRANSITION_FAST: Transition = { duration: 0.22, ease: EASE_OUT };
export const TRANSITION_SLOW: Transition = { duration: 0.65, ease: EASE_OUT };

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: TRANSITION_SLOW },
};

export const fadeScale: Variants = {
  hidden: { opacity: 0, scale: 0.92, y: 12 },
  show: { opacity: 1, scale: 1, y: 0, transition: TRANSITION_SLOW },
};

export const fadeLeft: Variants = {
  hidden: { opacity: 0, x: -24 },
  show: { opacity: 1, x: 0, transition: TRANSITION_SLOW },
};

export const fadeRight: Variants = {
  hidden: { opacity: 0, x: 24 },
  show: { opacity: 1, x: 0, transition: TRANSITION_SLOW },
};

export const blurIn: Variants = {
  hidden: { opacity: 0, filter: "blur(8px)", y: 16 },
  show: { opacity: 1, filter: "blur(0px)", y: 0, transition: TRANSITION_SLOW },
};

/** Stagger children — product grids, bento rows */
export const staggerContainer = (stagger = 0.07, delay = 0.08): Variants => ({
  hidden: {},
  show: {
    transition: { staggerChildren: stagger, delayChildren: delay },
  },
});

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 16, filter: "blur(4px)" },
  enter: { opacity: 1, y: 0, filter: "blur(0px)", transition: TRANSITION_PAGE },
  exit: { opacity: 0, y: -8, filter: "blur(2px)", transition: { duration: 0.2, ease: EASE_OUT } },
};

/** Card hover lift */
export const cardHover = {
  rest: { y: 0, scale: 1 },
  hover: { y: -6, scale: 1.01, transition: TRANSITION_FAST },
};

/** Expand-in for add-to-cart stepper (Gromuse + → − qty + pattern) */
export const stepperExpand: Variants = {
  collapsed: { width: "100%", opacity: 1 },
  expanded: { width: "100%", opacity: 1, transition: SPRING_SNAP },
};

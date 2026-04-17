import type { Variants, Transition } from "framer-motion";

export const EASE = {
  out:   [0.16, 1, 0.3, 1]    as const,
  in:    [0.7, 0, 0.84, 0]    as const,
  inOut: [0.83, 0, 0.17, 1]   as const,
};

export const SPRING = {
  soft:    { type: "spring", stiffness: 160, damping: 20, mass: 0.6 } satisfies Transition,
  default: { type: "spring", stiffness: 240, damping: 28, mass: 0.8 } satisfies Transition,
  snappy:  { type: "spring", stiffness: 360, damping: 30, mass: 0.8 } satisfies Transition,
};

// Screen enter — whole page fades + lifts in
export const screenEnter: Variants = {
  initial: { opacity: 0, y: 18, filter: "blur(2px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)", transition: { ...SPRING.soft, delay: 0.05 } },
};

// Stagger container — wraps lists of cards
export const staggerContainer: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.08, delayChildren: 0.1, when: "beforeChildren" } },
};

// Individual stagger child — each card in a list
export const staggerChild: Variants = {
  initial: { opacity: 0, y: 16, filter: "blur(1px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)", transition: { ...SPRING.soft } },
};

// PR burst — scale pop on personal record reveal
export const prBurst: Variants = {
  initial: { opacity: 0, scale: 0.85 },
  animate: { opacity: 1, scale: 1, transition: { ...SPRING.snappy, delay: 0.3 } },
};

// Check punch — set completion checkmark
export const checkPunch: Variants = {
  unchecked: { scale: 1, backgroundColor: "#ffffff" },
  checked: {
    scale: [1, 1.4, 0.9, 1], backgroundColor: "#10B981",
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
};

// Row flood — whole set row turns green on complete
export const rowFlood: Variants = {
  unchecked: { backgroundColor: "#ffffff" },
  checked: {
    backgroundColor: "#f0fdf4",
    transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
  },
};

// Bottom sheet slide up
export const sheetSlide: Variants = {
  initial: { y: "100%" },
  animate: { y: 0, transition: { ...SPRING.snappy } },
  exit:    { y: "100%", transition: { duration: 0.2, ease: [0.7, 0, 0.84, 0] } },
};

// Overlay fade
export const overlayFade: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit:    { opacity: 0, transition: { duration: 0.15 } },
};

// Page transition
export const pageTransition: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, transition: { duration: 0.2, ease: [0.7, 0, 0.84, 0] } },
};

// FAB pulse (use with animate prop)
export const fabPulse = {
  animate: {
    boxShadow: [
      "0 4px 14px rgba(16,185,129,0.35)",
      "0 4px 24px rgba(16,185,129,0.55)",
      "0 4px 14px rgba(16,185,129,0.35)",
    ],
  },
  transition: { duration: 3, repeat: Infinity, ease: "easeInOut" as const },
};

// Count up (number reveal on summary screen)
export const countUp: Variants = {
  initial: { opacity: 0.3, y: 8 },
  animate: { opacity: 1, y: 0, transition: { ...SPRING.soft, delay: 0.2 } },
};

// Nav tab switch
export const tabActive: Variants = {
  inactive: { scale: 1,   color: "#9ca3af" },
  active:   { scale: 1.1, color: "#10B981", transition: { ...SPRING.snappy } },
};

// Card hover lift
export const cardHover = {
  whileHover: { y: -2, transition: SPRING.soft as Transition },
  whileTap:   { scale: 0.98, transition: SPRING.snappy as Transition },
};

// Button press
export const press = {
  whileTap: { scale: 0.96, transition: SPRING.snappy as Transition },
};

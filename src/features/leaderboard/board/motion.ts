import { useReducedMotion, type Transition } from 'motion/react';

/** The page's one spring: fast, no visible overshoot. */
export const SPRING: Transition = { type: 'spring', stiffness: 380, damping: 34 };

/** The page's one ease curve, for fades. Mirrors --rb-ease in pages/results-board.css. */
export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
export const FADE: Transition = { duration: 0.22, ease: EASE };

/** First-load stagger: 30ms per row, capped at 300ms. */
export const staggerDelay = (index: number) => Math.min(index * 0.03, 0.3);

const INSTANT: Transition = { duration: 0 };

/** Spring and fade for this page; both become instant under prefers-reduced-motion. */
export function useBoardMotion() {
  const reduced = !!useReducedMotion();
  return { reduced, spring: reduced ? INSTANT : SPRING, fade: reduced ? INSTANT : FADE };
}

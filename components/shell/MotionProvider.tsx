"use client";

import { MotionConfig } from "motion/react";

/**
 * One motion contract for the whole app: transform-only animations, and every
 * spring/keyframe honours prefers-reduced-motion without per-component checks.
 */
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </MotionConfig>
  );
}
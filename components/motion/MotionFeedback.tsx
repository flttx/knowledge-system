"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { animateFeedback } from "@/lib/motion/anime";
import { usePrefersReducedMotion } from "@/lib/motion/reduced-motion";

export interface MotionFeedbackProps {
  children: ReactNode;
  className?: string;
  trigger?: unknown;
}

export function MotionFeedback({
  children,
  className,
  trigger,
}: MotionFeedbackProps) {
  const elementRef = useRef<HTMLSpanElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (reducedMotion || trigger === undefined || trigger === null || trigger === false) return;
    animateFeedback(elementRef.current);
  }, [trigger, reducedMotion]);

  return (
    <span ref={elementRef} className={className}>
      {children}
    </span>
  );
}

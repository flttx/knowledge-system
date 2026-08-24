"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { animateListReveal } from "@/lib/motion/anime";
import { usePrefersReducedMotion } from "@/lib/motion/reduced-motion";

export interface MotionListProps {
  children: ReactNode;
  className?: string;
  itemSelector?: string;
  staggerMs?: number;
  maxItems?: number;
  triggerKey?: string | number | boolean;
}

export function MotionList({
  children,
  className,
  itemSelector = ".workspace-list-row, li",
  staggerMs,
  maxItems,
  triggerKey,
}: MotionListProps) {
  const containerRef = useRef<HTMLUListElement>(null);
  const animatedOnceRef = useRef<boolean>(false);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    if (!containerRef.current) return;

    const items = Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(itemSelector),
    );
    if (items.length === 0) return;

    if (animatedOnceRef.current && triggerKey === undefined) return;
    animatedOnceRef.current = true;

    const cleanup = animateListReveal(items, { staggerMs, maxItems });
    return () => {
      cleanup?.();
    };
  }, [triggerKey, itemSelector, staggerMs, maxItems, reducedMotion]);

  return (
    <ul ref={containerRef} className={className}>
      {children}
    </ul>
  );
}

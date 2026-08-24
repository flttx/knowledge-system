"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { animate } from "@/lib/motion/anime";
import { usePrefersReducedMotion } from "@/lib/motion/reduced-motion";

interface BrandMotionProps {
  children: ReactNode;
}

function animateHero(root: HTMLElement): Array<{ revert: () => void }> {
  const animations: Array<{ revert: () => void }> = [];
  const all = <T extends Element>(selector: string): T[] => Array.from(root.querySelectorAll<T>(selector));

  const nav = all<HTMLElement>("[data-brand-nav]");
  const lines = all<HTMLElement>("[data-brand-line]");
  const copy = all<HTMLElement>("[data-brand-copy]");
  const cta = all<HTMLElement>("[data-brand-cta]");
  const poster = all<HTMLElement>("[data-brand-poster]");

  if (nav.length > 0) animations.push(animate(nav, { opacity: [0, 1], translateY: [-6, 0], duration: 360, ease: "outCubic" }));
  if (lines.length > 0) animations.push(animate(lines, { opacity: [0, 1], translateY: [16, 0], duration: 520, delay: 120, ease: "outCubic" }));
  if (copy.length > 0) animations.push(animate(copy, { opacity: [0, 1], translateY: [10, 0], duration: 420, delay: 360, ease: "outCubic" }));
  if (cta.length > 0) animations.push(animate(cta, { opacity: [0, 1], translateY: [8, 0], duration: 420, delay: 540, ease: "outCubic" }));
  if (poster.length > 0) animations.push(animate(poster, { opacity: [0, 1], translateY: [14, 0], duration: 720, delay: 260, ease: "outCubic" }));

  return animations;
}

export function BrandMotion({ children }: BrandMotionProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.dataset.brandMotion = reducedMotion ? "reduced" : "ready";
    if (reducedMotion) return;

    const animations = animateHero(root);
    return () => animations.forEach((animation) => animation.revert());
  }, [reducedMotion]);

  return <div className="brand-motion" ref={rootRef}>{children}</div>;
}

export function NarrativeMotion({ children }: BrandMotionProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-narrative-item]"));
    root.dataset.narrativeMotion = reducedMotion ? "reduced" : "ready";
    if (reducedMotion || typeof IntersectionObserver === "undefined") {
      items.forEach((item) => { item.dataset.visible = "true"; });
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const item = entry.target as HTMLElement;
        item.dataset.visible = "true";
        animate(item, { opacity: [0, 1], translateY: [22, 0], duration: 620, ease: "outCubic" });
        observer.unobserve(item);
      });
    }, { threshold: 0.16 });
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [reducedMotion]);

  return <div className="brand-narrative-motion" ref={rootRef}>{children}</div>;
}

"use client";

import { animate, createScope, stagger } from "animejs";
import { getPrefersReducedMotion } from "./reduced-motion";
import { motionTokens } from "./tokens";

export interface AnimateOptions {
  duration?: number;
  ease?: string;
  delay?: number;
}

/**
 * Animates dialog enter state with progressive enhancement and accessibility check.
 */
export function animateDialogEnter(
  backdropEl: HTMLElement | null,
  panelEl: HTMLElement | null,
  onComplete?: () => void,
): (() => void) | undefined {
  if (typeof window === "undefined") return undefined;
  if (!backdropEl && !panelEl) return undefined;

  const reducedMotion = getPrefersReducedMotion();

  if (reducedMotion) {
    if (backdropEl) backdropEl.style.opacity = "1";
    if (panelEl) {
      panelEl.style.opacity = "1";
      panelEl.style.transform = "none";
    }
    onComplete?.();
    return undefined;
  }

  const animations: Array<{ revert: () => void }> = [];

  if (backdropEl) {
    animations.push(
      animate(backdropEl, {
        opacity: [0, 1],
        duration: motionTokens.duration.normal,
        ease: motionTokens.easing.enter,
      }),
    );
  }

  if (panelEl) {
    animations.push(
      animate(panelEl, {
        opacity: [0, 1],
        scale: [motionTokens.scale.in, 1],
        translateY: [motionTokens.distance.small, 0],
        duration: motionTokens.duration.normal,
        ease: motionTokens.easing.enter,
        onComplete: () => {
          onComplete?.();
        },
      }),
    );
  }

  return () => {
    animations.forEach((anim) => anim.revert());
  };
}

/**
 * Animates dialog exit state before unmounting.
 */
export function animateDialogExit(
  backdropEl: HTMLElement | null,
  panelEl: HTMLElement | null,
  onComplete: () => void,
): void {
  if (typeof window === "undefined") {
    onComplete();
    return;
  }
  if (!backdropEl && !panelEl) {
    onComplete();
    return;
  }

  const reducedMotion = getPrefersReducedMotion();

  if (reducedMotion) {
    onComplete();
    return;
  }

  if (backdropEl) {
    animate(backdropEl, {
      opacity: [1, 0],
      duration: motionTokens.duration.fast,
      ease: motionTokens.easing.exit,
    });
  }

  if (panelEl) {
    animate(panelEl, {
      opacity: [1, 0],
      scale: [1, motionTokens.scale.in],
      translateY: [0, motionTokens.distance.small],
      duration: motionTokens.duration.fast,
      ease: motionTokens.easing.exit,
      onComplete: () => {
        onComplete();
      },
    });
  } else {
    window.setTimeout(onComplete, motionTokens.duration.fast);
  }
}

/**
 * Animates initial reveal of list rows when data first loads.
 * Strictly caps animated items and respects reduced motion.
 */
export function animateListReveal(
  items: HTMLElement[],
  options?: { maxItems?: number; staggerMs?: number },
): (() => void) | undefined {
  if (typeof window === "undefined" || items.length === 0) return undefined;
  if (getPrefersReducedMotion()) return undefined;

  const maxItems = options?.maxItems ?? motionTokens.limits.maxListStaggerItems;
  const staggerMs = options?.staggerMs ?? motionTokens.stagger.fast;
  const targetItems = items.slice(0, maxItems);

  const animation = animate(targetItems, {
    opacity: [0, 1],
    translateY: [motionTokens.distance.medium, 0],
    duration: motionTokens.duration.normal,
    delay: stagger(staggerMs),
    ease: motionTokens.easing.enter,
  });

  return () => {
    animation.revert();
  };
}

/**
 * Smoothly collapses and fades out a suggestion card upon review approval/rejection.
 */
export function animateSuggestionCollapse(
  element: HTMLElement | null,
  onComplete: () => void,
): void {
  if (typeof window === "undefined" || !element) {
    onComplete();
    return;
  }

  if (getPrefersReducedMotion()) {
    onComplete();
    return;
  }

  const initialHeight = element.offsetHeight;
  element.style.overflow = "hidden";

  animate(element, {
    opacity: [1, 0],
    height: [initialHeight, 0],
    paddingTop: [window.getComputedStyle(element).paddingTop, "0px"],
    paddingBottom: [window.getComputedStyle(element).paddingBottom, "0px"],
    marginTop: [window.getComputedStyle(element).marginTop, "0px"],
    marginBottom: [window.getComputedStyle(element).marginBottom, "0px"],
    duration: motionTokens.duration.normal,
    ease: motionTokens.easing.exit,
    onComplete: () => {
      onComplete();
    },
  });
}

/**
 * Subtle feedback animation for state confirmation (e.g. Save button / indicator).
 */
export function animateFeedback(element: HTMLElement | null): void {
  if (typeof window === "undefined" || !element || getPrefersReducedMotion()) return;

  animate(element, {
    opacity: [0.6, 1],
    scale: [0.98, 1],
    duration: motionTokens.duration.fast,
    ease: motionTokens.easing.enter,
  });
}

export { animate, createScope, stagger };

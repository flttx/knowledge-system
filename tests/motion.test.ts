import assert from "node:assert/strict";
import test from "node:test";

import { motionTokens } from "@/lib/motion/tokens";
import { getPrefersReducedMotion } from "@/lib/motion/reduced-motion";
import {
  animateDialogEnter,
  animateDialogExit,
  animateFeedback,
  animateListReveal,
  animateSuggestionCollapse,
} from "@/lib/motion/anime";

test("motion tokens define restrained durations, staggers, and distances", () => {
  assert.equal(motionTokens.duration.fast, 120);
  assert.equal(motionTokens.duration.normal, 180);
  assert.equal(motionTokens.duration.slow, 260);

  assert.equal(motionTokens.stagger.fast, 20);
  assert.equal(motionTokens.stagger.normal, 30);

  assert.equal(motionTokens.distance.small, 4);
  assert.equal(motionTokens.distance.medium, 8);

  assert.equal(motionTokens.scale.in, 0.98);
  assert.equal(motionTokens.limits.maxListStaggerItems, 20);
});

test("reduced-motion helper safely defaults to false in non-browser environments", () => {
  // In Node / SSR environment where window.matchMedia is undefined
  const prefersReduced = getPrefersReducedMotion();
  assert.equal(typeof prefersReduced, "boolean");
  assert.equal(prefersReduced, false);
});

test("motion helpers handle SSR / missing DOM nodes gracefully without errors", () => {
  // In SSR / Node environment, calling motion helpers should never crash or block
  assert.equal(animateDialogEnter(null, null), undefined);

  let exitFinished = false;
  animateDialogExit(null, null, () => {
    exitFinished = true;
  });
  assert.equal(exitFinished, true);

  assert.equal(animateListReveal([]), undefined);

  let collapseFinished = false;
  animateSuggestionCollapse(null, () => {
    collapseFinished = true;
  });
  assert.equal(collapseFinished, true);

  // animateFeedback with null should not throw
  assert.doesNotThrow(() => {
    animateFeedback(null);
  });
});

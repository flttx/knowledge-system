export interface MotionDurationTokens {
  fast: number;
  normal: number;
  slow: number;
}

export interface MotionStaggerTokens {
  fast: number;
  normal: number;
}

export interface MotionDistanceTokens {
  small: number;
  medium: number;
}

export interface MotionScaleTokens {
  in: number;
}

export interface MotionEasingTokens {
  standard: string;
  enter: string;
  exit: string;
  emphasized: string;
}

export interface MotionTokens {
  duration: MotionDurationTokens;
  stagger: MotionStaggerTokens;
  distance: MotionDistanceTokens;
  scale: MotionScaleTokens;
  easing: MotionEasingTokens;
  limits: {
    maxListStaggerItems: number;
  };
}

export const motionTokens: MotionTokens = {
  duration: {
    fast: 120,
    normal: 180,
    slow: 260,
  },
  stagger: {
    fast: 20,
    normal: 30,
  },
  distance: {
    small: 4,
    medium: 8,
  },
  scale: {
    in: 0.98,
  },
  easing: {
    standard: "outQuad",
    enter: "outCubic",
    exit: "inQuad",
    emphasized: "cubicBezier(0.16, 1, 0.3, 1)",
  },
  limits: {
    maxListStaggerItems: 20,
  },
};

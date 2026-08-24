"use client";

import { useEffect, useState } from "react";

export function ScrollMeridian() {
  const [scrollProgress, setScrollProgress] = useState(0.08);

  useEffect(() => {
    function handleScroll() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? Math.min(1, Math.max(0.08, scrollTop / docHeight)) : 0.08;
      setScrollProgress(progress);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Total stroke length units
  const TOTAL_LENGTH = 3200;
  const currentDrawLength = TOTAL_LENGTH * scrollProgress * 1.25;
  const currentOffset = Math.max(0, TOTAL_LENGTH - currentDrawLength);
  const tipY = Math.min(3150, Math.max(120, scrollProgress * 2900 + 100));

  return (
    <div
      className="pointer-events-none absolute inset-0 z-1 overflow-hidden select-none w-full h-full"
      aria-hidden="true"
    >
      <svg
        className="mx-auto w-full max-w-5xl h-full min-h-[3000px]"
        viewBox="0 0 800 3200"
        fill="none"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="meridianPrimaryGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a8433f" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#e05656" stopOpacity="1" />
            <stop offset="100%" stopColor="#a8433f" stopOpacity="0.95" />
          </linearGradient>

          <filter id="laserGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. Base Guide Track */}
        <path
          d="M 400 80 
             C 370 280, 430 520, 400 760 
             C 370 1020, 430 1300, 400 1560 
             C 370 1840, 430 2120, 400 2400 
             C 370 2680, 400 2900, 400 3150"
          stroke="var(--line-strong)"
          strokeWidth="1.5"
          strokeDasharray="4 6"
          opacity="0.3"
        />

        {/* 2. Growing Glowing Ink Meridian Line */}
        <path
          d="M 400 80 
             C 370 280, 430 520, 400 760 
             C 370 1020, 430 1300, 400 1560 
             C 370 1840, 430 2120, 400 2400 
             C 370 2680, 400 2900, 400 3150"
          stroke="url(#meridianPrimaryGlow)"
          strokeWidth="3.5"
          strokeLinecap="round"
          filter="url(#laserGlow)"
          style={{
            strokeDasharray: TOTAL_LENGTH,
            strokeDashoffset: currentOffset,
            transition: "stroke-dashoffset 0.08s linear",
          }}
        />

        {/* 3. Glowing Plasma Tip that descends with scroll */}
        <circle
          cx="400"
          cy={tipY}
          r="12"
          fill="#a8433f"
          opacity="0.4"
          className="animate-ping"
        />
        <circle
          cx="400"
          cy={tipY}
          r="6"
          fill="#e05656"
          stroke="#ffffff"
          strokeWidth="2"
          style={{ filter: "drop-shadow(0 0 8px #a8433f)" }}
        />

        {/* 4. Branch 1: Toward Sandbox */}
        {scrollProgress > 0.12 && (
          <g className="animate-in fade-in zoom-in-75 duration-700">
            <path
              d="M 400 720 C 310 760, 200 800, 140 890"
              stroke="#a8433f"
              strokeWidth="2"
              strokeDasharray="5 3"
              opacity="0.8"
            />
            <circle cx="140" cy="890" r="5" fill="#a8433f" className="animate-pulse" />

            <path
              d="M 400 720 C 490 760, 600 800, 660 890"
              stroke="#a8433f"
              strokeWidth="2"
              strokeDasharray="5 3"
              opacity="0.8"
            />
            <circle cx="660" cy="890" r="5" fill="#a8433f" className="animate-pulse" />
          </g>
        )}

        {/* 5. Branch 2: Toward Bento Matrix */}
        {scrollProgress > 0.42 && (
          <g className="animate-in fade-in zoom-in-75 duration-700">
            <path
              d="M 400 1560 C 280 1640, 160 1700, 100 1820"
              stroke="#a8433f"
              strokeWidth="2"
              strokeDasharray="5 3"
              opacity="0.8"
            />
            <circle cx="100" cy="1820" r="5" fill="#a8433f" className="animate-pulse" />

            <path
              d="M 400 1560 C 520 1640, 640 1700, 700 1820"
              stroke="#a8433f"
              strokeWidth="2"
              strokeDasharray="5 3"
              opacity="0.8"
            />
            <circle cx="700" cy="1820" r="5" fill="#a8433f" className="animate-pulse" />
          </g>
        )}

        {/* Origin Top Node */}
        <circle cx="400" cy="80" r="9" fill="#a8433f" />
        <circle cx="400" cy="80" r="16" fill="none" stroke="#a8433f" strokeWidth="1.5" className="animate-ping opacity-40" />
      </svg>
    </div>
  );
}

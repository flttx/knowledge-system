"use client";

export function InkMountain() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[580px] overflow-hidden opacity-65 dark:opacity-35 select-none" aria-hidden="true">
      <svg
        className="w-full h-full object-cover"
        viewBox="0 0 1440 480"
        fill="none"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Subtle paper & ink gradients */}
          <linearGradient id="skyWash" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.04" />
            <stop offset="60%" stopColor="var(--background)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="var(--background)" stopOpacity="1" />
          </linearGradient>

          <linearGradient id="farMountain" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--ink)" stopOpacity="0.08" />
            <stop offset="80%" stopColor="var(--background)" stopOpacity="0.9" />
          </linearGradient>

          <linearGradient id="midMountain" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--ink)" stopOpacity="0.12" />
            <stop offset="85%" stopColor="var(--background)" stopOpacity="0.95" />
          </linearGradient>

          <linearGradient id="nearMountain" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--ink)" stopOpacity="0.18" />
            <stop offset="90%" stopColor="var(--background)" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* Atmosphere Wash */}
        <rect width="1440" height="480" fill="url(#skyWash)" />

        {/* Rising Warm Sun/Seal Circle in Mist */}
        <circle cx="1080" cy="140" r="48" fill="var(--accent)" opacity="0.12" />

        {/* Distant Mountains Layer 1 */}
        <path
          d="M0 260 C240 180, 420 220, 680 160 C920 100, 1160 190, 1440 140 L1440 480 L0 480 Z"
          fill="url(#farMountain)"
        />

        {/* Mid-range Mountains Layer 2 */}
        <path
          d="M0 320 C180 240, 360 270, 580 210 C820 150, 1060 250, 1440 190 L1440 480 L0 480 Z"
          fill="url(#midMountain)"
        />

        {/* Near Foreground Peaks Layer 3 */}
        <path
          d="M0 380 C260 290, 520 330, 840 270 C1100 220, 1280 310, 1440 250 L1440 480 L0 480 Z"
          fill="url(#nearMountain)"
        />

        {/* Misty Water Line */}
        <line x1="0" y1="479" x2="1440" y2="479" stroke="var(--line)" strokeWidth="1" opacity="0.6" />
      </svg>
    </div>
  );
}

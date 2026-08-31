"use client";

export function CinematicBackdrop() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 h-full w-full overflow-hidden select-none bg-[#f7f4ed] dark:bg-[#020408] transition-colors duration-500"
      aria-hidden="true"
    >
      {/* 1. Deep Monolithic Hero Artwork (Responsive: Portrait / Mobile vs Landscape / Desktop with Ink Wash for Light Theme) */}
      <picture className="absolute inset-0 h-full w-full">
        <source
          media="(orientation: portrait), (max-width: 768px)"
          srcSet="/brand/knowledge-monolith-mobile.webp"
        />
        <img
          src="/brand/knowledge-monolith-desktop.webp"
          alt=""
          className="h-full w-full object-cover object-center transition-all duration-500 opacity-30 mix-blend-multiply contrast-[1.1] brightness-[1.04] saturate-[0.85] dark:opacity-100 dark:mix-blend-normal dark:contrast-[1.05] dark:brightness-[0.92] dark:saturate-100"
        />
      </picture>

      {/* 2. Top Vignette for Navbar Readability */}
      <div className="absolute top-0 inset-x-0 h-28 sm:h-36 bg-gradient-to-b from-[#f7f4ed]/95 via-[#f7f4ed]/40 to-transparent dark:from-[#020408]/90 dark:via-[#020408]/35 pointer-events-none z-[1] transition-colors duration-500" />

      {/* 3. Contrast Overlay:
             - Desktop/Landscape: Left-Side Soft Mist for text contrast
             - Mobile/Portrait: Soft subtle vignette that lets the monolith and lighting breathe */}
      <div className="hidden md:block absolute inset-y-0 left-0 w-[60%] lg:w-[48%] bg-gradient-to-r from-[#f7f4ed]/90 via-[#f7f4ed]/45 to-transparent dark:from-[#020408]/90 dark:via-[#020408]/45 pointer-events-none z-[1] transition-colors duration-500" />
      <div className="block md:hidden absolute inset-0 bg-gradient-to-b from-[#f7f4ed]/70 via-transparent to-[#f7f4ed]/90 dark:from-[#020408]/60 dark:via-transparent dark:to-[#020408]/85 pointer-events-none z-[1] transition-colors duration-500" />

      {/* 4. Bottom Seamless Gradient to Transition into Features & Warm/Dark Theme */}
      <div className="absolute bottom-0 inset-x-0 h-36 sm:h-64 md:h-80 bg-gradient-to-t from-[#f7f4ed] via-[#f7f4ed]/80 to-transparent dark:from-[#020408] dark:via-[#020408]/75 pointer-events-none z-[1] transition-colors duration-500" />

      {/* 5. Cinematic Fine Grain / Washi Texture */}
      <div
        className="absolute inset-0 opacity-[0.035] dark:opacity-[0.03] pointer-events-none mix-blend-multiply dark:mix-blend-screen z-[2]"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, #000000 0.75px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />
    </div>
  );
}

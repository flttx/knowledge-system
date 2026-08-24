"use client";

export function CinematicBackdrop() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 h-full w-full overflow-hidden select-none bg-[#020408]"
      aria-hidden="true"
    >
      {/* 1. Deep Monolithic Hero Artwork (Clean Version with No Text) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/knowledge-monolith-clean.webp"
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-right md:object-center brightness-[0.92] contrast-[1.05]"
      />

      {/* 2. Top Vignette for Navbar Readability */}
      <div className="absolute top-0 inset-x-0 h-36 bg-gradient-to-b from-[#020408]/90 via-[#020408]/40 to-transparent pointer-events-none z-[1]" />

      {/* 3. Left-Side Subtle Dark Mist Overlay for Hero UI Contrast */}
      <div className="absolute inset-y-0 left-0 w-full md:w-[60%] lg:w-[48%] bg-gradient-to-r from-[#020408]/85 via-[#020408]/40 to-transparent pointer-events-none z-[1]" />

      {/* 4. Bottom Seamless Gradient to Transition into Features & Dark Theme */}
      <div className="absolute bottom-0 inset-x-0 h-64 md:h-80 bg-gradient-to-t from-[#020408] via-[#020408]/85 to-transparent pointer-events-none z-[1]" />

      {/* 5. Cinematic Fine Grain */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-screen z-[2]"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, #ffffff 0.75px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />
    </div>
  );
}

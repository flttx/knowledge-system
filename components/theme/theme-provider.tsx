"use client";

import { createContext, useContext, useEffect, useState, type MouseEvent, type ReactNode } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  toggleThemeWithTransition: (event?: MouseEvent<HTMLElement>) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "knowledge-theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (saved && (saved === "light" || saved === "dark" || saved === "system")) {
        return saved;
      }
    }
    return "system";
  });
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    function applyTheme() {
      const isDark = theme === "dark" || (theme === "system" && media.matches);
      const active = isDark ? "dark" : "light";
      setResolvedTheme(active);
      document.documentElement.dataset.theme = active;
      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }

    applyTheme();
    media.addEventListener("change", applyTheme);
    return () => media.removeEventListener("change", applyTheme);
  }, [theme]);

  function setTheme(nextTheme: Theme) {
    setThemeState(nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
  }

  // Cinematic Celestial Eclipse View Transition (750ms Smooth Radial Ripple)
  function toggleThemeWithTransition(event?: MouseEvent<HTMLElement>) {
    const nextResolved = resolvedTheme === "light" ? "dark" : "light";

    // Fallback if View Transitions API is not supported
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof document === "undefined" || !(document as any).startViewTransition) {
      setTheme(nextResolved);
      return;
    }

    const x = event ? event.clientX : window.innerWidth / 2;
    const y = event ? event.clientY : window.innerHeight / 2;

    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transition = (document as any).startViewTransition(() => {
      setTheme(nextResolved);
    });

    transition.ready.then(() => {
      // Animate the circular clip path with a rich 750ms cinematic easing
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 750,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          pseudoElement: "::view-transition-new(root)",
        }
      );
    });
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleThemeWithTransition }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { resolvedTheme, toggleThemeWithTransition } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [clicked, setClicked] = useState(false);

  function handleClick(e: MouseEvent<HTMLButtonElement>) {
    setClicked(true);
    setTimeout(() => setClicked(false), 800);
    toggleThemeWithTransition(e);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isDark ? "切换至晨曦浅色模式" : "切换至夜幕深色模式"}
      title={isDark ? "切换至晨曦浅色模式 (Alt+T)" : "切换至夜幕深色模式 (Alt+T)"}
      className={`group relative inline-flex items-center justify-center overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] shadow-2xs transition-all duration-300 hover:border-[var(--accent)] hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] active:scale-95 select-none ${
        compact ? "size-8 min-w-8 p-1" : "h-8 px-3 gap-2"
      }`}
    >
      {/* Click Pulse Ripple on Button */}
      {clicked && (
        <span className="pointer-events-none absolute inset-0 rounded-lg bg-[var(--accent)]/15 animate-ping" />
      )}

      {/* Sun & Moon Celestial Orbit Icon */}
      <div className="relative size-4 flex items-center justify-center">
        {/* Sun Glyph (Golden Morning Light) */}
        <svg
          className={`absolute size-4 text-[#b88e3e] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isDark
              ? "rotate-180 scale-0 opacity-0"
              : "rotate-0 scale-100 opacity-100"
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity="0.25" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
          />
        </svg>

        {/* Moon Glyph (Midnight Starlight) */}
        <svg
          className={`absolute size-3.5 text-[#fef08a] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isDark
              ? "rotate-0 scale-100 opacity-100"
              : "-rotate-180 scale-0 opacity-0"
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="currentColor"
            fillOpacity="0.3"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      </div>

      {!compact && (
        <span className="text-xs font-mono font-medium text-[var(--ink-muted)] group-hover:text-[var(--ink)] transition-colors">
          {isDark ? "夜幕" : "晨曦"}
        </span>
      )}
    </button>
  );
}

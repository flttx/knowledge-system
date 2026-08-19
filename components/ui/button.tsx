import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}, ref) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex min-h-9 items-center justify-center rounded-lg px-3.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" && "bg-[var(--ink)] text-white hover:bg-[var(--ink-soft)]",
        variant === "secondary" &&
          "border border-[var(--line-strong)] bg-white text-[var(--ink)] hover:bg-[var(--surface-muted)]",
        variant === "ghost" && "text-[var(--ink-soft)] hover:bg-[var(--surface-muted)]",
        className,
      )}
      {...props}
    />
  );
});

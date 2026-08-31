import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg" | "icon" | "icon-sm";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}, ref) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center font-medium cursor-pointer transition-colors duration-[var(--motion-normal)] ease-out select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
        // Sizes
        size === "md" && "min-h-[38px] h-[38px] px-3.5 text-sm rounded-lg gap-2",
        size === "sm" && "min-h-[32px] h-[32px] px-2.5 text-xs rounded-md gap-1.5",
        size === "lg" && "min-h-[42px] h-[42px] px-4 text-base rounded-lg gap-2",
        size === "icon" && "size-[34px] min-h-[34px] min-w-[34px] p-0 rounded-lg justify-center",
        size === "icon-sm" && "size-7 min-h-[28px] min-w-[28px] p-0 rounded-md justify-center text-xs",
        // Variants
        variant === "primary" &&
          "bg-[var(--ink)] text-[var(--background)] hover:bg-[var(--ink-soft)] active:bg-[var(--ink)] shadow-none",
        variant === "secondary" &&
          "border border-[var(--line-strong)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-muted)] hover:border-[var(--line-strong)] active:bg-[var(--surface)]",
        variant === "ghost" &&
          "bg-transparent text-[var(--ink-soft)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)] active:bg-[var(--surface-muted)]",
        variant === "destructive" &&
          "bg-transparent text-[var(--danger)] hover:bg-[var(--danger-soft)] hover:text-[var(--danger)] active:bg-[var(--danger-soft)]",
        className,
      )}
      {...props}
    />
  );
});

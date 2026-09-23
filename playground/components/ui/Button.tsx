"use client";

import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

type Variant = "cyan" | "amber" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variantClasses: Record<Variant, string> = {
  cyan: "bg-[var(--color-accent-cyan)]/10 border-[var(--color-accent-cyan)]/40 text-[var(--color-accent-cyan)] hover:bg-[var(--color-accent-cyan)]/20 focus-visible:ring-[var(--color-accent-cyan)]",
  amber:
    "bg-[var(--color-accent-amber)]/10 border-[var(--color-accent-amber)]/40 text-[var(--color-accent-amber)] hover:bg-[var(--color-accent-amber)]/20 focus-visible:ring-[var(--color-accent-amber)]",
  ghost:
    "bg-transparent border-[var(--color-border-hairline)] text-slate-300 hover:bg-white/5 focus-visible:ring-slate-400",
  danger:
    "bg-[var(--color-accent-danger)]/10 border-[var(--color-accent-danger)]/40 text-[var(--color-accent-danger)] hover:bg-[var(--color-accent-danger)]/20 focus-visible:ring-[var(--color-accent-danger)]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "cyan", className = "", disabled, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-void)] disabled:cursor-not-allowed disabled:opacity-40 ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
});

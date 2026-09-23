import type { HTMLAttributes } from "react";

type Tone = "cyan" | "amber" | "gold" | "danger" | "muted";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

const toneClasses: Record<Tone, string> = {
  cyan: "bg-[var(--color-accent-cyan)]/10 text-[var(--color-accent-cyan)] border-[var(--color-accent-cyan)]/30",
  amber:
    "bg-[var(--color-accent-amber)]/10 text-[var(--color-accent-amber)] border-[var(--color-accent-amber)]/30",
  gold: "bg-[var(--color-accent-gold)]/10 text-[var(--color-accent-gold)] border-[var(--color-accent-gold)]/30",
  danger:
    "bg-[var(--color-accent-danger)]/10 text-[var(--color-accent-danger)] border-[var(--color-accent-danger)]/30",
  muted: "bg-white/5 text-slate-400 border-white/10",
};

export function Badge({ tone = "muted", className = "", ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${toneClasses[tone]} ${className}`}
      {...props}
    />
  );
}

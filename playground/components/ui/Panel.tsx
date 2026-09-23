import type { HTMLAttributes } from "react";

export function Panel({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-xl border border-[var(--color-border-hairline)] bg-[var(--color-surface-panel)] ${className}`}
      {...props}
    />
  );
}

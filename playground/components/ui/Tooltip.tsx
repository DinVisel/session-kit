"use client";

import { useId, useState } from "react";
import type { ReactNode } from "react";

export function Tooltip({ content, children }: { content: string; children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const id = useId();

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      <span aria-describedby={visible ? id : undefined}>{children}</span>
      {visible && (
        <span
          role="tooltip"
          id={id}
          className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-[var(--color-border-hairline)] bg-[var(--color-surface-panel)] px-2 py-1 text-xs text-slate-200 shadow-lg"
        >
          {content}
        </span>
      )}
    </span>
  );
}

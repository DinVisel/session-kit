"use client";

import { useRef } from "react";
import type { KeyboardEvent } from "react";
import { usePlayground } from "@/lib/PlaygroundProvider";
import type { GameMode } from "@/lib/types";

const TABS: { id: GameMode; label: string }[] = [
  { id: "legacy", label: "Legacy Web3" },
  { id: "sessionkit", label: "SessionKit (Zero Popup)" },
];

export function ModeSwitcher() {
  const { mode, setMode } = usePlayground();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const nextIndex =
      event.key === "ArrowRight" ? (index + 1) % TABS.length : (index - 1 + TABS.length) % TABS.length;
    const next = TABS[nextIndex];
    if (!next) return;
    setMode(next.id);
    tabRefs.current[nextIndex]?.focus();
  }

  return (
    <div
      role="tablist"
      aria-label="Transaction mode"
      className="inline-flex rounded-lg border border-[var(--color-border-hairline)] bg-black/20 p-1"
    >
      {TABS.map((tab, index) => {
        const active = mode === tab.id;
        const tone = tab.id === "legacy" ? "var(--color-accent-amber)" : "var(--color-accent-cyan)";
        return (
          <button
            key={tab.id}
            ref={(el) => {
              tabRefs.current[index] = el;
            }}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={active}
            aria-controls="battle-arena-panel"
            tabIndex={active ? 0 : -1}
            onClick={() => setMode(tab.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className="rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-void)]"
            style={active ? { backgroundColor: `color-mix(in srgb, ${tone} 15%, transparent)`, color: tone } : { color: "#94a3b8" }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

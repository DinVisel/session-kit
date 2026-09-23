"use client";

import { useCallback, useRef, useState } from "react";
import { CONSOLE_MAX_LINES } from "./constants";
import type { ConsoleLine, ConsoleLineLevel, GameMode } from "./types";

let idCounter = 0;

export type PushLine = (mode: GameMode, level: ConsoleLineLevel, text: string) => void;

export function useEventLog() {
  const [lines, setLines] = useState<ConsoleLine[]>([]);
  const t0Ref = useRef<number | null>(null);

  const push = useCallback<PushLine>((mode, level, text) => {
    const now = Date.now();
    if (t0Ref.current === null) t0Ref.current = now;
    const line: ConsoleLine = {
      id: idCounter++,
      mode,
      level,
      t: now - t0Ref.current,
      text,
    };
    setLines((prev) => {
      const next = [...prev, line];
      return next.length > CONSOLE_MAX_LINES ? next.slice(next.length - CONSOLE_MAX_LINES) : next;
    });
  }, []);

  const clear = useCallback(() => {
    setLines([]);
    t0Ref.current = null;
  }, []);

  return { lines, push, clear };
}

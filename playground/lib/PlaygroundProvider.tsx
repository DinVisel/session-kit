"use client";

import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";
import { useWallet } from "./useWallet";
import { useEventLog } from "./useEventLog";
import { useGameState } from "./useGameState";
import { emptyTally } from "./types";
import type { ComparisonStats, ComparisonTally, GameMode } from "./types";

interface PlaygroundContextValue {
  mode: GameMode;
  setMode: (mode: GameMode) => void;
  wallet: ReturnType<typeof useWallet>;
  eventLog: ReturnType<typeof useEventLog>;
  game: ReturnType<typeof useGameState>;
  stats: ComparisonStats;
  bumpTally: (mode: GameMode, patch: Partial<ComparisonTally>) => void;
}

const PlaygroundContext = createContext<PlaygroundContextValue | null>(null);

// Lives above BattleArena and DevConsole (siblings under the server-component
// page.tsx) so both can share one event log, one boss, and one wallet connection.
export function PlaygroundProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<GameMode>("legacy");
  const wallet = useWallet();
  const eventLog = useEventLog();
  const game = useGameState();
  const [stats, setStats] = useState<ComparisonStats>({
    legacy: emptyTally(),
    sessionkit: emptyTally(),
  });

  const bumpTally = useCallback((m: GameMode, patch: Partial<ComparisonTally>) => {
    setStats((prev) => ({
      ...prev,
      [m]: {
        popups: prev[m].popups + (patch.popups ?? 0),
        waitMs: prev[m].waitMs + (patch.waitMs ?? 0),
        gasPaidByUser: prev[m].gasPaidByUser + (patch.gasPaidByUser ?? 0),
        gasPaidBySponsor: prev[m].gasPaidBySponsor + (patch.gasPaidBySponsor ?? 0),
      },
    }));
  }, []);

  const value: PlaygroundContextValue = {
    mode,
    setMode,
    wallet,
    eventLog,
    game,
    stats,
    bumpTally,
  };

  return <PlaygroundContext.Provider value={value}>{children}</PlaygroundContext.Provider>;
}

export function usePlayground(): PlaygroundContextValue {
  const ctx = useContext(PlaygroundContext);
  if (!ctx) throw new Error("usePlayground must be used within a PlaygroundProvider");
  return ctx;
}

import type { Address, Hash } from "viem";
import type { SessionKitEvent, SessionState } from "@sessionkit/sdk";

export type GameMode = "legacy" | "sessionkit";

export type BossPhase = "idle" | "fighting" | "defeated";

export type ConsoleLineLevel = "info" | "success" | "warn" | "error" | "muted";

export interface ConsoleLine {
  id: number;
  mode: GameMode;
  level: ConsoleLineLevel;
  t: number; // ms since the run's first logged event
  text: string;
}

export interface ComparisonTally {
  popups: number;
  waitMs: number;
  gasPaidByUser: number;
  gasPaidBySponsor: number;
}

export interface ComparisonStats {
  legacy: ComparisonTally;
  sessionkit: ComparisonTally;
}

export function emptyTally(): ComparisonTally {
  return { popups: 0, waitMs: 0, gasPaidByUser: 0, gasPaidBySponsor: 0 };
}

export type { Address, Hash, SessionKitEvent, SessionState };

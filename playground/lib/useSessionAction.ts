"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SessionKitError } from "@sessionkit/sdk";
import { getSessionKit } from "./sessionkit";
import { SESSION_DURATION_S, SESSION_MAX_MOVES, SESSION_MAX_SPEND } from "./constants";
import { truncateHash } from "./format";
import type { ComparisonTally, SessionKitEvent, SessionState } from "./types";
import type { PushLine } from "./useEventLog";

interface UseSessionActionArgs {
  push: PushLine;
  applyHit: () => number;
  bumpTally: (patch: Partial<ComparisonTally>) => void;
}

export function useSessionAction({ push, applyHit, bumpTally }: UseSessionActionArgs) {
  const kitRef = useRef(getSessionKit());
  const [session, setSession] = useState<SessionState | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isActing, setIsActing] = useState(false);
  const [refuseReason, setRefuseReason] = useState<string | null>(null);

  useEffect(() => {
    const kit = kitRef.current;
    const unsubscribe = kit.on((event: SessionKitEvent) => {
      switch (event.type) {
        case "session:created": {
          const tag = event.simulated ? " (simulated)" : "";
          push("sessionkit", "success", `Session authorized — signer ${truncateHash(event.sessionSigner)}${tag}`);
          break;
        }
        case "session:expired":
          push("sessionkit", "warn", "Session expired.");
          break;
        case "session:revoked":
          push("sessionkit", "muted", "Session revoked.");
          break;
        case "action:dispatched":
          push("sessionkit", "info", "Action dispatched: 'SLASH_BOSS'");
          break;
        case "action:signed":
          push("sessionkit", "success", "Signed client-side via in-memory session key (0 popups)");
          break;
        case "action:relayed": {
          const tag = event.simulated ? " [simulated]" : "";
          push(
            "sessionkit",
            "success",
            `Relayed & gas sponsored by paymaster (Tx: ${truncateHash(event.txHash)})${tag}`
          );
          break;
        }
        case "action:failed":
          push("sessionkit", "error", event.reason);
          break;
        default:
          break;
      }
      setSession(kit.getSession());
    });
    return unsubscribe;
  }, [push]);

  useEffect(() => {
    const id = setInterval(() => setSession(kitRef.current.getSession()), 1000);
    return () => clearInterval(id);
  }, []);

  const startSession = useCallback(async () => {
    setIsStarting(true);
    setRefuseReason(null);
    try {
      await kitRef.current.createSession({
        durationInSeconds: SESSION_DURATION_S,
        maxMoves: SESSION_MAX_MOVES,
        maxSpend: SESSION_MAX_SPEND,
      });
      setSession(kitRef.current.getSession());
    } catch (err) {
      push("sessionkit", "error", err instanceof SessionKitError ? err.message : "Could not start session.");
    } finally {
      setIsStarting(false);
    }
  }, [push]);

  const attack = useCallback(async () => {
    setIsActing(true);
    setRefuseReason(null);

    // Session guards run synchronously inside execute() before any signing/relay I/O,
    // so a move that clears them here almost always succeeds — apply the hit
    // immediately rather than waiting on the relay round-trip.
    const before = kitRef.current.getSession();
    const willClearGuards =
      !!before && before.isActive && before.remainingMoves > 0 && before.spent + 1 <= before.maxSpend;
    let damage: number | null = willClearGuards ? applyHit() : null;

    try {
      await kitRef.current.execute({ action: "SLASH_BOSS" }, 1);
      bumpTally({ gasPaidBySponsor: 1 });
      if (damage === null) damage = applyHit();
      return damage;
    } catch (err) {
      setRefuseReason(err instanceof SessionKitError ? err.message : "Move failed.");
      return null;
    } finally {
      setIsActing(false);
      setSession(kitRef.current.getSession());
    }
  }, [applyHit, bumpTally]);

  const revoke = useCallback(() => {
    kitRef.current.revoke();
    setSession(null);
  }, []);

  return { session, isStarting, isActing, refuseReason, startSession, attack, revoke };
}

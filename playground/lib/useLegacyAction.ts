"use client";

import { useCallback, useRef, useState } from "react";
import { getEthereumProvider } from "./useWallet";
import type { Address, ComparisonTally } from "./types";
import type { PushLine } from "./useEventLog";

interface UseLegacyActionArgs {
  hasWallet: boolean;
  account: Address | null;
  push: PushLine;
  applyHit: () => number;
  bumpTally: (patch: Partial<ComparisonTally>) => void;
}

type SimulatedResolver = (approved: boolean) => void;

export function useLegacyAction({ hasWallet, account, push, applyHit, bumpTally }: UseLegacyActionArgs) {
  const [isBusy, setIsBusy] = useState(false);
  const [isAwaitingSimulated, setIsAwaitingSimulated] = useState(false);
  const popupCounter = useRef(0);
  const resolverRef = useRef<SimulatedResolver | null>(null);

  const resolveSimulated = useCallback((approved: boolean) => {
    setIsAwaitingSimulated(false);
    resolverRef.current?.(approved);
    resolverRef.current = null;
  }, []);

  const attack = useCallback(async () => {
    if (isBusy) return null;
    setIsBusy(true);
    popupCounter.current += 1;
    const popupNumber = popupCounter.current;

    push("legacy", "info", `Action dispatched: 'SLASH_BOSS'`);
    bumpTally({ popups: 1 });

    const provider = getEthereumProvider();
    const start = Date.now();

    try {
      let approved: boolean;

      if (hasWallet && provider) {
        push("legacy", "muted", `Awaiting wallet approval — popup #${popupNumber}`);
        let signer = account;
        if (!signer) {
          const accounts: Address[] = await provider.request({ method: "eth_requestAccounts" });
          signer = accounts[0] ?? null;
        }
        if (!signer) {
          approved = false;
        } else {
          try {
            await provider.request({
              method: "personal_sign",
              params: [`SLASH_BOSS @ ${start}`, signer],
            });
            approved = true;
          } catch (err: any) {
            if (err?.code === 4001) {
              approved = false;
            } else {
              throw err;
            }
          }
        }
      } else {
        push("legacy", "muted", `Awaiting wallet approval — popup #${popupNumber} (simulated)`);
        setIsAwaitingSimulated(true);
        approved = await new Promise<boolean>((resolve) => {
          resolverRef.current = resolve;
        });
      }

      const elapsedMs = Date.now() - start;
      bumpTally({ waitMs: elapsedMs });

      if (!approved) {
        push("legacy", "error", `User rejected (move lost)`);
        return null;
      }

      push(
        "legacy",
        "success",
        `User confirmed after ${(elapsedMs / 1000).toFixed(2)}s of human latency`
      );

      const damage = applyHit();
      bumpTally({ gasPaidByUser: 1 });
      push("legacy", "success", `Broadcast — gas paid by user`);

      return damage;
    } catch (err) {
      push("legacy", "error", err instanceof Error ? err.message : "Wallet request failed.");
      return null;
    } finally {
      setIsBusy(false);
    }
  }, [account, applyHit, bumpTally, hasWallet, isBusy, push]);

  return { attack, isBusy, isAwaitingSimulated, resolveSimulated };
}

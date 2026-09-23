"use client";

import { usePlayground } from "@/lib/PlaygroundProvider";
import { useLegacyAction } from "@/lib/useLegacyAction";
import { useSessionAction } from "@/lib/useSessionAction";
import { Button } from "../ui/Button";
import { Panel } from "../ui/Panel";
import { ModeSwitcher } from "./ModeSwitcher";
import { BossCard } from "./BossCard";
import { ActionButton } from "./ActionButton";
import { SessionHud } from "./SessionHud";
import { StartSessionPanel } from "./StartSessionPanel";
import { LegacyPopupOverlay } from "./LegacyPopupOverlay";
import { ComparisonStats } from "./ComparisonStats";

export function BattleArena() {
  const { mode, wallet, eventLog, game, bumpTally } = usePlayground();

  const legacy = useLegacyAction({
    hasWallet: wallet.hasWallet,
    account: wallet.account,
    push: eventLog.push,
    applyHit: game.applyHit,
    bumpTally: (patch) => bumpTally("legacy", patch),
  });

  const sessionkit = useSessionAction({
    push: eventLog.push,
    applyHit: game.applyHit,
    bumpTally: (patch) => bumpTally("sessionkit", patch),
  });

  const defeated = game.phase === "defeated";
  const defeatedReason = defeated ? "Boss defeated — raid again to keep fighting." : null;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <ModeSwitcher />
        {defeated && (
          <Button variant="ghost" onClick={() => game.reset()} className="text-xs">
            Raid again
          </Button>
        )}
      </div>

      <div id="battle-arena-panel" role="tabpanel" className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <BossCard />

        <div className="flex flex-col gap-4">
          {mode === "legacy" ? (
            <Panel className="relative p-4">
              <LegacyPopupOverlay
                open={legacy.isAwaitingSimulated}
                onApprove={() => legacy.resolveSimulated(true)}
                onReject={() => legacy.resolveSimulated(false)}
              />
              <ActionButton
                tone="amber"
                onClick={() => {
                  void legacy.attack();
                }}
                busy={legacy.isBusy}
                disabled={defeated}
                disabledReason={defeatedReason}
              />
            </Panel>
          ) : sessionkit.session ? (
            <div className="flex flex-col gap-4">
              <SessionHud session={sessionkit.session} onRevoke={sessionkit.revoke} />
              <ActionButton
                tone="cyan"
                onClick={() => {
                  void sessionkit.attack();
                }}
                busy={sessionkit.isActing}
                disabled={
                  defeated || !sessionkit.session.isActive || sessionkit.session.remainingMoves <= 0
                }
                disabledReason={
                  defeatedReason ??
                  sessionkit.refuseReason ??
                  (!sessionkit.session.isActive
                    ? "Session expired — renew below."
                    : sessionkit.session.remainingMoves <= 0
                      ? "Move budget exhausted — renew below."
                      : null)
                }
              />
              {(!sessionkit.session.isActive || sessionkit.session.remainingMoves <= 0) && (
                <Button variant="cyan" onClick={() => void sessionkit.startSession()} disabled={sessionkit.isStarting}>
                  {sessionkit.isStarting ? "Authorizing…" : "Renew session"}
                </Button>
              )}
            </div>
          ) : (
            <StartSessionPanel
              onStart={() => void sessionkit.startSession()}
              isStarting={sessionkit.isStarting}
            />
          )}

          <ComparisonStats />
        </div>
      </div>
    </section>
  );
}

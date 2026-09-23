import { mmss } from "@/lib/format";
import type { SessionState } from "@/lib/types";
import { Panel } from "../ui/Panel";

export function SessionHud({ session, onRevoke }: { session: SessionState; onRevoke: () => void }) {
  const pipCount = session.maxMoves === Infinity ? 0 : session.maxMoves;
  const pips = Array.from({ length: pipCount });

  return (
    <Panel className="p-4" aria-live="polite">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-slate-500">Session Active</span>
        <button
          type="button"
          onClick={onRevoke}
          className="text-xs text-slate-500 underline decoration-dotted hover:text-slate-300"
        >
          Revoke
        </button>
      </div>
      <div className="mb-3 flex items-baseline justify-between">
        <span className="font-mono text-2xl text-[var(--color-accent-cyan)]">
          {mmss(session.remainingMs)}
        </span>
        <span className="text-xs text-slate-500">remaining</span>
      </div>
      <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
        <span>Remaining Budget</span>
        <span className="font-mono">
          {session.remainingMoves}/{session.maxMoves} moves
        </span>
      </div>
      {pips.length > 0 && (
        <div className="flex gap-1">
          {pips.map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-sm ${
                i < session.movesUsed ? "bg-white/10" : "bg-[var(--color-accent-cyan)]"
              }`}
            />
          ))}
        </div>
      )}
    </Panel>
  );
}

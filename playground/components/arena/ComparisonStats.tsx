"use client";

import { usePlayground } from "@/lib/PlaygroundProvider";
import { Panel } from "../ui/Panel";

function StatRow({
  label,
  legacy,
  sessionkit,
}: {
  label: string;
  legacy: string;
  sessionkit: string;
}) {
  return (
    <div className="grid grid-cols-3 items-center gap-2 py-1.5 text-xs">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-mono text-[var(--color-accent-amber)]">{legacy}</span>
      <span className="text-right font-mono text-[var(--color-accent-cyan)]">{sessionkit}</span>
    </div>
  );
}

export function ComparisonStats() {
  const { stats } = usePlayground();

  return (
    <Panel className="p-4">
      <div className="mb-2 grid grid-cols-3 gap-2 text-[10px] uppercase tracking-widest text-slate-500">
        <span>This run</span>
        <span className="text-right text-[var(--color-accent-amber)]">Legacy</span>
        <span className="text-right text-[var(--color-accent-cyan)]">SessionKit</span>
      </div>
      <div className="divide-y divide-[var(--color-border-hairline)]">
        <StatRow
          label="Wallet popups"
          legacy={`${stats.legacy.popups}`}
          sessionkit={`${stats.sessionkit.popups}`}
        />
        <StatRow
          label="Time waiting on wallet"
          legacy={`${(stats.legacy.waitMs / 1000).toFixed(1)}s`}
          sessionkit={`${(stats.sessionkit.waitMs / 1000).toFixed(1)}s`}
        />
        <StatRow
          label="Gas paid by"
          legacy={stats.legacy.gasPaidByUser > 0 ? "you" : "—"}
          sessionkit={stats.sessionkit.gasPaidBySponsor > 0 ? "paymaster" : "—"}
        />
      </div>
    </Panel>
  );
}

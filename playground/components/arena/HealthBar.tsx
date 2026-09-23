import { BOSS_MAX_HP } from "@/lib/constants";

const SEGMENTS = 10;

export function HealthBar({ hp }: { hp: number }) {
  const pct = hp / BOSS_MAX_HP;
  const filledSegments = Math.ceil(pct * SEGMENTS);
  const danger = pct <= 0.25;

  return (
    <div className="w-full" aria-live="polite">
      <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
        <span>Boss HP</span>
        <span className="font-mono">
          {hp} / {BOSS_MAX_HP}
        </span>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: SEGMENTS }, (_, i) => {
          const filled = i < filledSegments;
          return (
            <div
              key={i}
              className={`h-2.5 flex-1 rounded-sm transition-colors duration-300 ${
                filled
                  ? danger
                    ? "bg-[var(--color-accent-danger)]"
                    : "bg-[var(--color-accent-cyan)]"
                  : "bg-white/10"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

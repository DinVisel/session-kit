import type { BossPhase } from "@/lib/types";

export function BossSprite({ phase, shake }: { phase: BossPhase; shake: boolean }) {
  const defeated = phase === "defeated";

  return (
    <svg
      viewBox="0 0 200 200"
      className={`h-36 w-36 ${shake ? "animate-boss-shake" : ""} ${defeated ? "opacity-40 grayscale" : ""}`}
      role="img"
      aria-label={defeated ? "Boss defeated" : "Boss"}
    >
      <ellipse cx="100" cy="170" rx="60" ry="10" fill="#000" opacity="0.35" />
      <path
        d="M100 30c-40 0-65 30-65 70 0 35 25 60 65 60s65-25 65-60c0-40-25-70-65-70Z"
        fill="#1c2130"
        stroke="var(--color-accent-danger)"
        strokeWidth="2"
      />
      <path
        d="M50 60 30 20l30 15Z"
        fill="#1c2130"
        stroke="var(--color-accent-danger)"
        strokeWidth="2"
      />
      <path
        d="M150 60 170 20l-30 15Z"
        fill="#1c2130"
        stroke="var(--color-accent-danger)"
        strokeWidth="2"
      />
      {defeated ? (
        <>
          <line x1="70" y1="95" x2="90" y2="110" stroke="#e6e9f2" strokeWidth="3" strokeLinecap="round" />
          <line x1="90" y1="95" x2="70" y2="110" stroke="#e6e9f2" strokeWidth="3" strokeLinecap="round" />
          <line x1="110" y1="95" x2="130" y2="110" stroke="#e6e9f2" strokeWidth="3" strokeLinecap="round" />
          <line x1="130" y1="95" x2="110" y2="110" stroke="#e6e9f2" strokeWidth="3" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="80" cy="100" r="9" fill="var(--color-accent-danger)" />
          <circle cx="120" cy="100" r="9" fill="var(--color-accent-danger)" />
        </>
      )}
      <path
        d={defeated ? "M75 140q25 10 50 0" : "M75 135q25 -10 50 0"}
        stroke="#e6e9f2"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

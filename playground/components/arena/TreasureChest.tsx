type ChestState = "closed" | "opening" | "looted";

export function TreasureChest({ state }: { state: ChestState }) {
  const open = state !== "closed";

  return (
    <svg
      viewBox="0 0 160 120"
      className={`h-24 w-32 ${state === "opening" ? "animate-chest-bounce" : ""}`}
      role="img"
      aria-label={
        state === "looted" ? "Treasure chest, looted" : open ? "Treasure chest, open" : "Treasure chest, closed"
      }
    >
      <rect
        x="20"
        y="60"
        width="120"
        height="45"
        rx="6"
        fill="#1c2130"
        stroke="var(--color-accent-gold)"
        strokeWidth="2"
      />
      {open ? (
        <>
          <path d="M20 60 Q80 20 140 60" fill="none" stroke="var(--color-accent-gold)" strokeWidth="2" />
          <circle cx="80" cy="45" r="10" fill="var(--color-accent-gold)" opacity={state === "looted" ? 0.3 : 0.9} />
        </>
      ) : (
        <path d="M20 60 h120" stroke="var(--color-accent-gold)" strokeWidth="2" />
      )}
      <rect x="70" y="60" width="20" height="14" rx="2" fill="var(--color-accent-gold)" />
    </svg>
  );
}

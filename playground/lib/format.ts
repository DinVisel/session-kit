export function truncateHash(value: string | null | undefined, lead = 6, trail = 4): string {
  if (!value) return "—";
  if (value.length <= lead + trail + 2) return value;
  return `${value.slice(0, lead)}…${value.slice(-trail)}`;
}

export function mmss(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function secondsLabel(ms: number): string {
  return `${(Math.max(0, ms) / 1000).toFixed(2)}s`;
}

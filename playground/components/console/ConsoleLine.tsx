import { secondsLabel } from "@/lib/format";
import type { ConsoleLine as ConsoleLineType } from "@/lib/types";

const levelClasses: Record<ConsoleLineType["level"], string> = {
  info: "text-slate-300",
  success: "text-[var(--color-accent-cyan)]",
  warn: "text-[var(--color-accent-amber)]",
  error: "text-[var(--color-accent-danger)]",
  muted: "text-slate-500",
};

const modeClasses: Record<ConsoleLineType["mode"], string> = {
  legacy: "border-l-[var(--color-accent-amber)]",
  sessionkit: "border-l-[var(--color-accent-cyan)]",
};

const HASH_PATTERN = /0x[a-fA-F0-9]{6,}/;
const SIMULATED_PATTERN = /\s*[[(]simulated[\])]/i;

export function ConsoleLine({ line }: { line: ConsoleLineType }) {
  const isSimulated = SIMULATED_PATTERN.test(line.text);
  const text = isSimulated ? line.text.replace(SIMULATED_PATTERN, "") : line.text;
  const hashMatch = text.match(HASH_PATTERN);

  return (
    <div className={`border-l-2 py-0.5 pl-3 ${modeClasses[line.mode]}`}>
      <span className="text-slate-600">[{secondsLabel(line.t)}]</span>{" "}
      <span className={levelClasses[line.level]}>
        {hashMatch && hashMatch.index !== undefined ? (
          <>
            {text.slice(0, hashMatch.index)}
            <a
              href={`https://sepolia.etherscan.io/tx/${hashMatch[0]}`}
              target="_blank"
              rel="noreferrer"
              className="underline decoration-dotted underline-offset-2 hover:text-white"
            >
              {hashMatch[0]}
            </a>
            {text.slice(hashMatch.index + hashMatch[0].length)}
          </>
        ) : (
          text
        )}
      </span>
      {isSimulated && <span className="ml-1.5 text-[10px] text-slate-600">simulated</span>}
    </div>
  );
}

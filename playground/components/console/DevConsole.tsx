"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Trash2 } from "lucide-react";
import { usePlayground } from "@/lib/PlaygroundProvider";
import { Panel } from "../ui/Panel";
import { Button } from "../ui/Button";
import { CopyButton } from "../ui/CopyButton";
import { ConsoleLine } from "./ConsoleLine";

export function DevConsole() {
  const { eventLog } = usePlayground();
  const [autoscroll, setAutoscroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!autoscroll || !scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [eventLog.lines, autoscroll]);

  const allText = eventLog.lines
    .map((l) => `[${(l.t / 1000).toFixed(2)}s] (${l.mode}) ${l.text}`)
    .join("\n");

  return (
    <Panel className="relative flex flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-full overflow-hidden opacity-[0.04]">
        <div className="animate-scanline-sweep h-24 w-full bg-gradient-to-b from-transparent via-[var(--color-accent-cyan)] to-transparent" />
      </div>
      <div className="flex items-center justify-between border-b border-[var(--color-border-hairline)] px-4 py-2.5">
        <h2 className="font-mono text-xs font-semibold uppercase tracking-widest text-slate-400">
          Live Developer Console
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="px-2 py-1 text-xs"
            onClick={() => setAutoscroll((v) => !v)}
            aria-pressed={autoscroll}
          >
            {autoscroll ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {autoscroll ? "Pause" : "Resume"}
          </Button>
          <Button variant="ghost" className="px-2 py-1 text-xs" onClick={eventLog.clear}>
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </Button>
          <CopyButton value={allText || "// no output yet"} label="Copy all" />
        </div>
      </div>
      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        className="h-72 overflow-y-auto px-2 py-2 font-mono text-xs leading-relaxed"
      >
        {eventLog.lines.length === 0 ? (
          <p className="px-3 py-2 text-slate-600">// start a raid to see events stream in</p>
        ) : (
          eventLog.lines.map((line) => <ConsoleLine key={line.id} line={line} />)
        )}
      </div>
    </Panel>
  );
}

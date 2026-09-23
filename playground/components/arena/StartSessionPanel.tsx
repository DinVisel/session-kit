import { Zap } from "lucide-react";
import { SESSION_DURATION_S, SESSION_MAX_MOVES } from "@/lib/constants";
import { Button } from "../ui/Button";
import { Panel } from "../ui/Panel";

export function StartSessionPanel({
  onStart,
  isStarting,
}: {
  onStart: () => void;
  isStarting: boolean;
}) {
  const minutes = Math.round(SESSION_DURATION_S / 60);

  return (
    <Panel className="flex flex-col items-center gap-3 p-6 text-center">
      <p className="text-xs uppercase tracking-widest text-slate-500">One popup, then zero</p>
      <Button variant="cyan" onClick={onStart} disabled={isStarting} className="w-full py-3">
        <Zap className="h-4 w-4" />
        {isStarting ? "Authorizing…" : `Start Session: ${SESSION_MAX_MOVES} Moves / ${minutes} Minutes`}
      </Button>
      <p className="text-xs text-slate-500">
        Every move after this signs in-memory — no more wallet popups until the budget or timer
        runs out.
      </p>
    </Panel>
  );
}

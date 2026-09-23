"use client";

import { ShieldAlert } from "lucide-react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

interface LegacyPopupOverlayProps {
  open: boolean;
  onApprove: () => void;
  onReject: () => void;
}

export function LegacyPopupOverlay({ open, onApprove, onReject }: LegacyPopupOverlayProps) {
  if (!open) return null;

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-xs rounded-lg border border-[var(--color-accent-amber)]/40 bg-[var(--color-surface-panel)] p-4 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-[var(--color-accent-amber)]" />
            <span className="text-sm font-semibold text-slate-100">Wallet Request</span>
          </div>
          <Badge tone="amber">simulated</Badge>
        </div>
        <p className="mb-4 text-xs leading-relaxed text-slate-400">
          No wallet extension detected — this popup mimics a real MetaMask signature request so
          the interaction cost still shows up in the numbers.
        </p>
        <div className="mb-4 h-1 overflow-hidden rounded-full bg-white/5">
          <div className="h-full w-1/3 animate-pulse bg-[var(--color-accent-amber)]" />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" className="px-3 py-1.5 text-xs" onClick={onReject}>
            Reject
          </Button>
          <Button variant="amber" className="px-3 py-1.5 text-xs" onClick={onApprove}>
            Sign
          </Button>
        </div>
      </div>
    </div>
  );
}

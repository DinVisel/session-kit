"use client";

import { Swords } from "lucide-react";
import { Button } from "../ui/Button";
import { Tooltip } from "../ui/Tooltip";

interface ActionButtonProps {
  onClick: () => void;
  disabled: boolean;
  disabledReason?: string | null;
  busy: boolean;
  tone: "amber" | "cyan";
  label?: string;
}

export function ActionButton({
  onClick,
  disabled,
  disabledReason,
  busy,
  tone,
  label = "Fast Attack",
}: ActionButtonProps) {
  const button = (
    <Button variant={tone} onClick={onClick} disabled={disabled || busy} className="w-full py-3 text-sm">
      <Swords className="h-4 w-4" />
      {busy ? "Working…" : label}
    </Button>
  );

  if (disabled && disabledReason) {
    return <Tooltip content={disabledReason}>{button}</Tooltip>;
  }

  return button;
}

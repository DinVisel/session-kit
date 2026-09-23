"use client";

import { AlertTriangle } from "lucide-react";
import { usePlayground } from "@/lib/PlaygroundProvider";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

export function NetworkBadge() {
  const { wallet } = usePlayground();

  if (!wallet.account) {
    return <Badge tone="muted">Sepolia Testnet</Badge>;
  }

  if (wallet.isWrongNetwork) {
    return (
      <div className="flex items-center gap-2">
        <Badge tone="amber">
          <AlertTriangle className="h-3 w-3" />
          Wrong network
        </Badge>
        <Button variant="amber" className="px-2 py-1 text-xs" onClick={wallet.switchToSepolia}>
          Switch to Sepolia
        </Button>
      </div>
    );
  }

  return <Badge tone="cyan">Sepolia Testnet</Badge>;
}

"use client";

import { usePlayground } from "@/lib/PlaygroundProvider";
import { truncateHash } from "@/lib/format";
import { Button } from "../ui/Button";

export function ConnectWalletButton() {
  const { wallet } = usePlayground();

  if (wallet.account) {
    return (
      <Button variant="ghost" onClick={wallet.disconnect} title="Disconnect">
        {truncateHash(wallet.account)}
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="cyan" onClick={wallet.connect} disabled={wallet.isConnecting}>
        {wallet.isConnecting
          ? "Connecting…"
          : wallet.hasWallet
            ? "Connect Wallet"
            : "No Wallet Detected"}
      </Button>
      {wallet.error && (
        <p role="status" className="max-w-[220px] text-right text-xs text-[var(--color-accent-danger)]">
          {wallet.error}
        </p>
      )}
    </div>
  );
}

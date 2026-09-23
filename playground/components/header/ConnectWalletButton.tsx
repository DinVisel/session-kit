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
    <Button variant="cyan" onClick={wallet.connect} disabled={wallet.isConnecting}>
      {wallet.isConnecting
        ? "Connecting…"
        : wallet.hasWallet
          ? "Connect Wallet"
          : "No Wallet Detected"}
    </Button>
  );
}

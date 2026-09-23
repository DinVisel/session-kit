"use client";

import { useCallback, useEffect, useState } from "react";
import { createWalletClient, custom, type Address } from "viem";
import { sepolia } from "viem/chains";
import { SEPOLIA_CHAIN_ID } from "./constants";

export function getEthereumProvider(): any | null {
  if (typeof window === "undefined") return null;
  return (window as any).ethereum ?? null;
}

interface WalletState {
  hasWallet: boolean;
  account: Address | null;
  chainId: number | null;
  isConnecting: boolean;
  error: string | null;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    hasWallet: false,
    account: null,
    chainId: null,
    isConnecting: false,
    error: null,
  });

  useEffect(() => {
    const provider = getEthereumProvider();
    setState((s) => ({ ...s, hasWallet: !!provider }));
    if (!provider) return;

    provider
      .request({ method: "eth_accounts" })
      .then((accounts: Address[]) => {
        const account = accounts[0];
        if (account) setState((s) => ({ ...s, account }));
      })
      .catch(() => {});

    provider
      .request({ method: "eth_chainId" })
      .then((hex: string) => setState((s) => ({ ...s, chainId: parseInt(hex, 16) })))
      .catch(() => {});

    const onAccountsChanged = (accounts: Address[]) =>
      setState((s) => ({ ...s, account: accounts[0] ?? null }));
    const onChainChanged = (hex: string) =>
      setState((s) => ({ ...s, chainId: parseInt(hex, 16) }));

    provider.on?.("accountsChanged", onAccountsChanged);
    provider.on?.("chainChanged", onChainChanged);
    return () => {
      provider.removeListener?.("accountsChanged", onAccountsChanged);
      provider.removeListener?.("chainChanged", onChainChanged);
    };
  }, []);

  const connect = useCallback(async () => {
    const provider = getEthereumProvider();
    if (!provider) {
      setState((s) => ({ ...s, error: "No EVM wallet detected." }));
      return;
    }
    setState((s) => ({ ...s, isConnecting: true, error: null }));
    try {
      const client = createWalletClient({ chain: sepolia, transport: custom(provider) });
      const [account] = await client.requestAddresses();
      setState((s) => ({ ...s, account: account ?? null, isConnecting: false }));
    } catch (err) {
      setState((s) => ({
        ...s,
        isConnecting: false,
        error: err instanceof Error ? err.message : "Failed to connect wallet.",
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    setState((s) => ({ ...s, account: null }));
  }, []);

  const switchToSepolia = useCallback(async () => {
    const provider = getEthereumProvider();
    if (!provider) return;
    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}` }],
      });
    } catch (err) {
      setState((s) => ({
        ...s,
        error: err instanceof Error ? err.message : "Failed to switch network.",
      }));
    }
  }, []);

  return {
    ...state,
    isWrongNetwork:
      state.account !== null && state.chainId !== null && state.chainId !== SEPOLIA_CHAIN_ID,
    connect,
    disconnect,
    switchToSepolia,
  };
}

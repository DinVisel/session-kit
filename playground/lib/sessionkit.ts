import { SessionKit } from "@sessionkit/sdk";
import { zeroAddress, type Address } from "viem";

let instance: SessionKit | null = null;

// Memoized so every hook/component shares one in-memory session key.
export function getSessionKit(): SessionKit {
  if (instance) return instance;

  const validatorAddress =
    (process.env.NEXT_PUBLIC_VALIDATOR_ADDRESS as Address | undefined) || zeroAddress;

  instance = new SessionKit({
    apiKey: process.env.NEXT_PUBLIC_SESSIONKIT_API_KEY || "playground-demo-key",
    // Empty string resolves to this app's own same-origin /api/relay-tx route.
    relayerUrl: process.env.NEXT_PUBLIC_RELAYER_URL || "",
    validatorAddress,
    mode: "auto",
    allowMockRelayer: true,
  });

  return instance;
}

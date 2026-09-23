import {
  createWalletClient,
  custom,
  keccak256,
  zeroAddress,
  type Address,
  type Hash,
  type Hex,
} from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

export interface SessionConfig {
  apiKey: string;
  relayerUrl?: string;
  validatorAddress: Address;
  mode?: "auto" | "live" | "mock";
  allowMockRelayer?: boolean;
  relayTimeoutMs?: number;
}

export interface SessionOptions {
  durationInSeconds?: number;
  maxSpend?: number;
  maxMoves?: number;
}

export interface SessionState {
  userAddress: Address | null;
  sessionSigner: Address;
  createdAt: number;
  expiresAt: number;
  remainingMs: number;
  maxSpend: number;
  spent: number;
  maxMoves: number;
  movesUsed: number;
  remainingMoves: number;
  isActive: boolean;
  simulated: boolean;
}

export type RelayTier = "relayer" | "local-route" | "in-sdk-mock";

export type SessionKitErrorCode =
  | "NO_WALLET"
  | "USER_REJECTED"
  | "NO_ACTIVE_SESSION"
  | "SESSION_EXPIRED"
  | "MOVE_BUDGET_EXCEEDED"
  | "SPEND_LIMIT_EXCEEDED"
  | "RELAY_FAILED";

export class SessionKitError extends Error {
  readonly code: SessionKitErrorCode;

  constructor(code: SessionKitErrorCode, message: string) {
    super(message);
    this.name = "SessionKitError";
    this.code = code;
  }
}

export type SessionKitEvent =
  | { type: "session:requested"; at: number }
  | {
      type: "session:created";
      at: number;
      sessionSigner: Address;
      txHash: Hash | null;
      expiresAt: number;
      simulated: boolean;
    }
  | { type: "session:revoked"; at: number }
  | { type: "session:expired"; at: number }
  | { type: "action:dispatched"; at: number; nonce: number; action: string }
  | {
      type: "action:signed";
      at: number;
      nonce: number;
      signer: Address;
      signature: Hex;
      elapsedMs: number;
    }
  | {
      type: "action:relayed";
      at: number;
      nonce: number;
      txHash: Hash;
      sponsored: boolean;
      simulated: boolean;
      via: RelayTier;
      elapsedMs: number;
    }
  | {
      type: "action:failed";
      at: number;
      nonce: number;
      reason: string;
      code: SessionKitErrorCode;
    };

interface RelayResult {
  txHash: Hash;
  sponsored: boolean;
  simulated: boolean;
  via: RelayTier;
}

type ResolvedConfig = SessionConfig & {
  relayerUrl: string;
  mode: "auto" | "live" | "mock";
  allowMockRelayer: boolean;
  relayTimeoutMs: number;
};

const ENABLE_SESSION_ABI = [
  {
    name: "enableSession",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_sessionSigner", type: "address" },
      { name: "_duration", type: "uint256" },
      { name: "_maxSpend", type: "uint256" },
    ],
    outputs: [],
  },
] as const;

function isUserRejection(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const code = (err as any).code ?? (err as any).cause?.code;
  return code === 4001;
}

export class SessionKit {
  private config: ResolvedConfig;
  private sessionPrivateKey: Hex | null = null;
  private userAddress: Address | null = null;
  private createdAt = 0;
  private expiresAt = 0;
  private maxSpend = 0;
  private spent = 0;
  private maxMoves = Infinity;
  private movesUsed = 0;
  private simulated = true;
  private expiredEmitted = false;
  private nonceCounter = 0;
  private listeners = new Set<(event: SessionKitEvent) => void>();

  constructor(config: SessionConfig) {
    this.config = {
      relayerUrl: "https://api.sessionkit.dev",
      mode: "auto",
      allowMockRelayer: true,
      relayTimeoutMs: 4000,
      ...config,
    };
  }

  on(handler: (event: SessionKitEvent) => void): () => void {
    this.listeners.add(handler);
    return () => {
      this.listeners.delete(handler);
    };
  }

  private emit(event: SessionKitEvent): void {
    for (const handler of this.listeners) handler(event);
  }

  private checkExpiry(): void {
    if (this.sessionPrivateKey && !this.expiredEmitted && Date.now() >= this.expiresAt) {
      this.expiredEmitted = true;
      this.emit({ type: "session:expired", at: Date.now() });
    }
  }

  getSession(): SessionState | null {
    if (!this.sessionPrivateKey) return null;
    this.checkExpiry();
    const remainingMs = Math.max(0, this.expiresAt - Date.now());
    return {
      userAddress: this.userAddress,
      sessionSigner: privateKeyToAccount(this.sessionPrivateKey).address,
      createdAt: this.createdAt,
      expiresAt: this.expiresAt,
      remainingMs,
      maxSpend: this.maxSpend,
      spent: this.spent,
      maxMoves: this.maxMoves,
      movesUsed: this.movesUsed,
      remainingMoves: Math.max(0, this.maxMoves - this.movesUsed),
      isActive: remainingMs > 0,
      simulated: this.simulated,
    };
  }

  isActive(): boolean {
    return this.getSession()?.isActive ?? false;
  }

  revoke(): void {
    if (!this.sessionPrivateKey) return;
    this.sessionPrivateKey = null;
    this.emit({ type: "session:revoked", at: Date.now() });
  }

  async createSession(
    options: SessionOptions = {}
  ): Promise<{ txHash: Hash | null; sessionSigner: Address; simulated: boolean }> {
    this.emit({ type: "session:requested", at: Date.now() });

    const duration = options.durationInSeconds ?? 3600;
    const maxSpend = options.maxSpend ?? 100;
    const maxMoves = options.maxMoves ?? Infinity;

    const hasWallet = typeof window !== "undefined" && !!(window as any).ethereum;
    const hasRealValidator = this.config.validatorAddress !== zeroAddress;
    const useLivePath =
      this.config.mode === "live" ||
      (this.config.mode === "auto" && hasWallet && hasRealValidator);

    const sessionPrivateKey = generatePrivateKey();
    const sessionAccount = privateKeyToAccount(sessionPrivateKey);

    let txHash: Hash | null = null;
    let userAddress: Address | null = null;
    let simulated = true;

    if (useLivePath) {
      if (!hasWallet) {
        throw new SessionKitError("NO_WALLET", "No EVM-compatible wallet (e.g. MetaMask) found.");
      }
      try {
        const browserClient = createWalletClient({
          chain: sepolia,
          transport: custom((window as any).ethereum),
        });
        const [account] = await browserClient.requestAddresses();
        userAddress = account;

        txHash = await browserClient.writeContract({
          address: this.config.validatorAddress,
          abi: ENABLE_SESSION_ABI,
          functionName: "enableSession",
          args: [sessionAccount.address, BigInt(duration), BigInt(maxSpend)],
          account: userAddress,
        });
        simulated = false;
      } catch (err) {
        if (isUserRejection(err)) {
          throw new SessionKitError(
            "USER_REJECTED",
            "User rejected the session authorization request."
          );
        }
        throw err;
      }
    }

    this.sessionPrivateKey = sessionPrivateKey;
    this.userAddress = userAddress;
    this.createdAt = Date.now();
    this.expiresAt = this.createdAt + duration * 1000;
    this.maxSpend = maxSpend;
    this.spent = 0;
    this.maxMoves = maxMoves;
    this.movesUsed = 0;
    this.simulated = simulated;
    this.expiredEmitted = false;
    this.nonceCounter = 0;

    this.emit({
      type: "session:created",
      at: Date.now(),
      sessionSigner: sessionAccount.address,
      txHash,
      expiresAt: this.expiresAt,
      simulated,
    });

    return { txHash, sessionSigner: sessionAccount.address, simulated };
  }

  private async relay(
    sessionSigner: Address,
    payload: Record<string, any>,
    signature: Hex
  ): Promise<RelayResult> {
    const relayerUrl = this.config.relayerUrl;
    const via: RelayTier = /^https?:\/\//i.test(relayerUrl) ? "relayer" : "local-route";

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.relayTimeoutMs);
    try {
      const res = await fetch(`${relayerUrl}/api/relay-tx`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.config.apiKey,
        },
        body: JSON.stringify({ sessionSigner, payload, signature }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`Relayer responded with ${res.status}`);
      const json = await res.json();
      return {
        txHash: json.txHash,
        sponsored: json.sponsored ?? true,
        simulated: json.simulated ?? false,
        via,
      };
    } catch (err) {
      if (!this.config.allowMockRelayer) {
        throw new SessionKitError(
          "RELAY_FAILED",
          err instanceof Error ? err.message : "Relay failed."
        );
      }
      // No relayer reachable: synthesize a receipt so the action still completes offline.
      return {
        txHash: keccak256(signature),
        sponsored: true,
        simulated: true,
        via: "in-sdk-mock",
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async execute(actionPayload: Record<string, any>, spendAmount: number = 0): Promise<RelayResult> {
    if (!this.sessionPrivateKey) {
      throw new SessionKitError(
        "NO_ACTIVE_SESSION",
        "No active session. Call createSession() first."
      );
    }

    this.checkExpiry();

    const nonce = this.nonceCounter++;
    const action = typeof actionPayload.action === "string" ? actionPayload.action : "UNKNOWN";
    const dispatchStart = Date.now();
    this.emit({ type: "action:dispatched", at: dispatchStart, nonce, action });

    const fail = (reason: string, code: SessionKitErrorCode): never => {
      this.emit({ type: "action:failed", at: Date.now(), nonce, reason, code });
      throw new SessionKitError(code, reason);
    };

    if (Date.now() >= this.expiresAt) {
      fail("Session has expired.", "SESSION_EXPIRED");
    }
    if (this.movesUsed + 1 > this.maxMoves) {
      fail(`Move budget exhausted (${this.movesUsed}/${this.maxMoves}).`, "MOVE_BUDGET_EXCEEDED");
    }
    if (this.spent + spendAmount > this.maxSpend) {
      fail(
        `Spend limit exceeded (${this.spent + spendAmount}/${this.maxSpend}).`,
        "SPEND_LIMIT_EXCEEDED"
      );
    }

    const sessionAccount = privateKeyToAccount(this.sessionPrivateKey);
    const payload = { ...actionPayload, spendAmount, nonce, timestamp: dispatchStart };
    const signature = await sessionAccount.signMessage({ message: JSON.stringify(payload) });
    this.emit({
      type: "action:signed",
      at: Date.now(),
      nonce,
      signer: sessionAccount.address,
      signature,
      elapsedMs: Date.now() - dispatchStart,
    });

    let relay: RelayResult;
    try {
      relay = await this.relay(sessionAccount.address, payload, signature);
    } catch (err) {
      const code = err instanceof SessionKitError ? err.code : "RELAY_FAILED";
      const reason = err instanceof Error ? err.message : "Relay failed.";
      this.emit({ type: "action:failed", at: Date.now(), nonce, reason, code });
      throw err instanceof SessionKitError ? err : new SessionKitError("RELAY_FAILED", reason);
    }

    this.spent += spendAmount;
    this.movesUsed += 1;

    this.emit({
      type: "action:relayed",
      at: Date.now(),
      nonce,
      txHash: relay.txHash,
      sponsored: relay.sponsored,
      simulated: relay.simulated,
      via: relay.via,
      elapsedMs: Date.now() - dispatchStart,
    });

    return relay;
  }
}

import { describe, it, expect, vi, afterEach } from "vitest";
import { zeroAddress } from "viem";
import { SessionKit, type SessionConfig, type SessionKitEvent } from "../src/index";

function createKit(overrides: Partial<SessionConfig> = {}) {
  return new SessionKit({
    apiKey: "test-key",
    validatorAddress: zeroAddress,
    mode: "mock",
    ...overrides,
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("SessionKit", () => {
  it("rejects a move before signing once the move budget is exhausted", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const kit = createKit();
    await kit.createSession({ durationInSeconds: 900, maxMoves: 1 });
    await kit.execute({ action: "SLASH_BOSS" });

    const events: SessionKitEvent[] = [];
    kit.on((e) => events.push(e));

    await expect(kit.execute({ action: "SLASH_BOSS" })).rejects.toMatchObject({
      code: "MOVE_BUDGET_EXCEEDED",
    });
    expect(events.map((e) => e.type)).toEqual(["action:dispatched", "action:failed"]);
  });

  it("rejects a move before signing once the session has expired", async () => {
    vi.useFakeTimers();
    const kit = createKit();
    await kit.createSession({ durationInSeconds: 1, maxMoves: 10 });
    vi.advanceTimersByTime(1500);

    const events: SessionKitEvent[] = [];
    kit.on((e) => events.push(e));

    await expect(kit.execute({ action: "SLASH_BOSS" })).rejects.toMatchObject({
      code: "SESSION_EXPIRED",
    });
    // execute() lazily detects the expiry first, emitting session:expired once,
    // before the action's own dispatched/failed pair.
    expect(events.map((e) => e.type)).toEqual([
      "session:expired",
      "action:dispatched",
      "action:failed",
    ]);
  });

  it("falls back to the in-SDK mock relayer when the relayer is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    const kit = createKit({ relayerUrl: "https://relayer.example" });
    await kit.createSession({ durationInSeconds: 900, maxMoves: 10 });

    const result = await kit.execute({ action: "SLASH_BOSS" });

    expect(result.simulated).toBe(true);
    expect(result.via).toBe("in-sdk-mock");
  });

  it("emits dispatched -> signed -> relayed in order for one successful action", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ txHash: "0xabc", sponsored: true, simulated: false }),
      })
    );
    const kit = createKit();
    await kit.createSession({ durationInSeconds: 900, maxMoves: 10 });

    const events: SessionKitEvent[] = [];
    kit.on((e) => events.push(e));
    await kit.execute({ action: "SLASH_BOSS" });

    expect(events.map((e) => e.type)).toEqual([
      "action:dispatched",
      "action:signed",
      "action:relayed",
    ]);
  });

  it("revoke() clears the session key and isActive() goes false", async () => {
    const kit = createKit();
    await kit.createSession({ durationInSeconds: 900, maxMoves: 10 });
    expect(kit.isActive()).toBe(true);

    kit.revoke();

    expect(kit.isActive()).toBe(false);
    expect(kit.getSession()).toBeNull();
  });
});

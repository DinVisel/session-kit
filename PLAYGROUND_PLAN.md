# SessionKit Playground — Implementation Plan

A Next.js demo that puts traditional Web3 gaming UX (a wallet popup on every
move) side by side with `@sessionkit/sdk` (authorize once, then zero popups),
built around a mini "Dungeon Boss Raid".

---

## 0. Decisions taken

| # | Question | Decision |
|---|----------|----------|
| 1 | Where the app lives | New self-contained `playground/` folder. Foundry, `app/client.ts`, `api/server.ts` untouched. |
| 2 | SDK package name | Rename `sessionkit-sdk` → `@sessionkit/sdk`. The badge, the docs and the imports all agree. |
| 3 | Legacy mode behaviour | Real `personal_sign` popup per click (real MetaMask, real human latency, no gas, no testnet ETH). Simulated popup when no wallet is injected. |
| 4 | Session state & timings | Extend the SDK (`getSession()`, budget/expiry, event bus). The HUD and console read genuine SDK lifecycle events, not playground bookkeeping. |

---

## 1. Current state of the repo (what we're building on)

- Root is a **Foundry project** (`src/`, `test/`, `script/`, `lib/forge-std`) plus a
  plain **CommonJS TypeScript** package (`api/server.ts`, `app/client.ts`).
- **No React, Next.js or Tailwind exists anywhere yet.**
- `sessionkit-sdk/` is present but **untracked in git**, and its `dist/` is covered
  by the root `.gitignore` (`dist/`).
- `SessionKit` today exposes exactly two methods: `createSession()` and
  `execute()`. No timer, no budget counter, no events, no revoke.
- `SessionValidator.sol` stores `{userAddress, sessionSigner, validUntil, maxSpendAmount}`
  keyed by session signer, with `enableSession` / `validateSession`.
- Node 24.13, npm 11.6.

### Collisions to handle explicitly

| Collision | Resolution |
|-----------|-----------|
| Root `app/` is `app/client.ts`, not an App Router directory | The Next app is `playground/app/`, so the spec's `app/page.tsx` becomes `playground/app/page.tsx`. |
| `api/server.ts` binds :3000; Next dev also defaults to :3000 | Next dev/start pinned to **:3001** in `playground/package.json`. Express relayer keeps :3000. |
| `dist/` is gitignored, but `file:../sessionkit-sdk` resolves through `dist/` | Add `"prepare": "npm run build"` to the SDK so `npm install` builds it on a fresh clone. |
| SDK `package.json` has `main`/`module`/`types` but no `exports` map | Add an `exports` map so Next/Turbopack resolves ESM cleanly and doesn't dual-load viem. |
| viem could be duplicated between SDK and playground | Pin the same `viem` range in both; declare viem as a `peerDependency` of the SDK. |

---

## 2. Phase 1 — Extend the SDK (`sessionkit-sdk/`)

### 2.1 Package metadata

```jsonc
{
  "name": "@sessionkit/sdk",
  "version": "0.2.0",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    }
  },
  "peerDependencies": { "viem": "^2.56.8" },
  "scripts": { "build": "tsup ...", "prepare": "npm run build" }
}
```

### 2.2 New public surface (`src/index.ts`)

Everything existing stays source-compatible. Added:

```ts
export interface SessionConfig {
  apiKey: string;
  relayerUrl?: string;
  validatorAddress: Address;
  mode?: "auto" | "live" | "mock";   // default "auto"
  allowMockRelayer?: boolean;        // default true
  relayTimeoutMs?: number;           // default 4000
}

export interface SessionOptions {
  durationInSeconds?: number;
  maxSpend?: number;
  maxMoves?: number;                 // NEW — drives the "8/10 moves" tracker
}

export interface SessionState {
  userAddress: Address | null;
  sessionSigner: Address;
  createdAt: number;
  expiresAt: number;
  remainingMs: number;               // computed on read, never a stored ticker
  maxSpend: number;
  spent: number;
  maxMoves: number;
  movesUsed: number;
  remainingMoves: number;
  isActive: boolean;
  simulated: boolean;                // true when no on-chain authorization happened
}

export type RelayTier = "relayer" | "local-route" | "in-sdk-mock";

export type SessionKitEvent =
  | { type: "session:requested"; at: number }
  | { type: "session:created";   at: number; sessionSigner: Address; txHash: Hash | null; expiresAt: number; simulated: boolean }
  | { type: "session:revoked";   at: number }
  | { type: "session:expired";   at: number }
  | { type: "action:dispatched"; at: number; nonce: number; action: string }
  | { type: "action:signed";     at: number; nonce: number; signer: Address; signature: Hex; elapsedMs: number }
  | { type: "action:relayed";    at: number; nonce: number; txHash: Hash; sponsored: boolean; simulated: boolean; via: RelayTier; elapsedMs: number }
  | { type: "action:failed";     at: number; nonce: number; reason: string; code: SessionKitErrorCode };

class SessionKit {
  getSession(): SessionState | null;
  isActive(): boolean;
  revoke(): void;                                        // wipes the in-memory key
  on(handler: (e: SessionKitEvent) => void): () => void; // returns unsubscribe
}
```

### 2.3 Behavioural changes

- **`createSession()`**
  - `mode: "live"` (or `"auto"` + injected wallet + non-placeholder `validatorAddress`):
    unchanged real path — request addresses, generate ephemeral key, `writeContract(enableSession)`.
  - `mode: "mock"` (or `"auto"` with no wallet / placeholder validator): generate the
    ephemeral key, skip the chain call, return `{ txHash: null, simulated: true }`.
  - Typed errors instead of bare strings: user rejection (EIP-1193 `4001`) →
    `SessionKitError` with `code: "USER_REJECTED"`.
  - Records `expiresAt`, `maxSpend`, `maxMoves`; emits `session:requested` then `session:created`.

- **`execute()`**
  - Guard **before** signing: expired → `code: "SESSION_EXPIRED"`; over move budget →
    `"MOVE_BUDGET_EXCEEDED"`; over spend cap → `"SPEND_LIMIT_EXCEEDED"`. Each emits
    `action:failed`. This mirrors `SessionValidator.validateSession` client-side so the
    UI can refuse a move without a round-trip.
  - Attaches a monotonically increasing `nonce` to the payload (replay hygiene, and it
    gives the console a stable id to group the three lines of one action).
  - Emits `action:dispatched` → `action:signed` → `action:relayed`, each carrying
    `elapsedMs` measured from dispatch. **These timings are what the console prints.**
  - Increments `spent` / `movesUsed` only on a successful relay.

- **Graceful relayer fallback** (the "works offline" requirement):
  1. `POST {relayerUrl}/api/relay-tx` with an `AbortController` timeout.
  2. On network error, timeout, or non-2xx → if `allowMockRelayer`, synthesize
     `{ success: true, txHash: <derived from signature bytes>, sponsored: true, simulated: true }`.
  3. The emitted `action:relayed` carries `via` and `simulated`, so the UI can render an
     honest `simulated` tag rather than pretending a chain write happened.

- **No `setInterval` inside the SDK.** `remainingMs` is computed at read time; expiry is
  detected lazily on `getSession()` / `execute()` and emits `session:expired` once.

### 2.4 Tests

`sessionkit-sdk/test/` with Vitest (new dev dep):
- budget exhaustion rejects before signing
- expiry rejects before signing
- relayer offline → falls back to mock and flags `simulated: true`
- emitted event order for one successful action
- `revoke()` clears the key and `isActive()` goes false

> Note: comments in `src/index.ts` are currently Turkish. New SDK comments will follow
> that existing style; playground code will be commented in English. Say the word if you
> want it uniform either way.

---

## 3. Phase 2 — Playground scaffold (`playground/`)

```
playground/
├── package.json          # next 15, react 19, tailwindcss 4, viem, lucide-react,
│                         # "@sessionkit/sdk": "file:../sessionkit-sdk"
│                         # dev/start scripts pinned to -p 3001
├── tsconfig.json         # strict, noUncheckedIndexedAccess, paths "@/*"
├── next.config.ts
├── postcss.config.mjs
├── .env.example          # NEXT_PUBLIC_RELAYER_URL, NEXT_PUBLIC_VALIDATOR_ADDRESS,
│                         # NEXT_PUBLIC_SESSIONKIT_API_KEY, NEXT_PUBLIC_CHAIN_ID
└── (see file map below)
```

Root `.gitignore` gains `.next/`, `playground/node_modules/`, `next-env.d.ts`.

### 3.1 Design language

Dark, cyberpunk-terminal. Tokens declared once in `globals.css` via Tailwind v4 `@theme`:

- Surfaces: near-black `#07080d` → panel `#0d1017`, hairline borders `#1c2130`.
- Accents: SessionKit cyan `#22d3ee`, legacy amber `#f59e0b` — the two modes are
  colour-coded everywhere (tabs, console lines, stats) — loot gold `#fbbf24`,
  danger `#f43f5e`.
- Type: Inter (UI) + JetBrains Mono (console, hashes, code) via `next/font`.
- Motion: CSS keyframes only — boss shake on hit, chest bounce, damage float-up,
  scanline sweep on the console. **All wrapped in `@media (prefers-reduced-motion: reduce)`.**

### 3.2 File map

```
app/
  layout.tsx                  fonts, metadata, dark shell
  globals.css                 tailwind import, @theme tokens, keyframes
  page.tsx                    server component; composes Header / Arena / Console / CTA
  api/relay-tx/route.ts       local mock relayer (see §5)

components/
  header/
    SiteHeader.tsx
    ConnectWalletButton.tsx   connect / truncated address / disconnect
    NetworkBadge.tsx          "Sepolia Testnet", warns + offers switch on wrong chain
    InstallBadge.tsx          copyable `npm i @sessionkit/sdk`
  arena/
    BattleArena.tsx           mode state, orchestrates hooks → event log
    ModeSwitcher.tsx          "Legacy Web3" | "SessionKit (Zero Popup)"
    BossCard.tsx              boss + chest stage
    BossSprite.tsx            inline animated SVG (idle / hit / defeated)
    TreasureChest.tsx         inline SVG (closed / opening / looted)
    HealthBar.tsx             segmented bar, animated depletion
    ActionButton.tsx          "Fast Attack / Loot"; disabled + reason when budget spent
    SessionHud.tsx            `14:32 remaining` + `Remaining Budget: 8/10 moves`
    StartSessionPanel.tsx     "Start Session: 10 Moves / 15 Minutes"
    LegacyPopupOverlay.tsx    simulated MetaMask modal (no-wallet fallback only)
    ComparisonStats.tsx       popups this run · time spent waiting on wallet · who paid gas
    FloatingDamage.tsx
  console/
    DevConsole.tsx            terminal chrome, autoscroll, pause, clear, copy-all
    ConsoleLine.tsx           `[0.00s]` + level colour + tx link to Sepolia explorer
  cta/
    IntegrationCta.tsx        "Integrate in 3 lines of code"
    CodeBlock.tsx             tiny hand-rolled TS highlighter (no runtime dependency)
    QuickLinks.tsx            GitHub · Docs · npm
  ui/
    Panel.tsx  Button.tsx  Badge.tsx  CopyButton.tsx  Tooltip.tsx

lib/
  sessionkit.ts        memoized SessionKit factory, config from NEXT_PUBLIC_* env
  useWallet.ts         EIP-1193 + viem: connect, account, chainId, switch to Sepolia
  useEventLog.ts       bounded ring buffer (500), t0-relative timestamps
  useGameState.ts      boss HP, phase, loot, seeded damage rolls (deterministic)
  useLegacyAction.ts   personal_sign flow, measures human latency, counts popups
  useSessionAction.ts  SDK flow; subscribes to SDK events and pipes them to the log
  format.ts            truncateHash, mmss, seconds-since-t0
  constants.ts         SESSION_DURATION_S = 900, SESSION_MAX_MOVES = 10, BOSS_MAX_HP
  types.ts
```

Everything under `components/` that holds state is `"use client"`; `app/page.tsx` stays
a server component and only composes.

---

## 4. Phase 3 — The three sections

### 4.1 Header

Branding "SessionKit Playground" + copyable `npm i @sessionkit/sdk` badge (clipboard with
a "Copied" state and a fallback for non-secure contexts). Wallet button shows
`0x1234…abcd` when connected. Network badge turns amber and offers
`wallet_switchEthereumChain` when the wallet isn't on Sepolia. **Nothing in the demo is
gated on being connected** — every mode degrades to a simulated path.

### 4.2 Battle Arena

Shared game state across both modes so the contrast is apples-to-apples: same boss, same
damage rolls, same HP bar. Only the *transaction path* differs.

**Legacy Web3 mode** — each click on "Fast Attack":

1. Log `Action dispatched: 'SLASH_BOSS'`.
2. `personal_sign` on the injected provider → **real MetaMask popup**. Log
   `Awaiting wallet approval — popup #N`.
3. Measure wall-clock until resolve/reject. Log the confirm with the human latency
   called out, or `User rejected (move lost)` on `4001`.
4. HP only drops after the signature returns — the input lag *is* the lesson.
5. No wallet injected → `LegacyPopupOverlay`, a styled fake-MetaMask modal with a
   realistic delay, clearly labelled `simulated`.

**SessionKit mode**:

1. `StartSessionPanel` → `createSession({ durationInSeconds: 900, maxMoves: 10 })` — the
   single popup (or a simulated one). The panel is then replaced by `SessionHud`.
2. Every subsequent click calls `kit.execute({ action: "SLASH_BOSS" }, 1)`. HP drops
   **immediately and optimistically**; the console fills in behind it.
3. `SessionHud` ticks once a second off `kit.getSession()` — countdown, then
   `Remaining Budget: 8/10 moves` as a segmented pip row.
4. Budget hits 0 or the clock expires → the SDK refuses before signing, the button shows
   the reason, and a "Renew session" CTA appears. **The limits being real is the point** —
   it's what makes a session key safe to hand out in the first place.

`ComparisonStats` keeps a running tally per mode (popups, seconds spent waiting on the
wallet, who paid gas). That's the number a developer screenshots.

### 4.3 Live Developer Console

Timestamps are relative to the first event of the run, exactly as specified:

```
[0.00s] Action dispatched: 'SLASH_BOSS'
[0.03s] Signed client-side via in-memory session key (0 popups)
[0.11s] Relayed & gas sponsored by paymaster (Tx: 0x8f…2a)
```

vs. legacy:

```
[0.00s] Action dispatched: 'SLASH_BOSS'
[0.02s] Awaiting wallet approval — popup #3
[4.81s] User confirmed after 4.79s of human latency
[4.83s] Broadcast — gas paid by user
```

Lines are colour-coded by mode, tx hashes link to `sepolia.etherscan.io`, and anything
that didn't really touch a chain carries a dim `simulated` tag. Controls: pause
autoscroll, clear, copy all. Bounded at 500 lines.

### 4.4 Developer Integration CTA

```ts
const kit = new SessionKit({ apiKey, validatorAddress });
await kit.createSession({ durationInSeconds: 900, maxMoves: 10 });
await kit.execute({ action: "SLASH_BOSS" }, 1); // zero popups, gas sponsored
```

Copy button, plus GitHub / Docs / npm links.

---

## 5. Phase 4 — Relayer fallback (three tiers)

| Tier | Source | When |
|------|--------|------|
| 1 | External relayer at `NEXT_PUBLIC_RELAYER_URL` (e.g. `api/server.ts` on :3000) | Configured and reachable |
| 2 | `playground/app/api/relay-tx/route.ts` | Default — no separate process needed |
| 3 | In-SDK synthesized response | Tier 2 also unreachable (static export, offline) |

Tier 2 is a real Route Handler that verifies the session signature with viem's
`verifyMessage` and, when `SPONSOR_PRIVATE_KEY` + `VALIDATOR_ADDRESS` are set, can
actually call the chain. Unset (the default), it returns a simulated sponsored receipt.
So the signature check is genuine even on the default path — only the broadcast is faked,
and the UI says so.

**`npm run dev` with nothing configured must produce a fully working demo.** That's the
acceptance bar for this phase.

---

## 6. Phase 5 — Polish

- Responsive down to 360px: the arena stacks above the console on mobile.
- Keyboard: the action button is a real `<button>`, the mode switcher is a proper tablist
  with arrow-key navigation, focus rings throughout.
- `aria-live="polite"` on HP and the session HUD; the console is `role="log"`.
- `prefers-reduced-motion` kills shake / float / scanline.
- Error states: wrong chain, user rejection, expired session, exhausted budget, relayer
  unreachable — each has copy that explains *why*, not just that it failed.
- Boss defeated → chest opens, loot drops, "Raid again" resets HP without dropping the
  session.

---

## 7. Phase 6 — Docs & verification

- `playground/README.md`: run instructions, env vars, the :3001 port note, the three
  relayer tiers.
- Root `README.md`: a "Playground" section pointing at `playground/`, and the SDK's new name.
- Verification before this is called done:
  - `cd sessionkit-sdk && npm run build` — clean
  - `cd playground && npx tsc --noEmit` — clean
  - `npm run build` (Next production build) — clean
  - `npm run dev` with **no** `.env` → wallet-less demo works end to end in both modes
  - `forge build && forge test` still green (nothing in this plan touches Solidity)
- Optional: add a `playground` typecheck job to `.github/workflows/test.yml`. CI is
  Foundry-only today — I'll add it only if you want it.

---

## 8. Scope boundaries

**In scope:** the playground app, the SDK extensions in §2, the local mock relayer, docs
for both.

**Not in scope unless you ask:**

- Deploying `SessionValidator.sol` to Sepolia or wiring a real paymaster. The plan keeps
  the live path *possible* via env vars, but doesn't stand up the infrastructure.
- Changing `SessionValidator.sol`. Worth noting: it has no move-count concept and no
  revoke, so move-budget enforcement is client-side/relayer-side only. Adding `moveCount`
  and `revokeSession` to the contract is a natural follow-up.
- Publishing `@sessionkit/sdk` to npm — the install badge is aspirational until then.
- Touching `app/client.ts` or `api/server.ts`.

**Honest caveat kept visible in the UI:** with the default setup nothing is broadcast to a
chain. The plan treats that as a labelling problem, not something to paper over — every
simulated result is tagged as such.

---

## 9. Order of work

1. SDK: rename, extend, build, test.
2. Playground scaffold + design tokens + layout shell.
3. Header (wallet, network, install badge).
4. Game state + arena + both transaction paths.
5. Dev console wired to real SDK events.
6. Mock relayer route + fallback tiers.
7. CTA footer.
8. Polish pass (a11y, motion, responsive, error states).
9. Docs + full verification.

Steps 1–2 unblock everything else; 3–7 are largely independent after that.

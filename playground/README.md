# SessionKit Playground

A Next.js demo that puts traditional Web3 gaming UX (a wallet popup on every
move) side by side with [`@sessionkit/sdk`](../sessionkit-sdk) (authorize
once, then zero popups), built around a mini "Dungeon Boss Raid".

It is a **learning-project demo**, not audited and not meant for real funds —
see the [root README](../README.md).

## Run it

```shell
npm install
npm run dev
```

Open [http://localhost:3001](http://localhost:3001). **No `.env` file is
required** — with nothing configured, the demo runs fully offline: no wallet
needed, no chain writes, every simulated result is tagged `simulated` in the
console.

### Why port 3001

The root Express relayer (`api/server.ts`) binds `:3000`, and Next's default
is also `:3000`. `npm run dev` / `npm run start` are pinned to `-p 3001` in
[`package.json`](package.json) so both can run at once.

## Environment variables

Copy `.env.example` to `.env.local` to customize. All are optional:

| Variable | Default behavior when unset |
|---|---|
| `NEXT_PUBLIC_RELAYER_URL` | Uses this app's own local mock relayer at `/api/relay-tx` (tier 2 below) instead of an external relayer. |
| `NEXT_PUBLIC_VALIDATOR_ADDRESS` | Falls back to the zero address, which keeps SessionKit in **mock mode** — the "Start Session" click never opens a real wallet popup or writes on-chain. |
| `NEXT_PUBLIC_SESSIONKIT_API_KEY` | A placeholder key is used; unused by the local mock relayer anyway. |
| `NEXT_PUBLIC_CHAIN_ID` | Defaults to `11155111` (Sepolia) — only affects the "wrong network" badge. |
| `SPONSOR_PRIVATE_KEY` / `VALIDATOR_ADDRESS` (server-only, no `NEXT_PUBLIC_` prefix) | Local mock relayer always returns a simulated sponsored receipt. Setting both is a documented follow-up for a real broadcast path — not wired up in this demo (see `PLAYGROUND_PLAN.md` §8 in the repo root for the scope boundary). |

## The three relayer tiers

`@sessionkit/sdk`'s `execute()` degrades gracefully so the demo never dead-ends:

1. **External relayer** — `POST {NEXT_PUBLIC_RELAYER_URL}/api/relay-tx`, e.g.
   the root `api/server.ts` running on `:3000`. Used only if configured.
2. **This app's local mock relayer** — `playground/app/api/relay-tx/route.ts`.
   The default when `NEXT_PUBLIC_RELAYER_URL` is unset. It genuinely verifies
   the session signature with viem's `verifyMessage`, then returns a
   simulated sponsored receipt (real broadcast is the documented follow-up
   above).
3. **In-SDK synthesized response** — if tier 1 and tier 2 are both
   unreachable (offline, static export, timeout), the SDK itself fabricates a
   receipt from the signature bytes so the move still completes. Every event
   this produces carries `simulated: true` and `via: "in-sdk-mock"`.

## Scripts

```shell
npm run dev        # start on :3001
npm run build       # production build
npm run start       # serve the production build on :3001
npm run typecheck   # tsc --noEmit
```

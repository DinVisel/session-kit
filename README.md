# your-session-sdk

This is a **learning project**. I'm using it to explore how session-key based
transaction flows work on Ethereum: a user grants a temporary "session" key
limited permission (a spend cap and an expiry) so that follow-up actions can
be signed off-chain and relayed without prompting a wallet popup every time.

It is **not audited, not production-ready, and not meant to be used with real
funds.** Addresses, private keys, and RPC endpoints in the code are
placeholders for experimentation only.

## What's in here

- **`src/SessionValidator.sol`** — a Solidity contract that lets a wallet
  authorize a temporary session key with a validity window and a max spend
  amount, and exposes a `validateSession` check for that key.
- **`test/SessionValidator.t.sol`** — Foundry tests covering the happy path,
  session expiry, and spend-limit rejection.
- **`script/GasSponsorPool.sol`** — a small experimental contract for
  sponsoring (paying gas for) relayed transactions.
- **`app/client.ts`** — a browser-side sketch (using [viem](https://viem.sh))
  of starting a session (one wallet popup) and then signing subsequent
  actions silently with the temporary session key.
- **`api/server.ts`** — a minimal Express relayer that verifies a
  session-signed payload and would forward it on-chain on the user's behalf.

## Foundry

This project uses [Foundry](https://book.getfoundry.sh/), a toolkit for
Ethereum application development written in Rust:

- **Forge**: testing framework for Solidity contracts.
- **Cast**: CLI for interacting with EVM chains and contracts.
- **Anvil**: local Ethereum node for development.
- **Chisel**: Solidity REPL.

### Build

```shell
forge build
```

### Test

```shell
forge test
```

### Format

```shell
forge fmt
```

### Local node

```shell
anvil
```

## TypeScript app/relayer

```shell
npm install
```

`app/client.ts` and `api/server.ts` are illustrative snippets, not a wired-up
runnable app yet — see the source for the intended flow.

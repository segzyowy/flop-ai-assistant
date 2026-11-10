# FLOP AI Agent Starter

A local-first Node.js starter with command-driven chat, local notes, the selected public DID and a deliberately disabled FLOP adapter. It makes no network calls.

## FLOP status (checked 10 November 2026)

Official FLOP operator docs label Testnet planned and unreleased; network identity, RPC, gateway, bootnodes, and model catalog have no verified public values. Devnet is separate development infrastructure and officially earns no rewards. This package does not connect to Devnet or Testnet and makes no rewards or eligibility claims. Verify the current [Testnet page](https://docs.flop.network/networks/testnet), [official-links page](https://docs.flop.network/docs/official-links), [technology FAQ](https://docs.flop.network/docs/technology-and-chain), and [Yellow Paper](https://github.com/flop-labs/yellowpaper) before implementing the adapter.

## Setup

Requires Node.js 20+. Copy `.env.example` to `.env` (PowerShell: `Copy-Item .env.example .env`) then run `npm start`. The starter loads `.env` with Node built-ins. Run `npm run status` for local status. Commands: `help`, `status`, `remember <note>`, `recall`, `quit`. Notes are saved in ignored `data/memory.jsonl`.

The configured DID `did:key:z6MkooHatvhcHQjgQ62MyUoLe1TwNQoWvyjKPLNL3ysDDW5h` is public identity text, not a signing key. This project never requests or stores private seeds, recovery phrases, or signing secrets. Do not add secrets to `.env` or commits.

## Adapter

`src/adapters/flop.js` explicitly reports unavailable and throws on inference. Implement it only when official Testnet docs publish verified network details, authentication, request formats, faucet process, and agent onboarding.

## Validate

Run `npm test` and `npm run status`.

## Repository layout

This starter is uploaded under `agent-starter/` in [segzyowy/flop-ai-assistant](https://github.com/segzyowy/flop-ai-assistant). The repository's original project remains at the root.

To publish this folder as a separate repository instead, create an empty GitHub repository, clone it, copy the contents of `agent-starter/` into the clone, then run:

```sh
git add .
git status --short
git commit -m "Add FLOP AI agent starter"
git push
```

Review the staged file list before committing. `.gitignore` excludes `.env` and local data.

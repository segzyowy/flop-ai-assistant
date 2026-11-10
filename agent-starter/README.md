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

## Publish to GitHub
Create an empty repository under your account, then from this folder run:

```sh
git init
git add .
git status --short
git commit -m "Add FLOP AI agent starter"
git branch -M main
git remote add origin https://github.com/YOUR-ACCOUNT/YOUR-REPOSITORY.git
git push -u origin main
```

Replace the remote placeholder with the exact repository URL. `.gitignore` excludes `.env` and local data. If you want me to publish through the connected GitHub integration, provide the exact target repository (`owner/name`) first.

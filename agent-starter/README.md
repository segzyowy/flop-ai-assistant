# FLOP AI Agent Starter

A Node.js agent that sends ordinary messages to OpenAI's Responses API, keeps conversation context for the current run, and handles basic local commands. FLOP network calls remain disabled until official public Testnet connection details are verified.

## Current FLOP status

Official FLOP docs currently mark Testnet unreleased and list no verified public RPC, gateway, model catalog, or network identity. Devnet is separate and earns no rewards. See the [Testnet status](https://docs.flop.network/networks/testnet), [official links](https://docs.flop.network/docs/official-links), [technology FAQ](https://docs.flop.network/docs/technology-and-chain), and [Yellow Paper](https://github.com/flop-labs/yellowpaper).

## Connect OpenAI

Requires Node.js 20+. Create an API key in the [OpenAI API Platform](https://platform.openai.com/api-keys). API usage may incur charges; check [current API pricing](https://openai.com/api/pricing/) first. API keys are secret credentials: never share one in chat or commit one to GitHub.

In PowerShell, from this folder:

```powershell
Copy-Item .env.example .env
notepad .env
```

In Notepad, paste the key after `OPENAI_API_KEY=` and save. You can leave `OPENAI_MODEL=gpt-6-astra`, the model used in the official OpenAI JavaScript quickstart, or change it to a model available to your API project. The `.env` file is ignored by Git. Then run:

```powershell
npm start
```

Type a normal question to get an AI response. The model sees only the current terminal session's conversation history; local notes are stored separately and are not automatically sent to OpenAI. Type `help`, `status`, `remember <note>`, `recall`, or `quit` for local commands. Run `npm run status` to inspect configuration. The agent uses the official Responses API and keeps conversation history in memory for the current run with response storage disabled.

The API key is read locally from `.env`. Do not put it in source code, chat, or GitHub. `.gitignore` excludes `.env` and local data.

## FLOP adapter

`src/adapters/flop.js` explicitly reports unavailable and throws on inference. Keep it disabled until official Testnet documentation publishes verified network details, authentication, request formats, and agent onboarding.

## Validate

Run `npm test` and `npm run status`. The tests use a mocked OpenAI response and do not contact the API.

## Repository layout

This project is in `agent-starter/` in [segzyowy/flop-ai-assistant](https://github.com/segzyowy/flop-ai-assistant). The repository's original project remains at the root. To publish this starter separately, create an empty repository, copy this folder's contents into it, then run `git add .`, `git commit`, and `git push`.

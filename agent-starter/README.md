# FLOP AI Agent Starter

A Node.js local agent with three model options: free local Ollama, the FLOP DevNet inference gateway, or OpenAI. The FLOP gateway uses the official `@flop-labs/client` package. It does not submit direct on-chain transactions.

## Use the FLOP DevNet gateway

The gateway sends prompts to FLOP’s DevNet inference service. DevNet FLOP is for testing and has no real-world value or rewards. Gateway keys have limited model scope, quota, and expiry; requests use that allowance.

1. Make sure the FLOP enrollment script has saved `FLOP_API_KEY` in this folder’s local `.env`. Never share that file or commit it.
2. In PowerShell, go to `agent-starter` and install the official client:

   ```powershell
   npm install
   ```

3. Open `.env` in Notepad and set:

   ```env
   AI_PROVIDER=flop
   FLOP_MODEL_ID=qwen/qwen2.5-0.5b-instruct
   ```

   Keep the existing `FLOP_API_KEY` line unchanged. The model must match the scope returned during enrollment.

4. Check the configuration and start the agent:

   ```powershell
   npm run status
   npm start
   ```

5. Ask a simple question. Type `quit` to exit.

The agent connects to `https://api.flop.network/v1` through the official FLOP client. It does not use the private signing seed. The seed is only used for wallet enrollment and is never required by this app.

## Use free local Ollama instead

Local Ollama runs on your computer and does not use FLOP or OpenAI API credits. Model inference uses your computer’s memory, processor/GPU, and electricity.

1. Install [Ollama for Windows](https://ollama.com/download/windows), open the Ollama app, and download a model:

   ```powershell
   ollama pull llama3.2:1b
   ```

2. Set `AI_PROVIDER=ollama` in `.env`, then run `npm install`, `npm run status`, and `npm start`.

## Configuration and safety

- `.env` is ignored by Git. Keep `FLOP_API_KEY` and `OPENAI_API_KEY` there, never in source files or GitHub.
- `FLOP_MODEL_ID` must match the model allowed by your gateway key.
- The app keeps chat context in memory for the current run. Notes saved with `remember` stay local in ignored `data/memory.jsonl`.
- The public DID in the configuration is an identifier, not a signing key.
- The gateway key expires. If requests report an expired key or quota error, use FLOP’s documented enrollment/support process; do not share the key.

## OpenAI option

OpenAI API calls may incur charges. To use OpenAI, set `AI_PROVIDER=openai`, then configure `OPENAI_API_KEY` and `OPENAI_MODEL` in `.env`.

## Repository

This project is in `agent-starter/` in [segzyowy/flop-ai-assistant](https://github.com/segzyowy/flop-ai-assistant).

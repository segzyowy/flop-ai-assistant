# FLOP AI Agent Starter

A Node.js agent that can use a local Ollama model for chat, keeps current-session conversation context, and handles basic local commands. FLOP network calls stay disabled until official public Testnet connection details are verified.

## Run free with a local model

This setup makes model requests to Ollama on your own computer and does not use an OpenAI API key or generate per-request API charges. The model download uses disk space and inference uses your computer's memory, processor/GPU, and electricity. The starter defaults to `llama3.2:1b` (about 1.3 GB according to Ollama's model library).

1. Install [Ollama for Windows](https://ollama.com/download/windows) and open the Ollama app.
2. In PowerShell, download the model once:

   ```powershell
   ollama pull llama3.2:1b
   ```

3. In this project folder, update the starter and run it:

   ```powershell
   git pull
   npm run status
   npm start
   ```

4. Ask a normal question at the `you>` prompt. The built-in local commands are `help`, `status`, `remember <note>`, `recall`, and `quit`.

The agent connects only to Ollama at `http://localhost:11434/v1` in local mode. Prompts are sent to that local server; they are not sent to OpenAI. Current conversation context remains in memory for the active run. Local notes are stored separately in ignored `data/memory.jsonl`.

## Optional OpenAI API mode

OpenAI API use may incur charges. To choose that instead, set `AI_PROVIDER=openai` in `.env` and configure `OPENAI_API_KEY` and `OPENAI_MODEL`. Keep the key private and out of Git. See [current API pricing](https://openai.com/api/pricing/) before using paid API access.

## FLOP status

Official FLOP docs currently mark Testnet unreleased and list no verified public RPC, gateway, model catalog, or network identity. Devnet is separate and earns no rewards. Keep `src/adapters/flop.js` disabled until official Testnet details are published. See the [Testnet status](https://docs.flop.network/networks/testnet), [official links](https://docs.flop.network/docs/official-links), [technology FAQ](https://docs.flop.network/docs/technology-and-chain), and [Yellow Paper](https://github.com/flop-labs/yellowpaper).

## Configuration and safety

Copy `.env.example` to `.env` to customize the provider or model. By default `AI_PROVIDER=ollama`, `OLLAMA_BASE_URL=http://localhost:11434/v1`, and `OLLAMA_MODEL=llama3.2:1b`. The `.env` file is ignored by Git. Never add API keys to source code or commit them.

The configured DID `did:key:z6MkooHatvhcHQjgQ62MyUoLe1TwNQoWvyjKPLNL3ysDDW5h` is public identity text, not a signing key. This project never requests or stores private seeds, recovery phrases, or signing secrets.

## Validate

Run `npm test` and `npm run status`. Tests use mocked model responses and do not contact OpenAI or Ollama.

## Repository layout

This project is in `agent-starter/` in [segzyowy/flop-ai-assistant](https://github.com/segzyowy/flop-ai-assistant). The repository's original project remains at the root.

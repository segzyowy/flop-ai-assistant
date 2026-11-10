# FLOP AI Assistant

This repository contains two separate projects:

- **Website (repository root and `public/`)** — a chat website deployed as a Cloudflare Worker.
- **Local agent (`agent-starter/`)** — a Node.js agent that can use Ollama on your own computer.

## Website and AI backend

The website's Worker uses the official `@flop-labs/client` package to route chat to the FLOP DevNet gateway when the Cloudflare Worker secret `FLOP_API_KEY` is configured. The optional `FLOP_MODEL_ID` Worker variable selects a model; if it is blank, the Worker discovers one from FLOP's model list. Without `FLOP_API_KEY`, the website continues to use Cloudflare Workers AI as a fallback.

The FLOP gateway's model list is public, but FLOP's docs say chat completions require an API key. The public docs do not describe a self-service process for issuing one. Do not paste a key into chat or commit it to GitHub. Set it only as a Cloudflare Worker **Secret**:

1. In Cloudflare, open **Workers & Pages** and select `flop-ai-assistant`.
2. Open **Settings** → **Variables and Secrets** → **Add**.
3. Choose **Secret**, set the name to `FLOP_API_KEY`, and paste your key privately.
4. Select **Deploy**.
5. Open `/api/status` on your site to see which provider is configured. A configured key is not itself proof every model request will succeed.

If you have an official model ID, you can optionally add `FLOP_MODEL_ID` as a plain-text Worker variable. Otherwise the Worker selects the first model in the official gateway catalog.

FLOP DevNet is a development network, separate from Testnet. Do not assume DevNet activity earns rewards or airdrop weight. The official docs list the public gateway at `https://api.flop.network/v1`, and the current network page still lists Testnet as unreleased. See [FLOP SDK references](https://docs.flop.network/docs/sdk-references), [FLOP DevNet and Testnet FAQ](https://docs.flop.network/docs/testnet-and-timeline), and [Testnet status](https://docs.flop.network/networks/testnet).

When no FLOP key is configured, the fallback uses Google Gemma 4 through Cloudflare Workers AI. Cloudflare currently provides 10,000 Neurons per day at no charge on the Workers Free plan. This is a daily allowance, not unlimited use. If the allowance is exhausted on the Free plan, further AI requests fail until it resets. See [Cloudflare Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/).

## Deploy on Cloudflare

This repository is connected to Cloudflare Workers Builds:

- Production branch: `main`
- Build command: `exit 0`
- Deploy command: `npx wrangler deploy`
- Wrangler configuration: `wrangler.jsonc`

After a change reaches `main`, check the Cloudflare Worker’s **Deployments** tab. The Worker configuration declares both the static asset binding and the Workers AI binding. The FLOP API key must be added separately as a Cloudflare secret; it is never stored in this repository.

The public site URL is shown on the Worker’s **Overview** page under **Visit** or **Domains**.

## Run the local agent

The website and local agent are separate. The local agent uses Ollama on the computer where it is run:

1. Install [Ollama](https://ollama.com/download/windows) and open the Ollama app.
2. In PowerShell, download the model once:

   ```powershell
   ollama pull llama3.2:1b
   ```

3. From the `agent-starter` folder:

   ```powershell
   git pull
   npm test
   npm start
   ```

The local agent connects to Ollama at `http://localhost:11434/v1`. It does not require an OpenAI API key. Local notes are stored in ignored `agent-starter/data/`.

## Identity and secrets

The configured DID is public identity text: `did:key:z6MkooHatvhcHQjgQ62MyUoLe1TwNQoWvyjKPLNL3ysDDW5h`. This project never asks for or stores its private seed, a recovery phrase, or signing secrets. Do not commit API keys or credentials.

## Local FLOP status

The local Ollama agent still has its own FLOP network adapter disabled. The website's FLOP client integration is a separate code path, configured by the Cloudflare Worker secret described above. DevNet is not Testnet.

# FLOP AI Assistant

This repository contains two separate projects:

- **Website (repository root and `public/`)** — a chat website deployed as a Cloudflare Worker. Chat replies use Cloudflare Workers AI.
- **Local agent (`agent-starter/`)** — a Node.js agent that can use Ollama on your own computer.

## Website and AI backend

The Cloudflare Worker serves the website from `public/index.html` and handles chat requests at `/api/chat`. It calls the Cloudflare Workers AI binding directly; no OpenAI key, FLOP API key, or other API secret is needed.

The selected model is Google Gemma 4 through Cloudflare Workers AI. Cloudflare currently provides 10,000 Neurons per day at no charge on the Workers Free plan. This is a daily allowance, not unlimited use. If the allowance is exhausted on the Free plan, further AI requests fail until it resets. No paid upgrade is configured by this project. See [Cloudflare Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/).

Cloudflare AI is separate from the FLOP network. The website does not send requests to FLOP, and does not claim FLOP Testnet connectivity, rewards, or airdrop eligibility. The official FLOP Testnet documentation currently reports the public Testnet as unreleased and lists no verified public RPC or gateway: [official FLOP Testnet status](https://docs.flop.network/networks/testnet).

## Deploy on Cloudflare

This repository is connected to Cloudflare Workers Builds:

- Production branch: `main`
- Build command: `exit 0`
- Deploy command: `npx wrangler deploy`
- Wrangler configuration: `wrangler.jsonc`

After a change reaches `main`, check the Cloudflare Worker’s **Deployments** tab. The Worker configuration declares both the static asset binding and the Workers AI binding. If Cloudflare reports that the AI binding is missing, open the Worker’s **Settings** and add a Workers AI binding named `AI`, then redeploy.

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

FLOP network functionality remains disabled until official public Testnet connection details are verified. DevNet is separate from Testnet. Check the [official Testnet status](https://docs.flop.network/networks/testnet) before enabling any network adapter.

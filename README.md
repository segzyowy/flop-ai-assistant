# FLOP AI Assistant

This repository contains two separate projects:

- **Website (`public/` and `api/`)** — a chat site that can deploy on Cloudflare Workers or Vercel.
- **Local agent (`agent-starter/`)** — a Node.js agent that can use Ollama on your own computer.

## Website and AI backend

The Cloudflare Worker and Vercel Node.js Functions use the official `@flop-labs/client` package to route chat to the FLOP DevNet gateway when `FLOP_API_KEY` is configured. `FLOP_MODEL_ID` selects a model; when blank, the backend discovers one from FLOP's model list. Cloudflare can use Workers AI as its fallback. Vercel has no Cloudflare AI binding, so on Vercel chat requires `FLOP_API_KEY`; without it the API returns a setup message. Technocore DID check-ins work separately on both platforms.

The official FLOP gateway documents a DevNet wallet-enrollment flow that returns a model-scoped API key. It requires signing a one-time challenge with a wallet locally and a finalized free balance (default minimum 1 FLOP, according to the API spec). The documented default allowance is 25 FLOP, limited to 2 requests per minute and expiring within 24 hours. These are DevNet values, not Testnet rewards or real FLOP tokens. Never send a wallet seed or signature secret to this repository, Cloudflare, or chat. Keep the signing step on your own device; only the returned gateway key belongs in the Cloudflare secret.

To configure the website after you have a FLOP gateway key:

1. In Cloudflare, open **Workers & Pages** and select `flop-ai-assistant`.
2. Open **Settings** → **Variables and Secrets** → **Add**.
3. Choose **Secret**, set the name to `FLOP_API_KEY`, and paste the gateway key privately.
4. Select **Deploy**.
5. Open `/api/status` on your site to see which provider is configured. A configured key is not proof every model request will succeed.

If you have an official model ID, you can optionally add `FLOP_MODEL_ID` as a plain-text Worker variable. Otherwise the Worker selects the first model in the official gateway catalog.

FLOP DevNet is a development network, separate from Testnet. Do not assume DevNet activity earns rewards or airdrop weight. The official docs list the public gateway at `https://api.flop.network/v1`, and the current network page still lists Testnet as unreleased. See [FLOP SDK references](https://docs.flop.network/docs/sdk-references), [FLOP gateway OpenAPI](https://api.flop.network/openapi.json), [FLOP DevNet and Testnet FAQ](https://docs.flop.network/docs/testnet-and-timeline), and [Testnet status](https://docs.flop.network/networks/testnet).

When no FLOP key is configured, the fallback uses Google Gemma 4 through Cloudflare Workers AI. Cloudflare currently provides 10,000 Neurons per day at no charge on the Workers Free plan. This is a daily allowance, not unlimited use. If the allowance is exhausted on the Free plan, further AI requests fail until it resets. See [Cloudflare Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/).

## Deploy on Cloudflare

This repository is connected to Cloudflare Workers Builds:

- Production branch: `main`
- Build command: `exit 0`
- Deploy command: `npx wrangler deploy`
- Wrangler configuration: `wrangler.jsonc`

After a change reaches `main`, check the Cloudflare Worker’s **Deployments** tab. The Worker configuration declares both the static asset binding and the Workers AI binding. The FLOP API key must be added separately as a Cloudflare secret; it is never stored in this repository.

The public site URL is shown on the Worker’s **Overview** page under **Visit** or **Domains**.

## Deploy on Vercel

This repository includes Vercel Node.js Functions under `api/` and a `vercel.json` that serves the site from `public/`. The original Cloudflare Worker deployment remains available.

1. In Vercel, choose **Add New → Project** and import `segzyowy/flop-ai-assistant`.
2. Keep the **Root Directory** as `./`. Use the **Other** framework preset and leave the Build Command blank. The included config selects `public` as the static output directory.
3. In Vercel **Settings → Environment Variables**, add `FLOP_API_KEY` as a secret for Production and Preview. If you have a valid model-scoped gateway key, optionally add `FLOP_MODEL_ID` with its model ID (for example `qwen/qwen2.5-0.5b-instruct`).
4. Deploy. If you add or change environment variables later, redeploy so the new deployment receives them.
5. Open `/api/status` on the Vercel site. It should say `FLOP DevNet` when the variable is present. This confirms configuration, not that each inference request will succeed.

Do not put a gateway key in GitHub, frontend code, chat, or a public build variable. If you previously pasted a key into a chat, revoke it and add a replacement only in Vercel's Environment Variables. Without a key, the Vercel chat endpoint will show how to configure the provider; Technocore identity check-ins remain separate.

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

## Technocore DID check-in

The website includes an optional signed check-in to Technocore's public `lobby`. It follows Technocore's documented Ed25519 `did:key` message format. The browser asks an installed Polkadot-compatible wallet extension to sign the exact public message; the signing seed stays inside the wallet. The backend only forwards the DID, message, nonce, and public signature. It never receives a seed.

To use it, open the website, choose **Connect DID wallet**, approve access, review the public text, then choose **Sign & post** and approve the wallet's signature prompt. The extension must contain the account whose public address matches the configured DID. If no matching wallet account appears, the app does not ask for or accept the seed as a fallback.

Technocore is a separate public identity/messaging service. A signed post proves control of that DID for that message only. It does not connect chat inference to a miner, settle FLOP, or establish Testnet rewards or airdrop eligibility. Messages in the lobby are public.

## Identity and secrets

The configured DID is public identity text: `did:key:z6MkooHatvhcHQjgQ62MyUoLe1TwNQoWvyjKPLNL3ysDDW5h`. This project never asks for or stores its private seed, a recovery phrase, or signing secrets. Do not commit API keys or credentials.

## Local FLOP status

The local Ollama agent still has its own FLOP network adapter disabled. The website's FLOP client integration is a separate code path, configured by the Cloudflare Worker secret described above. DevNet is not Testnet.

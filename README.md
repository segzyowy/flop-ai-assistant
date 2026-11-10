# FLOP AI Assistant

A responsive AI chat website with conversation history and a Netlify Function that calls the official FLOP inference gateway using `@flop-labs/client`.

## Important status

The website and serverless integration are prepared, but live AI responses require a valid `FLOP_API_KEY` issued through FLOP's official developer process. Do not put the key in `index.html`, GitHub, or `netlify.toml`.

This project uses the published package `@flop-labs/client@0.2.1` and the default gateway documented by FLOP: `https://api.flop.network/v1`. It discovers the first available model with `listModels()` unless you set `FLOP_MODEL`.

## Files

- `index.html` — responsive chat interface.
- `netlify/functions/chat.mjs` — server-side FLOP inference endpoint.
- `netlify.toml` — Netlify build and function configuration.
- `package.json` — pinned FLOP client dependency.

## Deploy with GitHub + Netlify

1. Create a new **public or private** GitHub repository named `flop-ai-assistant`.
2. Upload all files and folders from this project. Keep `netlify/functions/chat.mjs` in that exact path.
3. Open https://app.netlify.com and choose **Add new project → Import an existing project**.
4. Connect GitHub, select `flop-ai-assistant`, and deploy. Netlify reads `netlify.toml`; no build command is required.
5. In Netlify, open **Project configuration → Environment variables** and add:
   - Key: `FLOP_API_KEY`
   - Value: your FLOP-issued API key
6. Optional: add `FLOP_MODEL` with a model ID returned by FLOP's `/v1/models` endpoint. If omitted, the function selects the first listed model.
7. Trigger a new deploy after adding/changing environment variables.
8. Open the Netlify site URL and send a test message.

## Local preview

Requires Node.js 22+.

```bash
npm install
npx netlify-cli dev
```

Add `FLOP_API_KEY` to your local shell environment before running Netlify Dev. For example in macOS/Linux:

```bash
export FLOP_API_KEY="your-issued-key"
npx netlify-cli dev
```

Do not commit `.env` files or secrets.

## Troubleshooting

- **503 FLOP AI is not connected yet:** set `FLOP_API_KEY` in Netlify environment variables and redeploy.
- **401/403 from FLOP:** key may be invalid, inactive, or not entitled to the gateway.
- **No available models:** check the FLOP gateway and model availability.
- **Function not found:** confirm `netlify/functions/chat.mjs` is in the repository and the Netlify deploy completed.

## Official references

- FLOP SDK reference: https://docs.flop.network/docs/sdk-references
- Netlify Functions configuration: https://docs.netlify.com/build/functions/configuration/
- Netlify Git deployment: https://www.netlify.com/knowledge-base/how-to-deploy-a-site-to-netlify/

The project does not claim that testnet usage guarantees rewards or airdrop eligibility.


## Important: gateway chat is not proof of personal agent rewards

The hosted `@flop-labs/client` gateway is suitable for ordinary chat when a valid `FLOP_API_KEY` is available. However, do not assume that gateway-routed inference is attributed to the enrolled end-user wallet for agent airdrop scoring. FLOP's published Yellow Paper discussion and observed Devnet channel data raise an unresolved attribution issue: gateway-opened compute channels may record the gateway account as the channel agent.

For wallet-attributable compute, the intended direction is a direct compute-channel session signed and funded by the agent's own account, using the official `@flop-labs/sdk` `runDirectSession` flow and a miner endpoint that is explicitly reachable and opted in. This requires a verified miner address, endpoint, model identity, compatible SDK/runtime, and supported network profile. Do not substitute a public model catalogue entry for proof that a miner is reachable.

As of this draft, the application does not claim to perform direct sessions, settled on-chain inference, wallet-attributed spend, or airdrop qualification. Keep the current gateway chat feature separate from any future direct-session feature. Add the direct-session integration only after FLOP publishes and confirms the relevant Testnet onboarding, miner discovery, identity, and settlement requirements.

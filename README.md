# FLOP AI Assistant

A web chat assistant connected to FLOP DevNet, with the community prediction market linked from the main screen. Chat requests use a bounded FLOP credential on the server. The browser never receives the gateway key.

## Connect FLOP on Vercel

The app calls the official OpenAI-compatible FLOP gateway at `https://api.flop.network/v1/chat/completions`. FLOP’s public health and ready model catalog are available without a key; inference requires a valid gateway credential with access to the configured model.

1. In Vercel, open this project’s **Settings → Environment Variables**.
2. Add `FLOP_API_KEY` as a **server-side secret**. Use a bounded credential for the public site, not an unrestricted owner key.
3. Add `FLOP_MODEL_ID` as the exact model ID authorized for that credential. The site will not guess a model or silently switch models.
4. Redeploy after saving the variables.
5. Check `/api/status` for configuration and `/api/flop-data` for public DevNet health and current models. Configuration alone does not confirm model scope; ask the assistant a simple question to test authorization.

For a public demo, set a small total spend allowance, request-rate limit, use count, and short expiry on the FLOP credential. Each single chat request is capped at **5 FLOP** and **384 output tokens**. All visitors share the site's allowance. This deployment has no durable per-visitor quota, so do not expose an unrestricted key.

If the gateway says `unsupported_model`, choose a currently ready model. If it says `scope_widening` or unauthorized model, ask FLOP to authorize the exact model for the credential; changing `FLOP_MODEL_ID` cannot expand key permissions. A `401` indicates an invalid, expired, or revoked key. A `402` indicates no available spend allowance. Temporary gateway errors are shown without automatic retries.

The assistant shows a request ID for each sent message. If a request times out or the reply is uncertain, check `/api/chat-receipt?requestId=<request-id>` before retrying. A receipt `404` is not proof that no work was processed.

Never put a FLOP key in the frontend, GitHub, chat, or a public variable. If a key has been exposed, revoke it and use a replacement.

## DevNet and Testnet

The configured gateway is **FLOP DevNet**. DevNet is for development and does not earn Testnet rewards or airdrop eligibility.

As of the official FLOP docs updated 14 November 2026, public Testnet was still planned for 24 November 2026 subject to readiness; its public network identity, release and gateway were not yet verified. Do not change this app to Testnet until FLOP publishes its official gateway and network configuration. Check [FLOP Testnet status](https://docs.flop.network/networks/testnet) and the [Testnet timeline](https://docs.flop.network/docs/testnet-and-timeline) before switching.

## Other app features

The Prediction Market remains available at `/markets.html`. Its wallet and Technocore features are separate from chat inference. A public DID is not a FLOP gateway credential and does not itself pay for inference.

The local Ollama agent in `agent-starter/` is a separate project and does not power the hosted site.

## Deploy on Vercel

Import `segzyowy/flop-ai-assistant` with the repository root as the project root. The included `vercel.json` serves `public/` and deploys the API functions. GitHub changes to `main` should trigger a Vercel deployment when the project remains connected to that branch. Check the deployment result in Vercel before sharing the updated site.

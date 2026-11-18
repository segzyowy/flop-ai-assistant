# FLOP AI Assistant

A FLOP DevNet market research workbench with a public model/status board and bounded, structured research requests. The former free-form AI chat is removed from the website. This is a DevNet tool; it does not promise rewards, airdrop eligibility, or financial returns.

## Website

The site has two parts:

- Public FLOP health, available model list, and pricing information, fetched without credentials.
- A structured BTC, ETH, SOL, XRP, BNB, or DOGE research brief. A user deliberately submits a question and notes; the server sends one bounded request to the configured FLOP model and can look up its receipt.

The site does not browse the web or independently verify user supplied evidence. The model should describe scenarios and risks, not present its output as financial advice.

### Vercel setup

Import `segzyowy/flop-ai-assistant` into Vercel with the repository root as the project root. The included `vercel.json` serves `public/` and deploys the Node.js functions in `api/`.

In **Project → Settings → Environment Variables**, add:

- `FLOP_API_KEY`: a FLOP gateway credential, stored as a server-only secret.
- `FLOP_MODEL_ID`: the exact model ID that FLOP has authorized for that credential.

Set them for the environments you use and redeploy. The website never asks visitors for a FLOP key, and the browser code does not receive the server key. A public status result that says a key is configured only confirms that an environment variable exists; it does not prove the model scope is authorized or the gateway is available.

Ask FLOP for a **bounded credential** authorized for the requested model, with a small total spend allowance, low rate/use limits, and a short expiry. The backend caps an individual research request at 5 FLOP and 200 output tokens; the gateway credential's total allowance remains the main limit across visitors. This project does not implement a durable per-IP quota, so do not install an unrestricted credential on a public deployment. If the key is scoped to a different model, the request is rejected until FLOP authorizes the selected model. Never commit a gateway key or paste it into chat.

The website sends a fresh `Idempotency-Key` for each submitted request and does not automatically retry a paid request. If the gateway times out or returns an uncertain result, use **Check receipt** with that request ID before deciding what to do. A missing receipt is not proof that no request was processed.

### FLOP endpoints used

- Public health: `https://api.flop.network/health`
- Public ready model catalog: `https://api.flop.network/v1/models`
- Chat completions: `https://api.flop.network/v1/chat/completions`
- Receipt lookup: `https://api.flop.network/v1/keys/me/receipts/{request_id}`

These paths and request fields follow the official FLOP DevNet API documentation. DevNet activity is for testing and does not establish Testnet rewards or airdrop eligibility.

## Local agent

The separate `agent-starter/` project can use Ollama locally:

1. Install [Ollama](https://ollama.com/download/windows) and open it.
2. Download a small model in PowerShell:

   ```powershell
   ollama pull llama3.2:1b
   ```

3. In the `agent-starter` folder:

   ```powershell
   npm install
   npm test
   npm start
   ```

Its notes are stored locally under the ignored `agent-starter/data/` folder. The website's FLOP configuration does not configure this local agent.

## Public DID and wallet safety

The configured public DID is `did:key:z6MkooHatvhcHQjgQ62MyUoLe1TwNQoWvyjKPLNL3ysDDW5h`. It is public identity text. The app does not request or store its private seed, recovery phrase, or wallet signing secrets. Never put a seed, recovery phrase, or wallet secret in GitHub, Vercel environment variables, or a chat.

## Deploy notes

The Vercel project can deploy from the repository's `main` branch. After a commit reaches GitHub, watch the Vercel deployment for its build result, then check `/api/status` and the site itself. A successful deployment is separate from FLOP gateway authorization and model availability.

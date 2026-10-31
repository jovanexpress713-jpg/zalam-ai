# Deployment notes

## Local development
1. Install Node.js 20+.
2. Copy `.env.example` to `.env.local`.
3. Set `AI_BASE_URL`, `AI_MODEL`, and optional `AI_API_KEY`.
4. Run `npm install` and `npm run dev`.

## Ollama
Run Ollama on a machine with sufficient memory/compute. Pull a model supported by your hardware, then set `AI_MODEL` to its exact installed name. A phone browser can access the web UI, but a Galaxy S9 is not a practical host for large local models.

If the web app is hosted remotely, `localhost` in its server environment refers to the server itself, not the user's phone. Configure a private reachable provider URL and protect it with network controls.

## Production warning
Do not deploy this scaffold as a public multi-user service yet. It has no authentication, rate limiting, persistent storage, abuse controls, or production observability.

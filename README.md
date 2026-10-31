# ZALAM AI

Arabic-first AI workspace foundation with a protected OpenAI-compatible provider connection.

## Current verified scope

- Arabic RTL chat interface.
- Server-side OpenAI-compatible chat endpoint.
- Shared workspace access gate for chat and model discovery.
- Input validation, a 100 KB chat request-body limit, and provider timeouts.
- Baseline browser security headers: CSP, HSTS, frame denial, MIME sniffing protection, referrer policy, and restrictive browser permissions.
- Local browser chat history (last 100 messages; not synced to a server).
- Passive, server-configured HTTPS assessment: TLS certificate/handshake, selected HTTP security headers, and DNS posture (MX, TXT/SPF/DMARC indicators, CAA, NS).
- Static OpenAPI 3.x JSON review: authentication declarations, undefined security schemes, path parameters, duplicate operation IDs, and basic operation metadata; exports JSON findings.
- Authenticated provider connectivity check against the configured models endpoint (does not prove chat inference works).
- Static text/code file review for selected exposed-secret and insecure-code patterns; 1 MiB maximum, no execution, no storage, and no third-party AI upload.
- GitHub Actions checks dependency installation, TypeScript, and production build.

This is an early MVP, not a finished autonomous AI platform. It does not currently include user accounts, a server-side conversation database, multi-agent orchestration, arbitrary command execution, semantic or full-repository file analysis, autonomous research, media generation, active vulnerability exploitation, or a full security-lab runner.

## Requirements

- Node.js 20+
- npm
- An OpenAI-compatible provider (for example, Ollama on a separate computer/server or a hosted provider).

## Setup

1. Copy `.env.example` to `.env.local`.
2. Set `AI_BASE_URL` to your provider's OpenAI-compatible `/v1` endpoint.
3. Set `AI_MODEL` to an installed model name.
4. Set `AI_API_KEY` if your provider requires one.
5. Set `ZALAM_ACCESS_TOKEN` to a random secret of at least 24 characters. Do not reuse a public or example value.
6. Run:

```bash
npm install
npm run typecheck
npm run build
npm run dev
```

Open `http://localhost:3000` and enter the same access token in the workspace.

## Security notes

- The access token is a shared workspace gate, not individual user authentication.
- Use HTTPS when exposing the app outside localhost. HSTS is enabled by the app; only expose it behind a correctly configured HTTPS endpoint.
- The CSP allows inline scripts/styles required by the current Next.js app but does not allow eval or arbitrary external connections. Re-test browser functionality when changing frontend dependencies.
- Keep `.env.local` and all provider keys private; never commit secrets.
- Browser history is stored in localStorage on that browser and can be cleared from the UI.
- Do not expose a local model server directly to the public internet.
- Security testing features must be restricted to assets you own or are explicitly authorized to test. No feature should run arbitrary host shell commands.

## Available security review tools

### Passive target assessment

Configure `ZALAM_LAB_TARGET_URL` and `ZALAM_LAB_ALLOWED_HOST` on the server. The scanner accepts only HTTPS and requires an exact hostname match. It performs a HEAD request and DNS/TLS posture checks; it does not crawl, fuzz, authenticate to, or exploit the target. DNS/IP filtering is a defensive guard, not a substitute for network egress controls. Use a dedicated isolated deployment and restrict outbound network access.

### OpenAPI static review

Enter the workspace access token, then upload an OpenAPI 3.x JSON file from the API review section. The endpoint accepts at most 1 MiB, parses the specification locally on the server, and does not connect to any `servers` URL. YAML is not supported yet. Findings are indicators for human review, not proof of exploitable vulnerabilities. Export the JSON report for evidence retention.

## Provider and file-review checks

Use the workspace button “اختبار اتصال الذكاء الاصطناعي” to request the configured provider `/models` endpoint. A successful response confirms endpoint reachability only; it does not prove the selected model can complete a chat request. The file review accepts selected text/code/configuration extensions up to 1 MiB and reports simple pattern matches. Files are not executed, persisted, or sent to the model provider. Findings require human validation.

## Security lab roadmap

The intended safe lab is an isolated, explicitly scoped environment with target allowlists, written authorization, run approval, resource/time limits, audit logs, and resettable training targets. Scanning and exploitation should be enabled only against those lab targets. This lab runner is not implemented in the current MVP.

## Engineering roadmap

See [docs/PLATFORM_ROADMAP.md](docs/PLATFORM_ROADMAP.md) for the multi-domain assessment plan covering web, APIs, network infrastructure, Wi-Fi, Android/iOS, financial sandboxes, AI systems, execution controls, and release gates. Roadmap items are not implemented capabilities until tested.

## Status

Build verification is tracked in the GitHub Actions workflow. A successful web build does not mean a provider is configured or that unimplemented features are available.

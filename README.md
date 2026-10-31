# ZALAM AI

Arabic-first AI workspace foundation with a protected OpenAI-compatible provider connection.

## Current verified scope

- Arabic RTL chat interface.
- Server-side OpenAI-compatible chat endpoint.
- Shared workspace access gate for chat and model discovery.
- Input validation and provider timeouts.
- Local browser chat history (last 100 messages; not synced to a server).
- GitHub Actions checks dependency installation, TypeScript, and production build.

This is an MVP foundation, not a finished autonomous AI platform. It does not currently include user accounts, server-side conversation database, agent orchestration, arbitrary command execution, file analysis, autonomous research, media generation, or a security-lab runner.

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
- Use HTTPS when exposing the app outside localhost.
- Keep `.env.local` and all provider keys private; never commit secrets.
- Browser history is stored in localStorage on that browser and can be cleared from the UI.
- Do not expose a local model server directly to the public internet.
- Security testing features must be restricted to assets you own or are explicitly authorized to test. No feature should run arbitrary host shell commands.

## Security lab roadmap

The intended safe lab is an isolated, explicitly scoped environment with target allowlists, written authorization, run approval, resource/time limits, audit logs, and resettable training targets. Scanning and exploitation should be enabled only against those lab targets. This lab runner is not implemented in the current MVP.

## Status

Build verification is tracked in the GitHub Actions workflow. A successful web build does not mean a provider is configured or that unimplemented features are available.

# ZALAM AI

Open-source, inspectable AI workspace and isolated cybersecurity research lab.

> This is an independent project. It does not copy WormGPT or third-party branding/code.

## Principles
- Source-first: every implemented feature is documented and inspectable.
- Honest status: unconfigured providers and unavailable features are clearly identified.
- Local-first model support through compatible OpenAI-style endpoints (Ollama is the default example).
- Security research runs only against systems the operator owns or is explicitly authorized to test.
- No credential theft, real-user phishing, malware propagation, persistence, or unauthorized access features.

## Current status
**Foundation repository created.** This is an early scaffold, not a completed or production-ready platform. Authentication, persistent storage, agent orchestration, file processing, provider management, and security-lab execution still need implementation and testing.

## Quick start
Requirements: Node.js 20+ and npm.

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000.

## Model provider
The API targets an OpenAI-compatible local endpoint by default:
- Base URL: `http://localhost:11434/v1`
- Model: configure `AI_MODEL` to a model installed in Ollama.
- Keep provider credentials on the server; never put secrets in browser code or commit them.

## Planned modules
1. Arabic/English chat and conversation history.
2. Provider registry and model selection.
3. Agent task runner with explicit permissions and audit trail.
4. Secure code workspace and isolated execution adapter.
5. File analysis and web research adapters.
6. Cybersecurity lab for authorized targets and intentionally vulnerable training apps.
7. Metrics, exportable run reports, and admin controls.

See [ARCHITECTURE.md](./ARCHITECTURE.md), [SECURITY.md](./SECURITY.md), and [ROADMAP.md](./ROADMAP.md).

# ZALAM AI — Engineering Roadmap

This roadmap describes real deliverables. A checkbox is marked complete only after implementation and a reproducible test.

## 1. Platform foundation
- [x] Arabic RTL workspace and protected chat API.
- [x] Shared access-token gate and request validation.
- [x] Local browser conversation history.
- [x] Passive HTTPS response-header check for one server-configured host.
- [x] CI typecheck and production build.
- [ ] Individual user accounts, roles, MFA, server-side sessions, and audit log.
- [ ] Persistent database for projects, engagements, findings, evidence, and reports.
- [ ] Provider health checks that verify a real connection (not only environment-variable presence).
- [ ] Job queue, cancellation, timeouts, concurrency controls, and run history.

## 2. Assessment domains
Each domain must have a documented scope, safe test profile, evidence format, and automated tests.

- [ ] Web applications: TLS, HTTP configuration, security headers, cookie/session configuration, dependency and source review, and safe validation of common web weaknesses.
- [ ] APIs: OpenAPI import, endpoint inventory, authentication-required checks, schema validation, rate-limit observation, and authorization tests using synthetic identities.
- [ ] Network infrastructure: asset inventory, DNS/TLS review, service exposure inventory, and non-disruptive configuration assessment.
- [ ] Wi-Fi: wireless security configuration review, encryption/authentication posture, rogue-access-point detection in a controlled lab, and capture analysis from supplied test files. No credential capture or deauthentication against third-party networks.
- [ ] Mobile Android/iOS: static APK/IPA metadata and permission review, insecure configuration detection, exported-component review, transport-security review, and analysis of user-supplied test artifacts. No spyware, persistence, or device takeover.
- [ ] Financial systems: sandbox-only payment and wallet workflow tests, idempotency, replay resistance, transaction limits, authorization boundaries, and reconciliation evidence. Never issue real transfers.
- [ ] AI systems: prompt-injection resilience, sensitive-data exposure checks, and tool-permission boundary tests.

## 3. Assessment workflow
- [ ] Engagement record with organization, target assets, permitted test methods, start/end time, and emergency contact.
- [ ] Explicit target allowlist and DNS/IP validation at execution time.
- [ ] Per-test approval, rate limits, concurrency caps, and stop conditions.
- [ ] Immutable audit events for operator, target, action, time, and result.
- [ ] Evidence redaction and encryption at rest.
- [ ] Findings with severity, confidence, reproduction steps, impact, remediation, and retest status.
- [ ] PDF/JSON report export.

## 4. Execution architecture
- [ ] Separate worker service from the web application.
- [ ] Sandboxed runners with no host-shell access and least-privilege network egress.
- [ ] Tool adapters with typed inputs/outputs and per-tool policy checks.
- [ ] Synthetic training targets and repeatable integration tests.
- [ ] Resource budgets, kill switch, and cleanup verification.

## 5. Release gates
A feature is not complete because its button or page exists. It must pass:
1. Unit tests for parsing, policy, and result normalization.
2. Integration tests against a local synthetic target.
3. Negative tests proving out-of-scope targets are rejected.
4. Timeout, cancellation, and failure-path tests.
5. CI typecheck and production build.
6. Documentation that states exact limitations.

## Current truth
The current repository is an MVP with chat and a passive HTTPS header check. It does not yet provide comprehensive web, API, network, Wi-Fi, mobile, or financial-system testing. This roadmap is not a claim that those capabilities already exist.

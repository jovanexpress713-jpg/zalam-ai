# ZALAM AI — Security Assessment Readiness

## Current verified scope
The current application is an MVP workspace with:
- Shared workspace access token protection for API routes.
- Chat provider integration (requires server-side provider configuration).
- Browser-local chat history.
- A passive HTTP security-headers check against one exact HTTPS hostname configured by the operator.
- CI type-check and production build.

The passive scanner is **not** a vulnerability scanner and does not authenticate to a target, test business logic, attempt logins, or modify data.

## Assessment workflow for a client engagement
1. Create a written authorization record identifying the legal owner, approving contact, exact hostnames/API base URLs, test accounts, allowed test window, request-rate ceiling, excluded systems, emergency contact, and stop conditions.
2. Use a dedicated staging environment wherever possible. If production is explicitly approved, use dedicated test accounts and test-value/payment sandbox rails only.
3. Record scope and expiry before enabling any active test module. Never put passwords, session cookies, API keys, OTPs, or private customer data into chat or source control.
4. Start with passive discovery and configuration review.
5. Run low-impact authentication, authorization, session, API schema, and business-logic checks only against the approved endpoints and test identities.
6. For payment flows, use the provider's sandbox and synthetic balances. Verify idempotency, duplicate submission handling, ownership checks, limits, and audit events without moving real funds.
7. Preserve request/response evidence with secrets and personal data redacted. Assign severity, explain impact, propose remediation, and retest after fixes.
8. Stop immediately if the test crosses scope, affects real users/funds, causes instability, or exposes sensitive data.

## Test coverage planned for the active assessment engine
| Area | Safe verification objective |
|---|---|
| Authentication | MFA/session policy, lockout and throttling behavior using approved test identities |
| Authorization | Object ownership and role boundaries using two or more test identities |
| Session security | Cookie flags, expiry, rotation, logout invalidation |
| API security | Authentication required, role checks, input validation, data minimization |
| Payment logic | Sandbox-only idempotency, duplicate request handling, amount/limit validation |
| Auditability | Security events, transaction traceability, timestamps, actor attribution |
| Configuration | TLS and security headers, CORS and exposed metadata review |

## What is not implemented yet
- No active authenticated test runner.
- No target credential vault or account connector.
- No persistent findings database or downloadable signed report.
- No payment-provider sandbox integration.
- No multi-user roles or per-engagement authorization workflow.
- No production deployment verification.

These items must not be presented as available capabilities until implemented and tested.

## Required server configuration
See `.env.example`. Keep all secrets in deployment environment variables, never commit them.

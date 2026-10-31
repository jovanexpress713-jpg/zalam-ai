# ZALAM AI — Autonomous Assessment and Improvement Policy

## Implemented policy primitive

`src/lib/security-policy.ts` provides a fail-closed decision function for a future assessment runner. It requires:
- An engagement ID, organization, authorizing contact, and valid start/end timestamps.
- Explicit approval and a time window that is currently active.
- An allowlisted domain, action, and exact hostname.
- A bounded request rate (1–60 requests/minute).

The module also defines a proposal-only improvement lifecycle. A proposed change is eligible for a later apply step only when it has changed files, at least one passing test, and explicit approved status.

## Important integration status

This is a policy primitive, not yet connected to a job runner, database, signed authorization records, audit storage, or deployment pipeline. Do not treat it as enforcement until every assessment execution path calls it and negative integration tests prove that out-of-scope requests are rejected.

## Autonomous improvement lifecycle

1. Observe a failure or quality regression.
2. Create a change proposal with rationale and affected files.
3. Run static checks and tests in an isolated CI environment.
4. Reject the proposal if any required check fails.
5. Require explicit human approval.
6. Apply through a reviewed commit and normal deployment workflow.
7. Record the commit, test results, approver, and rollback reference.

The agent must not rewrite its own policy, remove approval gates, hide activity, persist on third-party systems, or deploy unreviewed changes.

## Operational posture

ZALAM should be fast through bounded parallel jobs and caching, not by removing safety checks. Every run should be attributable, rate-limited, cancellable, and exportable as evidence. Stealth, log tampering, credential theft, unauthorized access, and uncontrolled self-modification are intentionally unsupported.

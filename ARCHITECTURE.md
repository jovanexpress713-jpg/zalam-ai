# Architecture

## Current implementation
- Next.js App Router UI.
- Server-side chat route using the OpenAI-compatible chat completions API.
- Provider configuration is read only from server environment variables.
- No agent execution, shell access, file upload, persistence, authentication, or security scanning is implemented yet.

## Planned boundaries
- `providers/`: model provider adapters.
- `agents/`: task planning and orchestration; tools require explicit capability grants.
- `lab/`: authorized-target registry, isolated runner adapter, evidence capture.
- `audit/`: append-only run events and export.
- `storage/`: persistence and retention policies.

## Execution safety
Never execute model-generated commands on the host. Any future execution adapter must run in a disposable, network-restricted sandbox with resource limits, explicit target allowlists, and operator approval.

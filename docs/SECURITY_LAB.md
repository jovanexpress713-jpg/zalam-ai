# Authorized Security Lab

The lab is a planned, isolated research environment. Do not point tests at third-party systems.

## Required execution boundary
- Disposable virtual machines or containers.
- Explicit target allowlist containing only lab-owned hosts.
- No bridged access to production networks.
- No real credentials; use synthetic accounts and test secrets.
- CPU, memory, process-count, runtime, and storage quotas.
- Full command/event logging and reproducible run identifiers.
- Manual approval before any operation that changes target state.

## Initial test categories
1. Authentication hardening against a local intentionally vulnerable training app.
2. Detection of synthetic credential exposure in test data.
3. Static and dynamic analysis of inert malware test samples.
4. Prompt-injection resistance using harmless test payloads.
5. Tool-permission boundary tests.
6. Data-loss prevention tests with synthetic documents.

## Evidence format
Every run should record: target ID, scenario ID, start/end time, tool versions, configuration, events, outcome, evidence hashes, and operator approval.

The current repository does not yet implement an execution engine. Do not treat this document as proof that tests are runnable.

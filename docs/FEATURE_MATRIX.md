# Feature matrix

Status values: IMPLEMENTED (in repository), CONFIGURATION REQUIRED, PLANNED, NOT IMPLEMENTED.

| Capability | Status | Notes |
|---|---|---|
| Arabic RTL chat shell | IMPLEMENTED | Initial client interface |
| OpenAI-compatible chat endpoint | IMPLEMENTED | Server-side provider adapter |
| Ollama-compatible endpoint | CONFIGURATION REQUIRED | Start provider and set environment |
| Provider model discovery | IMPLEMENTED | Requires reachable provider |
| Health/configuration endpoint | IMPLEMENTED | Configuration is not a connectivity test |
| Conversation persistence | NOT IMPLEMENTED | Current history is browser memory only |
| Authentication and accounts | NOT IMPLEMENTED | Do not expose publicly as a multi-user service |
| Autonomous coding agent | PLANNED | Requires sandboxed file workspace |
| MCP integration | PLANNED | No MCP server is connected |
| File analysis | PLANNED | No upload pipeline yet |
| Image/video generation | PLANNED | Requires separate configured providers |
| Web research | PLANNED | Requires search provider and citations |
| Voice input/output | PLANNED | Requires speech providers |
| Authorized security lab | PLANNED | No attack execution engine is included |
| Audit log and benchmark reports | PLANNED | Required before agent execution |

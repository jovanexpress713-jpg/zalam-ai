# Security policy

ZALAM AI is intended for local AI experimentation and authorized security research.

## Scope
Use the security lab only on systems you own or have written permission to test. The repository will not implement credential theft, phishing against real people, malware propagation, stealth/persistence, or unauthorized access.

## Secrets
- Store API keys in local environment variables or a secret manager.
- Never commit `.env.local`, tokens, passwords, or private keys.
- Rotate any secret accidentally exposed in a commit.

## Vulnerability reports
Do not publish exploitable details about third-party systems. Report issues privately to the repository maintainer.

# Security policy

## Reporting a vulnerability

Report suspected vulnerabilities privately, not in a public issue: use **[Report a vulnerability](https://github.com/armohub/armovault-defender-migrator/security/advisories/new)** on this repository's Security tab, or email **info@armohub.ch**.

Include the app version and knowledge base version (both on the About page), your browser and its version, the steps to reproduce, and the impact.

## Scope

- The single-file ArMo MS Defender Migration Assistant: its Content-Security-Policy, import validation, rendering of untrusted content, and storage.
- The inventory script `tools/Get-ArMoSentinelInventory.ps1`. It must only send GET requests.
- The build pipeline, for example CSP hashing and the embedding of the typefaces.

Design notes: [docs/security-and-privacy.md](docs/security-and-privacy.md).

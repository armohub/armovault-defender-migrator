# Security policy

## Reporting a vulnerability

Report suspected vulnerabilities privately. **The contact channel will be published with the public release.** The makers have not supplied one yet, so this is a placeholder. Until then, do not open public issues for security problems.

Include the app version and knowledge base version (both on the About page), your browser and its version, the steps to reproduce, and the impact.

## Scope

- The single-file ArMo MS Defender Migration Assistant: its Content-Security-Policy, import validation, rendering of untrusted content, and storage.
- The inventory script `tools/Get-ArMoSentinelInventory.ps1`. It must only send GET requests.
- The build pipeline, for example CSP hashing and the embedding of the typeface.

Design notes: [docs/security-and-privacy.md](docs/security-and-privacy.md).

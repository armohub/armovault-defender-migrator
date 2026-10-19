# Security policy

## Reporting a vulnerability

Please report suspected vulnerabilities privately. **Contact channel: to be published with the public release** (placeholder; the makers have not yet supplied one). Until then, do not open public issues for security problems.

Please include the app version (About page), browser and version, steps to reproduce, and the impact.

## Scope

- The single-file app: CSP, import validation, rendering of untrusted content, storage.
- The inventory script `tools/Get-ArMoSentinelInventory.ps1` (it must only send GET requests).
- The build pipeline (for example CSP hashing).

Design notes: [docs/security-and-privacy.md](docs/security-and-privacy.md).

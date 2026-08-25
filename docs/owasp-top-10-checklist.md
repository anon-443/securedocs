# OWASP Top 10 Security Checklist

| OWASP risk area | SecureDocs control | Validation evidence |
|---|---|---|
| Broken access control | FastAPI resolves the authenticated user server-side and checks Admin, Manager, Employee, and ownership rules on every sensitive route. | Attempt cross-user document reads, review actions, downloads, and deletes with each role. |
| Cryptographic failures | Passwords use bcrypt; JWT signing keys and database/storage credentials are environment-only; S3 storage enables server-side encryption. | Inspect repository history and deployment variables; verify no secrets reach client bundles. |
| Injection | Pydantic validates request models and SQLAlchemy parameterizes database operations. | Test search and IDs with SQL/meta characters; run dependency and SAST scanning. |
| Insecure design | Separate trust boundaries, least-privilege roles, immutable audit events, soft deletion, and private document keys are documented. | Review the architecture and abuse cases before a release. |
| Security misconfiguration | Trusted origins/hosts, explicit CORS, security response headers, secure cookie setting, and health endpoints are configured. | Deploy staging with HTTPS and review headers with browser tooling. |
| Vulnerable components | Versioned dependency files support regular `pip` and `pnpm` vulnerability reviews. | Run dependency scans before submission and record results. |
| Authentication failures | Password policy, bcrypt, short access tokens, refresh-token rotation/revocation, failed-login tracking, and generic recovery messages are implemented. | Test token type confusion, expired/revoked refresh tokens, and invalid login behavior. |
| Software/data integrity failures | Uploaded content is magic-byte checked, DOCX is structurally inspected, files receive generated keys, and audit events form a hash chain. | Upload a renamed executable, malformed DOCX, oversized file, and mismatched MIME type. |
| Logging and monitoring failures | Login success/failure, document events, review decisions, verification attempts, and sensitive actions append audit events; alerts have resolution state. | Review the event history after each security test scenario. |
| SSRF and request abuse | The API does not fetch user-supplied external URLs, and public verification/authentication routes apply rate limiting. | Verify public endpoints reject unexpected parameters and stay bounded under repeated attempts. |

This checklist is an implementation and testing guide, not a claim that a system has been independently certified. The final report should record each executed test, result, environment, date, and any remediation.

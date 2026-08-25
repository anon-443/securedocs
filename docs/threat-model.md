# SecureDocs Threat Model

## System assets and trust boundaries

SecureDocs protects account credentials, session tokens, uploaded document bytes, document metadata, approval decisions, immutable references, audit evidence, and security-alert records. The main trust boundaries are the browser-to-API boundary, the API-to-PostgreSQL boundary, the API-to-object-storage boundary, the public verifier boundary, and the administrative role boundary.

| Threat | Likely control | Verification activity |
|---|---|---|
| Stolen password or credential stuffing | bcrypt hashes, password policy, rate limits, failed-login alerts, email verification, and generic recovery messages | Repeatedly submit invalid credentials and confirm no account enumeration or information leak. |
| Session theft or token replay | Short-lived access JWTs, refresh-token rotation, hashed refresh records, revocation, HTTP-only cookies, and CSRF checks | Reuse a revoked refresh token and submit a mutating cookie request without `X-CSRF-Token`. |
| Insecure direct object reference | Server-side role and ownership checks before document metadata, preview, download, edit, review, and delete actions | Access an unrelated document UUID as Employee, Manager, and Admin. |
| Malicious document upload | Allowed content types, file-size limit, magic-byte checks, DOCX archive structure inspection, generated storage keys, and private storage | Rename an executable, malformed archive, oversized file, and mismatched MIME-type payload. |
| Approval or verification fraud | Manager/Admin review gates, permanent reference code, QR verifier, report signature, and verification-event history | Attempt a public verification on unapproved, deleted, altered, and invalid reference codes. |
| Audit evidence tampering | Append-only service, hash chain, and PostgreSQL trigger blocking audit updates/deletes | Attempt SQL UPDATE/DELETE against `audit_events` using a non-owner API database role. |
| Privilege escalation | Admin-only user listing/role assignment, role dependencies, sensitive-action audit events, and self-demotion prevention | Try role changes as Employee/Manager and try an Admin self-demotion. |
| Data exposure through public verification | Public endpoint returns minimal authenticity fields only; private download/preview require authorization | Inspect public response bodies and confirm no owner, category, file URL, or document bytes are returned. |

## Residual risk and operating assumptions

The production deployment must use HTTPS, managed PostgreSQL backups, encrypted private object storage, unique deployment secrets, a restricted CORS allowlist, and an SMTP provider. Anti-malware scanning, enterprise single sign-on, document-content DLP, and external penetration testing are reasonable future enhancements; they are outside the current internship scope and should not be represented as implemented.

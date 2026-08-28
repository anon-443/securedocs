# SecureDocs Security Testing Report

**Version/commit:** Final handoff checkpoint recorded with the project publication  
**Environment:** Published SecureDocs production domain, Neon PostgreSQL, managed object storage, and Mailtrap Sandbox  
**Tester:** SecureDocs QA  
**Date:** 2026-08-28

## Scope and methods

This report records the final acceptance evidence for SecureDocs. Testing covered the published React workspace and same-origin FastAPI service, protected document storage, role-based review, public authenticity verification, audit immutability, failed-login alerting, and email confirmation. Disposable non-personal QA accounts and safe test documents were used. No passwords, one-time tokens, account email addresses, database credentials, or private document contents are retained in this report.

| Test ID | Control | Method | Actual result | Status | Evidence |
|---|---|---|---|---|---|
| DEPLOY-01 | Combined published runtime | Requested live health, OpenAPI, and protected API routes through the published domain | Health and OpenAPI responded successfully; an unauthenticated protected route returned the expected `401` | Passed | Published same-origin proxy check |
| AUTH-01 | Email confirmation and verified login | Registered a disposable account, received the published link in Mailtrap Sandbox, completed the public confirmation page, then signed in with that same account | Registration returned `201`; post-confirmation sign-in returned `200` and issued an HTTP-only session cookie | Passed | Redacted public email-link acceptance, 2026-08-28 |
| AUTH-02 | Verification gate | Attempted sign-in before confirming a disposable account, then after confirmation | Unverified sign-in returned `403`; verified sign-in returned `200` | Passed | Redacted endpoint acceptance, 2026-08-27 |
| RBAC-01 | Role-sensitive review | Employee uploaded a safe document and attempted review; Manager reviewed the same document | Upload returned `201`; Employee review was denied with `403`; Manager approval returned `200` | Passed | Disposable live RBAC acceptance, 2026-08-27 |
| FILE-01 | Protected preview and download | Requested the approved document through authorized preview and download routes | Both requests returned `200`; preview used `inline` disposition and download used `attachment` disposition | Passed | Managed-storage acceptance, 2026-08-27 |
| VERIFY-01 | Public verifier privacy | Opened the issued public verification record | Valid result contained only privacy-minimal authenticity information and no owner data | Passed | Disposable public-verification acceptance, 2026-08-27 |
| AUDIT-01 | Append-only audit records | Attempted a direct audit-event update after the role and document workflow | PostgreSQL trigger blocked the mutation | Passed | Database immutability acceptance, 2026-08-27 |
| ALERT-01 | Repeated-login alert | Submitted five invalid Admin sign-ins and reviewed the Admin security view | Each sign-in returned `401`; a repeated-login alert was visible to Admin | Passed | Disposable security-alert acceptance, 2026-08-27 |
| TEST-01 | Automated regression and lint checks | Ran frontend type/tests and FastAPI tests/lint after final changes | `14` frontend tests passed; `23` backend tests passed; backend lint passed | Passed | Final validation runs |

## Findings and remediation

| Finding | Severity | Remediation | Retest result |
|---|---|---|---|
| Production diagnostic configuration route was useful during deployment repair but unnecessary after acceptance | Low | Removed `/health/configuration` from the public surface and added a regression test that expects `404` | Passed locally; deployment verification is included in final publication checks |
| Mailtrap Sandbox is not a personal-email delivery service | Informational | Used the Sandbox only as controlled QA inbox evidence and documented that it does not forward to Gmail | Accepted for internship testing; `7 / 50` Sandbox messages used |
| Upstream Starlette test-client deprecation warning | Informational | Recorded as an external dependency warning; no SecureDocs test failures observed | `23` backend tests passed with one warning |

## Sign-off

SecureDocs has completed its final production acceptance flows for email confirmation, verified login, RBAC, protected document custody, public verification, audit integrity, and security alerts. The published application is suitable for internship assessment using its configured Neon database, managed storage, and Mailtrap Sandbox test inbox.

The remaining operational distinction is intentional: Mailtrap Sandbox validates application email generation inside a test inbox. A real public launch would additionally require a transactional-mail service and a verified sending domain; this is outside the current internship test scope.

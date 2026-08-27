# SecureDocs Security Testing Report

**Version/commit:** `________________`  
**Environment:** `Local / Staging / Production`  
**Tester:** `________________`  
**Date:** `________________`

## Scope and methods

Describe the tested API base URL, UI URL, roles used, seed data policy, tools (browser devtools, Postman, OpenAPI, test suite), and excluded systems. Do not place real passwords, JWTs, customer files, email addresses, or database credentials in this report.

| Test ID | Control | Method | Expected result | Actual result | Status | Evidence |
|---|---|---|---|---|---|---|
| AUTH-01 | Verified-email login | Attempt login before/after email verification | Unverified account is rejected; verified account can receive session |  |  |  |
| AUTH-02 | Refresh rotation | Refresh then replay old token | Old token is rejected |  |  |  |
| RBAC-01 | Document ownership | Employee requests another employee document | `403`, no metadata/content |  |  |  |
| FILE-01 | Content validation | Upload invalid signature / excessive file | Request rejected with safe error |  |  |  |
| CSRF-01 | Cookie mutation | Omit or alter CSRF header | Request rejected with `403` |  |  |  |
| VERIFY-01 | Public verifier privacy | Verify valid reference | Minimal authenticity fields only |  |  |  |
| AUDIT-01 | Append-only audit | Attempt audit UPDATE/DELETE in staging | Database trigger blocks mutation |  |  |  |
| ALERT-01 | Failed-login alert | Submit threshold of failed logins | Alert appears in Admin security view |  |  |  |

## Findings and remediation

| Finding | Severity | Owner | Remediation | Retest result |
|---|---|---|---|---|
|  |  |  |  |  |

## Staging execution record

| Date | Environment | Check | Result | Evidence |
|---|---|---|---|---|
| 2026-08-25 | Neon PostgreSQL staging | Secure database setting recognized by backend configuration | Passed | Backend configuration test selected the non-local PostgreSQL URL |
| 2026-08-25 | Neon PostgreSQL staging | Alembic schema migration | Passed | Revision `20260825_0001` applied as migration head |
| 2026-08-25 | Backend test environment | FastAPI test suite | Passed with one upstream deprecation warning | `17 passed` |
| 2026-08-27 | Mailtrap Email Sandbox | SecureDocs verification-email smoke test | Passed | Received in Mailtrap sandbox inbox with expected verification subject |
| 2026-08-27 | Backend test environment | Managed document-storage adapter and configuration | Passed | Upload, download disposition, and inline preview behavior covered; `21 passed`, `ruff check` passed |
| 2026-08-27 | Production-mode local container contract | Node-to-FastAPI proxy, FastAPI readiness, and Neon database health | Passed | `/health`, `/api/v1/openapi.json`, and `/health/database` succeeded through one public Node port; port collision is rejected before readiness |
| 2026-08-27 | Production-mode browser contract | Same-origin authentication and document API routes | Passed | Browser requests to `/api/v1/auth/me` and `/api/v1/documents` each returned FastAPI's expected `401 Authentication is required` response through the combined host |

Verified-login, live document upload, review actions, and public verification should be added to this record after the FastAPI service is deployed.

> Deployment note, 2026-08-27: Autoscale is the correct active hosting mode. The latest combined-runtime checkpoint is now live: the published SecureDocs domain serves the React landing experience and `/health` returns FastAPI's successful JSON response.

> Live API note, 2026-08-27: The public same-origin proxy was verified on the deployed domain. `/api/v1/openapi.json` returned the FastAPI OpenAPI specification and the protected `/api/v1/auth/me` route returned the expected `401 Authentication is required` response before login.

> Email-link note, 2026-08-27: The production cookie, trusted-origin, and public-link configuration is set for the published SecureDocs domain. Dedicated email-verification and password-recovery pages were built and visually reviewed before live registration testing.

> Input-validation note, 2026-08-27: The live registration endpoint correctly rejected a reserved special-use email domain with `422 Request validation failed`, without creating an account or sending email.

> Live registration note, 2026-08-27: A valid non-personal QA account was registered through the published same-origin API with `201 Created`, and SecureDocs returned its verification-email confirmation. Mailtrap inbox confirmation is pending because the current browser session is signed out of Mailtrap.

> Configuration repair, 2026-08-27: The first production configuration rollout exposed a FastAPI startup failure when the platform supplied comma-separated allowed origins. The setting now disables automatic JSON decoding and safely parses approved comma-separated values. The regression test and lint check passed; a fresh production rollout is required before generating the corrected live email link.

> Sidecar-resilience note, 2026-08-27: The Node runtime now retains the spawned FastAPI process reference during readiness checks, preventing a child-process exit from crashing cleanup. Full automated validation passed: `12` frontend tests, `23` backend tests, and lint checks.

> Live configuration confirmation, 2026-08-27: The published non-sensitive configuration health endpoint confirms `production` mode, HTTPS-only cookies, an HTTPS verification link, no localhost verification link, and an HTTPS password-reset link. A fresh non-personal QA registration then returned `201 Created` and triggered a new verification email for link inspection.

> Final inbox confirmation, 2026-08-27: Mailtrap shows the new SecureDocs verification message for the final QA account immediately after the repaired production registration request. Its message body is now being opened only to confirm the expected public destination.

> Sandbox boundary, 2026-08-27: Mailtrap Sandbox is being used correctly for safe test delivery. Messages appear inside the Mailtrap inbox and are not delivered to the recipient's real Gmail account. The project has used five of the fifty available sandbox test messages; no production-email quota is required for internship validation.

> Link-destination confirmation, 2026-08-27: The newest Mailtrap verification email was opened and its one-time link targets the published SecureDocs HTTPS verification route rather than a localhost address. The token was not retained in project records.

> Redacted destination evidence, 2026-08-27: The rendered Mailtrap message visibly begins its one-time link with `https://securedocs-nl6ubzst.manus.space/verify-email?token=`. No token value is recorded or disclosed.

> Dependable rendered-email check, 2026-08-27: The message is rendered inside Mailtrap's accessible email frame. A redacted inspection returned: published verification prefix present, localhost prefix absent, and one-time-token marker present. The token itself was not read, logged, or retained.

> One-time-link action, 2026-08-27: The final QA verification link was opened programmatically from the Mailtrap email frame without disclosing its token. The browser became temporarily unavailable immediately afterward, so account-confirmation success is being verified with the next secure sign-in response rather than inferred from navigation alone.

> Verification-flow control, 2026-08-27: Opening the verification page alone did not confirm the account, as intended; the API denied sign-in before the page's explicit confirmation action. A fresh verification link was requested successfully and its new Mailtrap message arrived for the deliberate confirmation-step check.

> Final confirmation attempt, 2026-08-27: The replacement one-time link was opened from the Mailtrap message without disclosing the token. Browser automation became unavailable before the public page's explicit confirmation control could be observed, so verified sign-in remains pending and is not inferred from navigation.

> Rollout verification, 2026-08-27: The repaired production container started successfully. On the live SecureDocs domain, `/health` returned the FastAPI success response and `/api/v1/auth/me` returned the expected unauthenticated `401` response through the public same-origin proxy.

> Fresh-link verification, 2026-08-27: A second valid non-personal QA registration was accepted by the repaired live API with `201 Created`. The Mailtrap sandbox inbox was opened to inspect the new message; its initial browser render was blank, so inbox loading is being rechecked before the corrected URL is confirmed.

> Delivery recheck, 2026-08-27: The refreshed Mailtrap sandbox inbox lists the newly generated SecureDocs verification message for the fresh QA account. The message body is being opened to inspect its destination URL.

> Preview note, 2026-08-27: The FastAPI sidecar now stays disabled during ordinary managed preview sessions and starts automatically in production. This prevents the internal API port from replacing the browser-facing preview. An explicit `START_FASTAPI_SIDECAR=true` opt-in remains available for local integration testing.

## Sign-off

Record the final test result, outstanding risks, and the decision to deploy or defer. Attach sanitized screenshots, request/response excerpts, and automated-test output separately.

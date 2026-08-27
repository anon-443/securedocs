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

## Sign-off

Record the final test result, outstanding risks, and the decision to deploy or defer. Attach sanitized screenshots, request/response excerpts, and automated-test output separately.

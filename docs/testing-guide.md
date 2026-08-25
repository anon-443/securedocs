# Testing Guide

## Automated checks

Run `pytest -q` from `backend/` for FastAPI unit and API smoke tests. Run `pnpm check` and `pnpm test` at the repository root for the React application. Add a test for every role-sensitive API path, error path, and new security control.

## Functional tests

| Scenario | Expected result |
|---|---|
| Employee creates an account and uploads a valid PDF | Account is created, verified, document metadata is stored, file receives a generated storage key, and an audit event is appended. |
| Employee attempts to download another employee's document | API returns `403`; no document content is exposed. |
| Manager approves a pending document | Status becomes `approved`, immutable reference code is assigned, review history and audit event are written. |
| Public visitor verifies a valid reference | API returns minimal approved metadata and records a verification event; no document bytes or owner details are returned. |
| Public visitor checks an invalid reference | API returns a non-sensitive failed verification response and records the attempt. |
| Admin reviews alerts/activity | Admin sees organization-level counts and unresolved alerts; Employee does not. |

## Manual security tests

Use the OpenAPI page or Postman to test invalid JWTs, expired/reused refresh tokens, missing CSRF headers, role changes, IDOR attempts, malformed uploads, files above the size limit, content-type mismatches, and repeated login/verification attempts. Save sanitized screenshots and response evidence in the final security report.

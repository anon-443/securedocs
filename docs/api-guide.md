# API Guide

FastAPI automatically exposes the current interactive contract at `/docs` and the OpenAPI JSON document at `/api/v1/openapi.json`. The browser dashboard should call only the documented API and should include `X-CSRF-Token` on state-changing cookie-authenticated requests.

| Module | Primary routes | Authorization |
|---|---|---|
| Authentication | `POST /api/v1/auth/register`, `/login`, `/refresh`, `/logout`, `/verify-email`, `/forgot-password`, `/reset-password`, `/change-password`; `GET /me` | Public except session/profile actions |
| Documents | `GET/POST /api/v1/documents`, `GET/PATCH/DELETE /{document_id}`, `POST /{document_id}/review`, `GET /{document_id}/preview`, `/download`, `/verification-report`, `/verification-history` | Role and ownership checked by FastAPI |
| Categories | `GET /api/v1/documents/categories`, `POST /categories` | All authenticated users may list; Admin creates |
| Verification | `GET /api/v1/verify/{reference_code}`, `GET /{reference_code}/qr` | Public, rate-limited, privacy-minimal |
| Dashboard | `GET /api/v1/dashboard/overview`, `/activity`, `/security-alerts` | Results limited by role |
| Users and roles | `PATCH /api/v1/users/me`, `POST /me/avatar`, `GET /me/activity`, `GET /users`, `PATCH /{user_id}/role` | Profile routes are owner-only; user listing and role assignment are Admin-only |

The API keeps access tokens short-lived and stores refresh sessions as token hashes. A client must never persist passwords or raw refresh tokens in local storage. Production documentation must be regenerated from the live OpenAPI contract after each endpoint change.

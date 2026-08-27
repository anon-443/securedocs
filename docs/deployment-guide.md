# Deployment Guide

SecureDocs is designed for a split deployment: host the React client as a static application, host `backend/` as a FastAPI container, use managed PostgreSQL, and store document bytes in private managed project storage or private S3-compatible object storage. This avoids exposing document files through the frontend host.

## Combined SecureDocs deployment

The root `Dockerfile` uses the required Python runtime to start FastAPI on an internal loopback port. The Node server remains the public entrypoint, serving the React build and proxying `/api/v1`, `/docs`, `/redoc`, and `/health` to FastAPI. This preserves a single HTTPS SecureDocs domain and avoids browser cross-origin cookie complexity.

Set the production `SECUREDOCS_DATABASE_URL` to a PostgreSQL `postgresql+psycopg://` URL and provide unique `JWT_SECRET_KEY` and `CSRF_SECRET_KEY` values from the host secret manager. Set `APP_ENV=production`, `COOKIE_SECURE=true`, an HTTPS `PUBLIC_VERIFICATION_BASE_URL`, and the exact deployed `FRONTEND_ORIGINS`. Use `STORAGE_BACKEND=managed` to use the project-managed private object store without extra credentials, or use `STORAGE_BACKEND=s3` with least-privilege S3 credentials. Run `alembic upgrade head` as a release step before serving traffic. The container health check calls `/health`; Node will not accept traffic until FastAPI returns a successful health response.

## Frontend deployment

Build the React client with `pnpm build`, set its API base URL as a public configuration value, and deploy to a static host such as Vercel, Netlify, or the selected platform's static hosting. If frontend and API are on different sites, use HTTPS, a documented CORS allowlist, `SameSite=None`, and secure cookies; otherwise prefer same-site `lax` cookies.

## Staging and production checklist

1. Verify a health endpoint, database connectivity, CORS behavior, cookie flags, security headers, and FastAPI `/docs` only in intended environments.
2. Apply reviewed migrations, create the first Admin through a protected provisioning procedure, and configure storage bucket encryption/lifecycle rules.
3. Run functional, role-based, upload-validation, authentication, and public-verification tests against staging.
4. Record deployment URL, commit SHA, migration version, test results, and rollback steps in the testing report.

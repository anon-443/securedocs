# Deployment Guide

SecureDocs is designed for a split deployment: host the React client as a static application, host `backend/` as a FastAPI container, use managed PostgreSQL, and use private S3-compatible object storage. This avoids exposing document files through the frontend host.

## Backend deployment

Build `backend/Dockerfile`, set the production `DATABASE_URL` to a PostgreSQL `postgresql+psycopg://` URL, and provide unique `JWT_SECRET_KEY` and `CSRF_SECRET_KEY` values from the host's secret manager. Set `APP_ENV=production`, `COOKIE_SECURE=true`, an HTTPS `PUBLIC_VERIFICATION_BASE_URL`, the exact deployed `FRONTEND_ORIGINS`, and S3 credentials with least privilege. Run `alembic upgrade head` as a release step before serving traffic.

## Frontend deployment

Build the React client with `pnpm build`, set its API base URL as a public configuration value, and deploy to a static host such as Vercel, Netlify, or the selected platform's static hosting. If frontend and API are on different sites, use HTTPS, a documented CORS allowlist, `SameSite=None`, and secure cookies; otherwise prefer same-site `lax` cookies.

## Staging and production checklist

1. Verify a health endpoint, database connectivity, CORS behavior, cookie flags, security headers, and FastAPI `/docs` only in intended environments.
2. Apply reviewed migrations, create the first Admin through a protected provisioning procedure, and configure storage bucket encryption/lifecycle rules.
3. Run functional, role-based, upload-validation, authentication, and public-verification tests against staging.
4. Record deployment URL, commit SHA, migration version, test results, and rollback steps in the testing report.

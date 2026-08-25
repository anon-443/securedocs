# Environment Variables

SecureDocs reads configuration from deployment environment variables. Do not commit a real `.env` file. In local development, create one from the following contract and keep it outside version control.

| Variable | Required | Purpose |
|---|---:|---|
| `SECUREDOCS_DATABASE_URL` | Yes | Private Neon PostgreSQL URL. The FastAPI service prioritizes this value before a generic workspace database variable. |
| `JWT_SECRET_KEY` | Yes | Unique high-entropy signing key for JWT access and refresh tokens. |
| `CSRF_SECRET_KEY` | Yes | Separate high-entropy key reserved for CSRF-related controls. |
| `FRONTEND_ORIGINS` | Yes | Comma-separated allowlist of trusted dashboard origins. |
| `COOKIE_SECURE` | Yes | `true` in HTTPS deployments and `false` only for local HTTP development. |
| `COOKIE_SAMESITE` | Yes | Usually `lax`; use `none` only with HTTPS and a documented cross-site need. |
| `STORAGE_BACKEND` | Yes | `s3` for production object storage or `local` only during development. |
| `STORAGE_BUCKET` | Yes | Private document bucket name. |
| `S3_ACCESS_KEY_ID` and `S3_SECRET_ACCESS_KEY` | For S3 | Credentials with least privilege to the document bucket. |
| `MAIL_FROM` and SMTP settings | For email | Sender and transport configuration for verification and recovery messages. |
| `EMAIL_VERIFICATION_FRONTEND_URL` and `PASSWORD_RESET_FRONTEND_URL` | Yes | Exact HTTPS frontend routes that receive one-time verification and recovery links. |
| `PUBLIC_VERIFICATION_BASE_URL` | Yes | Public UI base URL used to render QR verification links. |

Use separate values for local, staging, and production. Rotate any credential that is exposed or suspected to be exposed, and never place database URLs, JWT keys, storage credentials, or SMTP passwords in issue comments, commits, screenshots, or the frontend bundle.

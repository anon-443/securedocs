# SecureDocs: Live Web Application URL, Deployment Guide & Testing Report

**Intern:** Adeen Shahzad  
**Internship ID:** TSH/B5EAAF36  
**Project:** SecureDocs – Digital Document Verification & Management System  
**Repository:** https://github.com/anon-443/securedocs  
**Live URL:** https://securedocs-nl6ubzst.manus.space/

## Live deployment

The live application is available at:

https://securedocs-nl6ubzst.manus.space/

The public landing page, sign-in page, and authenticated workspace are deployed under the same origin. The current deployment exposes the following health probes:

| Endpoint | Expected response |
|---|---|
| `/health` | `{"status":"ok","service":"securedocs-api"}` |
| `/health/database` | `{"status":"ok","database":"reachable"}` |

## Local setup

The repository includes a React/TypeScript frontend and FastAPI backend. Use the repository README, environment-variable guide, and deployment guide as the authoritative setup references. Configure all secrets through environment variables. Never commit `.env` files or production credentials.

Typical development commands are:

```bash
pnpm install
pnpm check
pnpm test
pnpm build
```

Backend test and API commands are documented in `backend/requirements.txt`, `backend/pyproject.toml`, `docs/testing-guide.md`, and `docs/api-guide.md`.

## Testing report

### Automated checks

The repository contains frontend and backend test suites covering API wiring, database configuration, storage, security, RBAC, email, and application configuration. Use the actual test output from the final checkout as evidence. Prior project verification recorded 17 frontend tests and 23 backend tests passing; rerun the tests before submission if the source changed afterward.

### Live smoke checks

| Check | Result |
|---|---|
| Public landing page | Loads at the live URL |
| Sign-in page | Loads at `/sign-in` |
| API health | Verified: HTTP 200 and API status `ok` |
| Database health | Verified: HTTP 200 and database `reachable` |
| Authenticated Employee workspace | Verified: live API session displayed |
| Database-backed documents | Verified: two test documents displayed |
| Pending review | Verified: both displayed documents had pending-review status |
| Privileged approval | Requires confirmation with a backend-assigned Manager/Admin account |
| Public verification | Requires confirmation after approval |
| Audit activity | Requires confirmation after upload/approval test |

### Required final browser test

1. Sign in as Employee.
2. Upload a harmless PDF.
3. Confirm the document appears as pending review.
4. Sign out.
5. Sign in with a backend-assigned Manager/Admin account.
6. Approve the pending document.
7. Confirm the approved count and pending queue update.
8. Open the verification report and public verification URL.
9. Confirm that the private source document is not exposed publicly.
10. Open Audit activity and confirm upload and approval events.
11. Capture screenshots for the final evidence package.

## Deployment and security notes

The application should be deployed with HTTPS, production environment variables, a reachable PostgreSQL database, protected storage, and server-side role checks. Rotate credentials if they have ever been exposed. Do not include secrets in the source ZIP, screenshots, video, README, or form attachments.

## Submission evidence

Attach the following evidence with the final form:

- Repository link and source ZIP.
- Live URL.
- `/health` screenshot.
- `/health/database` screenshot.
- Authenticated dashboard screenshot.
- Upload and pending-review screenshot.
- Authorized approval screenshot.
- Verification report/public proof screenshot.
- Audit activity screenshot.
- Test and production-build output.
- Final project report and presentation.
- Five-to-ten-minute demo video.

## Completion status

Use **Completed** only after the privileged approval, public verification, and audit steps pass. Otherwise use **Partially Completed** and state exactly which steps remain. This report intentionally distinguishes verified deployment checks from workflow checks that require a backend-assigned privileged account.

## References

[1]: https://github.com/anon-443/securedocs "SecureDocs GitHub repository"
[2]: https://securedocs-nl6ubzst.manus.space/ "SecureDocs live application"
[3]: https://securedocs-nl6ubzst.manus.space/health "SecureDocs API health endpoint"
[4]: https://securedocs-nl6ubzst.manus.space/health/database "SecureDocs database health endpoint"
[5]: https://forms.gle/rSHmH1JtX18MY1MK7 "TechSkillHub submission form"

# SecureDocs: Secure Authentication System & User Management Module

**Intern:** Adeen Shahzad  
**Internship ID:** TSH/B5EAAF36  
**Project:** SecureDocs – Digital Document Verification & Management System  
**Live application:** https://securedocs-nl6ubzst.manus.space/

## Overview

SecureDocs uses authenticated, role-aware access to protect document operations. The browser provides the user interface, but authorization is enforced by the live FastAPI API. The client-side “View as” controls change presentation only and cannot elevate the authenticated API role.

## Implemented security controls

| Control | Implementation evidence |
|---|---|
| Registration and sign-in | Dedicated sign-in and registration screens connected to the API |
| JWT sessions | Short-lived authenticated access sessions are used for protected API requests |
| Password protection | Passwords are handled through bcrypt-based hashing in the backend security layer |
| Role-based access control | Employee, Manager, and Admin permissions are assigned by the API and checked server-side |
| Input validation | Request payloads and form inputs are validated before processing |
| Protected routes | Workspace, document, review, user, and security operations require authentication and appropriate role permissions |
| Auditability | Authentication and permission-sensitive events are written to the audit activity system |
| Safe client behavior | The browser cannot change its live role by selecting another dashboard view |

## User roles

| Role | Intended permissions |
|---|---|
| Employee | Upload owned documents, view document status, access permitted reports, and manage permitted profile operations |
| Manager | Review documents, approve or reject documents, and view permitted reports |
| Admin | Manage users and roles, manage documents, review audit activity, and view security controls |

## Verification procedure

1. Register or sign in with a test account.
2. Confirm that the authenticated workspace identifies the signed-in user.
3. Upload a harmless test document as Employee.
4. Confirm that Employee cannot approve the document or manage roles.
5. Sign in with a real backend-assigned Manager or Admin account.
6. Approve or reject the pending document.
7. Confirm that the authorization decision is reflected in the document status and audit trail.

## Security boundary

The live role is supplied by the SecureDocs API. Browser controls are not treated as a security boundary. A user cannot promote an Employee account to Manager or Admin by changing the visible dashboard role.

## Known limitation to report truthfully

The complete Manager/Admin approval test requires a backend-provisioned account. If that account is not available to the evaluator, the submission should state that the Employee workflow and API/database health checks were verified, while privileged approval requires an authorized test account.

## Conclusion

The authentication and user-management module establishes authenticated access, server-controlled role permissions, secure password handling, and auditable security-sensitive actions for the SecureDocs platform.

## References

[1]: https://securedocs-nl6ubzst.manus.space/sign-in "SecureDocs sign-in page"
[2]: https://www.owasp.org/www-project-top-ten/ "OWASP Top 10"

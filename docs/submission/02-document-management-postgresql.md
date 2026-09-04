# SecureDocs: Document Management Module & Normalized PostgreSQL Database Schema

**Intern:** Adeen Shahzad  
**Internship ID:** TSH/B5EAAF36  
**Live application:** https://securedocs-nl6ubzst.manus.space/

## Overview

The document-management module supports controlled document intake, metadata persistence, status tracking, review, secure access, and verification. The live Employee dashboard confirms that database-backed records load into the workspace; the demonstrated test account contains two documents awaiting review.

## Document workflow

1. An authenticated user uploads a permitted document.
2. The API validates the request and persists document metadata.
3. The document appears in the owner’s registry with a review status.
4. An authorized Manager or Admin reviews the document.
5. The document is approved or rejected with an auditable decision.
6. Approved documents receive a verification reference without exposing the private source file.
7. Permitted users can access status and reports according to their role.

## Supported management capabilities

| Capability | Description |
|---|---|
| Upload | Authenticated users can add permitted test documents through the workspace |
| Registry | Documents are listed with name, owner, update date, and status |
| Search and filtering | Workspace controls support document discovery and category filtering |
| Review status | Pending-review and approved states are visible in the dashboard |
| Secure access | Document operations require authentication and permission checks |
| Approval workflow | Authorized review roles can approve or reject pending documents |
| Verification output | Approved records can produce a minimal public verification reference |
| Audit trail | Upload, review, approval, and permission-sensitive operations are recorded |

## Normalized relational model

| Entity | Key fields | Relationship |
|---|---|---|
| users | `id`, email, password hash, role, profile fields, timestamps | Owns documents and creates audit events |
| roles / role assignments | role identifier and assignment metadata | Controls API permissions |
| documents | `id`, owner ID, filename, category, status, storage key, hash, timestamps | Belongs to one owner; has review and verification records |
| document reviews | document ID, reviewer ID, decision, reason, timestamp | Records approval or rejection decisions |
| verification records | document ID, reference code, public status, issued timestamp | Created for approved documents |
| audit events | actor ID, event type, target, metadata, timestamp | Records security and workflow actions |
| security events | event type, actor or source, severity, metadata, timestamp | Supports security dashboard signals |

The design keeps user data, document metadata, review decisions, verification records, and audit events separate. Foreign-key relationships preserve referential integrity and allow document history to be reconstructed without duplicating user or document data.

## Database health evidence

The deployed database probe is available at:

https://securedocs-nl6ubzst.manus.space/health/database

Expected response:

```json
{"status":"ok","database":"reachable"}
```

## Data-protection rules

Private source files must not be exposed through public verification. Public verification should reveal only the minimum authenticity information required by the evaluator or verifier. Secrets and environment files must remain outside the submitted ZIP.

## Testing procedure

1. Sign in as Employee.
2. Upload a harmless PDF.
3. Confirm the document is listed with pending-review status.
4. Confirm the dashboard total increases.
5. Use a backend-assigned Manager/Admin account to review the document.
6. Confirm that the decision updates the document status and creates an audit event.
7. Confirm that an approved document receives a verification reference.

## Conclusion

The module provides a normalized persistence model for document custody, controlled review, verification output, and audit evidence while keeping private file content separate from public proof.

## References

[1]: https://securedocs-nl6ubzst.manus.space/workspace "SecureDocs authenticated workspace"
[2]: https://securedocs-nl6ubzst.manus.space/health/database "SecureDocs database health endpoint"

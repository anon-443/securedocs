# SecureDocs: Verification Module, Comprehensive Audit Log System & Security Dashboard

**Intern:** Adeen Shahzad  
**Internship ID:** TSH/B5EAAF36  
**Live application:** https://securedocs-nl6ubzst.manus.space/

## Verification module

SecureDocs separates private document custody from public authenticity proof. After an authorized review decision, an approved document can receive a minimal reference code and public verification record. The public record is intended to prove authenticity without disclosing the private source file.

## Verification workflow

1. A document is uploaded by an authenticated user.
2. The document remains pending review.
3. A permitted Manager/Admin reviews the document.
4. Approval creates an approved record and verification reference.
5. A verifier opens the public verification URL.
6. The verifier sees minimal proof data rather than the private source document.

## Audit log system

Audit events provide an evidence trail for security-sensitive operations. The event model should capture the actor, event type, target object, timestamp, and safe metadata. Relevant events include sign-in, failed sign-in, upload, download, document update, deletion, review decision, approval, rejection, permission change, and verification activity.

| Event family | Example evidence |
|---|---|
| Authentication | Sign-in and failed sign-in events |
| Document custody | Upload, update, download, and delete events |
| Review | Approval or rejection with reviewer and timestamp |
| Permissions | Role or access changes |
| Verification | Creation or access of a verification record |
| Security | Alerts or abnormal activity signals |

## Security dashboard

The workspace dashboard exposes operational metrics such as total documents, approved records, pending review count, and security signal state. The values are loaded from the live API rather than fictional hardcoded preview data. An empty state is valid when the authenticated account has no matching records.

The current verified Employee dashboard showed:

- Total documents: `2`
- Approved records: `0`
- Awaiting review: `2`
- Workspace state: `0`
- Both listed documents: `Pending review`

## Role-based security behavior

The dashboard may provide “View as” display controls, but the authenticated role is assigned by the API and cannot be changed in the browser. This prevents client-side role switching from becoming a privilege-escalation path.

## Verification procedure

1. Upload a harmless test document.
2. Confirm pending-review state.
3. Approve it using a real backend-assigned Manager/Admin account.
4. Confirm approved-record count increases.
5. Open Verification reports.
6. Open the public verification link in a private browser window.
7. Confirm private source content is not exposed.
8. Open Audit activity.
9. Confirm upload and approval events are present with actor and timestamp.

## Security-test evidence

The live service exposes two diagnostic endpoints:

- API health: https://securedocs-nl6ubzst.manus.space/health
- Database health: https://securedocs-nl6ubzst.manus.space/health/database

Expected responses:

```json
{"status":"ok","service":"securedocs-api"}
{"status":"ok","database":"reachable"}
```

The repository also contains frontend and backend test suites, API documentation, an OWASP checklist, a threat model, and a Postman collection. Attach terminal or CI output showing the test command and result; do not claim a test passed unless the output is available.

## Limitations

The approval-to-verification sequence must be demonstrated with an authorized backend-assigned Manager/Admin account. A browser role selector alone is not evidence of authorization. Any feature that could not be tested should be described as pending or limited in the final report.

## Conclusion

SecureDocs provides a controlled route from private document intake to review, public authenticity proof, and auditable security evidence.

## References

[1]: https://securedocs-nl6ubzst.manus.space/ "SecureDocs live application"
[2]: https://securedocs-nl6ubzst.manus.space/health "SecureDocs API health endpoint"
[3]: https://securedocs-nl6ubzst.manus.space/health/database "SecureDocs database health endpoint"
[4]: https://www.owasp.org/www-project-top-ten/ "OWASP Top 10"

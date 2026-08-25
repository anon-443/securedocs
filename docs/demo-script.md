# SecureDocs 5–10 Minute Demo Script

Begin by introducing SecureDocs as a role-based document management and authenticity-verification platform designed around secure development practices. Show the architecture diagram and explain that React provides the dashboard, FastAPI enforces rules, PostgreSQL stores metadata/audit evidence, and private object storage holds document bytes.

Demonstrate the Employee experience by registering a user, explaining email verification, signing in, and uploading a valid PDF or DOCX. Point out file-type validation, generated storage keys, category metadata, and the pending-review status. Attempt a forbidden action, such as accessing another user’s document, and show the safe denial.

Switch to the Manager experience. Open the review queue, inspect a document, approve it with a decision note, and explain that approval issues an immutable reference code and QR record. Open the signed verification report and the verification-history endpoint/view.

Open the public `/verify/{reference_code}` page or scan the QR code. Show that it confirms authenticity but intentionally never exposes the document file, owner identity, or other sensitive metadata. Use the print button to demonstrate a submission-friendly verification result.

Finally, enter the Admin security view. Explain the user/role controls, failed-login counter, generated security alerts, activity stream, and append-only audit design. End by showing the OpenAPI documentation, automated test results, OWASP checklist, database diagram, deployment guide, and the GitHub commit history.

# Development Workflow

## Branches and commits

Create one focused branch per module, such as `feat/authentication`, `feat/document-upload`, or `docs/submission-pack`. Use conventional commit messages: `feat`, `fix`, `test`, `docs`, `chore`, or `refactor` followed by a concise scoped summary.

Before a pull request, run the React type/test commands and the relevant FastAPI tests, inspect the security impact, update `todo.md`, and verify that no real credentials, uploaded documents, or local database files are staged. Each pull request should explain the role impact, test evidence, and any migration or environment-variable changes.

## Local environment rules

Copy `.env.example` to a local `.env` file rather than editing the template. Generate unique secrets locally and use production secret managers for deployment. Store actual document content only in the configured storage backend, not in the repository or the database.

## Definition of done

A feature is complete only when its API authorization rules, validation, audit behavior, error state, frontend state, automated tests, and documentation are updated together. Security-sensitive features must include misuse or failure-path tests, not only successful-path tests.

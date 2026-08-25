# ADR 0001: Use React, FastAPI, PostgreSQL, and Object Storage

**Status:** Accepted  
**Date:** 2026-08-25

## Context

The assignment requires a responsive React interface, a FastAPI backend, PostgreSQL persistence, secure authentication, role-based access control, document management, verification, audit trails, and deployment-ready documentation. The platform must keep sensitive documents private while still allowing a limited public verification flow.

## Decision

The repository will use React and Tailwind CSS in `client/`, a Python FastAPI REST API in `backend/`, PostgreSQL for transactional data, and object storage for document bytes. FastAPI will expose OpenAPI documentation and keep authentication, authorization, review, verification, storage access, and audit event creation on the server. The workspace preview adapter remains isolated from the deployable FastAPI topology and is used only to preview the React experience during development.

Access tokens will be short-lived; refresh tokens will be rotated, stored as hashes, and delivered in secure, HTTP-only cookies in production. Stateful browser actions using cookies will apply CSRF protection. The UI may hide unavailable actions for usability, but FastAPI dependencies will be the authoritative RBAC control.

## Consequences

This design supports an independently deployable frontend and API, automatic FastAPI API documentation, portable PostgreSQL migrations, and private object storage. It also requires explicit development configuration for CORS, cookie domains, frontend API URLs, and cloud storage credentials. Document content must never be saved in PostgreSQL columns or committed to version control.

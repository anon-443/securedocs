# SecureDocs

SecureDocs is a **secure, role-based digital document management and verification platform**. Organizations can upload and categorize records, managers can review approval decisions, and anyone with a verified reference or QR code can validate an approved document without gaining access to its contents.

> **Project status:** The repository foundation and security architecture are in place. Core modules are being implemented incrementally with tests and documentation alongside them.

## Product scope

| Area | Primary capability |
|---|---|
| Identity | Registration, verification, password recovery, JWT access/refresh tokens, and CSRF-aware cookies |
| Roles | Admin, Manager, and Employee permissions enforced in the API and reflected in the interface |
| Documents | Validated PDF, DOCX, and image uploads; metadata; categories; search; controlled downloads; version history |
| Review | Manager approval/rejection, immutable reference codes, decision notes, and status history |
| Verification | Public QR-code validation, verification history, and downloadable verification reports |
| Security | Immutable audit events, failed-login counters, security alerts, security headers, and OWASP-focused testing |

## Repository layout

```text
securedocs/
├── client/                  # React 19 + Tailwind dashboard
├── backend/                 # FastAPI REST API and PostgreSQL application
│   ├── app/
│   │   ├── api/             # Versioned routers and dependencies
│   │   ├── core/            # Settings, security, and middleware
│   │   ├── db/              # SQLAlchemy session and migrations
│   │   ├── models/          # Relational persistence models
│   │   ├── schemas/         # Pydantic request/response contracts
│   │   └── services/        # Business workflows
│   └── tests/               # API, service, and security tests
├── docs/                    # Architecture, API, testing, deployment, and submission material
├── server/                  # Local preview adapter supplied by the workspace
├── todo.md                  # Code-verifiable implementation tracker
├── .env.example             # Safe environment-variable contract
└── docker-compose.example.yml
```

The React client and FastAPI API are intentionally separated. During development, Vite serves the dashboard and Uvicorn serves the REST API. PostgreSQL stores only relational data and metadata; document bytes are stored through a configured storage provider.

## Development quick start

1. Copy `.env.example` to `.env` and replace every placeholder secret locally.
2. Start PostgreSQL with `docker compose -f docker-compose.example.yml up -d postgres`.
3. Create a virtual environment in `backend/`, install `requirements.txt`, and run `uvicorn app.main:app --reload --port 8000`.
4. From the repository root, run `pnpm install` and `pnpm dev` for the React dashboard.
5. Visit the FastAPI OpenAPI documentation at `http://localhost:8000/docs` once the API is running.

## Engineering workflow

Use focused branches and conventional commits such as `feat(auth): add refresh-token rotation` or `docs(owasp): document file-upload controls`. Open a pull request for every completed module, run the relevant automated tests, and update `todo.md` before merging. Full practices are in [the development workflow](docs/development-workflow.md).

## Architecture and delivery documents

The primary design documents are the [architecture overview](docs/architecture.md) and [architecture decision record](docs/adr/0001-react-fastapi-postgres.md). API, database, OWASP, test, deployment, diagram, and submission documents will be expanded with the corresponding implementation modules.

## Security boundaries

SecureDocs does not place document bytes in PostgreSQL, does not commit secrets, and does not use role checks only in the browser. Every protected API action must authorize the authenticated user, validate input, produce an audit event where appropriate, and return safe error messages.

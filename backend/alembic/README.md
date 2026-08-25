# Alembic Migrations

Initialize Alembic against PostgreSQL before the first shared deployment. Generate migration scripts from the SQLAlchemy models, review each migration, apply it to a disposable database, and then apply it to staging before production.

Audit-event protections must be created in a reviewed SQL migration because they use database privileges or triggers in addition to the application-level append-only service.


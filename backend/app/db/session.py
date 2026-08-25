import logging
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings

settings = get_settings()
logger = logging.getLogger("securedocs.database")
database_url = settings.database_url
if not database_url.startswith("postgresql+"):
    logger.warning("SecureDocs API requires a PostgreSQL DATABASE_URL; using the local development fallback.")
    database_url = "postgresql+psycopg://securedocs:change-me@localhost:5432/securedocs"
engine = create_engine(database_url, pool_pre_ping=True, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


def get_db_session() -> Generator[Session, None, None]:
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

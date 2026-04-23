from __future__ import annotations

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings


def _get_db_url() -> str:
    url = settings.database_url
    # Render gives postgres:// or postgresql:// — convert to psycopg3 dialect
    url = url.replace("postgresql+psycopg2://", "postgresql+psycopg://")
    url = url.replace("postgresql://", "postgresql+psycopg://")
    url = url.replace("postgres://", "postgresql+psycopg://")
    return url

engine = create_engine(
    _get_db_url(),
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


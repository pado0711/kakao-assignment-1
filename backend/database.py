from __future__ import annotations

from typing import Generator, Optional

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, Session as DbSession, sessionmaker


class Base(DeclarativeBase):
    pass


SessionLocal: Optional[sessionmaker[DbSession]] = None


def configure_database(database_url: str) -> None:
    global SessionLocal

    connect_args = {"check_same_thread": False} if database_url.startswith("sqlite") else {}
    engine = create_engine(database_url, connect_args=connect_args)
    if database_url.startswith("sqlite"):

        @event.listens_for(engine, "connect")
        def enable_sqlite_foreign_keys(dbapi_connection, _connection_record):
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()

    SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    Base.metadata.create_all(bind=engine)


def get_db() -> Generator[DbSession, None, None]:
    if SessionLocal is None:
        raise RuntimeError("Database is not configured.")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

from collections.abc import Generator
from dotenv import load_dotenv
from sqlalchemy import create_engine, Engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session
import os

# load .env so os.getenv() can read it
load_dotenv()

# connection string from .env - never hardcode secrets
DATABASE_URL: str | None = os.getenv("DATABASE_URL")

# engine = the connection pool
# pool_pre_ping detects stale connections; pool_recycle prevents timeout disconnects
engine: Engine = create_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    pool_recycle=1800,
)

# SessionLocal = a factory for DB sessions
SessionLocal: sessionmaker[Session] = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
)

# Base = all ORM models inherit from this
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that provides a DB session and guarantees cleanup.
    Ensures the connection is returned to the pool even if a route raises.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create all SQLAlchemy tables for the configured database."""
    Base.metadata.create_all(bind=engine)
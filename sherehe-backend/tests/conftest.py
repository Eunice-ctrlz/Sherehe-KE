import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import sys
import os

# Ensure the app directory is in the path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.database import get_db, Base

# We will use the existing DEV database for simplicity, but wrap in a transaction
# A better approach for production is a dedicated test database (e.g. sherehe_test)
SQLALCHEMY_DATABASE_URL = os.environ.get(
    "DATABASE_URL", 
    "postgresql://postgres:postgres123@sherehe-postgres:5432/sherehe"
)

# In docker compose, resolving `sherehe-postgres` will work.
engine = create_engine(SQLALCHEMY_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session")
def setup_database():
    # We assume migrations (Alembic) have already set up the DB scheme with PostGIS
    # If this was a blank DB, we'd do Base.metadata.create_all(bind=engine)
    yield
    # No teardown needed as we expect DB to be persistent dev DB for now

@pytest.fixture(scope="function")
def db_session(setup_database):
    """
    Creates a fresh database session for a test and rolls back changes after.
    """
    connection = engine.connect()
    # Begin a non-ORM transaction
    transaction = connection.begin()
    # Bind an individual Session to the connection
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    # Rollback the overall transaction, restoring the state before the test ran
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture(scope="function")
def client(db_session):
    """
    Returns a FastAPI TestClient that overrides the get_db dependency to use
    the transactional db_session above.
    """
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    
    # We pass raise_server_exceptions=False or completely bypass lifespan
    # so Redis listener doesn't block the async loop in TestClient
    from contextlib import asynccontextmanager
    
    @asynccontextmanager
    async def mock_lifespan(app):
        yield

    original_lifespan = app.router.lifespan_context
    app.router.lifespan_context = mock_lifespan
    
    with TestClient(app) as c:
        yield c
        
    app.router.lifespan_context = original_lifespan
    app.dependency_overrides.clear()

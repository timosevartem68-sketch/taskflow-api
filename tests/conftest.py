import asyncio
from collections.abc import AsyncGenerator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app import models  # noqa: F401
from app.db.base import Base
from app.db.session import get_db
from app.main import app


TEST_DATABASE_URL = "sqlite+aiosqlite:///./test_taskflow.db"


test_engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
)

TestingSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
    async with TestingSessionLocal() as session:
        yield session


async def reset_test_database() -> None:
    async with test_engine.begin() as connection:
        await connection.run_sync(Base.metadata.drop_all)
        await connection.run_sync(Base.metadata.create_all)


@pytest.fixture(autouse=True)
def prepare_test_database():
    asyncio.run(reset_test_database())

    app.dependency_overrides[get_db] = override_get_db

    yield

    app.dependency_overrides.clear()


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client
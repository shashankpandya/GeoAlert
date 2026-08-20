from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import settings


def _make_engine():
    connect_args = {}
    # Neon PostgreSQL requires SSL
    if settings.NEON_MODE or "neon.tech" in settings.DATABASE_URL:
        connect_args["ssl"] = "require"
    return create_async_engine(
        settings.DATABASE_URL,
        echo=settings.ENVIRONMENT == "development",
        pool_pre_ping=True,
        connect_args=connect_args,
        pool_size=5,
        max_overflow=10,
    )


engine = _make_engine()
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

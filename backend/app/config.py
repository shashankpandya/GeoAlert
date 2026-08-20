from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Neon PostgreSQL connection string (set in .env or environment)
    # Format: postgresql+asyncpg://user:password@ep-xxx.neon.tech/dbname?sslmode=require
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/geoalert"
    REDIS_URL: str = "redis://localhost:6379/0"
    API_KEY: str = "changeme-in-production"
    SECRET_KEY: str = "changeme-in-production-secret"
    ENVIRONMENT: str = "development"
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "https://geoalert.vercel.app"]
    # Neon requires SSL — automatically added when DATABASE_URL contains neon.tech
    NEON_MODE: bool = False

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Auto-detect Neon and enable SSL mode
        if "neon.tech" in self.DATABASE_URL and "sslmode" not in self.DATABASE_URL:
            object.__setattr__(self, "DATABASE_URL", self.DATABASE_URL + "?ssl=require")
        if "neon.tech" in self.DATABASE_URL:
            object.__setattr__(self, "NEON_MODE", True)

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

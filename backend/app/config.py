from pydantic import field_validator
from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from typing import List


class Settings(BaseSettings):
    model_config = ConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore",
    )

    # PostgreSQL — supports local or Neon
    # Neon format: postgresql+asyncpg://user:pass@ep-xxx.neon.tech/dbname?ssl=require
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/geoalert"
    REDIS_URL: str = "redis://localhost:6379/0"
    API_KEY: str = "changeme-in-production"
    SECRET_KEY: str = "changeme-in-production-secret"
    ENVIRONMENT: str = "development"
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "https://geoalert.vercel.app"]
    NEON_MODE: bool = False

    def model_post_init(self, __context) -> None:
        """Auto-detect Neon and configure SSL."""
        if "neon.tech" in self.DATABASE_URL:
            if "ssl=require" not in self.DATABASE_URL and "sslmode=require" not in self.DATABASE_URL:
                object.__setattr__(self, "DATABASE_URL", self.DATABASE_URL + "?ssl=require")
            object.__setattr__(self, "NEON_MODE", True)


settings = Settings()

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/geoalert"
    REDIS_URL: str = "redis://localhost:6379/0"
    API_KEY: str = "changeme-in-production"
    SECRET_KEY: str = "changeme-in-production-secret"
    ENVIRONMENT: str = "development"
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

from pydantic import ConfigDict
from pydantic_settings import BaseSettings
from typing import List, Optional


class Settings(BaseSettings):
    model_config = ConfigDict(env_file='.env', case_sensitive=True, extra='ignore')

    # Neon PostgreSQL (asyncpg for app, psycopg2 for migrations)
    DATABASE_URL: str = 'postgresql+asyncpg://postgres:postgres@localhost:5432/geoalert'
    DATABASE_URL_POOLED: Optional[str] = None

    # Redis - OPTIONAL, rate limiting disabled if not reachable
    REDIS_URL: str = 'redis://localhost:6379/0'

    # Security
    API_KEY: str = 'changeme-in-production'
    SECRET_KEY: str = 'changeme-in-production-secret'

    # App
    ENVIRONMENT: str = 'development'
    CORS_ORIGINS: List[str] = ['http://localhost:3000']
    NEON_MODE: bool = False

    def model_post_init(self, __context) -> None:
        if 'neon.tech' in self.DATABASE_URL:
            if 'ssl=' not in self.DATABASE_URL:
                object.__setattr__(self, 'DATABASE_URL', self.DATABASE_URL + '?ssl=require')
            object.__setattr__(self, 'NEON_MODE', True)

    def get_sync_url(self) -> str:
        '''Return a synchronous psycopg2 URL for Alembic migrations.'''
        # Prefer the pooled URL if provided
        if self.DATABASE_URL_POOLED:
            url = self.DATABASE_URL_POOLED
        else:
            url = self.DATABASE_URL
        # Strip asyncpg driver prefix
        url = url.replace('postgresql+asyncpg://', 'postgresql://')
        # Neon channel_binding not supported by psycopg2 — strip it
        if 'channel_binding' in url:
            parts = url.split('?', 1)
            if len(parts) == 2:
                params = '&'.join(p for p in parts[1].split('&') if not p.startswith('channel_binding'))
                url = parts[0] + ('?' + params if params else '')
        return url


settings = Settings()

from __future__ import annotations
import time
import logging
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
import redis.asyncio as aioredis
from app.config import settings

logger = logging.getLogger(__name__)

WRITE_PATHS = {'/api/alerts/ingest', '/api/sources/classify', '/api/user/delete'}
READ_LIMIT = 100
WRITE_LIMIT = 10
WINDOW = 60


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, redis_url: str = None):
        super().__init__(app)
        self._redis_url = redis_url or settings.REDIS_URL
        self._redis = None

    async def _get_redis(self):
        if self._redis is None:
            try:
                # Upstash uses rediss:// (TLS) - pass ssl_cert_reqs=None to allow
                kwargs = {'decode_responses': True}
                if self._redis_url.startswith('rediss://'):
                    kwargs['ssl_cert_reqs'] = None
                self._redis = aioredis.from_url(self._redis_url, **kwargs)
                # Test connection
                await self._redis.ping()
                logger.info('Redis connected: %s', self._redis_url[:40])
            except Exception as e:
                logger.warning('Redis unavailable (%s) - rate limiting disabled', e)
                self._redis = None
                return None
        return self._redis

    async def dispatch(self, request: Request, call_next):
        # Admin key bypasses rate limiting
        if request.headers.get('X-Admin-Key'):
            return await call_next(request)

        client_ip = request.client.host if request.client else 'unknown'
        path = request.url.path
        is_write = any(path.startswith(p) for p in WRITE_PATHS)
        limit = WRITE_LIMIT if is_write else READ_LIMIT
        key = f'rl:{client_ip}:{path}:{int(time.time() // WINDOW)}'

        redis = await self._get_redis()
        if redis:
            try:
                count = await redis.incr(key)
                if count == 1:
                    await redis.expire(key, WINDOW)
                if count > limit:
                    logger.warning('Rate limit: %s %s (%d/%d)', client_ip, path, count, limit)
                    raise HTTPException(
                        status_code=429,
                        detail={'code': 'RATE_LIMIT_EXCEEDED', 'message': f'Too many requests. Retry after {WINDOW}s.'},
                        headers={'Retry-After': str(WINDOW)},
                    )
            except HTTPException:
                raise
            except Exception:
                pass  # Redis error - continue without rate limiting

        return await call_next(request)

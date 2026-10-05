"""In-memory sliding-window rate limiter for API Gateway."""

import time
from collections import defaultdict, deque
from typing import Deque

from fastapi import HTTPException, Request, status


class SlidingWindowRateLimiter:
    """Sliding window rate limiter tracking request timestamps per client key."""

    def __init__(self, max_requests: int = 120, window_seconds: int = 60) -> None:
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._records: dict[str, Deque[float]] = defaultdict(deque)

    def is_allowed(self, key: str) -> bool:
        """Check if request with given key is within the rate limit."""
        now = time.time()
        cutoff = now - self.window_seconds
        q = self._records[key]

        # Evict timestamps outside current window
        while q and q[0] < cutoff:
            q.popleft()

        if len(q) >= self.max_requests:
            return False

        q.append(now)
        return True

    def check_request(self, request: Request, key_override: str | None = None) -> None:
        """Evaluate request or raise HTTP 429 Too Many Requests."""
        key = key_override or request.client.host if request.client else "unknown"
        if not self.is_allowed(key):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded: maximum {self.max_requests} requests per {self.window_seconds}s",
            )

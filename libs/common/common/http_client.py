"""Resilient async HTTP client with request-ID propagation, timeouts, and bounded retries."""

import asyncio
from typing import Any, Optional

import httpx

from common.logging import get_logger, get_request_id

logger = get_logger("common.http_client")


class ResilientAsyncClient:
    """Wrapper around httpx.AsyncClient with sensible defaults, retries, and request tracing."""

    def __init__(
        self,
        base_url: str = "",
        timeout: float = 10.0,
        max_retries: int = 2,
        backoff_factor: float = 0.5,
        headers: Optional[dict[str, str]] = None,
    ):
        self.base_url = base_url
        self.max_retries = max_retries
        self.backoff_factor = backoff_factor
        self.default_headers = headers or {}
        self.timeout = httpx.Timeout(
            timeout=timeout,
            connect=3.0,
            read=timeout,
            write=5.0,
            pool=5.0,
        )
        self._client: Optional[httpx.AsyncClient] = None

    async def __aenter__(self) -> "ResilientAsyncClient":
        self._client = httpx.AsyncClient(
            base_url=self.base_url,
            timeout=self.timeout,
            headers=self.default_headers,
        )
        return self

    async def __aexit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        if self._client:
            await self._client.aclose()
            self._client = None

    def _prepare_headers(self, headers: Optional[dict[str, str]]) -> dict[str, str]:
        req_headers = dict(headers or {})
        req_id = get_request_id()
        if req_id and "X-Request-ID" not in req_headers:
            req_headers["X-Request-ID"] = req_id
        return req_headers

    async def request(
        self,
        method: str,
        url: str,
        retry_on_status: tuple[int, ...] = (502, 503, 504),
        **kwargs: Any,
    ) -> httpx.Response:
        """Execute request with bounded retries for idempotent/transient failures."""
        if not self._client:
            raise RuntimeError("ResilientAsyncClient must be used as an async context manager")

        kwargs["headers"] = self._prepare_headers(kwargs.get("headers"))
        is_idempotent = method.upper() in ("GET", "HEAD", "OPTIONS")
        attempts = self.max_retries + 1 if is_idempotent else 1

        last_exc: Optional[Exception] = None
        for attempt in range(1, attempts + 1):
            try:
                response = await self._client.request(method, url, **kwargs)
                if attempt < attempts and response.status_code in retry_on_status:
                    logger.warning(
                        "Received status %d from %s %s, retrying (attempt %d/%d)...",
                        response.status_code,
                        method,
                        url,
                        attempt,
                        attempts,
                    )
                    await asyncio.sleep(self.backoff_factor * (2 ** (attempt - 1)))
                    continue
                return response
            except (httpx.ConnectError, httpx.ConnectTimeout, httpx.ReadTimeout) as exc:
                last_exc = exc
                if attempt < attempts:
                    logger.warning(
                        "Network error (%s) contacting %s %s, retrying (attempt %d/%d)...",
                        type(exc).__name__,
                        method,
                        url,
                        attempt,
                        attempts,
                    )
                    await asyncio.sleep(self.backoff_factor * (2 ** (attempt - 1)))
                else:
                    if last_exc:
                        raise last_exc
                    raise RuntimeError("Failed to complete request after retries")

        raise RuntimeError("Unexpected failure in request retry loop")

    async def get(self, url: str, **kwargs: Any) -> httpx.Response:
        return await self.request("GET", url, **kwargs)

    async def post(self, url: str, **kwargs: Any) -> httpx.Response:
        return await self.request("POST", url, **kwargs)

    async def put(self, url: str, **kwargs: Any) -> httpx.Response:
        return await self.request("PUT", url, **kwargs)

    async def delete(self, url: str, **kwargs: Any) -> httpx.Response:
        return await self.request("DELETE", url, **kwargs)

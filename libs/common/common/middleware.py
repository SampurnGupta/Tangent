"""Middleware for request-ID propagation and error handling."""

import uuid
from typing import Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from common.logging import set_request_id


class RequestIdMiddleware(BaseHTTPMiddleware):
    """Ensure every HTTP request has an X-Request-ID header and context variable."""

    HEADER_NAME = "X-Request-ID"

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        req_id = request.headers.get(self.HEADER_NAME)
        if not req_id:
            req_id = f"req-{uuid.uuid4().hex[:12]}"

        # Bind to logging context
        set_request_id(req_id)
        request.state.request_id = req_id

        response = await call_next(request)
        response.headers[self.HEADER_NAME] = req_id
        return response

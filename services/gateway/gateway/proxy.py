"""Reverse proxy forwarding helper for gateway routing."""

from typing import Mapping

import httpx
from common.logging import get_logger
from fastapi import HTTPException, Request, Response, status

logger = get_logger("tangent-gateway.proxy")

# Hop-by-hop headers to strip when forwarding
HOP_BY_HOP_HEADERS = {
    "host",
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailers",
    "transfer-encoding",
    "upgrade",
    "content-length",
}


async def forward_request(
    client: httpx.AsyncClient,
    target_url: str,
    request: Request,
    extra_headers: Mapping[str, str] | None = None,
) -> Response:
    """Forward incoming request to target microservice and return Response."""
    # Build filtered headers
    headers = {k: v for k, v in request.headers.items() if k.lower() not in HOP_BY_HOP_HEADERS}
    if extra_headers:
        headers.update(extra_headers)

    body = await request.body()
    method = request.method

    try:
        upstream_resp = await client.request(
            method=method,
            url=target_url,
            params=dict(request.query_params),
            content=body,
            headers=headers,
            timeout=30.0,
        )

        response_headers = {
            k: v for k, v in upstream_resp.headers.items() if k.lower() not in HOP_BY_HOP_HEADERS
        }

        return Response(
            content=upstream_resp.content,
            status_code=upstream_resp.status_code,
            headers=response_headers,
            media_type=upstream_resp.headers.get("content-type"),
        )
    except (httpx.ConnectError, httpx.ConnectTimeout) as e:
        logger.error("Upstream connection error forwarding to %s: %s", target_url, e)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Downstream service unavailable at {target_url}",
        ) from e
    except httpx.TimeoutException as e:
        logger.error("Upstream timeout forwarding to %s: %s", target_url, e)
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=f"Downstream service timed out at {target_url}",
        ) from e
    except Exception as e:
        logger.error("Unexpected error forwarding to %s: %s", target_url, e)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Error communicating with upstream microservice",
        ) from e

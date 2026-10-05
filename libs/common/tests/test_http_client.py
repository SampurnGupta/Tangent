"""Tests for ResilientAsyncClient."""

import pytest
from common.http_client import ResilientAsyncClient
from common.logging import set_request_id


@pytest.mark.asyncio
async def test_resilient_client_headers_propagation():
    set_request_id("req-test-abc")
    client = ResilientAsyncClient()
    headers = client._prepare_headers({"Authorization": "Bearer token"})
    assert headers["Authorization"] == "Bearer token"
    assert headers["X-Request-ID"] == "req-test-abc"
    set_request_id(None)


@pytest.mark.asyncio
async def test_resilient_client_custom_headers_no_overwrite():
    set_request_id("req-test-abc")
    client = ResilientAsyncClient()
    headers = client._prepare_headers({"X-Request-ID": "req-explicit"})
    assert headers["X-Request-ID"] == "req-explicit"
    set_request_id(None)

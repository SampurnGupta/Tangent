"""Tests for JSON logging and request ID context."""

import json
import logging

from common.logging import JSONLogFormatter, get_request_id, set_request_id


def test_json_formatter_basic():
    formatter = JSONLogFormatter(service_name="test-service")
    record = logging.LogRecord(
        name="test.logger",
        level=logging.INFO,
        pathname="test_file.py",
        lineno=10,
        msg="Test message",
        args=(),
        exc_info=None,
    )
    output = formatter.format(record)
    data = json.loads(output)

    assert data["service"] == "test-service"
    assert data["level"] == "INFO"
    assert data["message"] == "Test message"
    assert data["logger"] == "test.logger"
    assert "timestamp" in data


def test_json_formatter_with_request_id():
    formatter = JSONLogFormatter(service_name="test-service")
    set_request_id("req-test-12345")
    assert get_request_id() == "req-test-12345"

    record = logging.LogRecord(
        name="test.logger",
        level=logging.INFO,
        pathname="test_file.py",
        lineno=10,
        msg="Message with request id",
        args=(),
        exc_info=None,
    )
    output = formatter.format(record)
    data = json.loads(output)

    assert data["request_id"] == "req-test-12345"
    set_request_id(None)

"""Structured JSON logging with request-ID propagation for Tangent services."""

import contextvars
import json
import logging
import sys
from datetime import datetime, timezone
from typing import Any, Optional

request_id_ctx: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar(
    "request_id", default=None
)


def get_request_id() -> Optional[str]:
    """Retrieve the current request ID from context."""
    return request_id_ctx.get()


def set_request_id(req_id: Optional[str]) -> None:
    """Set the request ID in the context."""
    request_id_ctx.set(req_id)


class JSONLogFormatter(logging.Formatter):
    """Custom logging formatter that emits single-line JSON with context fields."""

    def __init__(self, service_name: str = "tangent-service"):
        super().__init__()
        self.service_name = service_name

    def format(self, record: logging.LogRecord) -> str:
        log_entry: dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "service": self.service_name,
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        req_id = get_request_id()
        if req_id:
            log_entry["request_id"] = req_id

        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)

        # Include custom extra fields if provided
        for key, value in record.__dict__.items():
            if key not in (
                "args",
                "asctime",
                "created",
                "exc_info",
                "exc_text",
                "filename",
                "funcName",
                "id",
                "levelname",
                "levelno",
                "lineno",
                "module",
                "msecs",
                "message",
                "msg",
                "name",
                "pathname",
                "process",
                "processName",
                "relativeCreated",
                "stack_info",
                "thread",
                "threadName",
            ):
                try:
                    # Test JSON serialization
                    json.dumps(value)
                    log_entry[key] = value
                except (TypeError, OverflowError):
                    log_entry[key] = str(value)

        return json.dumps(log_entry)


def setup_logging(
    service_name: str = "tangent-service",
    log_level: str = "INFO",
    json_logs: bool = True,
) -> None:
    """Configure root logger with either JSON formatting or human-friendly format."""
    root_logger = logging.getLogger()
    numeric_level = getattr(logging, log_level.upper(), logging.INFO)
    root_logger.setLevel(numeric_level)

    # Clear existing handlers
    for handler in list(root_logger.handlers):
        root_logger.removeHandler(handler)

    handler = logging.StreamHandler(sys.stdout)
    if json_logs:
        handler.setFormatter(JSONLogFormatter(service_name=service_name))
    else:
        handler.setFormatter(
            logging.Formatter("[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s")
        )

    root_logger.addHandler(handler)


def get_logger(name: str) -> logging.Logger:
    """Get a named logger instance."""
    return logging.getLogger(name)

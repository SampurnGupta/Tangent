"""Service metrics tracker for FastAPI microservices."""

import time
from datetime import datetime, timezone
from typing import Any


class ServiceMetricsTracker:
    """In-memory metrics accumulator for microservice monitoring."""

    def __init__(self, service_name: str) -> None:
        self.service_name = service_name
        self.start_time = time.time()
        self.requests_total = 0
        self.errors_total = 0
        self.total_latency_ms = 0.0
        self.custom_metrics: dict[str, Any] = {}

    def record_request(self, latency_ms: float, is_error: bool = False) -> None:
        """Record request completion and latency."""
        self.requests_total += 1
        self.total_latency_ms += latency_ms
        if is_error:
            self.errors_total += 1

    def set_custom_metric(self, key: str, value: Any) -> None:
        """Set a domain-specific metric value."""
        self.custom_metrics[key] = value

    def increment_custom_metric(self, key: str, amount: int = 1) -> None:
        """Increment a domain-specific integer metric."""
        self.custom_metrics[key] = self.custom_metrics.get(key, 0) + amount

    def get_summary(self) -> dict[str, Any]:
        """Return standardized JSON metrics snapshot."""
        uptime = round(time.time() - self.start_time, 2)
        avg_latency = (
            round(self.total_latency_ms / self.requests_total, 2)
            if self.requests_total > 0
            else 0.0
        )
        return {
            "service": self.service_name,
            "status": "healthy",
            "uptime_seconds": uptime,
            "timestamp_utc": datetime.now(timezone.utc).isoformat(),
            "requests_total": self.requests_total,
            "errors_total": self.errors_total,
            "avg_latency_ms": avg_latency,
            **self.custom_metrics,
        }

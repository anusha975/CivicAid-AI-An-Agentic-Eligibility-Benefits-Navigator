"""
CivicAid AI - Structured Logging Configuration (Module 9)
Configures standard JSON-formatted logs optimized for Amazon CloudWatch and local development.
"""
import logging
import json
import sys
from datetime import datetime, timezone


class CloudWatchJsonFormatter(logging.Formatter):
    """
    Formats log records into structured JSON suitable for CloudWatch Logs Insights.
    """
    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "line": record.lineno
        }

        # Include custom extra fields if provided
        if hasattr(record, "request_id"):
            log_entry["request_id"] = record.request_id
        if hasattr(record, "path"):
            log_entry["path"] = record.path
        if hasattr(record, "method"):
            log_entry["method"] = record.method
        if hasattr(record, "status_code"):
            log_entry["status_code"] = record.status_code
        if hasattr(record, "process_time_ms"):
            log_entry["process_time_ms"] = record.process_time_ms

        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_entry, ensure_ascii=False)


def setup_structured_logging(level: str = "INFO") -> logging.Logger:
    """
    Initializes root logging with CloudWatch JSON formatter.
    """
    logger = logging.getLogger("civicaid")
    logger.setLevel(getattr(logging, level.upper(), logging.INFO))

    # Remove existing handlers to avoid duplicates
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(CloudWatchJsonFormatter())
        logger.addHandler(handler)

    return logger


logger = setup_structured_logging()

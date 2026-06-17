"""Structured logging configuration for FusionNeural Backend."""
import logging
import sys
import json
from datetime import datetime, timezone


class JSONFormatter(logging.Formatter):
    """JSON log formatter for structured logging in production."""

    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        if record.exc_info and record.exc_info[0] is not None:
            log_entry["exception"] = self.formatException(record.exc_info)

        if hasattr(record, "request_id"):
            log_entry["request_id"] = record.request_id

        if hasattr(record, "agent"):
            log_entry["agent"] = record.agent

        return json.dumps(log_entry, ensure_ascii=False)


def setup_logging(debug: bool = False) -> None:
    """Configure application logging.

    Args:
        debug: If True, use human-readable format. If False, use JSON.
    """
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG if debug else logging.INFO)

    # Remove existing handlers
    root_logger.handlers.clear()

    handler = logging.StreamHandler(sys.stdout)

    if debug:
        formatter = logging.Formatter(
            "[%(asctime)s] %(levelname)s %(name)s: %(message)s",
            datefmt="%H:%M:%S",
        )
    else:
        formatter = JSONFormatter()

    handler.setFormatter(formatter)
    root_logger.addHandler(handler)

    # Suppress noisy libraries
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("urllib3").setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    """Get a named logger."""
    return logging.getLogger(name)

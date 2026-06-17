"""Tests for authentication middleware."""
import pytest
from unittest.mock import patch, MagicMock


def test_verify_token_requires_credentials():
    """verify_token should raise 401 when no credentials provided."""
    from services.auth import verify_token

    with pytest.raises(Exception) as exc_info:
        verify_token(None)
    assert exc_info.value.status_code == 401


def test_verify_token_rejects_invalid_token():
    """verify_token should raise 403 for invalid tokens."""
    from services.auth import verify_token
    from fastapi.security import HTTPAuthorizationCredentials

    credentials = HTTPAuthorizationCredentials(
        scheme="Bearer",
        credentials="invalid-token-12345"
    )

    with pytest.raises(Exception) as exc_info:
        verify_token(credentials)
    assert exc_info.value.status_code == 403


def test_rate_limiter_allows_requests():
    """RateLimiter should allow requests within limit."""
    from main import RateLimiter

    limiter = RateLimiter(max_requests=5, window_seconds=60)
    for _ in range(5):
        assert limiter.is_allowed("192.168.1.1") is True


def test_rate_limiter_blocks_excess_requests():
    """RateLimiter should block requests exceeding limit."""
    from main import RateLimiter

    limiter = RateLimiter(max_requests=3, window_seconds=60)
    for _ in range(3):
        limiter.is_allowed("192.168.1.1")
    assert limiter.is_allowed("192.168.1.1") is False


def test_rate_limiter_different_ips():
    """RateLimiter should track IPs independently."""
    from main import RateLimiter

    limiter = RateLimiter(max_requests=2, window_seconds=60)
    limiter.is_allowed("192.168.1.1")
    limiter.is_allowed("192.168.1.1")
    assert limiter.is_allowed("192.168.1.1") is False
    assert limiter.is_allowed("192.168.1.2") is True

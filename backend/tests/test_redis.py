"""Tests for Redis helper functions."""
import pytest
import json


def test_fs_encode_string():
    """_fs_encode should encode strings correctly."""
    from main import _fs_encode
    result = _fs_encode({"name": "test"})
    assert result == {"name": {"stringValue": "test"}}


def test_fs_encode_integer():
    """_fs_encode should encode integers correctly."""
    from main import _fs_encode
    result = _fs_encode({"count": 42})
    assert result == {"count": {"integerValue": "42"}}


def test_fs_encode_boolean():
    """_fs_encode should encode booleans correctly."""
    from main import _fs_encode
    result = _fs_encode({"active": True})
    assert result == {"active": {"booleanValue": True}}


def test_fs_encode_none():
    """_fs_encode should encode None as null."""
    from main import _fs_encode
    result = _fs_encode({"value": None})
    assert result == {"value": {"nullValue": None}}


def test_fs_decode_string():
    """_fs_decode should decode string values."""
    from main import _fs_decode
    result = _fs_decode({"name": {"stringValue": "test"}})
    assert result == {"name": "test"}


def test_fs_decode_integer():
    """_fs_decode should decode integer values."""
    from main import _fs_decode
    result = _fs_decode({"count": {"integerValue": "42"}})
    assert result == {"count": 42}


def test_fs_roundtrip():
    """encode then decode should return original data."""
    from main import _fs_encode, _fs_decode
    original = {"name": "test", "count": 42, "active": True, "value": None}
    encoded = _fs_encode(original)
    decoded = _fs_decode(encoded)
    assert decoded == original

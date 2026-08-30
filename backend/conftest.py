"""
Pytest configuration for GeoAlert v2 backend tests.

Tests that require a database should use the `db_session` fixture.
Tests that don't need a DB can run without any setup.
"""
import pytest

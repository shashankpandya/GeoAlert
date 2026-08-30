"""Tests for XSS sanitization — no database required."""
from app.utils.sanitize import sanitize_input, sanitize_html


def test_sanitize_strips_script_tags():
    assert "<script>" not in sanitize_input("<script>alert(1)</script>hello")


def test_sanitize_strips_event_handlers():
    result = sanitize_input('<img onerror="alert(1)" src="x">')
    assert "onerror" not in result


def test_sanitize_preserves_plain_text():
    result = sanitize_input("Seattle, WA")
    assert "Seattle" in result
    assert "WA" in result


def test_sanitize_html_allows_safe_tags():
    result = sanitize_html("<p>Hello <strong>world</strong></p>")
    assert "<p>" in result
    assert "<strong>" in result


def test_sanitize_html_strips_script():
    result = sanitize_html("<p>Hello</p><script>evil()</script>")
    assert "<script>" not in result

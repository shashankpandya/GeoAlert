import bleach
import re


def sanitize_input(text: str) -> str:
    cleaned = bleach.clean(text, tags=[], strip=True)
    cleaned = re.sub(r'[<>\'"`;]', '', cleaned)
    return cleaned.strip()


def sanitize_html(html: str) -> str:
    allowed_tags = ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li']
    return bleach.clean(html, tags=allowed_tags, strip=True)

#!/usr/bin/env python3
"""Validate local references and in-page anchors for the dependency-free RM site."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
errors = []
html_files = sorted(ROOT.rglob("*.html"))
if not html_files:
    print("No HTML files found.", file=sys.stderr)
    raise SystemExit(1)

class PageParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.references = []
        self.ids = set()
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get("id"):
            self.ids.add(attrs["id"])
        for key in ("src", "href", "poster"):
            value = attrs.get(key)
            if value:
                self.references.append((key, value))

for page in html_files:
    source = page.read_text(encoding="utf-8")
    parser = PageParser()
    parser.feed(source)
    parser.close()
    rel_page = page.relative_to(ROOT).as_posix()

    for key, value in parser.references:
        value = value.strip()
        if not value or value.startswith(("#", "data:", "mailto:", "tel:", "javascript:")):
            if key == "href" and value.startswith("#") and len(value) > 1:
                anchor = value[1:]
                if anchor not in parser.ids:
                    errors.append(f"{rel_page}: missing in-page anchor #{anchor}")
            continue
        parsed = urlsplit(value)
        if parsed.scheme or parsed.netloc:
            continue
        target_text = parsed.path
        if not target_text:
            target = page
        elif target_text.startswith("/"):
            target = ROOT / target_text.lstrip("/")
        else:
            target = (page.parent / target_text).resolve()
        if target.is_dir():
            target = target / "index.html"
        try:
            target.relative_to(ROOT)
        except ValueError:
            errors.append(f"{rel_page}: local reference escapes site root: {value}")
            continue
        if not target.is_file():
            errors.append(f"{rel_page}: missing local {key} target: {value} -> {target.relative_to(ROOT)}")

# Check CSS url() references, excluding data URLs and absolute external assets.
for css in sorted(ROOT.rglob("*.css")):
    source = css.read_text(encoding="utf-8")
    for raw in re.findall(r"url\(\s*(['\"]?)(.*?)\1\s*\)", source, flags=re.I):
        value = raw[1].strip()
        if not value or value.startswith(("data:", "#")):
            continue
        parsed = urlsplit(value)
        if parsed.scheme or parsed.netloc:
            continue
        target_text = parsed.path
        target = (ROOT / target_text.lstrip("/")) if target_text.startswith("/") else (css.parent / target_text).resolve()
        try:
            target.relative_to(ROOT)
        except ValueError:
            errors.append(f"{css.relative_to(ROOT)}: CSS URL escapes site root: {value}")
            continue
        if not target.is_file():
            errors.append(f"{css.relative_to(ROOT)}: missing CSS asset: {value}")

if errors:
    print("RM asset validation FAILED:")
    for error in errors:
        print(f" - {error}")
    raise SystemExit(1)

print(f"RM asset validation passed: {len(html_files)} HTML pages and all local references resolved.")

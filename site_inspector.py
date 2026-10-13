from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse
import json

BASE = "https://portsaid-store.duckdns.org/"
HTML = Path("index.html").read_text(errors="replace")

class Extractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.assets = []
        self.forms = []
        self.scripts_inline = 0

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)

        if tag == "script":
            if a.get("src"):
                self.assets.append(("JS", a["src"]))
            else:
                self.scripts_inline += 1

        elif tag == "link" and a.get("href"):
            rel = a.get("rel", "")
            if any(x in rel for x in ["stylesheet", "icon", "manifest"]):
                self.assets.append((rel.upper(), a["href"]))

        elif tag == "img" and a.get("src"):
            self.assets.append(("IMAGE", a["src"]))

        elif tag in ("iframe", "video", "source") and a.get("src"):
            self.assets.append((tag.upper(), a["src"]))

        elif tag == "form":
            self.forms.append({
                "action": a.get("action", ""),
                "method": a.get("method", "get")
            })

parser = Extractor()
parser.feed(HTML)

print("=== TITLE ===")
import re
print(re.findall(r"<title[^>]*>(.*?)</title>", HTML, re.I | re.S)[:3])

print("\n=== ASSETS ===")
for kind, src in parser.assets:
    print(f"{kind}\t{urljoin(BASE, src)}")

print("\n=== FORMS ===")
print(json.dumps(parser.forms, ensure_ascii=False, indent=2))

print("\n=== PAGE DETAILS ===")
print("HTML characters:", len(HTML))
print("Inline scripts:", parser.scripts_inline)
print("Asset count:", len(parser.assets))
print("Forms count:", len(parser.forms))

Path("assets.txt").write_text(
    "\n".join(f"{kind}\t{urljoin(BASE, src)}"
              for kind, src in parser.assets)
)

import urllib.request
import urllib.error
from pathlib import Path

BASE = "https://portsaid-store.duckdns.org"
OUT = Path.home() / "portsaid-store-recovery"
OUT.mkdir(parents=True, exist_ok=True)

paths = [
    "/",
    "/index.html",
    "/robots.txt",
    "/sitemap.xml",
    "/manifest.json",
    "/asset-manifest.json",
    "/package.json",
    "/app.js",
    "/main.js",
    "/style.css",
    "/styles.css",
    "/favicon.ico",
]

def fetch(path):
    url = BASE + path
    try:
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "Mozilla/5.0"}
        )
        with urllib.request.urlopen(req, timeout=20) as r:
            data = r.read()
            content_type = r.headers.get("Content-Type", "")
            print(f"[OK] {path} | {r.status} | {len(data)} bytes")
            return data, content_type
    except Exception as e:
        print(f"[FAIL] {path} | {e}")
        return None, ""

for path in paths:
    data, content_type = fetch(path)

    if data is None:
        continue

    if path == "/" and "text/html" in content_type:
        path = "/index.html"

    dest = OUT / path.lstrip("/")
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(data)

print("\nانتهى الفحص.")
print("مجلد الملفات:", OUT)

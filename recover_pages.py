from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urlparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import re

BASE = "https://portsaid-store.duckdns.org"
ROOT = Path.home() / "portsaid-store-recovery"
OUT = ROOT / "recovered_pages"
OUT.mkdir(parents=True, exist_ok=True)

routes = [
    "/",
    "/games",
    "/movies",
    "/electronics",
    "/programs",
    "/info",
    "/download",
    "/apps",
    "/apps/media-downloader",
    "/apps/smart-cleaner",
    "/media-downloader/plans",
]

def fetch(route):
    url = BASE + route
    try:
        req = Request(
            url,
            headers={"User-Agent": "Mozilla/5.0"}
        )
        with urlopen(req, timeout=30) as response:
            data = response.read()
            content_type = response.headers.get("Content-Type", "")

        if "text/html" not in content_type.lower():
            return route, "SKIP", content_type, 0

        name = "index.html" if route == "/" else route.strip("/") + ".html"
        target = OUT / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)

        return route, "OK", content_type, len(data)

    except Exception as e:
        return route, "FAIL", str(e), 0

print("جاري استرجاع الصفحات العامة...\n")

with ThreadPoolExecutor(max_workers=4) as pool:
    jobs = [pool.submit(fetch, route) for route in routes]

    for job in as_completed(jobs):
        route, status, detail, size = job.result()
        print(f"[{status}] {route} | {size} bytes | {detail}")

print("\nانتهى الاسترجاع.")
print("مجلد الصفحات:", OUT)
print("عدد ملفات HTML:", len(list(OUT.rglob("*.html"))))

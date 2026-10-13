from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urljoin, urlparse
from html.parser import HTMLParser
from concurrent.futures import ThreadPoolExecutor, as_completed
import re
import time

BASE = "https://portsaid-store.duckdns.org/"
ROOT = Path.home() / "portsaid-store-recovery"
PAGES = ROOT / "recovered_pages"
ASSETS = ROOT / "recovered_assets"
ASSETS.mkdir(parents=True, exist_ok=True)

HOST = urlparse(BASE).netloc
urls = set()
visited_css = set()

class AssetParser(HTMLParser):
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)

        for key in ("src", "poster"):
            value = a.get(key)
            if value:
                urls.add((current_page_url, value))

        if a.get("srcset"):
            for item in a["srcset"].split(","):
                parts = item.strip().split()
                if parts:
                    urls.add((current_page_url, parts[0]))

        if tag == "link" and a.get("href"):
            rel = a.get("rel", "").lower()
            href = a["href"]
            if any(x in rel for x in (
                "stylesheet", "icon", "manifest",
                "preload", "apple-touch-icon"
            )):
                urls.add((current_page_url, href))

        if tag == "script" and a.get("src"):
            urls.add((current_page_url, a["src"]))

for page in PAGES.rglob("*.html"):
    relative = page.relative_to(PAGES).as_posix()
    if relative == "index.html":
        page_url = BASE
    else:
        page_url = urljoin(BASE, relative.replace(".html", ""))

    current_page_url = page_url
    parser = AssetParser()
    parser.feed(page.read_text(errors="replace"))

    html = page.read_text(errors="replace")

    # Images and resources referenced inside inline CSS.
    for value in re.findall(
        r'url\(\s*["\']?([^"\')]+)', html, re.I
    ):
        urls.add((page_url, value.strip()))

    # Common image URLs embedded in scripts or page data.
    for value in re.findall(
        r'["\']([^"\']+\.(?:webp|png|jpe?g|gif|svg|avif)(?:\?[^"\']*)?)["\']',
        html, re.I
    ):
        urls.add((page_url, value))

def normalize(base, value):
    value = value.strip()
    if not value or value.startswith((
        "data:", "blob:", "javascript:", "mailto:", "tel:", "#"
    )):
        return None

    absolute = urljoin(base, value)
    parsed = urlparse(absolute)

    if parsed.scheme not in ("http", "https"):
        return None
    if parsed.netloc != HOST:
        return None

    return absolute

def local_path(url):
    path = urlparse(url).path.lstrip("/")
    if not path:
        return None
    return ASSETS / path

def download(url):
    target = local_path(url)
    if target is None:
        return None, None

    if target.exists() and target.stat().st_size > 0:
        return url, "EXISTS"

    try:
        req = Request(
            url,
            headers={"User-Agent": "Mozilla/5.0"}
        )
        with urlopen(req, timeout=25) as response:
            data = response.read()
            content_type = response.headers.get("Content-Type", "")

        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
        return url, f"OK {len(data)} bytes ({content_type})"

    except Exception as exc:
        return url, f"FAIL {exc}"

queue = set()

for base_url, value in urls:
    normalized = normalize(base_url, value)
    if normalized:
        queue.add(normalized)

# Also retry all assets identified from the homepage inventory.
inventory = ROOT / "assets.txt"
if inventory.exists():
    for line in inventory.read_text(errors="replace").splitlines():
        parts = line.split("\t")
        if len(parts) >= 2:
            normalized = normalize(BASE, parts[-1])
            if normalized:
                queue.add(normalized)

print("Resources discovered:", len(queue))
print("Downloading public resources...")

failed = []
downloaded = 0

with ThreadPoolExecutor(max_workers=4) as pool:
    futures = [pool.submit(download, u) for u in sorted(queue)]

    for future in as_completed(futures):
        url, result = future.result()
        if url is None:
            continue

        print(f"[{result}] {url}")

        if result.startswith("OK "):
            downloaded += 1
        elif result.startswith("FAIL"):
            failed.append(url)

        time.sleep(0.02)

print("\n===== SUMMARY =====")
print("Resources discovered:", len(queue))
print("Newly downloaded:", downloaded)
print("Failed:", len(failed))
print("Total files on disk:", sum(
    1 for p in ASSETS.rglob("*") if p.is_file()
))
print("Assets directory:", ASSETS)

if failed:
    (ROOT / "failed_assets.txt").write_text(
        "\n".join(failed)
    )
    print("Failed URL list:", ROOT / "failed_assets.txt")

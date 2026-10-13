from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urlparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import re

BASE = "https://portsaid-store.duckdns.org"
ROOT = Path.home() / "portsaid-store-recovery"
DEST = ROOT / "recovered_assets"
DEST.mkdir(parents=True, exist_ok=True)

html = (ROOT / "index.html").read_text(errors="replace")

urls = set()

# Extract script and stylesheet references.
for match in re.finditer(
    r'<script\b[^>]*\bsrc\s*=\s*["\']([^"\']+)',
    html, re.I
):
    urls.add(match.group(1))

for match in re.finditer(
    r'<link\b[^>]*\bhref\s*=\s*["\']([^"\']+)',
    html, re.I
):
    urls.add(match.group(1))

# Extract image references.
for match in re.finditer(
    r'<img\b[^>]*\bsrc\s*=\s*["\']([^"\']+)',
    html, re.I
):
    urls.add(match.group(1))

# Extract URLs from the asset inventory, if available.
asset_file = ROOT / "assets.txt"
if asset_file.exists():
    for line in asset_file.read_text(errors="replace").splitlines():
        parts = line.split("\t")
        if len(parts) >= 2:
            urls.add(parts[-1].strip())

def download(url):
    if url.startswith("//"):
        url = "https:" + url
    elif url.startswith("/"):
        url = BASE + url
    elif not url.startswith(("https://", "http://")):
        return "SKIP", url, "Unsupported URL"

    parsed = urlparse(url)

    # Only download resources hosted on the same website.
    if parsed.netloc != urlparse(BASE).netloc:
        return "SKIP", url, "External host"

    path = parsed.path.lstrip("/")
    if not path:
        return "SKIP", url, "Empty path"

    target = DEST / path
    target.parent.mkdir(parents=True, exist_ok=True)

    try:
        req = Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urlopen(req, timeout=25) as response:
            data = response.read()
            if response.status != 200:
                return "FAIL", url, str(response.status)

            target.write_bytes(data)
            return "OK", url, f"{len(data)} bytes -> {target.relative_to(DEST)}"
    except Exception as exc:
        return "FAIL", url, str(exc)

print(f"Found {len(urls)} resource references.")
print("Downloading public assets...")

with ThreadPoolExecutor(max_workers=6) as pool:
    futures = [pool.submit(download, url) for url in sorted(urls)]
    for future in as_completed(futures):
        status, url, message = future.result()
        print(f"[{status}] {url}\n  {message}")

print("\nFinished.")
print("Assets directory:", DEST)

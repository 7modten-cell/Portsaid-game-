from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlsplit, unquote

ROOT = Path(__file__).resolve().parent
PAGES = ROOT / "recovered_pages"
ASSETS = ROOT / "recovered_assets"

ROUTES = {
    "/": "index.html",
    "/games": "games.html",
    "/movies": "movies.html",
    "/electronics": "electronics.html",
    "/programs": "programs.html",
    "/info": "info.html",
    "/download": "download.html",
    "/apps": "apps.html",
    "/apps/media-downloader": "apps/media-downloader.html",
    "/apps/smart-cleaner": "apps/smart-cleaner.html",
    "/media-downloader/plans": "media-downloader/plans.html",
}

class SiteHandler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        url_path = unquote(urlsplit(path).path)

        if url_path in ("/", "/index.html"):
            return str(PAGES / "index.html")

        if url_path in ROUTES:
            return str(PAGES / ROUTES[url_path])

        if url_path.startswith("/static/"):
            relative = url_path.lstrip("/")
            target = (ASSETS / relative).resolve()
            if target.is_relative_to(ASSETS.resolve()):
                return str(target)
            return str(ROOT / "not-found")

        if url_path == "/manifest.webmanifest":
            return str(ASSETS / "manifest.webmanifest")

        return str(ROOT / "not-found")

    def log_message(self, format, *args):
        print("%s - %s" % (self.address_string(), format % args))

server = HTTPServer(("127.0.0.1", 8080), SiteHandler)

print("الموقع يعمل الآن")
print("افتح المتصفح على: http://127.0.0.1:8080")
print("لإيقاف الخادم اضغط CTRL+C")

try:
    server.serve_forever()
except KeyboardInterrupt:
    print("\nتم إيقاف الخادم.")
finally:
    server.server_close()

from pathlib import Path
from shutil import copy2
import re

ROOT = Path.cwd()
OUT = ROOT / "docs"
PAGES = ROOT / "recovered_pages"
ASSETS = ROOT / "recovered_assets"

BASE = "/Portsaid-game-/"

ROUTES = {
    "index.html": "",
    "games.html": "games",
    "movies.html": "movies",
    "electronics.html": "electronics",
    "programs.html": "programs",
    "info.html": "info",
    "download.html": "download",
    "apps.html": "apps",
    "apps/media-downloader.html": "apps/media-downloader",
    "apps/smart-cleaner.html": "apps/smart-cleaner",
    "media-downloader/plans.html": "media-downloader/plans",
}

KEEP_IMAGES = {
    "static/uploads/logo_854909eb2ab04eb8ad52c9e9a638b847.webp",
    "static/img/hero/neutral-tech-hero.webp",
    "static/img/hero/neutral-tech-hero-mobile.webp",
}

IMAGE_EXTS = {
    ".png", ".jpg", ".jpeg", ".webp", ".avif",
    ".gif", ".bmp", ".ico", ".svg"
}

if not PAGES.exists() or not ASSETS.exists():
    raise SystemExit("خطأ: مجلدات الصفحات أو الملفات غير موجودة.")

# إنشاء docs دون حذف أي ملفات من المشروع الأصلي
OUT.mkdir(exist_ok=True)

# نسخ ملفات الموقع الثابتة، مع الاحتفاظ بالصور المطلوبة فقط
for src in ASSETS.rglob("*"):
    if not src.is_file():
        continue

    rel = src.relative_to(ASSETS)
    if rel.suffix.lower() in IMAGE_EXTS:
        if rel.as_posix() not in KEEP_IMAGES:
            continue

    dst = OUT / rel
    dst.parent.mkdir(parents=True, exist_ok=True)
    copy2(src, dst)

# تحويل صفحات HTML إلى مسارات مناسبة لـ GitHub Pages
for original, route in ROUTES.items():
    src = PAGES / original
    if not src.exists():
        print("تحذير: الصفحة غير موجودة:", src)
        continue

    if route:
        dst = OUT / route / "index.html"
    else:
        dst = OUT / "index.html"

    dst.parent.mkdir(parents=True, exist_ok=True)
    html = src.read_text(encoding="utf-8", errors="replace")

    # تحويل روابط ملفات الموقع إلى مسارات GitHub Pages
    html = html.replace(
        "https://portsaid-store.duckdns.org/static/",
        BASE + "static/"
    )
    html = html.replace(
        "http://portsaid-store.duckdns.org/static/",
        BASE + "static/"
    )

    html = re.sub(
        r"""(?P<q>["'(])/(static/|manifest\.webmanifest)""",
        lambda m: m.group("q") + BASE + m.group(2),
        html
    )

    # روابط الصفحات الداخلية
    for filename, target in ROUTES.items():
        if filename == "index.html":
            continue

        stem = "/" + filename[:-5]
        replacement = BASE + target + "/"

        html = re.sub(
            r"""(["'=])""" + re.escape(stem) + r"""(?=["'?#])""",
            lambda m: m.group(1) + replacement.rstrip("/"),
            html
        )

        html = html.replace(
            'href="' + stem + '"',
            'href="' + replacement + '"'
        )

    # حفظ الملف
    dst.write_text(html, encoding="utf-8")
    print("تم تجهيز الصفحة:", dst.relative_to(OUT))

# ملف إرشادي لتشغيل GitHub Pages
(OUT / ".nojekyll").write_text("", encoding="utf-8")

print("\nاكتمل تجهيز ملفات GitHub Pages داخل docs/")
print("لم يتم حذف الملفات الأصلية من المشروع.")

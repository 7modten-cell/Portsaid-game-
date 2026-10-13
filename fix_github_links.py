from pathlib import Path
import re

DOCS = Path("docs")
BASE = "https://7modten-cell.github.io/Portsaid-game-/"

if not DOCS.exists():
    raise SystemExit("خطأ: مجلد docs غير موجود. تأكد من تجهيز نسخة GitHub Pages أولًا.")

count = 0

for file in DOCS.rglob("*.html"):
    html = file.read_text(encoding="utf-8", errors="replace")
    original = html

    # تحويل الروابط المطلقة التي تشير إلى جذر حساب GitHub
    # إلى جذر مشروع Portsaid-game-
    html = re.sub(
        r"https?://7modten-cell\.github\.io/(?!Portsaid-game-/)",
        BASE,
        html,
        flags=re.I
    )

    # تحويل الروابط الأصلية للموقع إلى نسخة GitHub Pages
    html = re.sub(
        r"https?://portsaid-store\.duckdns\.org/(?!static/uploads/)",
        BASE,
        html,
        flags=re.I
    )

    # إصلاح الروابط الداخلية المكتوبة كمسارات تبدأ بشرطة مائلة
    routes = [
        "games", "movies", "electronics", "programs",
        "info", "download", "apps", "media-downloader/plans",
        "apps/media-downloader", "apps/smart-cleaner"
    ]

    for route in routes:
        html = re.sub(
            r"""(?P<q>["'])/""" + re.escape(route) + r"""(?P<tail>[/#?]["']|["'])""",
            lambda m: m.group("q") + BASE + route + m.group("tail"),
            html
        )

    if html != original:
        file.write_text(html, encoding="utf-8")
        count += 1
        print("تم إصلاح:", file)

print(f"\nانتهى الفحص. عدد الصفحات المعدلة: {count}")

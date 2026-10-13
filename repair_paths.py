from pathlib import Path
import re

root = Path("docs")
prefix = "/Portsaid-game-/"

routes = (
    "static/",
    "games",
    "movies",
    "electronics",
    "programs",
    "info",
    "download",
    "apps",
    "media-downloader",
)

pattern = re.compile(
    r"""(?P<before>["'=(:\s])/(?P<route>"""
    + "|".join(re.escape(x) for x in routes)
    + r""")(?=[/"'?#\s)]|$)"""
)

changed = 0

for file in root.rglob("*"):
    if not file.is_file() or file.suffix.lower() not in {
        ".html", ".css", ".js", ".json", ".webmanifest", ".xml"
    }:
        continue

    try:
        original = file.read_text(encoding="utf-8")
    except (UnicodeDecodeError, OSError):
        continue

    updated = pattern.sub(
        lambda m: m.group("before") + prefix + m.group("route"),
        original
    )

    if updated != original:
        file.write_text(updated, encoding="utf-8")
        changed += 1
        print("تم إصلاح:", file)

print(f"\nانتهى الإصلاح. عدد الملفات المعدلة: {changed}")

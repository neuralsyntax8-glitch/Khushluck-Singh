"""
Drive → GitHub Certificate Sync
Downloads images from a public Google Drive folder to assets/
and updates data/certificates.json with new entries.

Usage:
    pip install gdown
    python scripts/sync-certs.py
"""
import json
import os
import re
import subprocess
import sys
from pathlib import Path

DRIVE_FOLDER_ID = "1RbNOUtxlTRy16sK-JhqxLsbgJ9t6LS1B"
ASSETS_DIR = Path("assets")
CERTS_JSON = Path("data/certificates.json")
ALLOWED_EXT = {".png", ".jpg", ".jpeg", ".gif", ".webp"}


def run_gdown():
    """Download all files from the public Drive folder using gdown."""
    cmd = [sys.executable, "-m", "gdown", "--folder", DRIVE_FOLDER_ID, "--output", str(ASSETS_DIR)]
    result = subprocess.run(cmd, capture_output=True, text=True)
    print(result.stdout)
    if result.returncode != 0:
        print("gdown stderr:", result.stderr)
        return False
    return True


def load_certificates():
    if CERTS_JSON.exists():
        with open(CERTS_JSON) as f:
            return json.load(f)
    return []


def save_certificates(certs):
    with open(CERTS_JSON, "w") as f:
        json.dump(certs, f, indent=2)
    print(f"Saved {len(certs)} certificates to {CERTS_JSON}")


def infer_category(title):
    t = title.lower()
    if "python" in t or "data" in t:
        return "Python"
    if any(k in t for k in ("ai", "chatgpt", "prompt", "chatbot", "machine learning")):
        return "AI"
    if any(k in t for k in ("css", "html", "tailwind", "web", "javascript", "react")):
        return "Web"
    return "AI"


def infer_title(filename):
    name = Path(filename).stem
    name = name.replace("_", " ").replace("-", " ")
    name = re.sub(r"\s+", " ", name).strip()
    if re.match(r"^\w{5,7}\s\d$", name):
        return ""
    return name.title()


def sync():
    print("Downloading images from Drive folder...")
    if not run_gdown():
        print("gdown failed. Is the folder public?")
        sys.exit(1)

    certs = load_certificates()
    existing_images = {c["imageUrl"] for c in certs if "imageUrl" in c}
    # Also support old key "image" for backward compatibility during transition
    existing_images.update({c["image"] for c in certs if "image" in c})

    # Determine next ID
    max_id = 0
    for c in certs:
        cid = c.get("id")
        if isinstance(cid, int) and cid > max_id:
            max_id = cid
    next_id = max_id + 1

    new_count = 0
    for fpath in sorted(ASSETS_DIR.iterdir()):
        if fpath.suffix.lower() not in ALLOWED_EXT:
            continue
        rel_path = str(fpath.as_posix())
        if rel_path in existing_images:
            continue

        title = infer_title(fpath.name)
        if not title:
            title = fpath.stem.replace("_", " ").replace("-", " ").title()
        cat = infer_category(title or fpath.stem)

        # Build certificate object matching the expected schema
        cert = {
            "id": next_id,
            "title": title,
            "provider": "Auto-Synced",  # using issuer as provider
            "category": cat,
            "year": 2026,
            "issueDate": "2026",
            "credentialId": f"AUTO-{next_id:04d}",
            "imageUrl": rel_path,
            "description": "Auto-synced certificate from Google Drive",
            "skills": "",
            "tags": [],
            "verified": True
        }

        certs.append(cert)
        existing_images.add(rel_path)
        next_id += 1
        new_count += 1

    print(f"New certificates found: {new_count}")
    save_certificates(certs)


if __name__ == "__main__":
    sync()

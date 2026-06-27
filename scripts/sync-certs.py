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

# ---------- CONFIG ----------
DRIVE_FOLDER_ID = "1RbNOUtxlTRy16sK-JhqxLsbgJ9t6LS1B"  # from your share link
ASSETS_DIR = Path("assets")
CERTS_JSON = Path("data/certificates.json")
ALLOWED_EXT = {".png", ".jpg", ".jpeg", ".gif", ".webp"}
# ---------------------------

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
    """Guess category from filename/title."""
    t = title.lower()
    if "python" in t or "data" in t:
        return "Python"
    if any(k in t for k in ("ai", "chatgpt", "prompt", "chatbot", "machine learning")):
        return "AI"
    if any(k in t for k in ("css", "html", "tailwind", "web", "javascript", "react")):
        return "Web Development"
    if any(k in t for k in ("workshop", "summit", "seminar")):
        return "Other"
    return "AI"

def clean_filename(name):
    """Remove unwanted characters and normalize spaces."""
    name = name.replace("_", " ").replace("-", " ").replace("|", " ")
    name = re.sub(r"\s+", " ", name).strip()
    return name

def infer_title(filename):
    """Create a readable title from the filename."""
    name = Path(filename).stem
    name = clean_filename(name)
    if re.match(r"^\w{5,7}\s\d$", name):
        return ""
    return name.title()

def sync():
    print("Downloading images from Drive folder...")
    if not run_gdown():
        print("gdown failed. Is the folder public?")
        sys.exit(1)

    # Load existing certificates (if any)
    certs = load_certificates()
    # Build a set of already‑seen image paths (support both old & new keys)
    existing_images = {
        c.get("imageUrl") or c.get("image")
        for c in certs
        if c.get("imageUrl") or c.get("image")
    }

    # Determine next available ID
    max_id = 0
    for c in certs:
        cid = c.get("id")
        if isinstance(cid, int) and cid > max_id:
            max_id = cid
    next_id = max_id + 1

    new_count = 0
    # Process files in alphabetical order for determinism
    for fpath in sorted(ASSETS_DIR.iterdir()):
        if fpath.suffix.lower() not in ALLOWED_EXT:
            continue
        rel_path = str(fpath.as_posix())  # e.g. "assets/Cert1.png"
        if rel_path in existing_images:
            continue  # already recorded

        # ----- Build certificate object -----
        title = infer_title(fpath.name)
        if not title:
            title = clean_filename(fpath.stem).title()

        # Try to extract year from filename (e.g. "2025", "2026")
        year_match = re.search(r"\b(202[3-6])\b", title)
        year = int(year_match.group(1)) if year_match else 2026

        cert = {
            "id": next_id,
            "title": title,
            "provider": "Auto-Synced",
            "category": infer_category(title or fpath.stem),
            "year": year,
            "issueDate": str(year),
            "credentialId": f"SYNC-{next_id:04d}",
            "imageUrl": rel_path,
            "description": "Certificate from Google Drive sync.",
            "skills": "",
            "tags": [],
            "verified": True
        }
        # ------------------------------------

        certs.append(cert)
        existing_images.add(rel_path)
        next_id += 1
        new_count += 1

    print(f"New certificates found: {new_count}")
    save_certificates(certs)

if __name__ == "__main__":
    sync()

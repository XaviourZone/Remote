#!/usr/bin/env python3
"""Builds database/index.json from a local clone of Flipper-IRDB.

Usage: python3 build_index.py <path-to-Flipper-IRDB-clone> <output-json> [source-repo] [ref]

The app downloads this small index (instead of hitting the GitHub API, which is
rate limited) and then fetches each remote file on demand from
raw.githubusercontent.com / jsDelivr.
"""
import json
import os
import re
import sys
import datetime
from collections import Counter, defaultdict

POWER_PRIORITY = [
    re.compile(r"^power$"), re.compile(r"^pwr$"), re.compile(r"^power_?(on_?off|toggle)$"),
    re.compile(r"^on_?off$"), re.compile(r"power"), re.compile(r"^off$"), re.compile(r"^on$"),
    re.compile(r"standby"), re.compile(r"^(power_?)?off"),
]

# Keyword classifier for the "_Converted_" part of the database, which is only
# organised by manufacturer.
KEYWORDS = [
    ("ACs", r"air ?con|aircon|\bac\b|a/c|klima|split|inverter|heat ?pump|cooling"),
    ("Fans", r"\bfan\b|ventilat|cooler"),
    ("Projectors", r"projector|beamer"),
    ("SoundBars", r"sound ?bar|soundbar"),
    ("Audio_and_Video_Receivers", r"receiver|\bavr\b|amplifier|\bamp\b|hifi|hi-fi|stereo|tuner"),
    ("Cable_Boxes", r"\bstb\b|set ?top|\bsat\b|satellite|dvb|\bdth\b|cable|freeview|decoder|\bpvr\b|tata ?sky|dish|airtel|videocon"),
    ("Streaming_Devices", r"android ?box|tv ?box|media ?player|\bmxq\b|\bmx\d|roku|fire ?tv|apple ?tv|chromecast|kodi|nvidia"),
    ("DVD_Players", r"\bdvd\b|blu-?ray|\bbd\b|\bvcd\b"),
    ("LED_Lighting", r"\bled\b(?!.*tv)|light|lamp|bulb|strip|rgb"),
    ("TVs", r"\btv\b|television|\blcd\b|plasma|\bled ?tv|oled|qled|monitor|display"),
]

def classify(text):
    t = text.lower()
    for cat, rx in KEYWORDS:
        if re.search(rx, t):
            return cat
    return "Miscellaneous"

def brand_key(b):
    return re.sub(r"[^a-z0-9]", "", b.lower())

def pick_power(names):
    lowered = [n.lower() for n in names]
    for rx in POWER_PRIORITY:
        for i, n in enumerate(lowered):
            if rx.search(n):
                return names[i]
    return names[0] if names else ""

def parse_names(path):
    names = []
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            for line in f:
                if line.startswith("name:"):
                    names.append(line[5:].strip())
    except OSError:
        pass
    return names

def main():
    root = sys.argv[1]
    out = sys.argv[2]
    source = sys.argv[3] if len(sys.argv) > 3 else "Lucaslhm/Flipper-IRDB"
    ref = sys.argv[4] if len(sys.argv) > 4 else "main"
    entries = []
    brand_display = defaultdict(Counter)
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if not d.startswith(".")]
        for fn in filenames:
            if not fn.lower().endswith(".ir"):
                continue
            full = os.path.join(dirpath, fn)
            rel = os.path.relpath(full, root).replace(os.sep, "/")
            parts = rel.split("/")
            model = fn[:-3]
            converted = parts[0] == "_Converted_"
            if converted:
                if len(parts) < 5:
                    continue
                brand = parts[3]
                sub = " ".join(parts[4:-1])
                if sub:
                    model = sub + " " + model
                category = classify(" ".join(parts[3:]))
            else:
                if len(parts) < 3:
                    # e.g. Universal_TV_Remotes/UNIVERSAL_POWER_OFF_DEVICES.ir
                    brand = "Universal"
                    category = parts[0]
                else:
                    category = parts[0]
                    brand = parts[1]
                    if len(parts) > 3:
                        model = " ".join(parts[2:-1]) + " " + model
            names = parse_names(full)
            if not names:
                continue
            bk = brand_key(brand) or "unknown"
            brand_display[bk][brand.replace("_", " ")] += (1 if converted else 3)
            entries.append({
                "p": rel,
                "c": category,
                "b": bk,
                "m": model.replace("_", " ").strip(),
                "n": len(names),
                "w": pick_power(names),
                "x": 1 if converted else 0,
            })
    brands = {}
    for bk, cnt in brand_display.items():
        # Prefer a mixed/upper case name that was used most often.
        brands[bk] = cnt.most_common(1)[0][0]
    entries.sort(key=lambda e: (e["c"], e["b"], e["x"], e["m"].lower()))
    index = {
        "version": 1,
        "source": source,
        "ref": ref,
        "generated": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "count": len(entries),
        "brands": brands,
        # Compact rows: [path, category, brandKey, model, buttonCount, testButton, converted]
        "files": [[e["p"], e["c"], e["b"], e["m"], e["n"], e["w"], e["x"]] for e in entries],
    }
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, separators=(",", ":"))
    print(f"Indexed {len(entries)} remotes, {len(brands)} brands -> {out}")

if __name__ == "__main__":
    main()

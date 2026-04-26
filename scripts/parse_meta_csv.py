"""
Parse a Meta Ads CSV export and write one JSON atom per ad_id
into atoms/performance/.

Usage:
    python scripts/parse_meta_csv.py sample_data/meta_export.csv
"""

import csv
import json
import sys
from pathlib import Path

PERFORMANCE_DIR = Path(__file__).parent.parent / "atoms" / "performance"

NUMERIC_FIELDS = {"CTR", "CPC", "ROAS", "spend", "impressions"}


def parse_row(row: dict) -> dict:
    atom = {}
    for key, value in row.items():
        key = key.strip()
        value = value.strip()
        if key in NUMERIC_FIELDS:
            try:
                atom[key] = float(value)
            except ValueError:
                atom[key] = value
        else:
            atom[key] = value
    return atom


def main(csv_path: str) -> None:
    source = Path(csv_path)
    if not source.exists():
        print(f"[ERROR] Bestand niet gevonden: {csv_path}")
        sys.exit(1)

    PERFORMANCE_DIR.mkdir(parents=True, exist_ok=True)

    written = 0
    skipped = 0

    with source.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)

        if "ad_id" not in (reader.fieldnames or []):
            print("[ERROR] CSV mist kolom 'ad_id'.")
            sys.exit(1)

        for row in reader:
            ad_id = row.get("ad_id", "").strip()
            if not ad_id:
                skipped += 1
                continue

            atom = parse_row(row)
            out_path = PERFORMANCE_DIR / f"{ad_id}.json"
            out_path.write_text(json.dumps(atom, indent=2, ensure_ascii=False), encoding="utf-8")
            print(f"  [OK] {out_path.name}")
            written += 1

    print(f"\nKlaar: {written} atoms geschreven, {skipped} rijen overgeslagen.")
    print(f"Output map: {PERFORMANCE_DIR.resolve()}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Gebruik: python scripts/parse_meta_csv.py <pad/naar/meta_export.csv>")
        sys.exit(1)
    main(sys.argv[1])

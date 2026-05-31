"""
synthesize_actions.py — Fabricate plausible Meta action breakdowns for the
existing performance JSONs in sample_data/atoms/performance/.

Used for offline dev when real Meta `actions[]` data isn't available.
Values are deterministic per ad_id (md5-seeded), so re-running produces
identical output. Each enriched file is stamped `"synthetic": true` so
downstream code can warn the user.

Usage:
    py scripts/synthesize_actions.py              # enrich only files missing actions[]
    py scripts/synthesize_actions.py --refresh    # overwrite even when actions[] present
    py scripts/synthesize_actions.py --dry-run    # show what would change, write nothing
"""

import argparse
import hashlib
import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent
PERF_DIR = REPO_ROOT / "sample_data" / "atoms" / "performance"

ATC_RATE_BASE      = 0.05
ATC_RATE_JITTER    = 0.07
CHECKOUT_RATE_BASE = 0.55
CHECKOUT_JITTER    = 0.20
PURCHASE_RATE_BASE = 0.45
PURCHASE_JITTER    = 0.25
AOV_BASE_EUR       = 65.0
AOV_JITTER_EUR     = 35.0


def seeded_unit(ad_id: str, salt: str) -> float:
    """Deterministic float in [0, 1) from (ad_id, salt). Stable across runs and platforms."""
    h = hashlib.md5(f"{ad_id}|{salt}".encode("utf-8")).digest()
    return int.from_bytes(h[:4], "big") / (2 ** 32)


def synthesize(atom: dict, ctr_signal: float) -> dict:
    ad_id = atom["ad_id"]
    clicks = float(atom.get("clicks", 0) or 0)
    spend  = float(atom.get("spend",  0) or 0)

    # Higher-CTR ads get a small conversion bonus -> creates a discoverable PLN pattern.
    ctr_bonus = max(0.0, min(1.0, ctr_signal)) * 0.02

    atc_rate      = ATC_RATE_BASE      + (seeded_unit(ad_id, "atc") - 0.5) * 2 * ATC_RATE_JITTER + ctr_bonus
    checkout_rate = CHECKOUT_RATE_BASE + (seeded_unit(ad_id, "chk") - 0.5) * 2 * CHECKOUT_JITTER
    purchase_rate = PURCHASE_RATE_BASE + (seeded_unit(ad_id, "pur") - 0.5) * 2 * PURCHASE_JITTER + ctr_bonus
    aov           = AOV_BASE_EUR       + (seeded_unit(ad_id, "aov") - 0.5) * 2 * AOV_JITTER_EUR

    atc_rate      = max(0.0, min(0.30, atc_rate))
    checkout_rate = max(0.0, min(0.95, checkout_rate))
    purchase_rate = max(0.0, min(0.95, purchase_rate))
    aov           = max(15.0, aov)

    atc_count      = round(clicks * atc_rate)
    checkout_count = round(atc_count * checkout_rate)
    purchase_count = round(checkout_count * purchase_rate)
    purchase_value = round(purchase_count * aov, 2)
    roas           = round(purchase_value / spend, 4) if spend > 0 else 0.0

    return {
        "actions": [
            {"action_type": "link_click",        "value": clicks},
            {"action_type": "add_to_cart",       "value": float(atc_count)},
            {"action_type": "initiate_checkout", "value": float(checkout_count)},
            {"action_type": "purchase",          "value": float(purchase_count)},
        ],
        "action_values": [
            {"action_type": "purchase", "value": purchase_value},
        ],
        "purchase_roas": [
            {"action_type": "omni_purchase", "value": roas},
        ],
    }


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    parser = argparse.ArgumentParser(description="Fabricate plausible Meta actions[] for sample perf atoms.")
    parser.add_argument("--refresh", action="store_true", help="Overwrite actions even if already present")
    parser.add_argument("--dry-run", action="store_true", help="Show what would change, write nothing")
    args = parser.parse_args()

    if not PERF_DIR.exists():
        print(f"[ERROR] {PERF_DIR} does not exist")
        sys.exit(1)

    files = sorted(PERF_DIR.glob("*.json"))
    if not files:
        print(f"No perf atoms found in {PERF_DIR}")
        return

    ctrs = []
    for p in files:
        try:
            data = json.loads(p.read_text(encoding="utf-8"))
            v = float(data.get("ctr", 0) or 0)
            if v > 0:
                ctrs.append(v)
        except Exception:
            continue
    ctrs.sort()
    median_ctr = ctrs[len(ctrs) // 2] if ctrs else 1.0

    written = skipped = 0
    for p in files:
        try:
            atom = json.loads(p.read_text(encoding="utf-8"))
        except Exception as e:
            print(f"  ! {p.name}: skip ({e})")
            continue

        if not args.refresh and "actions" in atom:
            skipped += 1
            continue

        ctr_signal = float(atom.get("ctr", 0) or 0) / (2 * median_ctr) if median_ctr > 0 else 0.5
        synth = synthesize(atom, ctr_signal)
        atom.update(synth)
        atom["synthetic"] = True

        if not args.dry_run:
            p.write_text(json.dumps(atom, indent=2, ensure_ascii=False), encoding="utf-8")

        marker = "(dry)" if args.dry_run else "OK"
        print(
            f"  [{marker}] {atom['ad_id']}: clicks={atom.get('clicks', 0):.0f} "
            f"-> purchases={synth['actions'][3]['value']:.0f} "
            f"value=EUR {synth['action_values'][0]['value']:.2f} "
            f"roas={synth['purchase_roas'][0]['value']:.2f}"
        )
        written += 1

    print()
    print(f"Done: {written} atoms {'simulated' if args.dry_run else 'enriched'}, {skipped} already had actions[].")
    if not args.dry_run and written:
        print(f"Output: {PERF_DIR.resolve()}")


if __name__ == "__main__":
    main()

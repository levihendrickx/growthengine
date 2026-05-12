"""
build_atomspace.py — Generate an AtomSpace knowledge graph from Meta Ads data.

Reads:
  sample_data/atoms/performance/<ad_id>.json  (100 files)
  sample_data/atoms/creative/<ad_id>.json     (100 files)

Writes:
  repos/OmegaClaw-Core/atomspace/knowledge_graph.metta

Atom categories:
  1. Performance atoms — direct field mapping (no LLM)
  2. Creative atoms    — raw field storage (no LLM)
  3. Branding atoms    — GPT-4o-mini derived (1 call per ad)

Usage:
    py scripts/build_atomspace.py
    py scripts/build_atomspace.py --limit 5     # process first 5 ads only
    py scripts/build_atomspace.py --dry-run     # skip GPT calls, emit placeholders
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path

from openai import OpenAI

REPO_ROOT = Path(__file__).parent.parent
PERF_DIR = REPO_ROOT / "sample_data" / "atoms" / "performance"
CREATIVE_DIR = REPO_ROOT / "sample_data" / "atoms" / "creative"
OUTPUT_DIR = REPO_ROOT / "repos" / "OmegaClaw-Core" / "atomspace"
OUTPUT_FILE = OUTPUT_DIR / "knowledge_graph.metta"

OPENAI_API_KEY = os.environ["OPENAI_API_KEY"]

BRANDING_SYSTEM = (
    "You classify Meta ads for a knowledge graph. "
    "Given ad data (image descriptions, copy, CTAs, product URL), "
    "return a JSON object with exactly these 5 keys and their allowed values:\n"
    '  "tone": "premium" | "casual" | "playful" | "professional"\n'
    '  "season": "spring" | "summer" | "autumn" | "winter" | "evergreen"\n'
    '  "mood": "confidence" | "calm" | "energy" | "luxury" | "minimalist"\n'
    '  "product_category": "jewelry" | "fashion" | "lifestyle" | "wellness" | "accessory"\n'
    '  "visual_theme": "closeup" | "lifestyle" | "product-only" | "model" | "abstract"\n'
    "Return ONLY the JSON object, no explanation, no markdown."
)


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def esc(s: str) -> str:
    return s.replace("\\", "\\\\").replace('"', '\\"')


def performance_atoms(ad_id: str, p: dict) -> list[str]:
    atoms = [f"(ad Ad_{ad_id})"]
    for field in ("impressions", "clicks", "ctr", "cpc", "cpm", "spend", "reach", "frequency"):
        if field in p:
            atoms.append(f"({field} Ad_{ad_id} {p[field]})")
    if p.get("campaign_name"):
        atoms.append(f'(campaign Ad_{ad_id} "{esc(p["campaign_name"])}")')
    if p.get("date_start"):
        atoms.append(f'(date-start Ad_{ad_id} "{p["date_start"]}")')
    if p.get("date_stop"):
        atoms.append(f'(date-stop Ad_{ad_id} "{p["date_stop"]}")')
    return atoms


def creative_atoms(ad_id: str, c: dict) -> list[str]:
    atoms = []
    for i, img in enumerate(c.get("images") or [], start=1):
        desc = img.get("description", "")
        if desc:
            atoms.append(f'(image-description Ad_{ad_id} {i} "{esc(desc)}")')
    headlines = c.get("headlines") or []
    atoms.append(f"(n-creative-variants Ad_{ad_id} {len(headlines)})")
    if headlines:
        atoms.append(f'(headline Ad_{ad_id} "{esc(headlines[0])}")')
    bodies = c.get("bodies") or []
    if bodies:
        atoms.append(f'(body Ad_{ad_id} "{esc(bodies[0][:400])}")')
    ctas = c.get("ctas") or []
    if ctas:
        atoms.append(f"(cta Ad_{ad_id} {ctas[0]})")
    urls = c.get("link_urls") or []
    if urls:
        slug = urls[0].rstrip("/").split("/")[-1]
        atoms.append(f'(product-url Ad_{ad_id} "{esc(slug)}")')
    return atoms


def branding_atoms(client: OpenAI, ad_id: str, c: dict, dry_run: bool) -> list[str]:
    if dry_run:
        return [
            f"(tone Ad_{ad_id} premium)",
            f"(season Ad_{ad_id} evergreen)",
            f"(mood Ad_{ad_id} confidence)",
            f"(product-category Ad_{ad_id} jewelry)",
            f"(visual-theme Ad_{ad_id} closeup)",
        ]

    image_descs = [
        img.get("description", "")
        for img in (c.get("images") or [])
        if img.get("description")
    ]
    headlines = (c.get("headlines") or [])[:3]
    bodies = c.get("bodies") or []
    body_snippet = bodies[0][:400] if bodies else ""
    ctas = c.get("ctas") or []
    urls = c.get("link_urls") or []

    user_msg = "\n\n".join(filter(None, [
        "Image descriptions:\n" + "\n".join(f"- {d}" for d in image_descs) if image_descs else "Image descriptions: (none)",
        "Headlines (first 3):\n" + "\n".join(f"- {h}" for h in headlines) if headlines else "Headlines: (none)",
        f"Body snippet:\n{body_snippet}" if body_snippet else "Body: (none)",
        f"CTAs: {', '.join(ctas)}" if ctas else "CTAs: (none)",
        f"Product URLs: {', '.join(urls[:2])}" if urls else "Product URLs: (none)",
    ]))

    for attempt in range(1, 4):
        try:
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": BRANDING_SYSTEM},
                    {"role": "user", "content": user_msg},
                ],
                max_tokens=150,
                temperature=0,
            )
            data = json.loads(response.choices[0].message.content)
            atoms = []
            for json_key, metta_pred in (
                ("tone", "tone"),
                ("season", "season"),
                ("mood", "mood"),
                ("product_category", "product-category"),
                ("visual_theme", "visual-theme"),
            ):
                val = str(data.get(json_key, "")).strip().replace(" ", "-")
                if val:
                    atoms.append(f"({metta_pred} Ad_{ad_id} {val})")
            return atoms
        except Exception as e:
            if attempt < 3:
                time.sleep(2**attempt)
                continue
            print(f"  [WARN] branding failed: {e}")
            return [f"; branding-failed Ad_{ad_id}"]
    return []


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    parser = argparse.ArgumentParser(description="Build AtomSpace knowledge graph from Meta Ads data.")
    parser.add_argument("--limit", type=int, default=None, help="Process only the first N ads")
    parser.add_argument("--dry-run", action="store_true", help="Skip GPT-4o-mini calls; emit placeholder branding atoms")
    args = parser.parse_args()

    client = OpenAI(api_key=OPENAI_API_KEY)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    perf_data = {f.stem: load_json(f) for f in PERF_DIR.glob("*.json")}
    creative_data = {f.stem: load_json(f) for f in CREATIVE_DIR.glob("*.json")}

    all_ids = sorted(set(perf_data) | set(creative_data))
    if args.limit:
        all_ids = all_ids[: args.limit]

    n_perf_only = sum(1 for a in all_ids if a in perf_data and a not in creative_data)
    n_cre_only = sum(1 for a in all_ids if a in creative_data and a not in perf_data)
    n_both = sum(1 for a in all_ids if a in perf_data and a in creative_data)

    print(f"Performance atoms : {len(perf_data)}")
    print(f"Creative atoms    : {len(creative_data)}")
    print(f"Total unique ads  : {len(all_ids)}  ({n_both} with both, {n_perf_only} perf-only, {n_cre_only} creative-only)")
    print(f"Output            : {OUTPUT_FILE}")
    print(f"Mode              : {'DRY-RUN (placeholder branding)' if args.dry_run else 'LIVE (GPT-4o-mini)'}")
    print()

    lines = [
        "; AtomSpace Knowledge Graph — Meta Ads POC",
        f"; {len(all_ids)} ads | sources: performance + creative | branding via GPT-4o-mini",
        "; Generated by scripts/build_atomspace.py",
        "",
    ]

    total_atoms = 0
    for i, ad_id in enumerate(all_ids, 1):
        has_perf = ad_id in perf_data
        has_cre = ad_id in creative_data
        tag = "both" if has_perf and has_cre else ("perf" if has_perf else "creative")
        print(f"[{i:3}/{len(all_ids)}] {ad_id} [{tag}]", end=" ", flush=True)

        p_atoms = performance_atoms(ad_id, perf_data[ad_id]) if has_perf else []
        c_atoms = creative_atoms(ad_id, creative_data[ad_id]) if has_cre else []
        b_atoms = branding_atoms(client, ad_id, creative_data[ad_id], args.dry_run) if has_cre else []

        block = [f"\n; === Ad {ad_id} ({tag}) ==="]
        if p_atoms:
            block += ["; -- performance", *p_atoms]
        if c_atoms:
            block += ["; -- creative", *c_atoms]
        if b_atoms:
            block += ["; -- branding", *b_atoms]
        lines += block

        count = len(p_atoms) + len(c_atoms) + len(b_atoms)
        total_atoms += count
        print(f"→ {count} atoms")

    OUTPUT_FILE.write_text("\n".join(lines), encoding="utf-8")
    print(f"\nDone. {total_atoms} total atoms written to {OUTPUT_FILE}")
    print(f"      {n_both} ads with both layers, {n_perf_only} perf-only, {n_cre_only} creative-only")


if __name__ == "__main__":
    main()

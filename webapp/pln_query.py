"""
pln_query.py — Real OmegaClaw PLN bridge for Growth Engine.
Usage: py pln_query.py "<product>" "<context>" <perf_dir> <creative_dir> <petta_path>
Outputs JSON: {"spec": {...}} or {"error": "<message>"}
"""
import sys, json, os, math, re
from pathlib import Path
from collections import defaultdict

# ── argv ──────────────────────────────────────────────────────
if len(sys.argv) < 6:
    print(json.dumps({"error": "Usage: pln_query.py <product> <context> <perf_dir> <creative_dir> <petta_path>"}))
    sys.exit(1)

product, context = sys.argv[1], sys.argv[2]
perf_dir, creative_dir, petta_path = sys.argv[3], sys.argv[4], sys.argv[5]

# ── Bootstrap PeTTa ───────────────────────────────────────────
sys.path.insert(0, petta_path)
try:
    from python.petta import PeTTa
    petta = PeTTa()
    lib_pln = os.path.join(petta_path, "repos", "OmegaClaw-Core", "lib_pln.metta")
    if os.path.exists(lib_pln):
        petta.load_metta_file(lib_pln)
    petta_ok = True
except Exception as e:
    petta_ok = False
    petta_err = str(e)

# ── Helpers ───────────────────────────────────────────────────
STOPWORDS = {
    "de","het","een","van","voor","met","jouw","zijn","niet","maar","die","dat",
    "als","ook","door","naar","bij","aan","meer","deze","dit","op","in","is","te",
    "zo","en","of","om","uit","tot","kan","dus","dan","wel","per","nog","al",
    "this","that","with","from","your","have","will","voor","zijn","worden","heeft",
    "wordt","naar","zijn","deze","door","voor","over","zijn","maar","zijn",
}

def load_json_dir(path):
    out = {}
    p = Path(path)
    if not p.exists():
        return out
    for f in p.glob("*.json"):
        try:
            data = json.loads(f.read_text(encoding="utf-8"))
            ad_id = str(data.get("ad_id") or f.stem)
            out[ad_id] = data
        except Exception:
            pass
    return out

def sanitize(s):
    """Make a string safe as a MeTTa atom identifier."""
    s = re.sub(r"[^a-z0-9]", "-", str(s).lower())
    s = re.sub(r"-+", "-", s).strip("-")
    return s[:40] or "unknown"

def safe_median(vals):
    s = sorted(v for v in vals if v and v > 0)
    return s[len(s) // 2] if s else 1.0

def etld1(url):
    try:
        m = re.search(r"https?://([^/]+)", url or "")
        if m:
            parts = m.group(1).split(".")
            return ".".join(parts[-2:]) if len(parts) >= 2 else parts[0]
    except Exception:
        pass
    return "unknown"

def extract_kws(texts, top_n=15, idf=None):
    tf = defaultdict(int)
    for t in texts:
        for tok in re.findall(r"[a-z]{4,}", t.lower()):
            if tok not in STOPWORDS:
                tf[tok] += 1
    scored = {k: v * (idf.get(k, 1.0) if idf else 1.0) for k, v in tf.items()}
    return sorted(scored, key=scored.get, reverse=True)[:top_n]

def action_val(perf, action_type):
    for a in (perf.get("actions") or []):
        if a.get("action_type") == action_type:
            try:
                return float(a.get("value", 0) or 0)
            except Exception:
                pass
    return 0.0

VISUAL_STYLE_KEYWORDS = {
    "ugc":       {"ugc", "user", "authentic", "real", "unboxing", "review", "testimonial"},
    "lifestyle": {"lifestyle", "outdoor", "beach", "summer", "winter", "park", "person",
                  "wearing", "everyday", "model", "people", "woman", "man"},
    "product":   {"product", "closeup", "studio", "packshot", "background",
                  "isolated", "detail", "bottle", "box", "package"},
    "abstract":  {"abstract", "graphic", "pattern", "texture", "illustration",
                  "design", "color", "gradient", "digital"},
}

def extract_prices(texts):
    prices = []
    for t in texts:
        for m in re.finditer(r"[€$£]\s*(\d+(?:[.,]\d+)?)|(\d+(?:[.,]\d+)?)\s*[€$£]", t):
            v = m.group(1) or m.group(2)
            try:
                prices.append(float(v.replace(",", ".")))
            except Exception:
                pass
    return prices

def classify_visual_style(texts):
    all_words = set()
    for t in texts:
        all_words |= set(re.findall(r"[a-z]+", t.lower()))
    scores = {style: len(all_words & kws) for style, kws in VISUAL_STYLE_KEYWORDS.items()}
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else None

# ── Load atoms ────────────────────────────────────────────────
perf_by_id     = load_json_dir(perf_dir)
creative_by_id = load_json_dir(creative_dir)
all_ids        = set(perf_by_id) | set(creative_by_id)

if not all_ids:
    print(json.dumps({"error": "No atom files found in perf_dir or creative_dir"}))
    sys.exit(1)

# Corpus IDF for keyword TF-IDF
doc_freq = defaultdict(int)
for c in creative_by_id.values():
    texts = (c.get("headlines") or []) + (c.get("bodies") or [])
    for img in (c.get("images") or []):
        if img.get("description"):
            texts.append(img["description"])
    seen = set()
    for t in texts:
        for tok in re.findall(r"[a-z]{4,}", t.lower()):
            if tok not in STOPWORDS and tok not in seen:
                doc_freq[tok] += 1
                seen.add(tok)
N_docs = max(len(creative_by_id), 1)
corpus_idf = {k: math.log(N_docs / max(v, 1)) for k, v in doc_freq.items()}

# Corpus medians for normalisation
corpus_ctr = safe_median(p.get("ctr", 0) for p in perf_by_id.values())
corpus_cpc = safe_median(p.get("cpc", 1) for p in perf_by_id.values())
corpus_eff = safe_median(
    (p.get("clicks", 0) or 0) / max(p.get("spend", 1) or 1, 0.01)
    for p in perf_by_id.values()
)
_conv_vals, _roas_vals = [], []
for _p in perf_by_id.values():
    _purch = action_val(_p, "purchase")
    _clk   = float(_p.get("clicks", 0) or 0)
    if _purch > 0 and _clk > 0:
        _conv_vals.append(_purch / _clk)
    _rl = _p.get("purchase_roas") or []
    if _rl:
        _r = float((_rl[0] or {}).get("value", 0) or 0)
        if _r > 0:
            _roas_vals.append(_r)
corpus_conv = safe_median(_conv_vals) if _conv_vals else 0.01
corpus_roas = safe_median(_roas_vals) if _roas_vals else 2.0

# Corpus price tier thresholds (tertiles across all creatives that mention prices)
_price_vals = []
for _c in creative_by_id.values():
    _txts = (_c.get("headlines") or []) + (_c.get("bodies") or [])
    _ps = extract_prices(_txts)
    if _ps:
        _price_vals.append(sum(_ps) / len(_ps))
_price_vals.sort()
if len(_price_vals) >= 3:
    corpus_price_low  = _price_vals[len(_price_vals) // 3]
    corpus_price_high = _price_vals[2 * len(_price_vals) // 3]
else:
    corpus_price_low, corpus_price_high = 30.0, 80.0

# ── Per-ad atom synthesis ─────────────────────────────────────
# Each entry: (family, value_or_None, strength_or_None, conf_or_None, imp, ctr, cpc, spend, clicks)
OUTCOMES = {
    "ctr-high", "cpc-low", "roas-proxy",
    "purchase-rate-high", "roas-actual-high", "funnel-dropoff",
}
AdAtoms = {}

for ad_id in all_ids:
    p = perf_by_id.get(ad_id)
    c = creative_by_id.get(ad_id)
    atoms = []

    if p:
        imp   = float(p.get("impressions", 0) or 0)
        ctr   = float(p.get("ctr",   0) or 0)
        cpc   = float(p.get("cpc",   1) or 1)
        spd   = float(p.get("spend", 1) or 1)
        clk   = float(p.get("clicks",0) or 0)
        conf  = imp / (imp + 10000)
        s_ctr  = min(1.0, ctr / (2 * corpus_ctr))
        s_cpc  = max(0.0, 1.0 - cpc / (2 * corpus_cpc))
        s_roas = min(1.0, (clk / max(spd, 0.01)) / (2 * corpus_eff))

        atoms += [
            ("ctr-high",   None, s_ctr,  conf, imp, ctr, cpc, spd, clk),
            ("cpc-low",    None, s_cpc,  conf, imp, ctr, cpc, spd, clk),
            ("roas-proxy", None, s_roas, conf, imp, ctr, cpc, spd, clk),
        ]

        # ── Phase A.3: purchase-rate-high, roas-actual-high, funnel-dropoff ──
        _purch = action_val(p, "purchase")
        _atc   = action_val(p, "add_to_cart")
        _roas_l = p.get("purchase_roas") or []

        if _purch > 0 and clk > 0:
            s_pr = min(1.0, (_purch / clk) / (2 * corpus_conv))
            c_pr = _purch / (_purch + 20)
            atoms.append(("purchase-rate-high", None, s_pr, c_pr, imp, ctr, cpc, spd, clk))

        if _roas_l:
            _roas_act = float((_roas_l[0] or {}).get("value", 0) or 0)
            if _roas_act > 0:
                s_ra = min(1.0, _roas_act / (2 * corpus_roas))
                atoms.append(("roas-actual-high", None, s_ra, conf, imp, ctr, cpc, spd, clk))
        else:
            atoms.append(("roas-actual-high", None, s_roas, conf, imp, ctr, cpc, spd, clk))

        if _atc > 0:
            s_fd = max(0.0, min(1.0, 1.0 - _purch / _atc))
            c_fd = min(1.0, _atc / (_atc + 20))
            atoms.append(("funnel-dropoff", None, s_fd, c_fd, imp, ctr, cpc, spd, clk))

        if p.get("campaign_id"):
            cid = sanitize(p["campaign_id"])
            atoms.append(("campaign", cid, None, None, imp, ctr, cpc, spd, clk))
        if p.get("adset_id"):
            aid2 = sanitize(p["adset_id"])
            atoms.append(("adset", aid2, None, None, imp, ctr, cpc, spd, clk))

        # ── Phase B: season, audience-cohort ──
        _date_s = str(p.get("date_start") or "")
        _dm = re.match(r"\d{4}-(\d{2})", _date_s)
        if _dm:
            _season = f"q{(int(_dm.group(1)) - 1) // 3 + 1}"
            atoms.append(("season", _season, None, None, imp, ctr, cpc, spd, clk))
        if p.get("adset_id"):
            atoms.append(("audience-cohort", sanitize(p["adset_id"]), None, None, imp, ctr, cpc, spd, clk))
    else:
        imp = ctr = clk = 0.0
        cpc = spd = 1.0

    if c:
        imp2  = float((perf_by_id.get(ad_id) or {}).get("impressions", 0) or 0)
        ctr2  = float((perf_by_id.get(ad_id) or {}).get("ctr",   0) or 0)
        cpc2  = float((perf_by_id.get(ad_id) or {}).get("cpc",   1) or 1)
        spd2  = float((perf_by_id.get(ad_id) or {}).get("spend", 1) or 1)
        clk2  = float((perf_by_id.get(ad_id) or {}).get("clicks",0) or 0)

        for cta in (c.get("ctas") or []):
            atoms.append(("cta", sanitize(cta), None, None, imp2, ctr2, cpc2, spd2, clk2))
        if c.get("object_type"):
            atoms.append(("object-type", sanitize(c["object_type"]), None, None, imp2, ctr2, cpc2, spd2, clk2))
        for url in (c.get("link_urls") or []):
            atoms.append(("link-domain", sanitize(etld1(url)), None, None, imp2, ctr2, cpc2, spd2, clk2))

        texts = (c.get("headlines") or []) + (c.get("bodies") or [])
        for img in (c.get("images") or []):
            if img.get("description"):
                texts.append(img["description"])
        for kw in extract_kws(texts, top_n=15, idf=corpus_idf):
            atoms.append(("kw", kw, None, None, imp2, ctr2, cpc2, spd2, clk2))

        # ── Phase B: price-tier, visual-style ──
        _price_texts = (c.get("headlines") or []) + (c.get("bodies") or []) + (c.get("descriptions") or [])
        _prices = extract_prices(_price_texts)
        if _prices:
            _avg_p = sum(_prices) / len(_prices)
            _tier  = "low" if _avg_p < corpus_price_low else ("high" if _avg_p >= corpus_price_high else "mid")
            atoms.append(("price-tier", _tier, None, None, imp2, ctr2, cpc2, spd2, clk2))

        _img_descs = [img.get("description", "") for img in (c.get("images") or []) if img.get("description")]
        _vstyle_texts = (c.get("headlines") or []) + (c.get("bodies") or []) + _img_descs
        _vstyle = classify_visual_style(_vstyle_texts)
        if _vstyle:
            atoms.append(("visual-style", _vstyle, None, None, imp2, ctr2, cpc2, spd2, clk2))

    AdAtoms[ad_id] = atoms

# ── Outcome stv per ad ────────────────────────────────────────
OutcomeStv = {}
for ad_id, atoms in AdAtoms.items():
    for item in atoms:
        if item[0] in OUTCOMES:
            OutcomeStv.setdefault(ad_id, {})[item[0]] = (item[2], item[3])

# ── Categorical predicates per ad ─────────────────────────────
CatAtoms = {}
for ad_id, atoms in AdAtoms.items():
    cats = defaultdict(list)
    for item in atoms:
        if item[0] not in OUTCOMES and item[1] is not None:
            cats[(item[0], item[1])].append(item[4:])
    CatAtoms[ad_id] = cats

# ── Derive co-occurrence implications ─────────────────────────
Implications = {}
for pred_key in set(k for d in CatAtoms.values() for k in d):
    pred_fam, pred_val = pred_key
    for outcome in OUTCOMES:
        qualifying = [
            (ad_id, OutcomeStv[ad_id][outcome])
            for ad_id, cats in CatAtoms.items()
            if pred_key in cats and ad_id in OutcomeStv and outcome in OutcomeStv[ad_id]
        ]
        if len(qualifying) < 2:
            continue
        strength  = sum(s for _, (s, _) in qualifying) / len(qualifying)
        total_imp = sum((perf_by_id.get(ad_id) or {}).get("impressions", 0) or 0
                        for ad_id, _ in qualifying)
        conf      = total_imp / (total_imp + 10000)
        n         = len(qualifying)
        avg_cpc   = sum((perf_by_id.get(ad_id) or {}).get("cpc", 1) or 1
                        for ad_id, _ in qualifying) / n
        avg_clk   = sum((perf_by_id.get(ad_id) or {}).get("clicks", 0) or 0
                        for ad_id, _ in qualifying)
        avg_spd   = sum((perf_by_id.get(ad_id) or {}).get("spend", 1) or 1
                        for ad_id, _ in qualifying)
        avg_roas  = (avg_clk / max(avg_spd, 0.01)) / max(corpus_eff, 0.001)
        Implications[(pred_fam, pred_val, outcome)] = {
            "s": strength, "c": conf, "n": n,
            "avg_cpc": avg_cpc, "avg_roas": avg_roas,
            "ad_ids": [ad_id for ad_id, _ in qualifying],
        }

TopImpls = sorted(Implications.items(), key=lambda x: x[1]["s"] * x[1]["c"], reverse=True)[:50]

# ── Filter matched_ads by product/context tokens ─────────────
query_tokens = set()
for text in [product, context]:
    for tok in re.findall(r"[a-z]{4,}", text.lower()):
        if tok not in STOPWORDS:
            query_tokens.add(tok)

matched = []
for ad_id in all_ids:
    kws  = {item[1] for item in AdAtoms.get(ad_id, []) if item[0] == "kw" and item[1]}
    imp  = float((perf_by_id.get(ad_id) or {}).get("impressions", 0) or 0)
    if query_tokens and kws:
        union = query_tokens | kws
        score = len(query_tokens & kws) / len(union) if union else 0.0
    else:
        score = 0.0
    matched.append((ad_id, score, imp))

matched.sort(key=lambda x: (x[1], x[2]), reverse=True)
if query_tokens and not any(s > 0 for _, s, _ in matched):
    matched.sort(key=lambda x: x[2], reverse=True)  # fallback: by impressions

matched_ids = [ad_id for ad_id, _, _ in matched[:20]]

# ── Phase C: LearnedPattern derivation ───────────────────────
stv_re = re.compile(r"\(stv\s+([\d.eE+\-]+)\s+([\d.eE+\-]+)\)")

def mp_python(s_p, c_p, s_pq, c_pq):
    f_out = s_p * s_pq + 0.02 * (1.0 - s_p)
    c_out = s_p * s_pq * c_p * c_pq
    return f_out, c_out

def pattern_name(pred_fam, pred_val, outcome):
    parts = [sanitize(pred_fam)]
    if pred_val:
        parts.append(sanitize(str(pred_val)))
    parts.append(sanitize(outcome))
    return "--".join(parts)

# Corpus-level median strength per outcome (for counter-evidence threshold)
outcome_all_s = defaultdict(list)
for _ad, _outcomes in OutcomeStv.items():
    for _out, (_s, _c) in _outcomes.items():
        outcome_all_s[_out].append(_s)
outcome_median_s = {out: safe_median(vals) for out, vals in outcome_all_s.items()}

patterns_out = []
for (pred_fam, pred_val, outcome), info in TopImpls:
    s_impl, c_impl = info["s"], info["c"]
    if s_impl <= 0:
        continue

    all_qualifying_ids = info["ad_ids"]
    n = len(all_qualifying_ids)
    if n < 2:
        continue

    ev_strengths = [
        OutcomeStv[aid][outcome][0]
        for aid in all_qualifying_ids
        if aid in OutcomeStv and outcome in OutcomeStv[aid]
    ]
    if len(ev_strengths) < 2:
        continue

    # Counter-evidence: qualifying ads where outcome strength is clearly absent
    low_threshold = max(0.25, outcome_median_s.get(outcome, 0.5) * 0.5)
    counter_ids = [
        aid for aid in all_qualifying_ids
        if OutcomeStv.get(aid, {}).get(outcome, (0, 0))[0] < low_threshold
    ]
    counter_n = len(counter_ids)
    if counter_n >= n:
        continue  # too noisy

    # Substantiated confidence components
    spends = [(perf_by_id.get(aid) or {}).get("spend", 0) or 0 for aid in all_qualifying_ids]
    imps   = [(perf_by_id.get(aid) or {}).get("impressions", 0) or 0 for aid in all_qualifying_ids]
    total_spend = sum(spends)
    total_imp   = sum(imps)
    mean_s      = sum(ev_strengths) / len(ev_strengths)
    variance_s  = sum((x - mean_s) ** 2 for x in ev_strengths) / len(ev_strengths)
    stdev_s     = variance_s ** 0.5

    c_sample      = n / (n + 10)
    c_spend       = min(1.0, total_spend / 5000)
    c_consistency = max(0.0, 1.0 - stdev_s / max(mean_s, 0.001))
    c_counter     = 1.0 - counter_n / (n + counter_n + 1)
    conf_subst    = c_sample * c_spend * c_consistency * c_counter

    if total_imp > 0:
        f_weighted = sum(sv * iv for sv, iv in zip(ev_strengths, imps)) / total_imp
    else:
        f_weighted = mean_s

    # PLN Modus Ponens (PeTTa or Python fallback)
    pred_atom = f"{pred_fam}-{pred_val}" if pred_val else pred_fam
    f_val = c_val_pln = None
    if petta_ok:
        metta_q = (
            f"(|~ ({pred_atom} (stv 1.0 1.0)) "
            f"((Implication {pred_atom} {outcome}) (stv {s_impl:.4f} {c_impl:.4f})))"
        ).replace("'", "\\'")
        try:
            raw = petta.process_metta_string(metta_q)
            if raw:
                first = str(raw[0]) if isinstance(raw, list) else str(raw)
                m_stv = stv_re.search(first)
                if m_stv:
                    f_val = float(m_stv.group(1))
                    c_val_pln = float(m_stv.group(2))
        except Exception:
            pass
    if f_val is None:
        f_val, c_val_pln = mp_python(1.0, 1.0, s_impl, c_impl)

    score = f_val * conf_subst

    # Evidence ads: top 6 by outcome strength
    ev_sorted = sorted(
        all_qualifying_ids,
        key=lambda aid: OutcomeStv.get(aid, {}).get(outcome, (0, 0))[0],
        reverse=True,
    )[:6]
    evidence_ads = []
    for aid in ev_sorted:
        cdata  = creative_by_id.get(aid) or {}
        imgs   = [img["ref"] for img in (cdata.get("images") or []) if img.get("ref")]
        perf_d = perf_by_id.get(aid) or {}
        roas_l = perf_d.get("purchase_roas") or []
        if roas_l:
            roas_v = float((roas_l[0] or {}).get("value", 0) or 0)
        else:
            roas_v = round(
                (perf_d.get("clicks", 0) or 0) / max(perf_d.get("spend", 1) or 1, 0.01)
                / max(corpus_eff, 0.001), 2,
            )
        raw_cdata   = creative_by_id.get(aid)
        headline    = ((raw_cdata.get("headlines") or [""])[0]) if raw_cdata else None
        evidence_ads.append({
            "ad_id":       aid,
            "image_ref":   imgs[0] if imgs else None,
            "roas":        round(roas_v, 2),
            "headline":    headline,
            "in_creative": raw_cdata is not None,
        })

    counter_ads_out = []
    for aid in counter_ids[:3]:
        cdata  = creative_by_id.get(aid) or {}
        imgs   = [img["ref"] for img in (cdata.get("images") or []) if img.get("ref")]
        perf_d = perf_by_id.get(aid) or {}
        roas_l = perf_d.get("purchase_roas") or []
        if roas_l:
            roas_v = float((roas_l[0] or {}).get("value", 0) or 0)
        else:
            roas_v = round(
                (perf_d.get("clicks", 0) or 0) / max(perf_d.get("spend", 1) or 1, 0.01)
                / max(corpus_eff, 0.001), 2,
            )
        counter_ads_out.append({
            "ad_id": aid, "image_ref": imgs[0] if imgs else None, "roas": round(roas_v, 2),
        })

    name = pattern_name(pred_fam, pred_val, outcome)
    patterns_out.append({
        "name":           name,
        "conditions":     [f"{pred_fam}={pred_val}" if pred_val else pred_fam],
        "outcome":        outcome,
        "strength":       round(f_val, 4),
        "confidence":     round(conf_subst, 4),
        "score":          round(score, 4),
        "substantiation": {
            "n":             n,
            "spend":         round(total_spend, 2),
            "variance":      round(variance_s, 4),
            "counter_n":     counter_n,
            "c_sample":      round(c_sample, 3),
            "c_spend":       round(c_spend, 3),
            "c_consistency": round(c_consistency, 3),
            "c_counter":     round(c_counter, 3),
        },
        "evidence_ads":   evidence_ads,
        "counter_ads":    counter_ads_out,
        # Legacy fields kept for backward compat with server.js / app.js
        "formula":   f"{pred_fam}={pred_val} → {outcome}",
        "pred_fam":  pred_fam,
        "pred_val":  pred_val,
        "pred_atom": f"{pred_fam}-{pred_val}" if pred_val else pred_fam,
        "n":         n,
        "avg_cpc":   info["avg_cpc"],
        "roas":      round(info["avg_roas"] * 3.5, 2),
        "ad_ids":    all_qualifying_ids[:8],
    })

patterns_out.sort(key=lambda x: x["score"], reverse=True)
top_patterns = patterns_out[:15]

# ── Emit LearnedPattern atoms to PeTTa atomspace (best-effort) ─
if petta_ok:
    for _p in top_patterns:
        _ev_list = " ".join(f"ad-{aid}" for aid in (_p.get("ad_ids") or [])[:6]) or "none"
        _cn_list = " ".join(f"ad-{c['ad_id']}" for c in (_p.get("counter_ads") or [])[:3]) or "none"
        _sub = _p["substantiation"]
        try:
            _mq = (
                f'!(add-atom &self (LearnedPattern {_p["name"]} '
                f'(Implication {_p["pred_atom"]} {_p["outcome"]}) '
                f'(stv {_p["strength"]:.4f} {_p["confidence"]:.4f}) '
                f'(Evidence (List {_ev_list})) '
                f'(Counter (List {_cn_list})) '
                f'(Stats (List (n {_sub["n"]}) (spend {_sub["spend"]:.1f}) '
                f'(variance {_sub["variance"]:.4f})))))'
            ).replace("'", "\\'")
            petta.process_metta_string(_mq)
        except Exception:
            pass

# ── Strategy derivation (L4 → L5 bridge) ─────────────────────
top5 = top_patterns[:5]
justification_names = [p["name"] for p in top5]

ev_ad_ids_ordered = []
seen_ev = set()
for p in top5:
    for ev in (p.get("evidence_ads") or []):
        aid = ev.get("ad_id")
        if aid and aid not in seen_ev:
            ev_ad_ids_ordered.append(aid)
            seen_ev.add(aid)

hook_counter = defaultdict(int)
for aid in ev_ad_ids_ordered[:10]:
    cdata = creative_by_id.get(aid) or {}
    for cta in (cdata.get("ctas") or []):
        hook_counter[sanitize(cta)] += 1
hook_strat = max(hook_counter, key=hook_counter.get) if hook_counter else "shop-now"

vs_counter = defaultdict(int)
kw_counter  = defaultdict(int)
for aid in ev_ad_ids_ordered[:10]:
    for atom in AdAtoms.get(aid, []):
        if atom[0] == "visual-style" and atom[1]:
            vs_counter[atom[1]] += 1
        if atom[0] == "kw" and atom[1]:
            kw_counter[atom[1]] += 1
top_vs  = max(vs_counter, key=vs_counter.get) if vs_counter else "product"
top_kws = sorted(kw_counter, key=kw_counter.get, reverse=True)[:3]
visual  = ", ".join([top_vs] + top_kws)

TONE_WORDS = {
    "calm", "warm", "urgent", "premium", "casual", "luxury",
    "playful", "minimal", "bold", "clean", "modern", "elegant",
}
tone_hits = [kw for kw in top_kws if kw in TONE_WORDS]
tone_strat = ", ".join(tone_hits[:2]) if tone_hits else (top_kws[0] if top_kws else "premium")

avoid_counter = defaultdict(int)
for p in top5:
    for cad in (p.get("counter_ads") or []):
        aid = cad.get("ad_id")
        if not aid:
            continue
        for atom in AdAtoms.get(aid, []):
            if atom[0] in ("cta", "visual-style", "kw") and atom[1]:
                avoid_counter[f"{atom[0]}:{atom[1]}"] += 1
avoid = [
    k.split(":", 1)[1]
    for k, v in sorted(avoid_counter.items(), key=lambda x: -x[1])[:2]
    if v > 0
]

strategy = {
    "hook":                   hook_strat,
    "visual":                 visual,
    "cta":                    hook_strat.replace("-", "_").upper(),
    "tone":                   tone_strat,
    "avoid":                  avoid,
    "justification_patterns": justification_names,
}

# ── matched_ads ───────────────────────────────────────────────
matched_ads_out = []
for ad_id, score, _ in matched[:10]:
    cdata = creative_by_id.get(ad_id) or {}
    imgs  = [img["ref"] for img in (cdata.get("images") or []) if img.get("ref")]
    matched_ads_out.append({
        "ad_id":      ad_id,
        "score":      round(score, 3),
        "image_refs": imgs,
    })

# ── Creative examples: top creative atoms by query relevance ──
# Score ALL creative atoms (including those without a performance counterpart)
# using the same Jaccard method as matched_ads so the client can verify any
# generated ad against the 100 real creative records in the dataset.
creative_examples_out = []
creative_scored = []
for aid in creative_by_id:
    kws = {item[1] for item in AdAtoms.get(aid, []) if item[0] == "kw" and item[1]}
    if query_tokens and kws:
        union = query_tokens | kws
        score = len(query_tokens & kws) / len(union) if union else 0.0
    else:
        score = 0.0
    creative_scored.append((aid, score))

creative_scored.sort(key=lambda x: x[1], reverse=True)
# Fallback: if nothing matches the query, rank by number of keywords (richest creatives first)
if not any(s > 0 for _, s in creative_scored):
    creative_scored = sorted(
        [(aid, 0) for aid in creative_by_id],
        key=lambda x: len([i for i in AdAtoms.get(x[0], []) if i[0] == "kw"]),
        reverse=True,
    )

for aid, score in creative_scored[:5]:
    cdata    = creative_by_id.get(aid) or {}
    headline = (cdata.get("headlines") or [""])[0]
    creative_examples_out.append({
        "ad_id":    aid,
        "headline": headline,
        "score":    round(score, 3),
    })

# ── Legacy fields for backward compat ────────────────────────
def top_val_by_fam(*fams):
    for fam in fams:
        for p in top_patterns:
            if p.get("pred_fam") == fam and p.get("pred_val"):
                return p["pred_val"]
    return None

elements = []
for p in top5:
    tag = p["pred_atom"]
    if tag not in elements:
        elements.append(tag)
elements = elements[:6]

style    = top_val_by_fam("object-type", "kw")   or "product-visual"
hook_leg = top_val_by_fam("cta", "kw")           or "SHOP_NOW"
tone_leg = top_val_by_fam("kw", "campaign")      or "premium"

m_cpc_vals = [(perf_by_id[aid].get("cpc") or 1) for aid in matched_ids if aid in perf_by_id]
exp_cpc    = round(sum(m_cpc_vals) / max(len(m_cpc_vals), 1), 2)
exp_roas   = round(sum(p.get("roas", 0) for p in top5) / max(len(top5), 1), 2)
min_conf   = round(min((p["confidence"] for p in top5), default=0.1), 3)

reasoning = "; ".join(
    f"({p['pred_fam']}-{p['pred_val']} → {p['outcome']}) "
    f"(stv {p['strength']:.3f} {p['confidence']:.3f}) [n={p['n']}]"
    for p in top5[:5]
)

spec = {
    "request":           {"product": product, "context": context},
    "patterns":          top_patterns,
    "strategy":          strategy,
    "matched_ads":       matched_ads_out,
    "creative_examples": creative_examples_out,
    # Legacy
    "elements":          elements,
    "style":         style,
    "hook":          hook_leg,
    "tone":          tone_leg,
    "expected_roas": exp_roas,
    "expected_cpc":  exp_cpc,
    "confidence":    min_conf,
    "reasoning":     reasoning,
    "top_patterns":  top_patterns,
}

print(json.dumps({"spec": spec}))
sys.exit(0)

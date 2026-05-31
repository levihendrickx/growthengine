# Plan — Real OmegaClaw PLN + Ad-text-in-image + Image-to-image variation loop

> **First implementation action (after approval):** copy this plan's content to `D:\mubashir\growthengine\plan.md` so the team can work from a repo-tracked document. This file stays in `~/.claude/plans/` as the harness reference.

---

## Context

Three problems in the current pipeline ([webapp/server.js](webapp/server.js), [webapp/app.js](webapp/app.js), [webapp/gen_image.py](webapp/gen_image.py)) need to be fixed together because their solutions interact:

1. **Fake PLN.** `/api/pln-spec` ([server.js:128-219](webapp/server.js#L128-L219)) is a single `gpt-4o-mini` call that role-plays "Probabilistic Logic Networks reasoning". The webapp never spawns swipl/PeTTa. `repos/OmegaClaw-Core/lib_pln.metta` (the real inference engine) is unreachable. The only OmegaClaw artifact used is `knowledge_graph.metta`, parsed as flat text via a JS regex that drops every atom larger than a 3-tuple.

2. **Plain image only, no text.** `/api/generate-image` ([server.js:222-249](webapp/server.js#L222-L249)) calls `gpt-image-1` with the bare `image_prompt` string. The output is a product photo with no headline, sub-headline, CTA button, or caption. Client expects designer-level ads like the reference shown (e.g. "CHOOSE ANY 3. SAVE €20 / BUILD YOUR BUNDLE" composited over a hand-with-bracelet photo).

3. **No winner → variation loop.** Today every image is generated from scratch with text-to-image. The client wants Approach 2: take an existing winning ad (PLN-ranked from historical performance) and ask gpt-image-1 to produce a variation — same composition, swapped text or setting. This closes the "make ads → measure → iterate" loop that is the actual reason the system exists.

User-confirmed decisions in this planning session:
- **Real PLN** invoked via per-request `py.exe` subprocess (mirrors [webapp/gen_image.py](webapp/gen_image.py) pattern).
- **Spec returns raw atom names** (no LLM narrative `reasoning`).
- **Atomspace = outer join** of all 100 [sample_data/atoms/performance/*.json](sample_data/atoms/performance/) and all 100 [sample_data/atoms/creative/*.json](sample_data/atoms/creative/). Ads with only perf data contribute numeric atoms; ads with only creative data contribute categorical/text atoms; the 5 fully-joined ads carry cross-predicate co-occurrence.
- **Truth values**: `strength = co-occurrence rate`, `confidence = total_impressions / (total_impressions + 10000)`.
- **Text on images**: AI-rendered in one shot by gpt-image-1 — the prompt instructs the model to render headline / sub-headline / CTA button / caption directly into the image. Verification loop (Phase 6) catches typos and regenerates.
- **Variation source for Approach 2**: PLN-ranked gallery picker (default) + optional drag-drop upload (power-user). Seeds come from [sample_data/images/<ad_id>_<i>.jpg](sample_data/images/).
- **Delete** `repos/OmegaClaw-Core/atomspace/knowledge_graph.metta` — no consumer remains after this change.

---

## Open questions for the client (flag before/during implementation)

| # | Question | Why it matters | Sensible default if no answer |
|---|---|---|---|
| Q1 | Are AI-rendered text typos acceptable (~10-15% of ads will have a misspelled word and need regeneration) or do we need 100% accurate text? | Determines whether we keep the AI-only text approach or fall back to programmatic compositing for the CTA button. | Keep AI-only + verification loop. |
| Q2 | Is there a brand asset bundle (logo PNG, brand fonts, hex palette)? The reference image has an "SB" mark on each bracelet — should the model attempt that mark, or should we composite the real logo afterwards? | If real logo placement is required we need node-canvas overlay. Otherwise we describe it in the prompt. | Describe in prompt; revisit if quality fails. |
| Q3 | For Approach 2, when no winner is selected by the user, should we auto-pick the top-1 by `roas-proxy * confidence`, or skip variation and fall back to Approach 1 (pure text-to-image)? | Affects pipeline default behaviour. | Auto-pick top-1. |
| Q4 | What's the acceptable per-ad cost cap? gpt-image-1 image generation is ~$0.04-0.17/image depending on quality; with image edits + retry loop, 5 ads could cost $1-3. | Determines whether `quality="medium"` (current setting) stays or moves to `"low"`/`"high"`. | Keep `medium`. |
| Q5 | Should the variation loop iterate beyond one round (winner → variant → if variant outperforms, becomes new winner)? Or is one-shot variation enough for the POC? | Affects whether we need state tracking of generated ads vs ingested ads. | One-shot for POC; multi-round is a future PR. |

---

## Implementation order (4 phases, 5-6 working days estimated)

Each phase is independently testable and committable. Phase 1 → 2 → 3 are sequential (each builds on the prior). Phase 4 (frontend gallery + upload) can be parallelized with Phase 3 once the backend endpoints exist.

### Phase 1 — Real OmegaClaw PLN (Day 1-2)

#### 1.1 New file: `webapp/pln_query.py`

Mirrors [webapp/gen_image.py](webapp/gen_image.py)'s shell contract: argv-in, JSON-on-stdout, non-zero exit on error.

**Invocation:**
```
py.exe pln_query.py "<product>" "<context>" <perf_dir> <creative_dir> <petta_path>
```

**Success output (stdout):**
```json
{
  "spec": {
    "elements":      ["cta-SHOP_NOW", "object_type-SHARE", "campaign-Andromeda", "kw-calm", "kw-strength"],
    "style":         "object_type-SHARE",
    "hook":          "cta-SHOP_NOW",
    "tone":          "kw-calm",
    "expected_roas": 4.2,
    "expected_cpc":  0.71,
    "confidence":    0.74,
    "reasoning":     "(Implication (cta SHOP_NOW) (ctr-high)) (stv 0.83 0.71) [n=15]; (Implication (kw-calm) (cpc-low)) (stv 0.78 0.64) [n=12]",
    "top_patterns": [
      { "formula": "cta=SHOP_NOW → ctr-high", "roas": 4.2, "confidence": 0.71, "n": 15 },
      { "formula": "kw=calm → cpc-low",        "roas": 3.8, "confidence": 0.64, "n": 12 }
    ],
    "matched_ads": [
      { "ad_id": "120235...", "score": 0.62, "image_refs": ["images/120235..._1.jpg"] },
      { "ad_id": "120236...", "score": 0.58, "image_refs": ["images/120236..._1.jpg"] }
    ]
  }
}
```

Note: `matched_ads` is now an **array of objects** (not bare strings) so the frontend Approach-2 gallery can render thumbnails directly from `image_refs`.

**Error output:** `{"error": "<message>"}` and `sys.exit(1)`.

**Internal flow:**

1. **Bootstrap PeTTa** — `sys.path.insert(0, petta_path)`; `from python.petta import PeTTa` (see [python/petta.py](python/petta.py)); `petta = PeTTa()`; `petta.load_metta_file(<petta_path>/repos/OmegaClaw-Core/lib_pln.metta)`. No `knowledge_graph.metta` load — the file is deleted in step 1.5.

2. **Outer-join atom data** —
   - Read every `perf_dir/*.json` into `perf_by_id`.
   - Read every `creative_dir/*.json` into `creative_by_id`.
   - `all_ids = set(perf_by_id) | set(creative_by_id)`.
   - For each ad_id: emit whatever atoms are derivable from the available data. Ads with only perf get numeric atoms; ads with only creative get categorical+text atoms; the overlapping ones get both.

3. **Synthesize base atoms from the joined data** (all predicates derived only from real Meta API fields):

   *Numeric outcome atoms (perf-only ads contribute these):*
   - `(ctr-high     Ad_X (stv s c))` — `s = min(1, ctr / (2 * corpus_median_ctr))`, `c = imp / (imp + 10000)`.
   - `(cpc-low      Ad_X (stv s c))` — `s = max(0, 1 - cpc / (2 * corpus_median_cpc))`, `c = imp / (imp + 10000)`.
   - `(roas-proxy   Ad_X (stv s c))` — `s = min(1, (clicks/spend) / (2 * corpus_median_eff))`, `c = imp / (imp + 10000)`.

   *Categorical atoms (creative-only ads contribute these):*
   - `(cta          Ad_X <cta>)` — one per `creative.ctas[]`.
   - `(object_type  Ad_X <object_type>)`.
   - `(link-domain  Ad_X <domain>)` — eTLD+1 from each `link_urls[*]`.

   *Categorical atoms (perf-only — also available):*
   - `(campaign Ad_X <campaign_id>)`, `(adset Ad_X <adset_id>)`.

   *Text-derived atoms (creative-only — deterministic, no LLM):*
   - For each headline/body/image.description in the creative:
     - Lowercase, strip Dutch stopwords (`de`, `het`, `een`, `van`, `voor`, `met`, `jouw`, `is`, `niet`, …), keep tokens of length ≥ 4.
     - Emit `(kw Ad_X <token>)`. Cap at top-15 tokens per ad by corpus TF-IDF to avoid noise.

4. **Derive co-occurrence implications** —
   - For each predicate family `cta`, `campaign`, `object_type`, `link-domain`, `kw` × each outcome `ctr-high`, `cpc-low`, `roas-proxy`:
     - Restrict to ads where BOTH the predicate and the outcome are defined (this is how outer-join handles asymmetry: ads with only one side just don't contribute to that particular implication).
     - `s = co_count / pred_count` over the ads where both are defined.
     - `c = total_imp_of_qualifying_ads / (total_imp + 10000)`.
     - Emit MeTTa: `(Implication (<pred> <value>) (<outcome>)) (stv s c)`.
   - Push all implications via one `petta.process_metta_string("\n".join(...))` call.

5. **Filter by product/context (deterministic, no LLM)** —
   - Tokenize `product` and `context` the same way (lowercase, strip stopwords, length ≥ 4).
   - `matched_ads` = ads whose `kw` atoms have Jaccard ≥ 0.1 with the query tokens. Fallback: all ads, if no match.

6. **Run PLN inference** — For top 30 implications by `s * c`, fire Modus Ponens via the `|~` operator from [lib_pln.metta](repos/OmegaClaw-Core/lib_pln.metta):
   ```metta
   (|~ ((Implication (cta SHOP_NOW) (ctr-high)) (stv 0.83 0.71))
        ((cta SHOP_NOW) (stv 1.0 1.0)))
   ```
   `petta.process_metta_string(...)` returns derived atoms; parse `(stv f c)` via `/\(stv\s+([\d.]+)\s+([\d.]+)\)/`.

7. **Build response** —
   - Rank derived atoms by `f * c`, keep top 8 as `top_patterns[]`.
   - `top_patterns[i] = { formula, roas: weighted_avg(matched_ads.roas_proxy), confidence: f*c, n: support_count }`.
   - `elements[]`: deduped LHS atom names across `top_patterns`, capped at 6.
   - `style` / `hook` / `tone`: top atom of family `object_type` / `cta` / `kw`. Fallback: most-frequent atom of that family in `matched_ads` if no top pattern in that family.
   - `expected_roas`: mean of `top_patterns[*].roas`.
   - `expected_cpc`: mean CPC across `matched_ads`.
   - `confidence`: min of `top_patterns[*].confidence` (worst-case PLN composition).
   - `reasoning`: machine-readable semicolon-joined `(Implication ...) (stv f c) [n=k]` strings.
   - `matched_ads`: array of `{ad_id, score, image_refs}` — sorted by score descending, capped at 10.
     - `image_refs` resolved from `creative.images[*].ref` (paths like `images/<ad_id>_<i>.jpg`).

#### 1.2 Modify `webapp/server.js` — replace lines 128-219

```js
app.post('/api/pln-spec', async (req, res) => {
  const { product, context } = req.body;

  // Keep performanceAtoms side-channel for the frontend (used by renderPipeline).
  let perfAtoms = [];
  try {
    const files = await readdir(ATOMS_PERF_DIR);
    perfAtoms = await Promise.all(
      files.filter(f => f.endsWith('.json'))
           .map(async f => JSON.parse(await readFile(join(ATOMS_PERF_DIR, f), 'utf-8')))
    );
  } catch {}

  const { execFile } = await import('child_process');
  const { promisify } = await import('util');
  const execFileAsync = promisify(execFile);
  const scriptPath = join(__dirname, 'pln_query.py');
  const pythonExe  = process.env.OMEGACLAW_PYTHON || 'C:\\Windows\\py.exe';
  const pettaPath  = process.env.PETTA_PATH       || join(__dirname, '..');

  try {
    const { stdout, stderr } = await execFileAsync(
      pythonExe,
      [scriptPath, product || '', context || '',
       ATOMS_PERF_DIR, ATOMS_CREATIVE_DIR, pettaPath],
      { timeout: 60_000, maxBuffer: 20 * 1024 * 1024 }
    );
    if (stderr) console.error('[pln_query stderr]', stderr.slice(0, 400));
    const data = JSON.parse(stdout.trim());
    if (data.error) throw new Error(data.error);
    res.json({ success: true, spec: data.spec, performanceAtoms: perfAtoms });
  } catch (err) {
    const detail = err.stdout
      ? (() => { try { return JSON.parse(err.stdout).error; } catch { return err.stdout.slice(0, 400); } })()
      : err.message;
    console.error('[PLN spec fout]', detail);
    res.status(500).json({ success: false, error: detail });
  }
});
```

Remove the `KG_PATH` constant ([server.js:20](webapp/server.js#L20)), the branding regex parser ([server.js:156-168](webapp/server.js#L156-L168)), and the OpenAI prompt/call previously at [server.js:194-213](webapp/server.js#L194-L213).

#### 1.3 Frontend tolerance in `webapp/app.js`

All existing render sites already treat spec fields as strings — no structural change required. Two minor edits:

- **[app.js:13](webapp/app.js#L13)** state: add `selectedWinnerAdId: null` (used by Phase 4 gallery).
- **Anywhere `matched_ads` is consumed** (currently nowhere — it was an unused string array): add gallery render in Phase 4.

Copy edits (honesty pass):
- **[app.js:573](webapp/app.js#L573)** change "PLN (Probabilistic Logic Networks) redeneert continu over alle atoms…" so it makes clear the inference is now real PeTTa.
- **[app.js:1824](webapp/app.js#L1824)** "7-fase ad generatie · PLN + Atomspace + Gemini · OmegaClaw" — change "Gemini" to "gpt-image-1" (the actual model in use).

#### 1.4 `webapp/.env.example`

```
# Python executable that has janus_swi installed (created by setup.bat).
OMEGACLAW_PYTHON=D:\mubashir\growthengine\.venv\Scripts\python.exe

# Root of the PeTTa checkout (the folder containing src\main.pl and python\petta.py).
PETTA_PATH=D:\mubashir\growthengine
```

`OPENAI_API_KEY` stays — still needed by `/api/generate`, `/api/generate-image`, `/api/generate-image-edit` (Phase 3), `/api/verify-image`.

#### 1.5 Cleanup

- `git rm repos/OmegaClaw-Core/atomspace/knowledge_graph.metta`.
- Verify no remaining references: `grep -r "knowledge_graph.metta" .` should return zero hits after [server.js:20](webapp/server.js#L20) is removed.

---

### Phase 2 — Ad text rendered into the image (Day 2-3)

#### 2.1 Modify `webapp/gen_image.py`

Change the argv contract from `(prompt, api_key)` to `(prompt_json, api_key)` where `prompt_json` is a JSON object containing the structured ad copy + scene description. The Python script builds the final gpt-image-1 prompt from those structured fields.

**New argv contract:**
```
py gen_image.py "<prompt_json>" <api_key>
```

Where `<prompt_json>` is a JSON-encoded object like:
```json
{
  "scene":     "Hand wearing 3 stacked bracelets, beige/brown tones, soft natural lighting, top-down composition",
  "headline":  "CHOOSE ANY 3.",
  "sub":       "SAVE €20",
  "body":      "THE BUNDLE BUILDER · 3 BRACELETS. YOUR STYLE.",
  "cta":       "BUILD YOUR BUNDLE",
  "caption":   "CHOOSE 3 BRACELETS AND RECEIVE €20 DISCOUNT",
  "brand": {
    "name":    "Stoney Bracelets",
    "tone":    "premium, warm, masculine",
    "palette": "warm browns, beige, dark brown text, beige pill button",
    "logo":    "small SB mark visible on each bracelet"
  }
}
```

**Prompt builder inside `gen_image.py`:**

```python
def build_prompt(p):
    return f"""Premium lifestyle advertisement for {p['brand']['name']}.

SCENE: {p['scene']}.
Tone: {p['brand']['tone']}.
Colour palette: {p['brand']['palette']}.
{p['brand']['logo']}.

RENDER THE FOLLOWING TEXT INTO THE IMAGE, exact spelling, designer-level typography:
- Top-left, large serif, dark brown:   "{p['headline']}"
- Below headline, lighter brown:        "{p['sub']}"
- Mid-left, small caps:                 "{p['body']}"
- Bottom-center, beige rounded-pill button, dark brown text: "{p['cta']}"
- Below the button, small white text:   "{p['caption']}"

Style: editorial product photography, soft natural lighting, designed ad layout. NO watermarks. NO Lorem Ipsum. Render every word above verbatim.
"""
```

Keep the existing rate-limit retry loop and JSON-on-stdout envelope. The response shape stays `{"b64": "..."}` or `{"error": "..."}`.

#### 2.2 Modify `webapp/server.js` `/api/generate-image` endpoint

Accept either the old shape (`{ prompt: "..." }`, single string) for backward compatibility, OR the new shape (`{ adCopy: {...}, brand: {...}, scene: "..." }`). The new shape is preferred and the frontend will migrate.

```js
app.post('/api/generate-image', async (req, res) => {
  const { prompt, adCopy, brand, scene } = req.body;
  // Build the structured payload for gen_image.py.
  const payload = adCopy
    ? {
        scene:    scene || adCopy.image_prompt || 'studio photograph of the product',
        headline: adCopy.headline,
        sub:      adCopy.sub || '',
        body:     adCopy.body,
        cta:      adCopy.cta,
        caption:  adCopy.caption || '',
        brand:    brand || { name: '', tone: '', palette: '', logo: '' },
      }
    : { scene: prompt, headline: '', sub: '', body: '', cta: '', caption: '', brand: {} };

  // ... same execFile shape as today, passing JSON.stringify(payload) as argv[0].
});
```

#### 2.3 Modify Phase-4 ad-copy generation in `server.js` (`/api/generate`)

The current ad-gen prompt ([server.js:65-91](webapp/server.js#L65-L91)) already produces `headline`, `body`, `cta`, `image_prompt`. Add three more output fields:

- `sub`: short complementary line (e.g. "SAVE €20"). Max 20 chars.
- `caption`: line below CTA button. Max 80 chars.
- `scene`: a separated scene-only description (no text instructions) — replaces `image_prompt` semantically.

Update the JSON object schema in the user prompt and increase `max_tokens` if needed.

#### 2.4 Frontend `webapp/app.js`

- **[app.js:879-897](webapp/app.js#L879-L897)** `Stap 4 — Image generatie`: change `body: JSON.stringify({ prompt: ad.image_prompt })` to `body: JSON.stringify({ adCopy: ad, brand: ATOMS.brand, scene: ad.scene || ad.image_prompt })`.
- **`renderOutput`** ([app.js:974+](webapp/app.js#L974)): the rendered ad card no longer needs to overlay headline/body in DOM — the image itself contains them. Optional: keep a small label below for accessibility ("Generated headline: '…'") and to make ROAS/timing visible.

---

### Phase 3 — Image-to-image variation endpoint (Day 3-4)

#### 3.1 New file: `webapp/gen_image_edit.py`

Mirrors `gen_image.py` but calls OpenAI's image-edit endpoint, which accepts a reference image and a transformation prompt.

```python
"""
gen_image_edit.py — variation of an existing ad image via gpt-image-1 image edit.
Usage: py gen_image_edit.py "<prompt_json>" "<reference_image_path>" <OPENAI_API_KEY>
Outputs JSON: {"b64": "..."} or {"error": "..."}
"""
import base64, json, sys, time, re
from openai import OpenAI, RateLimitError

prompt_json, ref_path, api_key = sys.argv[1], sys.argv[2], sys.argv[3]
p = json.loads(prompt_json)
client = OpenAI(api_key=api_key)

def build_prompt(p):
    # Same builder as gen_image.py BUT framed as a transformation, not a new scene.
    return f"""Create a variation of this advertisement. Keep the overall composition,
lighting, and product placement of the source image. Modify ONLY the following:

- Headline:    "{p['headline']}"
- Sub-line:    "{p['sub']}"
- Body:        "{p['body']}"
- CTA button:  "{p['cta']}"
- Caption:     "{p['caption']}"

Render every word above verbatim, no Lorem Ipsum. Match the source image's typographic style.
Brand: {p['brand']['name']} ({p['brand']['tone']}).
"""

for attempt in range(4):
    try:
        with open(ref_path, "rb") as f:
            response = client.images.edit(
                model="gpt-image-1",
                image=f,
                prompt=build_prompt(p),
                size="1024x1024",
                n=1,
            )
        print(json.dumps({"b64": response.data[0].b64_json}))
        sys.exit(0)
    except RateLimitError as e:
        m = re.search(r"try again in (\d+(?:\.\d+)?)s", str(e))
        time.sleep((float(m.group(1)) + 2) if m else 15)
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
```

#### 3.2 New endpoint `webapp/server.js` `/api/generate-image-edit`

```js
const IMAGES_DIR = join(__dirname, '..', 'sample_data', 'images');

app.post('/api/generate-image-edit', async (req, res) => {
  const { adCopy, brand, scene, sourceRef, sourceBase64 } = req.body;

  // Resolve the reference image to a local path:
  //   sourceRef    = "images/<ad_id>_<i>.jpg"  (gallery pick from PLN)
  //   sourceBase64 = "data:image/png;base64,..." (user upload)
  let refPath;
  if (sourceBase64) {
    const tmp = join(os.tmpdir(), `ref_${Date.now()}.png`);
    const buf = Buffer.from(sourceBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    await fs.writeFile(tmp, buf);
    refPath = tmp;
  } else if (sourceRef) {
    // sourceRef comes from creative.images[*].ref, of the form "images/<file>.jpg".
    // The actual file lives at sample_data/images/<file>.jpg.
    const fileName = sourceRef.replace(/^images\//, '');
    refPath = join(IMAGES_DIR, fileName);
    if (!existsSync(refPath)) {
      return res.status(404).json({ success: false, error: `Reference image not found: ${sourceRef}` });
    }
  } else {
    return res.status(400).json({ success: false, error: 'sourceRef or sourceBase64 required' });
  }

  const payload = { scene: scene || '', headline: adCopy.headline, sub: adCopy.sub || '',
                    body: adCopy.body, cta: adCopy.cta, caption: adCopy.caption || '',
                    brand: brand || {} };

  // Same execFile pattern as /api/generate-image, but spawning gen_image_edit.py
  // with [scriptPath, JSON.stringify(payload), refPath, OPENAI_API_KEY] argv.
  // ... (mirrored from /api/generate-image)
});
```

#### 3.3 Pipeline orchestration in `webapp/app.js`

In `startPipeline` ([app.js:812+](webapp/app.js#L812)), branch on whether a winner is selected:

```js
const useEdit = !!state.selectedWinnerAdId || !!state.uploadedWinnerBase64;
const winnerRef = state.uploadedWinnerBase64
  ? null
  : findWinnerImageRef(state.selectedWinnerAdId, state.plnSpec);

const images = await Promise.all(
  ads.map(ad => {
    const endpoint = useEdit ? '/api/generate-image-edit' : '/api/generate-image';
    const body = useEdit
      ? { adCopy: ad, brand: ATOMS.brand, scene: ad.scene || ad.image_prompt,
          sourceRef: winnerRef, sourceBase64: state.uploadedWinnerBase64 }
      : { adCopy: ad, brand: ATOMS.brand, scene: ad.scene || ad.image_prompt };

    return fetch(endpoint, { method:'POST', headers:{'Content-Type':'application/json'},
                             body: JSON.stringify(body) })
      .then(r => r.json()).then(d => d.success ? d.imageBase64 : null);
  })
);
```

`findWinnerImageRef` looks up the chosen ad_id in `state.plnSpec.matched_ads[]` and returns the first `image_refs[0]`.

---

### Phase 4 — Winner gallery + upload UI (Day 4-5)

#### 4.1 New static endpoint for serving local sample images

```js
// server.js — let the browser load images from sample_data/images/
app.use('/sample-images', express.static(IMAGES_DIR));
```

Frontend will reference these as `/sample-images/<ad_id>_<i>.jpg`.

#### 4.2 Gallery component in `webapp/app.js` Genereren page

Insert between the form ([app.js:691-746](webapp/app.js#L691-L746)) and the pipeline view a new "Bron-advertentie (winner)" section that renders after the PLN spec returns:

```js
function renderWinnerGallery(matched_ads) {
  if (!matched_ads?.length) return '';
  return `
  <div class="winner-gallery">
    <div class="card-label">Bron-advertentie voor variatie (optioneel)</div>
    <div class="winner-grid">
      ${matched_ads.slice(0, 8).map(m => `
        <div class="winner-card" data-ad-id="${m.ad_id}">
          <img src="/sample-images/${m.image_refs[0]?.replace('images/', '')}" alt="Ad ${m.ad_id}">
          <div class="winner-score">score ${m.score.toFixed(2)}</div>
        </div>
      `).join('')}
    </div>
    <div class="winner-upload">
      <label class="upload-drop">
        <input type="file" accept="image/*" id="winner-upload">
        <span>… of upload je eigen referentie</span>
      </label>
    </div>
    <div class="winner-clear">
      <button id="btn-no-winner">Geen bron (text-to-image)</button>
    </div>
  </div>`;
}
```

Click handlers:
- Click on `.winner-card` → set `state.selectedWinnerAdId = m.ad_id`, clear upload, highlight selection.
- Drop file on `#winner-upload` → read as data URL, set `state.uploadedWinnerBase64`, clear selection.
- `#btn-no-winner` → clear both.

Auto-pick: when PLN spec returns and the user has not interacted, pre-select `matched_ads[0]` as a soft default (per Q3 above, default is "auto-pick top-1").

#### 4.3 CSS in `webapp/style.css`

Add `.winner-gallery`, `.winner-grid` (CSS grid 4-up), `.winner-card` (square thumbnail, hover ring), `.winner-card.selected` (active ring), `.upload-drop` (dashed border drop zone). Single-screen, matches existing card aesthetics.

---

## File-by-file change manifest

| File | Action | Phase |
|---|---|---|
| `webapp/pln_query.py` | **NEW** — PeTTa bridge | 1 |
| `webapp/gen_image_edit.py` | **NEW** — gpt-image-1 image-edit subprocess | 3 |
| `webapp/gen_image.py` | **MODIFY** — accept structured prompt_json, render text into image | 2 |
| `webapp/server.js` | **MODIFY** — replace `/api/pln-spec` body; rewrite `/api/generate-image`; add `/api/generate-image-edit`; add `/sample-images` static; remove KG_PATH and branding regex | 1, 2, 3 |
| `webapp/app.js` | **MODIFY** — `matched_ads` consumers; gallery renderer; upload handler; pipeline endpoint branching; ad-copy schema (`sub`, `caption`, `scene`); honesty copy edits | 1, 2, 3, 4 |
| `webapp/style.css` | **MODIFY** — winner gallery styles | 4 |
| `webapp/.env.example` | **MODIFY** — add `OMEGACLAW_PYTHON`, `PETTA_PATH` | 1 |
| `scripts/import_meta_creative.py` | OPTIONAL — add `--ad-ids <file>` flag for targeted re-import (kept optional since outer join removes the hard need) | (later) |
| `repos/OmegaClaw-Core/atomspace/knowledge_graph.metta` | **DELETE** | 1 |
| `plan.md` (project root) | **NEW** — copy of this plan for team reference | (first action after approval) |

---

## Critical files to read before coding

| Path | Why |
|---|---|
| [python/petta.py](python/petta.py) | PeTTa API surface — only 3 methods. All PLN invocation goes through `process_metta_string`. |
| [repos/OmegaClaw-Core/lib_pln.metta](repos/OmegaClaw-Core/lib_pln.metta) | The `\|~` operator (Modus Ponens, Abduction, Deduction). Composition formulas: Modus Ponens uses `f_out = f1*f2`, `c_out = f1*f2*c1*c2`. |
| [repos/OmegaClaw-Core/docs/reference-lib-pln.md](repos/OmegaClaw-Core/docs/reference-lib-pln.md) | Authoritative I/O contract for `\|~`. |
| [webapp/gen_image.py](webapp/gen_image.py) | Exact subprocess + stdout-JSON pattern to mirror in `pln_query.py` and `gen_image_edit.py`. |
| [webapp/server.js:222-249](webapp/server.js#L222-L249) | The Node-side execFile pattern. |
| [sample_data/atoms/performance/120235465518340070.json](sample_data/atoms/performance/120235465518340070.json) | Canonical perf JSON shape. |
| [sample_data/atoms/creative/120242461191650070.json](sample_data/atoms/creative/120242461191650070.json) | Canonical creative JSON shape. Note `images[*].ref = "images/<file>.jpg"` — these resolve to [sample_data/images/](sample_data/images/), NOT `sample_data/atoms/creative/images/` (which doesn't exist). |
| OpenAI docs — `images.edit` endpoint for `gpt-image-1` | API contract for Phase 3. Reference image must be PNG or JPG, ≤ 4 MB. |
| [webapp/app.js:670-677](webapp/app.js#L670-L677), [app.js:820-928](webapp/app.js#L820-L928) | PIPELINE_STEPS + `startPipeline` — the orchestrator to modify. |
| [SETUP.md](SETUP.md) | `.venv\` location, `setup.bat`, swipl/janus dependency. |

---

## Verification

### Phase 1

1. `python -c "import janus_swi; print('ok')"` from `.venv\Scripts\python.exe` → `ok`.
2. `swipl --version` → 9.2.x or later.
3. CLI: `.venv\Scripts\python.exe webapp\pln_query.py "Beach bag" "Week 24, summer" sample_data\atoms\performance sample_data\atoms\creative .` → valid JSON with `spec.top_patterns[0].confidence > 0`. First run 3-8s.
4. `curl POST /api/pln-spec` → returns the new shape, `matched_ads` is now an array of objects with `image_refs`.
5. Server logs show NO `openai` HTTP traffic on the `/api/pln-spec` path.
6. `git ls-files | grep knowledge_graph` → empty.

### Phase 2

1. POST `/api/generate-image` with the new `{adCopy, brand, scene}` shape → 200 with base64 PNG.
2. Visually inspect: image contains the headline string verbatim, CTA button is visible with the CTA text, no Lorem Ipsum.
3. Existing single-`prompt` callers still work (backward-compat branch).
4. Verification loop ([server.js:252-284](webapp/server.js#L252-L284)) returns `matchPercent >= 60` for at least 3 of 5 generated ads.

### Phase 3

1. POST `/api/generate-image-edit` with `sourceRef = "images/120242461191650070_1.jpg"` and a new ad-copy → image whose composition resembles the source but with the new text. Check by `diff -q` of the perceptual hash (or visually).
2. POST same endpoint with `sourceBase64 = <data url of an uploaded image>` → succeeds.
3. POST with neither → 400.
4. POST with `sourceRef = "images/zzz.jpg"` (missing file) → 404 with the expected error string.

### Phase 4

1. Open Genereren page → after PLN spec returns, gallery shows up to 8 thumbnails from `matched_ads`.
2. First card is pre-selected (soft default).
3. Clicking another card moves the selection ring.
4. Dropping a file on the upload zone clears the gallery selection.
5. Clicking "Geen bron" → pipeline reverts to text-to-image (Phase 2 path).
6. End-to-end: pick a winner, generate 5 ads → each output image is a variation of the picked source.

### Honesty check

- `grep -rn "openai" webapp/server.js` shows OpenAI is used only in `/api/generate`, `/api/generate-image`, `/api/generate-image-edit`, `/api/verify-image` — **never** in `/api/pln-spec`.
- `grep -rn "PLN" webapp/` — every PLN reference now corresponds to either an OmegaClaw call site or the PLN spec consumer; no "you are a PLN engine" system prompt remains.
- The reference image (the bundle-builder ad the client shared) reproduces at acceptable quality in <3 attempts.

---
---

# Plan — Growth Engine 5-Layer Reasoning (Meta-only)

> Supersedes the document above at the **architecture level**. The 4-phase execution skeleton above (real PLN, ad-text-in-image, image-edit variation, winner gallery) stays — this section reorganizes *why* and *how* those phases connect, replacing the flat "old-ad → new-ad" story with the PDF's 5-layer model and adding the LearnedPattern object + evidence-trace UI on top.

---

## Context

**Why this change.** The client's May 2026 internal note ([Growth_Engine_Desired_Reasoning_Layer_and_Graph.pdf](Growth_Engine_Desired_Reasoning_Layer_and_Graph.pdf)) declares the current direction "too flat": today's pipeline ranks a winner and asks gpt-image-1 for a variation, which makes the product look like a winner-variation generator. The client wants Growth Engine to *learn relationships* — explicit `LearnedPattern` objects with confidence, evidence, and counter-evidence — and to call the LLM *only after* the reasoning layer has chosen a strategy. The visual graph must show the chain `historical ads → features → learned pattern → confidence/evidence → new-ad strategy → generated ad`, not just `new ad → old ad`.

**Why Meta-only is feasible.** The PDF mentions Shopify in the historical-data layer, but the reasoning architecture is data-source-agnostic. Meta's Insights API ships `actions[]` (`purchase`, `add_to_cart`, `initiate_checkout`) and `action_values[]`/`purchase_roas` — enough conversion signal to express the PDF's pattern examples ("urgency → CTR up, conversion down") without Shopify. True LTV / refunds / AOV stay out of scope; the client flagged that as acceptable.

**Outcome.** After this plan executes, the webapp shows: which `LearnedPattern` objects fired for each generated ad, the evidence ads that built each pattern, the confidence with substantiation (sample size, spend, variance, counter-evidence), and the strategy the LLM received. New performance data writes back into the atomspace so confidence rises/falls over time.

**Confirmed decisions** (from this planning session):
- **Scope:** rewrite around the 5-layer vision (not just extend the document above).
- **Conversion atoms:** ingest Meta `actions[type=purchase]` and `action_values[]` as a new atom family.
- **Pattern storage:** `(LearnedPattern …)` atoms inside PeTTa, derived per request; no separate DB.

---

## The 5-layer mapping

| PDF Layer | What it owns | Concretely in this repo |
|---|---|---|
| **L1 Historical** | Raw Meta ads, perf rows, creatives, dates, audiences, product context. *Shopify dropped — Meta `actions[]` substitutes.* | [sample_data/atoms/performance/*.json](sample_data/atoms/performance) + [sample_data/atoms/creative/*.json](sample_data/atoms/creative). Requires re-import to add `actions[]` (see Phase A). |
| **L2 Feature** | Comparable building blocks: hook type, visual style, CTA, product category, audience cohort, season-from-date, keyword bag. | Base atoms emitted by `pln_query.py` step 3 in the document above. **Extended here** with `(season Ad_X <q1\|q2\|q3\|q4>)`, `(audience-cohort Ad_X <id>)`, `(price-tier Ad_X <low\|mid\|high>)`, `(visual-style Ad_X <ugc\|lifestyle\|product>)`. |
| **L3 Relationship** | `LearnedPattern` objects with name, conditions, predicted outcome, confidence-with-substantiation, evidence, counter-evidence. **The real learning database.** | New atom shape (Phase C). Lives in PeTTa atomspace; derived from L2 by Implication co-occurrence; PLN's `\|~` runs on the inner Implication for composition. |
| **L4 Decision** | Pattern retrieval for the current request (product, audience, timing, objective). Strategy formulation. | New `pln_query.py` step (Phase D): match request tokens against `LearnedPattern.conditions`; rank by `confidence × relevance`; return top-K patterns + a derived strategy block. |
| **L5 Generation** | LLM + image model execute *within* the strategy. No strategic invention. | Existing `/api/generate` + `/api/generate-image[-edit]`, but the prompt now receives the strategy block from L4 verbatim (Phase D.3). |

---

## Phased execution (5 working days, each phase independently committable)

### Phase A — Historical layer: ingest Meta conversion actions (Day 1)

Audit finding: the current performance JSONs ([sample_data/atoms/performance/120235465518340070.json](sample_data/atoms/performance/120235465518340070.json)) carry only `impressions, clicks, ctr, cpc, cpm, spend, reach, frequency` — no `actions[]`, no `purchase_roas`, no `action_values`. The current `import_meta_api.py` hard-codes a 16-field request and skips actions entirely. Without re-import, L3 cannot express conversion patterns.

#### A.1 Modify `scripts/import_meta_api.py`

Add to the Insights field list:
```
actions, action_values, purchase_roas, cost_per_action_type, conversions
```
Persist into each performance JSON as:
```json
{
  "actions": [
    { "action_type": "purchase",           "value": 12 },
    { "action_type": "add_to_cart",        "value": 47 },
    { "action_type": "initiate_checkout",  "value": 23 },
    { "action_type": "link_click",         "value": 312 }
  ],
  "action_values": [
    { "action_type": "purchase", "value": 1834.50 }
  ],
  "purchase_roas": [ { "action_type": "omni_purchase", "value": "3.42" } ]
}
```

#### A.2 Re-import the 100 perf ads

`py.exe scripts/import_meta_api.py --since 2025-11-01 --until 2026-05-15 --refresh`. If Meta API access is unavailable in dev, ship a synthetic backfill script `scripts/synthesize_actions.py` that fabricates plausible `actions[]` arrays from existing `clicks` + a per-ad random conversion rate seeded by `ad_id`, so the rest of the pipeline can develop end-to-end. Synthetic mode is gated by env var `OMEGACLAW_SYNTHETIC_CONVERSIONS=1` and stamps a `"synthetic": true` flag into each JSON so downstream code can warn the user.

#### A.3 New numeric outcome atoms in `webapp/pln_query.py`

Extend step 3 of `pln_query.py` (the base-atom synthesis stage from §1.1 above) with:
- `(purchase-rate-high Ad_X (stv s c))` — `s = min(1, conv_rate / (2 × corpus_median_conv_rate))`, `conv_rate = purchase_count / clicks`, `c = purchase_count / (purchase_count + 20)`.
- `(roas-actual-high Ad_X (stv s c))` — uses `purchase_roas[0].value` when present; falls back to the existing `roas-proxy` when `purchase_count == 0`.
- `(funnel-dropoff Ad_X (stv s c))` — `s = 1 − (purchase / add_to_cart)` when both > 0; captures the "high CTR but low conversion" pattern the PDF explicitly calls out.

These outcomes plug into the existing implication-derivation loop (§1.1 step 4 above) — no structural code change beyond the new outcome family list.

---

### Phase B — Feature layer: enrich L2 atoms (Day 1-2)

Add four feature families to the base-atom synthesis (still in [webapp/pln_query.py](webapp/pln_query.py) step 3):

| Atom | Derivation | Source |
|---|---|---|
| `(season Ad_X <q1\|q2\|q3\|q4\|summer\|winter\|…>)` | Bucket `date_start` month → meteorological season + quarter | perf JSON |
| `(audience-cohort Ad_X <adset_id>)` | Aliased from `adset_id`; later: enrich with adset targeting JSON when available | perf JSON |
| `(price-tier Ad_X <low\|mid\|high>)` | Token match in `bodies[]`/`headlines[]` for currency-prefixed numbers; bucket vs corpus median | creative JSON |
| `(visual-style Ad_X <ugc\|lifestyle\|product\|abstract>)` | Token match in `images[*].description` (vision-LLM populated post-import) | creative JSON |

These atoms participate in the same co-occurrence loop as `cta`, `kw`, `object_type`. No new code path — just additional predicate names in the existing `predicate_families` list.

---

### Phase C — Relationship layer: LearnedPattern as first-class atom (Day 2-3)

This is the core of the rewrite.

#### C.1 Atom shape

```metta
(LearnedPattern
  <name>                                              ; e.g. summer-warm-lifestyle-roas
  (Implication
    (And (season Ad_X q3) (visual-style Ad_X lifestyle) (price-tier Ad_X mid))
    (purchase-rate-high Ad_X))
  (stv <f> <c>)                                       ; confidence-with-substantiation
  (Evidence    (List ad-123 ad-456 ad-789))
  (Counter     (List ad-002 ad-091))
  (Stats       (List (n 14) (spend 23410.5) (variance 0.18))))
```

**Why this shape works inside the existing PeTTa bridge:**
- The inner `(Implication …)` is what `\|~` from [lib_pln.metta](repos/OmegaClaw-Core/lib_pln.metta) operates on — Modus Ponens, Deduction, Abduction all fire. The audit confirmed `lib_pln` only triggers on operator-shaped atoms (Implication, Inheritance, Similarity); wrapping in `LearnedPattern` does **not** break inference because the wrapper is data, not a rule.
- The `Evidence` / `Counter` / `Stats` slots use MeTTa `List`, which the audit confirmed PeTTa atoms can hold. The webapp pulls these back by parsing the result of `petta.process_metta_string("!(match &self (LearnedPattern $name $impl $tv $ev $cn $st) ($name $impl $tv $ev $cn $st))")`.
- One atom per pattern (not N × M evidence atoms) keeps the atomspace size linear and the trace UI fast.

#### C.2 Confidence-with-substantiation formula

The PDF demands more than `f × c`. Compute `c` as a weighted product of four substantiation factors, each clamped to [0,1]:

```
c_sample      = n / (n + 10)                              ; small-sample shrinkage
c_spend       = min(1, total_spend / 5000)                ; €5k spend → fully trusted
c_consistency = 1 − stdev(per_ad_outcome) / mean          ; low variance → high consistency
c_counter     = 1 − counter_count / (evidence_count + counter_count + 1)

c = c_sample × c_spend × c_consistency × c_counter
f = sum(per_ad_outcome × per_ad_impressions) / sum(per_ad_impressions)
```

Emit each component into the `Stats` list so the trace UI can display the breakdown ("23 ads, €23k spend, variance 0.18, 2 counter-examples").

#### C.3 Counter-evidence detection

For each candidate `Implication (And conditions) outcome`:
- Evidence = ads matching `conditions` AND `outcome` (the standard co-occurrence set).
- **Counter** = ads matching `conditions` but with the *opposite* outcome (e.g. `cpc-low` instead of `cpc-high`, or below-median `purchase-rate` instead of above). For binary-from-numeric outcomes, "opposite" means the same predicate applied to ads in the bottom-tercile of that metric.
- Patterns with `counter_count >= evidence_count` are dropped entirely (too noisy).
- Patterns with `0 < counter_count < evidence_count` survive but with degraded `c_counter`.

#### C.4 Naming patterns

Auto-generate a kebab-case `<name>` from the dominant atoms in the conditions: e.g. `(And (season q3) (visual-style lifestyle) (price-tier mid))` → `summer-lifestyle-mid-price`. Append the outcome family: `summer-lifestyle-mid-price__purchase-rate-high`. Names are stable across runs (same inputs → same name) so the trace UI can persist user feedback like "I trust this pattern" across sessions in the future.

#### C.5 Files

- New file [webapp/pln_query.py](webapp/pln_query.py) (already a new file per §1.1 above) — extend the response shape:
  ```json
  {
    "spec": {
      "request":  { "product": "...", "context": "...", "audience": "...", "objective": "..." },
      "patterns": [
        {
          "name":           "summer-lifestyle-mid-price__purchase-rate-high",
          "conditions":     [ "season=q3", "visual-style=lifestyle", "price-tier=mid" ],
          "outcome":        "purchase-rate-high",
          "strength":       0.74,
          "confidence":     0.61,
          "substantiation": { "n": 14, "spend": 23410.5, "variance": 0.18, "counter_n": 2,
                              "c_sample": 0.58, "c_spend": 1.0, "c_consistency": 0.82, "c_counter": 0.87 },
          "evidence_ads":   [ { "ad_id": "120235...", "image_ref": "images/...jpg", "roas": 4.1 } ],
          "counter_ads":    [ { "ad_id": "120091...", "image_ref": "images/...jpg", "roas": 0.8 } ]
        }
      ],
      "strategy": {
        "hook":    "social-proof",
        "visual":  "lifestyle, light palette, outdoor",
        "cta":     "SHOP_NOW",
        "tone":    "relaxed, warm",
        "avoid":   [ "aggressive discount", "urgency timer" ],
        "justification_patterns": [ "summer-lifestyle-mid-price__purchase-rate-high" ]
      },
      "matched_ads": [ /* same as §1.1 step 7 above */ ]
    }
  }
  ```
  The `strategy` block is what the LLM sees in L5. The `patterns[]` array is what the trace UI shows.

---

### Phase D — Decision + Generation layers (Day 3-4)

#### D.1 Pattern retrieval (L4) in `pln_query.py`

Replace the current "Filter by product/context (Jaccard ≥ 0.1)" step (§1.1 step 5 above) with **pattern relevance scoring**:

1. Tokenize request `(product, context, audience, objective)`.
2. For each `LearnedPattern p` in the atomspace, compute `relevance(p) = overlap(p.conditions, request_atoms)`. A condition matches when:
   - `season=q3` and request month ∈ Jul/Aug/Sep, OR
   - `audience-cohort=X` and request audience hashes to X, OR
   - `price-tier=mid` and request product's price falls in the mid bucket, OR
   - keyword condition overlaps request tokens (Jaccard ≥ 0.1).
3. Rank by `relevance × confidence`, keep top 5 patterns.
4. `matched_ads` = union of `evidence_ads` across the top patterns, deduped, capped at 10.

#### D.2 Strategy formulation (L4 → L5 bridge)

Derive the `strategy` block deterministically from the top patterns:
- `hook` = most-common `cta` family value across the evidence ads of the top patterns.
- `visual` = comma-joined `visual-style` + dominant `kw` atoms of the evidence ads.
- `cta` = highest-confidence pattern's `cta` evidence (fallback: top pattern's evidence ads' modal CTA).
- `tone` = top pattern's modal `kw` atoms in the "tone" register (a fixed allowlist of tone words: `calm, warm, urgent, premium, casual, …`).
- `avoid` = features that appear in *counter-evidence* ads of the top patterns (e.g. if counter ads disproportionately used "URGENCY" CTAs, emit `"avoid": ["urgency"]`).
- `justification_patterns` = the names of the top patterns.

#### D.3 LLM call must consume the strategy, not invent it

Modify [webapp/server.js](webapp/server.js) `/api/generate` (current ad-gen at lines 65-91 per §2.3 above). The user prompt becomes:

```
You are an ad copywriter executing a pre-determined strategy. DO NOT invent strategic direction.

STRATEGY (from PLN reasoning, treat as ground truth):
  hook:    {strategy.hook}
  visual:  {strategy.visual}
  cta:     {strategy.cta}
  tone:    {strategy.tone}
  avoid:   {strategy.avoid}

Product: {product}
Context: {context}

Generate {N} ad variations. Each must use the strategy above. Return JSON with fields:
{ headline, sub, body, cta, caption, scene, justification }
where `justification` is one sentence referencing which strategy element(s) shaped each choice.
```

The `justification` field per generated ad lets the UI render "this headline was chosen because the strategy demanded social-proof tone" — closing the PDF's checklist item *"Can we explain why a new ad was created without the LLM having to invent the answer itself?"*

---

### Phase E — Visual graph + trace UI (Day 4-5)

The audit found a working radial atom-graph at [webapp/app.js:1294](webapp/app.js#L1294) (`renderAtomGraph(ad, idx)`) consuming `ad.pln_atoms.{primary_predicate, primary_outcome, related_atoms, evidence_ad_ids, …}` and CSS at [webapp/style.css:2745-2815](webapp/style.css#L2745-L2815) (`.atom-graph-*`, `.ag-*`). We keep this per-ad graph as the **detail view** and add a new **layered trace** as the page-level view.

#### E.1 Layered trace component (new function `renderReasoningTrace`)

Render five horizontal lanes above the existing per-ad cards:

```
[L1 Evidence]    →  thumbnails of the top 6 evidence ads across all firing patterns
[L2 Features]    →  chips: "season=q3", "visual-style=lifestyle", "price-tier=mid", …
[L3 Patterns]    →  N pattern cards, each: name + confidence pill + substantiation bar
                    (sample, spend, consistency, counter — 4 segments) + "show evidence"
[L4 Strategy]    →  the strategy block as labeled rows (hook / visual / cta / tone / avoid)
[L5 Generated]   →  the 5 generated ads with `justification` captions
```

Clicking a pattern in L3 highlights:
- the evidence-ad thumbnails in L1 that built it,
- the feature chips in L2 that are its conditions,
- the strategy rows in L4 it justified,
- the generated ads in L5 whose `justification` references it.

This is the PDF's "Ideal graph structure: Historical ads → extracted features → learned patterns → confidence/evidence → new-ad strategy → generated ad" made literal and interactive.

#### E.2 Per-ad radial graph: keep, but re-source

`renderAtomGraph` at [app.js:1294](webapp/app.js#L1294) currently reads `ad.pln_atoms.evidence_ad_ids`. Repoint it at the new `spec.patterns[i].evidence_ads[].ad_id` for the patterns referenced in that ad's `justification_patterns`. The radial shape stays; only the data source changes. No CSS changes needed.

#### E.3 Confidence "with substantiation" UI

Replace the single confidence percentage at `app.js:adCard` (referenced at §1.3 above) with a stacked bar:

```
confidence 61%
[████ sample] [█████████ spend] [███████ consistency] [████████ counter]
```

Hovering each segment shows the underlying number ("n=14", "€23,410 spend", "variance 0.18", "2 counter-examples"). This directly answers the PDF checklist's *"Can the system mark weak patterns as uncertain instead of presenting them as truth?"*

#### E.4 Drop the old 7-phase mockup narrative

The HTML mockup `ad-generation-architecture (1).html` shows Shopify as a data source and a 7-phase pipeline. Per the Meta-only decision and the 5-layer rewrite, update the README / about-page copy to describe the 5 layers. The HTML mockup file itself stays (reference artifact) but is no longer the source of truth. The honesty-pass copy edits in §1.3 above ([app.js:573](webapp/app.js#L573), [app.js:1824](webapp/app.js#L1824)) extend to: replace "7-fase ad generatie" with "5-laags redenering" and replace "Atomspace + Gemini" with "PLN-patronen + gpt-image-1".

---

### Phase F — Feedback loop hook (Day 5, scoped to scaffold-only)

The PDF's Step 7 ("Feed results back into the system") and checklist item *"Can a pattern become stronger, weaker or adjusted after new data?"* require write-back. Full implementation is out of POC scope, but **scaffold the seam** so it's not an architectural rewrite later:

- Add a `POST /api/feedback` endpoint accepting `{ pattern_name, new_evidence_ad_id, observed_outcome }`. For POC it appends to a `feedback_log.jsonl` file. A future job replays the log into the import script's atom generation.
- Add a "this generated ad worked / didn't work" thumbs widget on each ad card in `app.js`. POSTs to `/api/feedback` with the `justification_patterns` of that ad. No UI confirmation beyond a toast; the log is the contract.

This is ~30 lines of code total but makes the "living relationship database" claim defensible in a demo.

---

## File-by-file change manifest (delta over the document above)

| File | Action | Phase here | Notes |
|---|---|---|---|
| [scripts/import_meta_api.py](scripts/import_meta_api.py) | **MODIFY** — add `actions, action_values, purchase_roas` to field list | A | Was unmentioned in the document above |
| `scripts/synthesize_actions.py` | **NEW** — synthetic conversion backfill for offline dev | A | New file |
| [webapp/pln_query.py](webapp/pln_query.py) | **NEW** — extends §1.1 above with L2 feature families, LearnedPattern atoms, substantiated confidence, counter-evidence detection, strategy derivation | A, B, C, D | New file (§1.1 already lists it as new; this plan defines its richer responsibility) |
| [webapp/server.js](webapp/server.js) | **MODIFY** — `/api/pln-spec` returns the new `{patterns, strategy, matched_ads}` shape; `/api/generate` consumes `strategy` in prompt; new `/api/feedback` | C, D, F | Supersedes §1.2 above |
| [webapp/app.js](webapp/app.js) | **MODIFY** — new `renderReasoningTrace`; re-source `renderAtomGraph` to patterns; confidence-with-substantiation bar; feedback widget; honesty-pass copy edits | E, F | Reuses existing `renderAtomGraph` at [app.js:1294](webapp/app.js#L1294) |
| [webapp/style.css](webapp/style.css) | **MODIFY** — `.trace-lane-*`, `.pattern-card`, `.substantiation-bar`, `.justify-link` | E | Existing `.atom-graph-*` / `.ag-*` classes ([style.css:2745-2815](webapp/style.css#L2745-L2815)) untouched |
| [webapp/.env.example](webapp/.env.example) | **MODIFY** — add `OMEGACLAW_SYNTHETIC_CONVERSIONS` | A | Extends §1.4 above |
| All files in Phase 2/3/4 above (image-edit, gallery) | **UNCHANGED** | — | This plan is orthogonal to ad-text-in-image and the winner gallery; both still ship |

---

## Critical files to read before coding

| Path | Why |
|---|---|
| [Growth_Engine_Desired_Reasoning_Layer_and_Graph.pdf](Growth_Engine_Desired_Reasoning_Layer_and_Graph.pdf) | The source of truth for the 5-layer model, checklist, and product vision wording. |
| The document above (this same file) | The execution skeleton this plan reorganizes. Phases 2/3/4 still ship unchanged. |
| [python/petta.py](python/petta.py) | Only 3 public methods. All atom I/O is string-in / string-out via `process_metta_string`. |
| [repos/OmegaClaw-Core/lib_pln.metta](repos/OmegaClaw-Core/lib_pln.metta) | `\|~` operator definitions. Composition: Modus Ponens `f=f₁·f₂, c=f₁·f₂·c₁·c₂`. **Only operator-shaped atoms trigger inference** — `LearnedPattern` is a data wrapper, the inner `Implication` is what fires. |
| [repos/OmegaClaw-Core/docs/reference-lib-pln.md](repos/OmegaClaw-Core/docs/reference-lib-pln.md) | Authoritative I/O contract for `\|~`. |
| [webapp/app.js:1294-1468](webapp/app.js#L1294-L1468) | `renderAtomGraph(ad, idx)` — radial SVG graph. Reused, not rewritten. |
| [webapp/app.js:1480-1530](webapp/app.js#L1480-L1530) | `adCard()` — where confidence-with-substantiation bar replaces the single % chip. |
| [webapp/style.css:2745-2815](webapp/style.css#L2745-L2815) | `.atom-graph-*` / `.ag-*` CSS — DO NOT MODIFY; new classes live alongside. |
| [sample_data/atoms/performance/120235465518340070.json](sample_data/atoms/performance/120235465518340070.json) | Current perf JSON — confirms `actions[]` is absent; re-import is required. |
| [scripts/import_meta_api.py](scripts/import_meta_api.py) | The 16-field hardcoded request that needs `actions` added. |
| `ad-generation-architecture (1).html` | The old 7-phase / Shopify-inclusive mockup. Reference only — superseded by this plan. |

---

## Verification

### Phase A (historical layer)

1. After re-import (or synthetic backfill), open any perf JSON and confirm `actions[]` contains at least one `{action_type: "purchase"}` entry. With `OMEGACLAW_SYNTHETIC_CONVERSIONS=1`, every JSON has `"synthetic": true`.
2. `.venv\Scripts\python.exe webapp\pln_query.py "Bracelet" "June, cold audience" sample_data\atoms\performance sample_data\atoms\creative .` returns JSON with at least one `purchase-rate-high` predicate in `spec.patterns[*].outcome`.

### Phase B (feature layer)

1. The same CLI run shows `(season q3)`, `(visual-style …)`, `(price-tier …)` atoms participating in at least one pattern's `conditions`.
2. Patterns conditioned on `season` only fire when the request context implies a season.

### Phase C (relationship layer)

1. `petta.process_metta_string("!(match &self (LearnedPattern $n $i $tv $ev $cn $st) ...))")` returns ≥ 3 named patterns.
2. At least one pattern carries non-empty `Counter` evidence and the resulting `c_counter < 1.0` (visible in the substantiation breakdown).
3. Pattern names are stable: two consecutive runs on identical data produce identical pattern names (no UUIDs).
4. A deliberately weak pattern (n=2, low spend) appears with confidence < 0.2 and is rendered visually as "uncertain" in the UI.

### Phase D (decision + generation)

1. POST `/api/pln-spec {product, context}` → response includes a `strategy` block with all 6 fields populated (`hook, visual, cta, tone, avoid, justification_patterns`).
2. POST `/api/generate` → each generated ad object includes a `justification` string that references at least one pattern name from `strategy.justification_patterns`.
3. Server logs show the strategy block was passed into the OpenAI prompt verbatim (log the outgoing user prompt at debug level).
4. Manually craft a request where the strategy says `avoid: ["urgency"]` — verify the generated headlines contain no urgency tokens (`now, today only, ends soon, limited time`).

### Phase E (UI)

1. Open the Genereren page, run end-to-end. The reasoning trace renders with all 5 lanes populated.
2. Click a pattern card in L3 — evidence thumbnails in L1, feature chips in L2, strategy rows in L4, and generated ads in L5 all highlight.
3. Confidence appears as a 4-segment substantiation bar; hover tooltips show `n`, spend, variance, counter count.
4. The per-ad radial graph at the bottom still renders, now sourced from `justification_patterns`.

### Phase F (feedback scaffold)

1. Click a thumbs widget on a generated ad → `feedback_log.jsonl` gains an entry within 1 second.
2. The entry contains the ad's `justification_patterns` array, the user's verdict, and a timestamp.

### PDF checklist coverage (the ultimate verification)

| Checklist item | Where it's answered |
|---|---|
| Can we show which learned patterns were used for every new ad? | Phase E.1 (L5 lane shows `justification`); Phase D.3 (`justification_patterns` per ad) |
| Can every pattern be traced back to concrete historical ads and raw performance data? | Phase C.1 (`Evidence` list in the atom); Phase E.1 (click-to-highlight L3→L1) |
| Are contextual factors included (season, product type, audience, weather)? | Phase B (season, audience-cohort, price-tier, visual-style); weather flagged as future work |
| Can the system mark weak patterns as uncertain? | Phase C.2 (substantiated confidence); Phase E.3 (4-segment bar with low-confidence styling) |
| Is the LLM only called after the strategy comes from the reasoning layer? | Phase D.3 (LLM prompt receives `strategy` block as ground truth, instructed not to invent) |
| Are new results written back to the relationship database? | Phase F (scaffold: `feedback_log.jsonl`; full replay deferred) |
| Can a pattern become stronger, weaker or adjusted after new data? | Phase F (scaffold only — full implementation deferred to a post-POC PR) |
| Can we explain why a new ad was created without the LLM inventing the answer? | Phase D.3 (`justification` field is a sentence linking ad choice → pattern); Phase E (click-through trace) |

Six of eight checklist items are fully answered by this plan. The remaining two (write-back + pattern evolution) are scaffolded so the next PR is mechanical, not architectural.

---

## Open questions inherited (still applicable)

Q1–Q5 from the document above (typo tolerance, brand assets, no-winner fallback, per-ad cost cap, multi-round variation) all remain open. This plan adds one more:

**Q6.** Is Meta `actions[]` re-import gated on production Meta API credentials, or do we ship the POC against synthetic conversion data (`OMEGACLAW_SYNTHETIC_CONVERSIONS=1`)? Sensible default: synthetic for the demo, real for the client validation run.

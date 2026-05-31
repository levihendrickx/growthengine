/**
 * Growth Engine — server.js
 * Express server: real OmegaClaw PLN spec, ad copy, image generation (text-in-image),
 * image-to-image variation, and vision verification.
 */

import express from 'express';
import OpenAI, { toFile } from 'openai';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdir, readFile, writeFile, unlink } from 'fs/promises';
import { existsSync, createReadStream } from 'fs';
import { tmpdir } from 'os';
import dotenv from 'dotenv';

dotenv.config({ override: true });

// Shared OpenAI client — reuses HTTP keep-alive across all requests.
const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── Image-edit prompt builder (ported from gen_image_edit.py) ──
function buildEditPrompt(p) {
  const brand       = p.brand || {};
  const brandName   = brand.name    || '';
  const brandTone   = brand.tone    || 'premium, warm, masculine';
  const brandPalette= brand.palette || 'warm browns, beige, dark brown text';

  const headline = (p.headline || '').trim();
  const sub      = (p.sub      || '').trim();
  const body     = (p.body     || '').trim();
  const cta      = (p.cta      || '').trim();
  const caption  = (p.caption  || '').trim();

  const lines = [];
  if (headline) lines.push(`- Top-left, large bold serif, dark brown: "${headline}"`);
  if (sub)      lines.push(`- Below headline, lighter brown, serif: "${sub}"`);
  if (body)     lines.push(`- Mid-left, small caps, dark text: "${body}"`);
  if (cta)      lines.push(`- Bottom-center, beige rounded-pill button, dark brown text: "${cta}"`);
  if (caption)  lines.push(`- Below the button, small white text: "${caption}"`);

  const textBlock = lines.length
    ? `\n\nRENDER THE FOLLOWING TEXT INTO THE IMAGE, exact spelling, designer-level typography:\n${lines.join('\n')}\n\nRender every word above verbatim. NO Lorem Ipsum. NO placeholder text.`
    : '';

  const brandLine = brandName
    ? `Brand: ${brandName} (${brandTone}).`
    : `Tone: ${brandTone}.`;

  return (
    'Create a variation of this advertisement. Keep the overall composition, ' +
    'product placement, and lighting of the source image. ' +
    `Colour palette: ${brandPalette}. ` +
    `${brandLine}` +
    `${textBlock}\n\n` +
    'Style: editorial product photography, soft natural lighting, designed ad layout. ' +
    'NO watermarks.'
  );
}

// Prevent Node.js v15+ from crashing the process on unhandled async rejections.
// Express 4 does not catch async-handler errors automatically; this is the safety net.
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const ATOMS_PERF_DIR     = join(__dirname, '..', 'sample_data', 'atoms', 'performance');
const ATOMS_CREATIVE_DIR = join(__dirname, '..', 'sample_data', 'atoms', 'creative');
const IMAGES_DIR         = join(__dirname, '..', 'sample_data', 'images');

const app  = express();
const PORT = process.env.PORT || 8001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(__dirname));
<<<<<<< Updated upstream
app.use('/assets', express.static(__dirname + '/assets'));
app.use('/images', express.static(__dirname + '/images'));

// ── Auth callback — redirect na Google/Apple login ───────────
app.get('/auth/callback', (_req, res) => {
  res.sendFile(__dirname + '/auth-callback.html');
});

// ── Connect page — eerste scherm na inloggen ──────────────────
app.get('/connect', (_req, res) => {
  res.sendFile(__dirname + '/connect.html');
});
=======
// Serve winner seed images to the browser for the gallery picker
app.use('/sample-images', express.static(IMAGES_DIR));

// ── Subprocess helper (shared by all Python scripts) ──────────
async function runPython(args, timeoutMs = 300_000) {
  const { execFile } = await import('child_process');
  const { promisify } = await import('util');
  const execFileAsync = promisify(execFile);
  const pythonExe = process.env.OMEGACLAW_PYTHON || 'C:\\Windows\\py.exe';
  const { stdout, stderr } = await execFileAsync(pythonExe, args, {
    timeout: timeoutMs,
    maxBuffer: 20 * 1024 * 1024,
  });
  if (stderr) console.error(`[${args[0].split(/[\\/]/).pop()} stderr]`, stderr.slice(0, 400));
  const data = JSON.parse(stdout.trim());
  if (data.error) throw new Error(data.error);
  return data;
}

function extractError(err) {
  if (err.stdout) {
    try { return JSON.parse(err.stdout).error; } catch { return err.stdout.slice(0, 400); }
  }
  return err.message;
}
>>>>>>> Stashed changes

// ── Health check ─────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, apiKey: !!process.env.OPENAI_API_KEY });
});

<<<<<<< Updated upstream
// ── Supabase config (public keys only — safe to expose) ───────
app.get('/api/config', (_req, res) => {
  res.json({
    supabaseUrl:     process.env.SUPABASE_URL     || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  });
});

// ── Ad generatie ─────────────────────────────────────────────
=======
// ── Dataset browser ───────────────────────────────────────────
app.get('/api/dataset', async (req, res) => {
  try {
    const type    = req.query.type   === 'creative' ? 'creative' : 'performance';
    const page    = Math.max(1, parseInt(req.query.page,  10) || 1);
    const limit   = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const search  = (req.query.search || '').toLowerCase().trim();

    const dir   = type === 'creative' ? ATOMS_CREATIVE_DIR : ATOMS_PERF_DIR;
    const files = (await readdir(dir)).filter(f => f.endsWith('.json'));

    // Load all records (100 files max, each is small)
    const all = await Promise.all(
      files.map(async f => {
        try { return JSON.parse(await readFile(join(dir, f), 'utf8')); }
        catch { return null; }
      })
    );
    const records = all.filter(Boolean);

    // Search across all string/number values
    const filtered = search
      ? records.filter(r => JSON.stringify(r).toLowerCase().includes(search))
      : records;

    const total  = filtered.length;
    const offset = (page - 1) * limit;
    const data   = filtered.slice(offset, offset + limit);

    res.json({ total, page, limit, pages: Math.ceil(total / limit), type, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Ad copy generatie (gpt-4o-mini) ──────────────────────────
>>>>>>> Stashed changes
app.post('/api/generate', async (req, res) => {
  const { product, count, instructions, patterns, strategy, brandAtom } = req.body;

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ success: false, error: 'OPENAI_API_KEY niet ingesteld in .env' });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const systemPrompt = `Je bent een expert in direct-response advertenties voor premium lifestyle merken in Nederland.
Je schrijft Meta advertentieteksten op basis van bewezen data-patronen uit de Growth Engine.

MERK CONTEXT:
- Naam: ${brandAtom.naam}
- Tone of voice: ${brandAtom.tone}
- Doelgroep: ${brandAtom.doelgroep}
- Prijsrange: ${brandAtom.prijsrange}
- Producten: ${brandAtom.producten.join(', ')}

SCHRIJFREGELS:
- Schrijf ALTIJD in het Nederlands
- Headline: max 40 tekens, pakkend, nooit generiek
- Sub: max 20 tekens, complementaire zin (bijv. "BESPAAR €20" of "LIMITED EDITION")
- Body: max 125 tekens, emotioneel relevant, geen harde verkooptaal
- Caption: max 80 tekens, onder CTA-knop, concrete actie-trigger
- CTA: kies uit [Ontdek nu / Shop hier / Bestel vandaag / Bekijk collectie / Claim jouw exemplaar / BUILD YOUR BUNDLE]
- Geen uitroeptekens in headline tenzij absoluut noodzakelijk
- Geen clichés zoals "bestel nu en profiteer"
- Scene: Engelse beschrijving van het beeld ZONDER tekst (voor image generator)

OUTPUT: Geef ALLEEN een valide JSON array terug. Geen uitleg, geen markdown, geen tekst buiten de JSON.`;

  // Phase D.3: if a strategy block was derived by PLN, pass it as ground truth.
  // The LLM executes within the strategy — it does NOT invent strategic direction.
  const strategyBlock = strategy
    ? `\nSTRATEGIE (afgeleid door PLN-redenering — behandel dit als vastgestelde richting):
  hook:    ${strategy.hook}
  visual:  ${strategy.visual}
  cta:     ${strategy.cta}
  toon:    ${strategy.tone}
  vermijd: ${(strategy.avoid || []).join(', ') || 'geen beperkingen'}
  patronen: ${(strategy.justification_patterns || []).slice(0, 3).join(', ')}

INSTRUCTIE: Voer de bovenstaande strategie uit. Verzin GEEN eigen strategische richting.
`
    : `\nBewezen patronen uit PLN analyse (gebruik deze als creatieve sturing):
${(patterns || []).map(p => `• "${p.formula || p.name}" → ROAS ${p.roas || '?'} · conf: ${p.confidence} · n=${p.n}`).join('\n')}

Verdeel de ${count} ads als volgt:
- ${Math.ceil(count * 0.4)} ads gebaseerd op bewezen patronen (conf > 0.80)
- ${Math.ceil(count * 0.3)} ads op sterke variaties (conf 0.65–0.79)
- ${Math.floor(count * 0.3)} ads voor onderbelichte combinaties (conf 0.50–0.64)
`;

  const userPrompt = `Genereer ${count} Meta advertenties voor: ${product}

Extra instructies van gebruiker: ${instructions || 'geen'}
${strategyBlock}
Geef per ad dit JSON object terug:
{
  "headline": "string — max 40 tekens",
  "sub": "string — max 20 tekens, complementaire zin",
  "body": "string — max 125 tekens",
  "caption": "string — max 80 tekens, onder CTA-knop",
  "cta": "string",
  "scene": "string — Engelse scene-beschrijving ZONDER tekst, max 30 woorden",
  "image_prompt": "string — zelfde als scene (legacy veld)",
  "pattern_used": "string — welk PLN patroon of strategie-element zit hieronder",
  "justification": "string — één zin die uitlegt welk strategie-element deze keuze stuurde",
  "expected_roas": number,
  "confidence": number,
  "timing": "string — concreet startadvies",
  "budget": "string — dagbudget suggestie",
  "atoms_used": ["array van atom types die de basis vormen"]
}

Return ALLEEN de JSON array van ${count} objecten.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 4096,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt + '\n\nReturn a JSON object with key "ads" containing the array.' }
      ]
    });

    const raw    = completion.choices[0].message.content.trim();
    const parsed = JSON.parse(raw);
    const ads    = Array.isArray(parsed) ? parsed : (parsed.ads ?? parsed[Object.keys(parsed)[0]]);

    if (!Array.isArray(ads)) throw new Error('Geen ads array in GPT response');

    // ── Attach real PLN atom provenance to each ad ─────────────
    const enrichedAds = ads.map((ad, i) => {
      const pool = Array.isArray(patterns) ? patterns : [];
      if (!pool.length) return ad;

      // Match LLM-named pattern back to the real pool by name, formula, or round-robin fallback.
      const norm = s => (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
      let primary = pool.find(p => norm(p.name) === norm(ad.pattern_used));
      if (!primary) primary = pool.find(p => norm(p.formula) === norm(ad.pattern_used));
      if (!primary && ad.pattern_used) {
        const needle = norm(ad.pattern_used);
        primary = pool.find(p => needle && (
          norm(p.name || '').includes(needle) ||
          norm(p.formula || '').includes(needle.split(' → ')[0] || needle)
        ));
      }
      if (!primary) primary = pool[i % pool.length];

      // Related atoms: up to 4 other top_patterns ranked by score, distinct from primary.
      const related = pool
        .filter(p => p !== primary)
        .slice(0, 4)
        .map(p => ({
          pred_atom:  p.pred_atom  || (p.formula?.split(' → ')[0] || '').replace(/=/g, '-'),
          outcome:    p.outcome    || p.formula?.split(' → ')[1] || '',
          strength:   typeof p.strength   === 'number' ? p.strength   : 0.5,
          confidence: typeof p.confidence === 'number' ? p.confidence : 0.5,
          n:          p.n || 0,
        }));

      const primaryPredAtom = primary.pred_atom
        || (primary.formula?.split(' → ')[0] || '').replace(/=/g, '-');
      const primaryOutcome  = primary.outcome
        || primary.formula?.split(' → ')[1]
        || '';

      // Real atoms_used list: primary predicate + outcome + nearby related predicates.
      const atomsList = [primaryPredAtom, primaryOutcome]
        .concat(related.map(r => r.pred_atom))
        .filter(Boolean);
      const atomsUsed = [...new Set(atomsList)].slice(0, 6);

      const justPatterns = strategy
        ? (strategy.justification_patterns || []).slice(0, 3)
        : [primary.name || primary.formula || ''];

      return {
        ...ad,
        pattern_used:          primary.formula || primary.name || ad.pattern_used,
        justification_patterns: justPatterns,
        atoms_used:             atomsUsed,
        pln_atoms: {
          primary_predicate:  primaryPredAtom,
          primary_outcome:    primaryOutcome,
          pattern_name:       primary.name || null,
          strength:           typeof primary.strength   === 'number' ? primary.strength   : 0.5,
          confidence:         typeof primary.confidence === 'number' ? primary.confidence : 0.5,
          substantiation:     primary.substantiation || null,
          n:                  primary.n || 0,
          roas:               primary.roas || null,
          related_atoms:      related,
          evidence_ad_ids:    (primary.ad_ids || (primary.evidence_ads || []).map(e => e.ad_id)).slice(0, 5),
          evidence_ads:       (primary.evidence_ads || []).slice(0, 5),
          counter_ads:        (primary.counter_ads || []).slice(0, 3),
        },
      };
    });

    res.json({
      success: true,
      ads: enrichedAds,
      usage: {
        input_tokens:  completion.usage.prompt_tokens,
        output_tokens: completion.usage.completion_tokens,
        cache_creation_input_tokens: 0,
        cache_read_input_tokens: 0,
      }
    });

  } catch (err) {
    console.error('[GPT-4o-mini ad fout]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PLN spec — real OmegaClaw inference via pln_query.py ─────
app.post('/api/pln-spec', async (req, res) => {
  const { product, context } = req.body;

  // Side-channel: load performance atoms for the frontend pipeline page
  let perfAtoms = [];
  try {
    const files = await readdir(ATOMS_PERF_DIR);
    perfAtoms = await Promise.all(
      files.filter(f => f.endsWith('.json'))
           .map(async f => JSON.parse(await readFile(join(ATOMS_PERF_DIR, f), 'utf-8')))
    );
  } catch { /* directory not found — continue */ }

  const scriptPath = join(__dirname, 'pln_query.py');
  const pettaPath  = process.env.PETTA_PATH || join(__dirname, '..');

  try {
    const data = await runPython(
      [scriptPath, product || '', context || '', ATOMS_PERF_DIR, ATOMS_CREATIVE_DIR, pettaPath],
      60_000
    );
    res.json({ success: true, spec: data.spec, performanceAtoms: perfAtoms });
  } catch (err) {
    console.error('[PLN spec fout]', extractError(err));
    res.status(500).json({ success: false, error: extractError(err) });
  }
});

// ── Phase F: Feedback scaffold ────────────────────────────────
app.post('/api/feedback', async (req, res) => {
  const { pattern_name: patternName, justification_patterns, observed_outcome, verdict } = req.body;
  if (!patternName && !(justification_patterns && justification_patterns.length)) {
    return res.status(400).json({ success: false, error: 'pattern_name or justification_patterns required' });
  }
  const entry = JSON.stringify({
    ts: new Date().toISOString(),
    pattern_name: patternName || null,
    justification_patterns: justification_patterns || [],
    observed_outcome: observed_outcome || null,
    verdict: verdict || null,
  });
  const logPath = join(__dirname, '..', 'feedback_log.jsonl');
  try {
    const { appendFile } = await import('fs/promises');
    await appendFile(logPath, entry + '\n', 'utf-8');
    res.json({ success: true });
  } catch (err) {
    console.error('[Feedback log fout]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Image generatie — text-in-image via gpt-image-1 ──────────
app.post('/api/generate-image', async (req, res) => {
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ success: false, error: 'OPENAI_API_KEY niet ingesteld in .env' });
  }

  const { prompt, adCopy, brand, scene } = req.body;

  // Build structured payload for gen_image.py
  const payload = adCopy
    ? {
        scene:    scene || adCopy.scene || adCopy.image_prompt || 'studio product photograph',
        headline: adCopy.headline || '',
        sub:      adCopy.sub      || '',
        body:     adCopy.body     || '',
        cta:      adCopy.cta      || '',
        caption:  adCopy.caption  || '',
        brand:    brand || {},
      }
    : { scene: prompt || '', headline: '', sub: '', body: '', cta: '', caption: '', brand: {} };

  const scriptPath = join(__dirname, 'gen_image.py');

  try {
    const data = await runPython(
      [scriptPath, JSON.stringify(payload), process.env.OPENAI_API_KEY],
      300_000
    );
    res.json({ success: true, imageBase64: data.b64, mimeType: 'image/png' });
  } catch (err) {
    console.error('[Image generatie fout]', extractError(err));
    res.status(500).json({ success: false, error: extractError(err) });
  }
});

// ── Image-to-image variation — winner seed via gpt-image-2 edit (Node SDK, no subprocess)
app.post('/api/generate-image-edit', async (req, res) => {
  let tempFile = null;
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ success: false, error: 'OPENAI_API_KEY niet ingesteld in .env' });
    }

    const { adCopy, brand, scene, sourceRef, sourceBase64, quality = 'low' } = req.body;
    const validQualities = ['low', 'medium', 'high'];
    const imageQuality = validQualities.includes(quality) ? quality : 'low';

    if (!sourceRef && !sourceBase64) {
      return res.status(400).json({ success: false, error: 'sourceRef or sourceBase64 required' });
    }

    let refPath = null;

    if (sourceBase64) {
      const b64data = sourceBase64.replace(/^data:image\/\w+;base64,/, '');
      tempFile = join(tmpdir(), `ref_${Date.now()}_${Math.random().toString(36).slice(2)}.png`);
      await writeFile(tempFile, Buffer.from(b64data, 'base64'));
      refPath = tempFile;
    } else {
      const fileName = (sourceRef || '').replace(/^images\//, '');
      refPath = join(IMAGES_DIR, fileName);
      if (!existsSync(refPath)) {
        return res.status(404).json({ success: false, error: `Reference image not found: ${sourceRef}`, code: 'ref_not_found' });
      }
    }

    const payload = {
      scene:    scene || adCopy?.scene || adCopy?.image_prompt || '',
      headline: adCopy?.headline || '',
      sub:      adCopy?.sub      || '',
      body:     adCopy?.body     || '',
      cta:      adCopy?.cta      || '',
      caption:  adCopy?.caption  || '',
      brand:    brand || {},
    };

    const prompt = buildEditPrompt(payload);
    const MAX_RETRIES = 4;
    let lastErr;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const ext = refPath.split('.').pop().toLowerCase();
        const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
                   : ext === 'webp' ? 'image/webp'
                   : 'image/png';
        const imageFile = await toFile(createReadStream(refPath), `ref.${ext}`, { type: mime });
        const response = await openaiClient.images.edit({
          model:   'gpt-image-2',
          image:   imageFile,
          prompt,
          size:    '1024x1024',
          quality: imageQuality,
          n:       1,
        });
        const b64 = response.data[0].b64_json;
        if (!res.headersSent) {
          res.json({ success: true, imageBase64: b64, mimeType: 'image/png' });
        }
        return;
      } catch (err) {
        lastErr = err;
        if (err.status === 429 && attempt < MAX_RETRIES - 1) {
          const retryAfter = err.headers?.['retry-after'];
          const wait = retryAfter ? (parseFloat(retryAfter) + 2) * 1000 : 15_000;
          console.error(`[Image edit rate limit] retrying in ${wait / 1000}s (attempt ${attempt + 1})`);
          await new Promise(r => setTimeout(r, wait));
          continue;
        }
        throw err;
      }
    }
    throw lastErr;

  } catch (err) {
    console.error('[Image edit fout]', err.message || err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: err.message || String(err) });
    }
  } finally {
    if (tempFile) unlink(tempFile).catch(() => {});
  }
});

// ── Vision verificatie (gpt-4o-mini) ─────────────────────────
app.post('/api/verify-image', async (req, res) => {
  const { imageBase64, mimeType = 'image/png', specElements = [] } = req.body;

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ success: false, error: 'OPENAI_API_KEY niet ingesteld' });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 512,
      response_format: { type: 'json_object' },
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
          {
            type: 'text',
            text: `Check which of these elements are present in the image: ${JSON.stringify(specElements)}. Return ONLY JSON: {"matched": bool, "matchPercent": number, "elementCheck": {"element": bool}, "missing": [], "corrections": "short English correction prompt"}`,
          },
        ],
      }],
    });

    const data = JSON.parse(completion.choices[0].message.content);
    res.json({ success: true, ...data });
  } catch (err) {
    console.error('[Verificatie fout]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n  Growth Engine draait op → http://localhost:${PORT}\n`);
  console.log(`  PLN bridge:   ${process.env.OMEGACLAW_PYTHON || 'C:\\Windows\\py.exe'}`);
  console.log(`  PeTTa path:   ${process.env.PETTA_PATH || join(__dirname, '..')}\n`);
});

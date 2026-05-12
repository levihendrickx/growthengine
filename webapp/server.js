/**
 * Growth Engine — server.js
 * Express server + OpenAI API proxy voor PLN analyse, ad copy en image generatie
 */

import express from 'express';
import OpenAI from 'openai';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdir, readFile } from 'fs/promises';
import dotenv from 'dotenv';

dotenv.config({ override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ATOMS_PERF_DIR     = join(__dirname, '..', 'sample_data', 'atoms', 'performance');
const ATOMS_CREATIVE_DIR = join(__dirname, '..', 'sample_data', 'atoms', 'creative');
const KG_PATH            = join(__dirname, '..', 'repos', 'OmegaClaw-Core', 'atomspace', 'knowledge_graph.metta');

const app  = express();
const PORT = process.env.PORT || 8001;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ── Health check ─────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  const hasKey = !!process.env.OPENAI_API_KEY;
  res.json({ ok: true, apiKey: hasKey });
});

// ── Ad generatie (gpt-4o-mini) ───────────────────────────────
app.post('/api/generate', async (req, res) => {
  const { product, count, instructions, patterns, brandAtom } = req.body;

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
- Body: max 125 tekens, emotioneel relevant, geen harde verkooptaal
- CTA: kies uit [Ontdek nu / Shop hier / Bestel vandaag / Bekijk collectie / Claim jouw exemplaar]
- Geen uitroeptekens in headline tenzij absoluut noodzakelijk
- Geen clichés zoals "bestel nu en profiteer"

OUTPUT: Geef ALLEEN een valide JSON array terug. Geen uitleg, geen markdown, geen tekst buiten de JSON.`;

  const userPrompt = `Genereer ${count} Meta advertenties voor: ${product}

Extra instructies van gebruiker: ${instructions || 'geen'}

Bewezen patronen uit PLN analyse (gebruik deze als creatieve sturing):
${patterns.map(p => `• "${p.formula}" → ROAS ${p.roas} · conf: ${p.confidence} · n=${p.n}`).join('\n')}

Verdeel de ${count} ads als volgt:
- ${Math.ceil(count * 0.4)} ads gebaseerd op bewezen patronen (conf > 0.80) — gebruik de top patronen letterlijk
- ${Math.ceil(count * 0.3)} ads op sterke variaties (conf 0.65–0.79) — eigen invulling maar zelfde richting
- ${Math.floor(count * 0.3)} ads voor onderbelichte combinaties (conf 0.50–0.64) — experimenteer binnen merkstijl

Geef per ad dit JSON object terug:
{
  "headline": "string — max 40 tekens",
  "body": "string — max 125 tekens",
  "cta": "string",
  "image_prompt": "string — Engelse image generator prompt, max 25 woorden, beschrijvend en concreet",
  "pattern_used": "string — welk PLN patroon zit hieronder",
  "expected_roas": number,
  "confidence": number,
  "timing": "string — concreet startadvies (bijv. 'Start vrijdag 18:00, 7 dagen lopen')",
  "budget": "string — dagbudget suggestie (bijv. '€25–€40/dag')",
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

    const raw = completion.choices[0].message.content.trim();
    const parsed = JSON.parse(raw);
    const ads = Array.isArray(parsed) ? parsed : (parsed.ads ?? parsed[Object.keys(parsed)[0]]);

    if (!Array.isArray(ads)) throw new Error('Geen ads array in GPT response');

    res.json({
      success: true,
      ads,
      usage: {
        input_tokens: completion.usage.prompt_tokens,
        output_tokens: completion.usage.completion_tokens,
        cache_creation_input_tokens: 0,
        cache_read_input_tokens: 0
      }
    });

  } catch (err) {
    console.error('[GPT-4o-mini ad fout]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PLN spec generatie (gpt-4o-mini) ─────────────────────────
app.post('/api/pln-spec', async (req, res) => {
  const { product, context } = req.body;

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ success: false, error: 'OPENAI_API_KEY niet ingesteld' });
  }

  // 1. Load performance atoms
  let perfAtoms = [];
  try {
    const files = await readdir(ATOMS_PERF_DIR);
    perfAtoms = await Promise.all(
      files.filter(f => f.endsWith('.json'))
           .map(async f => JSON.parse(await readFile(join(ATOMS_PERF_DIR, f), 'utf-8')))
    );
  } catch { /* directory not found */ }

  // 2. Load creative atoms
  let creativeAtoms = [];
  try {
    const files = await readdir(ATOMS_CREATIVE_DIR);
    creativeAtoms = await Promise.all(
      files.filter(f => f.endsWith('.json'))
           .map(async f => JSON.parse(await readFile(join(ATOMS_CREATIVE_DIR, f), 'utf-8')))
    );
  } catch { /* directory not found */ }

  // 3. Parse branding atoms from knowledge_graph.metta
  const brandingByAd = {};
  try {
    const kg = await readFile(KG_PATH, 'utf-8');
    for (const line of kg.split('\n')) {
      const m = line.match(/^\((\S+)\s+Ad_(\d+)\s+(\S+)\)$/);
      if (!m) continue;
      const [, pred, adId, val] = m;
      if (['tone','season','mood','product-category','visual-theme'].includes(pred)) {
        if (!brandingByAd[adId]) brandingByAd[adId] = {};
        brandingByAd[adId][pred] = val;
      }
    }
  } catch { /* KG not built yet */ }

  // 4. Build enriched atom index (perf + branding), top 40 by impressions
  const perfById = Object.fromEntries(perfAtoms.map(p => [p.ad_id, p]));
  const creativeById = Object.fromEntries(creativeAtoms.map(c => [c.ad_id, c]));

  const enriched = Object.keys(perfById)
    .map(adId => {
      const p = perfById[adId];
      const c = creativeById[adId] ?? {};
      const b = brandingByAd[adId] ?? {};
      return {
        ad_id: adId,
        ctr: p.ctr, cpc: p.cpc, cpm: p.cpm,
        spend: p.spend, reach: p.reach, impressions: p.impressions,
        ...b,
        headline: c.headlines?.[0] ?? null,
        image_desc: c.images?.[0]?.description?.slice(0, 120) ?? null,
      };
    })
    .sort((a, b) => (b.impressions ?? 0) - (a.impressions ?? 0))
    .slice(0, 40);

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 1200,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a PLN (Probabilistic Logic Networks) reasoning engine for ad optimization.
Given an AtomSpace with real Meta ad performance and branding atoms, find patterns relevant to the advertiser's product and context.
Apply Modus Ponens: if ads with [branding attributes] perform well (low CPC, high CTR), and the new product fits those attributes, then those attributes predict success.
Return ONLY a JSON object with keys: elements (string[]), style (string), hook (string), tone (string), expected_roas (number), expected_cpc (number), confidence (number 0–1), reasoning (string — 2-3 sentences citing actual atom data), top_patterns (array of {formula, roas, confidence, n}), matched_ads (string[]).`,
        },
        {
          role: 'user',
          content: `Product: ${product}\nContext: ${context}\n\nAtomSpace (top 40 ads by impressions):\n${JSON.stringify(enriched, null, 0)}\n\nQuery: Which visual style, tone, season, and mood atoms correlate with CTR > 1.5 and CPC < €1.00 for this product context? Generate PLN spec.`,
        },
      ],
    });

    const spec = JSON.parse(completion.choices[0].message.content);
    res.json({ success: true, spec, performanceAtoms: perfAtoms });
  } catch (err) {
    console.error('[PLN spec fout]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Image generatie via DALL-E 3 (Node.js SDK) ───────────────
app.post('/api/generate-image', async (req, res) => {
  const { prompt } = req.body;

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ success: false, error: 'OPENAI_API_KEY niet ingesteld in .env' });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      size: '1024x1024',
      quality: 'standard',
      n: 1,
    });

    const imageUrl = response.data[0].url;
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) throw new Error(`Image download failed: ${imgRes.status}`);
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    const b64 = buffer.toString('base64');

    res.json({ success: true, imageBase64: b64, mimeType: 'image/png' });
  } catch (err) {
    console.error('[Image generatie fout]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── gpt-4o-mini Vision verificatie ───────────────────────────
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
            text: `Check which of these elements are present in the image: ${JSON.stringify(specElements)}. Return ONLY JSON: {"matched": bool, "matchPercent": number, "elementCheck": {"element": bool, ...}, "missing": [], "corrections": "short English correction prompt"}`,
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
});

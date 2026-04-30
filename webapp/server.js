/**
 * Growth Engine — server.js
 * Express server + Claude API proxy voor ad copy generatie
 */

import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdir, readFile } from 'fs/promises';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ATOMS_DIR = join(__dirname, '..', 'atoms', 'performance');

const app  = express();
const PORT = process.env.PORT || 8001;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ── Health check ─────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  const hasKey = !!process.env.ANTHROPIC_API_KEY;
  res.json({ ok: true, apiKey: hasKey });
});

// ── Ad generatie ─────────────────────────────────────────────
app.post('/api/generate', async (req, res) => {
  const { product, count, instructions, patterns, brandAtom } = req.body;

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ success: false, error: 'ANTHROPIC_API_KEY niet ingesteld in .env' });
  }

  const client = new Anthropic();

  // Systeem prompt (gecached — verandert niet per request)
  const systemPrompt = `Je bent een expert in direct-response advertenties voor premium lifestyle sieradenmerken in Nederland.
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
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 4096,
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' }   // prompt caching voor systeem prompt
        }
      ],
      messages: [{ role: 'user', content: userPrompt }]
    });

    const raw = message.content[0].text.trim();

    // Extraheer JSON array (ook als er per ongeluk tekst omheen staat)
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('Geen JSON array gevonden in Claude response');

    const ads = JSON.parse(match[0]);

    res.json({
      success: true,
      ads,
      usage: {
        input_tokens: message.usage.input_tokens,
        output_tokens: message.usage.output_tokens,
        cache_creation_input_tokens: message.usage.cache_creation_input_tokens ?? 0,
        cache_read_input_tokens: message.usage.cache_read_input_tokens ?? 0
      }
    });

  } catch (err) {
    console.error('[Claude API fout]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PLN spec generatie (gpt-4o-mini) ─────────────────────────
app.post('/api/pln-spec', async (req, res) => {
  const { product, context, creativeAtoms = [], commerceAtoms = [] } = req.body;

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ success: false, error: 'OPENAI_API_KEY niet ingesteld' });
  }

  let performanceAtoms = [];
  try {
    const files = await readdir(ATOMS_DIR);
    performanceAtoms = await Promise.all(
      files.filter(f => f.endsWith('.json'))
           .map(async f => JSON.parse(await readFile(join(ATOMS_DIR, f), 'utf-8')))
    );
  } catch { /* atoms map bestaat nog niet */ }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 1024,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `Je bent een PLN reasoning engine voor advertentie-optimalisatie. Analyseer Atomspace data en geef ALLEEN een JSON object terug met: elements (array), style, tone, hook, expected_roas (number), expected_cpc (number), confidence (number 0-1), reasoning (string), top_patterns (array van {formula, roas, confidence, n}).`,
        },
        {
          role: 'user',
          content: `Product: ${product}\nContext: ${context}\nPerformance atoms: ${JSON.stringify(performanceAtoms)}\nCreative atoms: ${JSON.stringify(creativeAtoms.slice(0, 5))}\nCommerce atoms: ${JSON.stringify(commerceAtoms.slice(0, 3))}\n\nVoer PLN Modus Ponens uit: welke visuele elementen + context correleren met ROAS>3.5 en CPC<€1.00?`,
        },
      ],
    });

    const spec = JSON.parse(completion.choices[0].message.content);
    res.json({ success: true, spec, performanceAtoms });
  } catch (err) {
    console.error('[PLN spec fout]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── DALL-E 3 beeld generatie ──────────────────────────────────
app.post('/api/generate-image', async (req, res) => {
  const { prompt } = req.body;

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ success: false, error: 'OPENAI_API_KEY niet ingesteld in .env' });
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const result = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      response_format: 'b64_json',
    });

    res.json({
      success: true,
      imageBase64: result.data[0].b64_json,
      mimeType: 'image/png',
    });
  } catch (err) {
    console.error('[DALL-E fout]', err.message);
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

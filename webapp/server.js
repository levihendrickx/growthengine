/**
 * Growth Engine — server.js
 * Express server + Claude API proxy voor ad copy generatie
 */

import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));
app.use('/assets', express.static(__dirname + '/assets'));
app.use('/images', express.static(__dirname + '/images'));

// ── Debug: check welke bestanden op server staan ─────────────
app.get('/api/debug-files', (_req, res) => {
  import('fs').then(fs => {
    const assets = fs.existsSync(__dirname + '/assets')
      ? fs.readdirSync(__dirname + '/assets')
      : 'MAP BESTAAT NIET';
    res.json({ __dirname, assets });
  });
});

// ── Auth callback — redirect na Google/Apple login ───────────
app.get('/auth/callback', (_req, res) => {
  res.sendFile(__dirname + '/auth-callback.html');
});

// ── Connect page — eerste scherm na inloggen ──────────────────
app.get('/connect', (_req, res) => {
  res.sendFile(__dirname + '/connect.html');
});

// ── Health check ─────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  const hasKey = !!process.env.ANTHROPIC_API_KEY;
  res.json({ ok: true, apiKey: hasKey });
});

// ── Supabase config (public keys only — safe to expose) ───────
app.get('/api/config', (_req, res) => {
  res.json({
    supabaseUrl:     process.env.SUPABASE_URL     || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  });
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

app.listen(PORT, () => {
  console.log(`\n  Growth Engine draait op → http://localhost:${PORT}\n`);
});

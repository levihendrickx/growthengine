/**
 * Growth Engine — server.js
 * Express server + Claude API proxy + Supabase JWT verification
 */

import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ── Auth callback route (must come before static middleware) ──
// Serves the PKCE / magic-link exchange page.
app.get('/auth/callback', (_req, res) => {
  res.sendFile(path.join(__dirname, 'auth-callback.html'));
});

// ── Placeholder legal pages ────────────────────────────────────
app.get('/terms',   (_req, res) => res.sendFile(path.join(__dirname, 'terms.html')));
app.get('/privacy', (_req, res) => res.sendFile(path.join(__dirname, 'privacy.html')));

// ── Static files ───────────────────────────────────────────────
app.use(express.static(__dirname));

// ── Public config for client-side Supabase init ───────────────
// Only exposes the anon key (designed to be public).
// The service-role key is never sent to the browser.
app.get('/api/config', (_req, res) => {
  res.json({
    supabaseUrl:     process.env.SUPABASE_URL     || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  });
});

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    ok:            true,
    apiKey:        !!process.env.ANTHROPIC_API_KEY,
    supabaseReady: !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
  });
});

// ── JWT verification middleware ───────────────────────────────
// Uses Supabase's own /auth/v1/user endpoint to validate the
// Bearer token — no extra npm packages needed.
async function requireAuth(req, res, next) {
  const SUPABASE_URL      = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

  // If Supabase is not yet configured, allow through in dev mode
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('[Auth] Supabase not configured — skipping JWT check (dev mode).');
    req.user = null;
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorised. Please sign in.' });
  }

  const token = authHeader.slice(7); // strip "Bearer "

  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey':        SUPABASE_ANON_KEY,
      },
    });

    if (!response.ok) {
      return res.status(401).json({ success: false, error: 'Session expired. Please sign in again.' });
    }

    req.user = await response.json();
    next();
  } catch (err) {
    console.error('[Auth] Token verification failed:', err.message);
    return res.status(500).json({ success: false, error: 'Auth check failed. Please try again.' });
  }
}

// ── Ad generatie (protected) ──────────────────────────────────
app.post('/api/generate', requireAuth, async (req, res) => {
  const { product, count, instructions, patterns, brandAtom } = req.body;

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ success: false, error: 'ANTHROPIC_API_KEY niet ingesteld in .env' });
  }

  const client = new Anthropic();

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
      system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: userPrompt }],
    });

    const raw   = message.content[0].text.trim();
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('Geen JSON array gevonden in Claude response');

    const ads = JSON.parse(match[0]);
    res.json({
      success: true,
      ads,
      usage: {
        input_tokens:                message.usage.input_tokens,
        output_tokens:               message.usage.output_tokens,
        cache_creation_input_tokens: message.usage.cache_creation_input_tokens ?? 0,
        cache_read_input_tokens:     message.usage.cache_read_input_tokens      ?? 0,
      },
    });
  } catch (err) {
    console.error('[Claude API fout]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n  Growth Engine draait op → http://localhost:${PORT}`);
  console.log(`  Supabase: ${process.env.SUPABASE_URL ? '✓ configured' : '✗ not configured (set SUPABASE_URL + SUPABASE_ANON_KEY)'}\n`);
});

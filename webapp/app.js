/* ═══════════════════════════════════════════════════════════
   GROWTH ENGINE — app.js
   Volledig gesimuleerde SPA · Claude API voor ad copy
   ═══════════════════════════════════════════════════════════ */

'use strict';

// ── STATE ─────────────────────────────────────────────────────
const state = {
  page: 'dashboard',
  generatedAds: [],
  apiOnline: false,
  pipelineRunning: false,
  uploadedRows: 0,
};

// ── SIMULATED DATA ────────────────────────────────────────────

const ATOMS = {
  creative: [
    { id:'cr_001', ad_id:'ad_001', beschrijving:'Vrouw van circa 30 jaar op strandbed. Zilveren armband aan linkerpols. Twee kinderen spelen op achtergrond. Warme, zonnige kleuren. Geen tekst in beeld.', headline:'Draag de zomer aan je pols', body:'Tijdloze elegantie voor elk avontuur aan zee.', cta:'Ontdek nu', datum:'2025-06-01' },
    { id:'cr_002', ad_id:'ad_003', beschrijving:'Jonge vrouw in wintertuin. Gouden ketting zichtbaar bij decolleté. Koel diffuus daglicht. Minimalistische achtergrond.', headline:'Goud dat blijft', body:'Voor de vrouw die weet wat ze wil.', cta:'Bekijk collectie', datum:'2025-12-05' },
    { id:'cr_003', ad_id:'ad_005', beschrijving:'Close-up van pols met drie stapelringen in zilver. Witte achtergrond. Scherpe schaduw op links. Vingers licht gekruist.', headline:'Jij, maar dan meer', body:'Stapel je verhaal. Ring voor ring.', cta:'Shop hier', datum:'2025-06-07' },
    { id:'cr_004', ad_id:'ad_006', beschrijving:'Twee vriendinnen op zonnig terras. Beiden dragen gouden oorbellen. Informele sfeer. Warm zomerlicht van opzij.', headline:'Dragen wat bij je past', body:'Oorbellen die altijd passen — bij jou en het moment.', cta:'Ontdek nu', datum:'2025-06-03' },
    { id:'cr_005', ad_id:'ad_002', beschrijving:'Productshot. Zilveren armband liggend op donker marmer. Strakke studiobelichting. Geen model. Minimalistische compositie.', headline:'Puur zilver. Puur jij.', body:'925 sterling zilver. Handgemaakt in Nederland.', cta:'Bestel vandaag', datum:'2025-06-01' },
    { id:'cr_006', ad_id:'ad_007', beschrijving:'Vrouw in lichte zomerjurk. Hand omhoog, haren los. Gouden ring zichtbaar. Bokeh achtergrond buiten.', headline:'Voor het gevoel van zomer', body:'Licht, warm, tijdloos. Net als deze zomer.', cta:'Bekijk collectie', datum:'2025-06-05' },
    { id:'cr_007', ad_id:'ad_008', beschrijving:'Halfopen cadeauverpakking. Zilveren ketting zichtbaar op beige zijdepapier. Lichtblauwe lint. Warme woonkamerachtergrond.', headline:'Het cadeau dat ze niet verwacht', body:'Geef haar iets wat ze elke dag draagt.', cta:'Bestel vandaag', datum:'2025-02-14' },
    { id:'cr_008', ad_id:'ad_004', beschrijving:'Strand tijdens zonsondergang. Close-up oorbel door loshangende haren. Roze-gouden lichtval. Geen tekst in beeld.', headline:'De avond begint bij jou', body:'Sieraden voor het gouden uur.', cta:'Ontdek nu', datum:'2025-06-07' },
  ],

  performance: [
    { id:'pf_001', ad_id:'ad_001', CTR:3.2, CPC:0.85, ROAS:4.2, spend:120.50, impressions:45200, campagne:'zomer_sale_2025', datum:'2025-06-01' },
    { id:'pf_002', ad_id:'ad_002', CTR:1.8, CPC:1.20, ROAS:2.8, spend:89.75,  impressions:31800, campagne:'zomer_sale_2025', datum:'2025-06-01' },
    { id:'pf_003', ad_id:'ad_003', CTR:4.5, CPC:0.62, ROAS:6.1, spend:210.00, impressions:78000, campagne:'retargeting_juni', datum:'2025-06-03' },
    { id:'pf_004', ad_id:'ad_004', CTR:1.1, CPC:2.10, ROAS:1.4, spend:55.30,  impressions:18400, campagne:'awareness_nieuw',  datum:'2025-06-05' },
    { id:'pf_005', ad_id:'ad_005', CTR:3.8, CPC:0.74, ROAS:5.3, spend:175.90, impressions:61000, campagne:'retargeting_juni', datum:'2025-06-07' },
    { id:'pf_006', ad_id:'ad_006', CTR:2.9, CPC:0.91, ROAS:3.9, spend:145.20, impressions:52300, campagne:'zomer_sale_2025', datum:'2025-06-03' },
    { id:'pf_007', ad_id:'ad_007', CTR:2.2, CPC:1.05, ROAS:3.1, spend:98.40,  impressions:37800, campagne:'awareness_nieuw',  datum:'2025-06-05' },
    { id:'pf_008', ad_id:'ad_008', CTR:5.1, CPC:0.55, ROAS:7.2, spend:280.00, impressions:95000, campagne:'valentijn_2025',   datum:'2025-02-14' },
  ],

  commerce: [
    { id:'cm_001', ad_id:'ad_001', utm_ad:'ad_001', orders:47,  revenue:2820,  conv_rate:10.4, aov:59.99,  product_id:'armband_zilver_42', datum:'2025-06-01' },
    { id:'cm_002', ad_id:'ad_003', utm_ad:'ad_003', orders:92,  revenue:5520,  conv_rate:11.8, aov:59.99,  product_id:'armband_zilver_42', datum:'2025-06-03' },
    { id:'cm_003', ad_id:'ad_005', utm_ad:'ad_005', orders:68,  revenue:12240, conv_rate:11.1, aov:179.99, product_id:'ketting_goud_58',   datum:'2025-06-07' },
    { id:'cm_004', ad_id:'ad_008', utm_ad:'ad_008', orders:127, revenue:7620,  conv_rate:13.4, aov:59.99,  product_id:'armband_zilver_42', datum:'2025-02-14' },
    { id:'cm_005', ad_id:'ad_006', utm_ad:'ad_006', orders:55,  revenue:9900,  conv_rate:10.6, aov:179.99, product_id:'ketting_goud_58',   datum:'2025-06-03' },
  ],

  days: [
    { datum:'2025-06-01', seizoen:'Zomer', dag:'Zondag',    weer:'Zonnig',        temp:24, feestdag:null },
    { datum:'2025-06-03', seizoen:'Zomer', dag:'Dinsdag',   weer:'Half bewolkt',  temp:20, feestdag:null },
    { datum:'2025-06-05', seizoen:'Zomer', dag:'Donderdag', weer:'Bewolkt',       temp:17, feestdag:'Hemelvaartsdag' },
    { datum:'2025-06-07', seizoen:'Zomer', dag:'Zaterdag',  weer:'Zonnig',        temp:26, feestdag:null },
    { datum:'2025-02-14', seizoen:'Winter',dag:'Vrijdag',   weer:'Bewolkt',       temp:6,  feestdag:'Valentijnsdag' },
  ],

  brand: {
    id:'brand_01',
    naam:'Auris Jewelry',
    kleuren:['#1a1a2e','#c9a84c','#f5f0e8'],
    kleur_namen:['Nachtblauw','Goud','Crème'],
    fonts:['Syne','DM Mono'],
    tone:'Elegant, warm, authentiek — nooit hard-sell',
    logo_ref:'logo.svg',
    producten:['Zilveren armband','Gouden ketting','Diamanten oorbellen','Stapelringen'],
    prijsrange:'€39 – €289',
    doelgroep:'Vrouwen 25–45, lifestyle-gericht, cadeaukopers, NL + BE',
  },
};

const PATTERNS = [
  { id:'pat_001', formula:'lifestyle + weekend + zomer',           roas:4.2, confidence:0.88, n:23, ctr:'+18%', desc:'Lifestyle beeldtaal in zomerse setting scoort optimaal op weekenden.',          atoms:['cr_001','cr_004','pf_001','pf_005'], datum:'2025-06-10' },
  { id:'pat_002', formula:'armband zilver + strand + zomer',        roas:3.8, confidence:0.84, n:18, ctr:'+14%', desc:'Zilver + strandcontext is de beste seizoenscombinatie voor juni–augustus.',     atoms:['cr_001','cr_008','pf_001'],          datum:'2025-06-08' },
  { id:'pat_003', formula:'model + product + warm licht',           roas:4.6, confidence:0.82, n:15, ctr:'+27%', desc:'Warme verlichting op model + sieraad gecombineerd werkt consistent sterk.',    atoms:['cr_002','cr_006','pf_003'],          datum:'2025-05-15' },
  { id:'pat_004', formula:'Valentijn dag −10 starten',              roas:5.1, confidence:0.84, n:6,  ctr:'+40%', desc:'10 dagen voor Valentijn starten geeft 40% hogere ROAS dan dag −3.',            atoms:['pf_008','dag_2025-02-14'],           datum:'2025-02-04' },
  { id:'pat_005', formula:'gouden ketting + winter + cadeau-framing',roas:3.8, confidence:0.79, n:11, ctr:'+31%', desc:'Gouden kettingen presteren sterk in winter met expliciete cadeaucontext.',    atoms:['cr_007','pf_008','cm_004'],          datum:'2025-12-01' },
  { id:'pat_006', formula:'zaterdag 18:00 publicatie + lifestyle',   roas:4.1, confidence:0.77, n:12, ctr:'+23%', desc:'Publicaties op zaterdagavond hebben het hoogste weekend-bereik.',             atoms:['pf_005','dag_2025-06-07'],           datum:'2025-06-07' },
  { id:'pat_007', formula:'product close-up + minimale tekst',       roas:3.2, confidence:0.75, n:19, ctr:'+8%',  desc:'Strakke productshots zonder decoratie werken goed als retargetingformaat.',   atoms:['cr_005','pf_002','cm_001'],          datum:'2025-06-15' },
  { id:'pat_008', formula:'urgency + feestdag −3 dagen',             roas:2.9, confidence:0.71, n:14, ctr:'+22%', desc:'Urgency copy vlak voor feestdag: hoge CTR maar lagere conversieratio.',       atoms:['cr_007','pf_008','dag_2025-02-14'], datum:'2025-05-20' },
  { id:'pat_009', formula:'stapelringen + persoonlijkheid hook',      roas:3.4, confidence:0.67, n:8,  ctr:'+19%', desc:'Persoonlijkheidsframes werken goed bij stapelringen voor het 25–35 segment.',atoms:['cr_003','pf_005'],                   datum:'2025-06-20' },
];

// Fallback ads als Claude API niet beschikbaar is
const FALLBACK_ADS = [
  { headline:'Draag de zomer aan je pols', body:'De zilveren armband die elk seizoen meegaat. Puur. Tijdloos. Jij.', cta:'Ontdek nu', image_prompt:'Woman on sunny beach, silver bracelet on wrist, warm golden tones, editorial style', pattern_used:'lifestyle + weekend + zomer', expected_roas:4.1, confidence:0.88, timing:'Start vrijdag 18:00, 7 dagen lopen', budget:'€30–€45/dag', atoms_used:['Creative atom','Performance atom','Dag atom'] },
  { headline:'Goud dat altijd past', body:'Een gouden ketting die ze elke dag opnieuw kiest. Cadeau met betekenis.', cta:'Bekijk collectie', image_prompt:'Close-up gold necklace on woman, warm afternoon light, lifestyle setting, soft bokeh', pattern_used:'gouden ketting + winter + cadeau-framing', expected_roas:3.9, confidence:0.79, timing:'Start 10 dagen voor Valentijn', budget:'€40–€60/dag', atoms_used:['Creative atom','Commerce atom','Dag atom'] },
  { headline:'Jij, maar dan meer', body:'Stapel je eigen verhaal. Ring voor ring, dag voor dag.', cta:'Shop hier', image_prompt:'Close-up wrist with stacked silver rings, white background, sharp shadow detail', pattern_used:'stapelringen + persoonlijkheid hook', expected_roas:3.3, confidence:0.67, timing:'Flexibel — test dinsdag/woensdag', budget:'€20–€30/dag', atoms_used:['Creative atom','Performance atom'] },
];

// ── UTILS ─────────────────────────────────────────────────────
const delay = ms => new Promise(r => setTimeout(r, ms));
const $ = sel => document.querySelector(sel);
const fmt = (n, dec=1) => typeof n==='number' ? n.toFixed(dec) : n;
const fmtEur = n => `€${(+n).toLocaleString('nl-NL', {minimumFractionDigits:2, maximumFractionDigits:2})}`;
const fmtK = n => n >= 1000 ? `${(n/1000).toFixed(1)}k` : n;

function confClass(c) {
  if (c >= 0.80) return 'cb-high';
  if (c >= 0.65) return 'cb-mid';
  return 'cb-low';
}
function confColor(c) {
  if (c >= 0.80) return 'var(--green)';
  if (c >= 0.65) return 'var(--amber)';
  return 'var(--purple)';
}
function roasClass(r) {
  if (r >= 4.0) return 'td-green';
  if (r >= 2.5) return '';
  return 'td-coral';
}

// ── ROAS TREND DATA ───────────────────────────────────────────
function buildROASData() {
  const data = []; let v = 3.2;
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    v += (Math.random() - 0.46) * 0.38;
    v = Math.max(1.8, Math.min(6.4, v));
    data.push({
      label: d.toLocaleDateString('nl-NL', { day:'numeric', month:'short' }),
      value: +v.toFixed(2),
    });
  }
  return data;
}
const ROAS_DATA = buildROASData();

// ── SVG LINE CHART ────────────────────────────────────────────
function renderLineChart(el, data, color = '#6d28d9') {
  const W = el.clientWidth || 600;
  const H = 160;
  const pad = { t:10, r:10, b:28, l:34 };
  const cw = W - pad.l - pad.r;
  const ch = H - pad.t - pad.b;

  const vals = data.map(d => d.value);
  const minV = Math.min(...vals) * 0.92;
  const maxV = Math.max(...vals) * 1.05;

  const xs = i  => (i / (data.length - 1)) * cw;
  const ys = v  => ch - ((v - minV) / (maxV - minV)) * ch;

  const pts    = data.map((d,i) => `${xs(i).toFixed(1)},${ys(d.value).toFixed(1)}`).join(' ');
  const areaPts= `0,${ch} ${pts} ${cw},${ch}`;

  // Tick labels (every 5)
  const ticks = data.map((d,i) => i % 6 === 0
    ? `<text x="${xs(i).toFixed(1)}" y="${ch+17}" text-anchor="middle" font-family="DM Mono" font-size="9" fill="#888">${d.label}</text>`
    : ''
  ).join('');

  // Y grid + labels
  const yGrid = [0.25,0.5,0.75,1].map(t => {
    const yy = (ch * (1-t)).toFixed(1);
    const lv = (minV + (maxV - minV) * t).toFixed(1);
    return `
      <line x1="0" y1="${yy}" x2="${cw}" y2="${yy}" stroke="rgba(0,0,0,0.05)" stroke-width="1"/>
      <text x="-5" y="${(+yy+3.5).toFixed(1)}" text-anchor="end" font-family="DM Mono" font-size="9" fill="#999">${lv}</text>`;
  }).join('');

  // Dots on every 5th point
  const dots = data.filter((_,i)=>i%5===0).map((_,idx)=>{
    const i = idx*5;
    return `<circle cx="${xs(i).toFixed(1)}" cy="${ys(data[i].value).toFixed(1)}" r="3" fill="${color}" stroke="#fff" stroke-width="1.5"/>`;
  }).join('');

  // Path length trick for animation
  const id = 'cg' + Math.random().toString(36).slice(2,6);

  el.innerHTML = `
  <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.18"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <g transform="translate(${pad.l},${pad.t})">
      ${yGrid}
      <polygon points="${areaPts}" fill="url(#${id})"/>
      <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round"
        style="animation:fadeInFast .8s ease"/>
      ${dots}
      ${ticks}
    </g>
  </svg>`;
}

// ── NAVIGATION ────────────────────────────────────────────────
function navigate(page) {
  state.page = page;
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });
  renderPage(page);
}

function renderPage(page) {
  const el = $('#page-container');
  el.innerHTML = '';
  const map = { home:renderHome, dashboard:renderDashboard, bronnen:renderBronnen, atomspace:renderAtomspace, pln:renderPLN, pipeline:renderPipeline, genereren:renderGenereren, output:renderOutput };
  if (map[page]) map[page](el);
}

// ═══════════════════════════════════════════════════════════════
// PAGE 1 — DASHBOARD
// ═══════════════════════════════════════════════════════════════
function renderDashboard(el) {
  const avgROAS = (ROAS_DATA.reduce((s,d)=>s+d.value,0)/ROAS_DATA.length).toFixed(2);
  const totalSpend = ATOMS.performance.reduce((s,a)=>s+a.spend,0);
  const totalAtoms = ATOMS.creative.length + ATOMS.performance.length + ATOMS.commerce.length + ATOMS.days.length + 1;

  el.innerHTML = `
  <div class="page-header fade">
    <div class="page-title">Dashboard</div>
    <div class="page-sub">Gesimuleerde Meta prestaties · ${new Date().toLocaleDateString('nl-NL',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>
  </div>
  <div class="page-content">

    <div class="kpi-grid">
      <div class="kpi c-purple fade fade-1">
        <div class="kpi-label">Gem. ROAS (30d)</div>
        <div class="kpi-value">${avgROAS}×</div>
        <div class="kpi-delta up">↑ +0.4 vs. vorige maand</div>
      </div>
      <div class="kpi c-teal fade fade-2">
        <div class="kpi-label">Totaal spend</div>
        <div class="kpi-value">${fmtEur(totalSpend)}</div>
        <div class="kpi-delta up">↑ +12% vs. vorige maand</div>
      </div>
      <div class="kpi c-blue fade fade-3">
        <div class="kpi-label">Actieve atoms</div>
        <div class="kpi-value">${totalAtoms}</div>
        <div class="kpi-delta up">↑ +8 deze week</div>
      </div>
      <div class="kpi c-green fade fade-4">
        <div class="kpi-label">PLN patronen</div>
        <div class="kpi-value">${PATTERNS.length}</div>
        <div class="kpi-delta up">↑ +3 nieuwe patronen</div>
      </div>
    </div>

    <div class="g2-1" style="margin-bottom:14px">
      <div class="card fade fade-2">
        <div class="card-hd">
          <div class="card-title">ROAS trend — afgelopen 30 dagen</div>
          <span class="tag t-purple">Gesimuleerd</span>
        </div>
        <div class="chart-wrap" id="roas-chart"></div>
      </div>
      <div class="card fade fade-3">
        <div class="card-hd"><div class="card-title">Recente activiteit</div></div>
        ${renderActivity()}
      </div>
    </div>

    <div class="g5 fade fade-3">
      ${atomSummaryCard('Creative','cr','ac-purple',ATOMS.creative.length,'Afbeelding-beschrijvingen')}
      ${atomSummaryCard('Performance','pf','ac-blue',ATOMS.performance.length,'CTR · CPC · ROAS · spend')}
      ${atomSummaryCard('Commerce','cm','ac-teal',ATOMS.commerce.length,'Orders · revenue · AOV')}
      ${atomSummaryCard('Dag','dag','ac-green',ATOMS.days.length,'Weer · seizoen · feestdag')}
      ${atomSummaryCard('Brand','brand','ac-coral',1,'Tone · kleuren · doelgroep')}
    </div>

    <div class="card fade fade-4" style="margin-top:14px">
      <div class="card-hd">
        <div class="card-title">Top ads — gesimuleerde prestaties</div>
        <span class="tag t-blue">Meta CSV</span>
      </div>
      <table class="mini-table">
        <thead><tr>
          <th>Ad ID</th><th>Campagne</th><th>Datum</th>
          <th>CTR</th><th>CPC</th><th>ROAS</th><th>Spend</th><th>Impressies</th>
        </tr></thead>
        <tbody>
          ${[...ATOMS.performance].sort((a,b)=>b.ROAS-a.ROAS).map(p=>`
          <tr>
            <td class="td-hi">${p.ad_id}</td>
            <td>${p.campagne}</td>
            <td>${p.datum}</td>
            <td>${p.CTR}%</td>
            <td>${fmtEur(p.CPC)}</td>
            <td class="${roasClass(p.ROAS)}">${p.ROAS}×</td>
            <td>${fmtEur(p.spend)}</td>
            <td>${fmtK(p.impressions)}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;

  // Chart rendering na DOM insert
  setTimeout(() => {
    const chartEl = $('#roas-chart');
    if (chartEl) renderLineChart(chartEl, ROAS_DATA);
  }, 50);
}

function atomSummaryCard(name, prefix, cls, count, desc) {
  return `
  <div class="card" style="padding:16px 16px">
    <div class="card-label">${name} atom</div>
    <div style="font-size:22px;font-weight:800;letter-spacing:-1px;margin-bottom:4px">${count}</div>
    <div style="font-family:var(--mono);font-size:10px;color:var(--text-3)">${desc}</div>
  </div>`;
}

function renderActivity() {
  const items = [
    { dot:'var(--green)',  text:'8 nieuwe performance atoms geladen vanuit CSV',      time:'2 minuten geleden' },
    { dot:'var(--purple)', text:'PLN detecteerde nieuw patroon: conf 0.77',           time:'14 minuten geleden' },
    { dot:'var(--blue)',   text:'3 ads gegenereerd voor Zilveren Armband',             time:'1 uur geleden' },
    { dot:'var(--amber)',  text:'Verificatieloop 1 keurde 2 prompts opnieuw goed',     time:'2 uur geleden' },
    { dot:'var(--teal)',   text:'Shopify orders gesynchroniseerd — 55 nieuwe orders',  time:'3 uur geleden' },
  ];
  return items.map(a=>`
  <div class="activity-item">
    <div class="act-dot" style="background:${a.dot}"></div>
    <div>
      <div class="act-text">${a.text}</div>
      <div class="act-time">${a.time}</div>
    </div>
  </div>`).join('');
}

// ═══════════════════════════════════════════════════════════════
// PAGE 2 — BRONNEN
// ═══════════════════════════════════════════════════════════════
function renderBronnen(el) {
  el.innerHTML = `
  <div class="page-header fade">
    <div class="page-title">Bronnen</div>
    <div class="page-sub">Laag 01 — data-ingest · alle bronnen gesimuleerd behalve eigen CSV upload</div>
  </div>
  <div class="page-content">

    <div class="source-grid fade fade-1">
      ${sourceCard('Meta','Meta CSV','ad_id · CTR · CPC · ROAS · spend · impressions','8 advertenties','Sync: 2 min geleden','pill-sim','Gesimuleerd')}
      ${sourceCard('Meta','Meta API','creative_id → image_url · headline · body · CTA','8 creatives','Sync: 2 min geleden','pill-sim','Gesimuleerd')}
      ${sourceCard('Shopify','Shopify API','orders · utm_ad · revenue · AOV · conv_rate','5 order-sets','Sync: 1 uur geleden','pill-sim','Gesimuleerd')}
      ${sourceCard('Temporeel','Weer + Kalender','Open-Meteo · Nager.Date feestdagen · seizoen · dag','5 dag-atoms','Sync: dagelijks','pill-sim','Gesimuleerd')}
      ${sourceCard('Branding','Branding input','kleuren · fonts · tone · doelgroep · prijsrange','1 brand atom','Eenmalig','pill-static','Statisch')}
    </div>

    <div class="card fade fade-2">
      <div class="card-hd">
        <div class="card-title">Upload eigen Meta CSV</div>
        <span class="tag t-blue">Laag 01 → Laag 02</span>
      </div>
      <div class="upload-zone" id="upload-zone">
        <div class="upload-icon">📂</div>
        <div class="upload-title">Sleep je Meta exportbestand hierheen</div>
        <div class="upload-sub">CSV met kolommen: ad_id, CTR, CPC, ROAS, spend, impressions, campagne, datum</div>
        <button class="btn-upload" id="upload-btn">Bestand kiezen</button>
        <input type="file" id="file-input" accept=".csv">
      </div>
      <div class="upload-result" id="upload-result"></div>
    </div>

    <div class="g2 fade fade-3" style="margin-top:14px">
      <div class="card">
        <div class="card-hd"><div class="card-title">Laag 02 — verwerking per bron</div></div>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${processingStep('Parse metrics','CSV → gestructureerde data per ad_id','var(--blue)')}
          ${processingStep('Download afbeeldingen','image_url → images/ad_id.jpg lokaal opslaan','var(--blue)')}
          ${processingStep('Parse Shopify orders','utm_ad · revenue · AOV · conv_rate','var(--teal)')}
          ${processingStep('Dag atom aanmaken','datum als sleutel · seizoen · weer · feestdag','var(--green)')}
          ${processingStep('Branding parser','LLM extraheert kleuren · fonts · tone uit brandboek','var(--coral)')}
        </div>
      </div>
      <div class="card">
        <div class="card-hd"><div class="card-title">Laag 03 — Vision LLM</div></div>
        <div class="notice notice-amber" style="margin-bottom:12px">GPT-4o Vision / Claude 3.5 Sonnet — gesimuleerd</div>
        <div style="font-family:var(--mono);font-size:11px;color:var(--text-2);line-height:1.7">
          Elke ad-afbeelding wordt eenmalig beschreven. De LLM beschrijft <em>alleen</em> wat letterlijk zichtbaar is — geen interpretatie, geen oordeel.
        </div>
        <div style="margin-top:14px;padding:12px 14px;background:var(--amber-s);border-left:3px solid var(--amber);border-radius:0 6px 6px 0;font-family:var(--mono);font-size:11px;color:var(--text-2);line-height:1.7;font-style:italic">
          "Vrouw van circa 30 jaar op strandbed. Zilveren armband aan linkerpols. Twee kinderen spelen op achtergrond. Zonnige dag, warme kleuren. Geen tekst zichtbaar."
        </div>
        <div style="font-family:var(--mono);font-size:10px;color:var(--text-3);margin-top:10px">8 afbeeldingen beschreven · opgeslagen in creative atoms</div>
      </div>
    </div>
  </div>`;

  // Drag-drop + click upload
  const zone = $('#upload-zone');
  const btn  = $('#upload-btn');
  const inp  = $('#file-input');
  const result = $('#upload-result');

  btn.addEventListener('click', e => { e.stopPropagation(); inp.click(); });
  zone.addEventListener('click', () => inp.click());
  inp.addEventListener('change', e => handleUpload(e.target.files[0], result));

  zone.addEventListener('dragover',  e => { e.preventDefault(); zone.classList.add('over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('over'));
  zone.addEventListener('drop',      e => { e.preventDefault(); zone.classList.remove('over'); handleUpload(e.dataTransfer.files[0], result); });
}

function sourceCard(type, title, desc, records, sync, pillClass, pillLabel) {
  return `
  <div class="source-card">
    <div class="card-label" style="margin-bottom:5px">${type}</div>
    <h3>${title}</h3>
    <div class="source-metric">${desc.split('·').map(s=>`<div>— ${s.trim()}</div>`).join('')}</div>
    <div class="source-metric" style="margin-top:6px"><span>Records:</span> ${records}</div>
    <div class="source-metric"><span>Sync:</span> ${sync}</div>
    <div class="status-pill ${pillClass}"><span class="pill-dot"></span>${pillLabel}</div>
  </div>`;
}

function processingStep(title, desc, color) {
  return `
  <div style="display:flex;gap:10px;align-items:flex-start;padding:8px 0;border-bottom:1px solid var(--border)">
    <div style="width:3px;height:36px;background:${color};border-radius:2px;flex-shrink:0;margin-top:2px"></div>
    <div>
      <div style="font-size:12px;font-weight:700;margin-bottom:2px">${title}</div>
      <div style="font-family:var(--mono);font-size:10px;color:var(--text-3)">${desc}</div>
    </div>
  </div>`;
}

function handleUpload(file, resultEl) {
  if (!file || !file.name.endsWith('.csv')) {
    resultEl.style.display = 'block';
    resultEl.className = 'upload-result notice notice-coral';
    resultEl.textContent = 'Alleen .csv bestanden worden geaccepteerd.';
    return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    const lines = e.target.result.trim().split('\n').filter(Boolean);
    const rows  = lines.length - 1; // minus header
    state.uploadedRows = rows;
    resultEl.style.display = 'block';
    resultEl.className = 'upload-result notice notice-green';
    resultEl.innerHTML = `✓ <strong>${file.name}</strong> geladen · ${rows} advertenties · ${lines[0]}<br>
      Atoms worden aangemaakt in <code>atoms/performance/</code> — ${rows} JSON bestanden klaar.`;
  };
  reader.readAsText(file);
}

// ═══════════════════════════════════════════════════════════════
// PAGE 3 — ATOMSPACE
// ═══════════════════════════════════════════════════════════════
function renderAtomspace(el) {
  el.innerHTML = `
  <div class="page-header fade">
    <div class="page-title">Atomspace</div>
    <div class="page-sub">Laag 05 — gecombineerde kennisbasis · ${ATOMS.creative.length + ATOMS.performance.length + ATOMS.commerce.length + ATOMS.days.length + 1} atoms geladen</div>
  </div>
  <div class="page-content">

    <div class="atom-columns fade fade-1">
      ${atomColumn('Creative','Per ad','ac-purple',ATOMS.creative,'cr','beschrijving')}
      ${atomColumn('Performance','Per ad','ac-blue',ATOMS.performance,'pf','campagne')}
      ${atomColumn('Commerce','Per ad → Shopify','ac-teal',ATOMS.commerce,'cm','product_id')}
      ${atomColumn('Dag','Gedeeld per datum','ac-green',ATOMS.days,'dag','weer')}
      ${atomColumnBrand()}
    </div>

    <div class="atom-connections fade fade-3" style="margin-top:14px">
      <div class="conn-label">Koppelingen in de Atomspace</div>
      <div class="conn-row">
        <div class="conn-item"><span style="color:var(--purple)">creative</span> <span class="conn-via">↔</span> <span style="color:var(--blue)">performance</span> <em style="color:var(--text-3);font-family:var(--mono);font-size:10px"> via ad_id</em></div>
        <div class="conn-item" style="color:var(--text-3);font-family:var(--mono);font-size:11px">·</div>
        <div class="conn-item"><span style="color:var(--blue)">performance</span> <span class="conn-via">↔</span> <span style="color:var(--teal)">commerce</span> <em style="color:var(--text-3);font-family:var(--mono);font-size:10px"> via ad_id + utm_ad</em></div>
        <div class="conn-item" style="color:var(--text-3);font-family:var(--mono);font-size:11px">·</div>
        <div class="conn-item"><span style="color:var(--text-2)">alle atoms</span> <span class="conn-via">↔</span> <span style="color:var(--green)">dag atom</span> <em style="color:var(--text-3);font-family:var(--mono);font-size:10px"> via datum</em></div>
        <div class="conn-item" style="color:var(--text-3);font-family:var(--mono);font-size:11px">·</div>
        <div class="conn-item"><span style="color:var(--teal)">commerce</span> <span class="conn-via">↔</span> <span style="color:var(--text-2)">product</span> <em style="color:var(--text-3);font-family:var(--mono);font-size:10px"> via product_id</em></div>
      </div>
    </div>

    <div class="card fade fade-4" style="margin-top:14px">
      <div class="card-hd">
        <div class="card-title">Brand atom — statisch · buiten PLN analyse</div>
        <span class="tag t-coral">Eenmalig</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0">
        ${infoRow('Merk',ATOMS.brand.naam)}
        ${infoRow('Tone of voice',ATOMS.brand.tone)}
        ${infoRow('Doelgroep',ATOMS.brand.doelgroep)}
        ${infoRow('Producten',ATOMS.brand.producten.join(' · '))}
        ${infoRow('Prijsrange',ATOMS.brand.prijsrange)}
        ${infoRow('Fonts',ATOMS.brand.fonts.join(', '))}
        ${infoRow('Kleuren', ATOMS.brand.kleuren.map((c,i)=>`<span class="color-dot" style="background:${c}"></span>${ATOMS.brand.kleur_namen[i]}`).join(' &nbsp;'))}
      </div>
    </div>
  </div>`;
}

function atomColumn(name, sub, cls, items, prefix, snippetKey) {
  const rows = items.map(a => `
  <div class="atom-item">
    <div class="atom-id">${a.id}</div>
    <div class="atom-snippet">${a[snippetKey] ?? ''}</div>
  </div>`).join('');

  return `
  <div class="atom-col ${cls}">
    <div class="atom-col-hd">
      <div class="atom-col-label">${sub}</div>
      <div class="atom-col-title">${name} atom</div>
      <div class="atom-col-count">${items.length} records</div>
    </div>
    <div>${rows}</div>
  </div>`;
}

function atomColumnBrand() {
  const b = ATOMS.brand;
  return `
  <div class="atom-col ac-coral">
    <div class="atom-col-hd">
      <div class="atom-col-label">Eenmalig · statisch</div>
      <div class="atom-col-title">Brand atom</div>
      <div class="atom-col-count">1 record</div>
    </div>
    <div class="atom-item">
      <div class="atom-id">${b.id}</div>
      <div class="atom-snippet">${b.naam} · ${b.tone.slice(0,40)}…</div>
    </div>
    <div class="atom-item">
      <div class="atom-id">kleuren</div>
      <div class="atom-snippet">${b.kleuren.join(', ')}</div>
    </div>
    <div class="atom-item">
      <div class="atom-id">doelgroep</div>
      <div class="atom-snippet">${b.doelgroep}</div>
    </div>
    <div class="atom-item">
      <div class="atom-id">producten</div>
      <div class="atom-snippet">${b.producten.join(' · ')}</div>
    </div>
  </div>`;
}

function infoRow(lbl, val) {
  return `
  <div class="info-row">
    <div class="ir-lbl">${lbl}</div>
    <div class="ir-val">${val}</div>
  </div>`;
}

// ═══════════════════════════════════════════════════════════════
// PAGE 4 — PLN ANALYSE
// ═══════════════════════════════════════════════════════════════
function renderPLN(el) {
  el.innerHTML = `
  <div class="page-header fade">
    <div class="page-title">PLN Analyse</div>
    <div class="page-sub">Laag 06 — gesimuleerde patroonherkenning op basis van alle atoms · ${PATTERNS.length} actieve patronen</div>
  </div>
  <div class="page-content">

    <div class="g2-1 fade fade-1" style="margin-bottom:14px">
      <div class="card">
        <div class="card-hd"><div class="card-title">Wat PLN doet</div></div>
        <div style="font-family:var(--mono);font-size:11px;color:var(--text-2);line-height:1.8">
          PLN (Probabilistic Logic Networks) redeneert <em>continu</em> over alle atoms in de Atomspace. Het detecteert patronen,
          berekent confidence scores en signaleert kansen. Brand atom staat buiten de analyse — wordt pas actief bij output.
        </div>
        <div style="margin-top:14px;display:flex;gap:10px">
          <div class="kpi c-purple" style="flex:1;padding:12px 14px">
            <div class="kpi-label" style="font-size:9px">Gem. confidence</div>
            <div class="kpi-value" style="font-size:20px">${(PATTERNS.reduce((s,p)=>s+p.confidence,0)/PATTERNS.length).toFixed(2)}</div>
          </div>
          <div class="kpi c-green" style="flex:1;padding:12px 14px">
            <div class="kpi-label" style="font-size:9px">Gem. ROAS</div>
            <div class="kpi-value" style="font-size:20px">${(PATTERNS.reduce((s,p)=>s+p.roas,0)/PATTERNS.length).toFixed(1)}×</div>
          </div>
          <div class="kpi c-blue" style="flex:1;padding:12px 14px">
            <div class="kpi-label" style="font-size:9px">Totaal observaties</div>
            <div class="kpi-value" style="font-size:20px">${PATTERNS.reduce((s,p)=>s+p.n,0)}</div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-hd"><div class="card-title">Confidence tiers</div></div>
        ${tierRow('Bewezen','conf > 0.80','var(--green)',PATTERNS.filter(p=>p.confidence>=0.80).length)}
        ${tierRow('Sterk','conf 0.65–0.79','var(--amber)',PATTERNS.filter(p=>p.confidence>=0.65&&p.confidence<0.80).length)}
        ${tierRow('Potentieel','conf 0.50–0.64','var(--purple)',PATTERNS.filter(p=>p.confidence<0.65).length)}
      </div>
    </div>

    <div class="filter-bar fade fade-2">
      <div class="filter-lbl">Min. confidence</div>
      <input type="range" class="filter-slider" id="conf-slider" min="0" max="0.95" step="0.01" value="0">
      <div class="filter-val" id="conf-val">0.00</div>
      <div class="filter-count" id="conf-count">${PATTERNS.length} patronen zichtbaar</div>
    </div>

    <div class="pattern-grid fade fade-3" id="pattern-grid">
      ${PATTERNS.map(p => patternCard(p)).join('')}
    </div>
  </div>`;

  // Slider
  const slider = $('#conf-slider');
  const valEl  = $('#conf-val');
  const cntEl  = $('#conf-count');
  slider.addEventListener('input', () => {
    const threshold = parseFloat(slider.value);
    valEl.textContent = threshold.toFixed(2);
    let vis = 0;
    document.querySelectorAll('.pcard').forEach(card => {
      const c = parseFloat(card.dataset.conf);
      const show = c >= threshold;
      card.classList.toggle('hidden', !show);
      if (show) vis++;
    });
    cntEl.textContent = `${vis} patroon${vis!==1?'en':''} zichtbaar`;
  });

  // Animate confidence bars
  setTimeout(() => {
    document.querySelectorAll('.conf-fill').forEach(bar => {
      bar.style.width = bar.dataset.width;
    });
  }, 100);
}

function tierRow(label, sub, color, count) {
  return `
  <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)">
    <div>
      <div style="font-size:13px;font-weight:700;color:${color}">${label}</div>
      <div style="font-family:var(--mono);font-size:10px;color:var(--text-3)">${sub}</div>
    </div>
    <div style="font-family:var(--mono);font-size:20px;font-weight:500;color:${color}">${count}</div>
  </div>`;
}

function patternCard(p) {
  const pct = (p.confidence * 100).toFixed(0);
  const roasCls = p.roas >= 4.0 ? 'roas-hi' : p.roas < 2.5 ? 'td-coral' : '';
  return `
  <div class="pcard" data-conf="${p.confidence}">
    <div class="pcard-formula">"${p.formula}"</div>
    <div class="pcard-metrics">
      <div class="pm"><div class="lbl">ROAS</div><div class="val ${roasCls}">${p.roas}×</div></div>
      <div class="pm"><div class="lbl">Conf.</div><div class="val">${p.confidence}</div></div>
      <div class="pm"><div class="lbl">N</div><div class="val">${p.n}</div></div>
      <div class="pm"><div class="lbl">CTR</div><div class="val">${p.ctr}</div></div>
    </div>
    <div class="conf-bar">
      <div class="conf-fill" data-width="${pct}%" style="width:0%;background:${confColor(p.confidence)}"></div>
    </div>
    <div class="pcard-desc">${p.desc}</div>
    <div class="pcard-atoms">${p.atoms.map(a=>`<span class="atom-tag">${a}</span>`).join('')}</div>
  </div>`;
}

// ═══════════════════════════════════════════════════════════════
// PAGE 5 — GENEREREN
// ═══════════════════════════════════════════════════════════════
const PIPELINE_STEPS = [
  { id:'spec',   num:'01', layer:'Laag 08', title:'Spec generatie',       desc:'PLN doorzoekt Atomspace op atoms die passen bij het product, seizoen en dag.' },
  { id:'prompt', num:'02', layer:'Laag 09', title:'Prompt generatie',     desc:'Spec wordt vertaald naar image prompts + copy brief per advertentie.' },
  { id:'ver1',   num:'03', layer:'Laag 10', title:'Verificatieloop 1',    desc:'Elke prompt gecontroleerd op spec-naleving, tone of voice en hallucinaties.' },
  { id:'image',  num:'04', layer:'Laag 11', title:'Image generatie',      desc:'Goedgekeurde prompts + image_ref naar generator (placeholder in POC).' },
  { id:'ver2',   num:'05', layer:'Laag 12', title:'Verificatieloop 2',    desc:'Vision LLM controleert of gegenereerde afbeeldingen overeenkomen met de spec.' },
  { id:'copy',   num:'06', layer:'Claude API', title:'Ad copy generatie', desc:'Claude schrijft headline, body copy en CTA op basis van de specs en patronen.' },
];

function renderGenereren(el) {
  const topPatterns = [...PATTERNS].sort((a,b)=>b.confidence-a.confidence).slice(0,4);

  el.innerHTML = `
  <div class="page-header fade">
    <div class="page-title">Advertenties genereren</div>
    <div class="page-sub">Lagen 08–13 — PLN spec → verificatie → Claude API → output</div>
  </div>
  <div class="page-content">
    <div class="gen-layout">

      <!-- FORM -->
      <div class="fade fade-1">
        <div class="gen-form">
          <div class="card-label" style="margin-bottom:14px">Generatie parameters</div>

          <div class="form-group">
            <label class="form-label">Product</label>
            <select class="form-select" id="gen-product">
              <option value="Zilveren armband">Zilveren armband (€59,99)</option>
              <option value="Gouden ketting">Gouden ketting (€179,99)</option>
              <option value="Diamanten oorbellen">Diamanten oorbellen (€289,00)</option>
              <option value="Stapelringen">Stapelringen set (€89,99)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Aantal advertenties</label>
            <select class="form-select" id="gen-count">
              <option value="3">3 ads</option>
              <option value="5" selected>5 ads</option>
              <option value="10">10 ads</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Extra instructies (optioneel)</label>
            <textarea class="form-textarea" id="gen-instructions" placeholder="Bijv: focus op cadeaumarkt, geen prijsvermelding, target op 35+ segment…"></textarea>
          </div>

          <div class="form-group" style="margin-bottom:6px">
            <label class="form-label">Actieve PLN patronen (automatisch geselecteerd)</label>
            <div style="display:flex;flex-direction:column;gap:4px">
              ${topPatterns.map(p=>`
              <div style="display:flex;align-items:center;gap:8px;padding:7px 10px;background:var(--purple-s);border:1px solid rgba(109,40,217,.15);border-radius:5px">
                <div style="width:5px;height:5px;border-radius:50%;background:${confColor(p.confidence)};flex-shrink:0"></div>
                <div style="font-family:var(--mono);font-size:10px;color:var(--text-2);flex:1">"${p.formula}"</div>
                <div style="font-family:var(--mono);font-size:10px;color:var(--text-3)">conf ${p.confidence}</div>
              </div>`).join('')}
            </div>
          </div>

          <button class="btn-gen" id="btn-gen">
            <span>⚡</span> Genereer advertenties
          </button>
          <div class="gen-hint" id="gen-hint">${state.apiOnline ? 'Claude API actief — echte copy wordt gegenereerd' : 'Server offline — demo-copy wordt gebruikt'}</div>
        </div>
      </div>

      <!-- PIPELINE -->
      <div class="fade fade-2">
        <div class="pipeline">
          <div class="pipeline-title">Generatie pipeline</div>
          <div id="pipeline-steps">
            ${PIPELINE_STEPS.map(s => renderPipelineStep(s, 'wait')).join('')}
          </div>
        </div>
      </div>

    </div>
  </div>`;

  $('#btn-gen').addEventListener('click', () => {
    if (state.pipelineRunning) return;
    const product      = $('#gen-product').value;
    const count        = parseInt($('#gen-count').value);
    const instructions = $('#gen-instructions').value.trim();
    startPipeline(product, count, instructions);
  });
}

function renderPipelineStep(step, status) {
  const numContent = status === 'done' ? '✓' : status === 'error' ? '✗' : step.num;
  const statusHtml = {
    wait  : `<span class="p-status ps-wait">Wachtend</span>`,
    active: `<span class="p-status ps-running">Bezig…</span>`,
    done  : `<span class="p-status ps-ok">✓ Goedgekeurd</span>`,
    error : `<span class="p-status ps-error">✗ Fout</span>`,
  }[status] ?? '';

  return `
  <div class="p-step s-${status === 'wait' ? 'wait' : status === 'active' ? 'active' : status === 'done' ? 'done' : 'error'}" id="step-${step.id}">
    <div class="p-num">${numContent}</div>
    <div class="p-body">
      <div class="p-layer">${step.layer}</div>
      <div class="p-title">${step.title}</div>
      <div class="p-desc">${step.desc}</div>
      <div class="p-detail" id="detail-${step.id}"></div>
      ${statusHtml}
    </div>
  </div>`;
}

function setStep(id, status, detail = '') {
  const stepEl   = $(`#step-${id}`);
  const detailEl = $(`#detail-${id}`);
  if (!stepEl) return;

  stepEl.className = 'p-step ' + { active:'s-active', done:'s-done', error:'s-error' }[status];
  const numEl = stepEl.querySelector('.p-num');
  numEl.textContent = status === 'done' ? '✓' : status === 'error' ? '✗' : PIPELINE_STEPS.find(s=>s.id===id)?.num ?? '';

  const badge = stepEl.querySelector('.p-status');
  if (badge) badge.remove();
  const newBadge = document.createElement('span');
  newBadge.className = 'p-status ' + { active:'ps-running', done:'ps-ok', error:'ps-error' }[status];
  newBadge.textContent = { active:'Bezig…', done:'✓ Goedgekeurd', error:'✗ Fout' }[status];
  stepEl.querySelector('.p-body').appendChild(newBadge);

  if (detail && detailEl) detailEl.innerHTML = detail;
}

async function startPipeline(product, count, instructions) {
  state.pipelineRunning = true;
  const btn = $('#btn-gen');
  if (btn) { btn.disabled = true; btn.innerHTML = '<div class="spinner"></div> Pipeline draait…'; }

  // Stap 1 — Spec generatie
  setStep('spec', 'active');
  await delay(1800);
  const topPats = [...PATTERNS].sort((a,b)=>b.confidence-a.confidence).slice(0, Math.min(count, 4));
  setStep('spec', 'done', `
    PLN selecteerde <strong>${count} ad specs</strong> voor "${product}"<br>
    ${Math.ceil(count*.4)} bewezen (conf > 0.80) · ${Math.ceil(count*.3)} sterk (0.65–0.79) · ${Math.floor(count*.3)} potentieel (< 0.65)<br>
    Sterkste patroon: <em>"${topPats[0]?.formula}"</em> · conf ${topPats[0]?.confidence}`);

  // Stap 2 — Prompt generatie
  setStep('prompt', 'active');
  await delay(1400);
  setStep('prompt', 'done', `
    ${count} image prompts gegenereerd op basis van PLN specs<br>
    Voorbeeld: <em>"Woman on sunlit beach, silver bracelet on wrist, warm golden tones, editorial photography, soft bokeh"</em><br>
    Ad copy brief per spec aangemaakt · tone of voice: <em>${ATOMS.brand.tone.split('—')[0].trim()}</em>`);

  // Stap 3 — Verificatieloop 1
  setStep('ver1', 'active');
  await delay(1900);
  setStep('ver1', 'done', `
    ✓ Alle ${count} prompts voldoen aan de PLN spec<br>
    ✓ Geen hallucinaties gedetecteerd · ✓ Brand kleuren correct<br>
    ✓ Tone of voice consistent · ✓ Variaties uniek en niet-overlappend`);

  // Stap 4 — Image generatie
  setStep('image', 'active');
  await delay(2200);
  setStep('image', 'done', `
    ${count} placeholder-afbeeldingen aangemaakt (DALL·E 3 / Midjourney in productie)<br>
    Stijlreferentie image_ref meegestuurd per generatie · formaat: 1:1 Meta-spec<br>
    Brand kleurpalet als sturing toegepast`);

  // Stap 5 — Verificatieloop 2
  setStep('ver2', 'active');
  await delay(1600);
  setStep('ver2', 'done', `
    Vision LLM bevestigt: alle afbeeldingen kloppen met de PLN spec<br>
    ✓ Vereiste elementen aanwezig · ✓ Geen ongewenste elementen<br>
    ✓ Stijl overeenkomstig image_ref · ✓ Brand kleuren correct`);

  // Stap 6 — Claude API
  setStep('copy', 'active');
  const ads = await generateAds(product, count, instructions);
  state.generatedAds = ads;

  if (ads && ads.length) {
    setStep('copy', 'done', `
      ${ads.length} advertenties gegenereerd${state.apiOnline ? ' via Claude API' : ' (demo-modus)'}<br>
      Headlines, body copy en CTA geschreven in brand-tone<br>
      Confidence scores en traceerbaarheid opgeslagen`);

    // Output badge updaten
    const badge = $('#output-badge');
    if (badge) { badge.style.display = 'inline'; badge.textContent = ads.length; }

    await delay(800);
    navigate('output');
  } else {
    setStep('copy', 'error', 'Generatie mislukt — controleer de server en API key.');
  }

  state.pipelineRunning = false;
  if (btn) { btn.disabled = false; btn.innerHTML = '<span>⚡</span> Genereer advertenties'; }
}

// ── API CALL ──────────────────────────────────────────────────
async function generateAds(product, count, instructions) {
  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product, count, instructions,
        patterns: PATTERNS.slice(0, 5),
        brandAtom: ATOMS.brand,
      }),
    });
    const data = await res.json();
    if (data.success) {
      state.apiOnline = true;
      return data.ads;
    }
    throw new Error(data.error);
  } catch (err) {
    console.warn('[API fallback]', err.message);
    // Fallback: gebruik demo ads + vul aan tot gewenst aantal
    const base = [...FALLBACK_ADS];
    while (base.length < count) base.push(...FALLBACK_ADS);
    return base.slice(0, count).map((ad, i) => ({ ...ad, _index: i }));
  }
}

// ═══════════════════════════════════════════════════════════════
// PAGE 6 — OUTPUT
// ═══════════════════════════════════════════════════════════════
const AD_GRADIENTS = [
  { bg:'linear-gradient(145deg,#1a1a2e 0%,#2d1f5e 50%,#c9a84c 100%)', icon:'💍' },
  { bg:'linear-gradient(145deg,#f5f0e8 0%,#e8dcc8 55%,#c9a84c 100%)', icon:'✨' },
  { bg:'linear-gradient(145deg,#0f2027 0%,#203a43 50%,#2c5364 100%)', icon:'💎' },
  { bg:'linear-gradient(145deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)', icon:'⚡' },
  { bg:'linear-gradient(145deg,#2d1b69 0%,#11998e 100%)',              icon:'🌿' },
  { bg:'linear-gradient(145deg,#0d0d0d 0%,#3d2c1e 50%,#c9a84c 100%)', icon:'🏆' },
  { bg:'linear-gradient(145deg,#1a1a2e 0%,#6d28d9 100%)',              icon:'🎯' },
  { bg:'linear-gradient(145deg,#0f766e 0%,#1a1a2e 100%)',              icon:'💫' },
  { bg:'linear-gradient(145deg,#7c2d12 0%,#c9a84c 100%)',              icon:'🌟' },
  { bg:'linear-gradient(145deg,#1e3a5f 0%,#c9a84c 60%,#f5f0e8 100%)', icon:'👑' },
];

function renderOutput(el) {
  if (!state.generatedAds.length) {
    el.innerHTML = `
    <div class="page-header fade"><div class="page-title">Output</div><div class="page-sub">Laag 13 — gegenereerde advertenties klaar voor publicatie</div></div>
    <div class="page-content">
      <div class="empty fade">
        <div class="empty-icon">▣</div>
        <div class="empty-title">Nog geen advertenties gegenereerd</div>
        <div class="empty-text">Ga naar de pagina Genereren, vul het formulier in en klik op Genereer.<br>De pipeline doorloopt alle lagen en toont hier het resultaat.</div>
        <button class="btn-sm primary" onclick="navigate('genereren')">→ Ga naar Genereren</button>
      </div>
    </div>`;
    return;
  }

  const ads = state.generatedAds;

  el.innerHTML = `
  <div class="page-header fade">
    <div class="page-title">Output</div>
    <div class="page-sub">Laag 13 — ${ads.length} advertentie${ads.length!==1?'s':''} gegenereerd · geverifieerd · klaar voor Meta Ads Manager</div>
  </div>
  <div class="page-content">

    <div class="output-controls fade fade-1">
      <div class="output-count">${ads.length} advertentie${ads.length!==1?'s':''} · ${state.apiOnline ? 'Claude API' : 'Demo-modus'}</div>
      <div style="display:flex;gap:8px">
        <button class="btn-sm" onclick="navigate('genereren')">← Opnieuw genereren</button>
        <button class="btn-sm primary" onclick="alert('Export naar Meta Ads Manager — beschikbaar in productieversie')">↗ Exporteer naar Meta</button>
      </div>
    </div>

    <div class="ad-grid">
      ${ads.map((ad, i) => adCard(ad, i)).join('')}
    </div>

    <div class="card fade" style="margin-top:20px">
      <div class="card-hd">
        <div class="card-title">Timing & strategie advies</div>
        <span class="tag t-purple">PLN aanbeveling</span>
      </div>
      <table class="mini-table">
        <thead><tr><th>#</th><th>Headline</th><th>Verwacht ROAS</th><th>Confidence</th><th>Timing</th><th>Budget/dag</th></tr></thead>
        <tbody>
          ${ads.map((ad,i)=>`
          <tr>
            <td class="td-hi">Ad ${i+1}</td>
            <td>${ad.headline}</td>
            <td class="${roasClass(ad.expected_roas)}">${typeof ad.expected_roas==='number' ? ad.expected_roas.toFixed(1)+'×' : ad.expected_roas ?? '—'}</td>
            <td><span style="color:${confColor(ad.confidence)}">${typeof ad.confidence==='number' ? (ad.confidence*100).toFixed(0)+'%' : ad.confidence ?? '—'}</span></td>
            <td>${ad.timing ?? '—'}</td>
            <td>${ad.budget ?? '—'}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>

    <div class="notice notice-purple fade" style="margin-top:14px">
      ↻ <strong>Feedbackloop</strong> — na elke campagnecyclus stromen nieuwe Meta resultaten en Shopify conversies terug als nieuwe atoms. Patronen worden scherper, confidence scores groeien, verificatie wordt strenger.
    </div>
  </div>`;
}

function adCard(ad, i) {
  const g    = AD_GRADIENTS[i % AD_GRADIENTS.length];
  const conf = typeof ad.confidence === 'number' ? ad.confidence : 0.7;
  const tier = conf >= 0.80 ? 'Bewezen' : conf >= 0.65 ? 'Sterk' : 'Potentieel';

  const atomsHtml = (ad.atoms_used ?? ['Creative atom','Performance atom','Dag atom'])
    .map(a => `<span class="atom-tag">${a}</span>`).join('');

  return `
  <div class="ad-card fade fade-${(i%3)+1}">
    <div class="ad-img" style="background:${g.bg}">
      <div class="ad-img-inner">
        <div class="ad-img-icon">${g.icon}</div>
        <div class="ad-img-prompt">${ad.image_prompt ?? ''}</div>
      </div>
      <div class="tier-badge">${tier}</div>
      <div class="conf-badge ${confClass(conf)}">${(conf*100).toFixed(0)}%</div>
    </div>
    <div class="ad-body">
      <div class="ad-num">Ad ${i+1} · ${ad.pattern_used ?? 'PLN patroon'}</div>
      <div class="ad-hl">${ad.headline}</div>
      <div class="ad-copy">${ad.body}</div>
      <div class="ad-cta">${ad.cta}</div>
      <div class="ad-meta">
        <div class="ad-meta-row">
          <div class="am-lbl">Patroon</div>
          <div class="am-val">${ad.pattern_used ?? '—'}</div>
        </div>
        <div class="ad-meta-row">
          <div class="am-lbl">Exp. ROAS</div>
          <div class="am-val" style="color:${typeof ad.expected_roas==='number'&&ad.expected_roas>=4?'var(--green)':'var(--text-2)'}">
            ${typeof ad.expected_roas==='number' ? ad.expected_roas.toFixed(1)+'×' : '—'}
          </div>
        </div>
        <div class="ad-meta-row">
          <div class="am-lbl">Atoms</div>
          <div class="am-val"><div class="am-atoms">${atomsHtml}</div></div>
        </div>
      </div>
    </div>
  </div>`;
}

// ═══════════════════════════════════════════════════════════════
// PAGE 0 — HOME (landing)
// ═══════════════════════════════════════════════════════════════

/* Slide data for the hero ad preview card */
const HP_SLIDES = [
  {
    img: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=900&h=700&q=85',
    headline: 'Made for\nthe moment.',
    sub: 'Visuals that match the season.',
    whyTitle: 'What we found in your historical data',
    m1Label: 'ROAS', m1Val: '1.9×',
    m2Label: 'CVR',  m2Val: '+26%',
    why: [
      'Summer performs best with bright, airy close-ups',
      'Winter performs best with warmer tones and subtle seasonal cues',
      'Matching the visual tone to the season improves efficiency'
    ]
  },
  {
    img: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&h=700&q=85',
    headline: 'My everyday\nmust-haves.',
    sub: 'Real. Personal. Trusted.',
    whyTitle: 'What the engine learned',
    m1Label: 'CVR',  m1Val: '+31%',
    m2Label: 'ROAS', m2Val: '1.8×',
    why: [
      'High-click attention ads bring traffic, but weaker purchase intent',
      'Authentic UGC and product-in-context creatives convert better',
      'Clarity + trust outperform broad awareness concepts'
    ]
  },
  {
    img: 'https://images.unsplash.com/photo-1576022162879-fd7fac3e2b73?auto=format&fit=crop&w=900&h=700&q=85',
    headline: 'A subtle\nfestive glow.',
    sub: 'Seasonal, not overdone.',
    whyTitle: 'Pattern detected',
    m1Label: 'ROAS', m1Val: '2.0×',
    m2Label: 'CTR',  m2Val: '+22%',
    why: [
      'Starting 3 weeks before Christmas, subtle festive creatives begin to outperform',
      'Small Christmas accents perform better than neutral visuals',
      'Overly festive ads underperform — a light seasonal mood works best'
    ]
  },
  {
    img: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=900&h=700&q=85',
    headline: 'Details that\nmake the difference.',
    sub: 'Subtle. Timeless. Up close.',
    whyTitle: 'What your data revealed',
    m1Label: 'ROAS', m1Val: '2.1×',
    m2Label: 'CVR',  m2Val: '+34%',
    why: [
      'During heatwaves, lifestyle creatives with women outdoors perform worse than expected',
      'Close-up product images with light tones perform significantly better',
      'Soft tones + product focus become the best fit'
    ]
  }
];

let _heroTimer = null;

function renderHome(el) {
  if (_heroTimer) { clearInterval(_heroTimer); _heroTimer = null; }

  el.innerHTML = `
  <div class="lp-root">

    <!-- ══ SECTION 1: HERO ══════════════════════════════════ -->
    <section class="lp-hero lp-hero-v2">
      <div class="lp-hero-inner lp-hero-inner-v2">

        <!-- LEFT -->
        <div class="ge-left">
          <p class="ge-eyebrow">— Growth Engine <span class="ge-dot">·</span> v0.1 POC</p>

          <h1 class="ge-headline">
            Find the patterns<br>
            behind your<br>
            winning ads.<br>
            Turn them into<br>
            <span class="ge-accent">profitable new creatives.</span>
          </h1>

          <p class="ge-sub">Connect Meta and Shopify. Discover what actually drives purchases — and generate new ads from your proven patterns.</p>

          <div class="ge-cta-row">
            <button class="ge-btn-primary" onclick="navigate('bronnen')">Start free analysis</button>
            <span class="ge-meta">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
              Value in under 10 minutes
            </span>
          </div>

          <div class="ge-why">
            <h3>Why it's different</h3>
            <ul>
              <li>
                <span class="ge-ic">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>
                </span>
                Analyzes every creative detail
              </li>
              <li>
                <span class="ge-ic">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/></svg>
                </span>
                Learns what drives real purchases
              </li>
              <li>
                <span class="ge-ic">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v3"/><path d="M12 18v3"/><path d="M3 12h3"/><path d="M18 12h3"/><path d="M5.6 5.6l2.1 2.1"/><path d="M16.3 16.3l2.1 2.1"/><path d="M5.6 18.4l2.1-2.1"/><path d="M16.3 7.7l2.1-2.1"/></svg>
                </span>
                Generates ads from proven patterns
              </li>
            </ul>
          </div>
        </div>

        <!-- RIGHT — PRODUCT CARD -->
        <div class="ge-product">

          <div class="ge-hero-img">
            <img alt="Featured creative" src="https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1200&q=70">
          </div>

          <div class="ge-steps">
            <div class="ge-step-title">1. Pattern</div>
            <div class="ge-step-arrow">
              <svg width="22" height="14" viewBox="0 0 22 14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M1 7h19"/><path d="M15 2l5 5-5 5"/></svg>
            </div>
            <div class="ge-step-title">2. Insight</div>
            <div class="ge-step-arrow">
              <svg width="22" height="14" viewBox="0 0 22 14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M1 7h19"/><path d="M15 2l5 5-5 5"/></svg>
            </div>
            <div class="ge-step-title">3. Output</div>
          </div>

          <div class="ge-step-bodies">
            <!-- Step 1: bars -->
            <div class="ge-bars">
              <div class="ge-bar-item">
                <div class="ge-label">Christmas visuals too early</div>
                <div class="ge-bar"><span style="width:55%"></span></div>
                <div class="ge-bar-caption">Underperform</div>
              </div>
              <div class="ge-bar-item">
                <div class="ge-label">Last 2 weeks: winter close-ups</div>
                <div class="ge-bar"><span style="width:82%"></span></div>
                <div class="ge-bar-caption">Perform best</div>
              </div>
            </div>

            <!-- Step 2: insights -->
            <div class="ge-insights">
              <div class="ge-insight">
                <span class="ge-check">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
                Timing matters
              </div>
              <div class="ge-insight">
                <span class="ge-check">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
                Close-ups convert
              </div>
            </div>

            <!-- Step 3: output thumb -->
            <div class="ge-output">
              <div class="ge-thumb">
                <img alt="Generated creative" src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=400&q=70">
              </div>
              <div class="ge-cap">New gifting creative</div>
            </div>
          </div>

          <div class="ge-pattern-note">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Pattern backed by historical ad + purchase data
          </div>

          <div class="ge-stats">
            <div class="ge-stat">
              <span class="ge-ic-circle">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 17 9 11 13 15 21 7"/><polyline points="15 7 21 7 21 13"/></svg>
              </span>
              <div>
                <div class="ge-num">+31%</div>
                <div class="ge-lbl">CVR</div>
              </div>
            </div>
            <div class="ge-stat">
              <span class="ge-ic-circle">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 20V10"/><path d="M12 20V4"/><path d="M19 20v-7"/></svg>
              </span>
              <div>
                <div class="ge-num">1.8x</div>
                <div class="ge-lbl">ROAS</div>
              </div>
            </div>
          </div>

          <button class="ge-generate-btn" onclick="navigate('genereren')">
            Generate ads on your data
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>
          </button>

        </div><!-- /ge-product -->

      </div>
    </section>

    <!-- ══ SECTION 2: GENERATE ══════════════════════════════ -->
    <section class="lp-generate">
      <div class="lp-gen-inner">

        <!-- LEFT -->
        <div class="lp-gen-left">
          <div class="lp-eyebrow lp-eyebrow-purple">FROM INSIGHT TO OUTPUT</div>
          <h2 class="lp-gen-title">Do you really understand why some creatives work — and others don't?</h2>
          <p class="lp-gen-sub">Using your historical data, the engine explains the why and turns it into new ad ideas.</p>
          <div class="lp-prompt-wrap">
            <input class="lp-prompt-input" type="text" value="What will work for Easter this year?" readonly>
            <button class="lp-prompt-btn" onclick="navigate('genereren')">✦ Ask the engine</button>
          </div>
          <div class="lp-gen-hint">
            <span class="lp-spark">✦</span>
            <span>You can ask about seasonal winners, revenue differences, and what patterns to repeat.</span>
          </div>
        </div>

        <!-- RIGHT: carousel -->
        <div class="lp-gen-right">
          <div class="lp-carousel-wrap">
            <div class="lp-carousel">
              ${lpAdCard(1,'https://images.unsplash.com/photo-1573408301185-9519f94815b1?auto=format&fit=crop&w=424&h=504&q=80','Joy worth<br>giving.','Easter gifts she\'ll always remember.','High traction','#059669','Easter gifting moment','Lifestyle · Easter',false)}
              ${lpAdCard(2,'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=424&h=504&q=80','Meaningful. Timeless.<br>Made for her.','Celebrate Easter with something that lasts.','Top performer','#6D28D9','Timeless Easter gift','Product detail · Emotion',false)}
              ${lpAdCard(3,'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=424&h=504&q=80','New season.<br>New beginnings.','Shine into spring.','Seasonal winner','#0f766e','Spring refresh','Lifestyle · Seasonal',false)}
              ${lpAdCard(4,'https://images.unsplash.com/photo-1611085583191-a3b181a88401?auto=format&fit=crop&w=424&h=504&q=80','Little details.<br>Big moments.','Make her Easter extra special.','Strong CTA','#1d4ed8','Gift with emotion','Offer · Clear CTA',false)}
            </div>
            <button class="lp-carousel-next">›</button>
          </div>
          <div class="lp-carousel-footer">✦ Generated from patterns found in your data.</div>
        </div>

      </div>
    </section>

    <!-- ══ SECTION 3: WHY IT'S DIFFERENT ═══════════════════ -->
    <section class="wd-section">
      <div class="wd-inner">

        <!-- Intro -->
        <div class="wd-intro">
          <div class="wd-eyebrow">WHY IT'S DIFFERENT</div>
          <p class="wd-intro-desc">Growth Engine connects ad performance, webshop outcomes, and context.<br>It finds patterns, shows exactly where they come from, and gets smarter after every cycle.</p>
        </div>

        <!-- Row 1: Patterns at scale + One connected view -->
        <div class="wd-row wd-row-1">

          <div class="wd-card">
            <h3 class="wd-card-h">Patterns at scale</h3>
            <div class="wd-stats">
              ${wdStat('<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6D28D9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>','12.4M+','Ad interactions analyzed',false)}
              ${wdStat('<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6D28D9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3l14 9-7 2-2 7z"/></svg>','1.8M+','Clicks linked to your store',false)}
              ${wdStat('<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6D28D9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>','247K+','Purchases attributed',false)}
              ${wdStat('<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6D28D9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"/></svg>','Thousands','Patterns discovered',true)}
            </div>
          </div>

          <div class="wd-card">
            <h3 class="wd-card-h">One connected view</h3>
            <p class="wd-card-p">The engine connects signals across platforms to see what actually drives profit.</p>
            <div class="wd-platforms">
              <div class="wd-platform">
                <div class="wd-plat-logo wd-plat-meta"><svg width="16" height="9" viewBox="0 0 100 56" fill="white"><path d="M50 0C32 0 19 9 12 20 8 13 5 5 0 0v34c0 12 9 22 21 22 8 0 15-4 20-11l9-13 9 13c5 7 12 11 20 11 12 0 21-10 21-22V0c-5 5-8 13-12 20C81 9 68 0 50 0z"/></svg></div>
                <div class="wd-plat-name">Meta Ads</div>
                <div class="wd-plat-sub">Ad performance &amp; clicks</div>
              </div>
              <div class="wd-plat-line"><span class="wd-plat-dots">· · · ·</span><span class="wd-plat-arrow">›</span></div>
              <div class="wd-platform">
                <div class="wd-plat-logo wd-plat-shopify"><svg width="10" height="12" viewBox="0 0 38 44" fill="white"><path d="M32 8.5c0-.2-.2-.3-.3-.3s-3.6-.3-3.6-.3-2.4-2.3-2.6-2.5V44l10.5-2.3L38 10l-6-1.5zm-6 0L24.5 8c-.2-.7-1-3-3-3-.1 0-.3 0-.4.1C20.5 4 20 3.6 19.2 3.6c-6 0-8.9 7.5-9.8 11.3L5 16.2 2 42l22 3.8V8.5z"/></svg></div>
                <div class="wd-plat-name">Shopify</div>
                <div class="wd-plat-sub">Purchases &amp; conversion data</div>
              </div>
              <div class="wd-plat-line"><span class="wd-plat-dots">· · · ·</span><span class="wd-plat-arrow">›</span></div>
              <div class="wd-platform">
                <div class="wd-plat-logo wd-plat-weather"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg></div>
                <div class="wd-plat-name">Weather &amp; Season</div>
                <div class="wd-plat-sub">Context, timing &amp; seasonality</div>
              </div>
            </div>
            <div class="wd-brain-area">
              <svg class="wd-brain-svg" viewBox="0 0 420 56" fill="none" preserveAspectRatio="none">
                <path d="M 70 4 C 70 46 210 46 210 52" stroke="#D1D5DB" stroke-width="1.5" stroke-dasharray="5 4"/>
                <line x1="210" y1="4" x2="210" y2="48" stroke="#D1D5DB" stroke-width="1.5" stroke-dasharray="5 4"/>
                <path d="M 350 4 C 350 46 210 46 210 52" stroke="#D1D5DB" stroke-width="1.5" stroke-dasharray="5 4"/>
              </svg>
              <div class="wd-brain-node">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6D28D9" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7" r="3"/><circle cx="6" cy="17" r="2"/><circle cx="18" cy="17" r="2"/><line x1="9.5" y1="9.5" x2="7.2" y2="15.2"/><line x1="14.5" y1="9.5" x2="16.8" y2="15.2"/><line x1="8" y1="17" x2="16" y2="17"/></svg>
              </div>
            </div>
          </div>

        </div>

        <!-- Row 2: 100% traceable + System gets smarter -->
        <div class="wd-row wd-row-2">

          <div class="wd-card">
            <h3 class="wd-card-h">100% traceable</h3>
            <p class="wd-card-p">Every pattern is backed by real data.<br>See exactly where it comes from.</p>
            <div class="wd-sources">
              <div class="wd-source">
                <div class="wd-src-icon wd-src-meta"><svg width="14" height="8" viewBox="0 0 100 56" fill="white"><path d="M50 0C32 0 19 9 12 20 8 13 5 5 0 0v34c0 12 9 22 21 22 8 0 15-4 20-11l9-13 9 13c5 7 12 11 20 11 12 0 21-10 21-22V0c-5 5-8 13-12 20C81 9 68 0 50 0z"/></svg></div>
                <div class="wd-src-lbl">Meta Ads</div>
              </div>
              <div class="wd-source">
                <div class="wd-src-icon wd-src-shopify"><svg width="9" height="11" viewBox="0 0 38 44" fill="white"><path d="M32 8.5c0-.2-.2-.3-.3-.3s-3.6-.3-3.6-.3-2.4-2.3-2.6-2.5V44l10.5-2.3L38 10l-6-1.5zm-6 0L24.5 8c-.2-.7-1-3-3-3-.1 0-.3 0-.4.1C20.5 4 20 3.6 19.2 3.6c-6 0-8.9 7.5-9.8 11.3L5 16.2 2 42l22 3.8V8.5z"/></svg></div>
                <div class="wd-src-lbl">Shopify</div>
              </div>
              <div class="wd-source">
                <div class="wd-src-icon wd-src-analytics"><svg width="18" height="16" viewBox="0 0 24 22" fill="none" stroke="#6D28D9" stroke-width="2" stroke-linecap="round"><rect x="0" y="10" width="5" height="12"/><rect x="9" y="5" width="5" height="17"/><rect x="18" y="0" width="5" height="22"/></svg></div>
                <div class="wd-src-lbl">Analytics</div>
              </div>
              <div class="wd-source">
                <div class="wd-src-icon wd-src-weather"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/></svg></div>
                <div class="wd-src-lbl">Weather</div>
              </div>
            </div>
            <div class="wd-traceable-badge">
              <span class="wd-trace-pct">100%</span>
              <span class="wd-trace-lbl">Traceable</span>
            </div>
          </div>

          <div class="wd-card">
            <h3 class="wd-card-h">The system gets smarter with every ad</h3>
            <p class="wd-card-p">More data. More learning. Better results.</p>
            <div class="wd-steps">
              ${wdStep(1,'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6D28D9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21"/></svg>','You launch an ad','We collect performance, clicks &amp; conversions.')}
              <div class="wd-step-arr">→</div>
              ${wdStep(2,'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6D28D9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7" r="3"/><circle cx="6" cy="17" r="2"/><circle cx="18" cy="17" r="2"/><line x1="9.5" y1="9.5" x2="7" y2="15"/><line x1="14.5" y1="9.5" x2="17" y2="15"/><line x1="8" y1="17" x2="16" y2="17"/></svg>','The engine learns','It analyzes what worked, what didn\'t, and why.')}
              <div class="wd-step-arr">→</div>
              ${wdStep(3,'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6D28D9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>','Patterns get stronger','New insights are added to your data brain.')}
              <div class="wd-step-arr">→</div>
              ${wdStep(4,'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6D28D9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0018 8 6 6 0 006 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 018.91 14"/></svg>','Better ad ideas','Predictions improve. Hit rate gets higher.')}
              <div class="wd-step-arr">→</div>
              ${wdStep(5,'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6D28D9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3"/></svg>','Repeat','The system keeps learning and improving.')}
            </div>
          </div>

        </div>

        <!-- Footer banner -->
        <div class="wd-footer-banner">
          <span class="wd-footer-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6D28D9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg></span>
          <span class="wd-footer-text"><strong>No black box.</strong> Everything is transparent, traceable, and based on your data.</span>
        </div>

      </div>
    </section>

  </div>`;
}

/* ── Hero ad preview slider ──────────────────────────────── */
function initHeroSlider(el) {
  let idx = 0;
  const INTERVAL  = 4000;   // ms between slides
  const TRANS     = 860;    // ms for CSS transition

  function advance() {
    const wrap = el.querySelector('#hp-media-wrap');
    if (!wrap) return;                        // navigated away

    idx = (idx + 1) % HP_SLIDES.length;
    const s = HP_SLIDES[idx];

    /* ── build incoming slide (starts above) ── */
    const incoming = document.createElement('div');
    incoming.className = 'hp-slide hp-slide-enter';
    incoming.style.backgroundImage = `url('${s.img}')`;
    incoming.innerHTML = `
      <div class="hp-slide-overlay">
        <div class="hp-slide-headline">${s.headline.replace('\n','<br>')}</div>
        <div class="hp-slide-sub">${s.sub}</div>
      </div>`;
    wrap.appendChild(incoming);

    /* ── trigger CSS transition on next paint ── */
    requestAnimationFrame(() => requestAnimationFrame(() => {
      incoming.classList.replace('hp-slide-enter', 'hp-slide-visible');

      /* push outgoing slide downward */
      const outgoing = wrap.querySelector('.hp-slide-visible:not(:last-child),.hp-slide-exit');
      wrap.querySelectorAll('.hp-slide').forEach(sl => {
        if (sl !== incoming) sl.classList.add('hp-slide-exit');
      });

      /* remove after transition finishes */
      setTimeout(() => {
        wrap.querySelectorAll('.hp-slide-exit').forEach(sl => sl.remove());
      }, TRANS + 50);
    }));

    /* ── update "Why" section ── */
    const itemsEl   = el.querySelector('#hp-why-items');
    const titleEl   = el.querySelector('#hp-why-title');
    const m1LblEl  = el.querySelector('#hp-m1-label');
    const m1ValEl  = el.querySelector('#hp-m1-val');
    const m2LblEl  = el.querySelector('#hp-m2-label');
    const m2ValEl  = el.querySelector('#hp-m2-val');
    if (!itemsEl) return;

    itemsEl.style.opacity  = '0';
    m1ValEl.style.opacity  = '0';
    m2ValEl.style.opacity  = '0';

    setTimeout(() => {
      if (titleEl)  titleEl.textContent   = s.whyTitle;
      if (m1LblEl) m1LblEl.textContent   = s.m1Label;
      if (m2LblEl) m2LblEl.textContent   = s.m2Label;
      itemsEl.innerHTML = s.why.map(w =>
        `<li class="hp-why-item"><span class="hp-check"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6.5" stroke="#D1D5DB"/><path d="M4.5 7l2 2 3-3" stroke="#6D28D9" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></span>${w}</li>`
      ).join('');
      m1ValEl.textContent   = s.m1Val;
      m2ValEl.textContent   = s.m2Val;
      itemsEl.style.opacity = '1';
      m1ValEl.style.opacity = '1';
      m2ValEl.style.opacity = '1';
    }, 280);
  }

  return setInterval(advance, INTERVAL);
}

/* ── Insight card row ────────────────────────────────────── */
function icRow(title, sub, score, color) {
  return `
  <div class="ic-row">
    <div class="ic-row-info">
      <div class="ic-row-title">${title}</div>
      <div class="ic-row-sub">${sub}</div>
    </div>
    <div class="ic-score ic-score-${color}">${score}</div>
  </div>`;
}

/* ── Landing page ad card ────────────────────────────────── */
function lpAdCard(num, imgUrl, headline, sub, badge, badgeColor, pattern, detail, showShop) {
  return `
  <div class="lp-ad-card">
    <div class="lac-image">
      <img src="${imgUrl}" alt="${pattern}" loading="lazy">
      <div class="lac-overlay">
        <div class="lac-headline">${headline}</div>
        <div class="lac-sub">${sub}</div>
        ${showShop ? '<div class="lac-shop-btn">SHOP NOW</div>' : ''}
      </div>
    </div>
    <div class="lac-body">
      <div class="lac-top">
        <span class="lac-num">Ad 0${num}</span>
        <span class="lac-badge" style="color:${badgeColor};background:${badgeColor}18;border:1px solid ${badgeColor}30">${badge}</span>
      </div>
      <div class="lac-title">${pattern}</div>
      <div class="lac-detail">${detail}</div>
    </div>
  </div>`;
}

/* ── Why it's different: stat block ─────────────────────────── */
function wdStat(iconSvg, num, label, purple) {
  return `
  <div class="wd-stat${purple ? ' ws-purple' : ''}">
    <div class="wd-stat-icon-wrap">${iconSvg}</div>
    <div class="wd-stat-num">${num}</div>
    <div class="wd-stat-lbl">${label}</div>
  </div>`;
}

/* ── Why it's different: step block ─────────────────────────── */
function wdStep(n, iconSvg, title, desc) {
  return `
  <div class="wd-step">
    <div class="wd-step-icon">${iconSvg}</div>
    <div class="wd-step-title">${title}</div>
    <div class="wd-step-desc">${desc}</div>
  </div>`;
}

// ═══════════════════════════════════════════════════════════════
// PAGE — PIPELINE (7-fase ad generatie architectuur)
// ═══════════════════════════════════════════════════════════════
function renderPipeline(el) {
  // Pipeline state (local to this page render)
  const ps = {
    step: 0,           // 0=idle, 1=atoms, 2=input, 3=spec, 4=concepts, 5=images, 6=verify, 7=done
    performanceAtoms: [],
    product: '',
    context: '',
    spec: null,
    concepts: [],
    generatedAds: [],  // { concept, imageBase64, mimeType, verified, iterations }
  };

  el.innerHTML = `
  <div class="page-header fade">
    <div class="page-title">Pipeline</div>
    <div class="page-sub">7-fase ad generatie · PLN + Atomspace + Gemini · OmegaClaw</div>
  </div>
  <div class="page-content">
    <div id="pl-stepper" class="pl-stepper">
      ${[
        'Bronnen laden',
        'Advertiser input',
        'PLN spec',
        'Concepten',
        'Beeld generatie',
        'Verificatie loop',
        'Output',
      ].map((label, i) => `
        <div class="pl-step" id="pl-step-${i+1}">
          <div class="pl-step-num">${i+1}</div>
          <div class="pl-step-label">${label}</div>
        </div>
        ${i < 6 ? '<div class="pl-step-connector"></div>' : ''}
      `).join('')}
    </div>

    <div id="pl-body" class="pl-body">
      <div id="pl-phase-1" class="pl-phase active">
        <div class="card">
          <div class="card-hd"><div class="card-title">Fase 1 — Bronnen laden</div></div>
          <p style="color:var(--text-muted);font-size:13px;margin-bottom:16px">
            Laadt echte Meta Ads performance atoms van schijf (<code>atoms/performance/*.json</code>) gegenereerd vanuit de Meta CSV export.
          </p>
          <button class="btn-primary" id="pl-load-atoms">Atoms laden ↓</button>
          <div id="pl-atoms-result" style="margin-top:16px"></div>
        </div>
      </div>

      <div id="pl-phase-2" class="pl-phase" style="display:none">
        <div class="card">
          <div class="card-hd"><div class="card-title">Fase 2 — Advertiser input</div></div>
          <div style="display:grid;gap:12px">
            <div>
              <label class="form-label">Product / collectie</label>
              <input id="pl-product" class="form-input" placeholder="bijv. Zilveren armband collectie, €39–€89" value="Zilveren armband collectie, €39–€89"/>
            </div>
            <div>
              <label class="form-label">Periode + context</label>
              <input id="pl-context" class="form-input" placeholder="bijv. Week 24, zomer, zonnige voorspelling" value="Week 24, zomer, zonnige voorspelling"/>
            </div>
            <button class="btn-primary" id="pl-run-pln">PLN analyse uitvoeren →</button>
          </div>
        </div>
      </div>

      <div id="pl-phase-3" class="pl-phase" style="display:none">
        <div class="card">
          <div class="card-hd"><div class="card-title">Fase 3 — PLN formele specificatie</div></div>
          <div id="pl-spec-box"></div>
          <button class="btn-primary" id="pl-gen-concepts" style="margin-top:16px">10 concepten genereren →</button>
        </div>
      </div>

      <div id="pl-phase-4" class="pl-phase" style="display:none">
        <div class="card">
          <div class="card-hd"><div class="card-title">Fase 4 — Advertentie concepten (LLM)</div></div>
          <div id="pl-concepts-list"></div>
          <button class="btn-primary" id="pl-gen-images" style="margin-top:16px;display:none">Beelden genereren met Gemini →</button>
        </div>
      </div>

      <div id="pl-phase-5" class="pl-phase" style="display:none">
        <div class="card">
          <div class="card-hd"><div class="card-title">Fase 5 — Gemini beeld generatie</div></div>
          <div id="pl-images-grid" class="pl-images-grid"></div>
          <button class="btn-primary" id="pl-start-verify" style="margin-top:16px;display:none">Verificatie loop starten →</button>
        </div>
      </div>

      <div id="pl-phase-6" class="pl-phase" style="display:none">
        <div class="card">
          <div class="card-hd"><div class="card-title">Fase 6 — Verificatie feedback loop</div></div>
          <p style="color:var(--text-muted);font-size:13px;margin-bottom:16px">
            Vision model decompose → PLN vergelijkt met spec → corrigeert tot 100% match.
          </p>
          <div id="pl-verify-list"></div>
          <button class="btn-primary" id="pl-to-output" style="margin-top:16px;display:none">Naar output →</button>
        </div>
      </div>

      <div id="pl-phase-7" class="pl-phase" style="display:none">
        <div class="card">
          <div class="card-hd"><div class="card-title">Fase 7 — Geverifieerde advertenties</div></div>
          <div id="pl-final-output"></div>
        </div>
      </div>
    </div>
  </div>`;

  addPipelineStyles();
  bindPipelineEvents(el, ps);
}

function addPipelineStyles() {
  if (document.getElementById('pl-styles')) return;
  const s = document.createElement('style');
  s.id = 'pl-styles';
  s.textContent = `
    .pl-stepper { display:flex; align-items:center; gap:0; margin-bottom:24px; overflow-x:auto; padding:4px 0 12px; }
    .pl-step { display:flex; flex-direction:column; align-items:center; gap:4px; min-width:80px; }
    .pl-step-num { width:32px; height:32px; border-radius:50%; border:2px solid rgba(255,255,255,0.12); display:flex; align-items:center; justify-content:center; font-family:'DM Mono',monospace; font-size:12px; color:var(--text-muted); transition:.3s; }
    .pl-step.done .pl-step-num { background:var(--green); border-color:var(--green); color:#fff; }
    .pl-step.active .pl-step-num { border-color:var(--purple); color:var(--purple); box-shadow:0 0 0 3px rgba(109,40,217,.15); }
    .pl-step-label { font-size:10px; color:var(--text-muted); text-align:center; white-space:nowrap; }
    .pl-step.active .pl-step-label { color:var(--purple); }
    .pl-step.done .pl-step-label { color:var(--green); }
    .pl-step-connector { flex:1; height:2px; background:rgba(255,255,255,0.08); min-width:16px; }
    .pl-body { display:flex; flex-direction:column; gap:16px; }
    .pl-phase { display:flex; flex-direction:column; gap:12px; }
    .pl-spec-row { display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.05); font-size:13px; }
    .pl-spec-label { color:var(--text-muted); }
    .pl-spec-val { color:var(--text); font-family:'DM Mono',monospace; }
    .pl-elem-tag { display:inline-block; padding:2px 8px; border-radius:4px; background:rgba(93,202,165,.12); border:1px solid rgba(93,202,165,.2); color:#5DCAA5; font-size:11px; margin:2px; }
    .pl-concept { padding:12px; border:1px solid rgba(255,255,255,0.07); border-radius:8px; margin-bottom:8px; font-size:13px; }
    .pl-concept-head { font-weight:600; color:var(--text); margin-bottom:4px; }
    .pl-concept-body { color:var(--text-muted); margin-bottom:4px; }
    .pl-concept-meta { font-family:'DM Mono',monospace; font-size:11px; color:var(--text-muted); }
    .pl-images-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:12px; }
    .pl-img-card { border:1px solid rgba(255,255,255,0.07); border-radius:8px; overflow:hidden; background:rgba(255,255,255,0.02); }
    .pl-img-placeholder { height:140px; display:flex; align-items:center; justify-content:center; font-size:11px; color:var(--text-muted); flex-direction:column; gap:6px; }
    .pl-img-thumb { width:100%; height:140px; object-fit:cover; }
    .pl-img-label { padding:8px; font-size:11px; color:var(--text-muted); font-family:'DM Mono',monospace; }
    .pl-verify-item { border:1px solid rgba(255,255,255,0.07); border-radius:8px; padding:12px; margin-bottom:8px; }
    .pl-verify-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; font-size:13px; font-weight:600; }
    .pl-check-list { display:flex; flex-wrap:wrap; gap:6px; font-size:12px; }
    .pl-check-ok { color:#5DCAA5; }
    .pl-check-fail { color:#E24B4A; }
    .pl-iter { font-family:'DM Mono',monospace; font-size:11px; color:var(--text-muted); margin-top:6px; }
    .pl-verified-badge { padding:2px 8px; border-radius:4px; font-size:11px; font-family:'DM Mono',monospace; }
    .pl-verified-badge.ok { background:rgba(93,202,165,.12); color:#5DCAA5; border:1px solid rgba(93,202,165,.2); }
    .pl-verified-badge.pending { background:rgba(239,159,39,.1); color:#EF9F27; border:1px solid rgba(239,159,39,.2); }
    .pl-final-ad { border:1px solid rgba(93,202,165,.2); border-radius:10px; padding:14px; margin-bottom:12px; display:grid; grid-template-columns:140px 1fr; gap:14px; align-items:start; }
    .pl-final-img { width:140px; height:140px; object-fit:cover; border-radius:6px; background:rgba(255,255,255,0.03); }
    .pl-final-img-ph { width:140px; height:140px; border-radius:6px; background:rgba(255,255,255,0.03); display:flex; align-items:center; justify-content:center; font-size:11px; color:var(--text-muted); }
    .pl-proof { font-family:'DM Mono',monospace; font-size:10px; color:rgba(93,202,165,.6); margin-top:6px; }
    .pl-atoms-table { width:100%; border-collapse:collapse; font-size:12px; }
    .pl-atoms-table th { text-align:left; padding:6px 8px; color:var(--text-muted); font-weight:500; border-bottom:1px solid rgba(255,255,255,0.07); }
    .pl-atoms-table td { padding:6px 8px; border-bottom:1px solid rgba(255,255,255,0.04); font-family:'DM Mono',monospace; }
    .pl-spinner { display:inline-block; width:14px; height:14px; border:2px solid rgba(255,255,255,0.1); border-top-color:var(--purple); border-radius:50%; animation:spin .8s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .conf-bar { height:4px; border-radius:2px; background:rgba(255,255,255,0.08); margin-top:4px; overflow:hidden; }
    .conf-bar-fill { height:100%; border-radius:2px; background:var(--green); transition:width .8s ease; }
    .form-label { display:block; font-size:12px; color:var(--text-muted); margin-bottom:6px; }
    .form-input { width:100%; padding:8px 12px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:6px; color:var(--text); font-size:13px; outline:none; }
    .form-input:focus { border-color:var(--purple); }
  `;
  document.head.appendChild(s);
}

function bindPipelineEvents(el, ps) {
  function setStep(n) {
    ps.step = n;
    el.querySelectorAll('.pl-step').forEach((s, i) => {
      s.classList.toggle('done', i + 1 < n);
      s.classList.toggle('active', i + 1 === n);
    });
  }

  function showPhase(n) {
    el.querySelectorAll('.pl-phase').forEach((p, i) => {
      p.style.display = (i + 1 === n) ? '' : 'none';
    });
    setStep(n);
  }

  // ── Phase 1: load atoms ───────────────────────────────────────
  el.querySelector('#pl-load-atoms').addEventListener('click', async () => {
    const btn = el.querySelector('#pl-load-atoms');
    const result = el.querySelector('#pl-atoms-result');
    btn.disabled = true;
    btn.innerHTML = '<span class="pl-spinner"></span> Laden…';

    try {
      // Trigger a lightweight PLN spec call just to get the performanceAtoms back
      const r = await fetch('/api/pln-spec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: '__probe__', context: '__probe__', creativeAtoms: [], commerceAtoms: [] }),
      });
      const data = await r.json();
      ps.performanceAtoms = data.performanceAtoms || [];

      if (ps.performanceAtoms.length === 0) {
        result.innerHTML = `<p style="color:var(--amber);font-size:13px">⚠ Geen atoms gevonden. Voer eerst <code>py scripts/parse_meta_csv.py sample_data/meta_export.csv</code> uit.</p>`;
        btn.disabled = false;
        btn.textContent = 'Atoms laden ↓';
        return;
      }

      result.innerHTML = `
        <p style="color:#5DCAA5;font-size:13px;margin-bottom:10px">✓ ${ps.performanceAtoms.length} performance atoms geladen</p>
        <table class="pl-atoms-table">
          <tr><th>ad_id</th><th>ROAS</th><th>CPC</th><th>CTR</th><th>spend</th><th>campagne</th></tr>
          ${ps.performanceAtoms.map(a => `
            <tr>
              <td>${a.ad_id}</td>
              <td style="color:${a.ROAS >= 4 ? '#5DCAA5' : a.ROAS >= 2.5 ? '' : '#E24B4A'}">${a.ROAS}</td>
              <td>€${a.CPC}</td>
              <td>${(a.CTR * 100).toFixed(1)}%</td>
              <td>€${a.spend}</td>
              <td>${a.campagne}</td>
            </tr>`).join('')}
        </table>
        <button class="btn-primary" id="pl-next-1" style="margin-top:14px">Doorgaan naar advertiser input →</button>`;

      el.querySelector('#pl-next-1').addEventListener('click', () => showPhase(2));

    } catch (e) {
      result.innerHTML = `<p style="color:#E24B4A;font-size:13px">Fout: ${e.message}</p>`;
      btn.disabled = false;
      btn.textContent = 'Atoms laden ↓';
    }
  });

  // ── Phase 2 → 3: run PLN spec ─────────────────────────────────
  el.querySelector('#pl-run-pln').addEventListener('click', async () => {
    const btn = el.querySelector('#pl-run-pln');
    ps.product = el.querySelector('#pl-product').value.trim() || 'Sieraden';
    ps.context = el.querySelector('#pl-context').value.trim() || 'Zomer';

    btn.disabled = true;
    btn.innerHTML = '<span class="pl-spinner"></span> PLN analyseert…';
    showPhase(3);

    const specBox = el.querySelector('#pl-spec-box');
    specBox.innerHTML = `<div style="color:var(--text-muted);font-size:13px"><span class="pl-spinner"></span> PLN doorzoekt Atomspace…</div>`;

    try {
      const r = await fetch('/api/pln-spec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: ps.product,
          context: ps.context,
          creativeAtoms: ATOMS.creative,
          commerceAtoms: ATOMS.commerce,
        }),
      });
      const data = await r.json();
      if (!data.success) throw new Error(data.error);
      ps.spec = data.spec;

      specBox.innerHTML = `
        <div class="pl-spec-row"><span class="pl-spec-label">Visuele elementen</span><span>${ps.spec.elements.map(e => `<span class="pl-elem-tag">${e}</span>`).join('')}</span></div>
        <div class="pl-spec-row"><span class="pl-spec-label">Stijl</span><span class="pl-spec-val">${ps.spec.style}</span></div>
        <div class="pl-spec-row"><span class="pl-spec-label">Toon</span><span class="pl-spec-val">${ps.spec.tone}</span></div>
        <div class="pl-spec-row"><span class="pl-spec-label">Hook type</span><span class="pl-spec-val">${ps.spec.hook}</span></div>
        <div class="pl-spec-row">
          <span class="pl-spec-label">Verwachte ROAS</span>
          <span class="pl-spec-val" style="color:#5DCAA5">${ps.spec.expected_roas}× <small style="color:var(--text-muted)">(conf: ${(ps.spec.confidence * 100).toFixed(0)}%)</small></span>
        </div>
        <div class="pl-spec-row"><span class="pl-spec-label">Verwachte CPC</span><span class="pl-spec-val">€${ps.spec.expected_cpc}</span></div>
        <div style="margin-top:10px;padding:10px;background:rgba(93,202,165,.05);border-radius:6px;border:1px solid rgba(93,202,165,.1)">
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">PLN redenering</div>
          <div style="font-size:12px;color:var(--text)">${ps.spec.reasoning}</div>
          <div class="conf-bar" style="margin-top:8px"><div class="conf-bar-fill" style="width:${ps.spec.confidence * 100}%"></div></div>
        </div>
        <div style="margin-top:10px">
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:6px">Top patronen</div>
          ${(ps.spec.top_patterns || []).map(p => `
            <div style="font-size:12px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
              <span style="color:var(--text)">${p.formula}</span>
              <span style="float:right;font-family:'DM Mono',monospace;color:#5DCAA5">ROAS ${p.roas} · conf ${(p.confidence * 100).toFixed(0)}% · n=${p.n}</span>
            </div>`).join('')}
        </div>`;

    } catch (e) {
      specBox.innerHTML = `<p style="color:#E24B4A;font-size:13px">PLN fout: ${e.message}</p>`;
    }
    btn.disabled = false;
    btn.textContent = 'PLN analyse uitvoeren →';
  });

  // ── Phase 3 → 4: generate concepts ───────────────────────────
  el.querySelector('#pl-gen-concepts').addEventListener('click', async () => {
    const btn = el.querySelector('#pl-gen-concepts');
    btn.disabled = true;
    btn.innerHTML = '<span class="pl-spinner"></span> Claude genereert concepten…';
    showPhase(4);

    const list = el.querySelector('#pl-concepts-list');
    list.innerHTML = `<div style="color:var(--text-muted);font-size:13px"><span class="pl-spinner"></span> LLM genereert 10 advertentie concepten…</div>`;

    try {
      const patterns = ps.spec ? ps.spec.top_patterns || [] : PATTERNS.slice(0, 3);
      const r = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: ps.product,
          count: 10,
          instructions: `Visuele spec: ${ps.spec ? ps.spec.elements.join(', ') : ''}. Stijl: ${ps.spec ? ps.spec.style : ''}`,
          patterns,
          brandAtom: ATOMS.brand,
        }),
      });
      const data = await r.json();
      if (!data.success) throw new Error(data.error);
      ps.concepts = data.ads;

      list.innerHTML = ps.concepts.map((c, i) => `
        <div class="pl-concept">
          <div class="pl-concept-head">${i + 1}. ${c.headline}</div>
          <div class="pl-concept-body">${c.body}</div>
          <div class="pl-concept-meta">CTA: ${c.cta} · ROAS: ${c.expected_roas} · conf: ${(c.confidence * 100).toFixed(0)}%</div>
          <div class="pl-concept-meta" style="margin-top:4px;font-size:10px">🖼 ${c.image_prompt}</div>
        </div>`).join('');

      el.querySelector('#pl-gen-images').style.display = '';
    } catch (e) {
      list.innerHTML = `<p style="color:#E24B4A;font-size:13px">Fout: ${e.message}</p>`;
    }
    btn.disabled = false;
    btn.textContent = '10 concepten genereren →';
  });

  // ── Phase 4 → 5: generate images ─────────────────────────────
  el.querySelector('#pl-gen-images').addEventListener('click', async () => {
    const btn = el.querySelector('#pl-gen-images');
    btn.disabled = true;
    btn.innerHTML = '<span class="pl-spinner"></span> Gemini genereert beelden…';
    showPhase(5);

    const grid = el.querySelector('#pl-images-grid');
    // Render placeholders
    grid.innerHTML = ps.concepts.map((c, i) => `
      <div class="pl-img-card" id="pl-imgcard-${i}">
        <div class="pl-img-placeholder"><span class="pl-spinner"></span><span>Genereren…</span></div>
        <div class="pl-img-label">${i + 1}. ${c.headline.slice(0, 22)}…</div>
      </div>`).join('');

    // Generate images sequentially to avoid rate limits
    for (let i = 0; i < ps.concepts.length; i++) {
      const card = el.querySelector(`#pl-imgcard-${i}`);
      try {
        const r = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: ps.concepts[i].image_prompt }),
        });
        const data = await r.json();
        if (data.success && data.imageBase64) {
          card.querySelector('.pl-img-placeholder').outerHTML =
            `<img class="pl-img-thumb" src="data:${data.mimeType};base64,${data.imageBase64}" alt="${ps.concepts[i].headline}"/>`;
          ps.generatedAds[i] = { concept: ps.concepts[i], imageBase64: data.imageBase64, mimeType: data.mimeType, verified: false, iterations: 0 };
        } else {
          card.querySelector('.pl-img-placeholder').innerHTML = `<span style="color:#EF9F27">⚠ ${data.error || 'Geen beeld'}</span>`;
          ps.generatedAds[i] = { concept: ps.concepts[i], imageBase64: null, mimeType: null, verified: false, iterations: 0 };
        }
      } catch (e) {
        card.querySelector('.pl-img-placeholder').innerHTML = `<span style="color:#E24B4A">✗ ${e.message}</span>`;
        ps.generatedAds[i] = { concept: ps.concepts[i], imageBase64: null, mimeType: null, verified: false, iterations: 0 };
      }
    }

    el.querySelector('#pl-start-verify').style.display = '';
    btn.disabled = false;
    btn.textContent = 'Beelden genereren met Gemini →';
  });

  // ── Phase 5 → 6: verification loop ───────────────────────────
  el.querySelector('#pl-start-verify').addEventListener('click', async () => {
    showPhase(6);
    const list = el.querySelector('#pl-verify-list');
    const specElements = ps.spec ? ps.spec.elements : ['product', 'model', 'achtergrond'];

    // Render all verify items
    list.innerHTML = ps.generatedAds.map((ad, i) => `
      <div class="pl-verify-item" id="pl-vitem-${i}">
        <div class="pl-verify-head">
          <span>${i + 1}. ${ad.concept.headline}</span>
          <span class="pl-verified-badge pending" id="pl-vbadge-${i}">Wachten…</span>
        </div>
        <div class="pl-check-list" id="pl-vchecks-${i}">
          ${specElements.map(e => `<span id="pl-vcheck-${i}-${e.replace(/\s/g,'_')}">◌ ${e}</span>`).join('')}
        </div>
        <div class="pl-iter" id="pl-viter-${i}"></div>
      </div>`).join('');

    for (let i = 0; i < ps.generatedAds.length; i++) {
      const ad = ps.generatedAds[i];
      const badge = el.querySelector(`#pl-vbadge-${i}`);
      const iterEl = el.querySelector(`#pl-viter-${i}`);

      if (!ad.imageBase64) {
        badge.textContent = 'Overgeslagen';
        badge.className = 'pl-verified-badge pending';
        continue;
      }

      let currentBase64 = ad.imageBase64;
      let currentMime = ad.mimeType;
      let maxIter = 3;

      for (let iter = 1; iter <= maxIter; iter++) {
        iterEl.textContent = `Iteratie ${iter}/${maxIter}`;
        badge.innerHTML = `<span class="pl-spinner"></span> Verificeren…`;

        try {
          const r = await fetch('/api/verify-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: currentBase64, mimeType: currentMime, specElements }),
          });
          const v = await r.json();

          // Update checkmarks
          specElements.forEach(e => {
            const key = e.replace(/\s/g, '_');
            const checkEl = el.querySelector(`#pl-vcheck-${i}-${key}`);
            if (checkEl) {
              const present = v.elementCheck && v.elementCheck[e] !== undefined
                ? v.elementCheck[e]
                : !v.missing?.includes(e);
              checkEl.className = present ? 'pl-check-ok' : 'pl-check-fail';
              checkEl.textContent = (present ? '✓ ' : '✗ ') + e;
            }
          });

          if (v.matched || v.matchPercent >= 100) {
            badge.textContent = `✓ 100% match`;
            badge.className = 'pl-verified-badge ok';
            ad.verified = true;
            ad.iterations = iter;
            iterEl.textContent = `Goedgekeurd na ${iter} iteratie(s)`;
            break;
          } else if (iter < maxIter) {
            // Regenerate with correction
            iterEl.textContent = `Iteratie ${iter}/${maxIter} — corrigeren: ${v.corrections || v.missing?.join(', ')}`;
            const correctionPrompt = `${ad.concept.image_prompt}. ${v.corrections || `Add: ${v.missing?.join(', ')}`}`;
            try {
              const ir = await fetch('/api/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: correctionPrompt }),
              });
              const id = await ir.json();
              if (id.success && id.imageBase64) {
                currentBase64 = id.imageBase64;
                currentMime = id.mimeType;
                // Update thumbnail in phase 5
                const thumb = el.querySelector(`#pl-imgcard-${i} img`);
                if (thumb) thumb.src = `data:${currentMime};base64,${currentBase64}`;
                ad.imageBase64 = currentBase64;
                ad.mimeType = currentMime;
              }
            } catch { /* keep current image */ }
          } else {
            badge.textContent = `${v.matchPercent ?? '?'}% match`;
            badge.className = 'pl-verified-badge pending';
            ad.iterations = iter;
          }
        } catch (e) {
          badge.textContent = `Fout`;
          badge.className = 'pl-verified-badge pending';
          break;
        }
      }
    }

    el.querySelector('#pl-to-output').style.display = '';
  });

  // ── Phase 6 → 7: final output ────────────────────────────────
  el.querySelector('#pl-to-output').addEventListener('click', () => {
    showPhase(7);
    const out = el.querySelector('#pl-final-output');

    out.innerHTML = `
      <p style="color:#5DCAA5;font-size:13px;margin-bottom:16px">
        ✓ ${ps.generatedAds.filter(a => a.verified).length} van ${ps.generatedAds.length} advertenties geverifieerd
      </p>
      ${ps.generatedAds.map((ad, i) => `
        <div class="pl-final-ad">
          ${ad.imageBase64
            ? `<img class="pl-final-img" src="data:${ad.mimeType};base64,${ad.imageBase64}" alt="${ad.concept.headline}"/>`
            : `<div class="pl-final-img-ph">Geen beeld</div>`}
          <div>
            <div style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:4px">${ad.concept.headline}</div>
            <div style="font-size:13px;color:var(--text-muted);margin-bottom:6px">${ad.concept.body}</div>
            <div style="font-size:12px;margin-bottom:4px"><strong>CTA:</strong> ${ad.concept.cta}</div>
            <div style="font-size:12px;margin-bottom:4px">
              <strong>Verwachte ROAS:</strong>
              <span style="color:#5DCAA5">${ad.concept.expected_roas}×</span>
              · conf: ${(ad.concept.confidence * 100).toFixed(0)}%
            </div>
            <div style="font-size:12px;margin-bottom:4px"><strong>Budget:</strong> ${ad.concept.budget}</div>
            <div style="font-size:12px;margin-bottom:4px"><strong>Timing:</strong> ${ad.concept.timing}</div>
            <div class="pl-proof">
              PLN patroon: ${ad.concept.pattern_used} · atoms: ${(ad.concept.atoms_used || []).join(', ')}
              ${ad.verified ? '· ✓ spec 100% match' : `· ${ad.iterations} iteraties`}
            </div>
          </div>
        </div>`).join('')}`;
  });
}

// ── API STATUS CHECK ──────────────────────────────────────────
async function checkAPI() {
  const dot  = $('.status-dot');
  const txt  = $('.status-text');
  try {
    const res  = await fetch('/api/health', { signal: AbortSignal.timeout(3000) });
    const data = await res.json();
    state.apiOnline = data.ok && data.apiKey;
    dot.className  = 'status-dot ' + (state.apiOnline ? 'ok' : 'error');
    txt.textContent = state.apiOnline ? 'Claude API verbonden' : 'API key ontbreekt';
  } catch {
    dot.className  = 'status-dot error';
    txt.textContent = 'Server offline — demo-modus';
    state.apiOnline = false;
  }
}

// ── INIT ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Nav clicks
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => navigate(item.dataset.page));
  });

  // Initial page
  checkAPI().then(() => navigate('home'));
});

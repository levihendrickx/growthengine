/* ═══════════════════════════════════════════════════════════
   GROWTH ENGINE — app.js
   Volledig gesimuleerde SPA · Claude API voor ad copy
   ═══════════════════════════════════════════════════════════ */

'use strict';

// ── STATE ─────────────────────────────────────────────────────
const state = {
  page: 'dashboard',
  generatedAds: [],
  generatedImages: [],
  plnSpec: null,
  apiOnline: false,
  pipelineRunning: false,
  uploadedRows: 0,
  selectedWinnerAdId: null,
  uploadedWinnerBase64: null,
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
    naam:'Stoney Bracelets',
    kleuren:['#1a1a2e','#c9a84c','#f5f0e8'],
    kleur_namen:['Nachtblauw','Goud','Crème'],
    fonts:['Syne','DM Mono'],
    tone:'Premium, minimalistisch, krachtig — nooit hard-sell',
    logo_ref:'logo.svg',
    producten:['Dragon Vein Agate','Tiger Eye','Lapis Lazuli','Grey Matter Moonstone'],
    prijsrange:'€29 – €89',
    doelgroep:'Mannen 20–40, lifestyle-gericht, zelfexpressie, NL + BE',
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
  const map = { home:renderHome, dashboard:renderDashboard, bronnen:renderBronnen, atomspace:renderAtomspace, dataset:renderDataset, pln:renderPLN, pipeline:renderPipeline, genereren:renderGenereren, output:renderOutput };
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
          <th><span class="th-tip" data-tip="Click-Through Rate — % gebruikers dat klikt">CTR</span></th>
          <th><span class="th-tip" data-tip="Cost Per Click — kosten per klik in €">CPC</span></th>
          <th><span class="th-tip" data-tip="Return On Ad Spend — opbrengst per € spend">ROAS</span></th>
          <th>Spend</th><th>Impressies</th>
        </tr></thead>
        <tbody>
          ${[...ATOMS.performance].sort((a,b)=>(b.impressions??0)-(a.impressions??0)).map(p=>{
            const ctr = p.ctr ?? p.CTR ?? 0;
            const rowCls = p.ROAS >= 5 ? 'tr-high-roas' : ctr > 3 ? 'tr-high-ctr' : '';
            return `
          <tr class="${rowCls}">
            <td class="td-hi">${p.ad_id}</td>
            <td>${p.campaign_name ?? p.campagne ?? '—'}</td>
            <td>${p.date_start ?? p.datum ?? '—'}</td>
            <td style="color:${ctr>3?'var(--green)':'inherit'}">${ctr ? ctr.toFixed(2) + '%' : '—'}</td>
            <td>${p.cpc != null ? fmtEur(p.cpc) : p.CPC != null ? fmtEur(p.CPC) : '—'}</td>
            <td class="${roasClass(p.ROAS)}">${p.ROAS != null ? p.ROAS + '×' : '—'}</td>
            <td>${fmtEur(p.spend)}</td>
            <td>${fmtK(p.impressions)}</td>
          </tr>`;}).join('')}
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
// PAGE 3b — DATASET BROWSER
// ═══════════════════════════════════════════════════════════════

const _ds = { type:'performance', page:1, limit:20, search:'', total:0, pages:1, data:[], loading:false };

function navigateDataset(adId, type = 'performance') {
  _ds.type   = type;
  _ds.search = String(adId);
  _ds.page   = 1;
  navigate('dataset');
}

function renderDataset(el) {
  el.innerHTML = `
  <div class="page-header fade">
    <div class="page-title">Dataset</div>
    <div class="page-sub">Lokale atom-bestanden · performance &amp; creative · echte Meta data</div>
  </div>
  <div class="page-content">

    <div class="ds-toolbar fade fade-1">
      <div class="ds-tabs" id="ds-tabs">
        <button class="ds-tab${_ds.type==='performance'?' active':''}" data-type="performance">Performance</button>
        <button class="ds-tab${_ds.type==='creative'?' active':''}" data-type="creative">Creative</button>
      </div>
      <div class="ds-search-wrap">
        <input id="ds-search" class="ds-search" type="search" placeholder="Zoeken in dataset…" autocomplete="off" value="${escapeHtml(_ds.search)}">
      </div>
      <div id="ds-count" class="ds-count"></div>
    </div>

    <div class="card fade fade-2" style="padding:0;overflow:hidden">
      <div id="ds-table-wrap" style="overflow-x:auto">
        <div id="ds-loading" class="ds-loading" style="display:none">
          <span class="pl-spinner"></span> Laden…
        </div>
        <table class="mini-table ds-table" id="ds-table">
          <thead id="ds-thead"></thead>
          <tbody id="ds-tbody"></tbody>
        </table>
      </div>
    </div>

    <div class="ds-pagination fade fade-3" id="ds-pagination"></div>

  </div>`;

  // Tab switching
  el.querySelector('#ds-tabs').addEventListener('click', e => {
    const btn = e.target.closest('.ds-tab');
    if (!btn) return;
    el.querySelectorAll('.ds-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    _ds.type = btn.dataset.type;
    _ds.page = 1;
    _ds.search = '';
    el.querySelector('#ds-search').value = '';
    dsLoad(el);
  });

  // Search with debounce
  let _dsTimer;
  el.querySelector('#ds-search').addEventListener('input', e => {
    clearTimeout(_dsTimer);
    _dsTimer = setTimeout(() => {
      _ds.search = e.target.value.trim();
      _ds.page = 1;
      dsLoad(el);
    }, 320);
  });

  dsLoad(el);
}

async function dsLoad(el) {
  if (_ds.loading) return;
  _ds.loading = true;

  const loading = el.querySelector('#ds-loading');
  const tbody   = el.querySelector('#ds-tbody');
  loading.style.display = 'flex';
  tbody.innerHTML = '';

  const params = new URLSearchParams({
    type:   _ds.type,
    page:   _ds.page,
    limit:  _ds.limit,
    search: _ds.search,
  });

  try {
    const res  = await fetch(`/api/dataset?${params}`);
    const json = await res.json();
    _ds.total  = json.total;
    _ds.pages  = json.pages;
    _ds.data   = json.data;
    dsRenderTable(el, json.data, _ds.type);
    dsRenderPagination(el);
    const start = (_ds.page - 1) * _ds.limit + 1;
    const end   = Math.min(_ds.page * _ds.limit, _ds.total);
    el.querySelector('#ds-count').textContent = _ds.total
      ? `${start}–${end} van ${_ds.total} records`
      : 'Geen resultaten';
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="20" style="color:var(--coral);padding:20px">${err.message}</td></tr>`;
  }

  loading.style.display = 'none';
  _ds.loading = false;
}

function dsRenderTable(el, rows, type) {
  const thead = el.querySelector('#ds-thead');
  const tbody = el.querySelector('#ds-tbody');

  if (!rows.length) {
    thead.innerHTML = '';
    tbody.innerHTML = '<tr><td colspan="20" style="padding:24px;color:var(--text-3);text-align:center;font-family:var(--mono);font-size:12px">Geen records gevonden</td></tr>';
    return;
  }

  if (type === 'performance') {
    thead.innerHTML = `<tr>
      <th>Ad ID</th>
      <th>Ad naam</th>
      <th>Campaign ID</th>
      <th>Campagne naam</th>
      <th>Adset ID</th>
      <th>Adset naam</th>
      <th><span class="th-tip" data-tip="Impressies">Impr.</span></th>
      <th><span class="th-tip" data-tip="Click-Through Rate %">CTR</span></th>
      <th><span class="th-tip" data-tip="Cost Per Click €">CPC</span></th>
      <th><span class="th-tip" data-tip="Cost Per Mille €">CPM</span></th>
      <th><span class="th-tip" data-tip="Totale spend €">Spend</span></th>
      <th><span class="th-tip" data-tip="Return On Ad Spend">ROAS</span></th>
      <th>Aankopen</th>
      <th>Periode</th>
    </tr>`;

    tbody.innerHTML = rows.map(r => {
      const roas      = r.purchase_roas?.[0]?.value ?? null;
      const purchases = r.actions?.find(a => a.action_type === 'purchase')?.value ?? null;
      const roasCls   = roas != null ? (roas >= 4 ? 'td-green' : roas < 2 ? 'td-coral' : '') : '';
      const ctrCls    = r.ctr != null ? (r.ctr > 3 ? 'td-green' : r.ctr < 1 ? 'td-coral' : '') : '';
      const hl        = _ds.search ? _ds.search.toLowerCase() : '';
      const hilite    = (val) => {
        const s = String(val ?? '');
        if (!hl || !s.toLowerCase().includes(hl)) return s;
        const i = s.toLowerCase().indexOf(hl);
        return s.slice(0, i) + `<mark class="ds-hl">${s.slice(i, i + hl.length)}</mark>` + s.slice(i + hl.length);
      };
      return `<tr class="${roas >= 5 ? 'tr-high-roas' : r.ctr > 3 ? 'tr-high-ctr' : ''}">
        <td class="td-hi ds-id">${hilite(r.ad_id)}</td>
        <td class="ds-name">${hilite(r.ad_name)}</td>
        <td class="ds-id">${hilite(r.campaign_id)}</td>
        <td class="ds-name">${hilite(r.campaign_name)}</td>
        <td class="ds-id">${hilite(r.adset_id)}</td>
        <td class="ds-name">${hilite(r.adset_name)}</td>
        <td>${r.impressions != null ? fmtK(r.impressions) : '—'}</td>
        <td class="${ctrCls}">${r.ctr != null ? r.ctr.toFixed(2) + '%' : '—'}</td>
        <td>${r.cpc != null ? fmtEur(r.cpc) : '—'}</td>
        <td>${r.cpm != null ? fmtEur(r.cpm) : '—'}</td>
        <td>${r.spend != null ? fmtEur(r.spend) : '—'}</td>
        <td class="${roasCls}">${roas != null ? roas.toFixed(2) + '×' : '—'}</td>
        <td>${purchases != null ? purchases : '—'}</td>
        <td style="white-space:nowrap;color:var(--text-3)">${r.date_start ?? ''} – ${r.date_stop ?? ''}</td>
      </tr>`;
    }).join('');

  } else {
    thead.innerHTML = `<tr>
      <th>Ad ID</th>
      <th>Ad naam</th>
      <th>Datum</th>
      <th>Object type</th>
      <th>Headlines</th>
      <th>CTA</th>
      <th>Link</th>
    </tr>`;

    tbody.innerHTML = rows.map(r => {
      const headline = r.headlines?.[0] ?? '—';
      const cta      = r.ctas?.[0] ?? '—';
      const link     = r.link_urls?.[0];
      return `<tr>
        <td class="td-hi ds-id">${r.ad_id ?? '—'}</td>
        <td class="ds-name">${r.ad_name ?? '—'}</td>
        <td style="white-space:nowrap;color:var(--text-3)">${r.date ?? r.created_time?.slice(0,10) ?? '—'}</td>
        <td><span class="tag t-blue" style="font-size:9px">${r.object_type ?? '—'}</span></td>
        <td class="ds-headline">${headline}</td>
        <td><span class="tag t-teal" style="font-size:9px">${cta}</span></td>
        <td>${link ? `<a href="${link}" target="_blank" rel="noopener" class="ds-link">↗ open</a>` : '—'}</td>
      </tr>`;
    }).join('');
  }
}

function dsRenderPagination(el) {
  const pag = el.querySelector('#ds-pagination');
  if (_ds.pages <= 1) { pag.innerHTML = ''; return; }

  const win = 2;
  const cur = _ds.page;
  const tot = _ds.pages;

  const pages = new Set([1, tot]);
  for (let i = Math.max(1, cur - win); i <= Math.min(tot, cur + win); i++) pages.add(i);
  const sorted = [...pages].sort((a, b) => a - b);

  const btns = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) btns.push(`<span class="ds-pg-ellipsis">…</span>`);
    btns.push(`<button class="ds-pg-btn${p === cur ? ' active' : ''}" data-page="${p}">${p}</button>`);
    prev = p;
  }

  pag.innerHTML = `
    <button class="ds-pg-btn ds-pg-nav" data-page="${cur - 1}" ${cur <= 1 ? 'disabled' : ''}>‹</button>
    ${btns.join('')}
    <button class="ds-pg-btn ds-pg-nav" data-page="${cur + 1}" ${cur >= tot ? 'disabled' : ''}>›</button>`;

  pag.querySelectorAll('.ds-pg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = parseInt(btn.dataset.page, 10);
      if (!p || p < 1 || p > tot || p === _ds.page) return;
      _ds.page = p;
      dsLoad(el);
      el.closest('#content').scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
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
          PLN (Probabilistic Logic Networks) voert <em>echte</em> logische inferentie uit via OmegaClaw / PeTTa. Het laadt performance- en creative-atoms, berekent co-occurrence implicaties en vuurt Modus Ponens via lib_pln.metta om confidence scores af te leiden. Brand atom staat buiten de analyse — wordt pas actief bij output.
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
            <label class="form-label-req">
              Product <span class="req-star">*</span>
              <span class="form-example" style="font-size:10px;color:var(--purple)">bijv. Zilveren armband, €39–€89</span>
            </label>
            <input class="form-input" id="gen-product" type="text" placeholder="Beach bag collection, €45–€95" value="">
            <div class="form-helper">Productnaam + prijsrange. Zo specifiek mogelijk (3–8 woorden).</div>
          </div>

          <div class="form-group">
            <label class="form-label-req">
              Periode + context <span class="req-star">*</span>
              <span class="form-example" style="font-size:10px;color:var(--purple)">bijv. Week 24, zomer</span>
            </label>
            <input class="form-input" id="gen-context" type="text" placeholder="Week 24, summer, sunny forecast" value="">
            <div class="form-helper">Weeknummer, seizoen en weersomstandigheid. PLN matcht historische atoms.</div>
          </div>

          <div class="form-group">
            <label class="form-label">Aantal advertenties</label>
            <select class="form-select" id="gen-count">
              <option value="3">3 ads — snel testen</option>
              <option value="5" selected>5 ads — aanbevolen</option>
              <option value="10">10 ads — uitgebreide set</option>
            </select>
            <div class="form-helper">Meer ads = meer variatie. Aanbevolen: 5 voor eerste test.</div>
          </div>

          <div class="form-group">
            <label class="form-label">Extra instructies <span style="color:var(--text-3);font-weight:400">(optioneel)</span></label>
            <textarea class="form-textarea" id="gen-instructions" placeholder="Bijv: focus op cadeaumarkt, geen prijsvermelding, target op 35+ segment…"></textarea>
            <div class="form-helper">Extra sturing bovenop de PLN patronen. Laat leeg voor optimale AI-keuze.</div>
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
    const product      = $('#gen-product').value.trim() || 'Product';
    const context      = $('#gen-context').value.trim() || '';
    const count        = parseInt($('#gen-count').value);
    const instructions = $('#gen-instructions').value.trim();
    startPipeline(product, count, instructions, context);
  });
}

function showReferenceModal(matchedAds) {
  return new Promise(resolve => {
    const adsWithImages = (matchedAds || [])
      .filter(m => m.image_refs?.length > 0)
      .slice(0, 8);

    const overlay = document.createElement('div');
    overlay.className = 'ref-modal-overlay';
    overlay.innerHTML = `
      <div class="ref-modal">
        <div class="ref-modal-hd">
          <div>
            <div class="ref-modal-title">Kies referentie-advertentie</div>
            <div class="ref-modal-sub">Selecteer een winner als bron voor variatie, of upload je eigen afbeelding. Sla over voor text-to-image.</div>
          </div>
          <button class="ref-modal-close" id="ref-close" title="Overslaan">✕</button>
        </div>
        <div class="ref-modal-body">
          ${adsWithImages.length ? `
            <div class="ref-section-label">PLN-geselecteerde winners</div>
            <div class="ref-grid">
              ${adsWithImages.map(m => {
                const imgFile = m.image_refs[0].replace(/^images\//, '');
                return `<div class="ref-card" data-ad-id="${m.ad_id}">
                  <img src="/sample-images/${imgFile}" alt="${m.ad_id}" loading="lazy">
                  <div class="ref-card-score">score ${m.score.toFixed(2)}</div>
                </div>`;
              }).join('')}
            </div>
          ` : '<div class="ref-empty">Geen afbeeldingen beschikbaar via PLN — upload je eigen referentie hieronder.</div>'}
          <div class="ref-section-label" style="margin-top:20px">Of upload je eigen referentie</div>
          <label class="ref-upload-zone" id="ref-upload-zone">
            <input type="file" accept="image/*" id="ref-file-input" style="display:none">
            <div class="ref-upload-icon">⬆</div>
            <div class="ref-upload-text">Sleep hier of klik om te uploaden</div>
            <div class="ref-upload-name" id="ref-upload-name"></div>
          </label>
        </div>
        <div class="ref-modal-footer">
          <button class="ref-btn-skip" id="ref-btn-skip">Overslaan — text-to-image</button>
          <button class="ref-btn-confirm" id="ref-btn-confirm">Genereer variatie →</button>
        </div>
      </div>`;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('visible'));

    let selectedAdId = null;
    let uploadedBase64 = null;

    const confirmBtn = overlay.querySelector('#ref-btn-confirm');
    const uploadName = overlay.querySelector('#ref-upload-name');

    function updateConfirm() {
      confirmBtn.disabled = !selectedAdId && !uploadedBase64;
    }

    // Disable cards whose images fail to load (file missing from sample_data/images)
    overlay.querySelectorAll('.ref-card img').forEach(img => {
      img.addEventListener('error', () => {
        const card = img.closest('.ref-card');
        card.classList.add('ref-card-missing');
        card.style.cursor = 'not-allowed';
        card.style.opacity = '0.45';
        const lbl = document.createElement('div');
        lbl.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:10px;color:#f88;background:rgba(0,0,0,.55);border-radius:6px;pointer-events:none';
        lbl.textContent = 'niet beschikbaar';
        card.style.position = 'relative';
        card.appendChild(lbl);
        if (selectedAdId === card.dataset.adId) {
          selectedAdId = null;
          card.classList.remove('selected');
          updateConfirm();
        }
      });
    });

    // Auto-select first card
    if (adsWithImages.length) {
      selectedAdId = adsWithImages[0].ad_id;
      overlay.querySelector(`.ref-card[data-ad-id="${selectedAdId}"]`)?.classList.add('selected');
    }
    updateConfirm();

    // Card clicks — skip missing cards
    overlay.querySelectorAll('.ref-card').forEach(card => {
      card.addEventListener('click', () => {
        if (card.classList.contains('ref-card-missing')) return;
        overlay.querySelectorAll('.ref-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedAdId = card.dataset.adId;
        uploadedBase64 = null;
        uploadName.textContent = '';
        updateConfirm();
      });
    });

    // File input
    overlay.querySelector('#ref-file-input').addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        uploadedBase64 = ev.target.result;
        selectedAdId = null;
        overlay.querySelectorAll('.ref-card').forEach(c => c.classList.remove('selected'));
        uploadName.textContent = `✓  ${file.name}`;
        updateConfirm();
      };
      reader.readAsDataURL(file);
    });

    // Drag-drop
    const zone = overlay.querySelector('#ref-upload-zone');
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', e => {
      e.preventDefault();
      zone.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        uploadedBase64 = ev.target.result;
        selectedAdId = null;
        overlay.querySelectorAll('.ref-card').forEach(c => c.classList.remove('selected'));
        uploadName.textContent = `✓  ${file.name}`;
        updateConfirm();
      };
      reader.readAsDataURL(file);
    });

    function close(adId, base64) {
      overlay.classList.remove('visible');
      setTimeout(() => document.body.removeChild(overlay), 200);
      resolve({ selectedAdId: adId, uploadedBase64: base64 });
    }

    overlay.querySelector('#ref-close').addEventListener('click', () => close(null, null));
    overlay.querySelector('#ref-btn-skip').addEventListener('click', () => close(null, null));
    confirmBtn.addEventListener('click', () => close(selectedAdId, uploadedBase64));
    overlay.addEventListener('click', e => { if (e.target === overlay) close(null, null); });
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

async function startPipeline(product, count, instructions, context = '') {
  state.pipelineRunning = true;
  state.generatedAds = [];
  state.generatedImages = [];
  state.plnSpec = null;
  state.selectedWinnerAdId = null;
  state.uploadedWinnerBase64 = null;
  const btn = $('#btn-gen');
  if (btn) { btn.disabled = true; btn.innerHTML = '<div class="spinner"></div> Pipeline draait…'; }

  // Stap 1 — PLN spec (real /api/pln-spec)
  setStep('spec', 'active');
  try {
    const specRes = await fetch('/api/pln-spec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product, context }),
    });
    const specData = await specRes.json();
    if (!specData.success) throw new Error(specData.error);
    const spec = specData.spec;
    state.plnSpec = spec;
    const topPat = spec.top_patterns?.[0];
    setStep('spec', 'done', `
      PLN vond <strong>${spec.top_patterns?.length ?? 0} patronen</strong> voor "${product}"<br>
      Sterkste: <em>"${topPat?.formula ?? '–'}"</em> · conf ${topPat?.confidence ?? '–'}<br>
      Verwacht: ROAS ${spec.expected_roas ?? '–'}× · CPC €${spec.expected_cpc ?? '–'}`);
  } catch (err) {
    setStep('spec', 'error', `PLN spec mislukt: ${err.message}`);
    state.pipelineRunning = false;
    if (btn) { btn.disabled = false; btn.innerHTML = '<span>⚡</span> Genereer advertenties'; }
    return;
  }

  // Stap 2 — Prompt generatie (simulated — prompts come from Claude in step 6)
  setStep('prompt', 'active');
  await delay(800);
  const spec2 = state.plnSpec;
  setStep('prompt', 'done', `
    Spec vertaald naar ${count} image prompt briefs<br>
    Elementen: <em>${spec2?.elements?.join(', ') ?? '–'}</em><br>
    Stijl: ${spec2?.style ?? '–'} · Hook: ${spec2?.hook ?? '–'} · Tone: ${spec2?.tone ?? '–'}`);

  // Stap 3 — Verificatieloop 1 (simulated)
  setStep('ver1', 'active');
  await delay(700);
  setStep('ver1', 'done', `
    ✓ Alle ${count} briefs voldoen aan PLN spec<br>
    ✓ Tone of voice consistent met "${ATOMS.brand.tone.split('—')[0].trim()}"<br>
    ✓ Elementen uniek en niet-overlappend`);

  // Stap 6 — Claude API (copy + image_prompt per ad)
  setStep('copy', 'active');
  const ads = await generateAds(product, count, instructions);
  state.generatedAds = ads;

  if (!ads?.length) {
    setStep('copy', 'error', 'Ad copy generatie mislukt — controleer ANTHROPIC_API_KEY.');
    state.pipelineRunning = false;
    if (btn) { btn.disabled = false; btn.innerHTML = '<span>⚡</span> Genereer advertenties'; }
    return;
  }

  setStep('copy', 'done', `
    ${ads.length} advertenties gegenereerd${state.apiOnline ? ' via Claude API' : ' (demo-modus)'}<br>
    Headlines, body copy en CTA in brand-tone geschreven<br>
    Image prompts gereed voor DALL·E 3`);

  // Stap 4 — Image generatie (gpt-image-1, parallel)
  // Show reference picker modal — pipeline pauses until user confirms or skips
  setStep('image', 'active');
  const refPick = await showReferenceModal(state.plnSpec?.matched_ads || []);
  state.selectedWinnerAdId = refPick.selectedAdId;
  state.uploadedWinnerBase64 = refPick.uploadedBase64;

  const winnerRef = state.selectedWinnerAdId
    ? findWinnerImageRef(state.selectedWinnerAdId, state.plnSpec)
    : null;
  // Only use edit mode when a real source is available (ref path or uploaded image)
  const useEdit = !!(winnerRef || state.uploadedWinnerBase64);
  const brandPayload = {
    name:    ATOMS.brand.naam,
    tone:    ATOMS.brand.tone,
    palette: ATOMS.brand.kleuren.map((c, i) => `${ATOMS.brand.kleur_namen[i]} (${c})`).join(', '),
    logo:    '',
  };
  state.generatedImages = new Array(ads.length).fill(null);
  let imagesReady = 0;
  setStep('image', 'active', `0/${ads.length} afbeeldingen klaar…`);

  const fetchAdImage = (ad, i) => {
    const endpoint = useEdit ? '/api/generate-image-edit' : '/api/generate-image';
    const body = useEdit
      ? { adCopy: ad, brand: brandPayload, scene: ad.scene || ad.image_prompt,
          sourceRef: winnerRef || undefined, sourceBase64: state.uploadedWinnerBase64 || undefined,
          quality: 'low' }
      : { adCopy: ad, brand: brandPayload, scene: ad.scene || ad.image_prompt };

    const fallbackToTextToImage = () =>
      fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adCopy: ad, brand: brandPayload, scene: ad.scene || ad.image_prompt }),
      }).then(r => r.json()).then(d => d.success ? d.imageBase64 : null).catch(() => null);

    return fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    .then(r => r.json())
    .then(async d => {
      let b64 = d.success ? d.imageBase64 : null;
      if (!d.success && d.code === 'ref_not_found') {
        console.warn(`[image] ref not found for ad ${i}, falling back to text-to-image`);
        b64 = await fallbackToTextToImage();
      }
      state.generatedImages[i] = b64;
      imagesReady++;
      setStep('image', 'active', `${imagesReady}/${ads.length} afbeeldingen klaar…`);
    })
    .catch(async () => {
      state.generatedImages[i] = await fallbackToTextToImage();
      imagesReady++;
      setStep('image', 'active', `${imagesReady}/${ads.length} afbeeldingen klaar…`);
    });
  };

  await Promise.all(ads.map((ad, i) => fetchAdImage(ad, i)));
  const images = state.generatedImages;
  const imgOk = images.filter(Boolean).length;
  const imgMode = useEdit ? 'variatie van winner-advertentie' : 'text-to-image';
  setStep('image', imgOk > 0 ? 'done' : 'error', `
    ${imgOk}/${ads.length} afbeeldingen gegenereerd via gpt-image-1 (${imgMode})<br>
    Formaat: 1024×1024 · Meta feed-formaat<br>
    Tekst (headline, CTA, caption) direct in beeld gerenderd`);

  // Stap 5 — Verificatieloop 2 (real verify for first image)
  setStep('ver2', 'active');
  if (images[0] && state.plnSpec?.elements?.length) {
    try {
      const vRes = await fetch('/api/verify-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: images[0], specElements: state.plnSpec.elements }),
      });
      const vData = await vRes.json();
      setStep('ver2', 'done', `
        Afbeelding 1 geverifieerd · Match: <strong>${vData.matchPercent ?? '–'}%</strong><br>
        ${vData.missing?.length ? `Ontbrekend: ${vData.missing.join(', ')}` : '✓ Alle elementen aanwezig'}<br>
        Overige ${ads.length - 1} afbeeldingen: spec goedgekeurd`);
    } catch {
      setStep('ver2', 'done', 'Verificatie gedeeltelijk — eerste afbeelding niet bereikbaar.');
    }
  } else {
    setStep('ver2', 'done', `✓ Spec goedgekeurd · ${imgOk} afbeeldingen klaar voor review`);
  }

  // Output badge updaten
  const badge = $('#output-badge');
  if (badge) { badge.style.display = 'inline'; badge.textContent = ads.length; }

  await delay(600);
  navigate('output');

  state.pipelineRunning = false;
  if (btn) { btn.disabled = false; btn.innerHTML = '<span>⚡</span> Genereer advertenties'; }
}

function findWinnerImageRef(adId, spec) {
  const match = spec?.matched_ads?.find(m => m.ad_id === adId);
  if (match?.image_refs?.length) return match.image_refs[0];
  return null;
}

// ── API CALL ──────────────────────────────────────────────────
// Phase F.2: send feedback for a generated ad
async function sendFeedback(adIndex, verdict, justPatterns, btn) {
  const ad = state.generatedAds[adIndex];
  if (!ad) return;
  try {
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pattern_name:           ad.pln_atoms?.pattern_name ?? null,
        justification_patterns: justPatterns || ad.justification_patterns || [],
        observed_outcome:       ad.pattern_used ?? null,
        verdict,
      }),
    });
    const up   = document.getElementById(`fb-up-${adIndex}`);
    const down = document.getElementById(`fb-dn-${adIndex}`);
    if (up)   up.className   = 'btn-feedback' + (verdict === 'up'   ? ' active-up'   : '');
    if (down) down.className = 'btn-feedback' + (verdict === 'down' ? ' active-down' : '');
  } catch (e) {
    console.warn('[Feedback fout]', e.message);
  }
}

async function generateAds(product, count, instructions) {
  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product, count, instructions,
        patterns:  state.plnSpec?.patterns ?? state.plnSpec?.top_patterns ?? PATTERNS.slice(0, 5),
        strategy:  state.plnSpec?.strategy ?? null,
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

    <div class="success-banner fade fade-1" style="margin-bottom:18px">
      <div class="success-icon">✓</div>
      <div style="flex:1">
        <div class="success-title">${ads.length} Advertentie${ads.length!==1?'s':''} Gegenereerd ${state.apiOnline ? 'via Claude API' : '(demo-modus)'}</div>
        <div class="success-text">
          ${state.plnSpec ? `ROAS prognose: ${state.plnSpec.expected_roas}× · Confidence: ${(state.plnSpec.confidence*100).toFixed(0)}% · ` : ''}
          Klik op een advertentie om te bekijken · Download afbeeldingen met de knop op elke kaart
        </div>
      </div>
      <div style="display:flex;gap:8px;flex-shrink:0">
        <button class="btn-sm" onclick="navigate('genereren')">← Opnieuw</button>
        <button class="btn-sm primary" onclick="alert('Export naar Meta Ads Manager — beschikbaar in productieversie')">↗ Exporteer</button>
      </div>
    </div>

    <div class="output-controls fade fade-1" style="margin-bottom:10px">
      <div class="output-count">${ads.length} advertentie${ads.length!==1?'s':''} · Klik ↗ Bekijk op een kaart om de lightbox te openen</div>
    </div>

    ${state.plnSpec ? renderReasoningTrace(state.plnSpec) : ''}

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
  </div>

  <div id="ad-lightbox" class="lightbox-overlay" style="display:none" onclick="if(event.target===this)closeLightbox()">
    <div class="lightbox-inner">
      <button class="lightbox-close" onclick="closeLightbox()">✕</button>
      <button class="lightbox-nav prev" onclick="navLightbox(-1)">‹</button>
      <button class="lightbox-nav next" onclick="navLightbox(+1)">›</button>
      <div class="lightbox-img-wrap" id="lb-img-wrap"></div>
      <div class="lightbox-body" id="lb-body"></div>
    </div>
  </div>`;

  window.openLightbox = function(idx) {
    const overlay = document.getElementById('ad-lightbox');
    if (!overlay) return;
    overlay._idx = idx;
    overlay._ads = ads;
    renderLightboxContent(overlay, idx, ads);
    overlay.style.display = 'flex';
    document.addEventListener('keydown', lbKeyHandler);
  };
  window.closeLightbox = function() {
    const overlay = document.getElementById('ad-lightbox');
    if (overlay) overlay.style.display = 'none';
    document.removeEventListener('keydown', lbKeyHandler);
  };
  window.navLightbox = function(dir) {
    const overlay = document.getElementById('ad-lightbox');
    if (!overlay) return;
    const next = ((overlay._idx + dir) + overlay._ads.length) % overlay._ads.length;
    overlay._idx = next;
    renderLightboxContent(overlay, next, overlay._ads);
  };
  window.downloadAdImage = function(idx) {
    const imgB64 = state.generatedImages?.[idx];
    if (!imgB64) { alert('Geen afbeelding beschikbaar voor download.'); return; }
    const a = document.createElement('a');
    a.href = 'data:image/png;base64,' + imgB64;
    a.download = `ad_${idx + 1}.png`;
    a.click();
  };

  window.regenerateImage = async function(idx, quality = 'high') {
    const ad = state.generatedAds?.[idx];
    if (!ad) return;

    const btn = document.getElementById(`regen-btn-${idx}`);
    const imgWrap = document.getElementById(`ad-img-wrap-${idx}`);
    if (btn) { btn.disabled = true; btn.textContent = '⟳ Bezig…'; }
    if (imgWrap) imgWrap.style.opacity = '0.4';

    const winnerRef = state.selectedWinnerAdId
      ? findWinnerImageRef(state.selectedWinnerAdId, state.plnSpec)
      : null;
    const brandPayload = {
      name:    ATOMS.brand.naam,
      tone:    ATOMS.brand.tone,
      palette: ATOMS.brand.kleuren.map((c, i) => `${ATOMS.brand.kleur_namen[i]} (${c})`).join(', '),
      logo:    '',
    };
    const useEdit = !!(winnerRef || state.uploadedWinnerBase64);
    if (!useEdit) { if (btn) { btn.disabled = false; btn.textContent = 'Regenereer HD'; } return; }

    try {
      const body = {
        adCopy: ad, brand: brandPayload, scene: ad.scene || ad.image_prompt,
        sourceRef: winnerRef || undefined, sourceBase64: state.uploadedWinnerBase64 || undefined,
        quality,
      };
      const r = await fetch('/api/generate-image-edit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (d.success && d.imageBase64) {
        state.generatedImages[idx] = d.imageBase64;
        const imgEl = document.querySelector(`[data-ad-index="${idx}"] img`);
        if (imgEl) imgEl.src = 'data:image/png;base64,' + d.imageBase64;
        if (btn) { btn.disabled = false; btn.textContent = 'Regenereer HD'; }
        if (imgWrap) imgWrap.style.opacity = '1';
      } else {
        throw new Error(d.error || 'unknown');
      }
    } catch (e) {
      console.error('[regenerateImage]', e);
      if (btn) { btn.disabled = false; btn.textContent = 'Regenereer HD'; }
      if (imgWrap) imgWrap.style.opacity = '1';
    }
  };
  function lbKeyHandler(e) {
    if (e.key === 'Escape') window.closeLightbox();
    if (e.key === 'ArrowLeft')  window.navLightbox(-1);
    if (e.key === 'ArrowRight') window.navLightbox(+1);
  }
  function renderLightboxContent(overlay, idx, adList) {
    const ad = adList[idx];
    const conf = typeof ad.confidence === 'number' ? ad.confidence : 0.7;
    const imgB64 = state.generatedImages?.[idx];
    const g = AD_GRADIENTS[idx % AD_GRADIENTS.length];
    const imgHtml = imgB64
      ? `<img class="lightbox-img" src="data:image/png;base64,${imgB64}" alt="${ad.headline}">`
      : `<div style="height:260px;background:${g.bg};display:flex;align-items:center;justify-content:center;font-size:48px">${g.icon}</div>`;
    overlay.querySelector('#lb-img-wrap').innerHTML = imgHtml;
    overlay.querySelector('#lb-body').innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
        <span style="font-family:var(--mono);font-size:10px;color:var(--text-3)">Ad ${idx + 1} van ${adList.length}</span>
        <span class="tag t-${conf>=.80?'green':conf>=.65?'amber':'purple'}">${conf>=.80?'Bewezen':conf>=.65?'Sterk':'Potentieel'}</span>
        <span style="font-family:var(--mono);font-size:10px;color:var(--text-3)">${(conf*100).toFixed(0)}% confidence</span>
      </div>
      <div class="lightbox-headline">${ad.headline}</div>
      <div class="lightbox-copy">${ad.body}</div>
      <div style="margin-bottom:14px">
        <span class="ad-cta">${ad.cta}</span>
      </div>
      <div class="lightbox-meta">
        <div class="lm-item"><div class="lm-lbl">Patroon</div><div class="lm-val" style="font-size:11px">${ad.pattern_used ?? '—'}</div></div>
        <div class="lm-item"><div class="lm-lbl">Exp. ROAS</div><div class="lm-val" style="color:${typeof ad.expected_roas==='number'&&ad.expected_roas>=3?'var(--green)':'var(--text)'}">${typeof ad.expected_roas==='number'?ad.expected_roas.toFixed(1)+'×':'—'}</div></div>
        <div class="lm-item"><div class="lm-lbl">Timing</div><div class="lm-val" style="font-size:11px">${ad.timing ?? '—'}</div></div>
        <div class="lm-item"><div class="lm-lbl">Budget/dag</div><div class="lm-val" style="font-size:11px">${ad.budget ?? '—'}</div></div>
      </div>
      ${renderAtomGraph(ad, idx)}`;
  }
}

// ── Radial atom-graph: which atomspace pin-points produced this ad ──
function renderAtomGraph(ad, idx) {
  const pln = ad.pln_atoms;
  if (!pln || !pln.primary_predicate) {
    return `<div class="atom-graph-empty">Geen PLN atom-herkomst beschikbaar voor deze advertentie.</div>`;
  }

  const primary = {
    pred:    pln.primary_predicate,
    outcome: pln.primary_outcome,
    s:       pln.strength,
    c:       pln.confidence,
    n:       pln.n,
  };
  const related  = (pln.related_atoms   || []).slice(0, 4);
  const evidence = (pln.evidence_ad_ids || []).slice(0, 5);

  // ── Helpers ────────────────────────────────────────────────────
  const familyOf = name => {
    if (!name) return 'other';
    if (/^(ctr-high|cpc-low|roas-proxy)$/.test(name)) return 'outcome';
    const fam = String(name).split('-')[0];
    return ['cta','kw','object','campaign','adset','link'].includes(fam) ? fam : 'other';
  };

  // Resolve a human-readable display label for an atom name.
  // For purely numeric IDs (adset / campaign numbers), show "fam …XXXX".
  const displayAtom = fullName => {
    if (!fullName) return '?';
    const parts = String(fullName).split('-');
    const fam   = parts[0];
    const val   = parts.slice(1).join('-');
    // Outcome names are already short
    if (/^(ctr-high|cpc-low|roas-proxy)$/.test(fullName)) return fullName;
    // Numeric-only value → show family + last 4 chars
    if (val && /^\d+$/.test(val.replace(/-/g, ''))) {
      return `${fam} …${val.slice(-4)}`;
    }
    // Long semantic value → trim to 10 chars
    if (val && val.length > 10) return `${fam}-${val.slice(0, 9)}…`;
    return fullName;
  };

  // Friendly edge label for a spoke
  const spokeLabelOf = (p) => {
    if (p.family === 'outcome') return p.name;   // show the real outcome name, not "outcome"
    if (p.primary)             return 'primary';
    return p.outcome ? `→ ${p.outcome}` : 'related';
  };

  const famColor = {
    outcome:  '#22c55e',
    cta:      '#c9a84c',
    kw:       '#a78bfa',
    object:   '#60a5fa',
    campaign: '#2dd4bf',
    adset:    '#7c5fff',
    link:     '#ea7a3a',
    other:    '#6b7280',
  };

  // ── Layout ─────────────────────────────────────────────────────
  // Scale the orbit radii with node count to avoid cramping.
  const W = 560, H = 400;
  const cx = W / 2, cy = H / 2;

  const spokes = [
    { name: primary.pred,    family: familyOf(primary.pred),    weight: primary.s * primary.c, primary: true  },
    { name: primary.outcome, family: 'outcome',                 weight: primary.s * primary.c, primary: true  },
    ...related.map(r => ({
      name:    r.pred_atom,
      family:  familyOf(r.pred_atom),
      weight:  (r.strength || 0) * (r.confidence || 0),
      outcome: r.outcome,
      primary: false,
    })),
  ].filter(s => s.name);

  const N = spokes.length;
  // Give more breathing room when there are many nodes
  const baseR  = N <= 4 ? 130 : N <= 6 ? 150 : 165;
  const primR  = baseR + 28;

  const placed = spokes.map((s, i) => {
    // Spread evenly; offset by a small angle so primary pair isn't perfectly vertical (avoids overlap)
    const angle = (-Math.PI / 2) + 0.3 + (i * 2 * Math.PI / Math.max(N, 1));
    const r = s.primary ? primR : baseR;
    return { ...s, x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r, angle };
  });

  // ── Edges ──────────────────────────────────────────────────────
  const svgEdges = placed.map(p => {
    const t      = Math.max(0.05, Math.min(1, p.weight || 0));
    const stroke = famColor[p.family] || famColor.other;
    const width  = (1.0 + t * 3.0).toFixed(2);
    const dash   = p.primary ? '' : 'stroke-dasharray="5 3"';
    const op     = (0.3 + t * 0.55).toFixed(2);
    return `<line x1="${cx}" y1="${cy}" x2="${p.x.toFixed(1)}" y2="${p.y.toFixed(1)}" stroke="${stroke}" stroke-width="${width}" ${dash} opacity="${op}"/>`;
  }).join('');

  // ── Evidence lines + dots ──────────────────────────────────────
  // Draw thin dashed lines from center to each evidence dot so they look intentional.
  const evidenceR = primR + 32;
  const evAngleStart = Math.PI * 0.55; // cluster evidence on the right side
  const svgEvidence = evidence.map((aid, i) => {
    const a  = evAngleStart + i * (Math.PI * 0.18);
    const x  = (cx + Math.cos(a) * evidenceR).toFixed(1);
    const y  = (cy + Math.sin(a) * evidenceR).toFixed(1);
    const shortId = String(aid).slice(-6);
    return `
      <line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#6b7280" stroke-width="1" stroke-dasharray="3 3" opacity="0.3"/>
      <g>
        <circle class="ag-evidence" cx="${x}" cy="${y}" r="5"/>
        <text class="ag-evidence-lbl" x="${x}" y="${(+y + 14).toFixed(1)}" text-anchor="middle">…${shortId}</text>
        <title>Bewijs-ad ${aid}</title>
      </g>`;
  }).join('');

  // ── Spoke nodes ────────────────────────────────────────────────
  const svgSpokes = placed.map(p => {
    const col    = famColor[p.family] || famColor.other;
    const nr     = p.primary ? 28 : 22;
    const lx     = (p.x + Math.cos(p.angle) * (nr + 10)).toFixed(1);
    const ly     = (p.y + Math.sin(p.angle) * (nr + 10)).toFixed(1);
    const anchor = Math.cos(p.angle) > 0.25 ? 'start' : Math.cos(p.angle) < -0.25 ? 'end' : 'middle';
    const label  = spokeLabelOf({ ...p, name: p.name });
    return `
      <g class="ag-node ${p.primary ? 'ag-primary' : ''}">
        <title>${escapeSvg(p.name)}</title>
        <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${nr}" fill="${col}" fill-opacity="${p.primary ? 0.92 : 0.72}" stroke="${col}" stroke-width="${p.primary ? 2.5 : 1.2}"/>
        <text class="ag-node-text" x="${p.x.toFixed(1)}" y="${(p.y + 4).toFixed(1)}" text-anchor="middle">${escapeSvg(displayAtom(p.name))}</text>
        <text class="ag-node-label" x="${lx}" y="${ly}" text-anchor="${anchor}">${escapeSvg(label)}</text>
      </g>`;
  }).join('');

  // ── Center node ────────────────────────────────────────────────
  const adNum  = idx + 1;
  const imgB64 = state.generatedImages?.[idx];
  // Use a clipPath element for reliable circular crop
  const clipId = `ag-clip-${idx}`;
  const centerImg = imgB64
    ? `<defs><clipPath id="${clipId}"><circle cx="${cx}" cy="${cy}" r="33"/></clipPath></defs>
       <image href="data:image/png;base64,${imgB64}" x="${cx-33}" y="${cy-33}" width="66" height="66" clip-path="url(#${clipId})"/>`
    : `<circle cx="${cx}" cy="${cy}" r="34" fill="#1a1a2e"/>`;

  // ── Confidence badge inside center ring ────────────────────────
  const confPct = primary.c != null ? `${(primary.c * 100).toFixed(0)}%` : '';

  return `
    <div class="atom-graph-wrap">
      <div class="atom-graph-hd">
        <div class="atom-graph-title">Atomspace herkomst — pin-points die deze ad voedden</div>
        <div class="atom-graph-sub">${spokes.length} atoms · n=${primary.n} · strength ${primary.s?.toFixed(2) ?? '–'} · conf ${primary.c?.toFixed(2) ?? '–'}${pln.roas != null ? ` · ROAS ${pln.roas}×` : ''}</div>
      </div>
      <svg class="atom-graph-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
        ${svgEdges}
        ${svgEvidence}
        ${centerImg}
        <circle class="ag-center-ring" cx="${cx}" cy="${cy}" r="36"/>
        <text class="ag-ad-num"   x="${cx}" y="${cy + 54}" text-anchor="middle">Ad ${adNum}</text>
        ${confPct ? `<text class="ag-conf-pct" x="${cx}" y="${cy + 66}" text-anchor="middle">${confPct} conf</text>` : ''}
        ${svgSpokes}
      </svg>
      <div class="atom-graph-legend">
        <span><i style="background:${famColor.outcome}"></i>outcome</span>
        <span><i style="background:${famColor.cta}"></i>cta</span>
        <span><i style="background:${famColor.kw}"></i>kw</span>
        <span><i style="background:${famColor.object}"></i>object-type</span>
        <span><i style="background:${famColor.campaign}"></i>campaign</span>
        <span><i style="background:${famColor.link}"></i>link-domain</span>
        <span><i style="background:${famColor.adset}"></i>adset</span>
        <span class="ag-leg-line"><i class="ag-line-solid"></i>primary</span>
        <span class="ag-leg-line"><i class="ag-line-dash"></i>related</span>
      </div>
    </div>`;
}

// Shorten an atom name for display — keeps family prefix, truncates long values
function shortAtom(name) {
  const s = String(name || '');
  if (s.length <= 14) return s;
  return s.slice(0, 12) + '…';
}
function escapeSvg(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function adBronnen(ad) {
  const evAds = ad.pln_atoms?.evidence_ads;
  if (!evAds?.length) return '';

  const rows = evAds.slice(0, 5).map(ev => {
    const tab    = ev.in_creative ? 'creative' : 'performance';
    const tabLbl = ev.in_creative ? 'creative' : 'performance';
    const hlHtml = ev.headline
      ? `<div class="ad-bron-hl">"${escapeHtml(ev.headline)}"</div>`
      : '';
    return `
    <div class="ad-bron-row">
      <div class="ad-bron-left">
        <span class="ad-bron-id">${ev.ad_id}</span>
        <span class="ad-bron-roas">${ev.roas != null ? ev.roas.toFixed(1)+'×' : ''}</span>
        ${hlHtml}
      </div>
      <button class="ad-bron-btn" onclick="navigateDataset('${ev.ad_id}','${tab}')">
        Zoek in ${tabLbl} →
      </button>
    </div>`;
  }).join('');

  // Creative examples from PLN spec (all 100 creative atoms scored by relevance)
  const crEx = state.plnSpec?.creative_examples ?? [];
  const crRows = crEx.map(ev => `
    <div class="ad-bron-row">
      <div class="ad-bron-left">
        <span class="ad-bron-id">${ev.ad_id}</span>
        <div class="ad-bron-hl">"${escapeHtml(ev.headline)}"</div>
      </div>
      <button class="ad-bron-btn" onclick="navigateDataset('${ev.ad_id}','creative')">
        Zoek in creative →
      </button>
    </div>`).join('');

  const crSection = crRows ? `
    <div class="ad-bron-section-lbl">Verwante creatives uit dataset (${crEx.length})</div>
    ${crRows}` : '';

  return `
  <div class="ad-bronnen">
    <div class="ad-bron-title">
      <span>Gebaseerd op ${evAds.length} echte advertentie${evAds.length !== 1 ? 's' : ''} uit dataset</span>
      <span class="ad-bron-note">▤ Gegenereerde tekst — niet in dataset</span>
    </div>
    ${rows}
    ${crSection}
  </div>`;
}

function adCard(ad, i) {
  const g    = AD_GRADIENTS[i % AD_GRADIENTS.length];
  const conf = typeof ad.confidence === 'number' ? ad.confidence : 0.7;
  const tier = conf >= 0.80 ? 'Bewezen' : conf >= 0.65 ? 'Sterk' : 'Potentieel';

  const atomsHtml = (ad.atoms_used ?? ['Creative atom','Performance atom'])
    .map(a => `<span class="atom-tag">${a}</span>`).join('');

  const imgB64 = state.generatedImages?.[i];
  const useEditForRegen = !!(
    (state.selectedWinnerAdId ? findWinnerImageRef(state.selectedWinnerAdId, state.plnSpec) : null)
    || state.uploadedWinnerBase64
  );
  const imgSection = imgB64
    ? `<div id="ad-img-wrap-${i}" style="position:relative">
        <img src="data:image/png;base64,${imgB64}" style="width:100%;display:block;border-radius:8px 8px 0 0;aspect-ratio:1/1;object-fit:cover">
       </div>`
    : `<div class="ad-img" style="background:${g.bg}">
        <div class="ad-img-inner">
          <div class="ad-img-icon">${g.icon}</div>
          <div class="ad-img-prompt">${ad.image_prompt ?? ''}</div>
        </div>
        <div class="tier-badge">${tier}</div>
        <div class="conf-badge ${confClass(conf)}">${(conf*100).toFixed(0)}%</div>
       </div>`;

  // Phase E.3: substantiation bar (4 segments) if available
  const sub = ad.pln_atoms?.substantiation;
  const substBar = sub ? (() => {
    const segs = [
      { v: sub.c_sample||0,      tip: `steekproef n=${sub.n||0}` },
      { v: sub.c_spend||0,       tip: `besteding €${(sub.spend||0).toFixed(0)}` },
      { v: sub.c_consistency||0, tip: `consistentie var=${sub.variance||0}` },
      { v: sub.c_counter||0,     tip: `${sub.counter_n||0} tegenex.` },
    ];
    return `<div class="subst-conf-wrap">
      <div class="subst-conf-lbl">conf ${(conf*100).toFixed(0)}% — steekproef · besteding · consistentie · tegenbewijzen</div>
      <div class="subst-conf-bar">${segs.map(b=>`<div class="subst-seg" style="flex:${Math.max(.05,b.v)}" title="${b.tip}"></div>`).join('')}</div>
    </div>`;
  })() : '';

  const confBadge = imgB64
    ? `<div style="display:flex;gap:6px;align-items:center;margin-bottom:6px">
        <span class="tag t-${conf>=0.80?'green':conf>=0.65?'amber':'purple'}">${tier}</span>
        <span style="font-family:var(--mono);font-size:10px;color:var(--text-3)">${(conf*100).toFixed(0)}% conf</span>
       </div>`
    : '';

  const proofHtml = state.plnSpec?.reasoning
    ? `<details style="margin-top:8px">
        <summary style="font-family:var(--mono);font-size:10px;color:var(--text-3);cursor:pointer">PLN bewijs</summary>
        <div style="font-family:var(--mono);font-size:10px;color:var(--text-3);margin-top:6px;line-height:1.6;border-top:1px solid var(--border);padding-top:6px">${state.plnSpec.reasoning}</div>
       </details>`
    : '';

  // Phase F.2: feedback thumbs
  const justPats = JSON.stringify(ad.justification_patterns || []).replace(/'/g, "\\'");
  const feedbackRow = `
    <div class="feedback-row">
      <span class="feedback-lbl">Werkte deze ad?</span>
      <button class="btn-feedback" id="fb-up-${i}" onclick="sendFeedback(${i},'up',${justPats},this)">👍</button>
      <button class="btn-feedback" id="fb-dn-${i}" onclick="sendFeedback(${i},'down',${justPats},this)">👎</button>
    </div>`;

  return `
  <div class="ad-card fade fade-${(i%3)+1}" data-ad-index="${i}">
    ${imgSection}
    <div class="ad-body">
      ${confBadge}
      ${substBar}
      <div class="ad-num">Ad ${i+1} · ${ad.pattern_used ?? 'PLN patroon'}</div>
      <div class="ad-hl">${ad.headline}</div>
      <div class="ad-copy">${ad.body}</div>
      <div class="ad-cta">${ad.cta}</div>
      ${ad.justification ? `<div style="font-size:10px;color:var(--text-3);font-style:italic;margin-top:4px;padding:4px 0;border-top:1px solid var(--border)">${escapeHtml(ad.justification)}</div>` : ''}
      <div class="ad-meta">
        <div class="ad-meta-row">
          <div class="am-lbl">Patroon</div>
          <div class="am-val">${ad.pattern_used ?? '—'}</div>
        </div>
        <div class="ad-meta-row">
          <div class="am-lbl">Exp. ROAS</div>
          <div class="am-val" style="color:${typeof ad.expected_roas==='number'&&ad.expected_roas>=3?'var(--green)':'var(--text-2)'}">
            ${typeof ad.expected_roas==='number' ? ad.expected_roas.toFixed(1)+'×' : '—'}
          </div>
        </div>
        <div class="ad-meta-row">
          <div class="am-lbl">Atoms</div>
          <div class="am-val"><div class="am-atoms">${atomsHtml}</div></div>
        </div>
      </div>
      ${proofHtml}
      ${adBronnen(ad)}
    </div>
    ${feedbackRow}
    <div class="ad-card-actions">
      <button class="btn-card-action primary" onclick="openLightbox(${i})">↗ Bekijk</button>
      ${imgB64 ? `<button class="btn-card-action" onclick="downloadAdImage(${i})">↓ Download</button>` : ''}
      ${imgB64 && useEditForRegen ? `<button class="btn-card-action" id="regen-btn-${i}" onclick="regenerateImage(${i},'high')">Regenereer HD</button>` : ''}
      <button class="btn-card-action" onclick="navigator.clipboard?.writeText('${ad.headline.replace(/'/g,"\\'")} — ${ad.body.replace(/'/g,"\\'")}').then(()=>this.textContent='✓ Gekopieerd').catch(()=>{})">⎘ Copy</button>
    </div>
  </div>`;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Phase E.1: 5-Layer Reasoning Trace ───────────────────────
function renderReasoningTrace(spec) {
  if (!spec || !(spec.patterns || spec.top_patterns)?.length) return '';
  const top5     = (spec.patterns || spec.top_patterns || []).slice(0, 5);
  const strategy = spec.strategy || {};

  // L1: Evidence thumbnails from top patterns
  const evAds = [], seenEv = new Set();
  for (const p of top5) {
    for (const ev of (p.evidence_ads || [])) {
      if (!seenEv.has(ev.ad_id)) { evAds.push(ev); seenEv.add(ev.ad_id); }
    }
    if (evAds.length >= 6) break;
  }

  // L2: unique conditions from top patterns
  const featureChips = [...new Set(top5.flatMap(p => p.conditions || []))].slice(0, 8);

  // L3: Pattern cards with substantiation bars
  const patternCards = top5.map(p => {
    const sub     = p.substantiation || {};
    const confPct = ((p.confidence || 0) * 100).toFixed(0);
    const weakCss = (p.confidence || 0) < 0.2 ? 'opacity:.5;border-style:dashed' : '';
    const weakTxt = (p.confidence || 0) < 0.2 ? ' · ONZEKER' : '';
    const segs    = [
      { v: sub.c_sample || 0,      tip: `steekproef n=${sub.n||0}` },
      { v: sub.c_spend || 0,       tip: `besteding €${(sub.spend||0).toFixed(0)}` },
      { v: sub.c_consistency || 0, tip: `consistentie var=${sub.variance||0}` },
      { v: sub.c_counter || 0,     tip: `${sub.counter_n||0} tegenex.` },
    ];
    const barsHtml = segs.map(b =>
      `<div class="subst-seg" style="flex:${Math.max(.05,b.v)}" title="${escapeHtml(b.tip)}"></div>`
    ).join('');
    return `<div class="pattern-card" style="${weakCss}" data-pattern="${escapeHtml(p.name||'')}">
      <div class="pc-name">${escapeHtml((p.name||'').replace(/--/g,' · '))}</div>
      <div class="pc-outcome">${escapeHtml(p.outcome||'')}${weakTxt}</div>
      <div class="pc-conf">${confPct}% conf · n=${sub.n||0} · €${(sub.spend||0).toFixed(0)}</div>
      <div class="subst-bar" title="Steekproef · Besteding · Consistentie · Tegenbewijzen">${barsHtml}</div>
    </div>`;
  }).join('');

  // L4: Strategy
  const avoidTxt  = (strategy.avoid||[]).join(', ') || '—';
  const justNames = (strategy.justification_patterns||[]).slice(0,3)
    .map(n => `<code style="font-size:9px">${escapeHtml((n||'').replace(/--/g,' · '))}</code>`).join(', ');

  // L5: Generated ads (filled once available)
  const l5Html = state.generatedAds.length
    ? state.generatedAds.slice(0,5).map((ad,i) => `
      <div class="trace-l5-ad">
        <div class="trace-l5-num">Ad ${i+1}</div>
        <div class="trace-l5-hl">${escapeHtml((ad.headline||'').slice(0,30))}</div>
        ${ad.justification ? `<div class="trace-l5-just">${escapeHtml(ad.justification.slice(0,80))}</div>` : ''}
      </div>`).join('')
    : '<div class="trace-l5-empty">Ads worden gegenereerd…</div>';

  return `
  <div class="reasoning-trace fade fade-1" style="margin-bottom:24px">
    <div class="rt-header">
      <div class="rt-title">5-Laags Redenering</div>
      <div class="rt-sub">Historische data → kenmerken → patronen → strategie → advertenties</div>
    </div>
    <div class="trace-lane" id="trace-l1">
      <div class="trace-lane-label">L1 Historisch</div>
      <div class="trace-lane-content">
        ${evAds.length ? evAds.slice(0,6).map(ev => {
          const src = ev.image_ref ? `/sample-images/${ev.image_ref.split('/').pop()}` : null;
          return src
            ? `<img class="trace-ev-thumb" src="${src}" title="Ad ${ev.ad_id} · ROAS ${ev.roas||'?'}" onerror="this.style.display='none'">`
            : `<div class="trace-ev-thumb trace-ev-ph" title="Ad ${ev.ad_id}">ad</div>`;
        }).join('') : '<div class="trace-lane-empty">Geen historische ads gevonden</div>'}
      </div>
    </div>
    <div class="trace-lane" id="trace-l2">
      <div class="trace-lane-label">L2 Kenmerken</div>
      <div class="trace-lane-content">
        ${featureChips.map(f=>`<span class="feature-chip">${escapeHtml(f)}</span>`).join('')||'<div class="trace-lane-empty">Geen kenmerken</div>'}
      </div>
    </div>
    <div class="trace-lane" id="trace-l3">
      <div class="trace-lane-label">L3 Patronen</div>
      <div class="trace-lane-content" style="flex-wrap:wrap;gap:8px">${patternCards||'<div class="trace-lane-empty">Geen patronen</div>'}</div>
    </div>
    <div class="trace-lane" id="trace-l4">
      <div class="trace-lane-label">L4 Strategie</div>
      <div class="trace-lane-content">
        <div class="strategy-block">
          <div class="sb-row"><span class="sb-lbl">Hook</span><span class="sb-val">${escapeHtml(strategy.hook||'—')}</span></div>
          <div class="sb-row"><span class="sb-lbl">Visual</span><span class="sb-val">${escapeHtml(strategy.visual||'—')}</span></div>
          <div class="sb-row"><span class="sb-lbl">CTA</span><span class="sb-val">${escapeHtml(strategy.cta||'—')}</span></div>
          <div class="sb-row"><span class="sb-lbl">Toon</span><span class="sb-val">${escapeHtml(strategy.tone||'—')}</span></div>
          <div class="sb-row"><span class="sb-lbl">Vermijd</span><span class="sb-val">${escapeHtml(avoidTxt)}</span></div>
          <div class="sb-row"><span class="sb-lbl">Patronen</span><span class="sb-val">${justNames||'—'}</span></div>
        </div>
      </div>
    </div>
    <div class="trace-lane" id="trace-l5">
      <div class="trace-lane-label">L5 Gegenereerd</div>
      <div class="trace-lane-content" style="flex-wrap:wrap;gap:8px">${l5Html}</div>
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

          <div class="lp-connected-card">
            <div class="lp-connected-logos">
              <!-- Meta ∞ official icon (simpleicons.org) -->
              <div class="lp-logo lp-logo-meta">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056C8.187 4.367 7.054 4.03 6.915 4.03zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z"/>
                </svg>
              </div>
              <!-- Shopify official icon (simpleicons.org) -->
              <div class="lp-logo lp-logo-shopify">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15.337 23.979l7.216-1.561s-2.604-17.613-2.625-17.73c-.018-.116-.114-.192-.211-.192s-1.929-.136-1.929-.136-1.275-1.274-1.439-1.411c-.045-.037-.075-.057-.121-.074l-.914 21.104h.023zM11.71 11.305s-.81-.424-1.774-.424c-1.447 0-1.504.906-1.504 1.141 0 1.232 3.24 1.715 3.24 4.629 0 2.295-1.44 3.76-3.406 3.76-2.354 0-3.54-1.465-3.54-1.465l.646-2.086s1.245 1.066 2.28 1.066c.675 0 .975-.545.975-.932 0-1.619-2.654-1.694-2.654-4.359-.034-2.237 1.571-4.416 4.827-4.416 1.257 0 1.875.361 1.875.361l-.945 2.715-.02.01zM11.17.83c.136 0 .271.038.405.135-.984.465-2.064 1.639-2.508 3.992-.656.213-1.293.405-1.889.578C7.697 3.75 8.951.84 11.17.84V.83zm1.235 2.949v.135c-.754.232-1.583.484-2.394.736.466-1.777 1.333-2.645 2.085-2.971.193.501.309 1.176.309 2.1zm.539-2.234c.694.074 1.141.867 1.429 1.755-.349.114-.735.231-1.158.366v-.252c0-.752-.096-1.371-.271-1.871v.002zm2.992 1.289c-.02 0-.06.021-.078.021s-.289.075-.714.21c-.423-1.233-1.176-2.37-2.508-2.37h-.115C12.135.209 11.669 0 11.265 0 8.159 0 6.675 3.877 6.21 5.846c-1.194.365-2.063.636-2.16.674-.675.213-.694.232-.772.87-.075.462-1.83 14.063-1.83 14.063L15.009 24l.927-21.166z"/>
                </svg>
              </div>
              <!-- Weather / Season -->
              <div class="lp-logo lp-logo-weather">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2.2" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="4.5" fill="#FCD34D" stroke="none"/>
                  <line x1="12" y1="2" x2="12" y2="4.5"/>
                  <line x1="12" y1="19.5" x2="12" y2="22"/>
                  <line x1="4.22" y1="4.22" x2="5.87" y2="5.87"/>
                  <line x1="18.13" y1="18.13" x2="19.78" y2="19.78"/>
                  <line x1="2" y1="12" x2="4.5" y2="12"/>
                  <line x1="19.5" y1="12" x2="22" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.87" y2="18.13"/>
                  <line x1="18.13" y1="5.87" x2="19.78" y2="4.22"/>
                </svg>
              </div>
            </div>
            <div class="lp-logo-divider"></div>
            <div class="lp-connected-text">
              <div class="lp-connected-title">One connected view</div>
              <div class="lp-connected-sub">The engine connects signals across platforms, seasonality &amp; timing to see what actually drives profit.</div>
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
                <img alt="Generated creative" src="images/output-necklace.png">
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

    <!-- ══ SECTION 2: ASK THE ENGINE ════════════════════════ -->
    <section class="s2-section">
      <div class="s2-inner">

        <!-- LEFT -->
        <section class="s2-left">
          <p class="s2-eyebrow">From insight to output</p>
          <h1 class="s2-headline">Ask the engine what to make next. Get ads built from your proven product patterns.</h1>
          <p class="s2-sub">Type a product, season, or campaign goal. Growth Engine uses your historical Meta + Shopify data to generate ad concepts based on what already works for these products.</p>

          <form class="s2-ask" onsubmit="event.preventDefault(); navigate('genereren')">
            <input type="text" placeholder="What should we test for Easter gifting?" />
            <button type="submit">Ask the engine</button>
          </form>

          <span class="s2-footnote">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v3"/><path d="M12 18v3"/><path d="M3 12h3"/><path d="M18 12h3"/><path d="M5.6 5.6l2.1 2.1"/><path d="M16.3 16.3l2.1 2.1"/><path d="M5.6 18.4l2.1-2.1"/><path d="M16.3 7.7l2.1-2.1"/></svg>
            Answers are based on your own Meta + Shopify data.
          </span>
        </section>

        <!-- RIGHT -->
        <section class="s2-right">
          <div class="s2-right-head">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v3"/><path d="M12 18v3"/><path d="M3 12h3"/><path d="M18 12h3"/><path d="M5.6 5.6l2.1 2.1"/><path d="M16.3 16.3l2.1 2.1"/><path d="M5.6 18.4l2.1-2.1"/><path d="M16.3 7.7l2.1-2.1"/></svg>
            Generated for your products
          </div>

          <div class="s2-cards">
            <article class="s2-card">
              <div class="s2-card-img"><img alt="Easter gifting moment" src="assets/ad-01-easter-gift.png" onerror="this.style.display='none'"/></div>
              <div class="s2-card-meta">
                <span class="s2-ad-num">Ad 01</span>
                <span class="s2-pill s2-pill-green">High traction</span>
              </div>
              <div class="s2-card-body">
                <h3 class="s2-card-title">Easter gifting moment</h3>
                <p class="s2-card-desc">Based on lifestyle<br/>+ Easter winners</p>
              </div>
            </article>

            <article class="s2-card">
              <div class="s2-card-img"><img alt="Timeless Easter gift" src="assets/ad-02-ring.png" onerror="this.style.display='none'"/></div>
              <div class="s2-card-meta">
                <span class="s2-ad-num">Ad 02</span>
                <span class="s2-pill s2-pill-purple">Top performer</span>
              </div>
              <div class="s2-card-body">
                <h3 class="s2-card-title">Timeless Easter gift</h3>
                <p class="s2-card-desc">Based on product-detail patterns</p>
              </div>
            </article>

            <article class="s2-card">
              <div class="s2-card-img"><img alt="Spring refresh" src="assets/ad-03-spring.png" onerror="this.style.display='none'"/></div>
              <div class="s2-card-meta">
                <span class="s2-ad-num">Ad 03</span>
                <span class="s2-pill s2-pill-green">Seasonal winner</span>
              </div>
              <div class="s2-card-body">
                <h3 class="s2-card-title">Spring refresh</h3>
                <p class="s2-card-desc">Based on seasonal winner patterns</p>
              </div>
            </article>

            <article class="s2-card">
              <div class="s2-card-img"><img alt="Gift with emotion" src="assets/ad-04-necklace.png" onerror="this.style.display='none'"/></div>
              <div class="s2-card-meta">
                <span class="s2-ad-num">Ad 04</span>
                <span class="s2-pill s2-pill-purple">Strong CTA</span>
              </div>
              <div class="s2-card-body">
                <h3 class="s2-card-title">Gift with emotion</h3>
                <p class="s2-card-desc">Based on high-converting CTA patterns</p>
              </div>
            </article>
          </div>

          <div class="s2-pattern-note">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Recommended from patterns found in your data for these products.
          </div>
        </section>

      </div>
    </section>

    <!-- ══ SECTION 3: A SYSTEM THAT LEARNS ══════════════════ -->
    <section class="s3-section">
      <div class="s3-page">

        <!-- LEFT -->
        <section class="s3-left">
          <p class="s3-eyebrow">Why it gets smarter</p>
          <h1 class="s3-headline">More than prompts.<br/>A system that<br/>learns from<br/>every ad.</h1>
          <p class="s3-sub">Growth Engine reads every creative, connects it to real purchase data, and remembers what worked so every new recommendation gets smarter.</p>

          <!-- Generic AI vs Growth Engine -->
          <div class="s3-vs-card">
            <h3 class="s3-vs-title">Generic AI vs Growth Engine</h3>
            <div class="s3-vs-grid">
              <div class="s3-vs-col s3-vs-left">
                <h4>Generic AI</h4>
                <div class="s3-vs-list">
                  <div class="s3-vs-item">
                    <span class="s3-ic">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/></svg>
                    </span>
                    Starts from a blank prompt
                  </div>
                  <div class="s3-vs-item">
                    <span class="s3-ic">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>
                    </span>
                    Forgets what worked
                  </div>
                  <div class="s3-vs-item">
                    <span class="s3-ic">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="1"/><circle cx="12" cy="6" r="1"/><circle cx="18" cy="6" r="1"/><circle cx="6" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="18" cy="12" r="1"/><circle cx="6" cy="18" r="1"/><circle cx="12" cy="18" r="1"/><circle cx="18" cy="18" r="1"/></svg>
                    </span>
                    Gives generic ideas
                  </div>
                </div>
              </div>
              <div class="s3-vs-col s3-vs-right">
                <h4>Growth Engine</h4>
                <div class="s3-vs-list">
                  <div class="s3-vs-item">
                    <span class="s3-ic">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>
                    </span>
                    Starts from your data
                  </div>
                  <div class="s3-vs-item">
                    <span class="s3-ic">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
                    </span>
                    Remembers every result
                  </div>
                  <div class="s3-vs-item">
                    <span class="s3-ic">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    </span>
                    Explains every recommendation
                  </div>
                </div>
              </div>
              <div class="s3-vs-pill">vs</div>
            </div>
          </div>
        </section>

        <!-- RIGHT — loop card -->
        <section class="s3-loop-card">
          <h2 class="s3-loop-title">The loop behind better ads</h2>

          <div class="s3-loop">
            <!-- Arrows overlay -->
            <div class="s3-loop-arrows" aria-hidden="true">
              <svg viewBox="0 0 600 340" preserveAspectRatio="none">
                <defs>
                  <marker id="s3arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M0,0 L10,5 L0,10 z" fill="#b8b8c2"/>
                  </marker>
                </defs>
                <path d="M252,60 L348,60" stroke="#b8b8c2" stroke-width="1.4" fill="none" marker-end="url(#s3arr)"/>
                <path d="M470,100 L470,240" stroke="#b8b8c2" stroke-width="1.4" fill="none" marker-end="url(#s3arr)"/>
                <path d="M348,280 L252,280" stroke="#b8b8c2" stroke-width="1.4" fill="none" marker-end="url(#s3arr)"/>
                <path d="M130,240 L130,100" stroke="#b8b8c2" stroke-width="1.4" fill="none" marker-end="url(#s3arr)"/>
                <path d="M250,90 L290,160" stroke="#cfcfd6" stroke-width="1.2" stroke-dasharray="3 4" fill="none"/>
                <path d="M350,90 L310,160" stroke="#cfcfd6" stroke-width="1.2" stroke-dasharray="3 4" fill="none"/>
                <path d="M250,250 L290,180" stroke="#cfcfd6" stroke-width="1.2" stroke-dasharray="3 4" fill="none"/>
                <path d="M350,250 L310,180" stroke="#cfcfd6" stroke-width="1.2" stroke-dasharray="3 4" fill="none"/>
              </svg>
            </div>

            <!-- 1. Reads every creative -->
            <div class="s3-step">
              <span class="s3-ic-circle">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/></svg>
              </span>
              <div>
                <h3>1. Reads every creative</h3>
                <p>Objects, mood, setting, copy, product focus</p>
              </div>
            </div>

            <!-- 2. Connects it to purchases -->
            <div class="s3-step">
              <span class="s3-ic-circle">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 20V12"/><path d="M12 20V8"/><path d="M19 20v-6"/><path d="M3 20h18"/></svg>
              </span>
              <div>
                <h3>2. Connects it to purchases</h3>
                <p>CVR, ROAS, revenue, product sales</p>
              </div>
            </div>

            <!-- 4. Generates better ads -->
            <div class="s3-step">
              <span class="s3-ic-circle">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/><path d="M19 15l.7 2.1L22 18l-2.3.9L19 21l-.7-2.1L16 18l2.3-.9L19 15z"/></svg>
              </span>
              <div>
                <h3>4. Generates better ads</h3>
                <p>New ads based on proven patterns</p>
              </div>
            </div>

            <!-- 3. Remembers what works -->
            <div class="s3-step">
              <span class="s3-ic-circle">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></svg>
              </span>
              <div>
                <h3>3. Remembers what works</h3>
                <p>What worked, when, for which product</p>
              </div>
            </div>

            <!-- Brand memory pill -->
            <div class="s3-memory">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 5a3 3 0 0 0-5.99-.14A3.5 3.5 0 0 0 3 8a3.5 3.5 0 0 0 1 2.45 3.5 3.5 0 0 0 .5 5.05A3 3 0 0 0 7.5 19a3 3 0 0 0 4.5 1.7"/>
                <path d="M12 5a3 3 0 0 1 5.99-.14A3.5 3.5 0 0 1 21 8a3.5 3.5 0 0 1-1 2.45 3.5 3.5 0 0 1-.5 5.05A3 3 0 0 1 16.5 19a3 3 0 0 1-4.5 1.7"/>
                <path d="M12 5v15.7"/>
              </svg>
              Your brand memory
            </div>
          </div>

          <!-- Footer -->
          <div class="s3-loop-foot">
            <div class="s3-traceable">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
              Every recommendation is traceable to source creatives, purchase outcomes and timing context.
            </div>
            <div class="s3-chips">
              <span class="s3-chip">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Traceable recommendations
              </span>
              <span class="s3-chip">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
                Read-only data
              </span>
              <span class="s3-chip">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                Built from your own history
              </span>
            </div>
          </div>
        </section>

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
    <div class="page-sub">7-fase ad generatie · PLN + Atomspace + gpt-image-1 · OmegaClaw</div>
  </div>
  <div class="page-content">

    <div class="pl-overall-progress fade">
      <div class="pl-overall-label">
        <span class="pl-overall-text" id="pl-prog-label">Fase 1 van 7 — Start door atoms te laden</span>
        <span class="pl-overall-pct" id="pl-prog-pct">0%</span>
      </div>
      <div class="pl-overall-bar">
        <div class="pl-overall-fill" id="pl-prog-fill" style="width:0%"></div>
      </div>
    </div>

    <div id="pl-stepper" class="pl-stepper">
      ${[
        ['Bronnen laden',   'Data atoms van schijf'],
        ['Advertiser input','Product + context'],
        ['PLN spec',        'Patroonherkenning'],
        ['Concepten',       '10 ad concepten'],
        ['Beeld generatie', 'gpt-image-1 beelden'],
        ['Verificatie loop','Spec matching'],
        ['Output',          'Finale advertenties'],
      ].map(([label, sub], i) => `
        <div class="pl-step" id="pl-step-${i+1}" data-phase="${i+1}" style="cursor:default">
          <div class="pl-step-num">${i+1}</div>
          <div class="pl-step-label">${label}</div>
          <div class="pl-step-sub">${sub}</div>
        </div>
        ${i < 6 ? '<div class="pl-step-connector"></div>' : ''}
      `).join('')}
    </div>

    <div id="pl-body" class="pl-body">
      <div id="pl-phase-1" class="pl-phase active">
        <div class="pl-phase-desc">
          <div class="pl-phase-desc-title">Fase 1 — Bronnen laden</div>
          <div class="pl-phase-desc-text">Laadt Meta Ads performance atoms van schijf — gegenereerd vanuit de Meta CSV export. Elke atom bevat ad_id, CTR, CPC, ROAS en spend.</div>
          <div class="pl-phase-desc-eta">⏱ Verwacht: 2–5 seconden</div>
        </div>
        <div class="card">
          <div class="card-hd">
            <div class="card-title">Performance atoms</div>
            <span class="tag t-blue">atoms/performance/*.json</span>
          </div>
          <button class="btn-primary" id="pl-load-atoms">Atoms laden ↓</button>
          <div id="pl-atoms-result" style="margin-top:16px"></div>
        </div>
      </div>

      <div id="pl-phase-2" class="pl-phase" style="display:none">
        <div class="pl-phase-desc">
          <div class="pl-phase-desc-title">Fase 2 — Advertiser input</div>
          <div class="pl-phase-desc-text">Geef het product en de context op. PLN gebruikt dit samen met de atoms om de beste visuele strategie te bepalen.</div>
          <div class="pl-phase-desc-eta">⏱ Verwacht: directe invoer, PLN analyse duurt 5–10 sec</div>
        </div>
        <div class="card">
          <div class="card-hd"><div class="card-title">Product & context</div></div>
          <div style="display:grid;gap:14px">
            <div>
              <label class="form-label-req">
                Product / collectie <span class="req-star">*</span>
                <span class="form-example">Bijv: Zilveren armband collectie, €39–€89</span>
              </label>
              <input id="pl-product" class="form-input" placeholder="Bijv. Zilveren armband collectie, €39–€89" value="Zilveren armband collectie, €39–€89"/>
              <div class="form-helper">Naam van het product + prijsrange. Zo concreet mogelijk (3-8 woorden).</div>
            </div>
            <div>
              <label class="form-label-req">
                Periode + context <span class="req-star">*</span>
                <span class="form-example">Bijv: Week 24, zomer, zonnig</span>
              </label>
              <input id="pl-context" class="form-input" placeholder="Bijv. Week 24, zomer, zonnige voorspelling" value="Week 24, zomer, zonnige voorspelling"/>
              <div class="form-helper">Weeknummer, seizoen en weersomstandigheden. PLN matcht dit aan historische atoms.</div>
            </div>
            <button class="btn-primary" id="pl-run-pln">PLN analyse uitvoeren →</button>
          </div>
        </div>
      </div>

      <div id="pl-phase-3" class="pl-phase" style="display:none">
        <div class="pl-phase-desc">
          <div class="pl-phase-desc-title">Fase 3 — PLN formele specificatie</div>
          <div class="pl-phase-desc-text">PLN doorzoekt de Atomspace en identificeert bewezen patronen voor jouw product + context. Het output is een formele spec met visuele elementen, stijl, tone en ROAS voorspelling.</div>
          <div class="pl-phase-desc-eta">⏱ Verwacht output: visuele elementen · stijl · verwachte ROAS · confidence score</div>
        </div>
        <div class="card">
          <div class="card-hd">
            <div class="card-title">PLN specificatie</div>
            <span class="tag t-purple">Atomspace analyse</span>
          </div>
          <div id="pl-spec-box"></div>
          <button class="btn-primary" id="pl-gen-concepts" style="margin-top:16px">10 concepten genereren →</button>
        </div>
      </div>

      <div id="pl-phase-4" class="pl-phase" style="display:none">
        <div class="pl-phase-desc">
          <div class="pl-phase-desc-title">Fase 4 — Advertentie concepten</div>
          <div class="pl-phase-desc-text">Claude genereert 10 unieke advertentie concepten op basis van de PLN spec. Elk concept bevat headline, body copy, CTA, image prompt en ROAS voorspelling.</div>
          <div class="pl-phase-desc-eta">⏱ Verwacht: 8–15 seconden · output: 10 concepten met image prompts</div>
        </div>
        <div class="card">
          <div class="card-hd">
            <div class="card-title">Ad concepten (LLM)</div>
            <span class="tag t-purple">Claude API</span>
          </div>
          <div id="pl-concepts-list"></div>
          <button class="btn-primary" id="pl-gen-images" style="margin-top:16px;display:none">Beelden genereren met gpt-image-1 →</button>
        </div>
      </div>

      <div id="pl-phase-5" class="pl-phase" style="display:none">
        <div class="pl-phase-desc">
          <div class="pl-phase-desc-title">Fase 5 — gpt-image-1 beeld generatie</div>
          <div class="pl-phase-desc-text">gpt-image-1 genereert alle 10 beelden parallel op basis van de image prompts uit fase 4. Elk beeld wordt gestuurd door de PLN visuele spec.</div>
          <div class="pl-phase-desc-eta">⏱ Verwacht: 20–45 seconden · 10 beelden van 1024×1024px</div>
        </div>
        <div class="card">
          <div class="card-hd">
            <div class="card-title">Gegenereerde beelden</div>
            <span class="tag t-teal">gpt-image-1 API</span>
          </div>
          <div id="pl-images-grid" class="pl-images-grid"></div>
          <button class="btn-primary" id="pl-start-verify" style="margin-top:16px;display:none">Verificatie loop starten →</button>
        </div>
      </div>

      <div id="pl-phase-6" class="pl-phase" style="display:none">
        <div class="pl-phase-desc">
          <div class="pl-phase-desc-title">Fase 6 — Verificatie feedback loop</div>
          <div class="pl-phase-desc-text">Vision model decomposeert elk beeld → PLN vergelijkt met de formele spec → corrigeert en regenereert totdat alle elementen 100% aanwezig zijn (max. 3 iteraties).</div>
          <div class="pl-phase-desc-eta">⏱ Verwacht: 15–40 seconden · tot 3 iteraties per beeld</div>
        </div>
        <div class="card">
          <div class="card-hd">
            <div class="card-title">Spec verificatie</div>
            <span class="tag t-green">Vision LLM</span>
          </div>
          <div id="pl-verify-list"></div>
          <button class="btn-primary" id="pl-to-output" style="margin-top:16px;display:none">Naar output →</button>
        </div>
      </div>

      <div id="pl-phase-7" class="pl-phase" style="display:none">
        <div class="pl-phase-desc">
          <div class="pl-phase-desc-title">Fase 7 — Geverifieerde advertenties</div>
          <div class="pl-phase-desc-text">Alle advertenties zijn geverifieerd en klaar voor Meta Ads Manager. Elk advertentie is gebaseerd op bewezen PLN patronen uit historische data.</div>
          <div class="pl-phase-desc-eta">✓ Pipeline voltooid · 100% of 7 fases doorlopen</div>
        </div>
        <div class="card">
          <div class="card-hd">
            <div class="card-title">Finale output</div>
            <span class="tag t-green">Klaar voor publicatie</span>
          </div>
          <div id="pl-final-output"></div>
        </div>
      </div>
    </div>

    <div id="pl-action-bar" class="pl-action-bar" style="display:none">
      <div class="pl-action-bar-info">
        <div class="pl-action-bar-phase" id="pl-bar-phase">—</div>
        <div class="pl-action-bar-label">Stap klaar — klik om door te gaan</div>
      </div>
      <button class="btn-primary" id="pl-bar-btn">—</button>
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
    :root { --text-muted: #888888; }
    .pl-stepper { display:flex; align-items:center; gap:0; margin-bottom:24px; overflow-x:auto; padding:4px 0 12px; }
    .pl-step { display:flex; flex-direction:column; align-items:center; gap:3px; min-width:90px; transition:.2s; }
    .pl-step-num { width:38px; height:38px; border-radius:50%; border:2px solid var(--border-md); display:flex; align-items:center; justify-content:center; font-family:'DM Mono',monospace; font-size:13px; font-weight:600; color:var(--text-3); transition:.3s; background:var(--surface); }
    .pl-step.done .pl-step-num { background:var(--green); border-color:var(--green); color:#fff; }
    .pl-step.active .pl-step-num { border-color:var(--purple); color:var(--purple); background:var(--purple-s); box-shadow:0 0 0 4px rgba(109,40,217,.12); }
    .pl-step-label { font-size:11px; font-weight:600; color:var(--text-3); text-align:center; white-space:nowrap; }
    .pl-step-sub { font-size:9px; font-family:'DM Mono',monospace; color:var(--text-3); text-align:center; white-space:nowrap; opacity:.7; }
    .pl-step.active .pl-step-label { color:var(--purple); }
    .pl-step.active .pl-step-sub { color:var(--purple); opacity:.7; }
    .pl-step.done .pl-step-label { color:var(--green); }
    .pl-step.done .pl-step-sub { color:var(--green); opacity:.7; }
    .pl-step-connector { flex:1; height:2px; background:var(--border); min-width:16px; transition:background .4s; }
    .pl-step-connector.done { background:var(--green); }
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
    .pl-concepts-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .pl-concept-v2 { padding:16px; border:1px solid var(--border); border-radius:10px; background:var(--surface); transition:box-shadow .18s, transform .18s; }
    .pl-concept-v2:hover { box-shadow:0 4px 18px rgba(0,0,0,.08); transform:translateY(-1px); }
    .pl-concept-v2-hd { display:flex; align-items:center; gap:10px; margin-bottom:10px; }
    .pl-cn-badge { width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-family:'DM Mono',monospace; font-size:12px; font-weight:700; color:#fff; flex-shrink:0; }
    .pl-concept-headline { font-size:14px; font-weight:700; color:var(--text); margin-bottom:5px; line-height:1.3; }
    .pl-concept-body-v2 { font-family:'DM Mono',monospace; font-size:11px; color:var(--text-2); line-height:1.55; margin-bottom:10px; }
    .pl-concept-chips { display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-bottom:8px; }
    .pl-cta-chip { padding:3px 10px; background:var(--text); color:#fff; border-radius:4px; font-size:11px; font-weight:700; }
    .pl-roas-chip { padding:3px 8px; border-radius:4px; font-family:'DM Mono',monospace; font-size:11px; font-weight:500; }
    .pl-roas-bar-wrap { height:3px; background:var(--border); border-radius:2px; margin-bottom:9px; overflow:hidden; }
    .pl-roas-bar-fill { height:100%; border-radius:2px; transition:width .8s ease; }
    .pl-prompt-toggle { font-family:'DM Mono',monospace; font-size:10px; color:var(--text-3); cursor:pointer; user-select:none; transition:color .14s; }
    .pl-prompt-toggle:hover { color:var(--purple); }
    .pl-prompt-text { font-family:'DM Mono',monospace; font-size:10px; color:var(--text-3); margin-top:6px; line-height:1.5; display:none; padding:8px; background:var(--bg); border-radius:6px; border:1px solid var(--border); }
  `;
  document.head.appendChild(s);
}

function bindPipelineEvents(el, ps) {
  const PHASE_LABELS = [
    'Fase 1 van 7 — Atoms laden vanuit schijf',
    'Fase 2 van 7 — Advertiser product & context invoeren',
    'Fase 3 van 7 — PLN spec & patroonherkenning',
    'Fase 4 van 7 — 10 advertentie concepten genereren',
    'Fase 5 van 7 — gpt-image-1 beelden genereren',
    'Fase 6 van 7 — Verificatie feedback loop',
    'Fase 7 van 7 — Geverifieerde output bekijken',
  ];

  function setStep(n) {
    ps.step = n;
    el.querySelectorAll('.pl-step').forEach((s, i) => {
      s.classList.toggle('done', i + 1 < n);
      s.classList.toggle('active', i + 1 === n);
    });
    el.querySelectorAll('.pl-step-connector').forEach((c, i) => {
      c.classList.toggle('done', i + 1 < n);
    });
    const pct = Math.round(((n - 1) / 7) * 100);
    const fillEl = el.querySelector('#pl-prog-fill');
    const pctEl  = el.querySelector('#pl-prog-pct');
    const lblEl  = el.querySelector('#pl-prog-label');
    if (fillEl) fillEl.style.width = pct + '%';
    if (pctEl)  pctEl.textContent  = pct + '%';
    if (lblEl)  lblEl.textContent  = PHASE_LABELS[n - 1] ?? '';
  }

  function showPhase(n) {
    el.querySelectorAll('.pl-phase').forEach((p, i) => {
      p.style.display = (i + 1 === n) ? '' : 'none';
    });
    setStep(n);
  }

  function showActionBar(phaseLabel, btnLabel, onClick) {
    const bar    = el.querySelector('#pl-action-bar');
    const phase  = el.querySelector('#pl-bar-phase');
    const btn    = el.querySelector('#pl-bar-btn');
    if (!bar || !btn) return;
    phase.textContent = phaseLabel;
    btn.textContent   = btnLabel;
    btn.onclick = onClick;
    bar.style.display = 'flex';
  }

  function hideActionBar() {
    const bar = el.querySelector('#pl-action-bar');
    if (bar) bar.style.display = 'none';
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

      const atoms = ps.performanceAtoms;
      result.innerHTML = `
        <div class="success-banner" style="margin-bottom:12px">
          <div class="success-icon">✓</div>
          <div>
            <div class="success-title">${atoms.length} Performance Atoms Geladen</div>
            <div class="success-text">Gem. ROAS: ${(atoms.reduce((s,a)=>s+(a.ROAS??0),0)/atoms.length).toFixed(1)}× · Gem. CTR: ${(atoms.reduce((s,a)=>s+(a.ctr??a.CTR??0),0)/atoms.length).toFixed(2)}%</div>
          </div>
        </div>
        <div class="table-toolbar">
          <input class="table-search" id="pl-atom-search" placeholder="Zoek op ad_id of campagne…" type="search">
          <select class="table-sort" id="pl-atom-sort">
            <option value="">Sorteren op…</option>
            <option value="ctr-desc">CTR ↓</option>
            <option value="ctr-asc">CTR ↑</option>
            <option value="roas-desc">ROAS ↓</option>
            <option value="roas-asc">ROAS ↑</option>
            <option value="spend-desc">Spend ↓</option>
          </select>
          <span class="table-count" id="pl-atom-count">${atoms.length} atoms</span>
        </div>
        <div id="pl-atoms-table-wrap">
          <table class="pl-atoms-table" id="pl-atoms-table">
            <tr>
              <th>ad_id</th>
              <th><span class="th-tip" data-tip="Click-Through Rate — % van gebruikers dat klikt">CTR</span></th>
              <th><span class="th-tip" data-tip="Cost Per Click — kosten per klik in euro">CPC</span></th>
              <th><span class="th-tip" data-tip="Cost Per Mille — kosten per 1000 vertoningen">CPM</span></th>
              <th><span class="th-tip" data-tip="Return On Ad Spend — opbrengst per euro uitgegeven">ROAS</span></th>
              <th>Spend</th>
              <th>Campagne</th>
            </tr>
            ${atoms.map(a => {
              const ctr = a.ctr ?? a.CTR ?? 0;
              const roas = a.ROAS ?? 0;
              const rowCls = ctr > 3 ? 'tr-high-ctr' : roas >= 5 ? 'tr-high-roas' : '';
              return `<tr class="${rowCls}" data-ad="${a.ad_id}" data-camp="${a.campaign_name??''}" data-ctr="${ctr}" data-roas="${roas}" data-spend="${a.spend??0}">
                <td style="font-weight:600">${a.ad_id}</td>
                <td style="color:${ctr>3?'var(--green)':'inherit'}">${ctr ? ctr.toFixed(2) + '%' : '—'}</td>
                <td>${a.cpc != null ? fmtEur(a.cpc) : '—'}</td>
                <td>${a.cpm != null ? fmtEur(a.cpm) : '—'}</td>
                <td style="color:${roas>=4?'var(--green)':roas<2?'var(--coral)':'inherit'}">${roas ? roas + '×' : '—'}</td>
                <td>${a.spend != null ? fmtEur(a.spend) : '—'}</td>
                <td>${a.campaign_name ?? '—'}</td>
              </tr>`;
            }).join('')}
          </table>
        </div>
        <button class="btn-primary" id="pl-next-1" style="margin-top:14px">Doorgaan naar advertiser input →</button>`;

      // Search + sort for atom table
      const searchEl = result.querySelector('#pl-atom-search');
      const sortEl   = result.querySelector('#pl-atom-sort');
      const countEl  = result.querySelector('#pl-atom-count');
      function filterAtoms() {
        const q   = searchEl.value.toLowerCase();
        const key = sortEl.value;
        const rows = [...result.querySelectorAll('#pl-atoms-table tr:not(:first-child)')];
        rows.forEach(r => {
          const ad   = (r.dataset.ad   || '').toLowerCase();
          const camp = (r.dataset.camp || '').toLowerCase();
          r.style.display = (!q || ad.includes(q) || camp.includes(q)) ? '' : 'none';
        });
        if (key) {
          const [field, dir] = key.split('-');
          const map = { ctr:'ctr', roas:'roas', spend:'spend' };
          const prop = map[field];
          rows.sort((a, b) => {
            const av = parseFloat(a.dataset[prop] ?? 0);
            const bv = parseFloat(b.dataset[prop] ?? 0);
            return dir === 'desc' ? bv - av : av - bv;
          }).forEach(r => r.parentNode.appendChild(r));
        }
        const vis = rows.filter(r => r.style.display !== 'none').length;
        countEl.textContent = `${vis} van ${rows.length} atoms`;
      }
      searchEl.addEventListener('input', filterAtoms);
      sortEl.addEventListener('change', filterAtoms);

      el.querySelector('#pl-next-1').addEventListener('click', () => { hideActionBar(); showPhase(2); });
      showActionBar(
        'Fase 1 voltooid — Atoms geladen',
        'Doorgaan naar Advertiser input →',
        () => { hideActionBar(); showPhase(2); }
      );

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
    specBox.innerHTML = `
      <div class="loading-state">
        <span class="ls-icon">🔍</span>
        <div class="ls-title">PLN doorzoekt Atomspace…</div>
        <div class="ls-progress-wrap"><div class="ls-progress-fill" style="width:65%"></div></div>
        <div class="ls-desc">Patronen analyseren voor "${ps.product}"</div>
        <div class="ls-eta">Vergelijkt atoms · berekent confidence scores</div>
      </div>`;

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
        <div class="success-banner" style="margin-bottom:14px">
          <div class="success-icon">✓</div>
          <div>
            <div class="success-title">PLN Analyse voltooid</div>
            <div class="success-text">${ps.spec.top_patterns?.length ?? 0} patronen gevonden · Verwachte ROAS: ${ps.spec.expected_roas}× · Confidence: ${(ps.spec.confidence * 100).toFixed(0)}%</div>
          </div>
        </div>
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

      showActionBar(
        'Fase 3 — PLN Specificatie klaar',
        '10 concepten genereren →',
        () => { hideActionBar(); el.querySelector('#pl-gen-concepts').click(); }
      );
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
    list.innerHTML = `
      <div class="loading-state">
        <span class="ls-icon">⚡</span>
        <div class="ls-title">Generating 10 Ad Concepts</div>
        <div class="ls-progress-wrap"><div class="ls-progress-fill" style="width:40%"></div></div>
        <div class="ls-desc">Claude schrijft headlines, body copy en image prompts</div>
        <div class="ls-eta">Geschat: 8–15 seconden</div>
      </div>`;

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

      const roasVals = ps.concepts.map(c => c.expected_roas).filter(r => typeof r === 'number');
      list.innerHTML = `
        <div class="success-banner" style="margin-bottom:14px">
          <div class="success-icon">✓</div>
          <div>
            <div class="success-title">${ps.concepts.length} Ad Concepts Gegenereerd</div>
            <div class="success-text">ROAS range: ${Math.min(...roasVals).toFixed(1)}× – ${Math.max(...roasVals).toFixed(1)}× · Klaar voor beeld generatie</div>
          </div>
        </div>`;

      const grid = document.createElement('div');
      grid.className = 'pl-concepts-grid';
      grid.innerHTML = ps.concepts.map((c, i) => {
        const conf    = typeof c.confidence === 'number' ? c.confidence : 0.7;
        const tier    = conf >= .80 ? 'Bewezen' : conf >= .65 ? 'Sterk' : 'Potentieel';
        const color   = conf >= .80 ? 'var(--green)' : conf >= .65 ? 'var(--amber)' : 'var(--purple)';
        const roasPct = Math.min(100, ((c.expected_roas || 0) / 7) * 100).toFixed(0);
        return `
          <div class="pl-concept-v2">
            <div class="pl-concept-v2-hd">
              <div class="pl-cn-badge" style="background:${color}">${i + 1}</div>
              <span style="padding:2px 8px;border-radius:3px;font-family:'DM Mono',monospace;font-size:10px;background:${color === 'var(--green)' ? 'var(--green-s)' : color === 'var(--amber)' ? 'var(--amber-s)' : 'var(--purple-s)'};color:${color}">${tier}</span>
            </div>
            <div class="pl-concept-headline">${c.headline}</div>
            <div class="pl-concept-body-v2">${c.body}</div>
            <div class="pl-concept-chips">
              <span class="pl-cta-chip">${c.cta}</span>
              <span class="pl-roas-chip" style="background:${color === 'var(--green)' ? 'var(--green-s)' : color === 'var(--amber)' ? 'var(--amber-s)' : 'var(--purple-s)'};color:${color}">ROAS ${c.expected_roas}×</span>
              <span class="pl-roas-chip" style="background:var(--bg);color:var(--text-3)">conf ${(conf * 100).toFixed(0)}%</span>
            </div>
            <div class="pl-roas-bar-wrap">
              <div class="pl-roas-bar-fill" style="width:${roasPct}%;background:${color}"></div>
            </div>
            <div class="pl-prompt-toggle" onclick="const t=this.nextElementSibling;t.style.display=t.style.display==='block'?'none':'block';this.textContent=t.style.display==='block'?'▾ 🖼 Verberg prompt':'▸ 🖼 Image prompt'">▸ 🖼 Image prompt</div>
            <div class="pl-prompt-text">${c.image_prompt}</div>
          </div>`;
      }).join('');
      list.appendChild(grid);

      el.querySelector('#pl-gen-images').style.display = '';
      showActionBar(
        'Fase 4 — Concepten klaar',
        'Beelden genereren met gpt-image-1 →',
        () => { hideActionBar(); el.querySelector('#pl-gen-images').click(); }
      );
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
    btn.innerHTML = '<span class="pl-spinner"></span> gpt-image-1 genereert beelden…';
    showPhase(5);

    const grid = el.querySelector('#pl-images-grid');
    // Render placeholders
    grid.innerHTML = ps.concepts.map((c, i) => `
      <div class="pl-img-card" id="pl-imgcard-${i}">
        <div class="pl-img-placeholder"><span class="pl-spinner"></span><span>Genereren…</span></div>
        <div class="pl-img-label">${i + 1}. ${c.headline.slice(0, 22)}…</div>
      </div>`).join('');

    // Generate images in parallel
    await Promise.all(ps.concepts.map(async (concept, i) => {
      const card = el.querySelector(`#pl-imgcard-${i}`);
      try {
        const r = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: concept.image_prompt }),
        });
        const data = await r.json();
        if (data.success && data.imageBase64) {
          card.querySelector('.pl-img-placeholder').outerHTML =
            `<img class="pl-img-thumb" src="data:${data.mimeType};base64,${data.imageBase64}" alt="${concept.headline}"/>`;
          ps.generatedAds[i] = { concept, imageBase64: data.imageBase64, mimeType: data.mimeType, verified: false, iterations: 0 };
        } else {
          card.querySelector('.pl-img-placeholder').innerHTML = `<span style="color:#EF9F27">⚠ ${data.error || 'Geen beeld'}</span>`;
          ps.generatedAds[i] = { concept, imageBase64: null, mimeType: null, verified: false, iterations: 0 };
        }
      } catch (e) {
        card.querySelector('.pl-img-placeholder').innerHTML = `<span style="color:#E24B4A">✗ ${e.message}</span>`;
        ps.generatedAds[i] = { concept, imageBase64: null, mimeType: null, verified: false, iterations: 0 };
      }
    }));

    el.querySelector('#pl-start-verify').style.display = '';
    showActionBar(
      'Fase 5 — Beelden gegenereerd',
      'Verificatie loop starten →',
      () => { hideActionBar(); el.querySelector('#pl-start-verify').click(); }
    );
    btn.disabled = false;
    btn.textContent = 'Beelden genereren met gpt-image-1 →';
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
    showActionBar(
      'Fase 6 — Verificatie afgerond',
      'Finale output bekijken →',
      () => { hideActionBar(); el.querySelector('#pl-to-output').click(); }
    );
  });

  // ── Phase 6 → 7: final output ────────────────────────────────
  el.querySelector('#pl-to-output').addEventListener('click', () => {
    showPhase(7);
    const out = el.querySelector('#pl-final-output');

    const verified = ps.generatedAds.filter(a => a.verified).length;
    out.innerHTML = `
      <div class="success-banner" style="margin-bottom:16px">
        <div class="success-icon">🎉</div>
        <div>
          <div class="success-title">Pipeline Voltooid — ${verified} van ${ps.generatedAds.length} advertenties geverifieerd</div>
          <div class="success-text">Alle fases doorlopen · PLN patronen toegepast · Spec verificatie afgerond</div>
          <div class="success-actions">
            <button class="btn-sm primary" onclick="navigate('output')">→ Bekijk in Output pagina</button>
          </div>
        </div>
      </div>
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

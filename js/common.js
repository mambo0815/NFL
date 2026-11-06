/* Gemeinsame Helfer: API, Escaping, Layout, Ticker */
(function () {
  const API = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';
  const API_V2 = 'https://site.api.espn.com/apis/v2/sports/football/nfl';
  const CORE = 'https://sports.core.api.espn.com/v2/sports/football/leagues/nfl';
  const WEB = 'https://site.web.api.espn.com/apis/common/v3/sports/football/nfl';

  /* ---------- Sicheres HTML-Templating ---------- */
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  class Raw { constructor(s) { this.s = s; } toString() { return this.s; } }
  const raw = s => new Raw(String(s ?? ''));
  const val = v => {
    if (v instanceof Raw) return v.s;
    if (Array.isArray(v)) return v.map(val).join('');
    if (v == null || v === false) return '';
    return esc(v);
  };
  const html = (strs, ...vals) => raw(strs.reduce((a, s, i) => a + s + (i < vals.length ? val(vals[i]) : ''), ''));
  const render = (el, content) => { if (typeof el === 'string') el = document.querySelector(el); if (el) el.innerHTML = val(content); return el; };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- Daten laden ---------- */
  const mem = new Map();
  async function getJSON(url, ttl = 60000) {
    const hit = mem.get(url);
    if (hit && Date.now() - hit.t < ttl) return hit.d;
    const pending = fetch(url).then(r => {
      if (!r.ok) throw new Error(`Die Daten konnten nicht geladen werden (Status ${r.status}).`);
      return r.json();
    });
    const d = await pending;
    mem.set(url, { t: Date.now(), d });
    return d;
  }
  const secure = u => String(u || '').replace(/^http:\/\//, 'https://');

  /* ---------- Teams & Logos ---------- */
  const logo = abbr => `https://a.espncdn.com/i/teamlogos/nfl/500/${String(abbr || '').toLowerCase()}.png`;
  /* Feste Stammdaten der 32 Teams. Der ESPN-Endpunkt /teams erlaubt keine Browser-Abrufe von fremden
     Domains (kein CORS-Header), deshalb liegen die Daten hier. Stand: Saison 2026. */
  const TEAMS = {
    "1": {"abbr": "ATL", "name": "Atlanta Falcons", "short": "Falcons", "color": "a71930", "alt": "000000"},
    "2": {"abbr": "BUF", "name": "Buffalo Bills", "short": "Bills", "color": "00338d", "alt": "d50a0a"},
    "3": {"abbr": "CHI", "name": "Chicago Bears", "short": "Bears", "color": "0b1c3a", "alt": "e64100"},
    "4": {"abbr": "CIN", "name": "Cincinnati Bengals", "short": "Bengals", "color": "fb4f14", "alt": "000000"},
    "5": {"abbr": "CLE", "name": "Cleveland Browns", "short": "Browns", "color": "472a08", "alt": "ff3c00"},
    "6": {"abbr": "DAL", "name": "Dallas Cowboys", "short": "Cowboys", "color": "002a5c", "alt": "b0b7bc"},
    "7": {"abbr": "DEN", "name": "Denver Broncos", "short": "Broncos", "color": "0a2343", "alt": "fc4c02"},
    "8": {"abbr": "DET", "name": "Detroit Lions", "short": "Lions", "color": "0076b6", "alt": "bbbbbb"},
    "9": {"abbr": "GB", "name": "Green Bay Packers", "short": "Packers", "color": "204e32", "alt": "ffb612"},
    "10": {"abbr": "TEN", "name": "Tennessee Titans", "short": "Titans", "color": "4495d2", "alt": "001532"},
    "11": {"abbr": "IND", "name": "Indianapolis Colts", "short": "Colts", "color": "003b75", "alt": "ffffff"},
    "12": {"abbr": "KC", "name": "Kansas City Chiefs", "short": "Chiefs", "color": "e31837", "alt": "ffb612"},
    "13": {"abbr": "LV", "name": "Las Vegas Raiders", "short": "Raiders", "color": "000000", "alt": "a5acaf"},
    "14": {"abbr": "LAR", "name": "Los Angeles Rams", "short": "Rams", "color": "003594", "alt": "ffd100"},
    "15": {"abbr": "MIA", "name": "Miami Dolphins", "short": "Dolphins", "color": "008e97", "alt": "fc4c02"},
    "16": {"abbr": "MIN", "name": "Minnesota Vikings", "short": "Vikings", "color": "4f2683", "alt": "ffc62f"},
    "17": {"abbr": "NE", "name": "New England Patriots", "short": "Patriots", "color": "002a5c", "alt": "c60c30"},
    "18": {"abbr": "NO", "name": "New Orleans Saints", "short": "Saints", "color": "d3bc8d", "alt": "000000"},
    "19": {"abbr": "NYG", "name": "New York Giants", "short": "Giants", "color": "003c7f", "alt": "c9243f"},
    "20": {"abbr": "NYJ", "name": "New York Jets", "short": "Jets", "color": "115740", "alt": "ffffff"},
    "21": {"abbr": "PHI", "name": "Philadelphia Eagles", "short": "Eagles", "color": "06424d", "alt": "000000"},
    "22": {"abbr": "ARI", "name": "Arizona Cardinals", "short": "Cardinals", "color": "a40227", "alt": "ffffff"},
    "23": {"abbr": "PIT", "name": "Pittsburgh Steelers", "short": "Steelers", "color": "000000", "alt": "ffb612"},
    "24": {"abbr": "LAC", "name": "Los Angeles Chargers", "short": "Chargers", "color": "0080c6", "alt": "ffc20e"},
    "25": {"abbr": "SF", "name": "San Francisco 49ers", "short": "49ers", "color": "aa0000", "alt": "b3995d"},
    "26": {"abbr": "SEA", "name": "Seattle Seahawks", "short": "Seahawks", "color": "002a5c", "alt": "69be28"},
    "27": {"abbr": "TB", "name": "Tampa Bay Buccaneers", "short": "Buccaneers", "color": "bd1c36", "alt": "3e3a35"},
    "28": {"abbr": "WSH", "name": "Washington Commanders", "short": "Commanders", "color": "5a1414", "alt": "ffb612"},
    "29": {"abbr": "CAR", "name": "Carolina Panthers", "short": "Panthers", "color": "0085ca", "alt": "000000"},
    "30": {"abbr": "JAX", "name": "Jacksonville Jaguars", "short": "Jaguars", "color": "007487", "alt": "d7a22a"},
    "33": {"abbr": "BAL", "name": "Baltimore Ravens", "short": "Ravens", "color": "29126f", "alt": "000000"},
    "34": {"abbr": "HOU", "name": "Houston Texans", "short": "Texans", "color": "021018", "alt": "eb0028"}
  };
  Object.entries(TEAMS).forEach(([id, t]) => { t.id = id; });
  const teams = () => Promise.resolve(TEAMS);
  let seasonPromise;
  const season = () => (seasonPromise = seasonPromise || getJSON(`${API}/scoreboard`, 30000));

  /* ---------- Farben ---------- */
  const hex = c => (c ? '#' + String(c).replace('#', '') : null);
  function lum(h) {
    const m = /^#?([0-9a-f]{6})$/i.exec(h || ''); if (!m) return 0.2;
    const [r, g, b] = [0, 2, 4].map(i => parseInt(m[1].substr(i, 2), 16) / 255)
      .map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  /* Teamfarbe wählen: nicht zu hell und nicht zu ähnlich zur Gegnerfarbe */
  function teamColor(team, other) {
    let c = hex(team?.color) || '#0E3B2C';
    const alt = hex(team?.alternateColor);
    const oc = hex(other?.color);
    const close = oc && Math.abs(lum(c) - lum(oc)) < 0.04;
    if ((lum(c) > 0.6 || close) && alt) c = alt;
    return c;
  }

  /* ---------- Formatierung ---------- */
  const dtf = (d, o) => new Intl.DateTimeFormat('de-DE', o).format(new Date(d));
  const fmtDay = d => dtf(d, { weekday: 'long', day: 'numeric', month: 'long' });
  const fmtTime = d => dtf(d, { hour: '2-digit', minute: '2-digit' });
  const fmtShort = d => dtf(d, { weekday: 'short', day: 'numeric', month: 'short' });
  const fmtLong = d => dtf(d, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  /* Umrechnung US-Einheiten in metrisch */
  const cm = v => { const m = /(\d+)'\s*(\d+)?/.exec(v || ''); return m ? Math.round((+m[1] * 12 + +(m[2] || 0)) * 2.54) + ' cm' : (v || ''); };
  const kg = v => { const m = /(\d+)\s*lbs?/.exec(v || ''); return m ? Math.round(+m[1] * 0.4536) + ' kg' : (v || ''); };
  const qLabel = p => (p > 4 ? 'OT' : 'Q' + p);
  function gameStatus(st) {
    const t = st?.type || {};
    if (t.state === 'in') {
      if (t.name === 'STATUS_HALFTIME') return { state: 'in', label: 'Halbzeit' };
      if (t.name === 'STATUS_END_PERIOD') return { state: 'in', label: 'Ende ' + qLabel(st.period) };
      return { state: 'in', label: `${qLabel(st.period)} ${st.displayClock || ''}`.trim() };
    }
    if (t.state === 'post') return { state: 'post', label: st.period > 4 ? 'Final / OT' : 'Final' };
    if (['STATUS_POSTPONED', 'STATUS_CANCELED', 'STATUS_DELAYED', 'STATUS_SUSPENDED'].includes(t.name)) return { state: 'pre', label: t.description };
    return { state: 'pre', label: null };
  }
  const weekLabel = s => String(s || '')
    .replace(/Week (\d+)/, 'Woche $1').replace('Hall of Fame Weekend', 'Hall of Fame')
    .replace('Wild Card', 'Wild Card').replace('Divisional Round', 'Divisional Round')
    .replace('Conference Championship', 'Conference Finals').replace('Super Bowl', 'Super Bowl');
  const seasonTypeLabel = s => ({ Preseason: 'Preseason', 'Regular Season': 'Regular Season', Postseason: 'Playoffs', 'Off Season': 'Offseason' }[s] || s);

  const errorBox = (e, retry) => html`<div class="notice error" role="alert"><strong>Das hat nicht geklappt.</strong> ${e?.message || e}${retry ? html` <button class="btn" data-retry>Erneut laden</button>` : ''}</div>`;
  const loading = (t = 'Lade Daten') => html`<div class="notice loading" role="status"><span class="spin" aria-hidden="true"></span>${t}</div>`;
  const empty = t => html`<div class="notice">${t}</div>`;
  const img = (src, cls = '', alt = '') => html`<img class="${cls}" src="${secure(src)}" alt="${alt}" loading="lazy">`;
  /* Fehlende Bilder ausblenden (ohne Inline-Handler, damit eine strenge CSP möglich ist) */
  document.addEventListener('error', e => { if (e.target?.tagName === 'IMG') e.target.style.visibility = 'hidden'; }, true);
  const teamLogo = (abbr, cls = 'logo') => img(logo(abbr), cls);
  const headshot = (url, cls = 'hs') => url ? img(url, cls) : html`<span class="${cls} hs-empty"></span>`;

  /* ---------- Tabs ---------- */
  function tabs(container, items, initial, onChange) {
    const id = 't' + Math.random().toString(36).slice(2, 7);
    container.innerHTML = '';
    const bar = document.createElement('div');
    bar.className = 'tabs'; bar.setAttribute('role', 'tablist');
    items.forEach(([key, label]) => {
      const b = document.createElement('button');
      b.type = 'button'; b.role = 'tab'; b.id = `${id}-${key}`; b.dataset.key = key; b.textContent = label;
      b.addEventListener('click', () => select(key, true));
      b.addEventListener('keydown', e => {
        const i = items.findIndex(x => x[0] === key); let n = null;
        if (e.key === 'ArrowRight') n = (i + 1) % items.length;
        if (e.key === 'ArrowLeft') n = (i - 1 + items.length) % items.length;
        if (n !== null) { e.preventDefault(); select(items[n][0], true); bar.children[n].focus(); }
      });
      bar.appendChild(b);
    });
    const panel = document.createElement('div');
    panel.className = 'tabpanel'; panel.setAttribute('role', 'tabpanel'); panel.tabIndex = 0;
    container.append(bar, panel);
    function select(key, user) {
      [...bar.children].forEach(b => { const on = b.dataset.key === key; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; });
      panel.setAttribute('aria-labelledby', `${id}-${key}`);
      if (user) { try { history.replaceState(null, '', location.pathname + location.search + '#' + key); } catch (e) { } }
      onChange(key, panel);
    }
    const fromHash = location.hash.slice(1);
    select(items.some(x => x[0] === fromHash) ? fromHash : initial);
    return { select, panel };
  }
  function segmented(container, items, initial, onChange, label = '') {
    container.innerHTML = '';
    container.className = 'seg'; container.setAttribute('role', 'group'); if (label) container.setAttribute('aria-label', label);
    items.forEach(([key, text]) => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = text; b.dataset.key = key;
      b.addEventListener('click', () => set(key)); container.appendChild(b);
    });
    function set(key) { [...container.children].forEach(b => b.setAttribute('aria-pressed', b.dataset.key === key)); onChange(key); }
    set(initial);
    return set;
  }

  /* ---------- Seitenrahmen ---------- */
  const NAV = [['index.html', 'Spiele'], ['standings.html', 'Tabelle'], ['teams.html', 'Teams'], ['leaders.html', 'Leader'], ['news.html', 'News']];
  const ACTIVE = { 'game.html': 'index.html', 'team.html': 'teams.html', 'player.html': 'teams.html', '': 'index.html' };
  function frame() {
    const file = location.pathname.split('/').pop();
    const active = ACTIVE[file] ?? file;
    const header = document.createElement('header');
    header.className = 'site-header';
    header.innerHTML = val(html`<div class="wrap bar">
      <a class="brand" href="index.html" aria-label="Gameday, zur Startseite"><span class="brand-mark" aria-hidden="true">NFL</span><span class="brand-name">Gameday</span></a>
      <nav aria-label="Hauptnavigation"><ul class="nav">${NAV.map(([h, l]) => html`<li><a href="${h}" ${h === active ? raw('aria-current="page"') : ''}>${l}</a></li>`)}</ul></nav>
    </div>
    <div class="ticker" id="ticker" aria-label="Aktuelle Ergebnisse" hidden><div class="wrap ticker-in" id="ticker-in"></div></div>`);
    document.body.prepend(header);
    const skip = document.createElement('a'); skip.className = 'skip'; skip.href = '#main'; skip.textContent = 'Zum Inhalt springen';
    document.body.prepend(skip);
    const f = document.createElement('footer');
    f.className = 'site-footer';
    f.innerHTML = val(html`<div class="wrap"><nav class="legal" aria-label="Rechtliches"><a href="impressum.html">Impressum</a><a href="datenschutz.html">Datenschutz</a></nav>Inoffizielles Fan-Projekt ohne Verbindung zur NFL. Die Daten stammen aus öffentlichen ESPN-Schnittstellen und können sich jederzeit ändern. Teamnamen und Logos gehören den jeweiligen Rechteinhabern.</div>`);
    document.body.append(f);
    const main = $('main'); if (main && !main.id) main.id = 'main';
  }
  async function ticker() {
    try {
      const d = await season();
      const ev = d.events || [];
      if (!ev.length) return;
      const items = ev.map(e => {
        const c = e.competitions[0]; const st = gameStatus(e.status);
        const a = c.competitors.find(x => x.homeAway === 'away'), h = c.competitors.find(x => x.homeAway === 'home');
        const cell = t => html`<span class="tk-t ${t.winner ? 'w' : ''}">${teamLogo(t.team.abbreviation, 'logo xs')}<b>${t.team.abbreviation}</b><i>${st.state === 'pre' ? '' : t.score}</i></span>`;
        return html`<a class="tick ${st.state}" href="game.html?id=${e.id}">${cell(a)}${cell(h)}<span class="tk-s">${st.state === 'pre' ? fmtShort(e.date) + ', ' + fmtTime(e.date) : st.label}</span></a>`;
      });
      render('#ticker-in', items); $('#ticker').hidden = false;
    } catch (e) { /* Ticker ist optional */ }
  }
  function heroAside(big, label) {
    return html`<div class="field-aside" aria-hidden="true"><span class="big">${big}</span>${label ? html`<span class="lbl">${label}</span>` : ''}</div>`;
  }
  /* Retry-Buttons in Fehlerboxen */
  document.addEventListener('click', e => { if (e.target.closest?.('[data-retry]')) location.reload(); });

  window.NFL = {
    API, API_V2, CORE, WEB, esc, raw, html, render, $, $$, getJSON, secure, logo, teams, season, hex, lum, teamColor,
    fmtDay, fmtTime, fmtShort, fmtLong, cm, kg, qLabel, gameStatus, weekLabel, seasonTypeLabel, errorBox, loading, empty, img, teamLogo, headshot,
    tabs, segmented, heroAside
  };
  document.addEventListener('DOMContentLoaded', () => { frame(); ticker(); });
})();

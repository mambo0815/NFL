/* Spielübersicht mit Wochenwahl und Live-Update */
(async function () {
  const { API, html, raw, render, $, getJSON, gameStatus, fmtDay, fmtTime, teamLogo, weekLabel, seasonTypeLabel, errorBox, loading, heroAside, season } = NFL;
  const content = $('#content');
  let weeks = [];       // [{t, w, label, group}]
  let current = null;   // "typ:woche"
  let year = null;
  let timer = null;

  const key = x => `${x.t}:${x.w}`;
  const fromUrl = () => new URLSearchParams(location.search).get('w');

  function buildWeeks(data) {
    const cal = data.leagues?.[0]?.calendar || [];
    weeks = [];
    cal.forEach(sec => (sec.entries || []).forEach(en => {
      weeks.push({ t: sec.value, w: en.value, label: weekLabel(en.label), group: seasonTypeLabel(sec.label) });
    }));
  }

  function card(e) {
    const c = e.competitions[0];
    const home = c.competitors.find(x => x.homeAway === 'home');
    const away = c.competitors.find(x => x.homeAway === 'away');
    const st = gameStatus(e.status);
    const row = t => html`<div class="tm ${st.state === 'post' ? (t.winner ? 'win' : 'lose') : ''}">
      ${teamLogo(t.team.abbreviation)}
      <div class="tm-name"><b>${t.team.shortDisplayName || t.team.name}</b><span>${t.records?.[0]?.summary || ''}</span></div>
      <div class="sc">${st.state === 'pre' ? '' : t.score}</div></div>`;
    const tv = c.broadcast || c.broadcasts?.[0]?.names?.[0] || '';
    const odds = c.odds?.[0]?.details || '';
    return html`<a class="game ${st.state}" href="game.html?id=${e.id}" aria-label="${away.team.displayName} gegen ${home.team.displayName}">
      <div class="teams">${row(away)}${row(home)}</div>
      <div class="side">
        <strong>${st.state === 'pre' ? (st.label || fmtTime(e.date)) : st.label}</strong>
        ${tv ? html`<span>${tv}</span>` : ''}${odds ? html`<span>${odds}</span>` : ''}
        ${c.venue?.fullName && st.state === 'pre' ? html`<span>${c.venue.fullName}</span>` : ''}
      </div></a>`;
  }

  function view(data) {
    const events = (data.events || []).slice().sort((a, b) => new Date(a.date) - new Date(b.date));
    const days = new Map();
    events.forEach(e => { const k = fmtDay(e.date); (days.get(k) || days.set(k, []).get(k)).push(e); });
    const idx = weeks.findIndex(x => key(x) === current);
    const opts = [];
    let grp = null;
    weeks.forEach((x, i) => {
      if (x.group !== grp) { if (grp) opts.push(raw('</optgroup>')); opts.push(raw(`<optgroup label="${NFL.esc(x.group)}">`)); grp = x.group; }
      opts.push(html`<option value="${key(x)}" ${key(x) === current ? raw('selected') : ''}>${x.label}</option>`);
    });
    if (grp) opts.push(raw('</optgroup>'));
    const bye = data.week?.teamsOnBye || [];
    const live = events.some(e => e.status?.type?.state === 'in');

    render(content, html`
      <div class="toolbar">
        <div class="weeknav">
          <button class="btn" id="prev" ${idx <= 0 ? raw('disabled') : ''} aria-label="Vorherige Woche">Zurück</button>
          <label class="sr-only" for="wk">Woche wählen</label>
          <select id="wk">${opts}</select>
          <button class="btn" id="next" ${idx < 0 || idx >= weeks.length - 1 ? raw('disabled') : ''} aria-label="Nächste Woche">Weiter</button>
        </div>
        ${live ? html`<span class="muted">Live-Spiele laufen, die Ergebnisse aktualisieren sich automatisch.</span>` : ''}
      </div>
      ${events.length ? [...days].map(([d, list]) => html`<section class="day"><h3>${d}</h3><div class="games">${list.map(card)}</div></section>`)
        : html`<div class="notice">In dieser Woche sind keine Spiele angesetzt.</div>`}
      ${bye.length ? html`<section class="sec"><h2>Spielfrei</h2><div class="bye">${bye.map(t => html`<a class="chip" href="team.html?id=${t.id}">${teamLogo(t.abbreviation, 'logo xs')}${t.displayName}</a>`)}</div></section>` : ''}`);

    const wk = weeks[idx];
    render('#hero-aside', heroAside(wk ? (wk.label.match(/\d+/)?.[0] || wk.label) : (data.week?.number ?? ''), wk && /\d/.test(wk.label) ? 'Woche' : ''));
    const sub = $('.field-sub'); if (sub) sub.textContent = `Saison ${year}, ${wk ? wk.group : ''}${wk && !/\d/.test(wk.label) ? ', ' + wk.label : ''}`.replace(/, $/, '');
    $('#wk').addEventListener('change', e => go(e.target.value));
    $('#prev')?.addEventListener('click', () => go(key(weeks[idx - 1])));
    $('#next')?.addEventListener('click', () => go(key(weeks[idx + 1])));
    clearTimeout(timer);
    if (live) timer = setTimeout(() => load(current, true), 30000);
  }

  async function load(sel, silent) {
    try {
      if (!silent) render(content, loading('Lade Spiele'));
      const [t, w] = sel.split(':');
      const data = await getJSON(`${API}/scoreboard?dates=${year}&seasontype=${t}&week=${w}`, silent ? 0 : 20000);
      current = sel; view(data);
    } catch (e) { render(content, errorBox(e, true)); }
  }
  function go(sel) {
    try { history.replaceState(null, '', `?w=${sel}`); } catch (e) { }
    load(sel);
  }

  try {
    const base = await season();
    year = base.season?.year;
    buildWeeks(base);
    const def = `${base.season?.type}:${base.week?.number}`;
    const wanted = fromUrl();
    const sel = weeks.some(x => key(x) === wanted) ? wanted : def;
    if (sel === def) { current = def; view(base); } else load(sel);
  } catch (e) { render(content, errorBox(e, true)); }
})();

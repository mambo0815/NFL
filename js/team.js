/* Teamseite: Spielplan, Kader, Aufstellung, Statistiken */
(async function () {
  const { API, CORE, teams, season, cm, kg, html, render, $, $$, getJSON, fmtShort, fmtTime, teamLogo, headshot, tabs, segmented, errorBox, loading, empty, hex, lum, gameStatus } = NFL;
  const id = new URLSearchParams(location.search).get('id');
  const content = $('#content');
  if (!id) { render(content, errorBox('Es wurde kein Team ausgewählt. Wähle ein Team auf der Teams-Seite.')); return; }

  let coach = '';

  /* ---------- Kopf ---------- */
  function hero(t) {
    let c = hex(t.color) || '#0E3B2C';
    if (lum(c) > 0.7 && t.alternateColor) c = hex(t.alternateColor);
    const field = $('#hero');
    field.style.setProperty('--team', c);
    if (lum(c) > 0.45) field.setAttribute('data-light', '');
    const ne = t.next;
    let next = '';
    if (ne) {
      const cs = ne.competitions?.[0]?.competitors || [];
      const opp = cs.find(x => x.id !== id);
      const away = cs.find(x => x.homeAway === 'away')?.id === id;
      next = html`<a href="game.html?id=${ne.id}" style="text-decoration:underline">Nächstes Spiel: ${away ? '@' : 'gegen'} ${opp?.team?.displayName || ''}, ${fmtShort(ne.date)} ${fmtTime(ne.date)} Uhr</a>`;
    }
    const rec = t.rec;
    document.title = `${t.displayName} – NFL Gameday`;
    render('#hero-inner', html`<div style="display:flex;gap:clamp(1rem,3vw,2rem);align-items:center;flex-wrap:wrap">
      ${teamLogo(t.abbreviation, 'logo xl')}
      <div><h1 class="field-title">${t.displayName}</h1>
      <p class="field-sub">${rec ? 'Bilanz ' + rec : ''}${t.standingSummary ? (rec ? ', ' : '') + t.standingSummary : ''}</p>
      <p class="field-sub" style="margin-top:.3rem">${coach ? 'Head Coach: ' + coach + '. ' : ''}${next}</p></div></div>`);
  }

  /* ---------- Spielplan ---------- */
  async function schedule(panel) {
    render(panel, loading('Lade Spielplan'));
    const d = await getJSON(`${API}/teams/${id}/schedule`, 120000);
    const events = d.events || [];
    const bye = d.byeWeek;
    const byeRow = html`<tr><td class="l">${bye}</td><td colspan="4" class="l muted">Spielfrei (Bye-Woche)</td></tr>`;
    const rows = [];
    let byeDone = !bye;
    events.forEach(e => {
      const wk = e.week?.number;
      if (!byeDone && wk > bye) { rows.push(byeRow); byeDone = true; }
      const comp = e.competitions?.[0];
      const cs = comp?.competitors || [];
      const me = cs.find(c => c.id === id || c.team?.id === id);
      const opp = cs.find(c => c !== me);
      if (!me || !opp) return;
      const st = gameStatus(comp.status);
      const played = st.state === 'post' || st.state === 'in';
      const ms = me.score?.displayValue ?? me.score;
      const os = opp.score?.displayValue ?? opp.score;
      const res = st.state === 'post' ? (me.winner ? 'S' : opp.winner ? 'N' : 'U') : '';
      rows.push(html`<tr><td class="l">${e.seasonType?.id === '3' ? e.week?.text : wk}</td>
        <td class="l">${fmtShort(e.date)}</td>
        <td class="l"><a class="team-cell" href="team.html?id=${opp.team?.id || opp.id}">${me.homeAway === 'away' ? '@' : 'gegen'} ${teamLogo(opp.team?.abbreviation, 'logo sm')}<span>${opp.team?.displayName}</span></a></td>
        <td class="${res === 'S' ? 'res-w' : res === 'N' ? 'res-l' : ''}">${res}</td>
        <td><a href="game.html?id=${e.id}" style="text-decoration:none"><b>${played ? `${ms}:${os}` : fmtTime(e.date) + ' Uhr'}</b></a></td></tr>`);
    });
    if (!byeDone) rows.push(byeRow);
    render(panel, rows.length ? html`<div class="tablewrap"><table class="data"><caption>Spielplan ${d.season?.year || ''}</caption>
      <thead><tr><th scope="col" class="l">Woche</th><th scope="col" class="l">Datum</th><th scope="col" class="l">Gegner</th><th scope="col">Ergebnis</th><th scope="col">Score / Anpfiff</th></tr></thead><tbody>${rows}</tbody></table></div>` : empty('Für dieses Team ist noch kein Spielplan verfügbar.'));
  }

  /* ---------- Kader ---------- */
  const GROUPS = { offense: 'Offense', defense: 'Defense', specialTeam: 'Special Teams', injuredReserveOrOut: 'Verletzte Reserve', suspended: 'Gesperrt', practiceSquad: 'Practice Squad' };
  async function roster(panel) {
    render(panel, loading('Lade Kader'));
    const d = await getJSON(`${API}/teams/${id}/roster`, 300000);
    const groups = d.athletes || [];
    if (!groups.length) { render(panel, empty('Für dieses Team ist noch kein Kader verfügbar.')); return; }
    render(panel, html`<div class="toolbar"><label class="sr-only" for="q">Spieler suchen</label><input id="q" type="search" placeholder="Spieler oder Position suchen"></div><div id="rost">${groups.map(g => html`<section class="stat-sec"><div class="tablewrap"><table class="data sticky"><caption>${GROUPS[g.position] || g.position}</caption>
      <thead><tr><th scope="col" class="l">Spieler</th><th scope="col">Nr.</th><th scope="col">Pos.</th><th scope="col">Alter</th><th scope="col">Größe</th><th scope="col">Gewicht</th><th scope="col" class="l">College</th><th scope="col">Erfahrung</th></tr></thead>
      <tbody>${(g.items || []).map(a => html`<tr><td class="l"><a class="pl" href="player.html?id=${a.id}">${headshot(a.headshot?.href)}<span>${a.fullName}</span></a>${a.status?.type && a.status.type !== 'active' ? html` <span class="status-tag">${a.status.name}</span>` : ''}${a.injuries?.[0] ? html` <span class="status-tag">${a.injuries[0].status}</span>` : ''}</td>
        <td>${a.jersey || ''}</td><td>${a.position?.abbreviation || ''}</td><td>${a.age ?? ''}</td><td>${cm(a.displayHeight)}</td><td>${kg(a.displayWeight)}</td><td class="l">${a.college?.name || ''}</td><td>${a.experience?.years != null ? a.experience.years + ' J.' : ''}</td></tr>`)}</tbody></table></div></section>`)}</div>`);
    $('#q', panel).addEventListener('input', e => {
      const q = e.target.value.trim().toLowerCase();
      $$('#rost tbody tr', panel).forEach(tr => { tr.hidden = !!q && !tr.textContent.toLowerCase().includes(q); });
    });
  }

  /* ---------- Aufstellung ---------- */
  async function depth(panel) {
    render(panel, loading('Lade Aufstellung'));
    const yr = (await season()).season?.year;
    const [dc, ro] = await Promise.all([
      getJSON(`${CORE}/seasons/${yr}/teams/${id}/depthcharts?lang=en&region=us`, 300000),
      getJSON(`${API}/teams/${id}/roster`, 300000)
    ]);
    const names = {};
    (ro.athletes || []).forEach(g => (g.items || []).forEach(a => { names[a.id] = a; }));
    const forms = dc.items || [];
    if (!forms.length) { render(panel, empty('Für dieses Team ist keine Aufstellung verfügbar.')); return; }
    render(panel, html`<div class="toolbar"><label for="fm" class="sr-only">Formation wählen</label><select id="fm">${forms.map((f, i) => html`<option value="${i}">${f.name}</option>`)}</select><span class="muted">Der erste Spieler jeder Position ist der Starter.</span></div><div id="dc"></div>`);
    const show = i => {
      const pos = forms[i].positions || {};
      render('#dc', html`<div class="depth">${Object.entries(pos).map(([k, p]) => html`<div class="dpos"><h4>${p.position?.abbreviation || k.toUpperCase()}</h4><ol>${(p.athletes || []).slice().sort((x, y) => x.rank - y.rank).map(x => {
        const aid = /athletes\/(\d+)/.exec(x.athlete?.$ref || '')?.[1];
        const a = names[aid];
        return html`<li>${aid ? html`<a href="player.html?id=${aid}">${a?.displayName || 'Spieler ' + aid}</a>` : 'Unbekannt'}${a?.injuries?.[0] ? html` <span class="status-tag">${a.injuries[0].status}</span>` : ''}</li>`;
      })}</ol></div>`)}</div>`);
    };
    $('#fm', panel).addEventListener('change', e => show(+e.target.value));
    show(0);
  }

  /* ---------- Statistiken ---------- */
  const CAT = { passing: 'Passspiel', rushing: 'Laufspiel', receiving: 'Passempfang', miscellaneous: 'Sonstiges', defensive: 'Defense', defensiveInterceptions: 'Interceptions', general: 'Allgemein', returning: 'Returns', kicking: 'Kicker', punting: 'Punter', scoring: 'Punkte' };
  async function stats(panel) {
    render(panel, loading('Lade Statistiken'));
    const d = await getJSON(`${API}/teams/${id}/statistics`, 300000);
    const r = d.results || {};
    if (!r.stats?.categories?.length) { render(panel, empty('Für dieses Team sind noch keine Statistiken verfügbar.')); return; }
    render(panel, html`<div class="toolbar"><div id="who"></div></div><div id="st"></div>`);
    const show = who => {
      const cats = r[who]?.categories || [];
      render('#st', cats.length ? cats.map(c => html`<section class="stat-sec"><div class="tablewrap"><table class="data"><caption>${CAT[c.name] || c.displayName}</caption>
        <thead><tr><th scope="col" class="l">Statistik</th><th scope="col">Gesamt</th><th scope="col">Pro Spiel</th></tr></thead>
        <tbody>${(c.stats || []).map(s => html`<tr><td class="l" title="${s.description || ''}">${s.displayName}</td><td class="k">${s.displayValue}</td><td>${s.perGameDisplayValue ?? ''}</td></tr>`)}</tbody></table></div></section>`) : empty('Keine Daten vorhanden.'));
    };
    segmented($('#who', panel), [['stats', 'Team'], ['opponent', 'Gegner']], 'stats', show, 'Ansicht wählen');
  }

  try {
    const [sch, ro, tm] = await Promise.all([getJSON(`${API}/teams/${id}/schedule`, 120000), getJSON(`${API}/teams/${id}/roster`, 300000).catch(() => null), teams()]);
    const info = tm[id] || {};
    const st = sch.team || {};
    const c = ro?.coach?.[0];
    coach = c ? `${c.firstName} ${c.lastName}` : '';
    const next = (sch.events || []).find(e => ['pre', 'in'].includes(e.competitions?.[0]?.status?.type?.state));
    hero({ displayName: st.displayName || info.name, abbreviation: st.abbreviation || info.abbr, color: st.color || info.color, alternateColor: info.alt, rec: st.recordSummary, standingSummary: st.standingSummary, next });
    content.innerHTML = '<div id="tabs"></div>';
    const FN = { schedule, roster, depth, stats };
    tabs($('#tabs'), [['schedule', 'Spielplan'], ['roster', 'Kader'], ['depth', 'Aufstellung'], ['stats', 'Statistiken']], 'schedule',
      (k, panel) => FN[k](panel).catch(e => render(panel, errorBox(e))));
  } catch (e) { render(content, errorBox(e, true)); }
})();

/* Spieldetail: Überblick, Boxscore, Drives, Infos */
(function () {
  const { API, html, raw, render, $, getJSON, gameStatus, fmtLong, fmtTime, teamLogo, headshot, teamColor, tabs, segmented, errorBox, loading, empty, qLabel, esc } = NFL;
  const id = new URLSearchParams(location.search).get('id');
  const content = $('#content');
  let activeTab = null, timer = null, data = null, ctx = null;

  const PLAYER_CAT = { passing: 'Passspiel', rushing: 'Laufspiel', receiving: 'Passempfang', fumbles: 'Fumbles', defensive: 'Defense', interceptions: 'Interceptions', kickReturns: 'Kick Returns', puntReturns: 'Punt Returns', kicking: 'Kicker', punting: 'Punter' };

  function prepare(d) {
    const comp = d.header?.competitions?.[0];
    const cs = comp?.competitors || [];
    const away = cs.find(c => c.homeAway === 'away') || cs[0];
    const home = cs.find(c => c.homeAway === 'home') || cs[1];
    const st = gameStatus(comp?.status);
    const ca = teamColor(away?.team, home?.team), ch = teamColor(home?.team, away?.team);
    return { comp, away, home, st, ca, ch };
  }

  function hero() {
    const { comp, away, home, st } = ctx;
    const side = (t, cls) => html`<div class="gh-team ${cls}">
      ${teamLogo(t.team.abbreviation, 'logo xl')}
      <div class="nm"><span class="city">${t.team.location}</span><a class="name" href="team.html?id=${t.team.id}">${t.team.name}</a><span class="rec">${t.record?.[0]?.summary || t.record?.find?.(r => r.type === 'total')?.summary || ''}</span></div></div>`;
    const as = +away.score, hs = +home.score, done = st.state === 'post';
    const score = st.state === 'pre' ? html`<div class="pts" aria-label="Noch kein Ergebnis"><span class="dash">gegen</span></div>`
      : html`<div class="pts"><span class="${done && as < hs ? 'lost' : ''}">${away.score}</span><span class="dash">:</span><span class="${done && hs < as ? 'lost' : ''}">${home.score}</span></div>`;
    const v = data.gameInfo?.venue;
    const tv = (comp.broadcasts || []).map(b => b.media?.shortName || b.names?.[0]).filter(Boolean);
    document.title = `${away.team.abbreviation} @ ${home.team.abbreviation} – NFL Gameday`;
    render('#hero-inner', html`<div style="width:100%">
      <div class="gh">${side(away, 'away')}<div class="gh-score">${score}<div class="st ${st.state}">${st.state === 'pre' ? fmtTime(comp.date) + ' Uhr' : st.label}</div></div>${side(home, 'home')}</div>
      <div class="gh-meta"><span>${fmtLong(comp.date)}</span>${v ? html`<span>${v.fullName}${v.address?.city ? ', ' + v.address.city : ''}${v.address?.state ? ' (' + v.address.state + ')' : ''}</span>` : ''}${tv.length ? html`<span>TV: ${tv.join(', ')}</span>` : ''}</div></div>`);
    $('#hero-inner').classList.add('col');
  }

  /* ---------- Überblick ---------- */
  function lineScore() {
    const { away, home } = ctx;
    const n = Math.max(away.linescores?.length || 0, home.linescores?.length || 0);
    if (!n) return '';
    const heads = Array.from({ length: n }, (_, i) => html`<th scope="col">${qLabel(i + 1)}</th>`);
    const r = t => html`<tr><td class="l"><span class="team-cell">${teamLogo(t.team.abbreviation, 'logo xs')}<span>${t.team.abbreviation}</span></span></td>${Array.from({ length: n }, (_, i) => html`<td>${t.linescores?.[i]?.displayValue ?? '-'}</td>`)}<td class="k">${t.score}</td></tr>`;
    return html`<div class="tablewrap"><table class="data linescore"><caption class="sr-only">Punkte pro Viertel</caption><thead><tr><th scope="col">Team</th>${heads}<th scope="col">Gesamt</th></tr></thead><tbody>${r(away)}${r(home)}</tbody></table></div>`;
  }

  function winProb() {
    const wp = (data.winprobability || []).map(p => p.homeWinPercentage).filter(v => typeof v === 'number');
    if (wp.length < 3) return '';
    const { away, home, ca, ch } = ctx;
    const W = 800, H = 220, mid = H / 2;
    const x = i => (i / (wp.length - 1)) * W, y = v => H - v * H;
    const pts = wp.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
    const line = 'M' + pts.join(' L');
    const area = `${line} L${W},${mid} L0,${mid} Z`;
    const uid = 'wp' + id;
    const last = wp[wp.length - 1];
    return html`<div class="panel"><h3>Siegwahrscheinlichkeit</h3>
      <svg class="chart" viewBox="0 0 ${W} ${H + 20}" role="img" aria-label="Verlauf der Siegwahrscheinlichkeit. Zum Schluss ${Math.round(last * 100)} Prozent für ${home.team.displayName}.">
        <defs><clipPath id="${uid}t"><rect x="0" y="0" width="${W}" height="${mid}"/></clipPath><clipPath id="${uid}b"><rect x="0" y="${mid}" width="${W}" height="${mid}"/></clipPath></defs>
        <path d="${area}" fill="${ch}" opacity=".85" clip-path="url(#${uid}t)"/>
        <path d="${area}" fill="${ca}" opacity=".85" clip-path="url(#${uid}b)"/>
        <line class="mid" x1="0" x2="${W}" y1="${mid}" y2="${mid}"/>
        <path class="ln" d="${line}"/>
        <text x="6" y="14">${home.team.abbreviation} 100 %</text><text x="6" y="${H - 6}">${away.team.abbreviation} 100 %</text>
        <text x="${W}" y="${H + 16}" text-anchor="end">Spielverlauf von Anpfiff bis Schluss</text>
      </svg></div>`;
  }

  function scoringPlays() {
    const sp = data.scoringPlays || [];
    if (!sp.length) return '';
    let q = null; const out = [];
    sp.forEach(p => {
      const pq = p.period?.number;
      if (pq !== q) { q = pq; out.push(html`<li class="qh" aria-hidden="true">${qLabel(pq)}</li>`); }
      const tid = p.team?.id; const abbr = p.team?.abbreviation || '';
      out.push(html`<li class="play">${teamLogo(abbr, 'logo sm')}<div><div class="t">${p.type?.text || 'Score'} (${abbr})</div><div class="x">${p.text}</div></div>
        <div class="s" title="${p.clock?.displayValue || ''}">${p.awayScore}:${p.homeScore}<div class="x" style="font:400 .8rem var(--body);text-align:right">${p.clock?.displayValue || ''}</div></div></li>`);
    });
    return html`<div class="panel"><h3>Scoring Plays</h3><ul class="plays">${out}</ul></div>`;
  }

  function toNum(s) {
    s = String(s ?? '');
    if (/^\d+-\d+$/.test(s)) return NaN;
    const m = /^(\d+):(\d+)$/.exec(s); if (m) return +m[1] * 60 + +m[2];
    return parseFloat(s.replace(',', ''));
  }
  function teamStats() {
    const teams = data.boxscore?.teams || [];
    const ta = teams.find(t => t.team?.id === ctx.away.team.id) || teams[0];
    const th = teams.find(t => t.team?.id === ctx.home.team.id) || teams[1];
    if (!ta?.statistics?.length || !th) return '';
    const { ca, ch, away, home } = ctx;
    const rows = ta.statistics.map(s => {
      const o = th.statistics?.find(x => x.name === s.name); if (!o) return '';
      const a = toNum(s.displayValue), h = toNum(o.displayValue), tot = a + h;
      const bars = isFinite(tot) && tot > 0
        ? html`<div class="bars"><span style="flex:${a};background:${ca}"></span><span style="flex:${h};background:${ch}"></span></div>` : '';
      return html`<div class="cmp-row"><span class="v">${s.displayValue}</span><div class="mid"><div class="lab">${s.label}</div>${bars}</div><span class="v">${o.displayValue}</span></div>`;
    });
    return html`<div class="panel"><h3>Team-Statistiken</h3>
      <div class="cmp-head"><span><i style="background:${ca}"></i>${away.team.abbreviation}</span><span>${home.team.abbreviation}<i style="background:${ch}"></i></span></div>
      <div class="cmp">${rows}</div></div>`;
  }

  function oddsPanel() {
    const o = data.pickcenter?.[0];
    if (!o) return '';
    const { away, home } = ctx;
    const ml = t => t == null ? '-' : (t > 0 ? '+' + t : t);
    return html`<div class="panel"><h3>Quoten</h3>
      <div class="tablewrap" style="border:0"><table class="data odds"><thead><tr><th scope="col">Wette</th><th scope="col">${away.team.abbreviation}</th><th scope="col">${home.team.abbreviation}</th></tr></thead><tbody>
        <tr><td>Moneyline</td><td>${ml(o.awayTeamOdds?.moneyLine)}</td><td>${ml(o.homeTeamOdds?.moneyLine)}</td></tr>
        <tr><td>Spread</td><td colspan="2">${o.details || '-'}</td></tr>
        <tr><td>Over/Under</td><td colspan="2">${o.overUnder ?? '-'}</td></tr></tbody></table></div>
      <p class="muted" style="margin:.6rem 0 0;font-size:.8125rem">Quoten von ${o.provider?.name || 'einem Anbieter'}, nur zur Information. Keine Wettempfehlung.</p></div>`;
  }

  function leaders() {
    const L = data.leaders || [];
    if (!L.length) return '';
    const col = t => html`<div class="panel"><h3>${t.team?.displayName || ''}</h3>${(t.leaders || []).map(c => {
      const p = c.leaders?.[0]; if (!p) return '';
      return html`<a class="lead pl" href="player.html?id=${p.athlete?.id}">${headshot(p.athlete?.headshot?.href)}<span class="who"><span>${p.athlete?.displayName}</span><small>${c.displayName}</small></span><span class="vv">${p.displayValue}</span></a>`;
    })}</div>`;
    return html`<div class="sec"><h2>Beste Spieler</h2><div class="grid g2">${L.map(col)}</div></div>`;
  }

  function injuries() {
    const I = (data.injuries || []).filter(t => t.injuries?.length);
    if (!I.length) return '';
    return html`<div class="sec"><h2>Verletzungen</h2><div class="grid g2">${I.map(t => html`<div class="panel"><h3>${t.team?.displayName}</h3>
      <div class="tablewrap" style="border:0"><table class="data"><tbody>${t.injuries.slice(0, 14).map(i => html`<tr><td class="l"><a class="pl" href="player.html?id=${i.athlete?.id}">${i.athlete?.displayName}</a></td><td>${i.athlete?.position?.abbreviation || ''}</td><td>${i.status || ''}</td></tr>`)}</tbody></table></div></div>`)}</div></div>`;
  }

  function overview(panel) {
    const pre = ctx.st.state === 'pre';
    render(panel, html`
      <div class="grid g2">${lineScore() || ''}${pre ? oddsPanel() : winProb()}</div>
      ${!pre && data.scoringPlays?.length ? html`<div class="sec grid g2">${scoringPlays()}${teamStats()}</div>` : ''}
      ${!pre ? html`<div class="sec grid g2">${oddsPanel()}</div>` : ''}
      ${pre ? html`<div class="notice" style="margin-top:var(--gap)">Das Spiel hat noch nicht begonnen. Boxscore und Verlauf erscheinen nach dem Anpfiff.</div>` : ''}
      ${leaders()}${injuries()}`);
  }

  /* ---------- Boxscore ---------- */
  function boxscore(panel) {
    const players = data.boxscore?.players || [];
    if (!players.length) { render(panel, empty('Für dieses Spiel liegt noch kein Boxscore vor.')); return; }
    const { away, home } = ctx;
    panel.innerHTML = '<div class="toolbar"><div id="tsel"></div></div><div id="bx"></div>';
    const show = teamId => {
      const t = players.find(p => p.team?.id === teamId) || players[0];
      render('#bx', (t.statistics || []).map(cat => html`<div class="stat-sec"><div class="tablewrap"><table class="data sticky"><caption>${PLAYER_CAT[cat.name] || cat.text || cat.name}</caption>
        <thead><tr><th scope="col">Spieler</th>${(cat.labels || []).map((l, i) => html`<th scope="col" title="${cat.descriptions?.[i] || ''}">${l}</th>`)}</tr></thead>
        <tbody>${(cat.athletes || []).map(a => html`<tr><td class="l"><a class="pl" href="player.html?id=${a.athlete?.id}">${headshot(a.athlete?.headshot?.href, 'hs')}<span>${a.athlete?.displayName}</span></a></td>${(a.stats || []).map(s => html`<td>${s}</td>`)}</tr>`)}</tbody></table></div></div>`));
    };
    segmented($('#tsel', panel), [[away.team.id, away.team.displayName], [home.team.id, home.team.displayName]], away.team.id, show, 'Team wählen');
  }

  /* ---------- Drives ---------- */
  function drives(panel) {
    const list = [...(data.drives?.previous || []), ...(data.drives?.current ? [data.drives.current] : [])];
    if (!list.length) { render(panel, empty('Für dieses Spiel liegen keine Drive-Daten vor.')); return; }
    render(panel, html`<div>${list.map(d => html`<details class="drive ${d.isScore ? 'score' : ''}"><summary>${teamLogo(d.team?.abbreviation, 'logo sm')}
      <div><div class="res">${d.displayResult || d.result || 'Drive'} (${d.team?.abbreviation})</div><div class="dsc">${d.description || ''}</div></div>
      <div class="yds">${d.yards ?? ''} yds</div></summary>
      <ol>${(d.plays || []).map(p => html`<li>${p.start?.downDistanceText ? html`<span class="dd">${p.start.downDistanceText}: </span>` : ''}${p.text}</li>`)}</ol></details>`)}</div>`);
  }

  /* ---------- Infos ---------- */
  function infos(panel) {
    const gi = data.gameInfo || {}; const v = gi.venue || {};
    const w = gi.weather;
    render(panel, html`<div class="grid g2">
      <div class="panel"><h3>Spielinfos</h3><dl class="facts">
        ${v.fullName ? html`<dt>Stadion</dt><dd>${v.fullName}</dd>` : ''}
        ${v.address?.city ? html`<dt>Ort</dt><dd>${v.address.city}${v.address.state ? ', ' + v.address.state : ''}</dd>` : ''}
        ${v.grass != null ? html`<dt>Rasen</dt><dd>${v.grass ? 'Naturrasen' : 'Kunstrasen'}</dd>` : ''}
        ${gi.attendance ? html`<dt>Zuschauer</dt><dd>${gi.attendance.toLocaleString('de-DE')}</dd>` : ''}
        ${w ? html`<dt>Wetter</dt><dd>${w.displayValue || ''}${w.temperature != null ? ', ' + Math.round((w.temperature - 32) * 5 / 9) + ' °C' : ''}</dd>` : ''}
      </dl></div>
      ${gi.officials?.length ? html`<div class="panel"><h3>Schiedsrichter</h3><dl class="facts">${gi.officials.map(o => html`<dt>${o.position?.displayName || ''}</dt><dd>${o.displayName}</dd>`)}</dl></div>` : ''}
    </div>`);
  }

  const TABS = [['overview', 'Überblick'], ['box', 'Boxscore'], ['drives', 'Drives'], ['info', 'Infos']];
  const FN = { overview, box: boxscore, drives, info: infos };
  function draw() {
    ctx = prepare(data); hero();
    content.innerHTML = '<div id="tabs"></div>';
    tabs($('#tabs'), TABS, activeTab || 'overview', (k, panel) => { activeTab = k; FN[k](panel); });
    clearTimeout(timer);
    if (ctx.st.state === 'in') timer = setTimeout(refresh, 30000);
  }
  async function refresh() {
    try { data = await getJSON(`${API}/summary?event=${id}`, 0); const keep = activeTab; draw(); activeTab = keep; } catch (e) { timer = setTimeout(refresh, 60000); }
  }
  async function init() {
    if (!id) { render(content, errorBox('Es wurde kein Spiel ausgewählt. Wähle ein Spiel auf der Spieleseite.')); return; }
    try { data = await getJSON(`${API}/summary?event=${id}`, 15000); draw(); }
    catch (e) { render(content, errorBox(e, true)); }
  }
  init();
})();

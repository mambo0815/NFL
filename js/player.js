/* Spielerprofil: Saisonstatistik, Game Log, Meldungen */
(async function () {
  const { WEB, cm, kg, html, render, $, getJSON, secure, teamLogo, headshot, teamColor, hex, lum, tabs, errorBox, loading, empty, fmtShort } = NFL;
  const id = new URLSearchParams(location.search).get('id');
  const content = $('#content');
  if (!id) { render(content, errorBox('Es wurde kein Spieler ausgewählt. Wähle einen Spieler im Kader eines Teams.')); return; }

  function hero(a) {
    const t = a.team;
    let c = hex(t?.color) || '#0E3B2C';
    if (lum(c) > 0.7 && t?.alternateColor) c = hex(t.alternateColor);
    const field = $('#hero'); field.style.setProperty('--team', c);
    if (lum(c) > 0.45) field.setAttribute('data-light', '');
    document.title = `${a.displayName || 'Spieler'} – NFL Gameday`;
    const facts = [cm(a.displayHeight), kg(a.displayWeight), a.age ? a.age + ' Jahre' : '', a.college?.name || a.college, a.displayExperience].filter(Boolean).join(', ');
    render('#hero-inner', html`<div class="ph">${headshot(a.headshot?.href, 'hs xl')}
      <div class="nm"><span class="no">${a.displayJersey || ''} ${a.position?.displayName || ''}${t ? html`, <a href="team.html?id=${t.id}">${t.displayName}</a>` : ''}</span>
      <h1 class="field-title">${a.displayName || a.fullName}</h1>
      <p class="field-sub" style="margin:0">${facts}</p></div></div>`);
  }

  const tiles = a => {
    const s = a.statsSummary?.statistics || [];
    if (!s.length) return '';
    return html`<div class="sec"><h2>${(a.statsSummary.displayName || 'Saison').replace('regular season stats', 'Regular Season')}</h2><div class="tiles">${s.map(x => html`<div class="tile"><b>${x.displayValue}</b><span>${x.shortDisplayName || x.displayName}</span>${x.rankDisplayValue ? html`<small>Rang ${x.rankDisplayValue}</small>` : ''}</div>`)}</div></div>`;
  };

  function seasonTable(o) {
    const st = o.statistics; if (!st?.splits?.length) return '';
    return html`<div class="sec"><div class="tablewrap"><table class="data sticky"><caption>${st.displayName || 'Saisonstatistik'}</caption>
      <thead><tr><th scope="col" class="l">Zeitraum</th>${st.labels.map((l, i) => html`<th scope="col" title="${st.displayNames?.[i] || ''}">${l}</th>`)}</tr></thead>
      <tbody>${st.splits.map(s => html`<tr><td class="l k">${{ 'Regular Season': 'Regular Season', Projected: 'Hochrechnung', 'Last 5 Games': 'Letzte 5 Spiele', Career: 'Karriere' }[s.displayName] || s.displayName}</td>${s.stats.map(v => html`<td>${v}</td>`)}</tr>`)}</tbody></table></div></div>`;
  }

  function gameLog(o) {
    const g = o.gameLog; if (!g?.statistics?.length) return empty('Zu diesem Spieler gibt es noch kein Game Log.');
    const ev = g.events || {};
    return g.statistics.map(cat => html`<section class="stat-sec"><div class="tablewrap"><table class="data sticky"><caption>${cat.displayName}</caption>
      <thead><tr><th scope="col" class="l">Spiel</th>${cat.labels.map((l, i) => html`<th scope="col" title="${cat.displayNames?.[i] || ''}">${l}</th>`)}</tr></thead>
      <tbody>${(cat.events || []).map(e => {
        const m = ev[e.eventId] || {};
        return html`<tr><td class="l"><a href="game.html?id=${e.eventId}" style="text-decoration:none"><b>${m.gameDate ? fmtShort(m.gameDate) : ''}</b> ${m.atVs === '@' ? '@' : 'gegen'} ${m.opponent?.abbreviation || ''}</a> <span class="${m.gameResult === 'W' ? 'res-w' : m.gameResult === 'L' ? 'res-l' : ''}">${m.gameResult || ''}</span> ${m.score || ''}</td>${e.stats.map(v => html`<td>${v}</td>`)}</tr>`;
      })}</tbody></table></div></section>`);
  }

  function news(o) {
    const rw = o.rotowire;
    const items = (o.news || []).filter(n => n.headline);
    return html`${rw ? html`<div class="quote"><h3>${rw.headline}</h3><p>${rw.story}</p></div>` : ''}
      ${items.length ? html`<div class="sec grid g3">${items.slice(0, 6).map(n => html`<a class="ncard" href="${secure(n.links?.web?.href || '#')}" target="_blank" rel="noopener noreferrer"><div class="tx"><h3>${n.headline}</h3><p>${n.description || ''}</p></div></a>`)}</div>` : ''}
      ${!rw && !items.length ? empty('Zurzeit gibt es keine Meldungen zu diesem Spieler.') : ''}`;
  }

  function fantasy(o) {
    const f = o.fantasy; if (!f) return '';
    return html`<div class="sec"><h2>Fantasy</h2><div class="tiles">
      ${f.positionRank ? html`<div class="tile"><b>${f.positionRank}</b><span>Rang auf der Position</span></div>` : ''}
      ${f.draftRank ? html`<div class="tile"><b>${f.draftRank}</b><span>Draft-Rang</span></div>` : ''}
      ${f.percentOwned ? html`<div class="tile"><b>${f.percentOwned} %</b><span>Besitzquote</span></div>` : ''}
      ${f.last7Days ? html`<div class="tile"><b>${f.last7Days}</b><span>Punkte, letzte 7 Tage</span></div>` : ''}</div>
      ${f.projection ? html`<p class="muted" style="margin-top:1rem;max-width:70ch">${f.projection}</p>` : ''}</div>`;
  }

  try {
    const [a, o] = await Promise.all([
      getJSON(`${WEB}/athletes/${id}`, 300000).then(d => d.athlete),
      getJSON(`${WEB}/athletes/${id}/overview`, 300000).catch(() => ({}))
    ]);
    hero(a);
    content.innerHTML = '<div id="tabs"></div>';
    const FN = {
      season: p => render(p, html`${tiles(a)}${seasonTable(o) || (!tiles(a).s ? empty('Für diesen Spieler liegen keine Saisonwerte vor.') : '')}${fantasy(o)}`),
      log: p => render(p, gameLog(o)),
      news: p => render(p, news(o))
    };
    tabs($('#tabs'), [['season', 'Saison'], ['log', 'Game Log'], ['news', 'Meldungen']], 'season', (k, p) => FN[k](p));
  } catch (e) { render(content, errorBox(e, true)); }
})();

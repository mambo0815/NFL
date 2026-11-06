/* Tabellen: Divisionen und Konferenzen */
(function () {
  const { API_V2, html, raw, render, $, getJSON, teamLogo, segmented, errorBox, loading } = NFL;
  const content = $('#content');

  const stat = (e, n) => (e.stats || []).find(s => s.name === n || s.type === n);
  const dv = (e, n) => stat(e, n)?.displayValue ?? '-';
  const diff = e => { const v = dv(e, 'differential'); return v === '-' ? dv(e, 'pointDifferential') : v; };

  function table(title, entries, conf) {
    const seedCut = conf ? entries.findIndex(e => +dv(e, 'playoffSeed') > 7) : -1;
    return html`<div class="tablewrap"><table class="data sticky"><caption>${title}</caption>
      <thead><tr>${conf ? html`<th scope="col" class="l">Platz</th>` : ''}<th scope="col" class="l">Team</th><th scope="col" title="Siege">S</th><th scope="col" title="Niederlagen">N</th><th scope="col" title="Unentschieden">U</th><th scope="col" title="Siegquote">Quote</th>
      <th scope="col" title="Erzielte Punkte">PF</th><th scope="col" title="Gegnerische Punkte">PA</th><th scope="col" title="Punktedifferenz">Diff</th><th scope="col">Heim</th><th scope="col">Auswärts</th><th scope="col">Div</th><th scope="col">Konf</th><th scope="col">Serie</th></tr></thead>
      <tbody>${entries.map((e, i) => {
        const d = diff(e); const seed = +dv(e, 'playoffSeed');
        const cls = [conf && seed >= 1 && seed <= 7 ? 'seed' : '', conf && i === seedCut && seedCut > 0 ? 'cut' : ''].join(' ');
        return html`<tr class="${cls}">${conf ? html`<td class="k">${dv(e, 'playoffSeed')}</td>` : ''}
          <td class="l"><a class="team-cell" href="team.html?id=${e.team.id}">${teamLogo(e.team.abbreviation, 'logo sm')}<span>${e.team.displayName}</span></a></td>
          <td class="k">${dv(e, 'wins')}</td><td>${dv(e, 'losses')}</td><td>${dv(e, 'ties')}</td><td>${dv(e, 'winPercent')}</td>
          <td>${dv(e, 'pointsFor')}</td><td>${dv(e, 'pointsAgainst')}</td><td class="${String(d).startsWith('+') ? 'pos' : String(d).startsWith('-') && d !== '-' ? 'neg' : ''}">${d}</td>
          <td>${dv(e, 'Home')}</td><td>${dv(e, 'Road')}</td><td>${dv(e, 'vs. Div.')}</td><td>${dv(e, 'vs. Conf.')}</td><td>${dv(e, 'streak')}</td></tr>`;
      })}</tbody></table></div>`;
  }

  async function divisions() {
    const d = await getJSON(`${API_V2}/standings?level=3`, 120000);
    return (d.children || []).map(conf => html`<section class="sec"><h2>${conf.abbreviation || conf.name}</h2><div class="tables">${(conf.children || []).map(div => table(div.name, div.standings?.entries || [], false))}</div></section>`);
  }
  async function conferences() {
    const d = await getJSON(`${API_V2}/standings`, 120000);
    const out = (d.children || []).map(conf => {
      const es = (conf.standings?.entries || []).slice().sort((a, b) => (+dv(a, 'playoffSeed') || 99) - (+dv(b, 'playoffSeed') || 99));
      return html`<section class="sec">${table(conf.name, es, true)}</section>`;
    });
    return [html`<p class="muted">Die ersten sieben Teams jeder Konferenz (gelb markiert) stehen in den Playoffs.</p>`, ...out];
  }

  async function show(mode) {
    try {
      render('#list', loading('Lade Tabelle'));
      render('#list', mode === 'conf' ? await conferences() : await divisions());
    } catch (e) { render('#list', errorBox(e, true)); }
  }
  render(content, html`<div class="toolbar"><div id="mode"></div></div><div id="list"></div>`);
  segmented($('#mode'), [['div', 'Divisionen'], ['conf', 'Konferenzen']], 'div', show, 'Ansicht wählen');
})();

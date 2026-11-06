/* Liga-Leader je Statistik-Kategorie */
(async function () {
  const { CORE, html, render, $, getJSON, secure, teams, teamLogo, headshot, errorBox, loading, empty, season } = NFL;
  const content = $('#content');

  const NAMES = {
    passingYards: 'Passing Yards', passingTouchdowns: 'Passing TDs', quarterbackRating: 'QB-Rating',
    rushingYards: 'Rushing Yards', rushingTouchdowns: 'Rushing TDs',
    receivingYards: 'Receiving Yards', receptions: 'Receptions', receivingTouchdowns: 'Receiving TDs',
    totalTackles: 'Tackles', sacks: 'Sacks', interceptions: 'Interceptions', passesDefended: 'Passes Defended',
    totalPoints: 'Punkte', totalTouchdowns: 'Touchdowns', puntYards: 'Punt Yards', kickoffYards: 'Kickoff Yards'
  };
  const idOf = (ref, kind) => new RegExp(`/${kind}/(\\d+)`).exec(ref || '')?.[1];

  let cats = [], tm = {}, year, type = '2';

  async function showCat(c) {
    const box = $('#board');
    render(box, loading('Lade Bestenliste'));
    try {
      const list = (c.leaders || []).slice(0, 10);
      const players = await Promise.all(list.map(l => l.athlete?.$ref ? getJSON(secure(l.athlete.$ref), 3600000).catch(() => null) : null));
      render(box, list.length ? html`<ol class="ranks">${list.map((l, i) => {
        const p = players[i];
        const aid = p?.id || idOf(l.athlete?.$ref, 'athletes');
        const team = tm[idOf(l.team?.$ref, 'teams')] || {};
        return html`<li><a class="rank" href="player.html?id=${aid}">
          <span class="n">${i + 1}</span>${headshot(p?.headshot?.href, 'hs lg')}
          <span class="who"><b>${p?.fullName || 'Unbekannter Spieler'}</b><span>${team.abbr ? teamLogo(team.abbr, 'logo xs') : ''}${team.name || ''}${p?.position?.abbreviation ? ', ' + p.position.abbreviation : ''}</span></span>
          <span class="v">${l.displayValue}</span></a></li>`;
      })}</ol>` : empty('Für diese Statistik liegen noch keine Werte vor.'));
    } catch (e) { render(box, errorBox(e)); }
  }

  try {
    const base = await season();
    year = base.season?.year;
    tm = await teams();
    const d = await getJSON(`${CORE}/seasons/${year}/types/${type}/leaders`, 300000);
    cats = d.categories || [];
    if (!cats.length) { render(content, empty('Für diese Saison liegen noch keine Leader-Daten vor.')); return; }
    const sub = $('.field-sub'); if (sub) sub.textContent = `Die Besten der Saison ${year} in jeder Statistik.`;
    render(content, html`<div class="pills" id="pills" role="group" aria-label="Statistik wählen">${cats.map((c, i) => html`<button type="button" data-i="${i}" aria-pressed="${i === 0}">${NAMES[c.name] || c.displayName}</button>`)}</div><h2 id="ct" style="margin-bottom:1rem"></h2><div id="board"></div>`);
    const pick = i => {
      [...$('#pills').children].forEach((b, j) => b.setAttribute('aria-pressed', j === i));
      $('#ct').textContent = NAMES[cats[i].name] || cats[i].displayName;
      showCat(cats[i]);
    };
    $('#pills').addEventListener('click', e => { const b = e.target.closest('button'); if (b) pick(+b.dataset.i); });
    pick(0);
  } catch (e) { render(content, errorBox(e, true)); }
})();

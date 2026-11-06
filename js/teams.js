/* Alle 32 Teams nach Konferenz und Division */
(async function () {
  const { API_V2, html, render, $, getJSON, teamLogo, teams, hex, errorBox } = NFL;
  const content = $('#content');
  try {
    const [st, tm] = await Promise.all([getJSON(`${API_V2}/standings?level=3`, 300000), teams()]);
    render(content, (st.children || []).map(conf => html`<section class="conf"><h2>${conf.name}</h2>
      ${(conf.children || []).map(div => html`<h3 class="div-h">${div.name}</h3><div class="grid g4">
        ${(div.standings?.entries || []).map(e => {
          const t = e.team; const info = tm[t.id] || {};
          const rec = (e.stats || []).find(s => s.name === 'overall')?.displayValue || '';
          return html`<a class="tcard" href="team.html?id=${t.id}" style="--c:${hex(info.color) || '#0E3B2C'}">
            ${teamLogo(t.abbreviation, 'logo lg')}<span class="nm"><span class="city">${t.location}</span><span class="name">${t.name}</span><span class="rec">${rec}</span></span></a>`;
        })}</div>`)}</section>`));
  } catch (e) { render(content, errorBox(e, true)); }
})();

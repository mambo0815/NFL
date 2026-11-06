/* NFL-News */
(async function () {
  const { API, html, render, $, getJSON, secure, errorBox, fmtShort } = NFL;
  const content = $('#content');

  const link = a => secure(a.links?.web?.href || '#');
  const pic = a => secure(a.images?.find(i => i.width >= 600)?.url || a.images?.[0]?.url || '');
  const date = a => (a.published ? fmtShort(a.published) : '');

  try {
    const d = await getJSON(`${API}/news?limit=30`, 120000);
    const items = (d.articles || []).filter(a => a.headline);
    if (!items.length) { render(content, NFL.empty('Zurzeit gibt es keine Meldungen.')); return; }
    const [first, ...rest] = items;
    render(content, html`
      <a class="news-hero" href="${link(first)}" target="_blank" rel="noopener noreferrer">
        ${pic(first) ? html`<img src="${pic(first)}" alt="" loading="eager">` : ''}
        <div class="tx"><h2>${first.headline}</h2><p>${first.description || ''}</p><span>${[first.byline, date(first)].filter(Boolean).join(', ')}</span></div>
      </a>
      <div class="grid g3">${rest.map(a => html`<a class="ncard" href="${link(a)}" target="_blank" rel="noopener noreferrer">
        ${pic(a) ? html`<img src="${pic(a)}" alt="" loading="lazy">` : ''}
        <div class="tx"><h3>${a.headline}</h3><p>${a.description || ''}</p><span class="by">${[a.byline, date(a)].filter(Boolean).join(', ')}</span></div></a>`)}</div>`);
  } catch (e) { render(content, errorBox(e, true)); }
})();

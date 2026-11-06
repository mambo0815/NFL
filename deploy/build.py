#!/usr/bin/env python3
"""Erzeugt den Ordner dist/ mit allem, was auf den Webserver gehört.

Aufruf:   python3 deploy/build.py https://deine-domain.de
Optionen: --allow-placeholders   Build trotz offener Platzhalter ([[...]]) in Impressum/Datenschutz
                                 (nur für Tests, niemals veröffentlichen)

Was passiert:
  - kopiert nur die Dateien, die die Website braucht (keine Notizen, keine Entwicklerdateien)
  - ergänzt Canonical-Link und Open-Graph-Angaben in den festen Seiten
  - erzeugt robots.txt und sitemap.xml mit deiner Domain
  - legt die .htaccess ab (Apache)
  - bricht ab, wenn im Impressum oder in der Datenschutzerklärung noch Platzhalter stehen
"""
import re
import shutil
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / 'dist'

PAGES = ['index.html', 'game.html', 'standings.html', 'teams.html', 'team.html', 'leaders.html',
         'news.html', 'player.html', 'impressum.html', 'datenschutz.html', '404.html']
# Seiten, die in die Sitemap und mit Canonical/Open Graph ausgezeichnet werden (feste Adressen)
STATIC = {'index.html': '', 'standings.html': 'standings.html', 'teams.html': 'teams.html',
          'leaders.html': 'leaders.html', 'news.html': 'news.html',
          'impressum.html': 'impressum.html', 'datenschutz.html': 'datenschutz.html'}
FILES = ['styles.css', 'site.webmanifest']
DIRS = ['js', 'fonts', 'favicon-download']
LEGAL = ['impressum.html', 'datenschutz.html']


def fail(msg):
    print('FEHLER: ' + msg, file=sys.stderr)
    sys.exit(1)


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    allow = '--allow-placeholders' in sys.argv
    if len(args) != 1 or not re.fullmatch(r'https://[a-z0-9.-]+\.[a-z]{2,}(:\d+)?/?', args[0], re.I):
        fail('Bitte die Domain mit https:// angeben, zum Beispiel: python3 deploy/build.py https://meine-domain.de')
    domain = args[0].rstrip('/')

    # 1) Platzhalter in den Rechtstexten
    open_ph = []
    for name in LEGAL:
        for m in re.finditer(r'\[\[(.*?)\]\]', (ROOT / name).read_text(encoding='utf-8')):
            open_ph.append(f'{name}: {m.group(1)}')
    if open_ph and not allow:
        print('Impressum/Datenschutz enthalten noch Platzhalter:', file=sys.stderr)
        for p in open_ph:
            print('  - ' + p, file=sys.stderr)
        fail('Bitte zuerst ausfüllen (Suche nach "[[" in impressum.html und datenschutz.html).')

    # 2) dist/ neu aufbauen
    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir()
    for f in FILES:
        shutil.copy(ROOT / f, DIST / f)
    for d in DIRS:
        shutil.copytree(ROOT / d, DIST / d)
    (DIST / 'favicon-download' / 'anleitung.txt').unlink(missing_ok=True)
    shutil.copy(ROOT / 'deploy' / 'htaccess', DIST / '.htaccess')

    # 3) Seiten kopieren und auszeichnen
    for name in PAGES:
        src = (ROOT / name).read_text(encoding='utf-8')
        if name in STATIC:
            url = f'{domain}/{STATIC[name]}'
            title = re.search(r'<title>(.*?)</title>', src).group(1)
            desc = re.search(r'<meta name="description" content="(.*?)">', src).group(1)
            extra = (f'<link rel="canonical" href="{url}">\n'
                     f'<meta property="og:type" content="website">\n'
                     f'<meta property="og:site_name" content="NFL Gameday">\n'
                     f'<meta property="og:locale" content="de_DE">\n'
                     f'<meta property="og:title" content="{title}">\n'
                     f'<meta property="og:description" content="{desc}">\n'
                     f'<meta property="og:url" content="{url}">\n'
                     f'<meta property="og:image" content="{domain}/favicon-download/ms-icon-310x310.png">\n')
            src = src.replace('<link rel="stylesheet"', extra + '<link rel="stylesheet"', 1)
        if name in ('404.html',):
            src = src.replace('</head>', '<meta name="robots" content="noindex">\n</head>', 1)
        (DIST / name).write_text(src, encoding='utf-8')

    # 4) robots.txt und sitemap.xml
    (DIST / 'robots.txt').write_text(f'User-agent: *\nAllow: /\n\nSitemap: {domain}/sitemap.xml\n', encoding='utf-8')
    today = date.today().isoformat()
    urls = ''.join(f'  <url><loc>{domain}/{p}</loc><lastmod>{today}</lastmod></url>\n' for p in STATIC.values())
    (DIST / 'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n'
                                      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + '</urlset>\n',
                                      encoding='utf-8')

    # 5) Kontrolle: nichts Unerwünschtes im Ergebnis
    problems = []
    for f in DIST.rglob('*'):
        if f.is_file() and f.suffix in ('.html', '.js', '.css'):
            t = f.read_text(encoding='utf-8', errors='ignore')
            if re.search(r'fonts\.(googleapis|gstatic)\.com', t):
                problems.append(f'{f.relative_to(DIST)}: externe Google-Schrift')
            if re.search(r'\son(click|error|load)\s*=', t):
                problems.append(f'{f.relative_to(DIST)}: Inline-Eventhandler (blockiert durch die CSP)')
            if re.search(r'<script(?![^>]*\bsrc=)[^>]*>', t):
                problems.append(f'{f.relative_to(DIST)}: Inline-Script (blockiert durch die CSP)')
    if problems:
        fail('\n  '.join(['Probleme im Build:'] + problems))

    n = sum(1 for f in DIST.rglob('*') if f.is_file())
    size = sum(f.stat().st_size for f in DIST.rglob('*') if f.is_file()) / 1024
    print(f'Fertig: {n} Dateien ({size:.0f} KB) in {DIST}')
    if open_ph:
        print('ACHTUNG: Es stehen noch Platzhalter in den Rechtstexten. Dieser Build ist nicht zur Veröffentlichung gedacht.')
    else:
        print('Nächster Schritt: Inhalt von dist/ (inkl. versteckter Datei .htaccess) auf den Webserver hochladen.')


if __name__ == '__main__':
    main()

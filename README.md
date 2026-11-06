# NFL Gameday

Moderne, deutschsprachige NFL-Website im Football-Look: Spielfeld-Streifen mit Yard-Linien, Scoreboard-Karten und ein Ticker mit den aktuellen Ergebnissen. Alles läuft im Browser, ohne Build-Schritt und ohne Backend (reines HTML, CSS und JavaScript).

## Seiten

| Seite | Inhalt |
|-------|--------|
| `index.html` | Spiele der Woche mit Wochenwahl, Live-Update alle 30 Sekunden, spielfreie Teams |
| `game.html?id=…` | Spieldetail: Linescore, Siegwahrscheinlichkeit, Scoring Plays, Team-Statistiken, Quoten, Top-Spieler, Verletzungen, Boxscore, Drives, Stadion und Schiedsrichter |
| `standings.html` | Tabellen nach Division und Konferenz, Playoff-Plätze markiert |
| `teams.html` | Alle 32 Teams nach Konferenz und Division |
| `team.html?id=…` | Team: Spielplan mit Ergebnissen und Bye-Woche, Kader mit Suche, Aufstellung (Depth Chart), Team- und Gegner-Statistiken |
| `leaders.html` | Liga-Leader in 16 Statistik-Kategorien |
| `player.html?id=…` | Spielerprofil: Saisonwerte, Game Log, Meldungen, Fantasy-Daten |
| `news.html` | Aktuelle Meldungen mit Bildern |
| `impressum.html`, `datenschutz.html` | Rechtstexte (Vorlage, Platzhalter vor dem Livegang ausfüllen) |
| `404.html` | Fehlerseite |

## Projektaufbau

```
*.html            Seiten (gemeinsame Vorlage, Inhalt kommt aus js/)
styles.css        Design (Farben, Typografie, Komponenten)
js/common.js      Gemeinsame Helfer: API-Zugriff, sicheres HTML-Templating, Kopfzeile, Ticker, Tabs
js/<seite>.js     Logik je Seite
fonts/            Lokal gehostete Schriften (Barlow, Big Shoulders Display, SIL OFL)
deploy/           Build-Skript, .htaccess (Apache) und nginx-Beispiel
site.webmanifest  Web-App-Manifest
favicon-download/ Favicons
```

Alle Daten aus der API werden vor dem Einfügen maskiert (`html`-Template-Funktion in `common.js`).

## Lokal starten

```bash
python3 -m http.server 8000
```

Dann <http://localhost:8000> öffnen. Direktes Öffnen per `file://` funktioniert nicht zuverlässig.

## Datenquellen

Inoffizielle, öffentliche ESPN-Endpunkte (alle mit `Access-Control-Allow-Origin: *`, daher direkt im Browser nutzbar):

- `site.api.espn.com/apis/site/v2/sports/football/nfl/` für Scoreboard, Spieldetails (`summary`), Teams, Kader, Aufstellung, Statistiken und News
- `site.api.espn.com/apis/v2/sports/football/nfl/standings` für Tabellen
- `sports.core.api.espn.com/v2/sports/football/leagues/nfl/` für Liga-Leader
- `site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/` für Spielerprofile

Diese Schnittstellen sind nicht dokumentiert und können sich jederzeit ändern. Inhalte wie News-Texte kommen auf Englisch, Größe und Gewicht werden in metrische Einheiten umgerechnet.

## Veröffentlichung

Schritt für Schritt steht alles in [DEPLOY.md](DEPLOY.md). Kurzfassung:

```bash
# 1. Platzhalter [[…]] in impressum.html und datenschutz.html ausfüllen
# 2. Bauen (erzeugt dist/ inkl. .htaccess, robots.txt, sitemap.xml)
python3 deploy/build.py https://deine-domain.de
# 3. Inhalt von dist/ auf den Webserver hochladen
```

Der Build bricht ab, solange Platzhalter offen sind. Es werden keine externen Schriften oder Tracker geladen. Teamlogos, Spielerfotos und News-Bilder kommen von ESPN-Servern, was in der Datenschutzerklärung beschrieben ist.

Auf GitHub Pages (`/NFL/`) läuft die Seite ebenfalls, nur die Fehlerseite `404.html` setzt eine Domain im Wurzelverzeichnis voraus.

## Hinweis

Inoffizielles Fan-Projekt ohne Verbindung zur NFL oder zu ESPN. Teamnamen und Logos gehören den jeweiligen Rechteinhabern. Die angezeigten Wettquoten dienen nur der Information.

## Lizenz

Siehe [LICENSE](LICENSE). Die Schriften stehen unter der SIL Open Font License.

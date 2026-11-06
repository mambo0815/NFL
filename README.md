# NFL

Kleine statische Website rund um die NFL, auf Basis der öffentlichen ESPN-API. Kein Build-Schritt, kein Backend – nur HTML, CSS und JavaScript.

## Seiten

| Seite | Inhalt |
|-------|--------|
| `index.html` | Aktueller Spielplan und Ergebnisse (Scoreboard) mit Teamfilter |
| `news.html` | Aktuelle NFL-News (`app.js`) |
| `nfl_teams_schedule.html` | Spielplan eines einzelnen Teams inkl. Bilanz |

Gemeinsames Styling: `styles.css`. Favicons: `favicon-download/`.

## Lokal starten

```bash
python3 -m http.server 8000
```

Dann <http://localhost:8000> öffnen. (Direktes Öffnen per `file://` kann je nach Browser die API-Abfragen blockieren.)

## Datenquelle

Inoffizielle, öffentliche ESPN-Endpunkte unter `https://site.api.espn.com/apis/site/v2/sports/football/nfl/` (`scoreboard`, `news`, `teams/{id}/schedule`). Diese API ist nicht dokumentiert und kann sich jederzeit ändern.

## Veröffentlichung

Das Projekt ist rein statisch und lässt sich mit GitHub Pages hosten: *Settings → Pages → Branch `main`, Ordner `/ (root)`*. Alle Pfade sind relativ, die Seite läuft daher auch unter `/NFL/`.

## Lizenz

Siehe [LICENSE](LICENSE).

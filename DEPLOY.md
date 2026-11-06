# Veröffentlichung auf der eigenen Domain

Die Website ist rein statisch: Es braucht keinen PHP-, Node- oder Datenbank-Server, nur einen Webspace mit HTTPS.

## 1. Rechtstexte ausfüllen (Pflicht)

In `impressum.html` und `datenschutz.html` stehen gelb markierte Platzhalter in der Form `[[…]]`. Sie müssen durch deine Angaben ersetzt werden:

- Name, Anschrift, E-Mail und ein zweites Kontaktmittel (Telefon oder Kontaktformular) für das Impressum
- Hosting-Anbieter, Speicherdauer der Server-Logs und Auftragsverarbeitungsvertrag in der Datenschutzerklärung (steht in den Unterlagen deines Hosters)
- Datum der Datenschutzerklärung

Die Texte sind eine Vorlage für genau diese Seite (keine Cookies, kein Tracking, Abruf von Daten und Bildern bei ESPN). Sie ersetzen keine Rechtsberatung. Wenn du später etwas hinzufügst, etwa Webanalyse oder ein Kontaktformular, muss die Datenschutzerklärung angepasst werden.

Prüfen, ob noch etwas offen ist:

```bash
grep -n "\[\[" impressum.html datenschutz.html
```

## 2. Bauen

```bash
python3 deploy/build.py https://deine-domain.de
```

Das Skript erzeugt den Ordner `dist/` mit allem, was auf den Server gehört:

- nur die Dateien, die die Website braucht (keine Notizen, keine Entwicklerdateien)
- Canonical-Link und Open-Graph-Angaben mit deiner Domain
- `robots.txt` und `sitemap.xml`
- `.htaccess` mit HTTPS-Weiterleitung, Sicherheits-Headern, Kompression und Caching

Das Skript bricht ab, solange Platzhalter in den Rechtstexten stehen. Es prüft außerdem, dass keine externen Schriften und keine Inline-Skripte enthalten sind, die die Sicherheitsrichtlinie (CSP) blockieren würde.

## 3. Hochladen

Den **gesamten Inhalt** von `dist/` in das Web-Verzeichnis der Domain hochladen (oft `htdocs`, `public_html` oder `www`). Wichtig:

- Die versteckte Datei `.htaccess` muss mit hochgeladen werden (im FTP-Programm „versteckte Dateien anzeigen“ aktivieren).
- Die Website muss im **Wurzelverzeichnis der Domain** (oder Subdomain) liegen, nicht in einem Unterordner. Die Fehlerseite `404.html` verweist mit `<base href="/">` darauf.
- Bei nginx stattdessen `deploy/nginx.conf.example` als Vorlage verwenden. Die `.htaccess` hat dort keine Wirkung.

## 4. Domain und HTTPS

- Bei der Domain einen A-Record (und ggf. AAAA) auf die IP des Webspace setzen, oder das vom Hoster vorgegebene Ziel. Für `www` zusätzlich einen CNAME auf die Hauptdomain.
- Im Hosting-Panel ein Zertifikat aktivieren (meist „Let’s Encrypt“, kostenlos). Erst danach funktioniert die HTTPS-Weiterleitung aus der `.htaccess`.
- Entscheide dich für eine Variante (mit oder ohne `www`) und leite die andere dorthin weiter. Die Domain beim Build entsprechend angeben.

## 5. Nach dem Hochladen prüfen

1. `https://deine-domain.de` öffnen: Ticker, Spiele und Logos erscheinen.
2. `http://deine-domain.de` leitet auf HTTPS um.
3. Eine nicht vorhandene Adresse (`/gibt-es-nicht`) zeigt die 404-Seite.
4. Im Browser die Entwicklerkonsole öffnen: keine Meldungen mit „Content Security Policy“. Falls doch, fehlt in der CSP (`.htaccess`) ein Host.
5. Impressum und Datenschutz sind von jeder Seite im Footer erreichbar.
6. Optional: `https://securityheaders.com` und die Google Search Console (Sitemap `…/sitemap.xml` einreichen).

## Aktualisieren

Dateien ändern, `python3 deploy/build.py https://deine-domain.de` erneut ausführen, Inhalt von `dist/` hochladen.

## Zu beachten

- **ESPN-Schnittstellen:** Die Daten kommen aus inoffiziellen, nicht dokumentierten ESPN-Endpunkten. Es gibt keine Zusage zur Verfügbarkeit oder zur Nutzung durch Dritte. Für ein privates Hobbyprojekt ist das üblich, ESPN kann die Endpunkte aber jederzeit ändern oder sperren. Bei kommerzieller Nutzung (Werbung, Affiliate-Links, Bezahlinhalte) solltest du die Nutzungsbedingungen von ESPN prüfen und eine lizenzierte Datenquelle in Betracht ziehen.
- **Marken:** Teamnamen und Logos sind geschützt. Die Seite bindet sie von ESPN ein und kopiert sie nicht, ist aber ausdrücklich ein inoffizielles Fan-Projekt. Mit Werbung oder Merchandising wäre das neu zu bewerten.
- **Wettquoten:** Sie stehen nur zur Information auf der Spielseite. Entfernen kannst du sie, indem du in `js/game.js` die Aufrufe von `oddsPanel()` löschst.
- **Datenschutz bei ESPN-Abrufen:** Besucher senden beim Laden der Daten ihre IP-Adresse an ESPN. Das ist in der Datenschutzerklärung beschrieben. Wer das vermeiden will, braucht einen eigenen Proxy-Server, der die Daten abruft und ausliefert. Das ist mit dieser rein statischen Lösung nicht möglich.

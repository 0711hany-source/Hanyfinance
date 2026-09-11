# Hany · Dein Geld. Deine Richtung.

Version 0.4.0 – eigenständige Webseite, optimiert fürs Handy und als PWA installierbar. Kein Android-/iOS-Build, kein kostenpflichtiger App-Store nötig. Keine Bibliotheken oder npm-Pakete für den Betrieb erforderlich.

## Auf GitHub aktualisieren

1. Den Inhalt dieses Ordners in dein Website-Repository übernehmen. `index.html` gehört direkt in den Hauptordner, ebenso die JavaScript-, CSS- und Bilddateien. Nicht nur das ZIP hochladen. Bestehende Dateien gleichen Namens ersetzen; deine vorhandene eigene Domain-Konfiguration gegebenenfalls behalten.
2. Einfacher Weg ohne Workflow: Im Repository **Settings → Pages → Deploy from a branch**, Branch **main**, Ordner **/(root)** auswählen und speichern. Den mitgelieferten Ordner `.github` bei diesem Weg nicht übernehmen.
3. Alternativ mit automatischen Prüfungen: Auch `.github/workflows/pages.yml`, `tests`, `scripts` und `package.json` übernehmen. In **Settings → Pages** als Quelle **GitHub Actions** wählen. Der Workflow veröffentlicht nach erfolgreichen Tests bei jedem Push auf `main`; ein anderer Hauptbranch muss in der Workflow-Datei eingetragen werden. Unter **Actions** lässt er sich auch manuell starten.
4. Den fertigen Website-Link unter **Settings → Pages** öffnen, beispielsweise `https://DEIN-NAME.github.io/DEIN-REPOSITORY/`. Relative Pfade unterstützen auch Repository-Unterordner.

GitHub Pages kann für öffentliche Repositories mit GitHub Free verwendet werden. Anleitung und Voraussetzungen: [GitHub Pages – Veröffentlichungsquelle](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) und [GitHub – eigene Pages-Workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

Wenn dein bestehendes Repository bereits Netlify aktualisiert, kannst du diesen Inhalt stattdessen in dessen bisherigen Veröffentlichungsordner übernehmen und die bisherige Website-Adresse beibehalten. Du musst nicht zu GitHub Pages wechseln. Dieses Paket wurde lokal vorbereitet; es ist noch nicht in dein Repository hochgeladen.

## Vorhandene Daten behalten

Die Daten liegen ausschließlich im Browser auf diesem Gerät, unter dem bisherigen Schlüssel `klar.v1`. Ältere Hany-/Klar-Sicherungen der Versionen 1 bis 3 werden beim Laden übernommen. Die aktuelle Datenversion ist 4. Es sind keine persönlichen Daten oder Testeinträge in diesem Repository enthalten.

**Vor einem Wechsel der Website-Adresse eine Sicherung erstellen.** Netlify, GitHub Pages und lokale Vorschauen haben getrennte Browserspeicher. Eine neue Adresse übernimmt deine Daten deshalb nicht automatisch. Auf der alten Adresse sichern, auf der neuen in **Einstellungen → Sicherung wiederherstellen** importieren. Das gilt auch bei einem Gerätewechsel. Die verschlüsselte Sicherung schützt die exportierte Datei; sie verschlüsselt nicht den lokalen Browserspeicher.

## iPhone und Offline-Nutzung

Website in Safari öffnen → Teilen → Zum Home-Bildschirm. Nach dem ersten vollständigen Laden ist die Webseite offline verfügbar. Updates werden oben angekündigt und erst nach bewusstem Antippen geladen; ein offenes Formular muss vorher gespeichert oder geschlossen werden. Die persönliche Web-App enthält keinen Login und synchronisiert nicht zwischen Geräten.

Erinnerungen für eine geschlossene Web-App funktionieren über **Einstellungen → Erinnerungen & Kalender**. Die ICS-Datei enthält offene Termine der nächsten 90 Tage. In einen eigenen Hany-Kalender importieren und dessen Mitteilungen aktivieren. Es ist eine Momentaufnahme, keine laufende Synchronisierung. Bereits importierte Termine ändern sich nicht bei Änderungen in Hany. Namen und Beträge sind standardmäßig im Export verborgen.

## Enthaltene Funktionen

- Beliebig viele Bankkonten, Kartenkonten und Bargeldquellen. Abhebungen, Einzahlungen und eigene Überweisungen werden als Umbuchung behandelt: Gesamtguthaben und Statistik bleiben unverändert.
- Bargeld-Einnahmen, Ausgaben und Suche nach Notiz, Kategorie, Datum, Betrag oder Konto.
- Schulden und Forderungen, getrennt nach Privatpersonen und Unternehmen, mit verbuchten Rückzahlungen. Bei privat geliehenem Geld kann der Betrag gleichzeitig einem gewählten Konto gutgeschrieben werden; die Schuld bleibt vollständig offen und der Eingang zählt nicht als Verdienst.
- „Unterwegs“ für Tage und Abende: Bar- und Kartenbudgets pro Konto vormerken, am Ende den Bargeldrest und die Kartenausgaben eintragen und pro Geldquelle eine Sammelbuchung erzeugen. Bereits einzeln erfasste Ausgaben können angerechnet werden. Fertige Abrechnungen lassen sich kontrolliert korrigieren.
- Wiederkehrende Zahlungen und Abos: tägliche bis jährliche Zyklen, bezahlt, übersprungen, überfällig und manuell erfasste Mahngebühren.
- Statistik mit Zeitraum-, Konto- und Kategorieansichten; Monatsbudgets mit echten gebuchten Ausgaben; 30-Tage-Geldvorschau mit Tagesdetails und niedrigstem Stand.
- Ziele für Tag, Woche, Monat, Jahr und Langzeit; Vorlagen für Zimmer, Sparziel, Auto und Haus. Eigene Fristen, Etappen, nächste Handlung und Wenn-dann-Plan.
- Sparfortschritt in Euro, Korrekturen, erreichte Ziele und Verlauf. Sparfortschritt wird separat dokumentiert und verändert keine Kontostände.
- Eigene Glaubenssätze mit Zielverknüpfung, täglichem Lesestatus, Reflexionen, Zuversicht und Wochenrückblicken. Praktische Zielarbeit ohne Versprechen, dass Gedanken allein Geld oder Ereignisse anziehen.
- Passwortgeschützte Sicherung: AES-256-GCM und PBKDF2-SHA-256 mit 600.000 Iterationen. Ohne Passwort keine Wiederherstellung.
- CSV-Import für EUR-Bankumsätze, mit Spaltenzuordnung, Vorschau, Fehler- und Duplikaterkennung. Keine direkte Bankverbindung. Importierte Umsätze erledigen Zahlungspläne nicht automatisch.

## Lokal entwickeln

Node.js ab Version 22 installieren. Im Ordner `npm start` ausführen und `http://127.0.0.1:4173/` öffnen. **Nicht `index.html` per Doppelklick öffnen**: JavaScript-Module benötigen einen Webserver. Für Tests `npm test` ausführen. `npm install` ist nicht erforderlich.

Nach Änderungen an Webdateien die Release-Kennung in `sw.js` erhöhen. Die `ASSETS`-Liste muss alle für die Offline-App benötigten Module und Styles enthalten. Bei einer sichtbaren Versionsänderung auch `pwa.js` und `package.json` anpassen. Für eine reine Web-Veröffentlichung `node scripts/prepare-pages.mjs` ausführen; `_site` enthält ausschließlich Website-Dateien.

Echte Bankanbindung, Cloud-Synchronisierung, Hintergrund-Web-Push und biometrische App-Sperre sind nicht enthalten. Ein Kartenbudget in „Unterwegs“ verändert kein echtes Kartenlimit. Eine Umbuchung oder Darlehensgutschrift dokumentiert nur eine tatsächlich erfolgte Geldbewegung. Sparraten und Geldvorschau beruhen auf deinen Einträgen. Offene Schulden werden nicht zusätzlich in die Vorschau gerechnet; erwartete Eingänge und nicht geplante Alltagsausgaben können vom tatsächlichen Verlauf abweichen.

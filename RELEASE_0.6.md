# Hany 0.6 – Releaseprüfung am 13.09.2026

## Geprüft

- 72 automatisierte Tests für bisherige und neue Funktionen.
- DOM-Integration der tatsächlichen App: Gedanken-Assistent, Satzverlauf, bewahrte Lesefassung, Handlungstage, Kontostandkorrektur, Darlehensgutschrift, Schulden-Erhöhung, Archiv, Monatsrate, Teilzahlung, geänderter Terminbetrag, Favorit, Aufteilung, globale Suche, bestätigte Regel, Rückgängig, Wochenabschluss und verbundene Sparziele.
- Vorhandene Buchung einem Zahlungsplan zugeordnet: keine zusätzliche Buchung und keine erneute Kontobewegung.
- Migration aus Datenversion 4: freiwillige Einschätzungen bleiben leer, frühere Handlungstage werden nicht erfunden und bezahlte Termine behalten ihren historischen Betrag.
- Service Worker enthält alle neuen Module und Styles; Release-Kennung 0.6.0-web.

## Praktische Grenzen

- Vollständige visuelle Prüfung auf iPhone und Android ist noch offen. Ein geplanter Headless-Browserstart wurde von der lokalen Ausführungsumgebung blockiert; die separate DOM-Prüfung bestand.
- Finanzzahlen sind Rechnungen aus den Einträgen. Offene Schulden ohne Zahlungsplan und nicht eingeplante Alltagsausgaben können vom freien Betrag abweichen.
- Prognosen berücksichtigen keine unbekannten Zinsen oder künftigen Zusatzschulden. Sparprognosen sind keine Garantie.
- Die Glaubenssatz-Übungen orientieren sich an Forschung; die Wirksamkeit von Hany selbst wurde nicht untersucht.
- Bankanbindung und Cloud-Synchronisierung sind nicht enthalten. Alle Daten bleiben lokal; Sicherungen weiterhin regelmäßig erstellen.

## Veröffentlichung

GitHub-Upload ist beauftragt. Authentifizierter Zugriff ist derzeit noch erforderlich: Die Computersteuerung meldet den Mac als gesperrt, und der Git-Checkout verfügt noch über keine GitHub-Schreibanmeldung.

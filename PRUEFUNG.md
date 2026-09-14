# Hany Web 0.6.0 – Prüfung am 13.09.2026

72 automatisierte Tests erfolgreich: Datenmigration, Konten, Darlehen, Schuldenarchiv, Teilzahlungen, Zahlungszyklen, Budgets, Sicherungen, Zielentwicklung und intelligente Funktionen.

Die tatsächlichen App-Module wurden zusätzlich mit Happy DOM zusammen geprüft: Glaubenssatz-Assistent, Satzverlauf, Lesetage und Handlungstage, Konten, Darlehensgutschriften und Erhöhungen, Archiv, Tilgungsrate, Teilzahlungen, Terminänderung, Favoriten, Buchungsaufteilung, globale Suche, Kategorienregeln, Rückgängig, Wochenabschluss und verbundene Sparziele. Bereits gebuchte Zahlungen lassen sich ohne doppelte Buchung einem Termin zuordnen.

Das Webpaket wurde mit scripts/prepare-pages.mjs erstellt. Es enthält die neuen Module und Offline-Dateien. Die App benötigt keine Produktionsabhängigkeiten.

Eine visuelle Browserprüfung der Version 0.6 steht noch aus: Die Computersteuerung meldet den Mac als gesperrt; der lokale Headless-Browser konnte in der Sandbox nicht starten. Die DOM-Prüfung ersetzt keine visuelle Kontrolle oder einen Test auf einem echten iPhone.

Details stehen in RELEASE_0.6.md. Der GitHub-Upload ist erst nach erfolgreicher Übertragung abgeschlossen.

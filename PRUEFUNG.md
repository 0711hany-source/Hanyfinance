# Hany Web 0.4.0 – Prüfung am 11.09.2026

59 automatisierte Tests erfolgreich: Cent-Berechnung, beliebig viele Konten, Darlehensgutschriften, paarweise Umbuchungen, gemischte Unterwegs-Abrechnungen, Schutz vor Doppelbuchungen, Schulden, Zahlungszyklen und Gebühren, Statistik, Zielvorlagen, Sparverlauf, Glaubenssätze, Sicherungen, CSV-Fehler/Duplikate, Budgets, Suche, Geldvorschau, Kalender und Offline-Paket.

Im Browser mit getrennten Testdaten geprüft:

- Sparziel aus der 3.000-Euro-Vorlage angelegt, 500 Euro Fortschritt dokumentiert, verknüpften Glaubenssatz gespeichert und als gelesen markiert.
- Tagesreflexion gespeichert und in der Entwicklung wiedergefunden.
- Zwei CSV-Buchungen mit Vorschau importiert: 1.200 Euro Eingang und 42,50 Euro Ausgabe, Kontostand 1.157,50 Euro.
- Lebensmittelbudget von 200 Euro angelegt; 157,50 Euro verbleibend korrekt angezeigt. Buchungssuche liefert nur die passende Ausgabe.
- Kalendereinstellungen gespeichert. Sicherung mit Passwort erstellt, entschlüsselt, die enthaltenen Konten/Buchungen/Ziele/Glaubenssätze/Tageseinträge/Budgets geprüft und vollständig wiederhergestellt.
- Updatehinweis von der vorherigen Vorschau auf die reine Webversion angenommen; gespeicherte Daten erhalten.
- Webserver abgeschaltet und Hany in einem weiteren Browser-Tab geöffnet: vollständige Oberfläche und gespeicherte Daten aus dem Offline-Paket verfügbar.
- Ziel-/Fokusansicht visuell kontrolliert. Neue Auslieferung startet ohne die Browser-Testeinträge.
- Privatdarlehen über 200 Euro dem Bargeldkonto gutgeschrieben: Kontostand stieg um 200 Euro, Schuld blieb mit 200 Euro offen und die Statistik zeigte weiterhin 0 Euro Einkommen.
- Zusätzliches Bankkonto „Revolut“ angelegt und 50 Euro vom Girokonto zum Bargeld umgebucht. Beide Konten änderten sich gegengleich; das Gesamtguthaben blieb gleich.
- Unterwegs-Abrechnung mit 200 Euro Bargeldbudget und 100 Euro Girokartenbudget durchgeführt. 100 Euro Bargeld und 50 Euro Karte wurden als zwei getrennte Sammelbuchungen erfasst. Die Statistik zeigte genau 150 Euro Ausgaben.
- Fertige Abrechnung zur Korrektur wieder geöffnet; die automatisch erzeugten Sammelbuchungen wurden kontrolliert zurückgenommen. Browser-Konsole nach dem Ablauf ohne Warnungen oder Fehler.

Der GitHub-Workflow und die Veröffentlichung auf dem echten Repository wurden noch nicht ausgeführt. Installation und Kalender-Mitteilungen auf einem echten iPhone wurden in dieser Sitzung nicht getestet. Es wurde keine neue Android-APK erstellt.

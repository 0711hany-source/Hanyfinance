# Hany 0.8 – Arbeit, Umsatz und Schichtzeit

Neuer neutraler Hauptbereich „Arbeit“. Einnahmequellen lassen sich frei benennen, umbenennen und archivieren. Die App enthält keine fest vorgegebenen Plattformnamen.

Für jede Quelle wird der kumulierte Monatsumsatz geführt. Beim neuen Eintrag zeigt Hany den bisherigen Monatsstand; der neue Gesamtstand minus bisherigem Stand ergibt den Umsatz des neuen Eintrags. Am Monatsanfang beginnt jede Quelle wieder bei null. Der letzte Tagesumsatz und der letzte Monatszähler bleiben sichtbar. Mehrere Einträge pro Tag und mehrere Quellen werden getrennt geführt.

Jede Quelle hat eine eigene Umsatzbeteiligung von 0 bis 100 Prozent und optional „19 % direkt abziehen“. Berechnung: Umsatz × Beteiligung, davon optional 19 Prozent abziehen, danach das Trinkgeld vollständig addieren. Beteiligung und Regel werden je Eintrag eingefroren, damit spätere Einstellungsänderungen historische Ergebnisse nicht verändern. Die Ansicht bezeichnet das Ergebnis bewusst als berechneten Verdienst; sie ist keine Lohnabrechnung oder Steuerberatung.

Ein berechneter Verdienst kann optional als normale Einnahme auf ein ausgewähltes Hany-Konto gebucht werden. Ohne Auswahl bleibt er ausschließlich im Arbeitsbereich. Beim Löschen des jeweils letzten Monatsstands einer Quelle wird eine damit verbundene Kontobuchung ebenfalls entfernt. Ältere Zählerstände sind geschützt, weil ihre Änderung alle späteren Differenzen verfälschen würde.

Die Zeiterfassung bietet: Arbeit beginnen, Pause beginnen, Pause beenden und Schicht beenden. Alle Zeitpunkte werden vollständig gespeichert. Mehrere Pausen werden von der Arbeitszeit abgezogen. Aktive Zeit, Monatsarbeitszeit und rechnerischer Verdienst pro Stunde werden angezeigt. Während einer offenen Schicht aktualisiert sich die Ansicht alle 30 Sekunden.

Bestehende Daten werden von Version 5 auf Datenversion 6 migriert. Alte Finanz-, Ziel- und Ritualdaten bleiben erhalten. Arbeitsdaten sind in verschlüsselten Sicherungen enthalten und werden beim Import streng validiert.

Prüfung: 80 automatisierte Tests erfolgreich. Zusätzliche Integration der tatsächlichen App mit Happy DOM: Quelle bearbeiten, kumulierten Stand differenzieren, Beteiligung, Abzug und Trinkgeld berechnen, optional verbuchen, Schicht starten, pausieren, fortsetzen und beenden sowie letzten Stand einschließlich Kontobuchung zurücknehmen. Der neue Bereich wurde außerdem im Browser visuell geöffnet.

Dieses Update wurde lokal erstellt; der GitHub-Upload der Version 0.8 ist noch nicht erfolgt.

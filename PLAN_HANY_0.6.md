# Hany 0.6 – Finanzen, Ziele und hilfreiche Gedanken

Status: Hany 0.6 umgesetzt; Upload vom Nutzer ausdrücklich beauftragt. Die Veröffentlichung wird separat geprüft.

Die technische Umsetzung nutzt Datenversion 5. Reservierungen berücksichtigen pro Kategorie den größten Betrag aus Plan, Restbudget und offenen Unterwegs-Budgets. Kontoauswahl erfolgt bewusst; bestätigte Regeln ordnen Kategorien zu. Historische Schuldenereignisse ohne bekannte Einzelaufnahmen werden als übernommener Gesamtbetrag geführt.

## Ziel des Updates

Hany soll nicht nur vergangene Buchungen zeigen, sondern jeden Tag drei Fragen verständlich beantworten:

1. Was kann ich heute sicher ausgeben?
2. Welche Zahlung oder Aufgabe braucht als Nächstes meine Aufmerksamkeit?
3. Bin ich bei Geld, Schulden und Zielen noch im Plan?

Alle Funktionen bleiben kostenlos, lokal im Browser und offline nutzbar. Es werden keine Bank-API, Cloud, kostenpflichtige Bibliothek oder externe KI benötigt.

## 1. Freier Betrag bis Monatsende

Der Startbildschirm erhält eine neue Karte „Frei verfügbar“:

- heutiges Gesamtguthaben
- reservierte Zahlungen und Abos bis Monatsende
- offene Budgets
- einstellbarer Mindestpuffer
- daraus berechneter frei verfügbarer Betrag
- Tagesrahmen: freier Betrag geteilt durch verbleibende Tage

Ein Antippen öffnet die vollständige Rechnung. Hany zeigt jede berücksichtigte Zahlung und erklärt Warnungen, statt nur eine Zahl anzuzeigen.

## 2. Smarte Zahlungszentrale

Die Planansicht wird in klare Gruppen gegliedert:

- überfällig
- heute
- nächste 7 Tage
- später
- erledigt

Neue Möglichkeiten:

- teilweise bezahlt
- Restbetrag automatisch offen lassen
- neues Fälligkeitsdatum beim Verschieben
- Zahlung einem bereits importierten Umsatz zuordnen
- Serienbetrag nur einmalig oder dauerhaft ändern
- Verlauf pro Abo oder Rechnung

## 3. Lokale automatische Regeln

Hany lernt nur aus bestätigten Eingaben auf dem Gerät:

- Beschreibung einem Händler und einer Kategorie zuordnen
- Standardkonto vorschlagen
- ähnliche CSV-Umsätze erkennen
- mögliche Abos aus wiederkehrenden Buchungen vorschlagen
- mögliche Duplikate vor dem Speichern melden

Jeder Vorschlag bleibt sichtbar und kann bestätigt, geändert oder dauerhaft ignoriert werden. Es werden keine Daten versendet.

## 4. Bessere Buchungen

- bestehende Einnahmen und Ausgaben bearbeiten
- Buchung duplizieren
- eine Buchung auf mehrere Kategorien aufteilen
- eigene Kategorien erstellen, umbenennen und archivieren
- Favoriten für häufige Einträge
- Taschenrechner im Betragsfeld, etwa `12,50 + 8,90`
- Rückgängig nach Bearbeiten, Löschen und Aufteilen

Verknüpfte Schulden-, Zahlungsplan-, Umbuchungs- und Unterwegs-Buchungen werden kontrolliert über ihren Ursprungsbereich geändert.

## 5. Schuldenplan

Aufbauend auf Version 0.5:

- vollständiger Verlauf von Aufnahmen, Erhöhungen und Rückzahlungen
- optionale monatliche Zielrate
- voraussichtliches schuldenfreies Datum
- Sonderzahlung simulieren
- Fortschritt nach Privatpersonen und Unternehmen
- vollständig bezahlte Einträge im Archiv durchsuchen
- archivierte Schuld als Nachweis exportieren

Die Berechnung macht keine Zinsannahmen. Zinsen und Gebühren werden nur einbezogen, wenn der Nutzer sie einträgt.

## 6. Ziele mit Finanzbezug

- ein Sparziel mit einem oder mehreren Konten verbinden
- Fortschritt wahlweise aus Kontoständen oder manuell berechnen
- benötigten Wochen- und Monatsbetrag anzeigen
- realistische Ampel: im Plan, knapp, hinter Plan
- große Ziele in Zwischenziele zerlegen
- nächster Schritt direkt auf dem Startbildschirm

Zielvermögen und normales Guthaben werden klar getrennt, damit Geld nicht doppelt gezählt wird.

## 7. Wochenabschluss

Ein geführter Abschluss in fünf Schritten:

1. Kontostände prüfen
2. ungeklärte Unterwegs-Ausgaben abschließen
3. offene Zahlungen ansehen
4. Budgets und Schuldenfortschritt prüfen
5. eine Geldentscheidung und einen Zielschritt für die nächste Woche festlegen

Danach zeigt Hany einen kurzen Wochenbericht mit Vergleich zur Vorwoche.

## 8. Bedienung und Gestaltung

- anpassbare Reihenfolge der Startkarten
- globale Suche über Buchungen, Schulden, Zahlungen und Ziele
- Schnellaktionen per langem Drücken
- konsistente Wischgesten mit Rückgängig-Möglichkeit
- größere Berührungsflächen und bessere Tastatursteuerung
- leere Ansichten mit einem klaren nächsten Schritt
- verständliche Erklärungen für jede berechnete Kennzahl

## Technische Umsetzung

## Wissenschaftlich fundierter Fokus-Bereich

Plan ergänzt am 13.09.2026. Die folgenden App-Abläufe sind Produktvorschläge auf Grundlage von Forschung; die Wirksamkeit von Hany selbst ist noch nicht untersucht. Ergebnisse aus Studien lassen sich nicht als Erfolgsgarantie für einzelne Nutzer verstehen.

### Grundlage und Grenzen

- Gabriele Oettingen und Peter Gollwitzer: erwünschtes Ergebnis mit einem realen Hindernis verbinden und einen konkreten Wenn-dann-Plan formulieren. Eine Meta-Analyse fand kleine bis mittlere Effekte auf Zielerreichung und Hinweise auf Publikationsbias. [Wang et al., 2021](https://pubmed.ncbi.nlm.nih.gov/34054628/)
- Joanne Wood und Kollegen: sehr positive Selbstbehauptungen können bei manchen Menschen mit niedrigem Selbstwert ungünstig wirken. Deshalb soll Hany glaubwürdige, anpassbare Sätze anbieten. Die Studie ist keine Aussage, dass jede positive Formulierung schadet. [Wood et al., 2009](https://pubmed.ncbi.nlm.nih.gov/19493324/)
- Claude Steeles Selbstaffirmationstheorie, zusammengefasst von Geoffrey Cohen und David Sherman: Selbstaffirmation bedeutet in dieser Forschung häufig, über persönliche Werte nachzudenken. Sie ist nicht gleichbedeutend mit dem Wiederholen von Reichtumsbehauptungen. [Cohen & Sherman, 2014](https://pubmed.ncbi.nlm.nih.gov/24405362/)

Joe Dispenza und Napoleon Hill werden nicht als wissenschaftlicher Wirksamkeitsnachweis für diese Funktionen verwendet. Persönliche Inspiration kann als eigener Satz gespeichert werden; Hany verspricht keine Anziehung von Geld, Gegenständen oder Ereignissen durch Gedanken.

### 1. Gedanken-Assistent ohne externe KI

Ein geführter Assistent ersetzt das leere Textfeld:

1. Situation: Wann taucht der Gedanke auf?
2. Gedanke: Was sage ich mir dann?
3. Gefühl und Stärke: Wie wirkt das gerade auf mich?
4. Beobachtungen: Welche konkreten Erfahrungen passen dazu, welche nicht?
5. Hilfreicher Satz: Was wäre freundlich und zugleich glaubwürdig?
6. Kleine Handlung: Was probiere ich als Nächstes aus?

Kostenlose lokale Vorlagen helfen beim Formulieren. Vorschläge sind als Vorlagen gekennzeichnet; Hany behauptet nicht, freie Texte psychologisch zu verstehen oder Diagnosen zu stellen.

Beispiel:

- Bisher: „Ich kann nicht mit Geld umgehen.“
- Beobachtung: „Ich habe diese Woche drei Ausgaben erfasst.“
- Neuer Satz: „Ich lerne, mein Geld zu überblicken, indem ich jeden Abend kurz nachsehe.“
- Handlung: „Nach dem Abendessen öffne ich Hany für zwei Minuten.“

### 2. Glaubwürdigkeitsprüfung

Vor dem Speichern bewertet der Nutzer selbst: „Wie glaubwürdig fühlt sich der Satz an?“ von 0 bis 10. Wenn er wenig glaubwürdig ist, bietet die App weichere Formulierungen wie „Ich übe …“, „Ich kann einen kleinen Schritt …“ oder „Heute probiere ich …“ an. Es gibt keine wissenschaftlich behauptete Grenzzahl und keinen Zwang, einen Satz zu akzeptieren.

Jeder Satz erhält Thema, optionales Ziel, persönliche Beispiele, nächste Handlung und einen Prüfzeitpunkt. Alte Fassungen bleiben im Verlauf sichtbar.

### 3. Wunsch → Ergebnis → Hindernis → Plan

Ein kurzer Ablauf führt vom Wunsch zum Verhalten:

- Wunsch: persönlich wichtig und für den gewählten Zeitraum machbar
- Ergebnis: Warum ist das wertvoll?
- Hindernis: Was steht im Weg? Innere Hindernisse und äußere Grenzen unterscheiden.
- Plan: „Wenn [konkrete Situation], dann [kleine Handlung].“

Beispiele:

- Zimmer bis morgen: „Wenn ich heute um 19 Uhr nach Hause komme, räume ich zuerst zehn Minuten den Boden frei.“
- 3.000 Euro bis nächsten Monat: vorhandenes Geld, nötigen Zusatzbetrag und verfügbare Einnahmen prüfen; bei einer Finanzierungslücke Ziel oder Frist bewusst anpassen.
- Auto oder Haus: Zielbetrag selbst festlegen, Etappen planen und kurzfristig beeinflussbare Handlungen wählen.

### 4. Täglicher Fokus in zwei Minuten

Morgens: einen passenden Satz lesen, ein persönliches Beispiel ansehen und eine konkrete Handlung auswählen.

Abends: Handlung erledigt, teilweise erledigt oder nicht erledigt markieren; kurz festhalten, was geholfen oder gestört hat. Lesen und tatsächliche Handlung werden separat gezählt.

Die App bietet höchstens drei aktive Fokussätze pro Tag als Gestaltungsentscheidung gegen Überlastung. Häufigkeit und Uhrzeit bleiben einstellbar; tägliches Wiederholen wird nicht als notwendige wissenschaftliche Dosis dargestellt.

### 5. Entwicklung verständlich verfolgen

- Lesetage und Handlungstage getrennt darstellen
- freiwillige Glaubwürdigkeits- und Zuversichtswerte über die Zeit
- konkrete gesammelte Erfahrungen
- Ziel- und Etappenfortschritt
- wöchentliche Frage: behalten, umformulieren, pausieren oder archivieren?
- einzelne ausgelassene Tage ohne Strafe oder Verlust aller bisherigen Fortschritte

Die App beschreibt beobachtete Verläufe, etwa „An vier Tagen umgesetzt“. Sie behauptet aus diesen Daten keine Ursache und berechnet keinen vermeintlichen psychologischen Heilungswert.

### 6. Mit Rückschlägen arbeiten

Nach einem ausgelassenen Schritt fragt Hany: „War der Schritt zu groß, der Zeitpunkt unpassend oder etwas anderes wichtiger?“ Daraus entstehen Optionen: Handlung verkleinern, Auslöser ändern, Unterstützung einplanen oder Ziel pausieren. Keine Schuldzuweisung und keine Aufforderung, unangenehme Gefühle zu unterdrücken.

### Umsetzung und Abnahme für den Fokus-Bereich

- Bestehende Glaubenssätze, Lesetage und Reflexionen vollständig übernehmen.
- Neue Felder optional halten; keine erfundenen Anfangswerte oder Erfahrungen.
- Verlauf von Satzänderungen und freiwilligen Einschätzungen speichern.
- Alle Übungen lokal und offline verfügbar machen.
- Wissenschaftliche Quellen in einer kurzen Erklärung erreichbar machen.
- Vorlagen mit Geld, Ordnung, Lernen und langfristigen Anschaffungen prüfen.
- Eingaben, Archivierung, Wiederherstellung und Datumsauswertung testen.
- Keine Gesundheitsdiagnose, kein Erfolg durch bloßes Lesen und keine garantierte Zielerreichung suggerieren.

## Reihenfolge des großen Updates

1. Datenmigration und gemeinsame Ereignisverläufe.
2. Gedanken-Assistent, konkrete Zielpläne und täglicher Fokus.
3. Finanzvorschau und Zahlungs-Teilbeträge.
4. Wochenabschluss mit Geld- und Zielentwicklung.
5. Buchungsregeln, Suche und Bedienungsverbesserungen.

Der Fokus-Bereich ist als erster sichtbarer Baustein umgesetzt. Bestehende Grundfunktionen werden erweitert, statt eine zusätzliche getrennte App zu erzeugen.

### Phase A – Datenmodell und Migration

- Datenversion 5
- Zahlungs-Teilbeträge und Zuordnungen
- Kategorieregeln und Favoriten
- Schuldenereignisse für Erhöhungen und Rückzahlungen
- Mindestpuffer und Startkarten-Einstellungen
- verlustfreie Migration aller Version-4-Daten

### Phase B – Finanzkern

- frei verfügbarer Betrag
- Teilzahlungen
- Buchungen bearbeiten und aufteilen
- Kategorien und Regeln
- erweiterter Schuldenplan

### Phase C – Übersicht und Ziele

- neuer Startbildschirm
- Wochenabschluss
- finanzierte Ziele
- globale Suche

### Phase D – Prüfung und Offline-Release

- Migration mit echten Version-4-Beispieldaten prüfen
- Cent-genaue Berechnungen testen
- Schutz vor Doppelbuchungen testen
- mobile Bedienung und Wischgesten prüfen
- Service-Worker-Version erhöhen
- vollständiges Offline-Paket erzeugen

## Fertig, wenn

- vorhandene Daten ohne Verlust übernommen werden
- der freie Betrag nachvollziehbar aufgeschlüsselt ist
- Teilzahlungen und zugeordnete Bankumsätze nicht doppelt zählen
- zusätzliche Schuldenbeträge im Verlauf sichtbar bleiben
- archivierte Schulden die aktiven Summen nicht verändern
- alle neuen Regeln lokal bleiben
- die App auf kleinen Handydisplays vollständig bedienbar ist
- automatisierte Tests und die manuelle Hauptprüfung ohne Fehler bestehen

## Empfohlener erster Baustein

Zuerst werden Datenversion 5, der freie Betrag und Teilzahlungen gebaut. Diese Grundlage wird anschließend von Startbildschirm, Zahlungszentrale, Schuldenplan und Wochenabschluss gemeinsam genutzt.

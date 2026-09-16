# Hany 0.9 – Bargeldabrechnung und Steuerabzüge

Arbeitsumsätze enthalten nun zusätzlich „Davon Bargeld vereinnahmt“. Der Betrag ist Teil des neu berechneten Tagesumsatzes und darf diesen deshalb nicht überschreiten. Trinkgeld wird weiterhin separat erfasst.

Die Chef-Abrechnung verwendet eine sichtbare, feste Formel: vereinnahmtes Bargeld minus eigener Umsatzanteil nach dem optionalen 19-Prozent-Abzug. Ein positiver Saldo bedeutet „Du schuldest“, ein negativer Saldo „Du bekommst“. Trinkgeld bleibt vollständig außerhalb dieser Abrechnung. Jeder Arbeitseintrag zeigt seinen eigenen Saldo; die Monatsansicht zeigt den gemeinsamen offenen Saldo aller Quellen.

Tatsächliche Ausgleiche lassen sich als „An Chef bezahlt“ oder „Vom Chef erhalten“ mit Datum und Notiz erfassen. Sie reduzieren den offenen Monatssaldo und können wieder gelöscht werden. Ein Ausgleich erzeugt bewusst keine automatische Kontobuchung.

Der neue Steuerbereich erfasst Einkommensteuer, Umsatzsteuer, Sozialabgaben oder einen sonstigen Abzug mit Datum, Name, Betrag und Notiz. Die Monatsansicht zeigt Summe der Steuerabzüge und berechneten Verdienst nach diesen Abzügen. Optional kann ein Steuerabzug gleichzeitig als Ausgabe auf einem Hany-Konto gebucht werden; beim Löschen des Abzugs wird diese verknüpfte Ausgabe entfernt.

Der 19-Prozent-Schalter in einer Einnahmequelle bleibt Teil der individuellen Arbeitsabrechnung. Manuelle Steuerabzüge sind davon getrennt. Hany erstellt keine Steuererklärung, bestimmt keine gesetzliche Steuerlast und ersetzt keine Lohnabrechnung oder Steuerberatung.

Bestehende Datenversion 6 wird auf Datenversion 7 erweitert. Frühere Arbeitseinträge erhalten 0 Euro Bargeld; es werden keine vergangenen Bargeldeinnahmen oder Steuerabzüge erfunden. Frühere Finanz-, Ziel-, Ritual- und Arbeitsdaten bleiben erhalten.

Prüfung: 82 automatisierte Tests erfolgreich. Die App-Integration wurde zusätzlich mit Happy DOM geprüft: Bargeld, Vorschau der Chef-Abrechnung, Ausgleich, Steuerabzug, optionale Kontobuchung und Rücknahme. Version 0.9 ist lokal erstellt und noch nicht auf GitHub hochgeladen.

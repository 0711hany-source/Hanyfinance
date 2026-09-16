import {validDate,daysBetween} from './planning.js';

// Original, practical prompts; no promises of wealth or guaranteed outcomes.
const groups={
 'Kleine Schritte':[
 'Ich kann heute einen kleinen Schritt machen.', 'Ich muss nicht alles schaffen, um etwas voranzubringen.', 'Fünf Minuten bewusster Einsatz können ein Anfang sein.', 'Ich darf klein anfangen und später weitergehen.', 'Mein nächster Schritt darf einfacher sein als mein großes Ziel.', 'Ich kann beginnen, bevor ich mich vollkommen bereit fühle.', 'Ein erledigter kleiner Schritt ist ein echter Fortschritt.', 'Ich kann meine Aufmerksamkeit auf eine Sache richten.', 'Ich darf ein großes Vorhaben in kleine Aufgaben teilen.', 'Heute kann ich etwas tun, das meinem zukünftigen Ich hilft.'
 ],
 'Geld bewusst gestalten':[
 'Ich kann lernen, mein Geld klarer zu überblicken.', 'Ich darf meine Zahlen anschauen, ohne mich dafür abzuwerten.', 'Eine ehrliche Buchung gibt mir mehr Klarheit.', 'Ich kann vor einem Kauf kurz innehalten.', 'Mein Budget kann mir helfen, bewusst zu entscheiden.', 'Ich darf Wünsche und verfügbare Mittel miteinander abgleichen.', 'Ich kann auch einen kleinen Betrag bewusst zurücklegen.', 'Ich kann eine offene Zahlung rechtzeitig prüfen.', 'Ich darf finanzielle Fehler verstehen und daraus lernen.', 'Ich kann mir für Geldentscheidungen Zeit nehmen.'
 ],
 'Selbstfreundlichkeit':[
 'Ich darf freundlich mit mir sprechen, auch an schwierigen Tagen.', 'Ein Fehler beschreibt nicht meinen ganzen Wert.', 'Ich darf Unterstützung brauchen.', 'Ich kann mich ernst nehmen, ohne perfekt zu sein.', 'Ich darf meine Grenzen wahrnehmen.', 'Ich muss mich nicht mit jedem anderen Menschen vergleichen.', 'Ich kann meine Anstrengung anerkennen.', 'Ein schwerer Tag löscht meine bisherigen Schritte nicht.', 'Ich darf einen unpassenden Satz für mich ändern.', 'Ich kann mir selbst mit Geduld begegnen.'
 ],
 'Dankbarkeit':[
 'Ich kann heute etwas Kleines bemerken, das mir guttut.', 'Ich darf dankbar sein und trotzdem Schwierigkeiten benennen.', 'Ich kann einen hilfreichen Moment bewusst festhalten.', 'Ich kann jemandem für eine konkrete Hilfe danken.', 'Ich darf alltägliche Unterstützung wahrnehmen.', 'Ich kann kurz bei einem guten Moment verweilen.', 'Ich kann wertschätzen, was heute schon möglich ist.', 'Ich darf eine kleine Freude ernst nehmen.', 'Ich kann erkennen, was ich nicht allein schaffen musste.', 'Ich darf Gutes bemerken, ohne mir alles schönzureden.'
 ],
 'Lernen':[
 'Ich kann etwas noch nicht können und trotzdem lernen.', 'Eine Frage kann mir einen neuen Blick eröffnen.', 'Ich darf meine Meinung nach neuen Erfahrungen ändern.', 'Ich kann Rückmeldungen prüfen, statt sie blind zu übernehmen.', 'Ich kann aus einem Versuch etwas mitnehmen.', 'Ich darf üben, statt sofort gut sein zu müssen.', 'Ich kann einen schwierigen Schritt genauer verstehen.', 'Ich darf Wissen in meinem eigenen Tempo aufbauen.', 'Ich kann neugierig bleiben, wenn etwas nicht klappt.', 'Ich kann heute eine Sache besser verstehen als gestern.'
 ],
 'Ordnung und Alltag':[
 'Ich kann eine kleine Fläche ordnen und dort beginnen.', 'Ich darf meinem Alltag eine einfache Struktur geben.', 'Eine kurze Vorbereitung kann meinen nächsten Schritt erleichtern.', 'Ich kann Dinge so platzieren, dass mein Vorhaben leichter wird.', 'Ich darf eine Aufgabe beenden, bevor ich die nächste anfange.', 'Ich kann heute etwas wegräumen, das mich unnötig beschäftigt.', 'Ich darf meine Umgebung an meine Bedürfnisse anpassen.', 'Ich kann eine Routine vereinfachen, wenn sie zu schwer ist.', 'Ich kann eine offene Aufgabe konkret benennen.', 'Ich darf eine Pause einplanen, statt sie erst verdienen zu müssen.'
 ],
 'Mut und Entscheidungen':[
 'Ich kann eine Entscheidung mit den Informationen treffen, die ich habe.', 'Ich darf Unsicherheit spüren und einen überschaubaren Schritt wählen.', 'Ich kann um Klarheit bitten.', 'Ich darf Nein sagen, wenn etwas nicht zu meinen Möglichkeiten passt.', 'Ich kann prüfen, was heute in meinem Einfluss liegt.', 'Ich darf eine Entscheidung korrigieren.', 'Ich kann einen schwierigen Anruf vorbereiten.', 'Ich darf meine Bedürfnisse verständlich aussprechen.', 'Ich kann vor einer Zusage meine Zeit und Energie prüfen.', 'Ich darf etwas ausprobieren, ohne einen Erfolg garantieren zu können.'
 ],
 'Beziehungen':[
 'Ich kann heute aufmerksam zuhören.', 'Ich darf um Hilfe bitten und konkret sagen, wobei.', 'Ich kann Wertschätzung ehrlich ausdrücken.', 'Ich darf meine Grenzen respektvoll erklären.', 'Ich kann nachfragen, statt sofort etwas anzunehmen.', 'Ich darf eine Beziehung durch eine kleine Geste pflegen.', 'Ich kann Verantwortung für meine Worte übernehmen.', 'Ich darf unterschiedliche Sichtweisen aushalten.', 'Ich kann eine Entschuldigung mit einer konkreten Änderung verbinden.', 'Ich darf Menschen Nähe anbieten, ohne ihre Antwort zu kontrollieren.'
 ],
 'Geduld und Ausdauer':[
 'Ich kann nach einer Pause wieder anfangen.', 'Ich darf meinen Plan an die Realität anpassen.', 'Fortschritt muss nicht jeden Tag gleich aussehen.', 'Ich kann an einem wichtigen Vorhaben dranbleiben und Pausen machen.', 'Ich darf eine Frist prüfen, wenn sich meine Situation verändert.', 'Ich kann heute den Prozess unterstützen, auch wenn das Ergebnis später kommt.', 'Ich darf einen Umweg als Information nutzen.', 'Ich kann wiederholen, was mir schon einmal geholfen hat.', 'Ich darf meine Energie auf wenige wichtige Dinge verteilen.', 'Ich kann Erreichtes würdigen und trotzdem weiterlernen.'
 ],
 'Werte und Zukunft':[
 'Ich kann heute eine Handlung wählen, die zu meinen Werten passt.', 'Ich darf Erfolg für mich selbst konkret definieren.', 'Ich kann meine Wünsche in überprüfbare Schritte übersetzen.', 'Ich darf hinterfragen, ob ein Ziel wirklich meines ist.', 'Ich kann für meine Zukunft planen und meinen heutigen Tag wahrnehmen.', 'Ich darf ein Ziel verändern, wenn es nicht mehr zu mir passt.', 'Ich kann benennen, warum mir ein Vorhaben wichtig ist.', 'Ich darf Lebensqualität neben Zahlen und Besitz beachten.', 'Ich kann heute eine bewusste Entscheidung für meine Prioritäten treffen.', 'Ich darf stolz auf einen ehrlichen, kleinen Fortschritt sein.'
 ]};
export const affirmations=Array.from({length:10},(_,i)=>Object.entries(groups).map(([topic,texts],g)=>({id:`impuls-${i*10+g+1}`,topic,text:texts[i]}))).flat();
export function dailyAffirmation(date){if(!validDate(date))throw Error('Ungültiger Tag.');const i=((daysBetween('2026-01-01',date)%100)+100)%100;return affirmations[i];}
export function validateRitual(r){
 if(r===undefined)return true;
 if(!r||typeof r!=='object'||Array.isArray(r))return false;
 const fields=['affirmationId','affirmationText','gratitudeMorning','intention','obstacle','trigger','wins','gratitudeEvening','tomorrowAction','tomorrowTrigger'];
 return fields.every(k=>r[k]===undefined||typeof r[k]==='string'&&r[k].length<=2000)&&['affirmationRead','affirmationAdopted','morningDone','eveningDone'].every(k=>r[k]===undefined||typeof r[k]==='boolean')&&(!r.affirmationAdopted||r.affirmationRead===true);
}

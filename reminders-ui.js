import {reminderItems,reminderSettings,calendarICS} from './reminders.js';
export function remindersUI(c) {
  const {esc,eur,input,select,form,openSheet,toast}=c;
  const date = value => new Date(value+'T12:00:00').toLocaleDateString('de-DE',{day:'numeric',month:'short',year:'numeric'});
  let visible=30;
  const sourceAttrs = item => item.kind==='goal'?`data-goal-detail="${esc(item.source)}"`:item.kind==='payment'?`data-plan-detail="${esc(item.source)}" data-due="${item.due}"`:`data-debt-detail="${esc(item.source)}"`;
  const status = item => item.late?`Seit ${item.late} ${item.late===1?'Tag':'Tagen'} fällig`:date(item.due);
  function summary() {
    const settings=reminderSettings(c.state()),items=reminderItems(c.state(),{days:settings.leadDays}),late=items.filter(x=>x.late).length;
    if(!items.length)return '';
    return `<button class="card wide reminder-top" data-action="reminders"><span><strong>${items.length} ${items.length===1?'Termin braucht':'Termine brauchen'} deinen Blick</strong><span class="hint" style="display:block;text-align:left">${late?late+' überfällig · ':''}Ziele, Zahlungen und Schulden ansehen</span></span><span aria-hidden="true">›</span></button>`;
  }
  function show() {
    const items=reminderItems(c.state()),settings=reminderSettings(c.state()),late=items.filter(x=>x.late).length;
    openSheet(`<h1 class="sheet-title">Deine Erinnerungen</h1><p class="subtitle">Offenes im Blick · Rückstände und nächste 30 Tage</p><div class="grid2"><div class="card"><span class="label">Offen</span><div class="reminder-count">${items.length}</div></div><div class="card"><span class="label">Überfällig</span><div class="reminder-count ${late?'negative':''}">${late}</div></div></div><div class="reminder-actions"><button class="primary" data-action="reminder-calendar">Im Kalender erinnern lassen</button><button class="quick secondary" data-action="reminder-settings">Erinnerungen einstellen</button></div><div class="card reminder-list">${items.slice(0,visible).map(item=>`<div class="reminder-item"><span class="reminder-copy"><strong>${esc(item.title)}</strong><small>${{goal:'Ziel',payment:'Zahlungsplan',debt:'Schuld / Forderung'}[item.kind]}${item.amount!==null?' · '+eur(item.amount):''}</small><span class="reminder-date ${item.late?'overdue':''}">${status(item)}</span></span><button class="tiny" ${sourceAttrs(item)}>Öffnen</button></div>`).join('')||'<p class="empty">Keine offenen Termine in den nächsten 30 Tagen. Plane ein Ziel oder eine Zahlung mit Datum.</p>'}</div>${items.length>visible?'<button class="quick secondary wide" data-action="reminder-more">Weitere anzeigen</button>':''}<p class="hint">Abgehakte Ziele, bezahlte und übersprungene Termine verschwinden automatisch aus dieser Übersicht.</p><p class="hint">Für Erinnerungen bei geschlossener Web-App nutze den Kalenderexport. Hany versendet keine Hintergrund-Push-Nachrichten.</p>`);
  }
  function settingsForm() {
    const s=reminderSettings(c.state());
    const checkbox=(name,label)=>`<label class="checkbox-row"><input type="checkbox" name="${name}" ${s[name]?'checked':''}>${label}</label>`;
    openSheet(form('Erinnerungen einstellen',`<div class="reminder-settings">${select('leadDays','Vorher erinnern',[['0','Am Fälligkeitstag'],['1','1 Tag vorher und am Fälligkeitstag'],['7','7 Tage vorher und am Fälligkeitstag']],String(s.leadDays))}${input('time','Uhrzeit auf deinem Gerät',s.time,'time','required')}${checkbox('includeGoals','Ziele mit Frist')}${checkbox('includePayments','Zahlungen & Abos')}${checkbox('includeDebts','Schulden & Forderungen')}${checkbox('privateTitles','Namen und Beträge im Kalender verbergen')}</div><p class="hint">Der Kalender enthält zwei Hinweise, wenn du einen Vorlauf wählst. Bereits vergangene Hinweise werden von Kalender-Apps unter Umständen nicht mehr angezeigt.</p>`),f=>{
      const next={...s,leadDays:Number(f.get('leadDays')),time:f.get('time')};
      for(const name of ['includeGoals','includePayments','includeDebts','privateTitles'])next[name]=f.has(name);
      if(c.commit(()=>c.state().reminderSettings=next,'Erinnerungen gespeichert')){document.querySelector('#modal').close();}
    });
  }
  function exportData() {return calendarICS(reminderItems(c.state(),{days:90,includeOverdue:false}),{settings:reminderSettings(c.state())});}
  function calendar() {
    const items=reminderItems(c.state(),{days:90,includeOverdue:false});
    openSheet(`<h1 class="sheet-title">Hany im Kalender</h1><p class="subtitle">${items.length} offene Termine · nächste 90 Tage</p><div class="card"><h3>Auch bei geschlossener App</h3><p class="hint">Die Kalender-App übernimmt deine Erinnerungen. Importiere die Datei in einen eigenen Kalender „Hany“. Aktiviere dessen Mitteilungen.</p><p class="hint">Auf dem iPhone Datei teilen oder speichern und in der Kalender-App öffnen. Falls „Kalender“ nicht angeboten wird: die ICS-Datei am Mac in Kalender oder im Web bei Google Kalender importieren; den Kalender anschließend mit dem iPhone synchronisieren.</p></div><div class="reminder-actions"><button class="primary" data-action="reminder-download" ${items.length?'':'disabled'}>Kalenderdatei herunterladen</button><button class="quick secondary" data-action="reminder-share" ${items.length?'':'disabled'}>Kalenderdatei teilen</button><button class="quick secondary" data-action="reminder-copy" ${items.length?'':'disabled'}>Kalendertext kopieren</button></div><p class="hint">Ein Export ist eine Momentaufnahme. Änderungen oder erledigte Termine in Hany ändern einen importierten Kalender nicht. Für einen vollständigen Ersatz zuerst den alten Hany-Kalender entfernen, dann neu importieren; wiederholte Importe können sonst Duplikate erzeugen.</p><p class="hint">Vergangene Fälligkeiten bleiben in Hany sichtbar und werden nicht exportiert. ${reminderSettings(c.state()).privateTitles?'Namen und Beträge sind im Export verborgen.':'Namen und Beträge werden mit deinem gewählten Kalenderanbieter geteilt.'}</p>`);
  }
  function download() {
    const blob=new Blob([exportData()],{type:'text/calendar;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Hany-Erinnerungen.ics';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);toast('Kalenderdatei bereit. In deiner Kalender-App importieren.');
  }
  async function share() {
    const file=new File([exportData()],'Hany-Erinnerungen.ics',{type:'text/calendar'});
    if(!navigator.canShare?.({files:[file]})){download();return;}
    try {await navigator.share({files:[file],title:'Hany Erinnerungen'});}catch(error){if(error.name!=='AbortError')toast('Teilen nicht möglich. Nutze den Download.');}
  }
  async function copy() {
    const text=exportData();try{await navigator.clipboard.writeText(text);toast('Kalendertext kopiert. Als .ics-Datei importieren.');}
    catch{openSheet(`<h1 class="sheet-title">Kalendertext</h1><p class="hint">Text vollständig auswählen, kopieren und als .ics-Datei speichern.</p><textarea class="calendar-preview" readonly>${esc(text)}</textarea>`);document.querySelector('.calendar-preview').select();}
  }
  return {summary,show,actions:{reminders:show,'reminder-settings':settingsForm,'reminder-calendar':calendar,'reminder-download':download,'reminder-share':share,'reminder-copy':copy,'reminder-more':()=>{visible+=30;show();}}};
}

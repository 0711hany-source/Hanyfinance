import {DATA_LIMITS,encryptBackup,readBackup,parseCSV,guessCSVMapping,previewCSV} from './data-tools.js';

export function dataToolsUI(c){
  const {esc,eur,input,select,form,openSheet}=c;
  const $=s=>document.querySelector(s),close=()=>$('#modal')?.close();
  const localDay=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
  let backupOutput='',backupFilename='',parsedCSV=null,csvMapping=null,csvPreview=null,csvOptions=null,csvVisible=50;
  const fileField=(kind,accept)=>`<label for="dt-${kind}-file">Datei auswählen</label><input id="dt-${kind}-file" data-dt-file="${kind}" type="file" accept="${accept}"><p class="hint">Die Datei wird nur auf diesem Gerät gelesen.</p>`;
  const error=(message,owner)=>{if(owner&&!owner.isConnected)return;const el=$('#form-error');if(el)el.textContent=message;else c.toast(message);};
  function asyncSubmit(task){
    const owner=$('#sheet form'),button=owner?.querySelector('button[type="submit"]');
    if(button?.disabled)return;if(button)button.disabled=true;
    Promise.resolve().then(()=>task(owner)).catch(e=>error(e.message||'Aktion fehlgeschlagen.',owner)).finally(()=>{if(button?.isConnected)button.disabled=false;});
  }
  function showOutput(text,filename,encrypted=true){
    backupOutput=text;backupFilename=filename;
    openSheet(`<h1 class="sheet-title">${encrypted?'Sicherung verschlüsselt':'Sicherungstext'}</h1><p class="subtitle">${encrypted?'Nur mit deinem Passwort wiederherstellbar. Bewahre es getrennt von der Datei auf.':'Dieser Text enthält deine persönlichen Daten.'}</p><button type="button" class="primary" data-dt="download">Datei herunterladen</button><button type="button" class="quick secondary dt-wide" data-dt="copy">Text kopieren / auswählen</button><details class="dt-copy"><summary>Sicherungstext anzeigen</summary><label for="dt-output">Vollständige Sicherung</label><textarea id="dt-output" readonly spellcheck="false">${esc(text)}</textarea><p class="hint">Falls kein Download erscheint, kopiere den vollständigen Text und speichere ihn in einer eigenen Datei.</p></details>`);
  }
  function backup(){
    openSheet(form('Verschlüsselte Sicherung',`<p class="subtitle">Konten, Buchungen, Zahlungspläne, Ziele und Reflexionen in einer geschützten Datei sichern.</p>`+input('dt-password','Neues Sicherungspasswort','','password','required minlength="10" maxlength="1024" autocomplete="new-password"')+input('dt-password-repeat','Passwort wiederholen','','password','required minlength="10" maxlength="1024" autocomplete="new-password"')+'<p class="hint">Mindestens 10 Zeichen. Ein langes, eigenes Passwort ist besser. Hany kann es nicht zurücksetzen. Der App-Speicher selbst wird dadurch nicht verschlüsselt.</p>','Sicherung erstellen'),f=>{
      const password=f.get('dt-password');if(password!==f.get('dt-password-repeat'))throw Error('Die Passwörter stimmen nicht überein.');
      const snapshot=structuredClone(c.state());
      asyncSubmit(async owner=>{const result=await encryptBackup(snapshot,password);if(owner?.isConnected)showOutput(result,`Hany-Sicherung-${localDay()}.hany.json`);});
    });
  }
  function restore(){
    openSheet(form('Sicherung wiederherstellen',fileField('restore','.json,.hany,application/json,text/plain')+'<label for="dt-restore-text">Oder Sicherungstext einfügen</label><textarea id="dt-restore-text" name="dt-restore-text" required spellcheck="false" class="dt-source"></textarea>'+input('dt-password','Sicherungspasswort · bei verschlüsselten Dateien','','password','maxlength="1024" autocomplete="current-password"')+'<p class="hint">Auch ältere unverschlüsselte Hany- und Klar-Sicherungen können geprüft werden. Erst nach deiner Bestätigung werden aktuelle Daten ersetzt.</p>','Sicherung prüfen'),f=>asyncSubmit(async owner=>{
      const imported=await readBackup(String(f.get('dt-restore-text')),String(f.get('dt-password')||''),c.migrate);
      if(!owner?.isConnected)return;
      openSheet(`<h1 class="sheet-title">Sicherung geprüft</h1><div class="card"><h3>Das wird wiederhergestellt</h3><p>${imported.accounts.length} Konten · ${imported.transactions.length} Buchungen<br>${imported.debts.length} Schulden · ${imported.schedules.length} Zahlungspläne<br>${imported.goals.length} Ziele · ${imported.beliefs.length} Glaubenssätze<br>${imported.practice.length} Tageseinträge · ${imported.reviews.length} Wochenrückblicke<br>${imported.budgets.length} Budgets · ${Object.keys(imported.journals).length} frühere Check-ins</p></div><p class="hint">Deine aktuellen Daten werden vollständig ersetzt. Sichere sie vorher, wenn du sie behalten möchtest.</p><button type="button" id="dt-confirm-restore" class="primary">Aktuelle Daten ersetzen</button>`);
      $('#dt-confirm-restore').onclick=()=>{
        const ok=c.restoreState?c.restoreState(imported):c.commit(()=>{const s=c.state();for(const key of Object.keys(s))delete s[key];Object.assign(s,structuredClone(imported));},'Sicherung wiederhergestellt');
        if(ok)close();
      };
    }));
  }
  function csvImport(){
    parsedCSV=null;csvPreview=null;
    openSheet(form('Kontoauszug importieren',`<p class="subtitle">Exportiere einen CSV-Kontoauszug bei deiner Bank. Hany zeigt dir vor dem Import jede Buchung zur Auswahl.</p>`+fileField('csv','.csv,.tsv,text/csv,text/tab-separated-values,text/plain')+'<label for="dt-csv-text">Oder CSV-Text einfügen</label><textarea id="dt-csv-text" name="dt-csv-text" required spellcheck="false" class="dt-source" placeholder="Datum;Betrag;Verwendungszweck"></textarea>'+select('dt-delimiter','Spaltentrenner',[['auto','Automatisch erkennen'],[';','Semikolon ;'],[',','Komma ,'],['\t','Tabulator']],'auto')+'<p class="hint">Benötigt Kopfzeile, Datum, Betrag mit Vorzeichen und Beschreibung. Nur EUR-Buchungen; bis zu 10.000 Zeilen / 2 MB. Der Import verbindet Hany nicht mit deiner Bank.</p>','Spalten zuordnen'),f=>{
      parsedCSV=parseCSV(String(f.get('dt-csv-text')),f.get('dt-delimiter'));csvMapping=guessCSVMapping(parsedCSV.headers);csvOptions={account:c.state().accounts.find(a=>a.id!=='cash')?.id||c.state().accounts[0].id,locale:'auto',keepBalance:false};mappingForm();
    });
  }
  function mappingForm(){
    const options=[['-1','Bitte wählen'],...parsedCSV.headers.map((h,i)=>[String(i),`${i+1}. ${h||'Ohne Titel'}`])],optional=[['-1','Nicht enthalten'],...options.slice(1)];
    openSheet(form('Spalten zuordnen',`<p class="subtitle">${parsedCSV.rows.length} Zeilen erkannt. Prüfe besonders Vorzeichen und Zahlenformat.</p>`+select('dt-account','Zielkonto',c.state().accounts.map(a=>[a.id,a.name]),csvOptions.account)+select('dt-date','Buchungsdatum',options,csvMapping.date)+select('dt-amount','Betrag · Minus bedeutet Ausgabe',options,csvMapping.amount)+select('dt-note','Beschreibung / Verwendungszweck',options,csvMapping.note)+select('dt-category','Kategorie · optional',optional,csvMapping.category)+select('dt-reference','Bank-Transaktions-ID · optional',optional,csvMapping.reference)+select('dt-locale','Zahlenformat',[['auto','Automatisch · mehrdeutige Zahlen ablehnen'],['de','Deutsch · 1.234,56'],['international','International · 1,234.56']],csvOptions.locale)+`<label class="dt-check"><input type="checkbox" name="dt-keep-balance" ${csvOptions.keepBalance?'checked':''}><span>Aktuellen Kontostand beibehalten<small>Für alte Buchungen, die bereits im eingetragenen Kontostand enthalten sind. Hany gleicht den Anfangsbestand entsprechend an.</small></span></label><details class="dt-sample"><summary>Erste Zeile der Datei ansehen</summary>${parsedCSV.headers.map((h,i)=>`<p><strong>${esc(h||`Spalte ${i+1}`)}</strong><br>${esc(parsedCSV.rows[0][i]||'—')}</p>`).join('')}</details>`,'Importvorschau öffnen'),f=>{
      csvMapping=Object.fromEntries(['date','amount','note','category','reference'].map(k=>[k,f.get('dt-'+k)]));csvOptions={account:f.get('dt-account'),locale:f.get('dt-locale'),keepBalance:f.has('dt-keep-balance')};
      csvPreview=previewCSV(parsedCSV,csvMapping,{...csvOptions,existing:c.state().transactions,today:localDay()});csvVisible=50;showCSVPreview();
    });
  }
  const selectedRows=()=>csvPreview.rows.filter(r=>r.valid&&r.selected);
  function previewSummary(){
    const selected=selectedRows(),net=selected.reduce((n,r)=>n+(r.transaction.type==='income'?1:-1)*r.transaction.amount,0),duplicates=selected.filter(r=>r.duplicate).length;
    return `${selected.length} ausgewählt · Saldo ${eur(net)}${duplicates?` · ${duplicates} mögliche Duplikate ausgewählt`:''}`;
  }
  function showCSVPreview(){
    const account=c.state().accounts.find(a=>a.id===csvOptions.account);
    openSheet(`<h1 class="sheet-title">Import prüfen</h1><p class="subtitle">${esc(account?.name)} · ${csvPreview.valid} gültig · ${csvPreview.invalid} fehlerhaft · ${csvPreview.duplicates} mögliche Duplikate</p><p class="hint">Gültige neue Zeilen sind ausgewählt. Mögliche Duplikate bleiben zunächst abgewählt; gleich aussehende, echte Einzelbuchungen kannst du bewusst hinzufügen. Fehlerhafte Zeilen werden nicht importiert.</p><div class="dt-selection-tools"><button type="button" class="tiny" data-dt="select-new">Neue auswählen</button><button type="button" class="tiny" data-dt="select-none">Keine auswählen</button><button type="button" class="tiny" data-dt="mapping">Spalten ändern</button></div><div class="dt-preview">${csvPreview.rows.slice(0,csvVisible).map(row=>row.valid?`<label class="dt-csv-row"><input type="checkbox" data-dt-row="${row.index}" ${row.selected?'checked':''}><span><strong>${esc(row.transaction.note||row.transaction.category)}</strong><small>Zeile ${row.line} · ${row.transaction.date} · ${esc(row.transaction.category)}</small>${row.duplicate?`<small class="dt-warning">${esc(row.duplicate)}</small>`:''}</span><b class="${row.transaction.type==='income'?'positive':''}">${row.transaction.type==='income'?'+':'−'}${eur(row.transaction.amount)}</b></label>`:`<div class="dt-csv-row dt-invalid"><span><strong>Zeile ${row.line} nicht importierbar</strong><small>${esc(row.error)}</small></span></div>`).join('')}</div>${csvPreview.rows.length>csvVisible?`<button type="button" class="quick secondary dt-wide" data-dt="more-rows">Weitere 50 Zeilen ansehen (${Math.min(csvVisible,csvPreview.rows.length)} / ${csvPreview.rows.length})</button>`:''}<p id="dt-preview-summary" class="dt-import-summary" aria-live="polite">${esc(previewSummary())}</p><p class="hint">${csvOptions.keepBalance?'Der aktuelle Kontostand bleibt erhalten; der Anfangsbestand wird angepasst.':'Ausgewählte Buchungen verändern deinen Kontostand.'} Geplante Zahlungen werden durch den CSV-Import nicht automatisch als bezahlt markiert.</p><button type="button" class="primary" data-dt="import-selected" ${selectedRows().length?'':'disabled'}>Ausgewählte Buchungen importieren</button>`);
  }
  function importSelected(){
    const chosen=selectedRows();if(!chosen.length){c.toast('Bitte mindestens eine gültige Zeile auswählen.');return;}
    const ok=c.commit(()=>{
      const s=c.state(),account=s.accounts.find(a=>a.id===csvOptions.account);if(!account)throw Error('Das ausgewählte Konto ist nicht mehr vorhanden.');
      let net=0;for(const row of chosen){c.addTransaction(s,{...row.transaction});net+=(row.transaction.type==='income'?1:-1)*row.transaction.amount;}
      if(csvOptions.keepBalance)account.opening-=net;
    },`${chosen.length} Buchungen importiert`);
    if(ok){parsedCSV=null;csvPreview=null;close();}
  }
  function click(event){
    const d=event?.target?.closest?.('button')?.dataset||event||{},action=d.dt;if(!action)return false;
    if(action==='download'){
      try{const url=URL.createObjectURL(new Blob([backupOutput],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=backupFilename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);c.toast('Falls kein Download erscheint, nutze „Text kopieren“.');}catch{c.toast('Bitte die Sicherung über „Text kopieren“ speichern.');}
    }
    if(action==='copy'){
      const area=$('#dt-output');area.closest('details').open=true;area.focus();area.select();area.setSelectionRange(0,area.value.length);
      if(navigator.clipboard?.writeText)navigator.clipboard.writeText(backupOutput).then(()=>c.toast('Sicherung kopiert.')).catch(()=>c.toast('Text ausgewählt. Über das Auswahlmenü kopieren.'));else c.toast('Text ausgewählt. Über das Auswahlmenü kopieren.');
    }
    if(action==='mapping')mappingForm();
    if(action==='more-rows'){csvVisible+=50;showCSVPreview();}
    if(action==='select-new'||action==='select-none'){csvPreview.rows.forEach(r=>r.selected=action==='select-new'&&r.valid&&!r.duplicate);showCSVPreview();}
    if(action==='import-selected')importSelected();
    return true;
  }
  function change(event){
    const el=event.target;
    if(el.dataset.dtRow!==undefined&&csvPreview){const row=csvPreview.rows[Number(el.dataset.dtRow)];if(row?.valid)row.selected=el.checked;$('#dt-preview-summary').textContent=previewSummary();$('[data-dt="import-selected"]').disabled=!selectedRows().length;return true;}
    if(!el.dataset.dtFile)return false;
    const kind=el.dataset.dtFile,file=el.files?.[0],owner=$('#sheet form');if(!file)return true;
    const target=kind==='csv'?'#dt-csv-text':'#dt-restore-text',max=kind==='csv'?DATA_LIMITS.csvBytes:DATA_LIMITS.envelopeBytes;
    $(target).value='';
    if(file.size>max){error(`Datei zu groß. Maximal ${Math.round(max/1024/1024)} MB erlaubt.`,owner);el.value='';return true;}
    const button=owner?.querySelector('button[type="submit"]');if(button)button.disabled=true;
    file.arrayBuffer().then(buffer=>{
      if(!owner.isConnected||el.files?.[0]!==file)return;
      let text;try{text=new TextDecoder('utf-8',{fatal:true}).decode(buffer)}catch{if(kind==='csv')text=new TextDecoder('windows-1252').decode(buffer);else throw Error('Die Sicherung muss UTF-8-Text enthalten.');}
      $(target).value=text;error('',owner);
    }).catch(e=>error(e.message||'Datei konnte nicht gelesen werden.',owner)).finally(()=>{if(button?.isConnected&&el.files?.[0]===file)button.disabled=false;});
    return true;
  }
  return {backup,restore,csvImport,click,change,actions:{backup,restore,'csv-import':csvImport}};
}

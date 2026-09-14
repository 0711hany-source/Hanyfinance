import {validDate} from './planning.js';
const uid=()=>crypto.randomUUID();
const money=n=>Number.isSafeInteger(n)&&n>=0&&n<=1e12;
const id=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(v);
const text=v=>typeof v==='string'&&v.length<10000;
const account=(s,key)=>s.accounts.find(a=>a.id===key);
export const isOperating=t=>!t.transfer&&!t.loanFunding;
export const accountBalance=(s,key)=>account(s,key).opening+s.transactions.filter(t=>t.account===key).reduce((n,t)=>n+(t.type==='income'?t.amount:-t.amount),0);

export function createDebt(s,debt,funding){
  if(!debt.name.trim()||!money(debt.amount)||!debt.amount)throw Error('Name und positiven Betrag eingeben.');
  if(funding&&(!account(s,funding.account)||!validDate(funding.date)||debt.direction!=='owe'||debt.kind!=='person'))throw Error('Geldeingang ist nur für geliehenes Geld von Privatpersonen möglich.');
  const d={...debt,id:uid(),archived:false,monthlyRate:0,events:[{id:uid(),amount:debt.amount,date:funding?.date||'',note:'Erster Betrag'}]};s.debts.push(d);
  if(funding)s.transactions.unshift({id:uid(),type:'income',amount:d.amount,account:funding.account,date:funding.date,category:'Geliehenes Geld',note:'Geliehen von '+d.name,loanFunding:d.id});
  return d;
}
export function increaseDebt(s,key,amount,funding){
  const d=s.debts.find(d=>d.id===key);
  if(!d||d.archived||!money(amount)||!amount)throw Error('Schuld und positiven Zusatzbetrag prüfen.');
  if(funding&&(!account(s,funding.account)||!validDate(funding.date)||d.direction!=='owe'||d.kind!=='person'))throw Error('Eine Gutschrift ist nur bei geliehenem Geld von Privatpersonen möglich.');
  d.amount+=amount;
  d.events??=[{id:uid(),amount:d.amount-amount,date:'',note:'Übernommener Gesamtbetrag'}];
  d.events.push({id:uid(),amount,date:funding?.date||new Date().toLocaleDateString('sv-SE'),note:'Betrag erhöht'});
  if(funding)s.transactions.unshift({id:uid(),type:'income',amount,account:funding.account,date:funding.date,category:'Geliehenes Geld',note:'Zusätzlich geliehen von '+d.name,loanFunding:d.id});
  return d;
}
export function setDebtArchived(s,key,archived){
  const d=s.debts.find(d=>d.id===key);
  if(!d)throw Error('Schuld nicht gefunden.');
  if(archived&&s.transactions.filter(t=>t.debt===d.id).reduce((n,t)=>n+t.amount,0)!==d.amount)throw Error('Nur vollständig bezahlte Einträge können archiviert werden.');
  d.archived=archived;
}
export function transferMoney(s,{from,to,amount,date,note=''}){
  if(!account(s,from)||!account(s,to)||from===to||!money(amount)||!amount||!validDate(date))throw Error('Zwei unterschiedliche Konten, Betrag und Datum prüfen.');
  if(account(s,from).kind==='cash'&&accountBalance(s,from)<amount)throw Error('Auf dem Bargeldkonto ist nicht genug Geld erfasst.');
  const transfer=uid();
  s.transactions.unshift(...[['expense',from],['income',to]].map(([type,key])=>({id:uid(),transfer,type,account:key,amount,date,category:'Umbuchung',note:note||`${account(s,from).name} → ${account(s,to).name}`})));
  return transfer;
}
export function startOuting(s,{name,date,category,lines}){
  if(!name.trim()||!validDate(date)||!category.trim()||!lines.length||new Set(lines.map(l=>l.account)).size!==lines.length)throw Error('Name, Datum und mindestens ein Konto wählen.');
  for(const l of lines){if(!account(s,l.account)||!money(l.budget)||!l.budget)throw Error('Für jedes gewählte Konto ein positives Budget eintragen.');if(s.outings.some(o=>o.status==='open'&&o.lines.some(x=>x.account===l.account)))throw Error('Für dieses Konto ist bereits ein Abend offen. Rechne ihn zuerst ab.');if(account(s,l.account).kind==='cash'&&l.budget>accountBalance(s,l.account))throw Error('Mehr Bargeld mitgenommen als erfasst. Bitte zuerst den Bargeldstand anpassen oder eine Abhebung umbuchen.');}
  const outing={id:uid(),name:name.trim(),date,category:category.trim(),status:'open',settled:'',lines:lines.map(l=>({account:l.account,mode:account(s,l.account).kind,budget:l.budget}))};s.outings.unshift(outing);return outing;
}
export function availableExpenses(s,o,key,through){return s.transactions.filter(t=>t.type==='expense'&&isOperating(t)&&!t.outing&&t.account===key&&t.date>=o.date&&t.date<=through&&!s.outings.some(x=>x.status==='closed'&&x.lines.some(l=>l.recordedIds.includes(t.id))));}
export function previewSettlement(s,o,{date,lines}){
  if(!o||o.status!=='open'||!validDate(date)||date<o.date||lines.length!==o.lines.length||new Set(lines.map(l=>l.account)).size!==lines.length)throw Error('Abrechnungsdatum und Konten prüfen.');
  return o.lines.map(l=>{const input=lines.find(x=>x.account===l.account);if(!input)throw Error('Für jedes Konto den Abschluss eintragen.');const added=l.mode==='cash'?input.added:0,returned=l.mode==='cash'?input.returned:0;if(!money(added)||!money(returned))throw Error('Nachgelegtes Geld und Restbetrag prüfen.');const spent=l.mode==='cash'?l.budget+added-returned:input.spent;if(!money(spent))throw Error('Der Bargeldrest darf nicht höher sein als mitgenommen plus nachgelegt.');const ids=input.recordedIds||[],eligible=availableExpenses(s,o,l.account,date);if(new Set(ids).size!==ids.length||ids.some(key=>!eligible.some(t=>t.id===key)))throw Error('Zugeordnete Buchungen prüfen.');const recorded=eligible.filter(t=>ids.includes(t.id)).reduce((n,t)=>n+t.amount,0);if(recorded>spent)throw Error('Die zugeordneten Buchungen sind höher als die Gesamtausgaben dieses Kontos.');return {...l,added,returned,spent,recordedIds:ids,recorded,unbooked:spent-recorded};});
}
export function settleOuting(s,key,input){const o=s.outings.find(o=>o.id===key),rows=previewSettlement(s,o,input);const tx=rows.filter(l=>l.unbooked>0).map(l=>({id:uid(),outing:key,type:'expense',account:l.account,amount:l.unbooked,date:input.date,category:o.category,note:o.name+' · Sammelbuchung'}));o.status='closed';o.settled=input.date;o.lines=rows.map(({recorded,unbooked,...l})=>l);s.transactions.unshift(...tx);return rows;}
export function reopenOuting(s,key){const o=s.outings.find(o=>o.id===key);if(!o||o.status!=='closed')throw Error('Abrechnung nicht gefunden.');if(s.outings.some(x=>x.id!==key&&x.status==='open'&&x.lines.some(l=>o.lines.some(r=>r.account===l.account))))throw Error('Für eines dieser Konten ist ein weiterer Abend offen. Diesen zuerst abschließen.');s.transactions=s.transactions.filter(t=>t.outing!==key);o.status='open';o.settled='';o.lines=o.lines.map(({account,mode,budget})=>({account,mode,budget}));}
export function removeTransaction(s,key){const t=s.transactions.find(t=>t.id===key);if(!t)return;const outing=s.outings.find(o=>o.id===t.outing||o.status==='closed'&&o.lines.some(l=>l.recordedIds.includes(key)));if(outing)throw Error('Diese Buchung gehört zu einem abgerechneten Abend. Öffne zuerst dessen Abrechnung zur Korrektur.');if(t.debt){const d=s.debts.find(d=>d.id===t.debt);if(d)d.archived=false;}s.transactions=s.transactions.filter(x=>t.transfer?x.transfer!==t.transfer:x.id!==key);}
export function validateMoneyFlows(s,fail){
  if(!s.accounts.every(a=>['cash','bank'].includes(a.kind))||!Array.isArray(s.outings)||!s.outings.every(o=>o&&id(o.id))||new Set(s.outings.map(o=>o.id)).size!==s.outings.length)return fail();
  const funded=new Map(),transfers=new Map(),linked=new Set(),active=new Set();
  for(const t of s.transactions){if([t.loanFunding,t.transfer,t.outing,t.debt,t.schedule].filter(Boolean).length>1)return fail();if(t.loanFunding){const d=s.debts.find(d=>d.id===t.loanFunding);if(!d||d.kind!=='person'||d.direction!=='owe'||t.type!=='income')return fail();funded.set(d.id,(funded.get(d.id)||0)+t.amount);}if(t.transfer){if(!id(t.transfer))return fail();const rows=transfers.get(t.transfer)||[];rows.push(t);transfers.set(t.transfer,rows);}if(t.outing&&!s.outings.some(o=>o.id===t.outing&&o.status==='closed'&&o.lines.some(l=>l.account===t.account)))return fail();}
  for(const [key,total] of funded){const d=s.debts.find(d=>d.id===key);if(total>d.amount)return fail();}
  for(const rows of transfers.values())if(rows.length!==2||rows[0].type===rows[1].type||rows[0].account===rows[1].account||rows[0].amount!==rows[1].amount||rows[0].date!==rows[1].date)return fail();
  for(const o of s.outings){if(!text(o.name)||!o.name.trim()||!text(o.category)||!o.category.trim()||!validDate(o.date)||!['open','closed'].includes(o.status)||!Array.isArray(o.lines)||!o.lines.length||new Set(o.lines.map(l=>l.account)).size!==o.lines.length)return fail();if(o.status==='open'?o.settled!=='':!validDate(o.settled)||o.settled<o.date)return fail();for(const l of o.lines){if(!account(s,l.account)||!['cash','bank'].includes(l.mode)||!money(l.budget)||!l.budget)return fail();if(o.status==='open'){if(active.has(l.account))return fail();active.add(l.account);continue;}if(!money(l.spent)||!money(l.added)||!money(l.returned)||!Array.isArray(l.recordedIds)||new Set(l.recordedIds).size!==l.recordedIds.length||l.mode==='cash'&&l.spent!==l.budget+l.added-l.returned||l.mode==='bank'&&(l.added!==0||l.returned!==0))return fail();let recorded=0;for(const key of l.recordedIds){const t=s.transactions.find(t=>t.id===key);if(!t||linked.has(key)||t.type!=='expense'||!isOperating(t)||t.outing||t.account!==l.account||t.date<o.date||t.date>o.settled)return fail();linked.add(key);recorded+=t.amount;}const generated=s.transactions.filter(t=>t.outing===o.id&&t.account===l.account),left=l.spent-recorded;if(left<0||generated.length!==(left>0?1:0)||generated.some(t=>t.type!=='expense'||t.amount!==left||t.date!==o.settled))return fail();}}
}

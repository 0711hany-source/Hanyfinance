// Calendar-based recurrence: keep the original anchor day (31 Jan -> 28 Feb -> 31 Mar).
export const validDate = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v;
export const cycles = {once:'Einmalig',daily:'Täglich',weekly:'Wöchentlich',fortnightly:'Alle 2 Wochen',monthly:'Monatlich',quarterly:'Alle 3 Monate',yearly:'Jährlich'};
const iso = d => d.toISOString().slice(0,10);
export const addDays = (date,days) => iso(new Date(Date.parse(date)+days*86400000));
export const daysBetween = (a,b) => Math.round((Date.parse(b)-Date.parse(a))/86400000);
export function dueAt(schedule,index) {
  if (!Number.isInteger(index)||index<0) throw Error('Ungültiger Termin.');
  if(schedule.cycle==='once') return index===0?schedule.start:null;
  const days={daily:1,weekly:7,fortnightly:14}[schedule.cycle];
  if(days) return addDays(schedule.start,index*days);
  const months={monthly:1,quarterly:3,yearly:12}[schedule.cycle];
  if(!months) throw Error('Ungültiger Zyklus.');
  const d=new Date(schedule.start+'T00:00:00Z');
  const target=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+months*index,1));
  const last=new Date(Date.UTC(target.getUTCFullYear(),target.getUTCMonth()+1,0)).getUTCDate();
  target.setUTCDate(Math.min(d.getUTCDate(),last));return iso(target);
}
export function isOccurrence(s,due) {
  if(!validDate(due)||due<s.start) return false;
  const diff=daysBetween(s.start,due);
  if(s.cycle==='once')return due===s.start;
  const days={daily:1,weekly:7,fortnightly:14}[s.cycle];if(days)return diff%days===0;
  const a=new Date(s.start),b=new Date(due),m=(b.getUTCFullYear()-a.getUTCFullYear())*12+b.getUTCMonth()-a.getUTCMonth(),step={monthly:1,quarterly:3,yearly:12}[s.cycle];
  return m%step===0&&dueAt(s,m/step)===due;
}
export function occurrence(state,s,due,asOf) {
  const override=state.occurrences.find(o=>o.schedule===s.id&&o.due===due);
  const txs=state.transactions.filter(t=>t.schedule===s.id&&t.due===due),tx=txs[0];
  const fee=override?.fee||0,total=tx?.scheduleTotal??override?.amount??s.amount+fee,paidAmount=txs.reduce((n,t)=>n+t.amount,0),remaining=Math.max(0,total-paidAmount),effectiveDue=override?.effectiveDue||due;
  return {schedule:s.id,due,name:s.name,type:s.type,account:s.account,category:s.category,amount:remaining===0?total:remaining,total,paidAmount,remaining,effectiveDue,fee,tx:remaining===0?tx:null,txs,
    status:remaining===0?'paid':override?.skipped?'skipped':effectiveDue<asOf?'overdue':paidAmount?'partial':effectiveDue===asOf?'due':'planned',late:Math.max(0,daysBetween(effectiveDue,asOf)),note:override?.note||''};
}
export function occurrences(state,through,asOf,from='1900-01-01') {
  const rows=[];
  for(const s of state.schedules){
    const finish=[through,s.end||through,s.stoppedOn||through].sort()[0];
    // At most ~37k daily occurrences across the accepted 2000–2100 date range.
    for(let i=0;i<40000;i++) {const due=dueAt(s,i);if(!due||due>finish)break;const o=occurrence(state,s,due,asOf);if(o.effectiveDue>=from)rows.push(o);}
    // A paid or explicitly skipped occurrence remains visible after stopping a series.
    const extras=[...state.transactions.filter(t=>t.schedule===s.id),...state.occurrences.filter(o=>o.schedule===s.id)];
    for(const x of extras)if(occurrence(state,s,x.due,asOf).effectiveDue>=from&&occurrence(state,s,x.due,asOf).effectiveDue<=through&&!rows.some(r=>r.schedule===s.id&&r.due===x.due))rows.push(occurrence(state,s,x.due,asOf));
  }
  return rows.filter(o=>o.effectiveDue<=through||['paid','skipped'].includes(o.status)).sort((a,b)=>a.effectiveDue.localeCompare(b.effectiveDue)||a.name.localeCompare(b.name));
}
export function setOccurrence(state,id,due,patch) {
  const s=state.schedules.find(s=>s.id===id);if(!s||!isOccurrence(s,due))throw Error('Termin nicht gefunden.');
  const current=occurrence(state,s,due,new Date().toLocaleDateString('sv-SE'));if(current.status==='paid')throw Error('Eine bezahlte Zahlung zuerst rückgängig machen.');
  if(state.transactions.some(t=>t.schedule===id&&t.due===due)&&patch.skipped)throw Error('Teilzahlungen zuerst rückgängig machen, bevor du überspringst.');
  let o=state.occurrences.find(o=>o.schedule===id&&o.due===due);
  if(!o){o={schedule:id,due,fee:0,skipped:false,note:''};state.occurrences.push(o)}
  if(patch.fee!==undefined&&(current.paidAmount||o.amount!==undefined))patch={...patch,amount:current.total-current.fee+patch.fee};
  if(patch.amount!==undefined&&patch.amount<current.paidAmount)throw Error('Gesamtbetrag darf bereits gezahlte Beträge nicht unterschreiten.');
  Object.assign(o,patch);if(patch.amount!==undefined)for(const t of state.transactions.filter(t=>t.schedule===id&&t.due===due))t.scheduleTotal=patch.amount;return o;
}
export function statistics(state,from,to,account='all') {
  const tx=state.transactions.filter(t=>!t.transfer&&!t.loanFunding&&t.date>=from&&t.date<=to&&(account==='all'||t.account===account));
  const income=tx.filter(t=>t.type==='income').reduce((n,t)=>n+t.amount,0),expense=tx.filter(t=>t.type==='expense').reduce((n,t)=>n+t.amount,0);
  const cats={};for(const t of tx.filter(t=>t.type==='expense'))cats[t.category]=(cats[t.category]||0)+t.amount;
  return {tx,income,expense,net:income-expense,rate:income>0?(income-expense)/income*100:null,categories:Object.entries(cats).sort((a,b)=>b[1]-a[1])};
}

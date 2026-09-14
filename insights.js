import {occurrences,addDays} from './planning.js';
import {balance} from './model.js';

export function budgetSummary(state,month){
  return state.budgets.map(b=>{const tx=state.transactions.filter(t=>!t.transfer&&t.type==='expense'&&t.date.startsWith(month)&&t.category===b.category);const spent=tx.reduce((n,t)=>n+t.amount,0);return {...b,spent,left:b.amount-spent,percent:Math.round(spent/b.amount*100),tx};});
}

export function forecast(state,asOf,days=30,account='all'){
  const opening=state.accounts.filter(a=>account==='all'||a.id===account).reduce((n,a)=>n+balance(state,a.id),0);
  const pending=occurrences(state,addDays(asOf,days-1),asOf).filter(o=>!['paid','skipped'].includes(o.status)&&(account==='all'||o.account===account));
  let current=opening;
  const rows=Array.from({length:days},(_,i)=>{const date=addDays(asOf,i),items=pending.filter(o=>i===0?o.effectiveDue<=date:o.effectiveDue===date),income=items.filter(o=>o.type==='income').reduce((n,o)=>n+o.amount,0),expense=items.filter(o=>o.type==='expense').reduce((n,o)=>n+o.amount,0);current+=income-expense;return {date,items,income,expense,balance:current};});
  return {opening,rows,closing:current,lowest:Math.min(opening,...rows.map(r=>r.balance)),overdue:pending.filter(o=>o.effectiveDue<asOf).length};
}

export function searchTransactions(state,query='',account='all'){
  const words=query.trim().toLocaleLowerCase('de-DE').split(/\s+/).filter(Boolean);
  return state.transactions.filter(t=>{if(account!=='all'&&t.account!==account)return false;const text=[t.note,t.category,t.date,t.date.split('-').reverse().join('.'),state.accounts.find(a=>a.id===t.account)?.name,(t.amount/100).toFixed(2).replace('.',','),t.type==='income'?'Einnahme':'Ausgabe'].join(' ').toLocaleLowerCase('de-DE');return words.every(w=>text.includes(w));}).sort((a,b)=>b.date.localeCompare(a.date));
}

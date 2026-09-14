import {occurrences,addDays,daysBetween,validDate} from './planning.js';
import {isOperating,accountBalance} from './money-flows.js';

export const smartDefaults=()=>({buffer:0,rules:[],categories:[],favorites:[],cards:['money','focus','week']});
export function prepareSmart(s,before,date){
  for(const g of s.goals)if(g.done&&g.kind==='savings'&&g.linkedAccount&&accountBalance(s,g.linkedAccount)<g.targetCents){g.done=false;g.completed='';}
  for(const b of s.beliefs){b.situation??='';b.counterEvidence??='';b.nextAction??='';b.trigger??='';b.credibility??=null;b.history??=[];const old=before?.beliefs.find(x=>x.id===b.id);if(old&&(old.text!==b.text||old.evidence!==b.evidence||old.credibility!==b.credibility))b.history.push({date,text:old.text,evidence:old.evidence,credibility:old.credibility??null});}
  for(const p of s.practice)p.actionStatus??='planned';
  for(const d of s.debts){d.monthlyRate??=0;d.events??=[{id:crypto.randomUUID(),amount:d.amount,date:'',note:'Gesamtbetrag'}];}
}
export function migrateSmart(s){
  s.smart=smartDefaults();
  for(const t of s.transactions)if(t.schedule){const r=s.schedules.find(r=>r.id===t.schedule);t.scheduleTotal=t.amount;}

  for(const b of s.beliefs)Object.assign(b,{situation:'',counterEvidence:'',nextAction:'',trigger:'',credibility:null,history:[]});
  for(const p of s.practice)p.actionStatus='planned';
  for(const d of s.debts){d.events=[{id:crypto.randomUUID(),amount:d.amount,date:'',note:'Übernommener Gesamtbetrag'}];d.monthlyRate=0;}
  return s;
}
const money=v=>Number.isSafeInteger(v)&&v>=0&&v<=1e12;
const text=v=>typeof v==='string'&&v.length<=10000;
const key=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(v);
const unique=rows=>Array.isArray(rows)&&rows.length<=50000&&rows.every(r=>r&&key(r.id))&&new Set(rows.map(r=>r.id)).size===rows.length;
export function validateSmart(s,fail){
  const x=s.smart;if(!x||!money(x.buffer)||!unique(x.rules)||!unique(x.categories)||!unique(x.favorites)||!Array.isArray(x.cards)||x.cards.length!==3||new Set(x.cards).size!==3||x.cards.some(v=>!['money','focus','week'].includes(v)))return fail();
  for(const r of x.rules)if(!text(r.match)||!r.match.trim()||!text(r.category)||!r.category.trim()||!(r.account===''||s.accounts.some(a=>a.id===r.account)))return fail();
  for(const r of x.categories)if(!text(r.name)||!r.name.trim()||typeof r.archived!=='boolean')return fail();
  for(const r of x.favorites)if(!text(r.name)||!text(r.category)||!money(r.amount)||!r.amount||!['income','expense'].includes(r.type)||!s.accounts.some(a=>a.id===r.account))return fail();
  for(const b of s.beliefs){if(!(b.personalValue===undefined||text(b.personalValue))||![b.situation,b.counterEvidence,b.nextAction,b.trigger].every(text)||!(b.credibility===null||Number.isInteger(b.credibility)&&b.credibility>=0&&b.credibility<=10)||!Array.isArray(b.history)||b.history.length>50000)return fail();for(const h of b.history)if(!validDate(h.date)||!text(h.text)||!text(h.evidence)||!(h.credibility===null||Number.isInteger(h.credibility)&&h.credibility>=0&&h.credibility<=10))return fail();}
  for(const p of s.practice){if(!['planned','done','partial','missed'].includes(p.actionStatus))return fail();if(p.readTexts!==undefined&&(!p.readTexts||typeof p.readTexts!=='object'||Array.isArray(p.readTexts)||Object.entries(p.readTexts).some(([id,v])=>!p.readIds.includes(id)||!text(v))))return fail();}
  for(const d of s.debts){if(!money(d.monthlyRate)||!unique(d.events)||d.events.reduce((n,e)=>n+e.amount,0)!==d.amount)return fail();for(const e of d.events)if(!money(e.amount)||!e.amount||!(e.date===''||validDate(e.date))||!text(e.note))return fail();}
  for(const g of s.goals)if(g.linkedAccount!==undefined&&!(g.linkedAccount===''||s.accounts.some(a=>a.id===g.linkedAccount)))return fail();
}
export function spendingRoom(s,date){
  const end=addDays(date.slice(0,7)+'-01',32).slice(0,7)+'-01',through=addDays(end,-1),slots=daysBetween(date,through)+1;
  const plans=occurrences(s,through,date).filter(o=>!['paid','skipped'].includes(o.status));
  const byCategory=new Map();
  for(const o of plans.filter(o=>o.type==='expense'))byCategory.set(o.category,(byCategory.get(o.category)||0)+o.amount);
  const rows=[...byCategory].map(([category,planned])=>({category,planned,budget:0,outing:0}));
  const row=category=>{let r=rows.find(r=>r.category===category);if(!r){r={category,planned:0,budget:0,outing:0};rows.push(r);}return r;};
  for(const b of s.budgets){const spent=s.transactions.filter(t=>isOperating(t)&&t.type==='expense'&&t.category===b.category&&t.date.startsWith(date.slice(0,7))).reduce((n,t)=>n+t.amount,0);row(b.category).budget=Math.max(0,b.amount-spent);}
  for(const o of s.outings.filter(o=>o.status==='open'))row(o.category).outing+=o.lines.reduce((n,l)=>n+l.budget,0);
  for(const r of rows)r.reserved=Math.max(r.planned,r.budget,r.outing);
  const balance=s.accounts.reduce((n,a)=>n+accountBalance(s,a.id),0),reserved=rows.reduce((n,r)=>n+r.reserved,0),free=balance-reserved-s.smart.buffer;
  return {balance,reserved,free,buffer:s.smart.buffer,days:slots,perDay:Math.floor(Math.max(0,free)/slots),through,rows,plans,expected:plans.filter(o=>o.type==='income').reduce((n,o)=>n+o.amount,0)};
}
export function calculator(raw){
  const value=String(raw).replace(/\s/g,'');
  if(!/^[+-]?\d+(?:[,.]\d{1,2})?(?:[+-]\d+(?:[,.]\d{1,2})?)*$/.test(value))throw Error('Betrag oder Rechnung wie 12,50 + 8,90 eingeben.');
  let total=0;for(const term of value.match(/[+-]?\d+(?:[,.]\d{1,2})?/g))total+=Math.round(Number(term.replace(',','.'))*100);
  if(!Number.isSafeInteger(total)||Math.abs(total)>1e12)throw Error('Betrag zu groß.');return total;
}
export const thoughtTemplates={
  money:{thought:'Ich kann nicht mit Geld umgehen.',text:'Ich lerne, mein Geld zu überblicken, indem ich jeden Abend kurz nachsehe.',action:'Zwei Minuten meinen Kontostand und offene Zahlungen prüfen.',trigger:'Nach dem Abendessen'},
  room:{thought:'Ich schiebe alles auf.',text:'Ich kann auch ohne perfekte Motivation zehn Minuten anfangen.',action:'Zehn Minuten den Boden freiräumen.',trigger:'Wenn ich nach Hause komme'},
  learning:{thought:'Ich schaffe das nicht.',text:'Ich kann eine kleine Aufgabe üben und aus Fehlern lernen.',action:'Eine Aufgabe bearbeiten und eine offene Frage notieren.',trigger:'Nach meinem ersten Kaffee'}
};
export function debtEstimate(s,d,extra=0){const paid=s.transactions.filter(t=>t.debt===d.id).reduce((n,t)=>n+t.amount,0),remaining=Math.max(0,d.amount-paid-extra);return {remaining,months:d.monthlyRate?Math.ceil(remaining/d.monthlyRate):null};}
export function savingsPace(g,date,amount){
  const left=Math.max(0,g.targetCents-amount),days=g.due?daysBetween(date,g.due)+1:null,required=days&&days>0?Math.ceil(left/days):null;
  const dates=[...new Set(g.progress.map(p=>p.date))].sort(),span=dates.length>1?daysBetween(dates[0],dates.at(-1)):0;
  const initial=g.progress.filter(p=>p.date===dates[0]).reduce((n,p)=>n+p.amount,0),saved=g.progress.reduce((n,p)=>n+p.amount,0),observed=!g.linkedAccount&&span>=7?Math.max(0,(saved-initial)/span):null;
  const status=left===0?'Zielbetrag erreicht':days!==null&&days<=0?'Termin neu betrachten':required===null?'Zieldatum festlegen':observed===null?'Noch keine belastbare Tempo-Prognose':observed>=required?'Mit bisherigem Tempo im Plan':observed>=required*0.8?'Mit bisherigem Tempo knapp':'Mit bisherigem Tempo hinter dem Plan';
  return {left,required,observed,status};
}
export function suggestions(s){
  const groups=new Map();for(const t of s.transactions.filter(t=>isOperating(t)&&t.type==='expense'&&!t.schedule&&!t.debt)){const name=t.note.trim().toLocaleLowerCase('de-DE');if(!name)continue;const rows=groups.get(name)||[];rows.push(t);groups.set(name,rows);}
  return [...groups].filter(([,rows])=>rows.length>=3).map(([name,rows])=>{rows.sort((a,b)=>a.date.localeCompare(b.date));const amounts=rows.map(r=>r.amount),gaps=rows.slice(1).map((r,i)=>daysBetween(rows[i].date,r.date));return {name:rows[0].note,count:rows.length,category:rows.at(-1).category,account:rows.at(-1).account,amount:rows.at(-1).amount,recurring:new Set(amounts).size===1&&gaps.every(n=>n>=25&&n<=35),last:rows.at(-1).date};});
}

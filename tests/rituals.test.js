import test from 'node:test';
import assert from 'node:assert/strict';
import {affirmations,dailyAffirmation,validateRitual} from '../rituals.js';
import {ritualsUI} from '../rituals-ui.js';
import {initial,today,validate} from '../model.js';
import {prepareSmart} from '../smart.js';
import {addDays} from '../planning.js';
test('100 eigene Impulse rotieren reproduzierbar im Kalender und akzeptieren Schaltjahre',()=>{
 assert.equal(affirmations.length,100);assert.equal(new Set(affirmations.map(a=>a.text)).size,100);
 const first='2026-01-01';assert.equal(new Set(Array.from({length:100},(_,i)=>dailyAffirmation(addDays(first,i)).id)).size,100);
 assert.equal(dailyAffirmation(first).id,dailyAffirmation(addDays(first,100)).id);
 assert.ok(dailyAffirmation('2024-02-29'));assert.throws(()=>dailyAffirmation('2026-02-29'));
});
test('Ritualdaten bleiben optional; beschädigte Sicherungen und Übernehmen ohne Lesen werden abgewiesen',()=>{
 assert.equal(validateRitual(undefined),true);for(const r of [null,[],{affirmationAdopted:true},{morningDone:'yes'},{wins:'x'.repeat(2001)}])assert.equal(validateRitual(r),false);
 const s=initial();s.practice.push({date:today(),goalId:'',action:'',note:'',confidence:null,readIds:[],actionStatus:'planned',ritual:{morningDone:'yes'}});assert.throws(()=>validate(s));
});
test('Morgen und Abend bewahren Lesestatus und übertragen einen konkreten Plan ohne Finanzen zu verändern',()=>{
 const s=initial();let submit,html;globalThis.document={querySelector:()=>({close(){}})};
 const ui=ritualsUI({state:()=>s,esc:v=>String(v??'').replaceAll('<','&lt;'),form:(t,b)=>t+b,input:()=>'',select:()=>'',openSheet:(h,cb)=>{html=h;submit=cb;},commit:fn=>{const before=structuredClone(s);fn();prepareSmart(s,before,today());validate(s);return true;}});
 const data=o=>{const f=new FormData();for(const [k,v] of Object.entries(o))f.set(k,v);return f;};
 ui.click({ritual:'impulse'});submit(data({affirmationText:'Ich beginne <klein>.',affirmationRead:'on',affirmationAdopted:'on'}));
 ui.click({ritual:'morning'});submit(data({gratitudeMorning:'Hilfe von Alex',goalId:'',intention:'Ein ruhiger Raum',action:'Zehn Minuten aufräumen',obstacle:'Müdigkeit',trigger:'Nach dem Frühstück',complete:'on'}));
 ui.click({ritual:'evening'});submit(data({action:'Zehn Minuten aufräumen',actionStatus:'done',wins:'Schreibtisch frei',note:'Klein beginnen hilft',gratitudeEvening:'Gemeinsames Essen',tomorrowAction:'Boden saugen',tomorrowTrigger:'Nach dem Kaffee',complete:'on'}));
 const p=s.practice.find(p=>p.date===today()),n=s.practice.find(p=>p.date===addDays(today(),1));assert.equal(p.ritual.affirmationAdopted,true);assert.equal(p.ritual.gratitudeMorning,'Hilfe von Alex');assert.equal(p.actionStatus,'done');assert.equal(n.action,'Boden saugen');assert.equal(n.ritual.trigger,'Nach dem Kaffee');assert.equal(n.actionStatus,'planned');assert.equal(n.ritual.morningDone,undefined);assert.equal(s.transactions.length,0);assert.ok(ui.history(p).includes('&lt;klein>'));
 ui.click({ritual:'evening'});assert.ok(html.includes('Boden saugen'));delete globalThis.document;
});

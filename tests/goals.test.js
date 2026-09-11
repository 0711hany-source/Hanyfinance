import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeGoal,migrateGoals,validateGoalsState,goalSaved,goalProgress,goalPlan,addGoalProgress,markBeliefsRead,dailyPractice,weekStart,weeklySummary,goalTemplate} from '../goals.js';
import {goalsUI} from '../goals-ui.js';

const goal = patch => normalizeGoal({id:'goal',title:'Meine Reserve',horizon:'Monat',due:'2026-10-10',done:false,completed:'',kind:'savings',targetCents:300000,...patch});
const fresh = () => ({goals:[],beliefs:[],practice:[],reviews:[],journals:{},accounts:[{id:'cash',opening:10000}],transactions:[]});
const affirmation = patch => ({id:'belief',text:'Ich lerne Schritt für Schritt.',goalId:'',oldThought:'',evidence:'',archived:false,created:'2026-09-10',...patch});

test('Migration bewahrt alte Ziele und erfindet keine Erfolge oder Glaubenssätze',()=>{
  const original={id:'old',title:'Zimmer aufräumen',horizon:'Tag',due:'2026-09-11',done:true,completed:'2026-09-10'};
  const s={goals:[{...original}],journals:{'2026-09-09':{wish:'Mein Wunsch'}}};
  migrateGoals(s);
  assert.deepEqual(s.goals[0],normalizeGoal(original));
  assert.equal(s.goals[0].created,'');
  assert.equal(s.goals[0].kind,'task');
  assert.deepEqual(s.beliefs,[]);assert.deepEqual(s.practice,[]);assert.deepEqual(s.reviews,[]);
  assert.equal(s.journals['2026-09-09'].wish,'Mein Wunsch');
  validateGoalsState(s);
});

test('Sparfortschritt ist exakt in Cent und verändert keine Finanzbuchungen',()=>{
  const s=fresh(),g=goal();s.goals.push(g);
  const accounts=structuredClone(s.accounts),tx=structuredClone(s.transactions);
  addGoalProgress(g,{id:'p1',date:'2026-09-09',amount:100001,note:'Startbetrag'},'2026-09-10');
  addGoalProgress(g,{id:'p2',date:'2026-09-10',amount:19999,note:'Sparen'},'2026-09-10');
  addGoalProgress(g,{id:'p3',date:'2026-09-10',amount:-10000,note:'Entnommen'},'2026-09-10');
  assert.equal(goalSaved(g),110000);assert.equal(goalProgress(g),36);
  assert.deepEqual(s.accounts,accounts);assert.deepEqual(s.transactions,tx);
  assert.equal(goalPlan(g,'2026-09-10').left,190000);validateGoalsState(s);
});

test('Sparplan behandelt heute, Rückstände und fehlende Fristen nachvollziehbar',()=>{
  const g=goal({targetCents:10001,due:'2026-09-16'});
  assert.deepEqual(goalPlan(g,'2026-09-10'),{saved:0,left:10001,days:6,overdue:false,perDay:1429,perWeek:10001});
  assert.equal(goalPlan(g,'2026-09-16').perDay,10001);
  assert.equal(goalPlan(g,'2026-09-17').overdue,true);assert.equal(goalPlan(g,'2026-09-17').perDay,null);
  g.due='';assert.equal(goalPlan(g,'2026-09-10').perWeek,null);
});

test('Entnahmen dürfen den Sparstand auch rückwirkend nicht negativ machen',()=>{
  const g=goal();addGoalProgress(g,{id:'p1',date:'2026-09-10',amount:1000,note:''},'2026-09-10');
  for(const entry of [
    {id:'p2',date:'2026-09-09',amount:-1,note:''},
    {id:'p2',date:'2026-09-10',amount:-1001,note:''},
    {id:'p2',date:'2026-09-11',amount:1,note:''},
    {id:'p2',date:'2026-02-30',amount:1,note:''},
    {id:'p1',date:'2026-09-10',amount:1,note:''},
    {id:'p2',date:'2026-09-10',amount:0,note:''}
  ]){assert.throws(()=>addGoalProgress(g,entry,'2026-09-10'));assert.equal(g.progress.length,1);}
  addGoalProgress(g,{id:'p2',date:'2026-09-10',amount:-1000,note:''},'2026-09-10');assert.equal(goalSaved(g),0);
});

test('Entnahme öffnet erreichtes Sparziel wieder; Übererfüllung bleibt möglich',()=>{
  const g=goal({targetCents:1000});addGoalProgress(g,{id:'p1',date:'2026-09-10',amount:1500,note:''},'2026-09-10');
  assert.equal(goalProgress(g),100);assert.equal(goalPlan(g,'2026-09-10').left,0);
  g.done=true;g.completed='2026-09-10';
  addGoalProgress(g,{id:'p2',date:'2026-09-10',amount:-600,note:''},'2026-09-10');
  assert.equal(g.done,false);assert.equal(g.completed,'');assert.equal(goalProgress(g),90);
});

test('Ein gelesener Satz zählt einmal pro Tag; Archivieren bewahrt den Verlauf',()=>{
  const s=fresh();s.beliefs.push(affirmation());
  markBeliefsRead(s,['belief'],'2026-09-10');markBeliefsRead(s,['belief','belief'],'2026-09-10');
  assert.equal(s.practice.length,1);assert.deepEqual(s.practice[0].readIds,['belief']);
  markBeliefsRead(s,['belief'],'2026-09-11');assert.equal(s.practice.length,2);
  s.beliefs[0].archived=true;validateGoalsState(s);
  assert.throws(()=>markBeliefsRead(s,['belief'],'2026-09-12'));
  assert.throws(()=>markBeliefsRead(s,['missing'],'2026-09-12'));
  assert.equal(s.practice.length,2);
});

test('Tagesnotiz und Lesestatus bleiben beim gegenseitigen Aktualisieren erhalten',()=>{
  const s=fresh();s.beliefs.push(affirmation());
  Object.assign(dailyPractice(s,'2026-09-10'),{action:'10 Minuten aufräumen',note:'Der Tisch ist frei.',confidence:4});
  markBeliefsRead(s,['belief'],'2026-09-10');
  assert.equal(s.practice[0].note,'Der Tisch ist frei.');assert.equal(s.practice[0].confidence,4);
  Object.assign(dailyPractice(s,'2026-09-10'),{confidence:3});
  assert.deepEqual(s.practice[0].readIds,['belief']);assert.equal(s.practice.length,1);validateGoalsState(s);
});

test('Wochenrückblick zählt tatsächliche Tage und abgeschlossene Etappen im lokalen Kalender',()=>{
  const s=fresh();s.goals.push(goal({kind:'task',targetCents:0,done:true,completed:'2026-09-10',milestones:[{id:'m1',title:'Angefangen',done:true,completed:'2026-09-06'},{id:'m2',title:'Fertig',done:true,completed:'2026-09-10'}]}));
  Object.assign(dailyPractice(s,'2026-09-10'),{note:'Geschafft'});
  Object.assign(dailyPractice(s,'2026-09-11'),{note:'Morgen'});
  assert.equal(weekStart('2026-09-13'),'2026-09-07');assert.equal(weekStart('2026-03-29'),'2026-03-23');
  assert.deepEqual(weeklySummary(s,'2026-09-10'),{start:'2026-09-07',end:'2026-09-13',goals:1,milestones:1,days:1,savingsEntries:0});
  assert.equal(goalProgress(s.goals[0]),100);
});

test('Vorlagen setzen relative Termine und geben für Auto und Haus keine erfundenen Preise vor',()=>{
  assert.equal(goalTemplate('room','2026-12-31').due,'2027-01-01');
  assert.equal(goalTemplate('savings','2026-01-31').due,'2026-02-28');
  assert.equal(goalTemplate('savings','2026-01-31').targetCents,300000);
  const car=goalTemplate('car','2024-02-29');assert.equal(car.due,'2025-02-28');assert.equal(car.targetCents,0);assert.equal(car.kind,'task');
  assert.equal(goalTemplate('house','2026-09-10').due,'');
  assert.throws(()=>goalTemplate('missing','2026-09-10'));
});

test('Import blockiert ungültige IDs, verwaiste Verknüpfungen und manipulierte Messwerte',()=>{
  const base=fresh();base.goals.push(goal());base.beliefs.push(affirmation({goalId:'goal'}));markBeliefsRead(base,['belief'],'2026-09-10');
  for(const mutate of [
    s=>s.goals[0].progress=[{id:'bad',date:'2026-09-10',amount:-1,note:''}],
    s=>s.goals[0].targetCents='3000',
    s=>s.goals[0].targetCents=NaN,
    s=>s.goals[0].done=true,
    s=>s.goals[0].milestones=[null],
    s=>s.beliefs[0].id='x\" onclick=\"alert(1)',
    s=>s.beliefs[0].goalId='missing',
    s=>s.beliefs.push({...s.beliefs[0]}),
    s=>s.practice[0].confidence=6,
    s=>s.practice[0].readIds=['missing'],
    s=>s.practice[0].readIds=['belief','belief'],
    s=>s.practice.push({...s.practice[0]}),
    s=>s.reviews=[{week:'2026-09-10',wins:'',learned:'',nextStep:''}],
    s=>s.reviews=[null]
  ]){const s=structuredClone(base);mutate(s);assert.throws(()=>validateGoalsState(s));}
  validateGoalsState(base);
});

test('Benutzereingaben werden in Ziele- und Fokusansichten als Text dargestellt',()=>{
  const s=fresh();s.goals.push(goal({title:'<img src=x onerror=alert(1)>',nextAction:'<script>alert(1)</script>'}));s.beliefs.push(affirmation({text:'<svg onload=alert(2)>'}));
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const ui=goalsUI({state:()=>s,esc,eur:n=>`${n/100} €`,icon:()=>'',render:()=>{}});
  const markup=ui.goals()+ui.focus();
  assert.ok(markup.includes('&lt;img'));assert.ok(markup.includes('&lt;svg'));assert.ok(markup.includes('&lt;script'));
  assert.ok(!markup.includes('<script>'));assert.ok(!markup.includes('<svg onload'));
});

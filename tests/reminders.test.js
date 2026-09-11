import test from 'node:test';
import assert from 'node:assert/strict';
import {reminderDefaults,validReminderSettings,reminderItems,calendarICS,foldIcsLine,icsEscape} from '../reminders.js';

const sample=()=>({goals:[{id:'goal',title:'Zimmer aufräumen',due:'2026-09-11',done:false,nextAction:'10 Minuten starten'},{id:'done',title:'Schon fertig',due:'2026-09-11',done:true}],schedules:[{id:'rent',name:'Miete',start:'2026-09-10',end:'',stoppedOn:'',type:'expense',amount:80000,cycle:'monthly',account:'bank',category:'Wohnen'}],occurrences:[],transactions:[],debts:[{id:'debt',name:'Person',due:'2026-09-12',amount:5000,direction:'owe'}],reminderSettings:reminderDefaults()});

test('only outstanding dates, paid/skipped occurrences and completed goals excluded',()=>{
  const state=sample();state.transactions.push({schedule:'rent',due:'2026-09-10',amount:80000});
  assert.deepEqual(reminderItems(state,{asOf:'2026-09-10',days:3}).map(x=>x.kind),['goal','debt']);
  state.transactions=[];state.occurrences.push({schedule:'rent',due:'2026-09-10',skipped:true});
  assert.equal(reminderItems(state,{asOf:'2026-09-10',days:3}).length,2);
  state.transactions.push({debt:'debt',amount:5000});
  assert.equal(reminderItems(state,{asOf:'2026-09-10',days:3}).length,1);
});
test('overdue items stay in overview but calendar range omits them',()=>{
  const state=sample();
  assert.equal(reminderItems(state,{asOf:'2026-09-11',days:1})[0].late,1);
  assert.ok(reminderItems(state,{asOf:'2026-09-11',days:1,includeOverdue:false}).every(x=>x.due>='2026-09-11'));
});
test('selection excludes disabled groups and counts remaining debt only',()=>{
  const state=sample();state.transactions.push({debt:'debt',amount:1200});state.reminderSettings.includePayments=false;state.reminderSettings.includeGoals=false;
  assert.equal(reminderItems(state,{asOf:'2026-09-10'})[0].amount,3800);
});
test('calendar uses CRLF, floating local time, stable UID and lead plus due alarms',()=>{
  const state=sample(),settings={...reminderDefaults(),leadDays:7,time:'08:30',privateTitles:false};
  const ics=calendarICS(reminderItems(state,{asOf:'2026-09-10',days:3}),{settings,now:new Date('2026-09-10T10:11:12Z')});
  assert.ok(ics.includes('UID:goal-goal@hany.local\r\n'));
  assert.ok(ics.includes('DTSTART:20260911T083000\r\n'));
  assert.ok(ics.includes('DTSTAMP:20260910T101112Z\r\n'));
  assert.equal((ics.match(/TRIGGER:-P7D/g)||[]).length,3);
  assert.equal((ics.match(/TRIGGER:PT0S/g)||[]).length,3);
  assert.ok(!ics.replace(/\r\n/g,'').includes('\n'));
});
test('ICS escaping prevents injected events and UTF8 lines fit 75 octets',()=>{
  assert.equal(icsEscape('Text\\,;\r\nBEGIN:VEVENT'),'Text\\\\\\,\\;\\nBEGIN:VEVENT');
  const value='SUMMARY:'+('€😊 ä'.repeat(70)),folded=foldIcsLine(value);
  assert.ok(folded.split('\r\n').every(x=>new TextEncoder().encode(x).length<=75));
  assert.equal(folded.replace(/\r\n /g,''),value);
  const items=[{id:'test',kind:'goal',due:'2026-09-11',title:'Title\r\nBEGIN:VEVENT',description:'Foo;Bar',amount:null}];
  const ics=calendarICS(items,{settings:{...reminderDefaults(),privateTitles:false}});
  assert.equal(ics.split('\r\n').filter(x=>x==='BEGIN:VEVENT').length,1);
});
test('privacy mode does not leak titles, names or financial amounts',()=>{
  const state=sample(),ics=calendarICS(reminderItems(state,{asOf:'2026-09-10'}));
  assert.ok(!ics.includes('Zimmer'));assert.ok(!ics.includes('Miete'));assert.ok(!ics.includes('800'));assert.ok(!ics.includes('Person'));
});
test('reminder setting validation rejects invalid clock times and flags',()=>{
  assert.equal(validReminderSettings(reminderDefaults()),true);
  for(const patch of [{time:'25:00'},{leadDays:2},{privateTitles:1}])assert.equal(validReminderSettings({...reminderDefaults(),...patch}),false);
});

import {addDays,daysBetween,occurrences,validDate} from './planning.js';

export const reminderDefaults = () => ({leadDays:1,time:'09:00',includeGoals:true,includePayments:true,includeDebts:true,privateTitles:true,nativeEnabled:false});
export function reminderSettings(state) {return {...reminderDefaults(),...state.reminderSettings};}
export function validReminderSettings(value) {
  return !!value && [0,1,7].includes(value.leadDays) && /^([01]\d|2[0-3]):[0-5]\d$/.test(value.time) && ['includeGoals','includePayments','includeDebts','privateTitles','nativeEnabled'].every(key=>typeof value[key]==='boolean');
}
const todayLocal = (now=new Date()) => `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
export function reminderItems(state,{asOf=todayLocal(),days=30,includeOverdue=true,settings=reminderSettings(state)}={}) {
  if (!validDate(asOf) || !Number.isInteger(days) || days < 0 || days > 365) throw Error('Erinnerungszeitraum prüfen.');
  const through=addDays(asOf,days),from=includeOverdue?'1900-01-01':asOf,items=[];
  if (settings.includeGoals) for (const goal of state.goals) if (!goal.done && validDate(goal.due) && goal.due>=from && goal.due<=through) items.push({id:`goal-${goal.id}`,kind:'goal',source:goal.id,due:goal.due,title:goal.title,description:goal.nextAction||goal.ifThen||'',amount:null});
  if (settings.includePayments) for (const item of occurrences(state,through,asOf,from)) if (!['paid','skipped'].includes(item.status)) items.push({id:`payment-${item.schedule}-${item.due}`,kind:'payment',source:item.schedule,due:item.due,title:item.name,description:item.type==='income'?'Erwarteter Eingang':'Geplante Zahlung',amount:item.amount});
  if (settings.includeDebts) for (const debt of state.debts.filter(debt=>!debt.archived)) {
    const amount=Math.max(0,debt.amount-state.transactions.filter(tx=>tx.debt===debt.id).reduce((sum,tx)=>sum+tx.amount,0));
    if (amount>0 && validDate(debt.due) && debt.due>=from && debt.due<=through) items.push({id:`debt-${debt.id}`,kind:'debt',source:debt.id,due:debt.due,title:debt.name,description:debt.direction==='owe'?'Offene Schuld':'Offene Forderung',amount});
  }
  return items.map(item=>({...item,late:Math.max(0,daysBetween(item.due,asOf))})).sort((a,b)=>a.due.localeCompare(b.due)||a.title.localeCompare(b.title));
}
export const icsEscape = value => String(value).replace(/\\/g,'\\\\').replace(/\r\n|\r|\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
export function foldIcsLine(value) {
  const encoder=new TextEncoder();let output='',line='',bytes=0;
  for (const character of String(value)) {
    const size=encoder.encode(character).length;
    if (bytes+size>75) {output+=line+'\r\n';line=' ';bytes=1;}
    line+=character;bytes+=size;
  }
  return output+line;
}
const friendly = {goal:'Ziel ansehen',payment:'Zahlung prüfen',debt:'Offenen Betrag prüfen'};
const money = cents => new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(cents/100);
export function calendarICS(items,{settings=reminderDefaults(),now=new Date()}={}) {
  if (!validReminderSettings(settings)) throw Error('Erinnerungseinstellungen prüfen.');
  const stamp=now.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Hany//Erinnerungen 0.5.0//DE','CALSCALE:GREGORIAN','X-WR-CALNAME:Hany Erinnerungen'];
  for (const item of items) {
    if (!validDate(item.due)) throw Error('Ungültiges Fälligkeitsdatum.');
    const title=settings.privateTitles?`Hany · ${friendly[item.kind]||'Termin prüfen'}`:`Hany · ${item.title}`;
    const description=settings.privateTitles?'Öffne Hany für deine persönlichen Details.':`${item.description||''}${item.amount!==null&&item.amount!==undefined?' · '+money(item.amount):''}\nIn Hany als erledigt erfassen. Änderungen in Hany aktualisieren den Kalender nicht automatisch.`;
    // Floating local time deliberately follows the device/calendar timezone.
    lines.push('BEGIN:VEVENT',`UID:${icsEscape(item.id)}@hany.local`,`DTSTAMP:${stamp}`,`DTSTART:${item.due.replace(/-/g,'')}T${settings.time.replace(':','')}00`,'DURATION:PT15M',`SUMMARY:${icsEscape(title)}`,`DESCRIPTION:${icsEscape(description)}`,'CLASS:PRIVATE','TRANSP:TRANSPARENT');
    for (const lead of [...new Set([settings.leadDays,0])]) lines.push('BEGIN:VALARM','ACTION:DISPLAY',`TRIGGER:${lead?'-P'+lead+'D':'PT0S'}`,`DESCRIPTION:${icsEscape(title)}`,'END:VALARM');
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map(foldIcsLine).join('\r\n')+'\r\n';
}

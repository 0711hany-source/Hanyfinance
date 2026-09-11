import {validDate, addDays, daysBetween, dueAt} from './planning.js';

export const horizons = ['Tag', 'Woche', 'Monat', 'Jahr', 'Langzeit'];
const MAX_MONEY = 1e12;
const id = v => typeof v === 'string' && /^[A-Za-z0-9_-]{1,100}$/.test(v);
const text = v => typeof v === 'string' && v.length < 10000;
const money = v => Number.isSafeInteger(v) && Math.abs(v) <= MAX_MONEY;
const unique = rows => Array.isArray(rows) && rows.length <= 50000 && rows.every(r => r && id(r.id)) && new Set(rows.map(r => r.id)).size === rows.length;
const dateOrEmpty = v => v === '' || validDate(v);

// Only used when creating a goal or migrating a version 1/2 backup. Version 3
// imports must be validated directly, without silently repairing bad fields.
export function normalizeGoal(g) {
  return {kind:'task', targetCents:0, progress:[], milestones:[], motivation:'', nextAction:'', obstacle:'', ifThen:'', created:'', pinned:false, ...g};
}

export function migrateGoals(s) {
  if (Array.isArray(s.goals)) s.goals = s.goals.map(normalizeGoal);
  s.beliefs ??= [];
  s.practice ??= [];
  s.reviews ??= [];
  return s;
}

export const goalSaved = g => g.progress.reduce((sum, entry) => sum + entry.amount, 0);
export const goalProgress = g => g.done ? 100 : g.kind === 'savings' ? Math.min(100, Math.floor(goalSaved(g) / g.targetCents * 100)) : g.milestones.length ? Math.floor(g.milestones.filter(m => m.done).length / g.milestones.length * 100) : 0;
export const weekStart = date => addDays(date, -((new Date(date + 'T00:00:00Z').getUTCDay() + 6) % 7));

// Equal daily/weekly pacing through the deadline, including today. This is a
// planning aid, not a forecast of available money or a bank standing order.
export function goalPlan(g, asOf) {
  const saved = g.kind === 'savings' ? goalSaved(g) : 0;
  const left = g.kind === 'savings' ? Math.max(0, g.targetCents - saved) : 0;
  const days = g.due ? daysBetween(asOf, g.due) : null;
  const slots = days === null || days < 0 ? null : days + 1;
  return {saved, left, days, overdue:!g.done && days !== null && days < 0,
    perDay:slots ? Math.ceil(left / slots) : null,
    perWeek:slots ? Math.ceil(left / Math.max(1, Math.ceil(slots / 7))) : null};
}

function validProgress(rows) {
  if (!unique(rows) || !rows.every(p => validDate(p.date) && money(p.amount) && p.amount !== 0 && text(p.note))) return false;
  // A backdated withdrawal may not create an impossible negative savings
  // balance. Same-day entries are evaluated together, independent of order.
  const byDate = new Map();
  for (const p of rows) byDate.set(p.date, (byDate.get(p.date) || 0) + p.amount);
  let running = 0;
  for (const [, amount] of [...byDate].sort(([a], [b]) => a.localeCompare(b))) {
    running += amount;
    if (!money(running) || running < 0) return false;
  }
  return true;
}

export function addGoalProgress(g, entry, asOf) {
  if (g.kind !== 'savings') throw Error('Beträge gehören zu einem Sparziel.');
  if (!validDate(entry.date) || entry.date > asOf) throw Error('Bitte ein gültiges Datum bis heute wählen.');
  const rows = [...g.progress, entry];
  if (!validProgress(rows)) throw Error('Betrag prüfen: Der Sparstand darf auch an früheren Tagen nicht negativ werden.');
  g.progress = rows;
  if (g.done && goalSaved(g) < g.targetCents) { g.done = false; g.completed = ''; }
  return g;
}

export function dailyPractice(s, date) {
  let record = s.practice.find(p => p.date === date);
  if (!record) {record = {date, readIds:[], goalId:'', action:'', note:'', confidence:null}; s.practice.push(record);}
  return record;
}

export function markBeliefsRead(s, ids, date) {
  if (!validDate(date) || !Array.isArray(ids) || ids.some(id => !s.beliefs.some(b => b.id === id && !b.archived))) throw Error('Glaubenssatz nicht gefunden.');
  if (!ids.length) return null;
  const record = dailyPractice(s, date);
  record.readIds = [...new Set([...record.readIds, ...ids])];
  return record;
}

export function weeklySummary(s, date) {
  const start = weekStart(date), end = addDays(start, 6), inWeek = d => d >= start && d <= end && d <= date;
  return {start, end,
    goals:s.goals.filter(g => g.done && inWeek(g.completed)).length,
    milestones:s.goals.reduce((n, g) => n + g.milestones.filter(m => m.done && inWeek(m.completed)).length, 0),
    days:s.practice.filter(p => inWeek(p.date) && (p.readIds.length || p.note || p.action || p.confidence !== null)).length,
    savingsEntries:s.goals.reduce((n, g) => n + g.progress.filter(p => inWeek(p.date)).length, 0)};
}

export function goalTemplate(name, date) {
  const templates = {
    room:{title:'Zimmer aufräumen', horizon:'Tag', due:addDays(date,1), nextAction:'10 Minuten beginnen: Kleidung vom Boden wegräumen.', obstacle:'Ich verschiebe den Anfang.', ifThen:'Wenn ich heute nach Hause komme, stelle ich einen Timer auf 10 Minuten.', motivation:'Ich möchte mich in meinem Zimmer wohlfühlen.', steps:['Kleidung sortieren', 'Oberflächen freiräumen', 'Boden reinigen']},
    savings:{title:'3.000 € sparen', kind:'savings', targetCents:300000, horizon:'Monat', due:dueAt({start:date,cycle:'monthly'},1), nextAction:'Prüfen, welchen Betrag ich nach meinen festen Ausgaben zurücklegen kann.', motivation:'Ich möchte eine finanzielle Reserve aufbauen.', steps:['Verfügbaren Betrag prüfen', 'Eine realistische Sparroutine festlegen']},
    car:{title:'AMG kaufen', horizon:'Jahr', due:dueAt({start:date,cycle:'yearly'},1), nextAction:'Mein Wunschmodell und die gesamten Anschaffungs- und laufenden Kosten recherchieren.', motivation:'Ich möchte einen Kauf, den ich langfristig tragen kann.', steps:['Wunschmodell und Budget festlegen', 'Versicherung, Unterhalt und Reserve einplanen', 'Finanzierung aus eigenen Mitteln prüfen', 'Angebote vergleichen']},
    house:{title:'Ein Haus kaufen', horizon:'Langzeit', due:'', nextAction:'Meine Wünsche an Lage, Größe und Budget aufschreiben.', motivation:'Ich möchte ein Zuhause, das zu meinem Leben passt.', steps:['Bedürfnisse und Standort klären', 'Gesamtbudget und Nebenkosten ermitteln', 'Eigenkapitalziel festlegen', 'Finanzierungsmöglichkeiten prüfen']}
  };
  const template = templates[name];
  if (!template) throw Error('Vorlage nicht gefunden.');
  return normalizeGoal({...template, done:false, completed:'', created:date});
}

export function validateGoalsState(s, fail = () => {throw Error('Ungültige Ziele oder Reflexionen in der Sicherung.');}) {
  if (!s || !unique(s.goals) || !unique(s.beliefs) || !Array.isArray(s.practice) || !Array.isArray(s.reviews) || s.practice.length > 50000 || s.reviews.length > 10000) return fail();
  for (const g of s.goals) {
    if (![g.title,g.motivation,g.nextAction,g.obstacle,g.ifThen].every(text) || !horizons.includes(g.horizon) || !['task','savings'].includes(g.kind) || !money(g.targetCents) || g.targetCents < 0 || (g.kind === 'savings' && !g.targetCents) || (g.kind === 'task' && g.targetCents !== 0) || typeof g.done !== 'boolean' || typeof g.pinned !== 'boolean' || !dateOrEmpty(g.created) || !dateOrEmpty(g.due) || !(g.done ? validDate(g.completed) : g.completed === '') || !validProgress(g.progress) || (g.kind === 'task' && g.progress.length) || !unique(g.milestones)) return fail();
    if (g.done && g.kind === 'savings' && goalSaved(g) < g.targetCents) return fail();
    for (const m of g.milestones) if (!text(m.title) || !m.title.trim() || typeof m.done !== 'boolean' || !(m.done ? validDate(m.completed) : m.completed === '')) return fail();
  }
  const linkedGoal = v => v === '' || id(v) && s.goals.some(g => g.id === v);
  for (const b of s.beliefs) if (![b.text,b.oldThought,b.evidence].every(text) || !b.text.trim() || !linkedGoal(b.goalId) || typeof b.archived !== 'boolean' || !dateOrEmpty(b.created)) return fail();
  const dates = new Set();
  for (const p of s.practice) {
    if (!p || !validDate(p.date) || dates.has(p.date) || !Array.isArray(p.readIds) || new Set(p.readIds).size !== p.readIds.length || p.readIds.some(v => !id(v) || !s.beliefs.some(b => b.id === v)) || !linkedGoal(p.goalId) || !text(p.action) || !text(p.note) || !(p.confidence === null || Number.isInteger(p.confidence) && p.confidence >= 1 && p.confidence <= 5)) return fail();
    dates.add(p.date);
  }
  const weeks = new Set();
  for (const r of s.reviews) {
    if (!r || !validDate(r.week) || weekStart(r.week) !== r.week || weeks.has(r.week) || ![r.wins,r.learned,r.nextStep].every(text)) return fail();
    weeks.add(r.week);
  }
  return s;
}

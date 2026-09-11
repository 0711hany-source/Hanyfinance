import {today, uid, cents} from './model.js';
import {addDays} from './planning.js';
import {horizons, normalizeGoal, goalSaved, goalProgress, goalPlan, addGoalProgress, dailyPractice, markBeliefsRead, weeklySummary, weekStart, goalTemplate} from './goals.js';

export function goalsUI(c) {
  const {esc,eur,icon,input,select,form,openSheet} = c;
  const state = () => c.state();
  const goal = id => state().goals.find(g => g.id === id);
  const belief = id => state().beliefs.find(b => b.id === id);
  const close = () => document.querySelector('#modal').close();
  const label = d => new Date(d+'T12:00:00').toLocaleDateString('de-DE',{day:'numeric',month:'short',year:'numeric'});
  const moneyValue = v => (v/100).toFixed(2).replace('.',',');
  const area = (name,title,value='',placeholder='') => `<label for="${name}">${title}</label><textarea id="${name}" name="${name}" maxlength="2000" placeholder="${esc(placeholder)}">${esc(value)}</textarea>`;
  const section = (title,action='',text='') => `<div class="section-head"><h2>${title}</h2>${action?`<button class="text-button" data-action="${action}">${text}</button>`:''}</div>`;
  let filter='Alle', focusTab='Heute', archivedBeliefs=false, historyLimit=30;
  const activeGoals = () => state().goals.filter(g=>!g.done).sort((a,b)=>Number(b.pinned)-Number(a.pinned)||(a.due||'9999').localeCompare(b.due||'9999'));
  const activeBeliefs = () => state().beliefs.filter(b=>!b.archived);
  const dueText = g => {
    if(g.done) return `Erreicht am ${label(g.completed)}`;
    if(!g.due) return 'Ohne feste Frist';
    const plan=goalPlan(g,today());
    return plan.days===0?'Heute als Zieltermin':plan.days===1?'Zieltermin morgen':plan.overdue?`${Math.abs(plan.days)} ${plan.days===-1?'Tag':'Tage'} über dem Zieltermin`:`Bis ${label(g.due)}`;
  };
  function goalRows(gs) {
    return gs.length?gs.map(g=>`<div class="row goal goal-rich ${g.done?'done':''}" data-goal="${g.id}"><button class="check ${g.done?'done':''}" data-toggle="${g.id}" aria-label="${g.done?'Wieder öffnen':'Als erreicht markieren'}: ${esc(g.title)}">${g.done?icon('check'):''}</button><button class="row-body goal-open" data-g-open="${g.id}"><strong>${g.pinned?'☆ ':''}${esc(g.title)}</strong><small>${g.horizon} · ${dueText(g)}</small>${g.kind==='savings'?`<span class="goal-mini-amount">${eur(goalSaved(g))} <span>von ${eur(g.targetCents)}</span></span>`:g.milestones.length?`<small>${g.milestones.filter(m=>m.done).length} von ${g.milestones.length} Etappen erledigt</small>`:''}${g.kind==='savings'||g.milestones.length?`<span class="goal-meter" role="progressbar" aria-label="Fortschritt ${esc(g.title)}" aria-valuenow="${goalProgress(g)}" aria-valuemin="0" aria-valuemax="100"><span style="width:${goalProgress(g)}%"></span></span>`:''}${g.nextAction&&!g.done?`<span class="goal-next">Als Nächstes: ${esc(g.nextAction)}</span>`:''}</button><button class="tiny goal-chevron" data-g-open="${g.id}" aria-label="Details zu ${esc(g.title)}">›</button></div>`).join(''):'<p class="empty">Hier ist Platz für deinen nächsten Schritt.<br>Lege ein Ziel an oder passe eine Vorlage an.</p>';
  }
  function goals() {
    const open=activeGoals(),done=state().goals.filter(g=>g.done).sort((a,b)=>b.completed.localeCompare(a.completed)),overdue=open.filter(g=>goalPlan(g,today()).overdue).length;
    const rows=filter==='Erreicht'?done:filter==='Alle'?open:open.filter(g=>g.horizon===filter);
    return `<div class="goals-view"><p class="eyebrow">DEINE WÜNSCHE. DEIN WEG.</p><h1>Groß denken.<br>Heute anfangen.</h1><p class="subtitle">Ein klarer Termin, kleine Etappen und ein nächster Schritt, den du selbst beeinflussen kannst.</p><div class="goal-overview"><div><strong>${open.length}</strong><span>offene Ziele</span></div><button data-g-filter="Erreicht"><strong>${done.length} ✓</strong><span>erreicht ansehen</span></button><button data-action="goal-week-review"><strong>${weeklySummary(state(),today()).milestones}</strong><span>Etappen diese Woche</span></button></div><div class="grid2 goal-create"><button class="quick" data-action="new-goal">${icon('plus')} Neues Ziel</button><button class="quick secondary" data-action="goal-templates">Vorlagen entdecken</button></div>${overdue?`<p class="goal-gentle">${overdue} ${overdue===1?'Ziel wartet':'Ziele warten'} auf einen neuen Blick: Passe den Termin oder den nächsten Schritt an.</p>`:''}<div class="tabs goal-tabs">${['Alle',...horizons,'Erreicht'].map(h=>`<button data-g-filter="${h}" class="${h===filter?'active':''}" ${h===filter?'aria-current="true"':''}>${h}</button>`).join('')}</div><div class="card">${goalRows(rows)}</div><p class="swipe-hint">Ziel antippen für Details · nach rechts wischen zum Erledigen</p><button class="card goal-focus-link wide" data-action="focus"><span class="pill">DEIN TÄGLICHER FOKUS</span><h3>Was hilft dir, heute dranzubleiben?</h3><span>Deine Glaubenssätze lesen und Entwicklung festhalten →</span></button><p class="hint">Sparziele dokumentieren deinen Fortschritt separat. Eine Eintragung bewegt kein Geld und verändert keine Kontostände.</p></div>`;
  }
  function templateSheet() {
    openSheet(`<h1 class="sheet-title">Womit möchtest du anfangen?</h1><p class="subtitle">Jede Vorlage öffnet einen Entwurf, den du vor dem Speichern anpassen kannst.</p>${[['room','Bis morgen','Zimmer aufräumen','Eine kleine Aufgabe in machbare Etappen teilen.'],['savings','Bis nächsten Monat','3.000 € sparen','Zielbetrag, Frist und Sparfortschritt planen.'],['car','Bis nächstes Jahr','AMG kaufen','Wunschmodell, Kosten und Kauf vorbereiten.'],['house','Langfristig','Ein Haus kaufen','Bedürfnisse klären und Eigenkapital planen.']].map(([key,time,title,desc])=>`<button class="card goal-template wide" data-g-template="${key}"><span class="pill">${time}</span><h2>${title}</h2><p>${desc}</p><span class="tiny">Vorlage anpassen →</span></button>`).join('')}<p class="hint">Für AMG und Haus legst du dein Budget selbst fest. Sobald du einen Betrag kennst, kannst du daraus ein Sparziel machen.</p>`);
  }
  function goalForm(id, template) {
    const existing=id&&goal(id),g=existing||template||normalizeGoal({title:'',horizon:filter==='Alle'||filter==='Erreicht'?'Tag':filter,due:'',done:false,completed:''});
    const steps=g.milestones.length?g.milestones.map(m=>m.title):g.steps||[];
    openSheet(form(existing?'Ziel bearbeiten':template?'Deine Vorlage anpassen':'Dein neues Ziel',
      input('title','Was möchtest du erreichen?',g.title,'text','required maxlength="200" placeholder="Zum Beispiel: Zimmer bis morgen aufräumen"')+
      select('goal-kind','Wie misst du deinen Fortschritt?',[['task','Aufgabe / Wunsch mit Etappen'],['savings','Sparziel mit einem Betrag']],g.kind)+
      `<div id="goal-money-fields" ${g.kind==='savings'?'':'hidden'}>${input('target','Zielbetrag in €',g.targetCents?moneyValue(g.targetCents):'','text','inputmode="decimal" placeholder="3000,00"')}<p class="hint">Trage nach dem Speichern deinen bereits gesparten Betrag als Fortschritt ein.</p></div>`+
      `<div class="grid2"><div>${select('horizon','Zeithorizont',horizons.map(h=>[h,h]),g.horizon)}</div><div>${input('due','Zieldatum · optional',g.due,'date','min="2000-01-01" max="2200-12-31"')}</div></div>`+
      input('nextAction','Dein nächster kleiner Schritt',g.nextAction,'text','maxlength="300" placeholder="Was kannst du heute konkret tun?"')+
      `<details class="goal-form-details" ${template?'open':''}><summary>Etappen, Motivation und Hindernisse</summary>`+
      area('milestones','Etappen · eine pro Zeile',steps.join('\n'),'Zum Beispiel: Kleidung sortieren\nSchreibtisch freiräumen')+
      `<p class="hint">Erledigte Etappen mit gleichem Text bleiben beim Bearbeiten erhalten.</p>`+
      area('motivation','Warum ist dir dieses Ziel wichtig?',g.motivation)+
      area('obstacle','Welches Hindernis könnte auftauchen?',g.obstacle,'Zum Beispiel: Nach der Arbeit fehlt mir Energie.')+
      area('ifThen','Dein Wenn-dann-Plan',g.ifThen,'Wenn … passiert, dann werde ich …')+
      `</details><label class="goal-checkbox"><input name="pinned" type="checkbox" ${g.pinned?'checked':''}> Im täglichen Fokus bevorzugen</label>`,'Speichern'),f=>{
        const title=f.get('title').trim(),kind=f.get('goal-kind'),targetCents=kind==='savings'?cents(f.get('target')):0;
        if(!title)throw Error('Bitte ein konkretes Ziel eingeben.');
        if(kind==='savings'&&targetCents<=0)throw Error('Bitte einen positiven Zielbetrag eintragen.');
        if(existing?.progress.length&&kind!=='savings')throw Error('Ein Sparziel mit Fortschrittsverlauf bleibt ein Sparziel.');
        const lines=f.get('milestones').split('\n').map(x=>x.trim()).filter(Boolean);
        if(lines.length>50)throw Error('Bitte höchstens 50 Etappen pro Ziel verwenden.');
        const available=[...(existing?.milestones||[])];
        const milestones=lines.map(title=>{const i=available.findIndex(m=>m.title===title);return i<0?{id:uid(),title,done:false,completed:''}:available.splice(i,1)[0];});
        const patch={title,kind,targetCents,horizon:f.get('horizon'),due:f.get('due'),nextAction:f.get('nextAction').trim(),motivation:f.get('motivation').trim(),obstacle:f.get('obstacle').trim(),ifThen:f.get('ifThen').trim(),pinned:f.get('pinned')==='on',milestones};
        const savedId=existing?.id||uid();
        if(c.commit(()=>{if(existing){Object.assign(goal(id),patch);if(goal(id).done&&kind==='savings'&&goalSaved(goal(id))<targetCents){goal(id).done=false;goal(id).completed='';}}else state().goals.push(normalizeGoal({id:savedId,...patch,done:false,completed:'',created:today()}));},'Ziel gespeichert'))goalDetail(savedId);
      });
  }
  function toggleGoal(id) {
    const g=goal(id);if(!g)return false;
    if(!g.done&&g.kind==='savings'&&goalSaved(g)<g.targetCents){c.toast('Trage zuerst den erreichten Sparbetrag ein oder passe dein Ziel an.');return false;}
    return c.commit(()=>{const current=goal(id);current.done=!current.done;current.completed=current.done?today():'';},g.done?'Ziel wieder geöffnet':'Dein Ziel ist erreicht. Gut festgehalten!');
  }
  function goalDetail(id) {
    const g=goal(id);if(!g)return;
    const plan=goalPlan(g,today()),linked=state().beliefs.filter(b=>b.goalId===id&&!b.archived),p=goalProgress(g);
    openSheet(`<div class="goal-detail"><p class="eyebrow">${g.kind==='savings'?'SPARZIEL':'DEIN ZIEL'} · ${g.horizon}</p><h1 class="sheet-title">${esc(g.title)}</h1><p class="subtitle ${plan.overdue?'negative':''}">${dueText(g)}</p>${g.kind==='savings'?`<div class="card goal-savings"><span>Dein dokumentierter Sparstand</span><strong>${eur(plan.saved)}</strong><p>von ${eur(g.targetCents)} · ${p} %</p><div class="goal-meter" role="progressbar" aria-label="Sparfortschritt" aria-valuenow="${p}" aria-valuemin="0" aria-valuemax="100"><span style="width:${p}%"></span></div><div class="goal-savings-meta"><span>Noch offen<strong>${eur(plan.left)}</strong></span><span>${plan.perWeek!==null?'Je Woche bis zum Ziel':'Dein Zieltermin'}<strong>${plan.perWeek!==null?eur(plan.perWeek):plan.overdue?'Neu planen':'Noch offen'}</strong></span></div>${plan.perWeek!==null?`<p class="hint">Gleichmäßig verteilt ab heute: ca. ${eur(plan.perDay)} pro Tag. Teilwochen zählen als eine Sparwoche. Prüfe selbst, ob die Rate zu deinem verfügbaren Geld passt.</p>`:''}<button class="primary" data-g-progress="${id}">Sparfortschritt eintragen</button><p class="hint">Dieser Betrag wird separat verfolgt und verändert kein Konto.</p></div>`:''}${g.nextAction?`<div class="card goal-next-card"><p class="eyebrow">DEIN NÄCHSTER SCHRITT</p><p>${esc(g.nextAction)}</p><button class="tiny" data-g-edit="${id}">Schritt anpassen →</button></div>`:`<button class="quick secondary wide" data-g-edit="${id}">Nächsten kleinen Schritt festlegen →</button>`}${section('Deine Etappen')}<div class="card">${g.milestones.length?g.milestones.map(m=>`<div class="row"><button class="check ${m.done?'done':''}" data-g-milestone="${m.id}" data-g-id="${id}" aria-label="${m.done?'Wieder öffnen':'Erledigen'}: ${esc(m.title)}">${m.done?icon('check'):''}</button><span class="row-body"><strong>${esc(m.title)}</strong>${m.done?`<small>Erledigt am ${label(m.completed)}</small>`:''}</span></div>`).join(''):'<p class="empty">Teile ein großes Ziel in kleine, überprüfbare Etappen.</p>'}<button class="tiny" data-g-edit="${id}">Etappen bearbeiten →</button></div>${g.motivation||g.obstacle||g.ifThen?`<details class="card" open><summary>Dein Warum & dein Plan</summary>${[['Darum ist es mir wichtig',g.motivation],['Mein Hindernis',g.obstacle],['Wenn das passiert, dann …',g.ifThen]].filter(([,v])=>v).map(([t,v])=>`<h3>${t}</h3><p class="goal-prewrap">${esc(v)}</p>`).join('')}</details>`:''}${section('Deine hilfreichen Sätze')}<div class="card">${linked.map(b=>`<button class="goal-linked-belief" data-b-edit="${b.id}">„${esc(b.text)}“</button>`).join('')||'<p class="empty">Welcher glaubwürdige Satz erinnert dich an deinen nächsten Schritt?</p>'}<button class="tiny" data-b-new-goal="${id}">+ Glaubenssatz verknüpfen</button></div><details class="card"><summary>Fortschrittsverlauf ansehen</summary>${goalTimeline(g)}</details><div class="grid2"><button class="quick" data-g-complete="${id}">${g.done?'Wieder öffnen':'Als erreicht markieren'}</button><button class="quick secondary" data-g-edit="${id}">Ziel bearbeiten</button></div><button class="tiny danger" data-g-delete="${id}">Ziel löschen</button></div>`);
  }
  function goalTimeline(g) {
    const events=[...g.progress.map(p=>({date:p.date,title:`${p.amount>0?'+':'−'}${eur(Math.abs(p.amount))}`,body:p.note,id:p.id})),...g.milestones.filter(m=>m.done).map(m=>({date:m.completed,title:'Etappe erledigt',body:m.title})),...state().practice.filter(p=>p.goalId===g.id&&(p.note||p.action)).map(p=>({date:p.date,title:'Tägliche Reflexion',body:[p.action,p.note].filter(Boolean).join(' · ')})),...(g.done?[{date:g.completed,title:'Ziel erreicht',body:g.title}]:[])].sort((a,b)=>b.date.localeCompare(a.date));
    return `<ol class="goal-timeline">${events.map(e=>`<li><time>${label(e.date)}</time><strong>${esc(e.title)}</strong>${e.body?`<p>${esc(e.body)}</p>`:''}${e.id?`<button class="tiny danger" data-g-progress-remove="${e.id}" data-g-id="${g.id}">Eintrag entfernen</button>`:''}</li>`).join('')||'<li class="hint">Hier erscheinen deine Sparbeträge, erledigten Etappen und verknüpften Reflexionen.</li>'}</ol>`;
  }
  function progressForm(id) {
    const g=goal(id);if(!g)return;
    openSheet(form('Sparfortschritt festhalten',`<p class="subtitle">${esc(g.title)} · Aktuell ${eur(goalSaved(g))}</p>`+select('direction','Was hat sich verändert?',[['add','Zusätzlich zurückgelegt'],['take','Wieder entnommen / Korrektur']],'add')+input('amount','Betrag in €','','text','required inputmode="decimal" placeholder="0,00"')+input('date','Wann?',today(),'date',`required max="${today()}"`)+input('note','Notiz · optional','','text','maxlength="300" placeholder="Zum Beispiel: Bereits vorhandenes Erspartes"')+'<p class="hint">Trage die Veränderung ein. Bereits gespartes Geld kannst du einmalig als Startbetrag erfassen. Kontostände bleiben unverändert.</p>'),f=>{
      const amount=cents(f.get('amount'));if(amount<=0)throw Error('Bitte einen positiven Betrag eingeben.');
      if(c.commit(()=>addGoalProgress(goal(id),{id:uid(),date:f.get('date'),amount:f.get('direction')==='take'?-amount:amount,note:f.get('note').trim()},today()),'Sparfortschritt gespeichert'))goalDetail(id);
    });
  }
  function beliefCard(b, readable=false) {
    const read=state().practice.find(p=>p.date===today())?.readIds.includes(b.id),g=b.goalId&&goal(b.goalId);
    return `<article class="card belief-card"><p class="eyebrow">${g?esc(g.title):'DEINE AUSRICHTUNG'}</p><blockquote>„${esc(b.text)}“</blockquote>${b.oldThought||b.evidence?`<details><summary>Gedanke & Erfahrungen</summary>${b.oldThought?`<p><strong>Bisheriger Gedanke</strong><br>${esc(b.oldThought)}</p>`:''}${b.evidence?`<p><strong>Was für meinen neuen Satz spricht</strong><br>${esc(b.evidence)}</p>`:''}</details>`:''}<div class="belief-actions">${readable?`<button class="quick ${read?'secondary':''}" data-b-read="${b.id}" ${read?'disabled':''}>${read?'Heute gelesen ✓':'Bewusst gelesen'}</button>`:''}<button class="tiny" data-b-edit="${b.id}">Bearbeiten</button></div></article>`;
  }
  function focus() {
    return `<div class="goals-view focus-view"><p class="eyebrow">DEIN TÄGLICHER FOKUS</p><h1>Vorstellen.<br>Planen. Dranbleiben.</h1><p class="subtitle">Deine Ziele im Blick, hilfreiche Gedanken zum Lesen und echte Fortschritte zum Wiederfinden.</p><div class="tabs">${['Heute','Glaubenssätze','Entwicklung'].map(tab=>`<button data-focus-tab="${tab}" class="${tab===focusTab?'active':''}">${tab}</button>`).join('')}</div>${focusTab==='Heute'?dailyView():focusTab==='Glaubenssätze'?beliefsView():developmentView()}${scienceNote()}</div>`;
  }
  function dailyView() {
    const practice=state().practice.find(p=>p.date===today()),beliefs=activeBeliefs(),read=beliefs.filter(b=>practice?.readIds.includes(b.id)).length,targets=activeGoals().slice(0,3);
    return `<div class="goal-daily-head"><span class="pill">${new Date().toLocaleDateString('de-DE',{weekday:'long',day:'numeric',month:'long'})}</span><span>${read}/${beliefs.length} Sätze gelesen</span></div>${section('1 · Deinen nächsten Schritt sehen')}<div class="card">${goalRows(targets)}${!targets.length?'<button class="tiny" data-action="new-goal">Mein erstes Ziel anlegen →</button>':''}</div>${section('2 · Deine Sätze bewusst lesen','new-belief','+ Satz')}<p class="hint">Lies langsam und frage dich: Welche kleine Handlung passt heute zu diesem Satz?</p>${beliefs.length?beliefs.map(b=>beliefCard(b,true)).join(''):`<div class="card belief-empty"><p>„Ich kann heute einen kleinen Schritt machen, auch wenn noch nicht alles leicht ist.“</p><span class="hint">Ein Formulierungsbeispiel. Speichere deinen eigenen Satz, der sich für dich glaubwürdig anfühlt.</span><button class="primary" data-action="new-belief">Meinen Glaubenssatz schreiben</button></div>`}${beliefs.length>1?`<button class="quick secondary wide" data-action="read-all-beliefs" ${read===beliefs.length?'disabled':''}>${read===beliefs.length?'Alle heutigen Sätze gelesen ✓':'Alle oben gezeigten Sätze als gelesen markieren'}</button>`:''}${section('3 · Eine echte Erfahrung festhalten')}<div class="card goal-next-card"><h3>${practice?.note?'Dein heutiger Eintrag':'Was hast du heute beobachtet oder geschafft?'}</h3><p>${practice?.note?esc(practice.note):'Ein kleiner Beleg hilft dir, deine Entwicklung später wiederzusehen.'}</p>${practice?.action?`<p class="hint">Dein Schritt: ${esc(practice.action)}</p>`:''}<button class="primary" data-action="goal-daily">${practice?.note||practice?.action?'Heutigen Eintrag bearbeiten':'Heutigen Eintrag schreiben'}</button></div><button class="quick secondary wide" data-action="goal-week-review">Diese Woche bewusst abschließen →</button>`;
  }
  function beliefsView() {
    const rows=state().beliefs.filter(b=>b.archived===archivedBeliefs);
    return section(archivedBeliefs?'Archivierte Sätze':'Deine persönlichen Sätze','new-belief','+ Neu')+`<p class="subtitle">Formuliere etwas Freundliches, Konkretes und Glaubwürdiges. Du kannst jeden Satz mit einem Ziel verbinden.</p><button class="tiny" data-action="beliefs-archive">${archivedBeliefs?'Aktive Sätze ansehen':'Archiv ansehen'}</button>${rows.map(b=>beliefCard(b)).join('')||'<div class="card"><p class="empty">Noch keine Sätze in dieser Ansicht.</p></div>'}<div class="card"><h3>Von einem Gedanken zu einer Handlung</h3><p class="hint">Bisher: „Ich bin schlecht mit Geld.“<br>Hilfreicher: „Ich lerne, mein Geld zu überblicken, indem ich heute meine Ausgaben erfasse.“<br>Erfahrung: „Diese Woche habe ich drei Tage eingetragen.“</p></div>`;
  }
  function beliefForm(id, goalId='') {
    const b=id&&belief(id),g=goalId&&goal(goalId);
    openSheet(form(b?'Glaubenssatz bearbeiten':'Dein hilfreicher Glaubenssatz',area('belief-text','Dein Satz zum täglichen Lesen',b?.text||'','Ich kann …, indem ich heute …')+select('goalId','Mit einem Ziel verbinden',[['','Kein bestimmtes Ziel'],...state().goals.map(g=>[g.id,g.title])],b?.goalId||goalId)+area('oldThought','Bisheriger hinderlicher Gedanke · optional',b?.oldThought||'')+area('evidence','Welche Erfahrungen stützen deinen neuen Satz?',b?.evidence||'','Auch kleine, konkrete Beispiele zählen.')+`<p class="hint">${g?`Für „${esc(g.title)}“: `:''}Wähle einen Satz, der zu deinem Handeln passt. Du kannst ihn später ändern oder archivieren.</p>${b?`<button type="button" class="tiny" data-b-archive="${b.id}">${b.archived?'Wieder täglich anzeigen':'Satz archivieren'}</button>`:''}`),f=>{
      const text=f.get('belief-text').trim();if(!text)throw Error('Bitte deinen hilfreichen Satz eingeben.');
      const patch={text,goalId:f.get('goalId'),oldThought:f.get('oldThought').trim(),evidence:f.get('evidence').trim()};
      if(c.commit(()=>{if(b)Object.assign(belief(id),patch);else state().beliefs.push({id:uid(),...patch,archived:false,created:today()});},'Glaubenssatz gespeichert'))close();
    });
  }
  function dailyForm(date=today()) {
    const p=state().practice.find(p=>p.date===date),targets=activeGoals(),defaultGoal=p?.goalId||targets[0]?.id||'',g=defaultGoal&&goal(defaultGoal);
    openSheet(form(`Dein Eintrag · ${label(date)}`,select('goalId','Worum geht es heute?',[['','Mein Tag allgemein'],...state().goals.map(g=>[g.id,g.title])],defaultGoal)+area('action','Mein konkreter Schritt',p?.action||g?.nextAction||'','Was habe ich vor oder bereits getan?')+area('note','Meine Erfahrung / mein Fortschritt',p?.note||'','Was habe ich wirklich getan? Was war schwierig? Was hilft beim nächsten Versuch?')+select('confidence','Wie zuversichtlich fühle ich mich?',[['','Keine Angabe'],['1','1 · Gerade wenig'],['2','2 · Eher wenig'],['3','3 · Gemischt'],['4','4 · Eher zuversichtlich'],['5','5 · Sehr zuversichtlich']],p?.confidence?String(p.confidence):'')+'<p class="hint">Deine persönliche Einschätzung ist kein Leistungstest. Ein schwieriger Tag darf genauso hier stehen wie ein Erfolg.</p>'),f=>{
      if(c.commit(()=>Object.assign(dailyPractice(state(),date),{goalId:f.get('goalId'),action:f.get('action').trim(),note:f.get('note').trim(),confidence:f.get('confidence')?Number(f.get('confidence')):null}),'Täglicher Eintrag gespeichert'))close();
    });
  }
  function weekReview(date=today()) {
    const summary=weeklySummary(state(),date),r=state().reviews.find(r=>r.week===summary.start);
    openSheet(form('Dein Wochenrückblick',`<p class="subtitle">${label(summary.start)} – ${label(summary.end)}</p><div class="goal-week-summary"><span><strong>${summary.goals}</strong> Ziele erreicht</span><span><strong>${summary.milestones}</strong> Etappen erledigt</span><span><strong>${summary.days}</strong> Tage reflektiert / gelesen</span></div>`+area('wins','Was ist mir gelungen?',r?.wins||'','Auch kleine Schritte zählen.')+area('learned','Was habe ich gelernt oder möchte ich anpassen?',r?.learned||'')+area('nextStep','Mein wichtigster Schritt für die nächste Woche',r?.nextStep||'')),f=>{
      if(c.commit(()=>{const patch={wins:f.get('wins').trim(),learned:f.get('learned').trim(),nextStep:f.get('nextStep').trim()},existing=state().reviews.find(r=>r.week===summary.start);if(existing)Object.assign(existing,patch);else state().reviews.push({week:summary.start,...patch});},'Wochenrückblick gespeichert'))close();
    });
  }
  function developmentView() {
    const all=[...state().practice].sort((a,b)=>b.date.localeCompare(a.date)),days=Array.from({length:7},(_,i)=>addDays(today(),i-6)),summary=weeklySummary(state(),today()),ratings=all.filter(p=>p.confidence!==null).slice(0,14).reverse();
    return `<div class="card"><h2>Deine letzten sieben Tage</h2><div class="goal-day-strip">${days.map(d=>{const p=state().practice.find(p=>p.date===d),active=p&&(p.readIds.length||p.note||p.action||p.confidence!==null);return `<button class="${active?'active':''}" data-practice-date="${d}" aria-label="${label(d)}: ${active?'Eintrag vorhanden':'Kein Eintrag'}"><span>${new Date(d+'T12:00:00').toLocaleDateString('de-DE',{weekday:'short'})}</span><strong>${active?'✓':'·'}</strong></button>`}).join('')}</div><p class="hint">Jeder markierte Tag enthält einen gelesenen Satz oder einen persönlichen Eintrag. Pausen setzen nichts zurück.</p></div><div class="goal-overview"><div><strong>${all.filter(p=>p.readIds.length).length}</strong><span>Tage gelesen</span></div><div><strong>${state().goals.filter(g=>g.done).length}</strong><span>Ziele erreicht</span></div><div><strong>${summary.milestones}</strong><span>Etappen diese Woche</span></div></div>${ratings.length?`<div class="card"><h2>Deine Zuversicht im Verlauf</h2><p class="hint">Letzte ${ratings.length} Einschätzungen · Skala von 1 bis 5 · persönliche Momentaufnahmen</p><div class="goal-confidence-chart">${ratings.map(p=>`<button data-practice-date="${p.date}" aria-label="${label(p.date)}: Zuversicht ${p.confidence} von 5"><span style="height:${p.confidence*16}px"><b>${p.confidence}</b></span><small>${new Date(p.date+'T12:00:00').toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit'})}</small></button>`).join('')}</div></div>`:''}${section('Deine täglichen Einträge')}<div class="card">${all.slice(0,historyLimit).map(p=>`<button class="goal-history-row" data-practice-date="${p.date}"><time>${label(p.date)}</time><strong>${esc(p.note||p.action||'Meine Sätze bewusst gelesen')}</strong><small>${p.readIds.length} Sätze gelesen${p.confidence===null?'':` · Zuversicht ${p.confidence}/5`}</small></button>`).join('')||'<p class="empty">Deine Entwicklung wird sichtbar, sobald du erste Einträge festhältst.</p>'}</div>${all.length>historyLimit?'<button class="quick secondary wide" data-action="more-goal-history">Weitere Einträge anzeigen</button>':''}${section('Deine Wochenrückblicke','goal-week-review','+ Diese Woche')}<div class="card">${[...state().reviews].sort((a,b)=>b.week.localeCompare(a.week)).map(r=>`<button class="goal-history-row" data-review-week="${r.week}"><time>Woche ab ${label(r.week)}</time><strong>${esc(r.wins||r.learned||'Mein Wochenrückblick')}</strong>${r.nextStep?`<small>Nächster Schritt: ${esc(r.nextStep)}</small>`:''}</button>`).join('')||'<p class="empty">Nimm dir einmal pro Woche Zeit: Was klappt, was passt du an?</p>'}</div>${Object.keys(state().journals).length?`<details class="card"><summary>Frühere Check-ins aus Hany / Klar</summary>${Object.entries(state().journals).sort(([a],[b])=>b.localeCompare(a)).map(([d,j])=>`<button class="goal-history-row" data-journal="${d}"><time>${label(d)}</time><strong>${esc(j.wish||'Mein Check-in')}</strong><small>${j.done?'Abgeschlossen':'Entwurf'}</small></button>`).join('')}</details>`:''}`;
  }
  function practiceDetail(date) {
    const p=state().practice.find(p=>p.date===date);
    if(!p){if(date===today())dailyForm(date);else c.toast('Für diesen Tag ist kein Eintrag vorhanden.');return;}
    openSheet(`<h1 class="sheet-title">${label(date)}</h1>${p.goalId?`<p class="subtitle">${esc(goal(p.goalId)?.title||'')}</p>`:''}${p.action?`<div class="card"><h3>Mein Schritt</h3><p class="goal-prewrap">${esc(p.action)}</p></div>`:''}${p.note?`<div class="card"><h3>Meine Erfahrung</h3><p class="goal-prewrap">${esc(p.note)}</p></div>`:''}${p.confidence!==null?`<p>Meine Zuversicht: <strong>${p.confidence} / 5</strong></p>`:''}<h2>An diesem Tag gelesen</h2>${p.readIds.map(id=>`<blockquote class="card belief-history">„${esc(belief(id)?.text||'')}“</blockquote>`).join('')||'<p class="hint">Keine Sätze als gelesen markiert.</p>'}<p class="hint">Glaubenssätze werden hier in ihrer aktuellen Formulierung angezeigt.</p><button class="primary" data-practice-edit="${date}">Eintrag bearbeiten</button>`);
  }
  function scienceNote() {
    return `<details class="card goal-science"><summary>Wie diese Praxis gedacht ist</summary><p>Stelle dir dein gewünschtes Ergebnis vor. Benenne dann ein reales Hindernis und einen konkreten Wenn-dann-Plan. Diese Struktur orientiert sich an WOOP (Wunsch, Ergebnis, Hindernis, Plan).</p><p>Nutze Glaubenssätze als glaubwürdige Erinnerung an dein Handeln. Überprüfe sie anhand deiner Erfahrungen und passe sie an, wenn sie sich unpassend anfühlen.</p><p>Gedanken allein garantieren weder Geld noch einen bestimmten Erfolg. Joe Dispenza und Napoleon Hill sind Inspirationsquellen; Aussagen über das Anziehen von Ereignissen werden hier nicht als wissenschaftliche Tatsachen dargestellt.</p><p><a href="https://woopmylife.org/en/science" target="_blank" rel="noopener">WOOP: Forschung und Methode ↗</a></p></details>`;
  }
  function deleteGoal(id) {
    const g=goal(id);if(!g)return;
    openSheet(`<h1 class="sheet-title">Ziel löschen?</h1><p class="subtitle">${esc(g.title)}</p><p class="hint">Das Ziel und sein Spar- und Etappenverlauf werden gelöscht. Deine Glaubenssätze und täglichen Reflexionen bleiben erhalten; nur ihre Verknüpfung zum Ziel entfällt.</p><button class="primary" data-g-delete-confirm="${id}">Ziel jetzt löschen</button>`);
  }
  const actions={
    'new-goal':()=>goalForm(),'goal-templates':templateSheet,'new-belief':()=>beliefForm(),
    'goal-daily':()=>dailyForm(),'goal-week-review':()=>weekReview(),
    'read-all-beliefs':()=>c.commit(()=>markBeliefsRead(state(),activeBeliefs().map(b=>b.id),today()),'Dein Lesemoment ist festgehalten'),
    'beliefs-archive':()=>{archivedBeliefs=!archivedBeliefs;c.render();},
    'more-goal-history':()=>{historyLimit+=30;c.render();}
  };
  function click(d) {
    if(d.gFilter){filter=d.gFilter;c.render();}
    if(d.focusTab){focusTab=d.focusTab;c.render();}
    if(d.gTemplate)goalForm(null,goalTemplate(d.gTemplate,today()));
    if(d.gOpen)goalDetail(d.gOpen);
    if(d.gEdit)goalForm(d.gEdit);
    if(d.gProgress)progressForm(d.gProgress);
    if(d.gComplete&&toggleGoal(d.gComplete))goalDetail(d.gComplete);
    if(d.gMilestone){if(c.commit(()=>{const m=goal(d.gId)?.milestones.find(m=>m.id===d.gMilestone);if(!m)throw Error('Etappe nicht gefunden.');m.done=!m.done;m.completed=m.done?today():'';},'Etappe aktualisiert'))goalDetail(d.gId);}
    if(d.gProgressRemove){const g=goal(d.gId),p=g?.progress.find(p=>p.id===d.gProgressRemove);if(p)openSheet(`<h1 class="sheet-title">Spar-Eintrag entfernen?</h1><p class="subtitle">${label(p.date)} · ${eur(p.amount)}</p><p class="hint">Dein Sparstand wird neu berechnet. Ein erreichtes Ziel wird bei Bedarf wieder geöffnet. Kontobuchungen bleiben unverändert.</p><button class="primary" data-g-progress-confirm="${p.id}" data-g-id="${g.id}">Eintrag entfernen</button>`);}
    if(d.gProgressConfirm){if(c.commit(()=>{const g=goal(d.gId);g.progress=g.progress.filter(p=>p.id!==d.gProgressConfirm);if(g.done&&goalSaved(g)<g.targetCents){g.done=false;g.completed='';}},'Eintrag entfernt'))goalDetail(d.gId);}
    if(d.bNewGoal)beliefForm(null,d.bNewGoal);
    if(d.bEdit)beliefForm(d.bEdit);
    if(d.bRead)c.commit(()=>markBeliefsRead(state(),[d.bRead],today()),'Für heute als gelesen festgehalten');
    if(d.bArchive){if(c.commit(()=>{const b=belief(d.bArchive);b.archived=!b.archived;},'Glaubenssatz aktualisiert'))close();}
    if(d.practiceDate)practiceDetail(d.practiceDate);
    if(d.practiceEdit)dailyForm(d.practiceEdit);
    if(d.reviewWeek)weekReview(addDays(d.reviewWeek,6)<today()?addDays(d.reviewWeek,6):today());
    if(d.gDelete)deleteGoal(d.gDelete);
    if(d.gDeleteConfirm){const snapshot=structuredClone({goals:state().goals,beliefs:state().beliefs,practice:state().practice});if(c.commit(()=>{state().goals=state().goals.filter(g=>g.id!==d.gDeleteConfirm);for(const b of state().beliefs)if(b.goalId===d.gDeleteConfirm)b.goalId='';for(const p of state().practice)if(p.goalId===d.gDeleteConfirm)p.goalId='';})){close();c.toast('Ziel gelöscht',()=>c.commit(()=>Object.assign(state(),snapshot),'Ziel wiederhergestellt'));}}
  }
  function change(e) {if(e.target.id==='goal-kind'){const fields=document.querySelector('#goal-money-fields');if(fields)fields.hidden=e.target.value!=='savings';}}
  return {goals,focus,goalForm,goalDetail,toggleGoal,goalRows,actions,click,change};
}

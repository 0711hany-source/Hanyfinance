// Local-only data helpers. Money always leaves this module as integer cents.
export const DATA_LIMITS = Object.freeze({backupBytes:5*1024*1024,envelopeBytes:8*1024*1024,csvBytes:2*1024*1024,rows:10000,columns:100,cell:16000});
const ENVELOPE='hany-encrypted-backup', ITERATIONS=600000;
const encoder=new TextEncoder(),decoder=new TextDecoder('utf-8',{fatal:true});
const bytes=s=>encoder.encode(s);
const cryptoAPI=()=>{if(!globalThis.crypto?.subtle)throw Error('Verschlüsselung benötigt HTTPS oder die installierte App.');return globalThis.crypto;};
const checkText=(s,max)=>{if(typeof s!=='string'||s.length>max||bytes(s).length>max)throw Error('Datei ist zu groß oder enthält keinen lesbaren Text.');};
const toBase64=a=>{let s='';for(let i=0;i<a.length;i+=8192)s+=String.fromCharCode(...a.subarray(i,i+8192));return btoa(s);};
const fromBase64=s=>{if(typeof s!=='string'||s.length>DATA_LIMITS.envelopeBytes||!s.length||s.length%4!==0||!/^[A-Za-z0-9+/]*={0,2}$/.test(s))throw Error('Beschädigte verschlüsselte Sicherung.');const a=Uint8Array.from(atob(s),c=>c.charCodeAt(0));if(toBase64(a)!==s)throw Error('Beschädigte verschlüsselte Sicherung.');return a;};
async function keyFor(password,salt){
  if(typeof password!=='string'||password.length<10||password.length>1024)throw Error('Bitte ein Passwort mit mindestens 10 und höchstens 1.024 Zeichen verwenden.');
  const c=cryptoAPI(),material=await c.subtle.importKey('raw',bytes(password),'PBKDF2',false,['deriveKey']);
  return c.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt,iterations:ITERATIONS},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
export async function encryptBackup(state,password){
  const plain=JSON.stringify(state);checkText(plain,DATA_LIMITS.backupBytes);
  const c=cryptoAPI(),salt=c.getRandomValues(new Uint8Array(16)),iv=c.getRandomValues(new Uint8Array(12)),key=await keyFor(password,salt);
  const data=await c.subtle.encrypt({name:'AES-GCM',iv,additionalData:bytes(`${ENVELOPE}:1`)},key,bytes(plain));
  return JSON.stringify({format:ENVELOPE,version:1,kdf:'PBKDF2-SHA-256',iterations:ITERATIONS,cipher:'AES-256-GCM',salt:toBase64(salt),iv:toBase64(iv),data:toBase64(new Uint8Array(data))},null,2);
}
export function isEncryptedBackup(raw){return raw?.format===ENVELOPE;}
export async function decryptBackup(envelope,password){
  if(typeof envelope==='string'){checkText(envelope,DATA_LIMITS.envelopeBytes);try{envelope=JSON.parse(envelope)}catch{throw Error('Die Sicherung ist kein gültiger JSON-Text.');}}
  if(!envelope||envelope.format!==ENVELOPE||envelope.version!==1||envelope.kdf!=='PBKDF2-SHA-256'||envelope.iterations!==ITERATIONS||envelope.cipher!=='AES-256-GCM')throw Error('Unbekanntes oder beschädigtes Sicherungsformat.');
  const salt=fromBase64(envelope.salt),iv=fromBase64(envelope.iv),data=fromBase64(envelope.data);
  if(salt.length!==16||iv.length!==12||data.length<17||data.length>DATA_LIMITS.backupBytes+16)throw Error('Beschädigte verschlüsselte Sicherung.');
  const key=await keyFor(password,salt);
  try{const plain=await cryptoAPI().subtle.decrypt({name:'AES-GCM',iv,additionalData:bytes(`${ENVELOPE}:1`)},key,data);return JSON.parse(decoder.decode(plain));}catch{throw Error('Passwort falsch oder Sicherung beschädigt. Deine Daten bleiben erhalten.');}
}
export async function readBackup(text,password,migrate){
  checkText(text,DATA_LIMITS.envelopeBytes);let raw;try{raw=JSON.parse(text)}catch{throw Error('Keine gültige Hany-Sicherung.');}
  const parsed=isEncryptedBackup(raw)?await decryptBackup(raw,password):raw;
  return migrate(parsed);
}

export function parseCSV(text,delimiter='auto'){
  checkText(text,DATA_LIMITS.csvBytes);text=text.replace(/^\uFEFF/,'');
  if(delimiter==='auto'){
    const counts={';':0,',':0,'\t':0};let quote=false;
    for(let i=0;i<text.length;i++){const ch=text[i];if(ch==='"'){if(quote&&text[i+1]==='"'){i++;continue}quote=!quote;}else if(!quote){if(ch==='\n'||ch==='\r')break;if(ch in counts)counts[ch]++;}}
    delimiter=Object.keys(counts).sort((a,b)=>counts[b]-counts[a])[0];
    if(!counts[delimiter])throw Error('Keine CSV-Spalten erkannt. Bitte Trennzeichen prüfen.');
  }
  if(![';',',','\t'].includes(delimiter))throw Error('Unbekanntes Trennzeichen.');
  const records=[];let row=[],cell='',quoted=false,closed=false;
  const pushCell=()=>{row.push(cell);cell='';closed=false;if(row.length>DATA_LIMITS.columns)throw Error('Die CSV-Datei hat zu viele Spalten.');};
  const pushRow=()=>{pushCell();if(row.some(x=>x.trim()))records.push(row);row=[];if(records.length>DATA_LIMITS.rows+1)throw Error('Bitte höchstens 10.000 Buchungen pro Datei importieren.');};
  for(let i=0;i<text.length;i++){
    const ch=text[i];
    if(quoted){if(ch==='"'){if(text[i+1]==='"'){cell+='"';i++}else{quoted=false;closed=true}}else cell+=ch;}
    else if(ch===delimiter)pushCell();
    else if(ch==='\n'||ch==='\r'){if(ch==='\r'&&text[i+1]==='\n')i++;pushRow();}
    else if(ch==='"'){if(cell.length||closed)throw Error('Ungültige Anführungszeichen in der CSV-Datei.');quoted=true;}
    else if(closed){if(!/\s/.test(ch))throw Error('Unerwarteter Text hinter einem CSV-Anführungszeichen.');}
    else cell+=ch;
    if(cell.length>DATA_LIMITS.cell)throw Error('Eine CSV-Zelle ist zu lang.');
  }
  if(quoted)throw Error('Ein Anführungszeichen in der CSV-Datei wurde nicht geschlossen.');
  if(cell.length||row.length||closed)pushRow();
  if(records.length<2)throw Error('Die Datei benötigt eine Kopfzeile und mindestens eine Buchung.');
  return {delimiter,headers:records[0].map(x=>x.trim()),rows:records.slice(1)};
}
export function parseBankDate(raw){
  const s=String(raw??'').trim();let date;
  if(/^\d{4}-\d{2}-\d{2}$/.test(s))date=s;
  else {const m=/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(s);if(m)date=`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;}
  if(!date||date<'1900-01-01'||date>'2100-12-31'||isNaN(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date)throw Error('Datum als TT.MM.JJJJ oder JJJJ-MM-TT erforderlich.');
  return date;
}
export function parseBankAmount(raw,locale='auto'){
  if(!['auto','de','international'].includes(locale))throw Error('Unbekanntes Zahlenformat.');
  let s=String(raw??'').trim().replace(/^(?:EUR|€)\s*/i,'').replace(/\s*(?:EUR|€)$/i,'').trim(),sign=1;
  if(/^\(.*\)$/.test(s)){sign=-1;s=s.slice(1,-1).trim();if(/[+\-]/.test(s))throw Error('Mehrdeutiges Vorzeichen.');}
  else if(/^[+\-]/.test(s)){sign=s[0]==='-'?-1:1;s=s.slice(1);}
  else if(s.endsWith('-')){sign=-1;s=s.slice(0,-1);}
  if(/[+\-()]/.test(s)||!s)throw Error('Ungültiger Betrag.');
  if(/[ \u00a0\u202f]/.test(s)){
    if(!/^\d{1,3}(?:[ \u00a0\u202f]\d{3})+(?:[,.]\d{1,2})?$/.test(s))throw Error('Tausenderabstände im Betrag prüfen.');
    s=s.replace(/[ \u00a0\u202f]/g,'');
  }
  let decimal;
  if(locale==='de')decimal=',';else if(locale==='international')decimal='.';
  else if(s.includes(',')&&s.includes('.'))decimal=s.lastIndexOf(',')>s.lastIndexOf('.')?',':'.';
  else if(s.includes(',')||s.includes('.')){
    const sep=s.includes(',')?',':'.',parts=s.split(sep);
    if(parts.length===2&&parts[1].length===3)throw Error('Mehrdeutiger Betrag. Deutsches oder internationales Zahlenformat wählen.');
    decimal=parts.length===2?sep:(sep===','?'.':',');
  }else decimal='.';
  const group=decimal===','?'.':',',escaped=group==='.'?'\\.':',',decEscaped=decimal==='.'?'\\.':',';
  const pattern=new RegExp(`^(?:\\d+|\\d{1,3}(?:${escaped}\\d{3})+)(?:${decEscaped}\\d{1,2})?$`);
  if(!pattern.test(s))throw Error('Betrag oder Zahlenformat prüfen (maximal zwei Nachkommastellen).');
  const normalized=s.split(group).join('').replace(decimal,'.'),[whole,fraction='']=normalized.split('.');
  const amount=sign*(Number(whole)*100+Number(fraction.padEnd(2,'0')));
  if(!Number.isSafeInteger(amount)||!amount||Math.abs(amount)>1e12)throw Error('Betrag muss ungleich null und im gültigen Bereich sein.');
  return amount;
}
const normalized=s=>String(s??'').normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase('de-DE');
export function bankKey(t){return JSON.stringify([t.account,t.date,t.type==='income'?t.amount:-t.amount,normalized(t.note)]);}
const referenceKey=t=>{const ref=normalized(t.bankReference);return ref&&!['-','n/a','notprovided','not provided','nonref'].includes(ref)?JSON.stringify([t.account,ref]):null;};
export function guessCSVMapping(headers){
  const names=headers.map(x=>normalized(x).replace(/[ä]/g,'a').replace(/[ü]/g,'u').replace(/[ö]/g,'o'));
  const find=terms=>{let found=names.findIndex(n=>terms.includes(n));if(found===-1)found=names.findIndex(n=>terms.some(t=>n.startsWith(t+' ')||n.startsWith(t+' (')));return String(found);};
  return {date:find(['buchungstag','buchungsdatum','datum','date','booking date']),amount:find(['betrag','amount','umsatz','betrag in eur']),note:find(['verwendungszweck','beschreibung','buchungstext','description','notiz','purpose','empfanger']),category:find(['kategorie','category']),reference:find(['transaktions-id','transaktionsid','transaction id'])};
}
export function previewCSV(parsed,mapping,{account,existing=[],locale='auto',today}={}){
  if(!account)throw Error('Bitte ein Zielkonto auswählen.');
  const index=key=>Number(mapping[key]??-1),required=['date','amount','note'].map(index);
  if(required.some(i=>!Number.isInteger(i)||i<0||i>=parsed.headers.length)||new Set(required).size!==3)throw Error('Datum, Betrag und Beschreibung müssen drei unterschiedliche Spalten sein.');
  for(const key of ['category','reference'])if(!Number.isInteger(index(key))||index(key)<-1||index(key)>=parsed.headers.length)throw Error('Optionale Spaltenzuordnung prüfen.');
  const keys=new Set(existing.filter(t=>t.account===account).map(bankKey)),refs=new Set(existing.filter(t=>t.account===account).map(referenceKey).filter(Boolean));
  const fileKeys=new Set(),fileRefs=new Set();
  const rows=parsed.rows.map((cells,i)=>{
    try{
      if(cells.length!==parsed.headers.length)throw Error('Anzahl der Spalten stimmt nicht mit der Kopfzeile überein.');
      const date=parseBankDate(cells[index('date')]);if(today&&date>today)throw Error('Zukünftige Buchung: bitte als Zahlungsplan erfassen.');
      const signed=parseBankAmount(cells[index('amount')],locale),note=cells[index('note')].trim(),category=index('category')>=0?cells[index('category')].trim():'Import',bankReference=index('reference')>=0?cells[index('reference')].trim():'';
      if(note.length>2000||category.length>100||bankReference.length>200)throw Error('Beschreibung, Kategorie oder Referenz ist zu lang.');
      const transaction={account,date,amount:Math.abs(signed),type:signed>0?'income':'expense',note,category:category||'Import',...(bankReference?{bankReference}:{}),source:'csv'};
      const key=bankKey(transaction),ref=referenceKey(transaction),duplicate=keys.has(key)||ref&&refs.has(ref)?'Bereits in Hany':fileKeys.has(key)||ref&&fileRefs.has(ref)?'Doppelt in Datei':'';
      fileKeys.add(key);if(ref)fileRefs.add(ref);
      return {index:i,line:i+2,valid:true,selected:!duplicate,duplicate,transaction};
    }catch(error){return {index:i,line:i+2,valid:false,selected:false,error:error.message};}
  });
  return {rows,valid:rows.filter(x=>x.valid).length,invalid:rows.filter(x=>!x.valid).length,duplicates:rows.filter(x=>x.duplicate).length};
}

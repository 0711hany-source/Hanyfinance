import test from 'node:test';
import assert from 'node:assert/strict';
import {DATA_LIMITS,encryptBackup,decryptBackup,readBackup,isEncryptedBackup,parseCSV,parseBankDate,parseBankAmount,guessCSVMapping,previewCSV} from '../data-tools.js';

test('encrypted backup round trip, fresh salt and IV, and authenticated payload',async()=>{
  const state={version:3,accounts:[{id:'bank',name:'Girokonto ÄÖÜ'}],note:'Privat ✨'},password='Ein langes privates Passwort!';
  const first=JSON.parse(await encryptBackup(state,password)),second=JSON.parse(await encryptBackup(state,password));
  assert.equal(isEncryptedBackup(first),true);assert.equal(first.iterations,600000);assert.notEqual(first.salt,second.salt);assert.notEqual(first.iv,second.iv);assert.notEqual(first.data,second.data);
  assert.deepEqual(await decryptBackup(first,password),state);
  assert.equal(JSON.stringify(first).includes('Girokonto'),false);
  await assert.rejects(decryptBackup(first,'Falsches Passwort!'),/Passwort falsch/);
  const cipher=Buffer.from(first.data,'base64');cipher[0]^=1;
  await assert.rejects(decryptBackup({...first,data:cipher.toString('base64')},password),/Passwort falsch/);
});
test('encrypted backup refuses unknown versions, KDF abuse, short passwords and malformed encoding',async()=>{
  const envelope=JSON.parse(await encryptBackup({version:2},'mindestens-zehn-Zeichen'));
  for(const change of [{version:2},{iterations:1e12},{cipher:'AES-CBC'},{salt:'AA=='},{iv:'not-base64'},{data:''}])await assert.rejects(decryptBackup({...envelope,...change},'mindestens-zehn-Zeichen'));
  await assert.rejects(encryptBackup({},'kurz'),/mindestens 10/);
  await assert.rejects(decryptBackup('{kaputt','1234567890'),/JSON/);
});
test('restore migrates only successfully read state and keeps plaintext support',async()=>{
  let calls=0;const migrate=raw=>{calls++;if(raw.version!==1)throw Error('invalid state');return {...raw,version:2};};
  assert.deepEqual(await readBackup('{"version":1}','',migrate),{version:2});
  const encrypted=await encryptBackup({version:1},'sicheres Passwort');
  assert.deepEqual(await readBackup(encrypted,'sicheres Passwort',migrate),{version:2});
  await assert.rejects(readBackup(encrypted,'falsches Passwort',migrate));assert.equal(calls,2);
  await assert.rejects(readBackup('{"version":99}','',migrate),/invalid state/);
  await assert.rejects(readBackup('x'.repeat(DATA_LIMITS.envelopeBytes+1),'',migrate),/groß/);
});
test('CSV supports BOM, quoted delimiters, multiline notes, escaped quotes and CRLF',()=>{
  const csv=parseCSV('\uFEFFDatum;Betrag;Beschreibung\r\n10.09.2026;"-1.234,56";"Miete; \"\"September\"\"\r\n2. Zeile"\r\n');
  assert.equal(csv.delimiter,';');assert.deepEqual(csv.headers,['Datum','Betrag','Beschreibung']);
  assert.deepEqual(csv.rows,[['10.09.2026','-1.234,56','Miete; "September"\r\n2. Zeile']]);
  assert.equal(parseCSV('Date,Amount,Description\n2026-09-10,"1,234.56","New, account"').delimiter,',');
  assert.equal(parseCSV('Date\tAmount\tDescription\n2026-09-10\t1.20\tTest').delimiter,'\t');
});
test('CSV parser rejects malformed quoting and input limits',()=>{
  for(const raw of ['a;b\n"unfinished;1','a;b\nx"y;1','a;b\n"x"junk;1','a;b\n'+('x'.repeat(DATA_LIMITS.cell+1))+';1'])assert.throws(()=>parseCSV(raw));
  assert.throws(()=>parseCSV('x'.repeat(DATA_LIMITS.csvBytes+1)),/groß/);
  assert.throws(()=>parseCSV('date\n2026-01-01'),/Spalten/);
  assert.throws(()=>parseCSV('a;b\n'+Array(DATA_LIMITS.rows+1).fill('1;2').join('\n')),/10.000/);
});
test('bank amounts preserve exact cents across German and international formats',()=>{
  for(const [input,expected] of [['1.234,56',123456],['1,234.56',123456],['-12,50',-1250],['€ 12,50',1250],['12.50 EUR',1250],['(12,50)',-1250],['12,50-',-1250],['+0,29',29],['1 234,56',123456],['1\u202f234.56',123456],['1.234.567',123456700],['1,234,567',123456700]])assert.equal(parseBankAmount(input),expected,input);
  assert.equal(parseBankAmount('1.234','de'),123400);assert.equal(parseBankAmount('1,234','international'),123400);
});
test('ambiguous and unsupported bank amounts are rejected without silent rounding',()=>{
  for(const input of ['1.234','1,234','0','0,00','123.4567','12.34,56','1e3','Infinity','12 USD','12 34','(−12)','--12','-12-','(12)-','1,','1.234,567'])assert.throws(()=>parseBankAmount(input),input);
  assert.throws(()=>parseBankAmount('1.20','de'));
  assert.throws(()=>parseBankAmount('99999999999999'));
});
test('bank dates validate leap years and reject ambiguous dates',()=>{
  assert.equal(parseBankDate('1.9.2026'),'2026-09-01');assert.equal(parseBankDate('2024-02-29'),'2024-02-29');
  for(const value of ['29.02.2026','2026-02-30','09/10/2026','10.09.26','2026-9-1','tomorrow','1800-01-01'])assert.throws(()=>parseBankDate(value));
});
test('CSV preview separates errors, duplicates within file, existing rows and selected transactions',()=>{
  const csv=parseCSV('Buchungstag;Betrag;Verwendungszweck;Kategorie;Transaktions-ID\n10.09.2026;-12,50;Café;Essen;A\n10.09.2026;-12,50;  CAFÉ  ;Essen;B\n09.09.2026;3000,00;Gehalt;Gehalt;C\n31.02.2026;10;Falsch;;\n10.09.2026;1.234;Mehrdeutig;;\n11.09.2026;20;Zukunft;;\n10.09.2026;21;Alt;;old\n10.09.2026;22;Andere Buchung;;A\n10.09.2026;1;Fehlende Spalte');
  const mapping=guessCSVMapping(csv.headers);assert.deepEqual(mapping,{date:'0',amount:'1',note:'2',category:'3',reference:'4'});
  const existing=[{account:'bank',date:'2026-09-09',amount:300000,type:'income',note:'Gehalt'},{account:'bank',date:'2026-09-01',amount:100,type:'expense',note:'Andere Notiz',bankReference:'old'}];
  const preview=previewCSV(csv,mapping,{account:'bank',existing,today:'2026-09-10'});
  assert.equal(preview.valid,5);assert.equal(preview.invalid,4);assert.equal(preview.duplicates,4);
  assert.equal(preview.rows.filter(r=>r.selected).length,1);assert.equal(preview.rows[0].transaction.amount,1250);assert.equal(preview.rows[0].transaction.type,'expense');
  assert.equal(preview.rows[1].duplicate,'Doppelt in Datei');assert.equal(preview.rows[2].duplicate,'Bereits in Hany');assert.equal(preview.rows[6].duplicate,'Bereits in Hany');assert.equal(preview.rows[7].duplicate,'Doppelt in Datei');
});
test('CSV duplicate matching is scoped to the account, sign and description',()=>{
  const csv=parseCSV('Datum;Betrag;Notiz\n10.09.2026;10;Gleich\n10.09.2026;-10;Gleich\n10.09.2026;10;Anders'),mapping=guessCSVMapping(csv.headers);
  const existing=[{account:'cash',date:'2026-09-10',amount:1000,type:'income',note:'Gleich'}];
  assert.equal(previewCSV(csv,mapping,{account:'bank',existing}).duplicates,0);
  assert.equal(previewCSV(csv,mapping,{account:'cash',existing}).duplicates,1);
  assert.throws(()=>previewCSV(csv,{...mapping,note:'1'},{account:'bank'}),/unterschiedliche/);
  assert.throws(()=>previewCSV(csv,mapping,{}),/Zielkonto/);
});
test('common bank reference placeholders are not treated as unique transaction IDs',()=>{
  const csv=parseCSV('Datum;Betrag;Notiz;Transaktions-ID\n10.09.2026;10;Erste;NOTPROVIDED\n10.09.2026;20;Zweite;NOTPROVIDED');
  assert.equal(previewCSV(csv,guessCSVMapping(csv.headers),{account:'bank'}).duplicates,0);
  assert.equal(guessCSVMapping(['Datum','Betrag','Notiz','Referenz']).reference,'-1');
});

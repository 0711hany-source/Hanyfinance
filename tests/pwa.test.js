import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);
const sw=await readFile(new URL('sw.js',root),'utf8');
const assets=[...sw.match(/const ASSETS = \[([\s\S]*?)\];/)[1].matchAll(/'([^']+)'/g)].map(m=>m[1]);

test('Offline-Paket enthält jedes importierte Modul, Stylesheet und Manifest-Icon',async()=>{
  for(const file of await readdir(root))if(/\.(js|css|html|png|svg|webmanifest)$/.test(file)&&file!=='sw.js')assert.ok(assets.includes('./'+file),file+' fehlt im Offline-Paket');
  for(const asset of assets.filter(a=>a!=='./'))await readFile(new URL(asset,root));
  for(const file of assets.filter(a=>a.endsWith('.js'))){const code=await readFile(new URL(file,root),'utf8');for(const match of code.matchAll(/from\s+['"](\.\/[^'"]+)['"]/g))assert.ok(assets.includes(match[1]),match[1]+' fehlt');}
  const manifest=JSON.parse(await readFile(new URL('manifest.webmanifest',root),'utf8'));assert.equal(manifest.start_url,'./');assert.equal(manifest.scope,'./');
});

test('Service Worker unterstützt Unterordner, kohärente Offline-Versionen und ignoriert fremde Datenpfade',async()=>{
  const scope='https://example.test/hany/',handlers={},cache=new Map();let networkCalls=0,skipped=false,claimed=false;
  const cached={async addAll(requests){for(const request of requests)cache.set(request.url,new Response(request.url.endsWith('index.html')?'cached-index':'cached-asset'));},async match(request){return cache.get(typeof request==='string'?request:request.url)?.clone();}};
  const context={URL,Request,Response,Set,Promise,fetch:async()=>{networkCalls++;throw Error('offline');},caches:{open:async()=>cached,keys:async()=>[],delete:async()=>true},self:{registration:{scope},location:{origin:'https://example.test'},clients:{claim:async()=>{claimed=true;}},skipWaiting:async()=>{skipped=true;},addEventListener:(name,handler)=>handlers[name]=handler}};
  vm.runInNewContext(sw,context);
  let pending;handlers.install({waitUntil:p=>pending=p});await pending;
  assert.equal(skipped,false);assert.ok(cache.has(scope+'goals-ui.js'));
  handlers.activate({waitUntil:p=>pending=p});await pending;assert.equal(claimed,true);
  const request=(suffix,extra={})=>({url:scope+suffix,method:'GET',mode:'navigate',headers:new Headers(),...extra});
  let response;handlers.fetch({request:request(''),respondWith:p=>response=p});assert.equal(await (await response).text(),'cached-index');assert.equal(networkCalls,0);
  for(const r of [request('backup.json'),request('app.js?private=1'),request('app.js',{method:'POST'}),request('app.js',{headers:new Headers({authorization:'Bearer example'})})]){let intercepted=false;handlers.fetch({request:r,respondWith:()=>intercepted=true});assert.equal(intercepted,false);}
  handlers.message({data:{type:'SKIP_WAITING'},waitUntil:p=>pending=p});await pending;assert.equal(skipped,true);
});

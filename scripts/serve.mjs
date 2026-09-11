import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),port=Number(process.env.PORT||4173);
const mime={'.js':'text/javascript','.css':'text/css','.html':'text/html','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json','.json':'application/json'};
http.createServer((req,res)=>{
  let requested;try{requested=decodeURIComponent(req.url.split('?')[0]);}catch{res.writeHead(400);return res.end();}
  const filename=path.resolve(root,'.'+(requested==='/'?'/index.html':requested));
  if(!filename.startsWith(root)){res.writeHead(403);return res.end();}
  fs.readFile(filename,(error,body)=>{if(error){res.writeHead(404);return res.end('Nicht gefunden');}res.setHeader('Content-Type',mime[path.extname(filename)]||'application/octet-stream');res.setHeader('Cache-Control','no-cache');res.end(body);});
}).listen(port,'127.0.0.1',()=>console.log(`Hany läuft unter http://127.0.0.1:${port}/`));

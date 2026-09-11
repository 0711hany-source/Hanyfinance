import {mkdir,copyFile,readdir} from 'node:fs/promises';
const root=new URL('../',import.meta.url),destination=new URL('_site/',root);
await mkdir(destination,{recursive:true});
for(const entry of await readdir(root,{withFileTypes:true})){
  if(entry.isFile()&&(entry.name==='.nojekyll'||/\.(html|css|js|svg|png|webmanifest)$/.test(entry.name)))await copyFile(new URL(entry.name,root),new URL(entry.name,destination));
}

// Plugin Vite: setelah build, isi service-worker.js (disalin dari public/) dengan daftar precache dan versi.
// Daftar berisi semua berkas hasil build, termasuk aset ber-hash, kecuali og-image, peta sumber, dan service worker itu sendiri.
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
const SKIP=new Set(['og-image.png','service-worker.js']);
const walk=(d,b=d,o=[])=>{for(const f of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,f.name);f.isDirectory()?walk(p,b,o):o.push(path.relative(b,p).split(path.sep).join('/'))}return o};
export function bimtrackPwa(){
  let out;
  return{name:'bimtrack-pwa',apply:'build',
    configResolved(c){out=path.resolve(c.root,c.build.outDir)},
    closeBundle(){
      const swp=path.join(out,'service-worker.js');
      if(!fs.existsSync(swp))throw new Error('bimtrack-pwa: service-worker.js tidak ada di '+out);
      const files=walk(out).filter(f=>!SKIP.has(path.basename(f))&&!f.endsWith('.map')).sort();
      const h=createHash('sha1');for(const f of files){h.update(f);h.update(fs.readFileSync(path.join(out,f)))}
      const version=h.digest('hex').slice(0,10),list=['./',...files.map(f=>'./'+f)];
      let s=fs.readFileSync(swp,'utf8');
      const a=s.replace("const VERSION='dev'","const VERSION='"+version+"'").replace(/\/\*PRECACHE\*\/\[\]\/\*END\*\//,'/*PRECACHE*/'+JSON.stringify(list)+'/*END*/');
      if(a===s||!a.includes(version)||!a.includes('/*PRECACHE*/["'))throw new Error('bimtrack-pwa: penanda VERSION/PRECACHE tidak ditemukan di service-worker.js');
      fs.writeFileSync(swp,a)}}}

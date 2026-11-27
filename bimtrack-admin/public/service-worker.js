/* BIMTRACK service worker.
 * VERSION dan PRECACHE diisi saat build oleh shared/pwa-plugin.js (aset ber-hash ikut). Di mode dev berkas ini tidak didaftarkan.
 * Strategi: shell aplikasi + aset hasil build di-precache (cache-first, jadi terbuka tanpa internet). Pembaruan versi menunggu
 * sampai pengguna menekan "Perbarui" (pesan SKIP_WAITING). Request ke domain lain (Firebase) tidak disentuh. */
const VERSION='dev';
const PRECACHE=/*PRECACHE*/[]/*END*/;
const SCOPE=new URL(self.registration.scope).pathname;
const PREFIX='bt:'+SCOPE+':';
const CACHE=PREFIX+VERSION;
const OFFLINE='<!doctype html><html lang="id"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BIMTRACK offline</title><body style="font-family:system-ui,sans-serif;padding:32px;max-width:480px;margin:auto"><h1>Sedang offline</h1><p>Halaman ini belum tersimpan di perangkat. Sambungkan ke internet sekali, lalu buka BIMTRACK lagi.</p></body></html>';

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(PRECACHE.map(u=>new Request(u,{cache:'reload'})))));
});
self.addEventListener('activate',e=>{
  e.waitUntil((async()=>{
    for(const k of await caches.keys())if((k.startsWith(PREFIX)&&k!==CACHE)||k==='bimtrack-v1')await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('message',e=>{if(e.data&&e.data.type==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);if(u.origin!==location.origin||!u.pathname.startsWith(SCOPE))return;
  e.respondWith(r.mode==='navigate'?shell(r):asset(r));
});
async function shell(r){
  const c=await caches.open(CACHE),m=await c.match(self.registration.scope,{ignoreSearch:true});
  if(m)return m;
  try{return await fetch(r)}catch{return new Response(OFFLINE,{status:503,headers:{'Content-Type':'text/html;charset=utf-8'}})}
}
async function asset(r){
  const c=await caches.open(CACHE),m=await c.match(r);
  if(m)return m;
  try{const res=await fetch(r);if(res&&res.ok&&res.type==='basic')c.put(r,res.clone());return res}catch{return Response.error()}
}

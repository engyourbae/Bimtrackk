/* BIMTRACK landing service worker (scope = akar situs).
 * VERSION diisi oleh langkah deploy (hash commit). Halaman /user/ dan /admin/ punya service worker sendiri,
 * jadi request ke kedua sub-path itu sengaja tidak disentuh di sini. */
const VERSION='dev';
const SCOPE=new URL(self.registration.scope).pathname;
const CACHE='bt-landing:'+SCOPE+':'+VERSION;
const SHELL=['./','./landing.css','./tokens.css','./manifest.webmanifest','./favicon.svg','./favicon-32.png','./apple-touch-icon.png','./icon-192.png','./icon-512.png','./icon-maskable-512.png','./fonts/plus-jakarta-sans.woff2','./fonts/manrope.woff2'];
self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>Promise.all(SHELL.map(u=>c.add(new Request(u,{cache:'reload'})).catch(()=>null)))));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('bt-landing:'+SCOPE+':')&&k!==CACHE).map(k=>caches.delete(k)))));
});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);if(u.origin!==location.origin||!u.pathname.startsWith(SCOPE))return;
  const sub=u.pathname.slice(SCOPE.length);if(sub.startsWith('user/')||sub==='user'||sub.startsWith('admin/')||sub==='admin')return;
  e.respondWith((async()=>{
    const c=await caches.open(CACHE);
    try{const res=await fetch(r);if(res&&res.ok&&res.type==='basic')c.put(r,res.clone());return res}
    catch{const m=await c.match(r,{ignoreSearch:true})||(r.mode==='navigate'?await c.match(self.registration.scope):null);return m||Response.error()}
  })());
});

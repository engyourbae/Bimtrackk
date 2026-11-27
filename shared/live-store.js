// Langganan Firestore bersama tingkat aplikasi (user dan admin).
// Satu listener per kunci dipakai semua halaman. Setelah pemakai terakhir pergi, listener ditahan HOLD ms
// (pindah halaman bolak-balik tidak memasang ulang listener dan data langsung tampil dari memori), lalu dilepas.
export const HOLD=30000;
const M=new Map(),W=new Set();
const emit=(k,m)=>W.forEach(f=>{try{f(k,m)}catch{}});
function begin(e,start){
  e.off=start((list,meta={})=>{e.has=true;e.list=list;e.meta=meta;e.err=null;emit(e.key,meta);e.subs.forEach(s=>s.ok(list,meta))},
    er=>{e.err=er;e.off=null;e.has=false;e.subs.forEach(s=>s.er&&s.er(er))})}
function drop(e){clearTimeout(e.timer);e.timer=0;const f=e.off;e.off=null;if(M.get(e.key)===e){M.delete(e.key);emit(e.key,null)}try{f&&f()}catch{}}
/** Berlangganan kunci `key`. start(ok,er) membuat listener dan mengembalikan fungsi berhenti. cb={ok,er}. Mengembalikan fungsi berhenti. */
export function shareSub(key,start,cb){
  let e=M.get(key);
  if(!e){e={key,subs:new Set(),off:null,has:false,list:null,meta:null,err:null,timer:0};M.set(key,e)}
  clearTimeout(e.timer);e.timer=0;e.subs.add(cb);
  if(e.err){e.err=null;e.off=null} // listener lama sudah mati karena galat: pasang ulang (dipicu "Coba lagi")
  if(!e.off)begin(e,start);else if(e.has)cb.ok(e.list,e.meta);
  return()=>{e.subs.delete(cb);if(!e.subs.size&&!e.timer&&M.get(e.key)===e)e.timer=setTimeout(()=>{if(!e.subs.size)drop(e)},HOLD)}}
/** Data terakhir yang sudah datang untuk kunci ini (atau undefined). Dipakai agar halaman langsung tampil tanpa skeleton. */
export const peekShared=key=>{const e=M.get(key);return e&&e.has?{list:e.list,meta:e.meta}:undefined};
/** Lepas semua listener (dipanggil saat keluar / ganti akun). */
export const resetShared=()=>{[...M.values()].forEach(drop)};
/** Pantau perubahan meta tiap kunci: f(key,meta) dan f(key,null) saat kunci dilepas. */
export const watchShared=f=>{W.add(f);return()=>W.delete(f)};

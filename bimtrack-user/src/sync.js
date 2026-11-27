// Status sinkronisasi yang jujur + jalur tulis yang hasilnya tidak boleh hilang diam-diam.
//  - pending : janji tulis yang belum dijawab server (inflight) ATAU snapshot yang masih punya tulisan lokal tertunda (termasuk dari sesi sebelumnya)
//  - error   : tulisan yang DITOLAK server; tetap tampil (chip + daftar) sampai ditutup atau berhasil dikirim ulang
//  - synced  : online, tidak ada yang tertunda, dan sudah ada snapshot yang dikonfirmasi server
// Batas yang diketahui: penolakan server atas tulisan dari sesi sebelumnya (aplikasi ditutup saat offline) tidak bisa dideteksi SDK;
// datanya hanya "kembali" ke versi server saat snapshot berikutnya datang.
import {useSyncExternalStore} from 'react';
import {watchShared} from '@shared/live-store';
import {toast} from './shared/ui';
const on0=()=>typeof navigator==='undefined'||navigator.onLine!==false;
let st={inflight:0,docsPending:false,confirmed:false,online:on0(),errors:[]};
const subs=new Set(),metas=new Map(),EK='bimtrack-write-errors';
const lsGet=()=>{try{return JSON.parse(localStorage.getItem(EK)||'[]')}catch{return[]}};
const lsSet=v=>{try{localStorage.setItem(EK,JSON.stringify(v.map(({id,label,message,code,t})=>({id,label,message,code,t}))))}catch{}};
st.errors=lsGet();
const set=p=>{const n={...st,...p};if(Object.keys(p).every(k=>n[k]===st[k]))return;st=n;subs.forEach(f=>f())};
watchShared((k,m)=>{m?metas.set(k,m):metas.delete(k);const v=[...metas.values()];
  set({docsPending:v.some(x=>x.pending),...(v.some(x=>x.fromCache===false)?{confirmed:true}:{})})});
if(typeof addEventListener==='function'){addEventListener('online',()=>set({online:true}));addEventListener('offline',()=>set({online:false,confirmed:false}))}
export const useSync=()=>useSyncExternalStore(f=>{subs.add(f);return()=>subs.delete(f)},()=>st,()=>st);
export const syncStatus=s=>s.errors.length?'error':(s.inflight>0||s.docsPending)?'pending':!s.online?'offline':s.confirmed?'synced':'connecting';
export const dismissError=id=>{set({errors:st.errors.filter(e=>e.id!==id)});lsSet(st.errors)};
export const clearSyncState=()=>{metas.clear();set({docsPending:false,confirmed:false})};
const human=e=>{const c=e?.code||'';
  if(c==='permission-denied')return'Ditolak server (tidak punya izin). Akunmu mungkin belum disetujui atau dinonaktifkan.';
  if(c==='not-found')return'Data sudah tidak ada di server (mungkin dihapus di perangkat lain).';
  if(c==='unavailable'||c==='deadline-exceeded')return'Server tidak terjangkau.';
  if(c==='resource-exhausted')return'Kuota harian Firebase habis. Coba lagi besok.';
  return e?.message||'Penyebab tidak diketahui.'};
let seq=0;const wait=ms=>new Promise(r=>setTimeout(r,ms));
/** Jalankan satu tulisan Firestore dan beri umpan balik yang jujur.
 *  run: () => Promise (updateDoc/setDoc/deleteDoc/batch.commit). opt: {label, ok}. ok = teks setelah tersimpan.
 *  Online: toast `ok` bila server menjawab ≤1,5 dtk; lebih lambat → "Menunggu server…" lalu "Terkirim". Offline: "Disimpan di perangkat. Menunggu kirim".
 *  Galat tidak pernah diam: toast + chip merah + daftar dengan Coba kirim ulang. Mengembalikan promise<boolean>. */
export function send(run,{label='Perubahan',ok='Tersimpan'}={}){
  const id=++seq;
  const go=()=>{set({inflight:st.inflight+1});let p;try{p=Promise.resolve(run())}catch(e){p=Promise.reject(e)}
    return p.then(()=>{set({inflight:st.inflight-1,errors:st.errors.filter(e=>e.id!==id)});lsSet(st.errors);return true},
      e=>{const err={id,label,code:e?.code,message:human(e),t:Date.now(),retry:go};set({inflight:st.inflight-1,errors:[...st.errors.filter(x=>x.id!==id),err]});lsSet(st.errors);
        toast('Gagal terkirim: '+label+'. '+err.message,'err');return false})};
  const off=!on0(),pr=go();
  if(off){toast(ok+' di perangkat. Menunggu kirim saat online.');pr.then(v=>{if(v)toast('Terkirim ke server: '+label)})}
  else Promise.race([pr,wait(1500).then(()=>'slow')]).then(v=>{if(v===true)toast(ok);else if(v==='slow'){toast(ok+'. Menunggu konfirmasi server…');pr.then(x=>{if(x)toast('Terkirim ke server: '+label)})}});
  return pr}

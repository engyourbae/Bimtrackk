import {useEffect,useState} from 'react';
import {Icon} from './icons';
import {Btn,Badge,toast} from './ui/core';

/* ---------- Status instal, pembaruan, dan online (dipakai user dan admin) ---------- */
let deferred=null,waiting=null,asked=false,rev=0;
const subs=new Set(),emit=()=>{rev++;subs.forEach(f=>f(rev))};
const useTick=()=>{const[,s]=useState(0);useEffect(()=>{subs.add(s);return()=>subs.delete(s)},[])};
if(typeof window!=='undefined'){
  // ditangkap sejak modul dimuat supaya event tidak terlewat sebelum kartu Pengaturan dibuka
  addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;emit()});
  addEventListener('appinstalled',()=>{deferred=null;emit();toast('BIMTRACK terpasang')});
}
export const useOnline=()=>{const[on,setOn]=useState(()=>navigator.onLine);
  useEffect(()=>{const u=()=>setOn(true),o=()=>setOn(false);addEventListener('online',u);addEventListener('offline',o);return()=>{removeEventListener('online',u);removeEventListener('offline',o)}},[]);return on};
const standalone=()=>{try{return matchMedia('(display-mode: standalone)').matches||matchMedia('(display-mode: minimal-ui)').matches||navigator.standalone===true}catch{return false}};
const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);

/** Daftarkan service worker (scope = folder aplikasi, sehingga cocok di sub-path GitHub Pages). Hanya di build produksi. */
export function registerPwa(){
  if(!('serviceWorker' in navigator)||!import.meta.env.PROD)return;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(asked)location.reload()});
  const start=()=>navigator.serviceWorker.register('./service-worker.js').then(reg=>{
    const mark=()=>{if(reg.waiting&&navigator.serviceWorker.controller){waiting=reg.waiting;emit()}};
    mark();
    reg.addEventListener('updatefound',()=>{const w=reg.installing;w&&w.addEventListener('statechange',()=>{if(w.state==='installed')mark()})});
    const chk=()=>reg.update().catch(()=>{});
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')chk()});
    setInterval(chk,60*60*1000);
  }).catch(()=>{});
  document.readyState==='complete'?start():addEventListener('load',start,{once:true});
}
const applyUpdate=()=>{if(!waiting)return;asked=true;waiting.postMessage({type:'SKIP_WAITING'})};

/** Pita offline dan pembaruan versi. Pembaruan hanya dipasang setelah pengguna menekan Perbarui. */
export function PwaNotices({offlineText}){
  useTick();const on=useOnline();
  return <>{!on&&<div className="banner" role="status">{offlineText}</div>}
    {waiting&&<div className="banner info" role="status"><span>Versi baru BIMTRACK sudah diunduh dan siap dipasang.</span><button type="button" className="btn sm" onClick={applyUpdate}>Perbarui</button></div>}</>}

/** Kartu Pengaturan: pasang aplikasi (Android/desktop lewat prompt Chrome, iOS lewat petunjuk) dan status offline. */
export function InstallCard(){
  useTick();
  const std=standalone(),ios=isIOS(),ready=!!navigator.serviceWorker?.controller,prod=import.meta.env.PROD;
  const install=async()=>{if(!deferred)return;const d=deferred;deferred=null;emit();d.prompt();const r=await d.userChoice.catch(()=>null);if(r&&r.outcome==='dismissed')toast('Pemasangan dibatalkan')};
  return <section className="card" aria-label="Pasang aplikasi"><div className="row"><Icon name="download" size={20}/><h2 className="sp">Pasang aplikasi</h2>{std&&<Badge tone="ok">Terpasang</Badge>}</div>
    {std?<p className="mut" style={{margin:'8px 0 0'}}>BIMTRACK sedang berjalan sebagai aplikasi terpasang di perangkat ini.</p>
    :deferred?<><p className="mut" style={{margin:'8px 0 12px'}}>Pasang BIMTRACK di layar utama agar terbuka seperti aplikasi biasa.</p><Btn className="btn block" onClick={install}><Icon name="download" size={18}/> Pasang aplikasi</Btn></>
    :ios?<><p className="mut" style={{margin:'8px 0 4px'}}>Di iPhone/iPad, pasang lewat Safari:</p><ol className="how"><li>Buka BIMTRACK di Safari.</li><li>Ketuk tombol Bagikan.</li><li>Pilih Tambahkan ke Layar Utama.</li></ol></>
    :<><p className="mut" style={{margin:'8px 0 4px'}}>Tombol pasang otomatis belum tersedia dari peramban ini. Di Chrome Android:</p><ol className="how"><li>Ketuk ikon ⋮ di pojok kanan atas.</li><li>Pilih Instal aplikasi atau Tambahkan ke layar utama.</li></ol><p className="mut" style={{margin:'4px 0 0',fontSize:'var(--fs-xs)'}}>Jika menu itu tidak ada, buka BIMTRACK sekali saat online lalu muat ulang halaman.</p></>}
    <p className="hint mut" style={{margin:'10px 0 0'}}>{!prod?'Mode pengembangan: service worker tidak aktif.':ready?'File aplikasi sudah tersimpan di perangkat ini, jadi halamannya bisa dibuka tanpa internet. Data tetap mengikuti pengaturan offline di atas.':'File aplikasi belum tersimpan untuk offline. Tetap online sebentar lalu muat ulang halaman.'}</p></section>}

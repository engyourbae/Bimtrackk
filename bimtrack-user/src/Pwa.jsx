import {useEffect,useState} from 'react';
import {toast} from './shared/ui';
let dp=null;
export default function PwaBar(){const[on,setOn]=useState(navigator.onLine),[can,setCan]=useState(!!dp);
  useEffect(()=>{const u=()=>setOn(true),o=()=>setOn(false),bi=e=>{e.preventDefault();dp=e;setCan(true)};
    addEventListener('online',u);addEventListener('offline',o);addEventListener('beforeinstallprompt',bi);
    const had=!!navigator.serviceWorker?.controller,cc=()=>{if(had)toast('Versi baru terpasang. Muat ulang halaman.')};navigator.serviceWorker?.addEventListener('controllerchange',cc);
    return()=>{removeEventListener('online',u);removeEventListener('offline',o);removeEventListener('beforeinstallprompt',bi);navigator.serviceWorker?.removeEventListener('controllerchange',cc)}},[]);
  return <>{!on&&<div className="banner">Offline: perubahan disimpan di perangkat dan disinkronkan saat online.</div>}
    {can&&<button className="btn sec" style={{marginBottom:10}} onClick={async()=>{dp.prompt();await dp.userChoice;dp=null;setCan(false)}}>Pasang aplikasi</button>}</>}

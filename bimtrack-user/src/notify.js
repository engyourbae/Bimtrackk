// Notifikasi perangkat (opsional, per perangkat). Hanya berjalan selama BIMTRACK terbuka; tidak butuh server.
import {notifyPlan} from './schedule.js';
const K='bimtrack-notif',N='bimtrack-notified';
const ls=(k,v)=>{try{if(v===undefined)return localStorage.getItem(k);v===null?localStorage.removeItem(k):localStorage.setItem(k,v)}catch{return null}};
export const notifSupported=()=>typeof Notification!=='undefined';
export const notifOn=()=>notifSupported()&&ls(K)==='1'&&Notification.permission==='granted';
export const setNotifOn=on=>ls(K,on?'1':null);
/** Minta izin lalu aktifkan. Mengembalikan 'granted' | 'denied' | 'default' | 'unsupported'. */
export async function enableNotif(){if(!notifSupported())return'unsupported';const p=Notification.permission==='granted'?'granted':await Notification.requestPermission();setNotifOn(p==='granted');return p}
const seen=()=>{try{return new Set(JSON.parse(ls(N)||'[]'))}catch{return new Set()}};
const remember=id=>{const s=[...seen(),id].slice(-60);ls(N,JSON.stringify(s))};
async function show(title,body,tag){
  try{const reg=await navigator.serviceWorker?.getRegistration?.();if(reg?.showNotification){await reg.showNotification(title,{body,tag,icon:'./icon-192.png'});return true}
    if(notifSupported()){new Notification(title,{body,tag,icon:'./icon-192.png'});return true}}catch{}return false}
/** Jadwalkan notifikasi untuk baris jadwal. Mengembalikan fungsi pembatal. */
export function scheduleNotifs(rows,now=Date.now()){
  if(!notifOn())return()=>{};
  const timers=notifyPlan(rows,now).filter(p=>!seen().has(p.id)).map(p=>setTimeout(async()=>{if(seen().has(p.id))return;if(await show(p.title,p.body,p.id))remember(p.id)},Math.max(0,p.at-now)));
  return()=>timers.forEach(clearTimeout)}

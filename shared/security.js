// Keamanan sisi tampilan: (1) pembatas percobaan masuk dengan waktu tunggu yang makin lama, (2) kedaluwarsa sesi karena tidak aktif.
// CATATAN JUJUR: semua ini tersimpan di perangkat (localStorage), jadi menghalangi tebak-tebakan lewat aplikasi tetapi tidak bisa
// menghentikan pihak yang memanggil API Firebase langsung. Perlindungan sisi server tetap Firebase Auth (auth/too-many-requests).
import {useCallback,useEffect,useMemo,useState} from 'react';
const NS='bimtrack-sec:',DAY=864e5;
const jget=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(NS+k));return v==null?d:v}catch{return d}};
const jset=(k,v)=>{try{localStorage.setItem(NS+k,JSON.stringify(v))}catch{}};
const norm=s=>String(s||'').trim().toLowerCase();

/* ---------- pembatas percobaan masuk ---------- */
/** Lama kunci (detik) setelah kegagalan ke-n. Gratis `free` kali; berikutnya 15 dtk, 30, 60, 2 mnt, 4, 8, 16, 32 mnt, maksimum 1 jam. */
export const lockFor=(n,free=2)=>n>free?Math.min(15*2**(n-free-1),3600):0;
export const NIM_FREE=2,DEVICE_FREE=9,RESET_AFTER=DAY;
export const fmtWait=s=>{s=Math.max(0,Math.ceil(s));if(s<60)return s+' detik';const m=Math.floor(s/60),r=s%60;if(m<60)return m+' menit'+(r?' '+r+' detik':'');const h=Math.floor(m/60),mm=m%60;return h+' jam'+(mm?' '+mm+' menit':'')};
const fresh=e=>e&&Date.now()-e.last<RESET_AFTER?e:{n:0,until:0,dur:0,last:0};
export function readGuard(id){const e=fresh(jget('fails',{})[norm(id)]),d=fresh(jget('dev',null));
  const dev=d.until>e.until;return{n:e.n,dn:d.n,until:Math.max(e.until,d.until),dur:dev?d.dur:e.dur,scope:dev?'device':'nim',left:Math.max(0,NIM_FREE-e.n)}}
/** Catat satu kegagalan. extraSecs: kunci tambahan (mis. Firebase menolak karena terlalu banyak percobaan). */
export function recordFail(id,extraSecs=0){const k=norm(id),now=Date.now(),all=jget('fails',{});
  const e=fresh(all[k]),n=e.n+1,s=Math.max(lockFor(n,NIM_FREE),extraSecs);all[k]={n,last:now,until:s?now+s*1000:e.until,dur:s||e.dur};
  const keys=Object.keys(all);if(keys.length>50)keys.filter(x=>x!==k).sort((a,b)=>all[a].last-all[b].last).slice(0,keys.length-50).forEach(x=>delete all[x]);
  jset('fails',all);const d=fresh(jget('dev',null)),dn=d.n+1,ds=lockFor(dn,DEVICE_FREE);jset('dev',{n:dn,last:now,until:ds?now+ds*1000:d.until,dur:ds||d.dur})}
export function recordOk(id){const all=jget('fails',{});delete all[norm(id)];jset('fails',all);jset('dev',null)}
/** Hook untuk form masuk. id = NIM/email yang sedang diketik. */
export function useLoginGuard(id){
  const[tick,setTick]=useState(0),[now,setNow]=useState(Date.now());
  const g=useMemo(()=>readGuard(id),[id,tick]);
  const secs=Math.max(0,Math.ceil((g.until-now)/1000));
  useEffect(()=>{if(g.until<=Date.now())return;setNow(Date.now());const t=setInterval(()=>setNow(Date.now()),250);return()=>clearInterval(t)},[g.until]);
  useEffect(()=>{const f=e=>{if(!e.key||e.key.startsWith(NS))setTick(x=>x+1)};addEventListener('storage',f);return()=>removeEventListener('storage',f)},[]);
  const fail=useCallback((extra=0)=>{recordFail(id,extra);setNow(Date.now());setTick(x=>x+1)},[id]);
  const ok=useCallback(()=>{recordOk(id);setTick(x=>x+1)},[id]);
  return{locked:secs>0,secs,dur:g.dur||secs,scope:g.scope,fails:g.n,left:g.left,fail,ok}}

/* ---------- kedaluwarsa sesi (per aplikasi: 'user' | 'admin') ---------- */
export const SESSION_OPTS=[{value:'15',label:'15 menit'},{value:'60',label:'1 jam'},{value:'480',label:'8 jam'},{value:'10080',label:'7 hari'}];
export const getSessionPolicy=app=>{const v=jget(app+':policy',null);return v&&typeof v.on==='boolean'&&SESSION_OPTS.some(o=>+o.value===v.m)?v:{on:false,m:60}};
export const setSessionPolicy=(app,v)=>{jset(app+':policy',v);jset(app+':active',Date.now())};
/** Mulai jam sesi dari sekarang. Dipanggil SEBELUM proses masuk/daftar, supaya waktu aktif dari sesi lama tidak membuat sesi baru langsung kedaluwarsa. */
export const resetSessionClock=app=>jset(app+':active',Date.now());
export const consumeExpiredNotice=app=>{const v=jget(app+':expired',null);if(v)jset(app+':expired',null);return!!v&&Date.now()-v<DAY};
/** Pantau aktivitas; keluar otomatis bila tidak aktif melebihi batas. Mengembalikan fungsi berhenti. */
export function startSessionGuard(app,{onExpire,onWarn}={}){
  let lastTouch=0,warned=false,dead=false;
  const touch=force=>{const t=Date.now();if(!force&&t-lastTouch<10000)return;lastTouch=t;warned=false;if(getSessionPolicy(app).on)jset(app+':active',t)};
  const check=()=>{if(dead)return;const p=getSessionPolicy(app);if(!p.on)return;const last=jget(app+':active',Date.now()),left=last+p.m*60000-Date.now();
    if(left<=0){dead=true;jset(app+':expired',Date.now());jset(app+':active',null);onExpire&&onExpire();return}
    if(left<=60000&&!warned){warned=true;onWarn&&onWarn(Math.ceil(left/1000))}};
  check();if(!dead)touch(true);
  const ev=['pointerdown','keydown','touchstart','scroll'],h=()=>touch(false),vis=()=>{if(document.visibilityState==='visible'){check();if(!dead)touch(false)}};
  ev.forEach(e=>addEventListener(e,h,{passive:true,capture:true}));document.addEventListener('visibilitychange',vis);const iv=setInterval(check,15000);
  return()=>{dead=true;clearInterval(iv);ev.forEach(e=>removeEventListener(e,h,{capture:true}));document.removeEventListener('visibilitychange',vis)}}

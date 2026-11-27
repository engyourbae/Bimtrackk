// Status data bersama BIMTRACK: memuat · kosong · galat · berisi.
// Satu hook (useLive) dan satu komponen (DataState) dipakai semua halaman user dan admin, jadi halaman baru otomatis punya empat keadaan.
//  - Skeleton langsung tampil, dan setelah tampil bertahan minimal SK_MIN ms agar tidak berkedip.
//  - Skeleton tidak tampil selamanya: lewat SK_TIMEOUT ms jadi keadaan galat/offline yang jujur dengan tombol "Coba lagi".
//  - Daftar kosong yang hanya berasal dari cache saat offline TIDAK dianggap "belum ada data" (belum bisa dipastikan) → keadaan offline.
import {Component,useEffect,useState} from 'react';
import {EmptyState} from './ui/core';
import {Icon} from './icons';

export const SK_MIN=300;
export const SK_TIMEOUT=10000;

// Hemat daya: bila API baterai tersedia dan baterai ≤20% tanpa mengisi daya, kilau skeleton dimatikan (blok statis tetap tampil).
let powerInit=false;
function watchPower(){
  if(powerInit||typeof navigator==='undefined'||!navigator.getBattery)return;powerInit=true;
  navigator.getBattery().then(b=>{const f=()=>document.documentElement.toggleAttribute('data-lowpower',b.level<=.2&&!b.charging);f();b.addEventListener('levelchange',f);b.addEventListener('chargingchange',f)}).catch(()=>{})}

const useOnline=()=>{
  const[o,setO]=useState(()=>typeof navigator==='undefined'||navigator.onLine!==false);
  useEffect(()=>{const a=()=>setO(true),b=()=>setO(false);addEventListener('online',a);addEventListener('offline',b);return()=>{removeEventListener('online',a);removeEventListener('offline',b)}},[]);
  return o};

/** Langganan beberapa sumber data langsung.
 *  keys       : nama sumber, mis. ['bimbingan','revisi'].
 *  subscribe  : key => (onData,onError) => unsubscribe. onData(daftar,{fromCache}).
 *  depKey     : nilai yang bila berubah mengulang langganan (mis. uid). Opsi: {enabled,timeout,hold,peek}.
 *  peek       : key => {list,meta}|undefined — data yang sudah ada di langganan bersama; bila semua sumber sudah ada, tidak ada skeleton sama sekali.
 *  Hasil      : {d,status,error,retry,online}. status: 'idle'|'loading'|'ready'|'error'|'timeout'|'offline'. d[key] hanya ada bila sumber itu sudah datang. */
export function useLive(keys,subscribe,depKey='',{enabled=true,timeout=SK_TIMEOUT,hold=SK_MIN,peek}={}){
  const kk=keys.join('|'),
    seed=()=>{const d={},ok={};if(enabled)keys.forEach(k=>{const p=peek&&peek(k);if(p){d[k]=p.list;ok[k]=!(p.meta?.fromCache&&!p.list.length)}});return{d,ok,err:null}},
    warmOf=x=>keys.length>0&&keys.every(k=>k in x.d);
  const[tick,setTick]=useState(0),[s,setS]=useState(seed),[late,setLate]=useState(false),[held,setHeld]=useState(()=>!warmOf(seed())),online=useOnline();
  useEffect(()=>{
    watchPower();const sd=seed(),warm=warmOf(sd);setS(sd);setLate(false);setHeld(!warm);
    if(!enabled)return;
    const tl=setTimeout(()=>setLate(true),timeout),th=warm?0:setTimeout(()=>setHeld(false),hold);
    const offs=keys.map(k=>subscribe(k)(
      (list,meta={})=>setS(p=>({...p,d:{...p.d,[k]:list},ok:{...p.ok,[k]:!!p.ok[k]||!(meta.fromCache&&!list.length)},err:p.err&&p.err.key===k?null:p.err})),
      e=>setS(p=>({...p,err:{key:k,code:e?.code,message:e?.message}}))));
    return()=>{clearTimeout(tl);th&&clearTimeout(th);offs.forEach(f=>f&&f())}},[kk,depKey,tick,enabled]);// eslint-disable-line
  const loaded=keys.every(k=>k in s.d),unconf=keys.some(k=>k in s.d&&!s.ok[k]);
  let raw;
  if(!enabled)raw='idle';
  else if(s.err)raw='error';
  else if(!loaded)raw=late?'timeout':'loading';
  else if(unconf)raw=!online?'offline':late?'timeout':'loading';
  else raw='ready';
  const status=raw==='loading'||(raw==='ready'&&held)?'loading':raw;
  return{d:s.d,status,error:s.err,online,retry:()=>setTick(t=>t+1)}}

const MSG={
  offline:['Kamu sedang offline','Data ini belum pernah dimuat di perangkat ini, jadi belum ada salinan yang bisa ditampilkan. Sambungkan internet sekali untuk memuatnya; setelah itu halaman ini bisa dibuka lagi saat offline.'],
  timeout:['Memuat terlalu lama','Koneksi lambat atau terputus, jadi data belum bisa dipastikan. Coba lagi sebentar lagi.'],
  error:['Data tidak bisa dimuat','Terjadi masalah saat mengambil data. Periksa koneksi lalu coba lagi.']};

/** Keadaan galat: pesan jujur + tombol "Coba lagi". kind: 'error'|'timeout'|'offline'. */
export function ErrorState({kind='error',error,onRetry,compact}){
  const denied=error?.code==='permission-denied',[t,x]=denied?['Akses ditolak','Akunmu belum punya izin membuka data ini. Keluar lalu masuk lagi, atau hubungi admin bila berlanjut.']:(MSG[kind]||MSG.error);
  return <div className={'empty-s err-s'+(compact?' compact':'')} role="alert"><span className="err-ic" aria-hidden="true"><Icon name="info" size={28}/></span><h3>{t}</h3><p>{x}</p>{onRetry&&<button type="button" className="btn sec" onClick={onRetry}>Coba lagi</button>}</div>}

/** Empat keadaan dalam satu komponen.
 *  status/onRetry/error : dari useLive.  skeleton : bentuk skeleton yang meniru isi asli.
 *  isEmpty + empty      : bila status siap dan isEmpty, tampilkan `empty` (biasanya <EmptyState/> dengan aksi). */
export function DataState({status,onRetry,error,skeleton,label='Memuat data',isEmpty=false,empty,compact,children}){
  if(status==='idle')return null;
  if(status==='loading')return <div className="ds-sk" role="status" aria-busy="true" aria-label={label}><span className="sr">{label}…</span>{skeleton}</div>;
  if(status==='error'||status==='timeout'||status==='offline')return <ErrorState kind={status} error={error} onRetry={onRetry} compact={compact}/>;
  return isEmpty?(empty||<EmptyState compact={compact}/>):<>{children}</>}

/** Penjaga galat halaman. Dipakai di sekitar halaman yang dimuat malas (lazy): bila berkas halaman gagal dimuat
 *  (offline sebelum berkas tersimpan, atau versi baru menggantikan berkas lama) tampil pesan jujur + Muat ulang, bukan layar kosong. */
export class PageBoundary extends Component{
  state={bad:false};
  static getDerivedStateFromError(){return{bad:true}}
  componentDidCatch(e){try{console.error('[BIMTRACK] halaman gagal dimuat',e)}catch{}}
  render(){return this.state.bad
    ?<div className="empty-s err-s" role="alert"><span className="err-ic" aria-hidden="true"><Icon name="info" size={28}/></span><h3>Halaman belum bisa dibuka</h3><p>Berkas halaman ini gagal dimuat. Biasanya karena perangkat offline sebelum halaman tersimpan, atau ada versi baru. Sambungkan internet lalu muat ulang.</p><button type="button" className="btn sec" onClick={()=>location.reload()}>Muat ulang</button></div>
    :this.props.children}}

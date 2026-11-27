import {useEffect,useState} from 'react';
import {doc,getDocFromServer,onSnapshot,setDoc,serverTimestamp,waitForPendingWrites} from 'firebase/firestore';
import {auth,db} from './firebase';
import {AuthLayout,BootScreen,LogoutButton,Btn,Icon,toast} from './shared/ui';
import {logoutUser,sesiFlag,LO} from './offline';
import {deviceId,MSG_OTHER,MSG_KICK} from './sesi';
import {fmtDate} from '@shared/date';
const ms=t=>t&&t.toMillis?t.toMillis():0;
const flagVal=()=>auth.currentUser?.metadata?.lastSignInTime||'1';
const getFlag=uid=>{try{return localStorage.getItem(sesiFlag(uid))===flagVal()}catch{return false}};
const setFlag=uid=>{try{localStorage.setItem(sesiFlag(uid),flagVal())}catch{}};
const claim=uid=>setDoc(doc(db,'sesi',uid),{deviceId:deviceId(),startedAt:serverTimestamp()},{merge:true});
const when=t=>{const m=ms(t);if(!m)return'';const d=new Date(m),z=n=>String(n).padStart(2,'0');return fmtDate(d.getFullYear()+'-'+z(d.getMonth()+1)+'-'+z(d.getDate()),'sedang')+' '+d.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})};

/** Penjaga sesi tunggal. Dipasang di sekeliling aplikasi untuk akun yang sudah disetujui.
 *  1) Masuk baru di perangkat ini: bila sesi lain tercatat aktif → minta konfirmasi, lalu tulis sesi baru (perangkat ini menang).
 *  2) Perangkat yang sudah memegang sesi mendengarkan sesi/{uid}; keluar otomatis HANYA dari snapshot yang dikonfirmasi server.
 *  Fail-open: bila server/aturan belum bisa dijangkau, aplikasi tetap terbuka (offline tetap bisa dipakai) dan pemeriksaan diulang saat online. */
export default function SesiGate({uid,children}){
  const[phase,setPhase]=useState(()=>getFlag(uid)?'ok':'check'),[claimed,setClaimed]=useState(()=>getFlag(uid)),[since,setSince]=useState(''),[busy,setBusy]=useState(false);
  // (1) pemeriksaan saat masuk baru
  useEffect(()=>{if(phase!=='check')return;let alive=true;
    const fin=c=>{if(!alive)return;if(c){setFlag(uid);setClaimed(true)}setPhase('ok')};
    if(!navigator.onLine){fin(false);return}
    const t=setTimeout(()=>fin(false),8000);
    getDocFromServer(doc(db,'sesi',uid)).then(async s=>{clearTimeout(t);if(!alive)return;
      const d=s.exists()?s.data():null;
      if(!d||!d.deviceId||d.deviceId===deviceId()){try{await claim(uid);fin(true)}catch(e){try{console.warn('[BIMTRACK] sesi belum bisa ditulis:',e?.code||e)}catch{}fin(false)}}
      else{setSince(when(d.startedAt));setPhase('ask')}},
      e=>{clearTimeout(t);try{console.warn('[BIMTRACK] sesi tunggal belum bisa diperiksa:',e?.code||e)}catch{}fin(false)});
    return()=>{alive=false;clearTimeout(t)}},[phase,uid]);
  // belum bisa memeriksa (offline/galat): coba lagi begitu online
  useEffect(()=>{if(phase!=='ok'||claimed)return;const f=()=>setPhase('check');addEventListener('online',f);return()=>removeEventListener('online',f)},[phase,claimed]);
  // (2) mendengarkan sesi
  useEffect(()=>{if(!claimed)return;const me=deviceId();let done=false;
    const end=async reason=>{if(done)return;done=true;
      try{await Promise.race([waitForPendingWrites(db),new Promise(r=>setTimeout(r,6000))])}catch{}
      await logoutUser({reason})};
    return onSnapshot(doc(db,'sesi',uid),{includeMetadataChanges:true},s=>{
      if(done||s.metadata.fromCache||s.metadata.hasPendingWrites||!s.exists())return;
      const d=s.data(),sa=ms(d.startedAt),ka=ms(d.kickedAt);if(!sa)return;
      if(d.deviceId!==me)end(MSG_OTHER);else if(ka&&ka>=sa)end(MSG_KICK)},()=>{})},[claimed,uid]);
  const take=async()=>{setBusy(true);try{await claim(uid);setFlag(uid);setClaimed(true);setPhase('ok')}catch(e){toast(e?.code==='permission-denied'?'Ditolak server. Coba keluar lalu masuk lagi.':'Belum berhasil. Periksa koneksi lalu coba lagi.','err')}setBusy(false)};
  if(phase==='check')return <BootScreen/>;
  if(phase==='ask')return <AuthLayout panel={false} title="Akun sedang dipakai di perangkat lain" sub={'Akun ini tercatat aktif di perangkat lain'+(since?' sejak '+since:'')+'. Masuk di sini dan keluarkan perangkat itu?'}>
    <div className="lockmsg note" role="note"><Icon name="info" size={18}/><span>Perangkat lain akan keluar otomatis saat online. Perubahan yang belum terkirim dari sana dikirim dulu sebelum keluar.</span></div>
    <Btn className="btn block" busy={busy} onClick={take}>Masuk di sini</Btn>
    <div style={{height:8}}/><LogoutButton onLogout={logoutUser} {...LO} className="btn sec block"/></AuthLayout>;
  return children}

/** Kartu Pengaturan: penjelasan jujur tentang sesi tunggal dan batasnya. */
export function SesiInfo(){
  return <section className="card" aria-label="Sesi dan perangkat"><div className="row"><Icon name="shield" size={20}/><h2 className="sp">Satu akun, satu perangkat</h2></div>
    <p className="mut" style={{margin:'8px 0 0'}}>Saat kamu masuk di perangkat baru, perangkat lama keluar otomatis begitu online. Admin juga bisa mengeluarkan akun dari semua perangkat, misalnya bila HP hilang.</p>
    <div className="lockmsg" style={{marginTop:12,marginBottom:0}}><Icon name="alert" size={18}/><span>Batasan: perangkat yang hilang dan <b>sedang offline</b> tetap bisa membaca salinan data di penyimpanannya (tidak terenkripsi) sampai ia online. Reset sandi tidak mencabut sesi yang sudah ada. Pencabutan token yang sebenarnya butuh Cloud Functions (paket Blaze) dan tidak diaktifkan.</span></div></section>}

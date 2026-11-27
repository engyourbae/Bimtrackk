import {useEffect,useState} from 'react';
import {Icon,Badge,Btn,Switch,ConfirmDialog,toast} from './shared/ui';
import {offlineOn,setOffline} from './offline';
import {notifPermission,notifOn,setNotifOn,enableNotif,testNotif} from './notify';

/** Sakelar "Tetap bisa dibuka offline di perangkat ini" (opt-in, per perangkat, default mati). */
export function OfflineCard(){
  const[on,setOn]=useState(offlineOn),[ask,setAsk]=useState(false),[busy,setBusy]=useState(false),[pers,setPers]=useState(null);
  useEffect(()=>{if(on)navigator.storage?.persisted?.().then(setPers).catch(()=>{})},[on]);
  const enable=async()=>{setBusy(true);try{const r=await setOffline(true);setOn(true);setAsk(false);setPers(r.persisted);toast('Mode offline aktif di perangkat ini')}catch{toast('Belum berhasil diaktifkan. Coba lagi.','err')}setBusy(false)};
  const flip=v=>{if(v)setAsk(true);else{setOffline(false);setOn(false);toast('Mode offline dimatikan. Data lokal tetap ada sampai kamu Keluar.')}};
  return <section className="card" aria-label="Mode offline"><div className="row"><Icon name="wifi" size={20}/><h2 className="sp">Mode offline</h2></div>
    <Switch checked={on} onChange={flip} label="Tetap bisa dibuka offline di perangkat ini"/>
    <p className="mut" style={{margin:'8px 0 0'}}>Setelah aktif, BIMTRACK langsung terbuka ke data yang tersimpan tanpa layar masuk, dan sesi tidak berakhir otomatis selama perangkat offline (aturan kedaluwarsa berlaku lagi setelah online).</p>
    <div className="lockmsg" style={{marginTop:12,marginBottom:0}}><Icon name="alert" size={18}/><span>Data tersimpan di perangkat tanpa enkripsi. Jangan aktifkan di perangkat bersama atau milik orang lain. Masuk pertama kali di perangkat baru tetap butuh internet.</span></div>
    {on&&<p className="hint mut" style={{margin:'10px 0 0'}}>{pers===true?'Chrome menjamin penyimpanan ini tidak dihapus otomatis.':pers===false?'Chrome belum memberi jaminan penyimpanan permanen; data bisa dihapus peramban bila memori perangkat penuh.':'Status penyimpanan permanen tidak dapat dipastikan di peramban ini.'}</p>}
    <ConfirmDialog open={ask} title="Aktifkan mode offline?" confirmLabel="Aktifkan" danger={false} autoFocusCancel busy={busy} onCancel={()=>setAsk(false)} onConfirm={enable}>
      <p style={{margin:0}}>Data bimbingan dan revisimu akan tersimpan di perangkat ini tanpa enkripsi dan sesi dipertahankan. Aktifkan hanya di perangkat pribadimu.</p></ConfirmDialog></section>}

const STEPS=<ol className="how"><li>Di Chrome: ketuk ikon gembok (atau ⋮) di bilah alamat, pilih Izin, lalu Notifikasi, lalu Izinkan.</li>
  <li>Jika BIMTRACK terpasang sebagai aplikasi: tekan lama ikon aplikasi, pilih Info aplikasi, lalu Notifikasi, lalu aktifkan.</li><li>Kembali ke sini dan ketuk Periksa lagi.</li></ol>;
const LBL={default:['neutral','Belum diminta'],granted:['ok','Diizinkan'],denied:['danger','Diblokir'],unsupported:['neutral','Tidak didukung']};
/** Status izin notifikasi yang jujur + tombol aktifkan / langkah membuka blokir. Dipakai di Pengaturan dan kartu Pengingat. */
export function NotifControl(){
  const[perm,setPerm]=useState(notifPermission),[on,setOn]=useState(notifOn),[busy,setBusy]=useState(false),[hint,setHint]=useState(false);
  const sync=()=>{setPerm(notifPermission());setOn(notifOn())};
  useEffect(()=>{let st;const f=()=>sync(),v=()=>document.visibilityState==='visible'&&sync();
    document.addEventListener('visibilitychange',v);addEventListener('focus',f);
    try{navigator.permissions?.query({name:'notifications'}).then(s=>{st=s;s.onchange=f}).catch(()=>{})}catch{}
    return()=>{document.removeEventListener('visibilitychange',v);removeEventListener('focus',f);if(st)st.onchange=null}},[]);
  const req=async()=>{setBusy(true);setHint(false);let p='default';
    try{p=await enableNotif()}catch{}
    setBusy(false);sync();
    if(p==='granted'){toast('Notifikasi aktif di perangkat ini');testNotif()}
    else if(p==='unsupported')toast('Peramban ini tidak mendukung notifikasi','err');
    else if(p==='denied')toast('Izin notifikasi ditolak','err');
    else{setHint(true);toast('Chrome tidak menampilkan permintaan izin. Lihat langkah di bawah.','err')}};
  const flip=async v=>{if(!v){setNotifOn(false);sync();toast('Notifikasi perangkat dimatikan');return}await req()};
  const[tone,label]=LBL[perm]||LBL.unsupported;
  return <div className="rem-n notif"><div className="row"><b className="sp">Notifikasi jadwal</b><Badge tone={tone}>{label}</Badge></div>
    {perm==='default'&&<Btn className="btn block" busy={busy} onClick={req}><Icon name="bell" size={18}/> Aktifkan notifikasi</Btn>}
    {perm==='default'&&hint&&<div className="lockmsg" role="status" style={{marginBottom:0}}><Icon name="alert" size={18}/><div style={{flex:1,minWidth:0}}>
      <b>Chrome tidak menampilkan permintaan izin.</b> Biasanya karena permintaan sebelumnya ditutup atau diblokir otomatis. Ubah izinnya secara manual:
      {STEPS}<button type="button" className="btn sec sm" onClick={sync}>Periksa lagi</button></div></div>}
    {perm==='granted'&&<Switch checked={on} disabled={busy} onChange={flip} label="Notifikasi 30 menit sebelum jadwal"/>}
    {perm==='denied'&&<div className="lockmsg" role="status" style={{marginBottom:0}}><Icon name="alert" size={18}/><div style={{flex:1,minWidth:0}}>
      <b>Izin notifikasi diblokir.</b> BIMTRACK tidak bisa mengubahnya; izin hanya bisa diubah dari pengaturan Chrome atau Android.
      {STEPS}<button type="button" className="btn sec sm" onClick={sync}>Periksa lagi</button></div></div>}
    {perm==='unsupported'&&<p className="mut" style={{margin:0}}>Peramban ini tidak mendukung notifikasi. Di iPhone/iPad, pasang BIMTRACK ke Layar Utama dulu (iOS 16.4 ke atas).</p>}
    <p className="hint mut" style={{margin:0}}>Pengingat berbunyi dan muncul 30 menit sebelum jadwal selama BIMTRACK sedang dibuka di perangkat ini. Pengingat tidak muncul saat aplikasi ditutup.</p></div>}

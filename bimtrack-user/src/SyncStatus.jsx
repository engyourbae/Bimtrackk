import {useState} from 'react';
import {Icon,Modal,Btn} from './shared/ui';
import {useSync,syncStatus,dismissError} from './sync';
const L={
  synced:{ic:'check-circle',t:'Tersinkron',tone:'ok',d:'Online dan semua perubahanmu sudah dikonfirmasi server.'},
  pending:{ic:'sync',t:'Menunggu kirim',tone:'warn',d:'Ada perubahan yang tersimpan di perangkat dan belum dikonfirmasi server. Biarkan BIMTRACK terbuka dengan internet menyala sampai statusnya berubah.'},
  offline:{ic:'wifi-off',t:'Offline',tone:'warn',d:'Perangkat sedang offline. Perubahan baru tersimpan di perangkat dan terkirim otomatis saat online.'},
  error:{ic:'alert',t:'Gagal kirim',tone:'err',d:'Ada perubahan yang ditolak server dan tidak tersimpan di sana. Kirim ulang, atau ulangi perubahannya.'},
  connecting:{ic:'sync',t:'Menyambung',tone:'mute',d:'Menunggu jawaban server untuk memastikan datamu sudah terbarui.'}};
/** Chip status sinkronisasi di bilah atas. Ketuk untuk melihat rincian, galat tulis, dan mengirim ulang. */
export default function SyncStatus(){
  const s=useSync(),k=syncStatus(s),m=L[k],[open,setOpen]=useState(false),[busy,setBusy]=useState(0);
  const retry=async e=>{setBusy(e.id);try{await e.retry?.()}finally{setBusy(0)}};
  return <><button type="button" className={'sync-chip '+m.tone} aria-label={'Status sinkronisasi: '+m.t} aria-haspopup="dialog" onClick={()=>setOpen(true)}><Icon name={m.ic} size={16}/><span className="sync-t">{m.t}</span></button>
    <Modal open={open} title="Status sinkronisasi" onClose={()=>setOpen(false)} footer={<button type="button" className="btn sp" onClick={()=>setOpen(false)}>Tutup</button>}>
      <div className={'lockmsg'+(k==='synced'?' note':'')} role="status"><Icon name={m.ic} size={18}/><span><b>{m.t}.</b> {m.d}</span></div>
      {s.errors.length>0&&<section aria-label="Perubahan gagal terkirim"><h3 style={{margin:'0 0 8px'}}>Perubahan gagal terkirim</h3>
        {s.errors.map(e=><div className="card" key={e.id} style={{marginBottom:8}}><b style={{overflowWrap:'anywhere'}}>{e.label}</b><p className="mut" style={{margin:'4px 0 8px',fontSize:'var(--fs-sm)'}}>{e.message}</p>
          <div className="row">{e.retry?<Btn className="btn sp" busy={busy===e.id} onClick={()=>retry(e)}>Coba kirim ulang</Btn>:<span className="mut sp" style={{fontSize:'var(--fs-xs)'}}>Dari sesi sebelumnya; ulangi perubahannya.</span>}<button type="button" className="btn sec sp" onClick={()=>dismissError(e.id)}>Tutup</button></div></div>)}</section>}
      <p className="mut" style={{fontSize:'var(--fs-xs)',margin:'12px 0 0'}}>Catatan: bila server menolak perubahan yang dibuat saat aplikasi sudah ditutup, SDK tidak memberi tahu; datanya hanya kembali ke versi di server.</p></Modal></>}

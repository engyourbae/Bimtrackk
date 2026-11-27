import {useState} from 'react';
import {doc,setDoc,serverTimestamp} from 'firebase/firestore';
import {db} from './firebase';
import {useCols} from './useData';
import {send} from './sync';
import {Modal,Select,Badge,Icon,DataState,EmptyState,toast} from './shared/ui';
import {SkripsiSk} from './PageSkeleton';
import {PRA,PRA_ST,PRA_TONE,JUDUL_ST,JUDUL_TONE} from './config';
import {todayStr,fmtDate} from '@shared/date';
import {navigate} from '@shared/router';
/** Judul skripsi + tahapan pra-skripsi. Satu dokumen `skripsi/{uid}` (uid = pemilik data). Tidak ikut rumus progres Bab I–V.
 *  Punya keadaan memuat/galat sendiri, jadi bila aturan Firestore belum diterbitkan, bagian lain halaman tetap berfungsi. */
export default function Skripsi({uid}){
  const live=useCols(['skripsi'],uid),row=live.d.skripsi?.[0]||null,[open,setOpen]=useState(false),[judul,setJudul]=useState(''),[js,setJs]=useState(JUDUL_ST[0]);
  // Lewat send(): hasil tulis dipantau (menunggu kirim / terkirim / ditolak) dan galat tidak hilang diam-diam.
  const write=data=>send(()=>setDoc(doc(db,'skripsi',uid),{id:uid,ownerUid:uid,updatedAt:serverTimestamp(),...(row?{}:{createdAt:serverTimestamp()}),...data},{merge:true}),{label:'Judul dan tahapan pra-skripsi'});
  const edit=()=>{setJudul(row?.judul||'');setJs(row?.judulStatus||JUDUL_ST[0]);setOpen(true)};
  const saveJudul=()=>{const t=judul.trim();if(!t)return toast('Judul belum diisi','err');write({judul:t,judulStatus:js});setOpen(false)};
  const setStage=(k,v)=>{if((row?.['st_'+k]||'belum')===v)return;write({['st_'+k]:v,['tg_'+k]:v==='selesai'?todayStr():''})};
  const done=PRA.filter(p=>row?.['st_'+p.k]==='selesai').length;
  return <DataState status={live.status} error={live.error} onRetry={live.retry} label="Memuat judul dan tahapan pra-skripsi" skeleton={<SkripsiSk/>}>
    <div className="stack">
      <section className="card" aria-label="Judul skripsi"><div className="sec-h"><h2>Judul skripsi</h2>{row?.judul&&<button type="button" className="btn ghost sm" onClick={edit}><Icon name="pencil" size={16}/> Ubah</button>}</div>
        {row?.judul?<><p className="jdl">{row.judul}</p><Badge tone={JUDUL_TONE[row.judulStatus]||'neutral'}>{row.judulStatus||'Draf'}</Badge></>
          :<EmptyState compact title="Belum ada judul" text="Catat judul skripsimu di sini, termasuk status pengajuannya ke prodi." action={<button type="button" className="btn" onClick={edit}><Icon name="plus" size={18}/> Isi judul</button>}/>}
        <button type="button" className="btn sec block" style={{marginTop:'var(--s3)'}} onClick={()=>navigate('jjk')}><Icon name="flag" size={18}/> Jejak judul dan outline</button></section>
      <section className="card" aria-label="Tahapan pra-skripsi"><div className="sec-h"><h2>Tahapan pra-skripsi</h2><Badge tone={done===PRA.length?'ok':'neutral'}>{done} dari {PRA.length} selesai</Badge></div>
        <p className="mut" style={{fontSize:'var(--fs-xs)',margin:0}}>Catatan pribadi sebelum Bab I. Tahapan ini tidak dihitung dalam progres Bab I sampai Bab V.</p>
        <ul className="pra">{PRA.map(p=>{const s=row?.['st_'+p.k]||'belum',t=row?.['tg_'+p.k];
          return <li key={p.k}><div className="pra-t"><b>{p.t}</b>{s==='selesai'&&t?<span className="mut">Selesai {fmtDate(t)}</span>:<span><Badge tone={PRA_TONE[s]}>{PRA_ST.find(x=>x.value===s).label}</Badge></span>}</div>
            <div className="pra-s"><Select label={'Status: '+p.t} value={s} options={PRA_ST} onChange={v=>setStage(p.k,v)}/></div></li>})}</ul></section></div>
    <Modal open={open} title={row?.judul?'Ubah judul skripsi':'Isi judul skripsi'} onClose={()=>setOpen(false)} footer={<div className="row"><button type="button" className="btn sec sp" onClick={()=>setOpen(false)}>Batal</button><button type="button" className="btn sp" onClick={saveJudul}>Simpan</button></div>}>
      <div className="field"><label htmlFor="jdl-in">Judul</label><textarea id="jdl-in" className="in" rows={4} maxLength={300} value={judul} onChange={e=>setJudul(e.target.value)} placeholder="Tulis judul skripsimu"/><p className="mut" style={{fontSize:'var(--fs-xs)',margin:'4px 0 0'}}>{judul.length}/300 karakter</p></div>
      <div className="field"><label>Status judul</label><Select label="Status judul" value={js} options={JUDUL_ST} onChange={setJs}/></div></Modal>
  </DataState>}

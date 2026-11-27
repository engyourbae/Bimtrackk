import {useState} from 'react';
import {writeBatch,doc,collection,serverTimestamp} from 'firebase/firestore';
import {db,auth} from '../firebase';
import {toast,Icon,Badge,Modal,Select,PageHead,EmptyState,ConfirmDialog,DataState,when} from '../shared/ui';
import {useAdminCols,ds} from '../useAdmin';
import {ListSk} from '../common';
const L={pending:'Pending',approved:'Approved',rejected:'Rejected'};
export default function Requests({uid}){
  const a=useAdminCols(['reqs'],uid),reqs=a.d.reqs||[],[f,setF]=useState('pending'),[rej,setRej]=useState(null),[reason,setReason]=useState(''),[acc,setAcc]=useState(null),[busy,setBusy]=useState(false),list=reqs.filter(r=>r.status===f);
  const decide=async(r,status,why='')=>{setBusy(true);try{const b=writeBatch(db),adm=auth.currentUser.uid,t=serverTimestamp();
    b.update(doc(db,'registrationRequests',r.uid),{status,decidedAt:t,decidedBy:adm,reason:why});
    b.set(doc(db,'users',r.uid),{uid:r.uid,dataUid:r.uid,nim:r.nim,nama:r.nama,prodi:r.prodi,fakultas:r.fakultas,universitas:r.universitas,approved:status==='approved',decidedAt:t,...(status==='approved'?{approvedAt:t}:{})},{merge:true});
    b.set(doc(collection(db,'aktivitas')),{action:status==='approved'?'approve':'reject',targetUid:r.uid,nim:r.nim,reason:why,adminUid:adm,createdAt:t});
    await b.commit();toast(status==='approved'?'Disetujui: '+r.nama:'Ditolak: '+r.nama)}catch(e){toast(e.message,'err')}setBusy(false)};
  return <div><PageHead title="Permintaan Akun" sub="Setujui atau tolak pendaftaran mahasiswa"/>
    <div style={{maxWidth:220,marginBottom:12}}><Select label="Status permintaan" value={L[f]} options={Object.values(L)} onChange={v=>setF(Object.keys(L).find(k=>L[k]===v))}/></div>
    <DataState {...ds(a)} label="Memuat permintaan akun" skeleton={<ListSk/>} isEmpty={!list.length} empty={<EmptyState compact title={'Tidak ada permintaan '+L[f].toLowerCase()} text="Permintaan pendaftaran dengan status ini akan muncul di sini."/>}>
      {list.map(r=><div className="card" key={r.uid}><div className="row"><b className="sp">{r.nama}</b><Badge>{L[r.status]}</Badge></div><p className="mut" style={{margin:'6px 0'}}>NIM {r.nim}<br/>{r.prodi} · {r.fakultas} · {r.universitas}<br/>Daftar: {when(r.createdAt)}{r.reason&&<><br/>Alasan: {r.reason}</>}</p>
        <div className="row">{r.status!=='approved'&&<button type="button" className="btn sp" disabled={busy} onClick={()=>setAcc(r)}><Icon name="check" size={16}/> Terima</button>}{r.status!=='rejected'&&<button type="button" className="btn dan sp" disabled={busy} onClick={()=>{setRej(r);setReason('')}}>Tolak</button>}</div></div>)}</DataState>
    <ConfirmDialog open={!!acc} title="Terima pendaftaran?" confirmLabel="Terima" danger={false} autoFocusCancel onCancel={()=>setAcc(null)} onConfirm={()=>{const x=acc;setAcc(null);decide(x,'approved')}} text={<>{acc?.nama} (NIM {acc?.nim}) akan bisa membuka dan mengisi data skripsinya.</>}/>
    <Modal open={!!rej} title="Tolak pendaftaran" onClose={()=>setRej(null)} footer={<div className="row"><button type="button" className="btn sec sp" onClick={()=>setRej(null)}>Batal</button><button type="button" className="btn dan sp" onClick={()=>{const x=rej;setRej(null);decide(x,'rejected',reason)}}>Tolak</button></div>}>
      <p style={{margin:'0 0 8px'}}>{rej?.nama} (NIM {rej?.nim}) tidak akan bisa membuka data. Alasan akan terlihat oleh mahasiswa.</p><textarea className="in" aria-label="Alasan penolakan" placeholder="Alasan (opsional)" value={reason} onChange={e=>setReason(e.target.value)}/></Modal></div>}

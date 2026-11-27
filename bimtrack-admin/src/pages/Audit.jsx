import {useState} from 'react';
import {collection,getDocs,query,orderBy,startAfter,limit} from 'firebase/firestore';
import {db} from '../firebase';
import {PageHead,EmptyState,DataState,Btn,when} from '../shared/ui';
import {useAdminCols,ds,ACT_HEAD,ACT_PAGE} from '../useAdmin';
import {ListSk,actLabel} from '../common';
/** Audit log: 50 terbaru (langsung/real-time) + "Muat lebih banyak" per 50 dengan kursor createdAt. */
export default function Audit({uid}){
  const a=useAdminCols(['act'],uid),head=a.d.act||[],[more,setMore]=useState([]),[end,setEnd]=useState(false),[busy,setBusy]=useState(false),[err,setErr]=useState('');
  const seen=new Set(head.map(x=>x.id)),all=[...head,...more.filter(x=>!seen.has(x.id))],canMore=!end&&(more.length>0||head.length>=ACT_HEAD);
  const load=async()=>{const last=all[all.length-1];if(!last?.createdAt)return;setBusy(true);setErr('');
    try{const sn=await getDocs(query(collection(db,'aktivitas'),orderBy('createdAt','desc'),startAfter(last.createdAt),limit(ACT_PAGE))),rows=sn.docs.map(d=>({...d.data(),id:d.id}));
      setMore(m=>[...m,...rows]);if(rows.length<ACT_PAGE)setEnd(true)}catch(e){setErr(navigator.onLine===false?'Perangkat offline. Sambungkan internet lalu coba lagi.':(e.message||'Gagal memuat.'))}setBusy(false)};
  return <div><PageHead title="Audit Log" sub="Riwayat tindakan administrator"/>
    <DataState {...ds(a)} label="Memuat audit log" skeleton={<ListSk/>} isEmpty={!all.length} empty={<EmptyState title="Belum ada aktivitas" text="Tindakan administrator akan tercatat di sini."/>}>
      {all.map(x=><div className="card" key={x.id}><b>{actLabel(x.action)}</b><p className="mut" style={{margin:'4px 0'}}>{x.nim&&'NIM '+x.nim+' · '}admin {x.adminUid?.slice(0,6)}… · {when(x.createdAt)}{x.reason&&' · '+x.reason}{x.ket&&' · '+x.ket}{x.action==='force_logout'&&x.block&&' · akses diblokir'}</p></div>)}
      {err&&<p className="err" role="alert" style={{margin:'8px 0'}}>{err}</p>}
      {canMore?<Btn className="btn sec block" busy={busy} onClick={load}>Muat lebih banyak</Btn>:all.length>=ACT_HEAD&&<p className="mut" style={{textAlign:'center',fontSize:'var(--fs-sm)'}}>Semua aktivitas sudah ditampilkan.</p>}</DataState></div>}

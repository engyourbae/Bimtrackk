import {useEffect,useMemo,useState} from 'react';
import {collection,getDocs,query,where} from 'firebase/firestore';
import {db} from './firebase';
import {COLS,PAGE,TITLEK} from './config';
import {Badge,toast} from './shared/ui';
export default function Search({uid,go}){
  const[all,setAll]=useState(null),[q,setQ]=useState(''),[d,setD]=useState('');
  useEffect(()=>{Promise.all(Object.keys(COLS).map(c=>getDocs(query(collection(db,c),where('ownerUid','==',uid))).then(s=>s.docs.map(x=>({...x.data(),_c:c}))))).then(a=>setAll(a.flat())).catch(e=>{toast(e.message,'err');setAll([])})},[uid]);
  useEffect(()=>{const t=setTimeout(()=>setD(q.trim().toLowerCase()),250);return()=>clearTimeout(t)},[q]);
  const res=useMemo(()=>!all||d.length<2?[]:all.filter(x=>COLS[x._c].f.some(f=>String(x[f.k]||'').toLowerCase().includes(d))).slice(0,50),[all,d]);
  return <div><h1>Pencarian</h1><input className="in" autoFocus placeholder="Cari bimbingan, revisi, jadwal, dokumen, ringkasan..." value={q} onChange={e=>setQ(e.target.value)}/>
    <p className="mut" style={{fontSize:'.8rem'}}>{all===null?'Memuat data Anda...':'Pencarian hanya pada data milik Anda.'}</p>
    {d.length>=2&&!res.length&&all&&<div className="empty">Tidak ada hasil.</div>}
    {res.map(x=><div key={x.id} className="card clk" onClick={()=>go(PAGE[x._c])}><div className="row"><b className="sp">{x[TITLEK[x._c]]||'-'}</b><Badge>{COLS[x._c].t}</Badge></div><div className="mut" style={{fontSize:'.85rem'}}>{x.tanggal||x.deadline||''}</div></div>)}</div>}

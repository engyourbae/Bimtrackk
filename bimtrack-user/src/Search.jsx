import {useMemo,useState,useEffect} from 'react';
import {useCols} from './useData';
import {COLS,PAGE,TITLEK} from './config';
import {Badge,DataState,EmptyState} from './shared/ui';
import {SearchSk} from './PageSkeleton';
const KEYS=Object.keys(COLS);
export default function Search({uid,go}){
  const live=useCols(KEYS,uid),[q,setQ]=useState(''),[d,setD]=useState('');
  const all=useMemo(()=>live.status==='ready'?KEYS.flatMap(c=>(live.d[c]||[]).map(x=>({...x,_c:c}))):null,[live.status,live.d]);
  useEffect(()=>{const t=setTimeout(()=>setD(q.trim().toLowerCase()),250);return()=>clearTimeout(t)},[q]);
  const res=useMemo(()=>!all||d.length<2?[]:all.filter(x=>COLS[x._c].f.some(f=>String(x[f.k]||'').toLowerCase().includes(d))).slice(0,50),[all,d]);
  return <div><h1>Pencarian</h1><input className="in" autoFocus placeholder="Cari bimbingan, revisi, jadwal, dokumen, ringkasan..." value={q} onChange={e=>setQ(e.target.value)} aria-label="Kata kunci pencarian"/>
    <p className="mut" style={{fontSize:'.8rem'}}>Pencarian hanya pada data milik Anda.</p>
    <DataState status={live.status} error={live.error} onRetry={live.retry} label="Memuat data untuk pencarian" skeleton={<SearchSk/>}
      isEmpty={!all?.length} empty={<EmptyState title="Belum ada data untuk dicari" text="Catat bimbingan, revisi, jadwal, atau dokumen dulu. Hasilnya akan bisa dicari di sini."/>}>
      {d.length<2?<EmptyState compact title="Ketik untuk mencari" text="Masukkan minimal 2 huruf."/>
        :!res.length?<EmptyState compact title="Tidak ada hasil" text={'Tidak ada data yang cocok dengan “'+q.trim()+'”.'} action={<button type="button" className="btn sec" onClick={()=>setQ('')}>Hapus pencarian</button>}/>
        :res.map(x=><div key={x._c+x.id} className="card clk" onClick={()=>go(PAGE[x._c])}><div className="row"><b className="sp">{x[TITLEK[x._c]]||'-'}</b><Badge>{COLS[x._c].t}</Badge></div><div className="mut" style={{fontSize:'.85rem'}}>{x.tanggal||x.deadline||''}</div></div>)}
    </DataState></div>}

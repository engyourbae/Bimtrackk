import {useMemo,useState,useEffect} from 'react';
import {useCols} from './useData';
import {COLS,PAGE,TITLEK} from './config';
import {Badge,DataState,EmptyState,Icon} from './shared/ui';
import {SearchSk} from './PageSkeleton';
import {navigate} from '@shared/router';
import {fmtDate} from '@shared/date';
// Inti: koleksi lama yang pasti punya aturan Firestore. Tambahan (jejak, skripsi) dimuat terpisah agar galat di sana tidak menutup seluruh pencarian.
const CORE=Object.keys(COLS).filter(c=>c!=='jejak'),EXTRA=['jejak','skripsi'];
const isDate=v=>/^\d{4}-\d\d-\d\d$/.test(v||'');
/** Potongan teks di sekitar kata yang cocok. */
const snip=(t,q)=>{t=String(t).replace(/\s+/g,' ');const i=t.toLowerCase().indexOf(q);if(i<0)return t.slice(0,90);const a=Math.max(0,i-30);return(a>0?'…':'')+t.slice(a,a+100)+(a+100<t.length?'…':'')};
/** Pencarian global. Mengetuk hasil membuka DETAIL data itu (bukan hanya daftarnya). */
export default function Search({uid}){
  const live=useCols(CORE,uid),ex=useCols(EXTRA,uid),[q,setQ]=useState(''),[d,setD]=useState('');
  const all=useMemo(()=>{if(live.status!=='ready')return null;
    const base=CORE.flatMap(c=>(live.d[c]||[]).map(x=>({...x,_c:c})));
    const more=ex.status==='ready'?[...(ex.d.jejak||[]).map(x=>({...x,_c:'jejak'})),...(ex.d.skripsi||[]).map(x=>({...x,_c:'skripsi'}))]:[];
    return[...base,...more]},[live.status,live.d,ex.status,ex.d]);
  useEffect(()=>{const t=setTimeout(()=>setD(q.trim().toLowerCase()),250);return()=>clearTimeout(t)},[q]);
  // tiap hasil: bidang pertama yang cocok (label + potongan teks)
  const fieldsOf=c=>c==='skripsi'?[{k:'judul',label:'Judul skripsi'},{k:'judulStatus',label:'Status judul'}]:COLS[c].f;
  const res=useMemo(()=>!all||d.length<2?[]:all.map(x=>{const hit=fieldsOf(x._c).find(f=>String(x[f.k]||'').toLowerCase().includes(d));return hit?{x,hit}:null}).filter(Boolean).slice(0,50),[all,d]);
  const open=x=>x._c==='skripsi'?navigate('prog'):x._c==='ringkasan'?navigate('rin'):navigate(PAGE[x._c],x.id);
  const kind=c=>c==='skripsi'?'Judul skripsi':COLS[c].t;
  return <div><h1>Pencarian</h1><input className="in" autoFocus placeholder="Cari bimbingan, revisi, jadwal, dokumen, jejak judul..." value={q} onChange={e=>setQ(e.target.value)} aria-label="Kata kunci pencarian"/>
    <p className="mut" style={{fontSize:'.8rem'}}>Pencarian hanya pada data milik Anda. Ketuk hasil untuk membuka detailnya.</p>
    {live.status==='ready'&&ex.status==='error'&&<p className="mut" role="status" style={{fontSize:'var(--fs-sm)'}}><Icon name="alert" size={16}/> Jejak judul dan judul skripsi belum bisa dicari{ex.error?.code==='permission-denied'?' (aturan Firestore terbaru belum diterbitkan)':''}. Data lain tetap bisa dicari.</p>}
    <DataState status={live.status} error={live.error} onRetry={live.retry} label="Memuat data untuk pencarian" skeleton={<SearchSk/>}
      isEmpty={!all?.length} empty={<EmptyState title="Belum ada data untuk dicari" text="Catat bimbingan, revisi, jadwal, atau dokumen dulu. Hasilnya akan bisa dicari di sini."/>}>
      {d.length<2?<EmptyState compact title="Ketik untuk mencari" text="Masukkan minimal 2 huruf."/>
        :!res.length?<EmptyState compact title="Tidak ada hasil" text={'Tidak ada data yang cocok dengan “'+q.trim()+'”.'} action={<button type="button" className="btn sec" onClick={()=>setQ('')}>Hapus pencarian</button>}/>
        :res.map(({x,hit})=><button type="button" key={x._c+x.id} className="card clk" style={{display:'block',width:'100%',textAlign:'left'}} onClick={()=>open(x)}>
          <div className="row"><b className="sp" style={{overflowWrap:'anywhere'}}>{x._c==='skripsi'?x.judul||'-':x[TITLEK[x._c]]||'-'}</b><Badge>{kind(x._c)}</Badge></div>
          <div className="mut" style={{fontSize:'.85rem'}}>{[isDate(x.tanggal||x.deadline)?fmtDate(x.tanggal||x.deadline):'',hit.k!==(TITLEK[x._c]||'judul')?hit.label+': '+snip(x[hit.k],d):''].filter(Boolean).join(' · ')}</div></button>)}
    </DataState></div>}

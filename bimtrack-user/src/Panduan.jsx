import {useEffect,useMemo,useState} from 'react';
import {doc,setDoc,deleteDoc,serverTimestamp} from 'firebase/firestore';
import {db} from './firebase';
import {useCols,usePanduan} from './useData';
import {send} from './sync';
import {PageHead,Icon,Badge,Select,Checkbox,EmptyState,DataState,Skeleton} from './shared/ui';
import {fmtDate} from '@shared/date';
import {susun,cari,barisSyarat,toMs,isDrive} from '@shared/panduan';
import {readPanduanCache,writePanduanCache} from './panduanCache';

const ymd=ms=>{const d=new Date(ms),p=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())};
const tgl=ms=>ms?fmtDate(ymd(ms),'sedang'):'';

function Langkah({l,n,done,canMark,open,onToggle}){
  const sy=barisSyarat(l.syarat);
  return <li><details className="card pdn-s" open={open}>
    <summary><span className={'pdn-n'+(done?' ok':'')} aria-hidden="true">{done?<Icon name="check" size={14} strokeWidth={3}/>:n}</span><span className="pdn-t">{l.judul}{done&&<span className="sr"> (sudah kamu lewati)</span>}</span>{l.lama&&<Badge>{l.lama}</Badge>}<Icon name="chev-left" size={18} className="pdn-c"/></summary>
    <div className="pdn-b">
      <p className="pdn-isi">{l.isi}</p>
      {sy.length>0&&<div><div className="eyebrow">Dokumen dan syarat</div><ul className="pdn-sy">{sy.map((x,i)=><li key={i}>{x}</li>)}</ul></div>}
      {l.url&&isDrive(l.url)&&<a className="btn sec sm" href={l.url} target="_blank" rel="noopener noreferrer"><Icon name="external" size={16}/> Buka di Drive</a>}
      <p className="mut">Diperbarui {tgl(toMs(l.updatedAt))}</p>
      {canMark&&<Checkbox checked={done} onChange={onToggle} label="Sudah saya lewati (catatan pribadi)"/>}
    </div></details></li>}

/** Panduan Alur: kategori dan langkah yang ditulis admin. Mahasiswa HANYA membaca (ditegakkan firestore.rules). Bisa dicari, terbaca offline lewat salinan di perangkat,
 *  dan boleh menandai langkah yang sudah dilewati (catatan pribadi di koleksi panduanTanda; tidak memengaruhi progres Bab I–V maupun Outline–Seminar Proposal). */
export default function Panduan({uid}){
  const live=usePanduan(uid),tn=useCols(['panduanTanda'],uid),[q,setQ]=useState(''),[kat,setKat]=useState('');
  const ready=live.status==='ready',kats=live.d.panduanKategori,langs=live.d.panduanLangkah;
  useEffect(()=>{if(ready&&kats&&langs)writePanduanCache(kats,langs)},[ready,kats,langs]);
  // galat/offline/timeout: pakai salinan terakhir di perangkat bila ada (isinya panduan umum, bukan data pribadi)
  const fallback=useMemo(()=>!ready&&['error','timeout','offline'].includes(live.status)?readPanduanCache():null,[ready,live.status]);
  const src=ready?{kategori:kats,langkah:langs}:fallback;
  const pohon=useMemo(()=>src?susun(src.kategori,src.langkah):[],[src]);// eslint-disable-line
  const ticks=tn.status==='ready'?new Set((tn.d.panduanTanda||[]).map(x=>x.langkahId)):null;
  const toggle=(l,on)=>{const id=uid+'_'+l.id,ref=doc(db,'panduanTanda',id);
    send(()=>on?setDoc(ref,{id,ownerUid:uid,langkahId:l.id,createdAt:serverTimestamp(),updatedAt:serverTimestamp()}):deleteDoc(ref),{label:'Penanda “'+l.judul.slice(0,40)+'”',ok:on?'Ditandai sudah dilewati':'Tanda dihapus'})};
  const shown=cari(kat?pohon.filter(k=>k.id===kat):pohon,q),searching=!!q.trim();
  return <div><PageHead title="Panduan Alur" sub="Alur perjalanan skripsi dari kampusmu, ditulis oleh admin. Kamu hanya bisa membacanya."/>
    {fallback&&<div className="lockmsg" role="status"><Icon name="wifi-off" size={18}/><div style={{minWidth:0}}>Menampilkan salinan terakhir yang tersimpan di perangkat{fallback.t?' ('+tgl(fallback.t)+')':''}. Sambungkan internet untuk memeriksa pembaruan. <button type="button" className="lnk" onClick={live.retry}>Coba lagi</button></div></div>}
    {!ready&&!fallback&&<DataState status={live.status} error={live.error} onRetry={live.retry} label="Memuat panduan" skeleton={<div className="stack"><Skeleton h={48} r={12}/><Skeleton h={170} r={16}/><Skeleton h={170} r={16}/></div>}/>}
    {(ready||fallback)&&(!pohon.length?<EmptyState title="Panduan belum tersedia" text="Admin belum menerbitkan panduan alur. Cek lagi nanti."/>:<>
      <div className="pdn-f"><div className="search"><Icon name="cari"/><input className="in" type="search" placeholder="Cari panduan..." aria-label="Cari panduan" value={q} onChange={e=>setQ(e.target.value)}/></div>
        {pohon.length>1&&<div className="sel-w"><Select label="Kategori" value={kat} placeholder="Semua kategori" options={[{value:'',label:'Semua kategori'},...pohon.map(k=>({value:k.id,label:k.judul}))]} onChange={setKat}/></div>}</div>
      {ready&&tn.status==='error'&&<p className="mut" role="status" style={{fontSize:'var(--fs-sm)'}}>Penanda langkah belum bisa dimuat{tn.error?.code==='permission-denied'?' (aturan Firestore terbaru belum diterbitkan)':''}. Panduan tetap bisa dibaca.</p>}
      {!shown.length?<EmptyState compact title="Tidak ada hasil" text={'Tidak ada langkah yang cocok dengan “'+q.trim()+'”.'} action={<button type="button" className="btn sec" onClick={()=>{setQ('');setKat('')}}>Hapus pencarian</button>}/>
        :shown.map(k=>{const full=pohon.find(z=>z.id===k.id)||k,n=ticks?full.langkah.filter(l=>ticks.has(l.id)).length:0;
          return <section className="card pdn-k" key={k.id} aria-label={k.judul}>
            <div className="pdn-kh"><h2>{k.judul}</h2><Badge>{full.langkah.length} langkah</Badge></div>
            <p className="mut pdn-km">{ticks&&full.langkah.length>0?n+' dari '+full.langkah.length+' langkah kamu tandai · ':''}Diperbarui {tgl(k.diperbarui)}</p>
            {k.langkah.length?<ol className="pdn-l">{k.langkah.map(l=><Langkah key={l.id} l={l} n={full.langkah.findIndex(z=>z.id===l.id)+1} done={!!ticks?.has(l.id)} canMark={!!ticks&&ready} open={searching} onToggle={v=>toggle(l,v)}/>)}</ol>:<p className="mut" style={{margin:0}}>Belum ada langkah di kategori ini.</p>}</section>})}</>)}
  </div>}

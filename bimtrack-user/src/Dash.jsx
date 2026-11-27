import {useEffect,useState} from 'react';
import {collection,onSnapshot,query,where} from 'firebase/firestore';
import {db} from './firebase';
import {Icon,Badge,Progress,EmptyState,Skeleton,Timeline} from './shared/ui';
import {todayStr,fmtDate,relDay,relTime,sapaan,hariPanjang} from '@shared/date';
import {calcProgress,nextStep,urgentRevisi,STATUS_TONE} from './progress';
import Formula from './Formula';
const COLS=['bimbingan','revisi','jadwal','rundown','dokumen','ringkasan'];
const QA=[['Catatan','bimbingan','bim/baru'],['Revisi','revisi','rev/baru'],['Jadwal','jadwal','jdw/baru'],['Rundown','rundown','run/baru'],['Dokumen','dokumen','dok/baru'],['Bukti','image','bkt/baru'],['Laporan','laporan','rin'],['Perjalanan','route','prog']];
const ACT={bimbingan:['bimbingan','Bimbingan',x=>x.topik],revisi:['revisi','Revisi',x=>x.catatan],dokumen:['dokumen','Dokumen',x=>x.nama],ringkasan:['ringkasan','Catatan ringkasan',x=>x.scope]};
const ts=x=>(x.updatedAt||x.createdAt)?.seconds??Date.now()/1000;
export default function Dash({uid,prof,go}){
  const[d,setD]=useState({});
  useEffect(()=>{setD({});const un=COLS.map(c=>onSnapshot(query(collection(db,c),where('ownerUid','==',uid)),s=>setD(x=>({...x,[c]:s.docs.map(z=>z.data())})),()=>setD(x=>({...x,[c]:[]}))));return()=>un.forEach(f=>f())},[uid]);
  const[how,setHow]=useState(false),ready=COLS.every(c=>d[c]);
  if(!ready)return <div><div className="greet"><Skeleton w="55%" h={32}/></div><div className="dash"><div className="dash-col"><Skeleton h={130} r={16}/><Skeleton h={84} r={16}/><Skeleton h={260} r={16}/></div><div className="dash-col"><Skeleton h={160} r={16}/><Skeleton h={160} r={16}/></div></div></div>;
  const t=todayStr(),P=calcProgress({...d,today:t}),nx=nextStep({...d,today:t}),urg=urgentRevisi(d.revisi,t),
    jd=d.jadwal.filter(x=>x.tanggal>=t&&!['Dibatalkan','Selesai'].includes(x.status)).sort((a,b)=>(a.tanggal+(a.jam||''))<(b.tanggal+(b.jam||''))?-1:1).slice(0,3),
    act=Object.entries(ACT).flatMap(([c,[ic,lbl,tt]])=>d[c].map(x=>({key:c+x.id,icon:ic,t:ts(x),title:tt(x)||'-',lbl}))).sort((a,b)=>b.t-a.t).slice(0,6);
  return <div>
    <div className="greet"><h1>{sapaan()}, {(prof.nama||'').split(' ')[0]}</h1><p>{hariPanjang()}</p></div>
    <div className="dash">
      <div className="dash-col">
        <section className={'card next '+nx.tone} aria-label="Langkah berikutnya"><div className="eyebrow">Langkah berikutnya</div><h2>{nx.title}</h2><p>{nx.detail}</p><button type="button" className="btn" onClick={()=>go(nx.to)}>{nx.cta} <Icon name="chev-right" size={18}/></button></section>
        <section aria-label="Aksi cepat"><div className="qa">{QA.map(([l,ic,to])=><button type="button" key={to} className="qa-i" onClick={()=>go(to)}><span className="qa-c"><Icon name={ic} size={20}/></span>{l}</button>)}</div></section>
        <section className="card" aria-label="Progres skripsi"><div className="sec-h"><h2>Progres skripsi</h2><div className="row"><button type="button" className="btn ghost sm" onClick={()=>setHow(true)}><Icon name="info" size={16}/> Cara menghitung</button><button type="button" className="btn ghost sm" onClick={()=>go('prog')}>Perjalanan <Icon name="chev-right" size={16}/></button></div></div>
          <div className="big"><b className="num">{P.overall}%</b><span>dari Bab I sampai Bab V</span></div><Progress value={P.overall} size="lg" label="Progres keseluruhan"/>
          <div className="babs">{P.babs.map(b=><div className="bab-r" key={b.bab}><div className="top"><b>{b.bab}</b><Badge tone={STATUS_TONE[b.status]}>{b.status}</Badge><span className="pc">{b.pct}%</span></div><Progress value={b.pct} label={'Progres '+b.bab}/>
            <small>{b.discussed?'Sudah dibahas':'Belum dibahas'} · Revisi {b.rev.done}/{b.rev.total} · Kegiatan {b.run.done}/{b.run.total}{b.late?` · ${b.late} terlambat`:''}</small></div>)}</div>
          {(P.outside.rev>0||P.outside.run>0)&&<p className="mut" style={{fontSize:'var(--fs-xs)',marginTop:16,marginBottom:0}}>{P.outside.rev} revisi dan {P.outside.run} kegiatan tanpa bab (atau bab “Umum”) tidak ikut dihitung.</p>}</section>
      </div>
      <div className="dash-col">
        <section className="card" aria-label="Jadwal terdekat"><div className="sec-h"><h2>Jadwal terdekat</h2><button type="button" className="btn ghost sm" onClick={()=>go('jdw')}>Semua</button></div>
          {jd.length?jd.map(x=><div className="li" key={x.id}><div className="when">{relDay(x.tanggal,t)}<br/>{x.jam}</div><div className="what"><b>{x.agenda}</b><span>{fmtDate(x.tanggal)} · {x.dosen}</span></div></div>):<EmptyState compact title="Belum ada jadwal" text="Rencanakan pertemuan berikutnya dengan dosen." action={<button type="button" className="btn sec sm" onClick={()=>go('jdw/baru')}>Tambah jadwal</button>}/>}</section>
        <section className="card" aria-label="Revisi mendesak"><div className="sec-h"><h2>Revisi mendesak</h2><button type="button" className="btn ghost sm" onClick={()=>go('rev')}>Semua</button></div>
          {urg.length?urg.map(x=><div className="li" key={x.id}><div className="when">{x.deadline?relDay(x.deadline,t):'Tanpa deadline'}</div><div className="what"><b>{x.catatan}</b><span>{x.bab||'Tanpa bab'} · prioritas {(x.prioritas||'sedang').toLowerCase()}</span></div>{x._d!==null&&x._d<0&&<Badge tone="danger">Terlambat</Badge>}</div>):<EmptyState compact title="Tidak ada revisi mendesak" text="Revisi yang mendekati deadline atau berprioritas tinggi akan muncul di sini."/>}</section>
        <section className="card" aria-label="Aktivitas terbaru"><div className="sec-h"><h2>Aktivitas terbaru</h2></div>
          {act.length?<Timeline items={act.map(a=>({key:a.key,icon:a.icon,title:a.title.length>60?a.title.slice(0,60)+'…':a.title,meta:`${a.lbl} · ${relTime(a.t)}`}))}/>:<EmptyState compact title="Belum ada aktivitas" text="Bimbingan, revisi, dokumen, dan catatan terbaru akan tampil di sini."/>}</section>
      </div></div>
    <Formula open={how} onClose={()=>setHow(false)}/>
  </div>}

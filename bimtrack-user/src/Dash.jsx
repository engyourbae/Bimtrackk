import {useState} from 'react';
import {useCols} from './useData';
import {Icon,Badge,Progress,EmptyState,DataState,Timeline,Skeleton} from './shared/ui';
import {todayStr,fmtDate,relDay,relTime,sapaan,hariPanjang} from '@shared/date';
import {calcProgress,nextStep,urgentRevisi,STATUS_TONE} from './progress';
import {calcPra} from './pra';
import {JUDUL_TONE} from './config';
import Formula from './Formula';
import {DashSkeleton} from './PageSkeleton';
const COLS=['bimbingan','revisi','jadwal','rundown','dokumen','ringkasan'];
const QA=[['Catatan','bimbingan','bim/baru'],['Revisi','revisi','rev/baru'],['Jadwal','jadwal','jdw/baru'],['Rundown','rundown','run/baru'],['Dokumen','dokumen','dok/baru'],['Bukti','image','bkt/baru'],['Laporan','laporan','rin'],['Perjalanan','route','prog']];
const ACT={bimbingan:['bimbingan','Bimbingan',x=>x.topik],revisi:['revisi','Revisi',x=>x.catatan],dokumen:['dokumen','Dokumen',x=>x.nama],ringkasan:['ringkasan','Catatan ringkasan',x=>x.scope]};
/** Judul skripsi di bagian atas dasbor: teks biasa yang mengalir (rata kiri, membungkus alami, seluruh judul terlihat).
 *  Punya status memuat/galat sendiri: bila gagal, dasbor lain tetap tampil. */
function JudulSkripsi({uid,go}){
  const live=useCols(['skripsi'],uid);
  if(live.status==='loading')return <Skeleton h={120} r={16}/>;
  if(live.status!=='ready')return null;
  const row=live.d.skripsi?.[0],judul=(row?.judul||'').trim();
  if(!judul)return <section className="card jdash empty" aria-label="Judul skripsi"><div className="eyebrow">Judul skripsi</div><p className="mut" style={{margin:'var(--s2) 0 var(--s3)'}}>Simpan judul skripsimu di sini supaya selalu terlihat saat membuka BIMTRACK.</p><button type="button" className="btn sec sm" onClick={()=>go('prog')}><Icon name="plus" size={16}/> Isi judul</button></section>;
  return <section className="card jdash" aria-label="Judul skripsi"><div className="eyebrow">Judul skripsi</div>
    <h2 className="jdl jdash-t">{judul}</h2>
    <div className="jdash-f"><Badge tone={JUDUL_TONE[row.judulStatus]||'neutral'}>{row.judulStatus||'Draf'}</Badge><button type="button" className="btn ghost sm" onClick={()=>go('prog')}><Icon name="pencil" size={16}/> Ubah</button></div></section>}

/** Progres tahapan Outline sampai Seminar Proposal, diambil dari tahapan yang ditandai di halaman Perjalanan. */
function PraProgress({uid,go}){
  const live=useCols(['skripsi'],uid);
  if(live.status==='loading')return <Skeleton h={150} r={12}/>;
  if(live.status!=='ready')return <p className="mut" style={{fontSize:'var(--fs-sm)',margin:0}}>Progres Outline sampai Seminar Proposal belum bisa dimuat. <button type="button" className="btn ghost sm" onClick={live.retry}>Coba lagi</button></p>;
  const P=calcPra(live.d.skripsi?.[0]),started=P.steps.some(x=>x.status!=='belum');
  return <div className="pr" aria-label="Progres Outline sampai Seminar Proposal">
    <h3 className="sub-h">Outline sampai Seminar Proposal</h3>
    <div className="big"><b className="num">{P.pct}%</b><span>{P.done} dari {P.total} tahap selesai</span></div><Progress value={P.pct} accent size="lg" label="Progres Outline sampai Seminar Proposal"/>
    <ol className="pr-l">{P.steps.map(s=><li key={s.k} className={'pr-i '+s.status}><span className="pr-d" aria-hidden="true">{s.status==='selesai'&&<Icon name="check" size={12} strokeWidth={3}/>}</span><span className="pr-t">{s.t}</span><span className="pr-m">{s.status==='selesai'?(s.date?fmtDate(s.date):'Selesai'):s.status==='berjalan'?'Berjalan':''}</span></li>)}</ol>
    {!started&&<p className="mut" style={{fontSize:'var(--fs-xs)',margin:'var(--s3) 0 0'}}>Tandai tahapanmu di <button type="button" className="lnk" onClick={()=>go('prog')}>Perjalanan</button>, persen ini terisi otomatis.</p>}</div>}
const ts=x=>(x.updatedAt||x.createdAt)?.seconds??Date.now()/1000;
export default function Dash({uid,prof,go}){
  const live=useCols(COLS,uid),d=live.d,[how,setHow]=useState(false);
  // memuat → skeleton; galat/offline/timeout → pesan + "Coba lagi" (tidak lagi tampil seolah data kosong)
  if(live.status!=='ready')return <DataState status={live.status} error={live.error} onRetry={live.retry} skeleton={<DashSkeleton/>} label="Memuat dasbor"/>;
  const t=todayStr(),P=calcProgress({...d,today:t}),nx=nextStep({...d,today:t}),urg=urgentRevisi(d.revisi,t),
    jd=d.jadwal.filter(x=>x.tanggal>=t&&!['Dibatalkan','Selesai'].includes(x.status)).sort((a,b)=>(a.tanggal+(a.jam||''))<(b.tanggal+(b.jam||''))?-1:1).slice(0,3),
    act=Object.entries(ACT).flatMap(([c,[ic,lbl,tt]])=>d[c].map(x=>({key:c+x.id,icon:ic,t:ts(x),title:tt(x)||'-',lbl}))).sort((a,b)=>b.t-a.t).slice(0,6);
  return <div>
    <div className="greet"><h1>{sapaan()}, {(prof.nama||'').split(' ')[0]}</h1><p>{hariPanjang()}</p></div>
    <JudulSkripsi uid={uid} go={go}/>
    <div className="dash">
      <div className="dash-col">
        <section className={'card next '+nx.tone} aria-label="Langkah berikutnya"><div className="eyebrow">Langkah berikutnya</div><h2>{nx.title}</h2><p>{nx.detail}</p><button type="button" className="btn" onClick={()=>go(nx.to)}>{nx.cta} <Icon name="chev-right" size={18}/></button></section>
        <section aria-label="Aksi cepat"><div className="qa">{QA.map(([l,ic,to])=><button type="button" key={to} className="qa-i" onClick={()=>go(to)}><span className="qa-c"><Icon name={ic} size={20}/></span>{l}</button>)}</div></section>
        <section className="card" aria-label="Progres skripsi"><div className="sec-h stk"><h2>Progres skripsi</h2><div className="acts"><button type="button" className="btn sec sm" onClick={()=>setHow(true)}><Icon name="info" size={16}/> Cara menghitung</button><button type="button" className="btn sec sm" onClick={()=>go('prog')}>Perjalanan <Icon name="chev-right" size={16}/></button></div></div>
          <PraProgress uid={uid} go={go}/><hr className="pr-sep"/><h3 className="sub-h">Bab I sampai Bab V</h3>
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

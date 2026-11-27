import {useState} from 'react';
import {useCols} from './useData';
import Formula from './Formula';
import {setFilter} from './Crud';
import {PageHead,Icon,Badge,Progress,EmptyState,DataState,Timeline,Skeleton} from './shared/ui';
import Skripsi from './Skripsi';
import {navigate} from '@shared/router';
import {todayStr,fmtDate} from '@shared/date';
import {calcProgress,STATUS_TONE} from './progress';
const COLS=['bimbingan','revisi','rundown'];
const go=(col,page,bab)=>{setFilter(col,{bab});navigate(page)};
/** Perjalanan Skripsi: posisi tiap bab (Bab I–V), dihitung dari data bimbingan, revisi, dan rundown milik sendiri. */
export default function Journey({uid}){
  const live=useCols(COLS,uid),d=live.d,[how,setHow]=useState(false);
  if(live.status!=='ready')return <div><PageHead title="Perjalanan Skripsi"/><Skripsi uid={uid}/><div style={{height:'var(--s4)'}}/>
    <DataState status={live.status} error={live.error} onRetry={live.retry} label="Memuat perjalanan skripsi" skeleton={<div className="stack"><Skeleton h={140} r={16}/><Skeleton h={170} r={16}/><Skeleton h={170} r={16}/></div>}/></div>;
  const t=todayStr(),P=calcProgress({...d,today:t}),empty=COLS.every(c=>!d[c].length),
    steps=[...d.bimbingan.filter(x=>x.status==='Terlaksana'&&x.tanggal).map(x=>({key:'b'+x.id,date:x.tanggal,icon:'bimbingan',title:`${x.bab||'Umum'}: ${x.topik||'Bimbingan'}`,lbl:'Bimbingan'})),
      ...d.revisi.filter(x=>x.tanggalSelesai).map(x=>({key:'r'+x.id,date:x.tanggalSelesai,icon:'check',title:`${x.bab||'Umum'}: ${(x.catatan||'Revisi').slice(0,70)}`,lbl:'Revisi selesai',tone:'ok'}))]
      .sort((a,b)=>a.date<b.date?1:a.date>b.date?-1:0).slice(0,8);
  return <div>
    <PageHead title="Perjalanan Skripsi" sub="Posisi tiap bab dari Bab I sampai Bab V, dihitung dari datamu sendiri" actions={<button type="button" className="btn sec" onClick={()=>setHow(true)}><Icon name="info" size={18}/> Cara menghitung</button>}/>
    <Skripsi uid={uid}/><div style={{height:'var(--s4)'}}/>
    {empty?<EmptyState title="Perjalananmu belum dimulai" text="Catat bimbingan, revisi, atau kegiatan rundown dan beri bab. Progres tiap bab akan muncul di sini." action={<button type="button" className="btn" onClick={()=>navigate('bim','baru')}><Icon name="plus" size={18}/> Catat bimbingan pertama</button>}/>:<>
    <section className="card" aria-label="Progres keseluruhan"><div className="big"><b className="num">{P.overall}%</b><span>dari Bab I sampai Bab V</span></div><Progress value={P.overall} size="lg" label="Progres keseluruhan"/></section>
    <div className="jr">{P.babs.map(b=>{const nb=d.bimbingan.filter(x=>x.bab===b.bab).length,last=d.bimbingan.filter(x=>x.bab===b.bab&&x.status==='Terlaksana'&&x.tanggal).map(x=>x.tanggal).sort().pop();
      return <section className="card jr-b" key={b.bab} aria-label={b.bab}><div className="row"><h2 className="sp">{b.bab}</h2><Badge tone={STATUS_TONE[b.status]}>{b.status}</Badge><b className="num">{b.pct}%</b></div>
        <Progress value={b.pct} label={'Progres '+b.bab}/>
        <ul className="jr-l"><li>{b.discussed?<>Sudah dibahas dosen{last&&<span className="mut"> · terakhir {fmtDate(last)}</span>}</>:'Belum dibahas dosen'}</li><li>Revisi selesai {b.rev.done} dari {b.rev.total}</li><li>Kegiatan selesai {b.run.done} dari {b.run.total}</li>{b.late>0&&<li className="jr-late">{b.late} terlambat</li>}{b.waiting>0&&<li>{b.waiting} revisi menunggu pemeriksaan</li>}{b.redo>0&&<li className="jr-late">{b.redo} revisi perlu dikerjakan ulang</li>}</ul>
        <div className="row jr-a"><button type="button" className="btn sec sm" disabled={!nb} onClick={()=>go('bimbingan','bim',b.bab)}>Catatan ({nb})</button><button type="button" className="btn sec sm" disabled={!b.rev.total} onClick={()=>go('revisi','rev',b.bab)}>Revisi ({b.rev.total})</button><button type="button" className="btn sec sm" disabled={!b.run.total} onClick={()=>go('rundown','run',b.bab)}>Kegiatan ({b.run.total})</button></div></section>})}</div>
    {(P.outside.rev>0||P.outside.run>0)&&<p className="mut" style={{fontSize:'var(--fs-xs)'}}>{P.outside.rev} revisi dan {P.outside.run} kegiatan tanpa bab (atau bab “Umum”) tidak ikut dihitung.</p>}
    <section className="card" aria-label="Jejak terbaru"><div className="sec-h"><h2>Jejak terbaru</h2></div>{steps.length?<Timeline items={steps.map(s=>({key:s.key,icon:s.icon,tone:s.tone,title:s.title,meta:`${s.lbl} · ${fmtDate(s.date)}`}))}/>:<EmptyState compact title="Belum ada jejak" text="Bimbingan yang terlaksana dan revisi yang selesai akan tercatat di sini."/>}</section></>}
    <Formula open={how} onClose={()=>setHow(false)}/></div>}

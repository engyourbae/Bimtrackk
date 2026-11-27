import {useEffect,useMemo,useState} from 'react';
import {useCols} from './useData';
import Crud from './Crud';
import Cal from './Cal';
import {PageHead,Segmented,Badge,Icon,Switch,Skeleton,toast} from './shared/ui';
import {navigate} from '@shared/router';
import {todayStr,relDay,addDays,HARI,BULAN_S} from '@shared/date';
import {JDW,RUN,BAB,JDW_TONE,RUN_TONE} from './config';
import {weekStart,weekDays,byWhen,isPast,reminders} from './schedule';
import {scheduleNotifs,onNotifChange} from './notify';
import {NotifControl} from './Device';

const ls=(k,v)=>{try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch{return null}};

function Item({x,onOpen}){return <button type="button" className="wk-i" onClick={()=>onOpen(x.id)}><b>{x.jam||'--:--'}</b><span className="wk-t"><span>{x.agenda}</span><small className="mut">{[x.dosen,x.lokasi].filter(Boolean).join(' · ')}</small></span>{x.status&&<Badge tone={JDW_TONE[x.status]||'neutral'}>{x.status}</Badge>}</button>}

/** Tampilan mingguan: tujuh baris hari (Senin–Minggu), cocok di HP maupun laptop. */
function WeekView({rows,onOpen}){
  const today=todayStr(),[start,setStart]=useState(()=>weekStart(today)),days=weekDays(start),a=days[0],b=days[6],
    lbl=`${+a.slice(8)} ${BULAN_S[+a.slice(5,7)-1]} – ${+b.slice(8)} ${BULAN_S[+b.slice(5,7)-1]} ${b.slice(0,4)}`,total=days.reduce((n,d)=>n+rows.filter(r=>r.tanggal===d).length,0);
  return <div className="card wk"><div className="row"><button type="button" className="ib" onClick={()=>setStart(addDays(start,-7))} aria-label="Minggu sebelumnya"><Icon name="chev-left"/></button><b className="sp" style={{textAlign:'center'}} aria-live="polite">{lbl}</b><button type="button" className="ib" onClick={()=>setStart(addDays(start,7))} aria-label="Minggu berikutnya"><Icon name="chev-right"/></button></div>
    <div className="row" style={{justifyContent:'space-between',margin:'4px 0 8px'}}><span className="mut" style={{fontSize:'var(--fs-sm)'}}>{total?`${total} jadwal minggu ini`:'Tidak ada jadwal minggu ini'}</span><button type="button" className="btn ghost sm" disabled={start===weekStart(today)} onClick={()=>setStart(weekStart(today))}>Minggu ini</button></div>
    {days.map(d=>{const it=rows.filter(r=>r.tanggal===d).sort(byWhen),dt=new Date(+d.slice(0,4),+d.slice(5,7)-1,+d.slice(8));
      return <div key={d} className={'wk-d'+(d===today?' today':'')}><div className="wk-h"><b>{HARI[dt.getDay()]}</b><span>{+d.slice(8)} {BULAN_S[+d.slice(5,7)-1]}</span></div><div className="wk-b">{it.length?it.map(x=><Item key={x.id} x={x} onOpen={onOpen}/>):<span className="mut wk-e">Tidak ada jadwal</span>}</div></div>})}</div>}

/** Pengingat: jadwal dekat, jadwal yang perlu diperbarui statusnya, dan notifikasi perangkat (opsional). */
function Reminders({rows,onOpen}){
  const today=todayStr(),{stale,soon}=useMemo(()=>reminders(rows,today),[rows,today]);
  const L=x=><button type="button" className="rem-i" key={x.id} onClick={()=>onOpen(x.id)}><span className="rem-w">{relDay(x.tanggal,today)}{x.jam?' · '+x.jam:''}</span><span className="rem-t">{x.agenda}</span>{x.dosen&&<small className="mut">{x.dosen}</small>}</button>;
  return <section className="card rem" aria-label="Pengingat"><div className="sec-h"><h2>Pengingat</h2></div>
    {soon.length>0&&<><div className="eyebrow">Hari ini dan besok</div>{soon.map(L)}</>}
    {stale.length>0&&<><div className="eyebrow rem-s">Perlu diperbarui statusnya ({stale.length})</div><p className="mut" style={{fontSize:'var(--fs-sm)',margin:'0 0 6px'}}>Tanggalnya sudah lewat tetapi belum ditandai selesai, dibatalkan, atau dijadwalkan ulang.</p>{stale.slice(0,5).map(L)}{stale.length>5&&<p className="mut" style={{fontSize:'var(--fs-xs)'}}>dan {stale.length-5} lainnya (lihat tab Riwayat).</p>}</>}
    {!soon.length&&!stale.length&&<p className="mut" style={{margin:'0 0 8px'}}>Tidak ada jadwal hari ini atau besok, dan tidak ada yang perlu diperbarui.</p>}
    <NotifControl/></section>}

function HistoryHead({rows}){
  const today=todayStr(),p=rows.filter(x=>isPast(x,today)),n=s=>p.filter(x=>x.status===s).length,stale=reminders(rows,today).stale.length;
  return <div className="mini"><Badge tone="ok">Selesai {n('Selesai')}</Badge><Badge tone="danger">Dibatalkan {n('Dibatalkan')}</Badge><Badge tone="warn">Dijadwalkan ulang {n('Dijadwalkan ulang')}</Badge>{stale>0&&<Badge tone="warn">Belum diperbarui {stale}</Badge>}</div>}

function JadwalTab({uid,autoNew,onAutoNew,openId,onOpenId}){
  const rows=useCols(['jadwal'],uid).jadwal,[sub,setSub]=useState(()=>['minggu','bulan','riwayat'].includes(ls('bimtrack-jdw-sub'))?ls('bimtrack-jdw-sub'):'minggu'),today=todayStr(),hist=sub==='riwayat';
  const pick=v=>{setSub(v);ls('bimtrack-jdw-sub',v)},open=id=>navigate('jdw',id);
  const[nt,setNt]=useState(0);useEffect(()=>onNotifChange(()=>setNt(x=>x+1)),[]);
  useEffect(()=>{if(!rows)return;return scheduleNotifs(rows)},[rows,nt]);
  return <div>
    {!rows?<div className="stack"><Skeleton h={150} r={16}/><Skeleton h={260} r={16}/></div>:<Reminders rows={rows} onOpen={open}/>}
    <div className="subtabs"><Segmented label="Tampilan jadwal" value={sub} onChange={pick} options={[{value:'minggu',label:'Mingguan',icon:'week'},{value:'bulan',label:'Bulanan',icon:'jadwal'},{value:'riwayat',label:'Riwayat',icon:'history'}]}/></div>
    {rows&&(sub==='minggu'?<WeekView rows={rows} onOpen={open}/>:sub==='bulan'?<Cal rows={rows} onOpen={open}/>:<HistoryHead rows={rows}/>)}
    <Crud embedded col="jadwal" uid={uid} title="Jadwal" listTitle={hist?'Riwayat pertemuan':'Pertemuan mendatang'} fields={JDW} titleKey="agenda" subKeys={['tanggal','jam','dosen','lokasi']} statusKey="status" tones={JDW_TONE}
      filters={[{key:'status',label:'Status',options:JDW[6].options},{key:'dosen',label:'Dosen',options:'data'}]} range="tanggal"
      scope={x=>hist===isPast(x,today)} scopeKey={(hist?'past':'up')+today} descDefault={hist} sortLabels={hist?['Terbaru','Terlama']:['Terjauh','Terdekat']} defaults={()=>({status:'Direncanakan'})}
      autoNew={autoNew} onAutoNew={onAutoNew} openId={openId} onOpenId={onOpenId}/></div>}

function RundownTab({uid,autoNew,onAutoNew,openId,onOpenId,late}){
  return <Crud embedded col="rundown" uid={uid} title="Rundown" listTitle="Rundown kegiatan" fields={RUN} titleKey="nama" subKeys={['deadline','bab','prioritas']} sortKey="deadline" timeKey="deadline" statusKey="status" tones={RUN_TONE}
    views={['list','board','timeline']} filters={[{key:'bab',label:'Bab',options:BAB},{key:'status',label:'Status',options:RUN[6].options},{key:'prioritas',label:'Prioritas',options:['Rendah','Sedang','Tinggi']}]}
    descDefault={false} sortLabels={['Terjauh','Terdekat']} defaults={()=>({status:'Belum mulai'})} badge={late} autoNew={autoNew} onAutoNew={onAutoNew} openId={openId} onOpenId={onOpenId}/>}

/** Jadwal Bimbingan = Jadwal (mingguan, bulanan, riwayat, pengingat) + Rundown (daftar, papan, linimasa). tab: 'jdw' | 'run'. */
export default function JadwalPage({uid,tab,autoNew,onAutoNew,openId,onOpenId,late}){
  const p={uid,autoNew,onAutoNew,openId,onOpenId};
  return <div><PageHead title="Jadwal Bimbingan" sub="Pertemuan dengan dosen dan rundown kegiatan skripsimu"/>
    <div className="subtabs"><Segmented label="Bagian" value={tab} onChange={v=>navigate(v)} options={[{value:'jdw',label:'Jadwal',icon:'jadwal'},{value:'run',label:'Rundown',icon:'rundown'}]}/></div>
    {tab==='jdw'?<JadwalTab {...p}/>:<RundownTab {...p} late={late}/>}</div>}

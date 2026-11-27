import {useState} from 'react';
import {Badge,Icon} from './shared/ui';
import {monthGrid,toIso,todayStr,BULAN,fmtDate} from '@shared/date';
import {JDW_TONE} from './config';
import {byWhen} from './schedule';
/** Kalender bulanan (minggu mulai Senin, sama dengan pemilih tanggal). rows: jadwal; onOpen(id) membuka detail. */
export default function Cal({rows,onOpen}){
  const[m,setM]=useState(()=>{const d=new Date();return{y:d.getFullYear(),m:d.getMonth()}}),[sel,setSel]=useState(''),today=todayStr(),
    nav=n=>setM(({y,m})=>{const d=new Date(y,m+n,1);return{y:d.getFullYear(),m:d.getMonth()}}),
    cnt=Object.create(null);rows.forEach(r=>{if(r.tanggal)cnt[r.tanggal]=(cnt[r.tanggal]||0)+1});
  const day=rows.filter(r=>r.tanggal===sel).sort(byWhen);
  return <div className="card"><div className="row"><button type="button" className="ib" onClick={()=>nav(-1)} aria-label="Bulan sebelumnya"><Icon name="chev-left"/></button><b className="sp" style={{textAlign:'center'}} aria-live="polite">{BULAN[m.m]} {m.y}</b><button type="button" className="ib" onClick={()=>nav(1)} aria-label="Bulan berikutnya"><Icon name="chev-right"/></button></div>
    <div className="cal cal-h" aria-hidden="true">{['Sen','Sel','Rab','Kam','Jum','Sab','Min'].map(d=><span key={d} className="mut">{d}</span>)}</div>
    <div className="cal">{monthGrid(m.y,m.m).map(c=><button type="button" key={c.date} className={'day'+(sel===c.date?' on':'')+(c.date===today?' today':'')+(c.inMonth?'':' out')} aria-pressed={sel===c.date} aria-label={fmtDate(c.date,'panjang')+(cnt[c.date]?`, ${cnt[c.date]} jadwal`:'')} onClick={()=>setSel(sel===c.date?'':c.date)}>{c.day}{!!cnt[c.date]&&<i/>}</button>)}</div>
    <div className="row" style={{justifyContent:'space-between'}}><button type="button" className="btn ghost sm" onClick={()=>{const d=new Date();setM({y:d.getFullYear(),m:d.getMonth()});setSel(toIso(d))}}>Hari ini</button></div>
    {sel&&<div className="cal-day"><div className="eyebrow">{fmtDate(sel,'panjang')}</div>{day.length?day.map(r=><button type="button" key={r.id} className="wk-i" onClick={()=>onOpen?.(r.id)}><b>{r.jam||'--:--'}</b><span className="wk-t"><span>{r.agenda}</span><small className="mut">{[r.dosen,r.lokasi].filter(Boolean).join(' · ')}</small></span>{r.status&&<Badge tone={JDW_TONE[r.status]||'neutral'}>{r.status}</Badge>}</button>):<p className="mut" style={{margin:'6px 0 0'}}>Tidak ada jadwal pada tanggal ini.</p>}</div>}</div>}

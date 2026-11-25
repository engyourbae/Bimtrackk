import {useState} from 'react';
import {Badge} from './shared/ui';
export default function Cal({rows}){
  const[m,setM]=useState(()=>{const d=new Date();return new Date(d.getFullYear(),d.getMonth(),1)}),[sel,setSel]=useState('');
  const y=m.getFullYear(),mo=m.getMonth(),first=new Date(y,mo,1).getDay(),days=new Date(y,mo+1,0).getDate(),pad=n=>String(n).padStart(2,'0'),key=d=>`${y}-${pad(mo+1)}-${pad(d)}`;
  const cells=[...Array(first).fill(null),...Array.from({length:days},(_,i)=>i+1)],day=rows.filter(r=>r.tanggal===sel);
  return <div className="card"><div className="row"><button className="ib" onClick={()=>setM(new Date(y,mo-1,1))} aria-label="Bulan sebelumnya">‹</button><b className="sp" style={{textAlign:'center'}}>{m.toLocaleDateString('id-ID',{month:'long',year:'numeric'})}</b><button className="ib" onClick={()=>setM(new Date(y,mo+1,1))} aria-label="Bulan berikutnya">›</button></div>
    <div className="cal">{['M','S','S','R','K','J','S'].map((d,i)=><span key={i} className="mut">{d}</span>)}{cells.map((d,i)=>d?<button key={i} className={'day'+(sel===key(d)?' on':'')} onClick={()=>setSel(key(d))}>{d}{rows.some(r=>r.tanggal===key(d))&&<i/>}</button>:<span key={i}/>)}</div>
    {sel&&(day.length?day.map(r=><p key={r.id} style={{margin:'6px 0'}}><b>{r.jam||'--:--'}</b> {r.agenda} · {r.dosen} <Badge>{r.status}</Badge></p>):<p className="mut">Tidak ada jadwal pada {sel}.</p>)}</div>}

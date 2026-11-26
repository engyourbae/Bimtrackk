import {useState} from 'react';
import {Icon} from './icons';
import {toast} from './ui/core';
import {Switch,Segmented} from './ui/fields';
import {getSessionPolicy,setSessionPolicy,SESSION_OPTS} from './security';
/** Kartu pengaturan: kedaluwarsa sesi otomatis. app = 'user' | 'admin'. Berlaku per perangkat. */
export function SessionCard({app}){
  const[p,setP]=useState(()=>getSessionPolicy(app)),lbl=m=>SESSION_OPTS.find(o=>+o.value===m)?.label||'';
  const save=v=>{setP(v);setSessionPolicy(app,v);toast(v.on?'Keluar otomatis setelah '+lbl(v.m)+' tidak aktif':'Sesi tidak lagi kedaluwarsa otomatis')};
  return <div className="card"><div className="row"><Icon name="clock" size={20}/><h2 className="sp">Keamanan sesi</h2></div>
    <p className="mut" style={{margin:'8px 0 4px'}}>Aktifkan agar akunmu keluar sendiri saat perangkat ditinggal. Matikan bila ingin tetap masuk terus di perangkat pribadimu.</p>
    <Switch checked={p.on} onChange={on=>save({...p,on})} label="Kedaluwarsakan sesi otomatis"/>
    {p.on&&<div className="field" style={{marginTop:8}}><label>Keluar setelah tidak aktif selama</label><Segmented label="Batas tidak aktif" value={String(p.m)} onChange={v=>save({...p,m:+v})} options={SESSION_OPTS}/></div>}
    <p className="hint mut" style={{fontSize:'var(--fs-xs)',margin:'8px 0 0'}}>Pengaturan ini hanya berlaku di perangkat ini. Tombol “Tetap masuk di perangkat ini” saat masuk mengatur apakah sesi bertahan setelah peramban ditutup.</p></div>}

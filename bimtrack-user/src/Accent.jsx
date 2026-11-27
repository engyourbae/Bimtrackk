import {useState} from 'react';
import {Icon} from './shared/ui';
import {ACCENTS,getAccent,setAccent} from '@shared/accent';
/** Pilihan warna aplikasi (tombol, bilah progres, ikon). Langsung berlaku dan diingat di perangkat ini. */
export default function Accent(){
  const[a,setA]=useState(getAccent);
  return <div className="acc-pick" role="radiogroup" aria-label="Warna aplikasi">{ACCENTS.map(o=>
    <button type="button" role="radio" aria-checked={o.id===a} className="acc-o" key={o.id} onClick={()=>{setAccent(o.id);setA(o.id)}}>
      <span className="sw" style={{background:o.sw}}>{o.id===a&&<Icon name="check" size={18} strokeWidth={3}/>}</span>{o.label}</button>)}</div>}

import {useState,useEffect,useRef,useId} from 'react';
import {Icon} from '../icons';
import {useSlider} from '../motion';
import {Modal,Popover,useMobile} from './core';
import {BULAN,BULAN_S,fmtDate,isTime,monthGrid,parseDate,todayStr} from '../date';

export const Field=({label,req,hint,error,children,id})=><div className="field"><label htmlFor={id}>{label}{req&&<span className="req"> *</span>}</label>{children}{error?<div className="err" role="alert">{error}</div>:hint&&<div className="hint">{hint}</div>}</div>;

/* ---------- Daftar pilihan (dipakai Select, MultiSelect, StatusSelect) ---------- */
const norm=o=>o!==null&&typeof o==='object'?o:{value:o,label:o};
function OptList({opts,sel,multi,onPick,searchable}){
  const[q,setQ]=useState(''),[hi,setHi]=useState(()=>Math.max(0,opts.findIndex(o=>sel.includes(o.value)))),ref=useRef();
  const list=q.trim()?opts.filter(o=>String(o.text??o.label).toLowerCase().includes(q.trim().toLowerCase())):opts;
  useEffect(()=>{setHi(0)},[q]);
  useEffect(()=>{ref.current?.querySelector('.hi')?.scrollIntoView({block:'nearest'})},[hi]);
  useEffect(()=>{(searchable?ref.current?.querySelector('input'):ref.current)?.focus({preventScroll:true})},[]);
  const key=e=>{if(e.key==='ArrowDown'){e.preventDefault();setHi(i=>Math.min(list.length-1,i+1))}else if(e.key==='ArrowUp'){e.preventDefault();setHi(i=>Math.max(0,i-1))}else if(e.key==='Enter'&&list[hi]){e.preventDefault();onPick(list[hi])}};
  return <div ref={ref} className="optlist" role="listbox" aria-multiselectable={multi||undefined} tabIndex={-1} onKeyDown={key}>
    {searchable&&<label className="optsearch"><Icon name="cari" size={16}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Cari..." aria-label="Cari pilihan"/></label>}
    <div className="optscroll">{list.map((o,i)=>{const on=sel.includes(o.value);
      return <button type="button" role="option" aria-selected={on} key={String(o.value)} className={'opt'+(on?' on':'')+(i===hi?' hi':'')} onMouseEnter={()=>setHi(i)} onClick={()=>onPick(o)}>
        {multi&&<span className={'chk-box'+(on?' on':'')}><Icon name="check" size={14} strokeWidth={3}/></span>}<span className="opt-t">{o.node||o.label}</span>{!multi&&on&&<Icon name="check" size={18}/>}</button>})}
      {!list.length&&<div className="opt-empty">Tidak ada hasil</div>}</div></div>}

/** Dropdown custom dengan pencarian (otomatis bila pilihan > 8). Di HP tampil sebagai bottom sheet. */
export function Select({value,onChange,options,placeholder='Pilih',searchable,disabled,label,invalid,id,className=''}){
  const[open,setOpen]=useState(false),btn=useRef(),mob=useMobile(),opts=options.map(norm),cur=opts.find(o=>o.value===value);
  const pick=o=>{onChange(o.value);setOpen(false);btn.current?.focus?.({preventScroll:true})},list=<OptList opts={opts} sel={[value]} onPick={pick} searchable={searchable??opts.length>8}/>;
  return <><button ref={btn} id={id} type="button" disabled={disabled} className={'in selb '+className} aria-haspopup="listbox" aria-expanded={open} aria-invalid={invalid||undefined} aria-label={label} onClick={()=>setOpen(o=>!o)}>
    <span className={'selb-t'+(cur?'':' ph')}>{cur?(cur.node||cur.label):placeholder}</span><Icon name="chev-down" size={18}/></button>
    {open&&(mob?<Modal open title={label||placeholder} onClose={()=>setOpen(false)}>{list}</Modal>:<Popover anchor={btn} onClose={()=>setOpen(false)}>{list}</Popover>)}</>}

/** Pilih banyak: nilai berupa array. */
export function MultiSelect({value=[],onChange,options,placeholder='Pilih',searchable,disabled,label,id}){
  const[open,setOpen]=useState(false),btn=useRef(),mob=useMobile(),opts=options.map(norm),chosen=opts.filter(o=>value.includes(o.value));
  const toggle=o=>onChange(value.includes(o.value)?value.filter(v=>v!==o.value):[...value,o.value]),list=<OptList opts={opts} sel={value} multi onPick={toggle} searchable={searchable??opts.length>8}/>;
  return <><button ref={btn} id={id} type="button" disabled={disabled} className="in selb" aria-haspopup="listbox" aria-expanded={open} aria-label={label} onClick={()=>setOpen(o=>!o)}>
    {chosen.length?<span className="selb-t chips">{chosen.slice(0,2).map(o=><span className="chip" key={String(o.value)}>{o.label}</span>)}{chosen.length>2&&<span className="chip">+{chosen.length-2}</span>}</span>:<span className="selb-t ph">{placeholder}</span>}<Icon name="chev-down" size={18}/></button>
    {open&&(mob?<Modal open title={label||placeholder} onClose={()=>setOpen(false)} footer={<button type="button" className="btn block" onClick={()=>setOpen(false)}>Selesai{value.length?` (${value.length})`:''}</button>}>{list}</Modal>:<Popover anchor={btn} onClose={()=>setOpen(false)}>{list}</Popover>)}</>}

/** Pilih status dengan titik warna. tones: {namaStatus:'ok'|'warn'|'danger'|'info'|'primary'} */
export function StatusSelect({value,onChange,options,tones={},...r}){
  const opts=options.map(o=>{const v=typeof o==='string'?o:o.value;return{value:v,text:v,label:v,node:<span className="st"><i className={'dot '+(tones[v]||'')}/>{v}</span>}});
  return <Select value={value} onChange={onChange} options={opts} searchable={false} {...r}/>}

/* ---------- Tanggal ---------- */
export function Calendar({value,onPick,min,max,onClear}){
  const sel=parseDate(value),base=sel||new Date(),[ym,setYm]=useState({y:base.getFullYear(),m:base.getMonth()}),[view,setView]=useState('day'),today=todayStr();
  const nav=d=>setYm(({y,m})=>{const n=new Date(y,m+d,1);return{y:n.getFullYear(),m:n.getMonth()}}),dis=d=>(min&&d<min)||(max&&d>max);
  return <div className="dp"><div className="dp-h">
    <button type="button" className="ib" aria-label={view==='day'?'Bulan sebelumnya':'Tahun sebelumnya'} onClick={()=>view==='day'?nav(-1):setYm(s=>({...s,y:s.y-1}))}><Icon name="chev-left"/></button>
    <button type="button" className="dp-t" onClick={()=>setView(v=>v==='day'?'month':'day')} aria-live="polite">{view==='day'?`${BULAN[ym.m]} ${ym.y}`:ym.y}<Icon name="chev-down" size={16}/></button>
    <button type="button" className="ib" aria-label={view==='day'?'Bulan berikutnya':'Tahun berikutnya'} onClick={()=>view==='day'?nav(1):setYm(s=>({...s,y:s.y+1}))}><Icon name="chev-right"/></button></div>
    {view==='day'?<><div className="dp-w" aria-hidden="true">{['Sen','Sel','Rab','Kam','Jum','Sab','Min'].map(d=><span key={d}>{d}</span>)}</div>
      <div className="dp-g">{monthGrid(ym.y,ym.m).map(c=><button type="button" key={c.date} disabled={dis(c.date)} className={'dp-d'+(c.inMonth?'':' out')+(c.date===today?' today':'')+(c.date===value?' on':'')} aria-pressed={c.date===value} aria-label={fmtDate(c.date,'panjang')} onClick={()=>onPick(c.date)}>{c.day}</button>)}</div></>
    :<div className="dp-m">{BULAN_S.map((n,i)=><button type="button" key={n} className={'dp-mo'+(i===ym.m?' on':'')} onClick={()=>{setYm(s=>({...s,m:i}));setView('day')}}>{n}</button>)}</div>}
    <div className="dp-f"><button type="button" className="btn sec sm" disabled={dis(today)} onClick={()=>onPick(today)}>Hari ini</button>{onClear&&<button type="button" className="btn ghost sm" onClick={onClear}>Hapus</button>}</div></div>}

function PickerShell({trigger,open,setOpen,btn,title,children}){const mob=useMobile();
  return <>{trigger}{open&&(mob?<Modal open title={title} onClose={()=>setOpen(false)}>{children}</Modal>:<Popover anchor={btn} onClose={()=>setOpen(false)}>{children}</Popover>)}</>}

/** Pemilih tanggal (nilai 'YYYY-MM-DD'). Format tampilan mengikuti pengaturan format tanggal. */
export function DatePicker({value,onChange,placeholder='Pilih tanggal',min,max,clearable=true,disabled,label,invalid,id}){
  const[open,setOpen]=useState(false),btn=useRef(),done=v=>{onChange(v);setOpen(false);btn.current?.focus?.({preventScroll:true})};
  return <PickerShell open={open} setOpen={setOpen} btn={btn} title={label||placeholder} trigger={<button ref={btn} id={id} type="button" disabled={disabled} className="in selb" aria-haspopup="dialog" aria-expanded={open} aria-invalid={invalid||undefined} aria-label={label} onClick={()=>setOpen(o=>!o)}>
    <Icon name="jadwal" size={18}/><span className={'selb-t'+(value?'':' ph')}>{value?fmtDate(value):placeholder}</span></button>}>
    <Calendar value={value} min={min} max={max} onPick={done} onClear={clearable&&value?()=>done(''):null}/></PickerShell>}

/* ---------- Jam ---------- */
const pad=n=>String(n).padStart(2,'0'),HRS=Array.from({length:24},(_,i)=>pad(i)),MIN5=Array.from({length:12},(_,i)=>pad(i*5));
function TimeBody({value,onChange,onDone,onClear}){
  const[h,m]=isTime(value)?value.split(':'):['',''],mins=m&&!MIN5.includes(m)?[...MIN5,m].sort():MIN5,hr=useRef(),mr=useRef();
  useEffect(()=>{[hr,mr].forEach(r=>{const c=r.current,el=c?.querySelector('.on');if(el)c.scrollTop=el.offsetTop-c.clientHeight/2+el.offsetHeight/2})},[]);
  return <div className="tp"><div className="tp-cols"><div className="tp-col" ref={hr} role="listbox" aria-label="Jam">{HRS.map(x=><button type="button" key={x} role="option" aria-selected={x===h} className={x===h?'on':''} onClick={()=>onChange(`${x}:${m||'00'}`)}>{x}</button>)}</div>
    <span className="tp-sep">:</span><div className="tp-col" ref={mr} role="listbox" aria-label="Menit">{mins.map(x=><button type="button" key={x} role="option" aria-selected={x===m} className={x===m?'on':''} onClick={()=>{onChange(`${h||'00'}:${x}`);onDone()}}>{x}</button>)}</div></div>
    <div className="dp-f"><button type="button" className="btn sec sm" onClick={()=>{const d=new Date();onChange(`${pad(d.getHours())}:${pad(d.getMinutes())}`);onDone()}}>Sekarang</button>{onClear&&<button type="button" className="btn ghost sm" onClick={()=>{onClear();onDone()}}>Hapus</button>}</div></div>}
/** Pemilih jam (nilai 'HH:MM', 24 jam). */
export function TimePicker({value,onChange,placeholder='Pilih jam',disabled,label,invalid,id}){
  const[open,setOpen]=useState(false),btn=useRef();
  return <PickerShell open={open} setOpen={setOpen} btn={btn} title={label||placeholder} trigger={<button ref={btn} id={id} type="button" disabled={disabled} className="in selb" aria-haspopup="dialog" aria-expanded={open} aria-invalid={invalid||undefined} aria-label={label} onClick={()=>setOpen(o=>!o)}>
    <Icon name="clock" size={18}/><span className={'selb-t'+(isTime(value)?'':' ph')}>{isTime(value)?value:placeholder}</span></button>}>
    <TimeBody value={value} onChange={onChange} onDone={()=>setOpen(false)} onClear={value?()=>onChange(''):null}/></PickerShell>}

/* ---------- Checkbox, radio, switch, segmented ---------- */
export const Checkbox=({checked,onChange,label,disabled})=><label className={'chk'+(disabled?' dis':'')}><input type="checkbox" checked={!!checked} disabled={disabled} onChange={e=>onChange(e.target.checked)}/><span className="chk-box"><Icon name="check" size={14} strokeWidth={3}/></span>{label&&<span>{label}</span>}</label>;
export function RadioGroup({value,onChange,options,label}){const name=useId();
  return <div role="radiogroup" aria-label={label}>{options.map(o=>{const x=norm(o);return <label className="rad" key={String(x.value)}><input type="radio" name={name} checked={x.value===value} onChange={()=>onChange(x.value)}/><span className="rad-dot"/><span>{x.label}</span></label>})}</div>}
export const Switch=({checked,onChange,label,disabled})=><label className={'swt'+(disabled?' dis':'')}><input type="checkbox" role="switch" checked={!!checked} disabled={disabled} onChange={e=>onChange(e.target.checked)}/><span className="sw-track"/>{label&&<span>{label}</span>}</label>;
export function Segmented({value,onChange,options,label}){const ref=useRef(null);useSlider(ref,'[aria-checked=true]',value+'|'+options.length);
  return <div className="seg" ref={ref} role="radiogroup" aria-label={label}>{options.map(o=><button type="button" role="radio" aria-checked={o.value===value} key={o.value} onClick={()=>onChange(o.value)}>{o.icon&&<Icon name={o.icon} size={16}/>}{o.label}</button>)}</div>}
export function ThemePick({get,set}){const[t,setT]=useState(get());
  return <Segmented label="Tema" value={t} onChange={v=>{set(v);setT(v)}} options={[{value:'light',label:'Terang',icon:'sun'},{value:'dark',label:'Gelap',icon:'moon'},{value:'system',label:'Sistem',icon:'monitor'}]}/>}

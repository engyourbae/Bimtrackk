import {useState,useEffect,useRef,useLayoutEffect,useId} from 'react';
import {createPortal} from 'react-dom';
import {Icon} from '../icons';

/* ---------- hook kecil ---------- */
export function useMobile(q='(max-width:640px)'){const[m,setM]=useState(()=>typeof matchMedia==='function'&&matchMedia(q).matches);
  useEffect(()=>{const mq=matchMedia(q),f=()=>setM(mq.matches);f();mq.addEventListener('change',f);return()=>mq.removeEventListener('change',f)},[q]);return m}
/** Menunda pelepasan komponen agar animasi keluar sempat berjalan. */
export function useExit(open,ms=180){const[mounted,setM]=useState(open),[closing,setC]=useState(false);
  useEffect(()=>{if(open){setM(true);setC(false);return}if(!mounted)return;setC(true);const t=setTimeout(()=>{setM(false);setC(false)},ms);return()=>clearTimeout(t)},[open]);return[mounted,closing]}

/* ---------- Toast ---------- */
let push=()=>{};
export const toast=(m,t='ok',act)=>push(m,t,act);
export function ToastHost(){const[a,setA]=useState([]);
  useEffect(()=>{push=(m,t,act)=>{const id=Math.random();setA(x=>[...x.slice(-2),{id,m,t,act}]);setTimeout(()=>setA(x=>x.filter(i=>i.id!==id)),t==='err'?5000:act?7000:3500)};return()=>{push=()=>{}}},[]);
  return <div className="toasts" role="region" aria-label="Pemberitahuan">{a.map(i=><div key={i.id} role={i.t==='err'?'alert':'status'} className={'toast '+i.t}><Icon name={i.t==='err'?'alert':'check-circle'} size={18}/><span className="sp">{i.m}</span>{i.act&&<button type="button" className="toast-act" onClick={()=>{setA(x=>x.filter(z=>z.id!==i.id));i.act.onClick()}}>{i.act.label}</button>}</div>)}</div>}

/* ---------- Popover (dropdown, menu, kalender) ---------- */
export function Popover({anchor,point,onClose,children,minWidth,align='start'}){
  const ref=useRef(),[pos,setPos]=useState(null);
  useLayoutEffect(()=>{const place=()=>{const el=ref.current;if(!el)return;const a=point?{left:point.x,right:point.x,top:point.y,bottom:point.y,width:0}:anchor.current.getBoundingClientRect(),h=el.offsetHeight,w=el.offsetWidth,vw=innerWidth,vh=innerHeight,below=vh-a.bottom-8,up=below<h&&a.top>below;
      let left=align==='end'?a.right-w:a.left;left=Math.max(8,Math.min(left,vw-w-8));
      setPos({left,top:up?Math.max(8,a.top-h-6):Math.min(a.bottom+6,Math.max(8,vh-h-8)),up,w:point?undefined:Math.max(a.width,minWidth||0)})};
    place();addEventListener('resize',place);return()=>removeEventListener('resize',place)},[anchor,point,align,minWidth]);
  useEffect(()=>{const down=e=>{if(ref.current?.contains(e.target)||anchor?.current?.contains(e.target))return;onClose()},esc=e=>{if(e.key==='Escape'){e.stopPropagation();onClose();anchor?.current?.focus?.()}},sc=e=>{if(!ref.current?.contains(e.target))onClose()};
    document.addEventListener('pointerdown',down);document.addEventListener('keydown',esc);addEventListener('scroll',sc,true);
    return()=>{document.removeEventListener('pointerdown',down);document.removeEventListener('keydown',esc);removeEventListener('scroll',sc,true)}},[onClose,anchor]);
  return createPortal(<div ref={ref} className={'pop'+(pos?.up?' up':'')} style={{left:pos?.left??0,top:pos?.top??0,minWidth:pos?.w,visibility:pos?'visible':'hidden'}}>{children}</div>,document.body)}

/* ---------- Modal / bottom sheet ---------- */
const stack=[];let lockN=0;
export function Modal({open,title,onClose,children,footer,size='md'}){
  const[mounted,closing]=useExit(open,200),ref=useRef(),id=useRef(Math.random());
  useEffect(()=>{if(!open)return;const prev=document.activeElement,me=id.current;stack.push(me);lockN++;document.body.classList.add('lock');
    const esc=e=>{if(e.key==='Escape'&&stack[stack.length-1]===me){onClose?.()}};document.addEventListener('keydown',esc);
    const t=setTimeout(()=>{const el=ref.current;if(el&&!el.contains(document.activeElement))el.focus({preventScroll:true})},30);
    return()=>{document.removeEventListener('keydown',esc);clearTimeout(t);stack.splice(stack.indexOf(me),1);if(--lockN<=0){lockN=0;document.body.classList.remove('lock')}prev?.focus?.({preventScroll:true})}},[open]);
  /* input tidak tertutup keyboard: gulirkan ke tengah saat fokus */
  const onFocus=e=>{const t=e.target;if(/^(INPUT|TEXTAREA)$/.test(t.tagName))setTimeout(()=>t.scrollIntoView?.({block:'center',behavior:'smooth'}),320)};
  if(!mounted)return null;
  return createPortal(<div className={'mbg'+(closing?' out':'')} onMouseDown={e=>{if(e.target===e.currentTarget)onClose?.()}}>
    <div className={'sheet '+size} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref} onFocus={onFocus}>
      <div className="grab" aria-hidden="true"/><div className="mh"><h2>{title}</h2><button type="button" className="ib" onClick={onClose} aria-label="Tutup"><Icon name="x"/></button></div>
      <div className="mb">{children}</div>{footer&&<div className="mf">{footer}</div>}</div></div>,document.body)}

/* ---------- Komponen sederhana ---------- */
export const Badge=({tone='neutral',children})=><span className={'badge '+tone}>{children}</span>;
export const Skeleton=({w='100%',h=16,r})=><span className="sk" style={{width:w,height:h,borderRadius:r}} aria-hidden="true"/>;
export const SkeletonList=({n=3})=><div className="stack" role="status" aria-label="Memuat data">{Array.from({length:n},(_,i)=><div className="card" key={i}><Skeleton w="60%" h={18}/><div style={{height:8}}/><Skeleton w="85%" h={12}/></div>)}</div>;
export const Progress=({value=0,label,size,accent})=>{const v=Math.max(0,Math.min(100,Math.round(value)));return <div className={'bar'+(size==='lg'?' lg':'')+(accent?' accent':'')} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={v} aria-label={label}><i style={{'--v':v/100}}/></div>};
export const PageHead=({title,sub,actions})=><header className="pagehead"><div><h1>{title}</h1>{sub&&<p>{sub}</p>}</div>{actions&&<div className="pagehead-act">{actions}</div>}</header>;
export const EmptyState=({title='Belum ada data',text,action,compact})=><div className={'empty-s'+(compact?' compact':'')}>
  <svg className="empty-art" viewBox="0 0 160 112" aria-hidden="true"><path d="M26 74c17-8 36-6 54 4v24C62 92 43 90 26 98z" fill="var(--primary-soft)" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M134 74c-17-8-36-6-54 4v24c18-10 37-12 54-4z" fill="var(--surface-2)" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
  <path d="M42 66c8-8 20-7 20 1 0 7-10 7-8-1 4-12 22-14 36-30 7-7 11-11 16-15" fill="none" stroke="var(--tx3)" strokeWidth="2.5" strokeDasharray="1 7" strokeLinecap="round"/><circle cx="114" cy="22" r="10" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeDasharray="3 4.5"/></svg>
  <h3>{title}</h3>{text&&<p>{text}</p>}{action}</div>;
export function Pass({value,onChange,placeholder='Kata sandi',auto,id,invalid}){const[s,setS]=useState(false);
  return <div className="pw"><input id={id} className="in" type={s?'text':'password'} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} autoComplete={auto} aria-invalid={invalid||undefined}/><button type="button" className="ib" onClick={()=>setS(!s)} aria-label={s?'Sembunyikan kata sandi':'Tampilkan kata sandi'}><Icon name={s?'eye-off':'eye'}/></button></div>}
export function Tooltip({text,children,side='top'}){const[o,setO]=useState(false),id=useId();
  return <span className="tt" onMouseEnter={()=>setO(true)} onMouseLeave={()=>setO(false)} onFocus={()=>setO(true)} onBlur={()=>setO(false)} onKeyDown={e=>e.key==='Escape'&&setO(false)} aria-describedby={o?id:undefined}>{children}{o&&<span role="tooltip" id={id} className={'tt-b '+side}>{text}</span>}</span>}
export const when=t=>t?.toDate?t.toDate().toLocaleString('id-ID'):'-';

/* ---------- Tombol dengan state loading/berhasil, dialog konfirmasi ---------- */
/** Tombol: busy = memproses (spinner, tidak bisa diklik); done = berhasil (centang, hijau sesaat). */
export function Btn({busy,done,className='btn',children,disabled,type='button',...r}){
  return <button type={type} className={className+(done&&!busy?' is-done':'')} disabled={disabled} aria-busy={busy||undefined} {...r}>{done&&!busy&&<Icon name="check" size={16} strokeWidth={2.5}/>}{children}</button>}
/** Penanda singkat "berhasil": [aktif, picu]. Aktif selama ms milidetik. */
export function useFlash(ms=1800){const[on,setOn]=useState(false),t=useRef();useEffect(()=>()=>clearTimeout(t.current),[]);
  return[on,()=>{setOn(true);clearTimeout(t.current);t.current=setTimeout(()=>setOn(false),ms)}]}
/** Konfirmasi tindakan yang tidak bisa dibatalkan. danger = tombol merah. */
export function ConfirmDialog({open,title,text,children,confirmLabel='Hapus',cancelLabel='Batal',danger=true,busy,onConfirm,onCancel}){
  return <Modal open={open} title={title} onClose={busy?undefined:onCancel} footer={<div className="row"><button type="button" className="btn sec sp" disabled={busy} onClick={onCancel}>{cancelLabel}</button><Btn className={'btn sp'+(danger?' dan':'')} busy={busy} onClick={onConfirm}>{confirmLabel}</Btn></div>}>
    {text&&<p style={{margin:0}}>{text}</p>}{children}</Modal>}

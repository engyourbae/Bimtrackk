import {useState,useEffect,useRef} from 'react';
import {Icon} from '../icons';
import {Popover} from './core';

/* ---------- Menu tindakan & context menu ---------- */
function MenuList({items,onDone}){const ref=useRef();
  useEffect(()=>{ref.current?.querySelector('button')?.focus({preventScroll:true})},[]);
  const key=e=>{const b=[...ref.current.querySelectorAll('button')],i=b.indexOf(document.activeElement);if(e.key==='ArrowDown'){e.preventDefault();b[(i+1)%b.length]?.focus()}else if(e.key==='ArrowUp'){e.preventDefault();b[(i-1+b.length)%b.length]?.focus()}};
  return <div className="menu" role="menu" ref={ref} onKeyDown={key}>{items.filter(Boolean).map((it,i)=>it.sep?<div className="menu-sep" key={i}/>:
    <button type="button" role="menuitem" key={i} className={'menu-i'+(it.danger?' dan':'')} onClick={e=>{e.stopPropagation();onDone();it.onClick()}}>{it.icon&&<Icon name={it.icon} size={18}/>}{it.label}</button>)}</div>}
/** Tombol titik tiga yang membuka daftar tindakan. items: [{label,icon,onClick,danger}|{sep:true}] */
export function Menu({items,label='Tindakan',icon='more',align='end'}){const[o,setO]=useState(false),b=useRef();
  return <><button ref={b} type="button" className="ib" aria-haspopup="menu" aria-expanded={o} aria-label={label} onClick={e=>{e.stopPropagation();setO(v=>!v)}}><Icon name={icon}/></button>
    {o&&<Popover anchor={b} align={align} minWidth={190} onClose={()=>setO(false)}><MenuList items={items} onDone={()=>setO(false)}/></Popover>}</>}
/** Klik kanan (laptop) atau tekan lama (HP) pada isi untuk membuka menu. */
export function ContextMenu({items,children,className=''}){const[pt,setPt]=useState(null),t=useRef();
  return <div className={'ctx '+className} onContextMenu={e=>{e.preventDefault();setPt({x:e.clientX,y:e.clientY})}}
    onTouchStart={e=>{const c=e.touches[0];t.current=setTimeout(()=>setPt({x:c.clientX,y:c.clientY}),550)}} onTouchEnd={()=>clearTimeout(t.current)} onTouchMove={()=>clearTimeout(t.current)}>
    {children}{pt&&<Popover point={pt} minWidth={190} onClose={()=>setPt(null)}><MenuList items={items} onDone={()=>setPt(null)}/></Popover>}</div>}

/* ---------- Pagination ---------- */
export function usePager(items,size=20){const[page,setPage]=useState(1),pages=Math.max(1,Math.ceil(items.length/size));
  useEffect(()=>{if(page>pages)setPage(pages)},[pages,page]);return{page,setPage,pages,total:items.length,slice:items.slice((page-1)*size,page*size)}}
export function Pagination({page,pages,onPage,total}){if(pages<=1)return null;
  const nums=[...new Set([1,pages,page-1,page,page+1])].filter(n=>n>=1&&n<=pages).sort((a,b)=>a-b),out=[];nums.forEach((n,i)=>{if(i&&n-nums[i-1]>1)out.push('gap'+n);out.push(n)});
  return <nav className="pager" aria-label="Halaman data"><button type="button" className="pg" disabled={page<=1} aria-label="Halaman sebelumnya" onClick={()=>onPage(page-1)}><Icon name="chev-left"/></button>
    <span className="pg-info">Hal {page} dari {pages}{total!=null&&` · ${total} data`}</span>
    <div className="pg-n">{out.map(n=>typeof n==='string'?<span key={n} className="pg-gap">…</span>:<button type="button" key={n} className={'pg'+(n===page?' on':'')} aria-current={n===page?'page':undefined} onClick={()=>onPage(n)}>{n}</button>)}</div>
    <button type="button" className="pg" disabled={page>=pages} aria-label="Halaman berikutnya" onClick={()=>onPage(page+1)}><Icon name="chev-right"/></button></nav>}

/* ---------- Tabel responsif: tabel di layar lebar, kartu di HP ---------- */
export function DataTable({columns,rows,rowKey='id',onRowClick,empty,caption}){
  return <div className="tbl-wrap"><table className="tbl">{caption&&<caption className="sr">{caption}</caption>}
    <thead><tr>{columns.map(c=><th key={c.key} scope="col" className={c.className}>{c.label}</th>)}</tr></thead>
    <tbody>{rows.map(r=><tr key={r[rowKey]} className={onRowClick?'clk':''} onClick={onRowClick?()=>onRowClick(r):undefined} tabIndex={onRowClick?0:undefined} onKeyDown={onRowClick?e=>{if(e.key==='Enter')onRowClick(r)}:undefined}>
      {columns.map(c=><td key={c.key} data-label={c.label} className={(c.primary?'primary ':'')+(c.className||'')}>{c.render?c.render(r):r[c.key]}</td>)}</tr>)}</tbody></table>{!rows.length&&empty}</div>}

/* ---------- Timeline ---------- */
export const Timeline=({items})=><ol className="tl">{items.map((it,i)=><li key={it.key??i}><span className={'tl-dot '+(it.tone||'')}><Icon name={it.icon||'check'} size={13} strokeWidth={2.5}/></span>
  <div className="tl-t">{it.title}</div>{it.meta&&<div className="tl-m">{it.meta}</div>}{it.text&&<div className="tl-x">{it.text}</div>}</li>)}</ol>;

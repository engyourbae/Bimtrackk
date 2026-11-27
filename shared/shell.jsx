import {useEffect,useState} from 'react';
import {Icon} from './icons';
import {Logo} from './logo';
import {Modal,Skeleton} from './ui/core';
import {ThemePick} from './ui/fields';
import {getTheme,setTheme} from './theme';
import {useReveal} from './motion';

/**
 * Kerangka aplikasi.
 *  nav: [{k,label,icon,main?,badge?,group?}]  — item main (maks 4) tampil di navigasi bawah HP, sisanya masuk sheet "Lainnya".
 *  HP: bilah atas + navigasi bawah (maks 5 tombol). Tablet: sidebar ikon yang bisa dibuka. Laptop: sidebar penuh.
 *  short: label pendek untuk navigasi bawah HP. topSlot: tampil di bilah atas (HP) dan di pojok kanan atas konten (tablet/laptop).
 *  admin: menampilkan pita "ADMIN" yang selalu terlihat.
 */
export default function AppShell({nav,page,onNavigate,children,admin,identity,sub,onLogout,topSlot,loading}){
  const[more,setMore]=useState(false),[open,setOpen]=useState(false),mains=nav.filter(n=>n.main).slice(0,4),inMain=mains.some(n=>n.k===page);
  useEffect(()=>{window.scrollTo(0,0)},[page]);
  useReveal('#main',page);
  useEffect(()=>{if(!open)return;const f=e=>e.key==='Escape'&&setOpen(false);document.addEventListener('keydown',f);return()=>document.removeEventListener('keydown',f)},[open]);
  const go=k=>{setMore(false);setOpen(false);onNavigate(k)},initial=(identity||'?').trim().charAt(0).toUpperCase(),cur=nav.find(n=>n.k===page);
  let lastGroup=null;
  return <div className={'shell'+(admin?' admin':'')}>
    <a className="skip" href="#main" onClick={e=>{e.preventDefault();document.getElementById('main')?.focus()}}>Lewati ke konten</a>
    {admin&&<div className="ribbon" role="status"><b>ADMIN</b><span>· {identity||'administrator'}</span></div>}
    <div className="topbar"><Logo size={30} target/><div className="row">{topSlot}</div></div>
    <div className="shell-body">
      <div className="sb-slot"><aside className={'sidebar'+(open?' open':'')} aria-label="Menu utama">
        <div className="sb-brand"><Logo size={34} target/><button type="button" className="ib sb-toggle" onClick={()=>setOpen(o=>!o)} aria-label={open?'Ciutkan menu':'Buka menu'} aria-expanded={open}><Icon name="panel"/></button></div>
        <nav className="sb-nav">{nav.map(n=>{const g=n.group&&n.group!==lastGroup?n.group:null;if(n.group)lastGroup=n.group;
          return <div key={n.k} style={{display:'contents'}}>{g&&<div className="sb-group">{g}</div>}
            <button type="button" className={'nav-item'+(page===n.k?' on':'')} title={n.label} aria-current={page===n.k?'page':undefined} onClick={()=>go(n.k)}><Icon name={n.icon}/><span className="nl-t">{n.label}</span>{!!n.badge&&<span className="nl-b">{n.badge}</span>}</button></div>})}</nav>
        <div className="sb-foot">{loading?<div className="idc" aria-hidden="true"><Skeleton w={36} h={36} r={18}/><div className="idc-t" style={{flex:1}}><Skeleton w="70%" h={12}/><Skeleton w="50%" h={10}/></div></div>:identity&&<div className="idc"><span className="avatar" aria-hidden="true">{initial}</span><div className="idc-t"><b>{identity}</b>{sub&&<span>{sub}</span>}</div></div>}
          {onLogout&&<button type="button" className="nav-item" title="Keluar" onClick={onLogout}><Icon name="logout"/><span className="nl-t">Keluar</span></button>}</div></aside>
        <div className={'sb-scrim'+(open?' on':'')} onClick={()=>setOpen(false)} aria-hidden="true"/></div>
      <div className="content"><main id="main" tabIndex={-1} className="content-in" aria-busy={loading||undefined}>{topSlot&&<div className="deskbar">{topSlot}</div>}<div className="page" key={page} aria-label={cur?.label}>{children}</div></main></div></div>
    <nav className="bottom-nav" aria-label="Navigasi bawah">{mains.map(n=><button type="button" key={n.k} className={'bn-i'+(page===n.k?' on':'')} aria-current={page===n.k?'page':undefined} onClick={()=>go(n.k)}>
      <span className="bn-ico"><Icon name={n.icon} size={22}/></span><span className="bn-l">{n.short||n.label}</span>{!!n.badge&&<span className="nl-b">{n.badge}</span>}</button>)}
      <button type="button" className={'bn-i'+(!inMain?' on':'')} aria-haspopup="dialog" onClick={()=>setMore(true)}><span className="bn-ico"><Icon name="grid" size={22}/></span><span className="bn-l">Lainnya</span></button></nav>
    <Modal open={more} title="Lainnya" onClose={()=>setMore(false)}>
      <div className="more-grid">{nav.filter(n=>!mains.includes(n)).map(n=><button type="button" key={n.k} className={'more-i'+(page===n.k?' on':'')} onClick={()=>go(n.k)}><Icon name={n.icon} size={24}/>{n.label}{!!n.badge&&<span className="nl-b" style={{position:'absolute',top:8,right:8}}>{n.badge}</span>}</button>)}</div>
      <div className="field" style={{marginTop:20}}><label>Tema tampilan</label><ThemePick get={getTheme} set={setTheme}/></div>
      {identity&&<div className="idc" style={{marginTop:8}}><span className="avatar" aria-hidden="true">{initial}</span><div className="idc-t"><b>{identity}</b>{sub&&<span>{sub}</span>}</div></div>}
      {onLogout&&<button type="button" className="btn line block" style={{marginTop:12}} onClick={()=>{setMore(false);onLogout()}}><Icon name="logout" size={18}/> Keluar</button>}</Modal></div>}

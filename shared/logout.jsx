import {useEffect,useState} from 'react';
import {Icon} from './icons';
import {ConfirmDialog} from './ui/core';
import {Checkbox} from './ui/fields';

/**
 * Tombol Keluar + dialog konfirmasi. SEMUA jalur keluar (HP, sidebar, admin, layar menunggu persetujuan) memakai ini.
 *  onLogout({clearData}) boleh async.
 *  cache   : tampilkan opsi "Hapus data offline di perangkat ini" (hanya aplikasi yang menyimpan cache offline).
 *  pending : async () => boolean, true bila masih ada perubahan yang belum tersinkron ke server.
 */
export function LogoutButton({onLogout,cache,pending,className='btn line block',title,children}){
  const[open,setOpen]=useState(false),[busy,setBusy]=useState(false),[clear,setClear]=useState(true),[pend,setPend]=useState(false),[on,setOn]=useState(true);
  useEffect(()=>{if(!open)return;setClear(true);setPend(false);setOn(navigator.onLine);let alive=true;
    const h=()=>setOn(navigator.onLine);addEventListener('online',h);addEventListener('offline',h);
    if(cache&&pending)Promise.resolve(pending()).then(v=>{if(alive)setPend(!!v)}).catch(()=>{});
    return()=>{alive=false;removeEventListener('online',h);removeEventListener('offline',h)}},[open]);
  const go=async()=>{setBusy(true);try{await onLogout({clearData:!!cache&&clear})}finally{setBusy(false);setOpen(false)}};
  return <>
    <button type="button" className={className} title={title} aria-haspopup="dialog" onClick={()=>setOpen(true)}>{children||<><Icon name="logout" size={18}/> Keluar</>}</button>
    <ConfirmDialog open={open} title="Keluar dari BIMTRACK?" confirmLabel="Keluar" cancelLabel="Batal" autoFocusCancel busy={busy} onCancel={()=>setOpen(false)} onConfirm={go}>
      <p style={{margin:0}}>Data tetap aman di akunmu. Perubahan yang dibuat saat offline dan belum tersinkron hanya bisa terkirim saat online, jadi pastikan perangkat online dulu sebelum keluar.</p>
      {cache&&pend&&<div className="lockmsg" role="alert" style={{marginTop:12,marginBottom:0}}><Icon name="alert" size={18}/><span>Masih ada perubahan yang belum terkonfirmasi tersinkron ke server. {clear?'Jika keluar sekarang dengan data offline dihapus, perubahan itu bisa hilang. Online dulu dan tunggu sebentar.':'Perubahan itu tetap tersimpan di perangkat ini dan baru terkirim setelah kamu masuk lagi dengan akun yang sama saat online.'}</span></div>}
      {cache&&<div style={{marginTop:14}}><Checkbox checked={clear} onChange={setClear} label="Hapus data offline di perangkat ini"/>
        <p className="mut" style={{margin:'6px 0 0',fontSize:'var(--fs-xs)'}}>{clear?'Data BIMTRACK yang tersimpan di perangkat ini dihapus. Cocok untuk perangkat bersama.':'Data tetap tersimpan di perangkat ini (tidak terenkripsi). Jangan pilih ini di perangkat bersama.'}</p></div>}
      <p className="mut" style={{margin:'12px 0 0',fontSize:'var(--fs-xs)'}}>{on?'Untuk masuk lagi, termasuk ke akun lain, perangkat harus online dulu.':'Perangkat sedang offline. Untuk masuk lagi, termasuk ke akun lain, perangkat harus online dulu.'}</p>
    </ConfirmDialog></>}

/** Bagian "Akun" di halaman Pengaturan: tombol Keluar bergaya bahaya, terpisah dari kontrol lain. */
export function AccountCard({onLogout,cache,pending}){
  return <section className="card acct" aria-label="Akun"><div className="row"><Icon name="user" size={20}/><h2 className="sp">Akun</h2></div>
    <div className="danger-zone"><p className="mut">Keluar mengakhiri sesi di perangkat ini. Data tetap aman di akunmu.</p>
      <LogoutButton onLogout={onLogout} cache={cache} pending={pending} className="btn dan block"/></div></section>}

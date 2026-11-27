import {useState} from 'react';
import {updatePassword} from 'firebase/auth';
import {doc,updateDoc} from 'firebase/firestore';
import {auth,db} from './firebase';
import {getTheme,setTheme} from './shared/theme';
import {Pass,Badge,Icon,ThemePick,PageHead,SessionCard,Btn,useFlash,AccountCard,InstallCard,Select,toast} from './shared/ui';
import {OfflineCard,NotifControl} from './Device';
import {SesiInfo} from './SesiGate';
import Accent from './Accent';
import {logoutUser,LO} from './offline';
import {navigate} from '@shared/router';
import {FORMATS,getDateFormat,setDateFormat,fmtDate} from '@shared/date';

/** Ganti kata sandi. force = sandi sementara dari admin (wajib diganti sebelum memakai aplikasi). */
export function ChangePass({uid,force}){const[p,setP]=useState(''),[b,setB]=useState(false),[ok,flash]=useFlash();
  const go=async()=>{if(p.length<6)return toast('Minimal 6 karakter','err');setB(true);try{await updatePassword(auth.currentUser,p);if(force)updateDoc(doc(db,'users',uid),{mustChangePassword:false}).catch(e=>toast(e.message,'err'));setP('');flash();toast('Kata sandi diganti')}catch(e){toast(e.code==='auth/requires-recent-login'?'Keluar lalu masuk lagi, kemudian ulangi':e.message,'err')}setB(false)};
  return <div className="field" style={force?undefined:{marginTop:12}}>{!force&&<label>Ganti kata sandi</label>}<Pass value={p} onChange={setP} placeholder="Kata sandi baru" auto="new-password"/><Btn className="btn" style={{width:'100%',marginTop:8}} busy={b} done={ok} onClick={go}>{ok?'Tersimpan':'Simpan'}</Btn></div>}

const Sec=({icon,title,children})=><section className="card set-s" aria-label={title}><div className="row"><Icon name={icon} size={20}/><h2 className="sp">{title}</h2></div>{children}</section>;
const Row=({k,v})=>v?<div className="set-r"><span className="mut">{k}</span><b>{v}</b></div>:null;
const FMT_OPT=Object.keys(FORMATS).map(k=>({value:k,label:{panjang:'Panjang',sedang:'Sedang',angka:'Angka'}[k]+' ('+FORMATS[k]+')'}));

/** Pengaturan: Profil · Tampilan · Keamanan · Perangkat · Data dan bantuan · Akun. Semua data tampil dari profil yang sudah dimuat, jadi tidak ada keadaan memuat sendiri. */
export default function Settings({prof,uid}){
  const[fmt,setFmt]=useState(getDateFormat);
  return <div className="stack"><PageHead title="Pengaturan" sub="Profil, tampilan, keamanan, perangkat, dan data"/>
    <section className="card set-p" aria-label="Profil"><span className="avatar lg" aria-hidden="true">{(prof.nama||'?').trim().charAt(0).toUpperCase()}</span>
      <div className="set-pt"><h2>{prof.nama}</h2><Badge tone="ok">Disetujui</Badge></div>
      <Row k="NIM" v={prof.nim}/><Row k="Program studi" v={prof.prodi}/><Row k="Fakultas" v={prof.fakultas}/><Row k="Universitas" v={prof.universitas}/>
      <p className="mut" style={{fontSize:'var(--fs-xs)',margin:'var(--s3) 0 0'}}>Data profil diatur oleh admin saat pendaftaran disetujui. Jika ada yang salah, hubungi admin.</p></section>
    <Sec icon="sun" title="Tampilan"><div className="field"><label>Tema tampilan</label><ThemePick get={getTheme} set={setTheme}/></div>
      <div className="field"><label>Warna aplikasi</label><Accent/></div>
      <div className="field"><label>Format tanggal</label><Select label="Format tanggal" value={fmt} options={FMT_OPT} onChange={v=>{setDateFormat(v);setFmt(v);toast('Format tanggal: '+fmtDate('2026-11-25',v)+'. Berlaku di halaman yang dibuka berikutnya.')}}/></div></Sec>
    <Sec icon="lock" title="Keamanan"><ChangePass uid={uid}/></Sec>
    <SessionCard app="user"/>
    <SesiInfo/>
    <OfflineCard/>
    <Sec icon="bell" title="Notifikasi"><NotifControl/></Sec>
    <InstallCard/>
    <Sec icon="backup" title="Data dan bantuan"><p className="mut" style={{margin:'0 0 var(--s3)'}}>Backup, pemulihan, dan ekspor CSV ada di Laporan. Panduan pemakaian ada di Pusat Bantuan.</p>
      <div className="row" style={{flexWrap:'wrap'}}><button type="button" className="btn sec sp" onClick={()=>navigate('csv')}><Icon name="backup" size={18}/> Backup dan CSV</button><button type="button" className="btn sec sp" onClick={()=>navigate('bantuan')}><Icon name="book" size={18}/> Pusat Bantuan</button></div></Sec>
    <AccountCard onLogout={logoutUser} {...LO}/></div>}

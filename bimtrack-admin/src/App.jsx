import {lazy,Suspense,useEffect,useState} from 'react';
import {onAuthStateChanged,signOut} from 'firebase/auth';
import {doc,getDoc,collection,addDoc,serverTimestamp} from 'firebase/firestore';
import {auth,db} from './firebase';
import {ToastHost,toast,BootScreen,Splash,startSessionGuard,PwaNotices,PageBoundary} from './shared/ui';
import AppShell from '@shared/shell';
import {useRoute,navigate} from '@shared/router';
import Login from './Login';
import {ListSk} from './common';
import {useAdminCols,resetAdminData} from './useAdmin';
// Satu berkas per halaman, dimuat malas (semua chunk tetap masuk precache PWA).
const Dashboard=lazy(()=>import('./pages/Dashboard')),Requests=lazy(()=>import('./pages/Requests')),Users=lazy(()=>import('./pages/Users')),Resets=lazy(()=>import('./pages/Resets')),Audit=lazy(()=>import('./pages/Audit')),Settings=lazy(()=>import('./pages/Settings')),Panduan=lazy(()=>import('./pages/Panduan'));
const log=(action,extra={})=>addDoc(collection(db,'aktivitas'),{action,adminUid:auth.currentUser.uid,createdAt:serverTimestamp(),...extra});
const isAdmin=async u=>{const a=await getDoc(doc(db,'admins',u.uid));return a.exists()&&(a.data().role===true)};
const out=async()=>{resetAdminData();await signOut(auth)};
/** Lencana menu: listener bersama dengan halaman, dan galatnya tidak mengganggu apa pun (lencana saja yang hilang). */
function Badges({uid,children}){
  const r=useAdminCols(['reqs'],uid),s=useAdminCols(['rst'],uid);
  return children({pend:r.status==='ready'?(r.d.reqs||[]).filter(x=>x.status==='pending').length:0,rpend:s.status==='ready'?(s.d.rst||[]).filter(x=>x.status==='pending').length:0})}
function Panel({onReady}){
  const{page:pg}=useRoute(),[u,setU]=useState(undefined),[err,setErr]=useState('');
  useEffect(()=>onAuthStateChanged(auth,async x=>{if(!x){resetAdminData();setU(null);return}try{if(await isAdmin(x)){setErr('');setU(x);log('admin_login').catch(()=>{})}else{setErr({m:'Email atau kata sandi salah.',k:Date.now()});await signOut(auth)}}catch(e){setErr({m:'Tidak dapat memverifikasi akun. Periksa koneksi lalu coba lagi.'});await signOut(auth)}}),[]);
  useEffect(()=>{onReady(u!==undefined)},[u]);
  useEffect(()=>{if(!u)return;return startSessionGuard('admin',{onExpire:()=>out(),onWarn:()=>toast('Sesi akan berakhir dalam 1 menit karena tidak aktif. Sentuh layar untuk tetap masuk.')})},[u]);
  if(u===undefined)return <BootScreen/>;
  if(!u)return <Login err={err}/>;
  return <Badges uid={u.uid}>{({pend,rpend})=>{
    const NAV=[{k:'home',label:'Dashboard',icon:'home',main:true,group:'Ringkasan'},{k:'req',label:'Permintaan',icon:'inbox',main:true,badge:pend,group:'Akun'},{k:'usr',label:'Pengguna',icon:'users',main:true},{k:'pdn',label:'Panduan Alur',icon:'timeline',group:'Konten'},{k:'log',label:'Audit log',icon:'audit',main:true,group:'Keamanan'},{k:'rst',label:'Reset Sandi',icon:'key',badge:rpend},{k:'set',label:'Pengaturan',icon:'pengaturan',group:'Sistem'}],
      page0=NAV.some(x=>x.k===pg)?pg:'home';
    return <AppShell admin nav={NAV} page={page0} onNavigate={k=>navigate(k)} identity={u.email||'Administrator'} sub="Administrator" onLogout={out}>
      <div style={{display:'contents'}} data-page={page0}>
        <PwaNotices offlineText="Offline: panel admin butuh internet untuk memuat dan menyimpan data."/>
        <PageBoundary key={page0}><Suspense fallback={<ListSk/>}>
          {page0==='home'&&<Dashboard uid={u.uid}/>}{page0==='req'&&<Requests uid={u.uid}/>}{page0==='usr'&&<Users uid={u.uid}/>}{page0==='rst'&&<Resets uid={u.uid}/>}{page0==='pdn'&&<Panduan uid={u.uid}/>}{page0==='log'&&<Audit uid={u.uid}/>}{page0==='set'&&<Settings u={u} onLogout={out}/>}
        </Suspense></PageBoundary></div></AppShell>}}</Badges>}
export default function App(){const[rdy,setRdy]=useState(false);return <><Panel onReady={setRdy}/><Splash ready={rdy}/><ToastHost/></>}

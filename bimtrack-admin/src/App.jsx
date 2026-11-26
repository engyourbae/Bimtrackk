import {useEffect,useState} from 'react';
import {onAuthStateChanged,signInWithEmailAndPassword,createUserWithEmailAndPassword,getAuth,signOut} from 'firebase/auth';
import {initializeApp,getApps} from 'firebase/app';
import {doc,getDoc,onSnapshot,collection,query,orderBy,limit,writeBatch,addDoc,getCountFromServer,serverTimestamp} from 'firebase/firestore';
import {setPersistence,browserLocalPersistence,browserSessionPersistence} from 'firebase/auth';
import {auth,db,firebaseConfig} from './firebase';
import {nimEmail} from './shared/nim';
import {getTheme,setTheme} from './shared/theme';
import {ToastHost,toast,Pass,Icon,Badge,Modal,Select,ThemePick,when,PageHead,EmptyState,AuthLayout,Field,BootScreen,useLoginGuard,LockNotice,Checkbox,Splash,SessionCard,startSessionGuard} from './shared/ui';
import AppShell from '@shared/shell';
import {useRoute,navigate} from '@shared/router';
const log=(action,extra={})=>addDoc(collection(db,'aktivitas'),{action,adminUid:auth.currentUser.uid,createdAt:serverTimestamp(),...extra});
const isAdmin=async u=>{const a=await getDoc(doc(db,'admins',u.uid));return a.exists()&&(a.data().role===true)};
function Login({err}){const[i,setI]=useState(''),[p,setP]=useState(''),[b,setB]=useState(false),[e,setE]=useState(''),[keep,setKeep]=useState(true),lim=useLoginGuard(i);
  useEffect(()=>{if(err?.k)lim.fail()},[err?.k]);
  const go=async ev=>{ev.preventDefault();if(lim.locked)return;if(!i.trim()||!p){setE('Isi email dan kata sandi.');return}setB(true);setE('');
    try{const id=i.includes('@')?i.trim():nimEmail(i);await setPersistence(auth,keep?browserLocalPersistence:browserSessionPersistence).catch(()=>{});await signInWithEmailAndPassword(auth,id,p);lim.ok()}catch(x){lim.fail(x?.code==='auth/too-many-requests'?300:0);setE('Email atau kata sandi salah.')}setB(false)};
  const msg=e||err?.m;
  return <AuthLayout variant="admin" title="Masuk administrator" sub="Gunakan akun pengelola yang terdaftar.">
    <form onSubmit={go} noValidate>
      {msg&&<div className="lockmsg" role="alert"><Icon name="alert" size={18}/><span>{msg}</span></div>}
      <LockNotice g={lim}/>
      <Field id="ad-email" label="Email" req><input id="ad-email" className="in" type="text" inputMode="email" autoComplete="username" autoCapitalize="none" value={i} onChange={x=>setI(x.target.value)}/></Field>
      <Field id="ad-pw" label="Kata sandi" req><Pass id="ad-pw" value={p} onChange={setP} auto="current-password"/></Field>
      <div className="keep"><Checkbox checked={keep} onChange={setKeep} label="Tetap masuk di perangkat ini"/></div>
      <button type="submit" className="btn block" disabled={b||lim.locked}>{b?'Memproses…':'Masuk'}</button></form></AuthLayout>}
function Requests({reqs}){const[f,setF]=useState('pending'),[rej,setRej]=useState(null),[reason,setReason]=useState('');
  const L={pending:'Pending',approved:'Approved',rejected:'Rejected'},list=reqs.filter(r=>r.status===f);
  const decide=async(r,status,why='')=>{try{const b=writeBatch(db),adm=auth.currentUser.uid,t=serverTimestamp();
    b.update(doc(db,'registrationRequests',r.uid),{status,decidedAt:t,decidedBy:adm,reason:why});
    b.set(doc(db,'users',r.uid),{uid:r.uid,dataUid:r.uid,nim:r.nim,nama:r.nama,prodi:r.prodi,fakultas:r.fakultas,universitas:r.universitas,approved:status==='approved',decidedAt:t,...(status==='approved'?{approvedAt:t}:{})},{merge:true});
    b.set(doc(collection(db,'aktivitas')),{action:status==='approved'?'approve':'reject',targetUid:r.uid,nim:r.nim,reason:why,adminUid:adm,createdAt:t});
    await b.commit();toast(status==='approved'?'Disetujui':'Ditolak')}catch(e){toast(e.message,'err')}};
  return <div><h1>Permintaan Akun</h1><div style={{maxWidth:220,marginBottom:12}}><Select value={L[f]} options={Object.values(L)} onChange={v=>setF(Object.keys(L).find(k=>L[k]===v))}/></div>
    {!list.length&&<div className="empty">Tidak ada permintaan.</div>}
    {list.map(r=><div className="card" key={r.uid}><div className="row"><b className="sp">{r.nama}</b><Badge>{L[r.status]}</Badge></div><p className="mut" style={{margin:'6px 0'}}>NIM {r.nim}<br/>{r.prodi} · {r.fakultas} · {r.universitas}<br/>Daftar: {when(r.createdAt)}{r.reason&&<><br/>Alasan: {r.reason}</>}</p>
      <div className="row">{r.status!=='approved'&&<button className="btn sp" onClick={()=>decide(r,'approved')}><Ic d={P.check} s={16}/> Terima</button>}{r.status!=='rejected'&&<button className="btn dan sp" onClick={()=>{setRej(r);setReason('')}}>Tolak</button>}</div></div>)}
    <Modal open={!!rej} title="Tolak pendaftaran" onClose={()=>setRej(null)}><textarea className="in" placeholder="Alasan (opsional)" value={reason} onChange={e=>setReason(e.target.value)}/><button className="btn dan" style={{width:'100%',marginTop:10}} onClick={()=>{decide(rej,'rejected',reason);setRej(null)}}>Tolak</button></Modal></div>}
function Users({users}){const[q,setQ]=useState('');const list=users.filter(u=>(u.nim+u.nama).toLowerCase().includes(q.toLowerCase()));
  const acc=async(u,v)=>{try{const b=writeBatch(db);b.update(doc(db,'users',u.uid),{approved:v});b.set(doc(collection(db,'aktivitas')),{action:v?'enable_access':'revoke_access',targetUid:u.uid,nim:u.nim,adminUid:auth.currentUser.uid,createdAt:serverTimestamp()});await b.commit();toast('Diperbarui')}catch(e){toast(e.message,'err')}};
  return <div><h1>Pengguna</h1><input className="in" style={{marginBottom:12}} placeholder="Cari NIM / nama" value={q} onChange={e=>setQ(e.target.value)}/>{!list.length&&<div className="empty">Belum ada pengguna.</div>}
    {list.map(u=><div className="card" key={u.uid}><div className="row"><b className="sp">{u.nama}</b><span className={'badge '+(u.approved?'ok':'no')}>{u.approved?'Aktif':'Nonaktif'}</span></div><p className="mut" style={{margin:'6px 0'}}>NIM {u.nim} · {u.prodi}</p><button className={'btn '+(u.approved?'dan':'')} onClick={()=>acc(u,!u.approved)}>{u.approved?'Cabut akses':'Aktifkan akses'}</button></div>)}
    <p className="mut" style={{fontSize:'.8rem'}}>Catatan: ini mencabut akses data (Firestore). Akun Firebase Authentication tidak dinonaktifkan — itu butuh Admin SDK/Cloud Functions.</p></div>}
const tmp=()=>{const c='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789',a=new Uint32Array(10);crypto.getRandomValues(a);return[...a].map(x=>c[x%c.length]).join('')};
function Resets({rst,users}){const[res,setRes]=useState(null),[busy,setBusy]=useState(false),list=rst.filter(r=>r.status==='pending');
  const approve=async r=>{setBusy(true);try{const nim=r.nim.trim().toLowerCase(),cur=users.filter(x=>(x.nim||'').toLowerCase()===nim&&x.approved);
    if(!cur.length)throw new Error('NIM tidak ditemukan atau akses tidak aktif');
    const o=cur[0],dataUid=o.dataUid||o.uid,vs=await getDoc(doc(db,'nimVersion',nim)),v=(vs.exists()?vs.data().v:1)+1,pw=tmp();
    const sec=getApps().find(a=>a.name==='sec')||initializeApp(firebaseConfig,'sec'),sa=getAuth(sec);
    const c=await createUserWithEmailAndPassword(sa,nimEmail(nim,v),pw);await signOut(sa);
    const b=writeBatch(db),t=serverTimestamp(),adm=auth.currentUser.uid;
    b.set(doc(db,'users',c.user.uid),{uid:c.user.uid,dataUid,nim:o.nim,nama:o.nama,prodi:o.prodi,fakultas:o.fakultas,universitas:o.universitas,approved:true,mustChangePassword:true,approvedAt:t});
    cur.forEach(x=>b.update(doc(db,'users',x.uid),{approved:false}));
    b.set(doc(db,'nimVersion',nim),{v});
    b.update(doc(db,'resetRequests',r.id),{status:'done',decidedAt:t,decidedBy:adm});
    b.set(doc(collection(db,'aktivitas')),{action:'reset_password',nim:o.nim,adminUid:adm,createdAt:t});
    await b.commit();setRes({nim:o.nim,pw})}catch(e){toast(e.code==='auth/email-already-in-use'?'Akun sementara sudah ada (percobaan sebelumnya gagal). Hapus di Firebase Console lalu ulangi.':e.message,'err')}setBusy(false)};
  const reject=async r=>{try{const b=writeBatch(db);b.update(doc(db,'resetRequests',r.id),{status:'rejected',decidedAt:serverTimestamp(),decidedBy:auth.currentUser.uid});await b.commit();toast('Ditolak')}catch(e){toast(e.message,'err')}};
  return <div><h1>Reset Sandi</h1>{!list.length&&<div className="empty">Tidak ada permintaan.</div>}
    {list.map(r=><div className="card" key={r.id}><b>{r.nama}</b><p className="mut" style={{margin:'6px 0'}}>NIM {r.nim}<br/>{when(r.createdAt)}</p><p className="mut" style={{fontSize:'.8rem'}}>Verifikasi identitas mahasiswa dulu sebelum menyetujui.</p><div className="row"><button className="btn sp" disabled={busy} onClick={()=>approve(r)}>Setujui dan buat sandi</button><button className="btn dan sp" onClick={()=>reject(r)}>Tolak</button></div></div>)}
    <Modal open={!!res} title="Sandi sementara" onClose={()=>setRes(null)}><p>NIM {res?.nim}. Sandi ini hanya tampil sekali, sampaikan langsung ke mahasiswa:</p><div className="card" style={{fontSize:'1.4rem',textAlign:'center',letterSpacing:2,userSelect:'all'}}>{res?.pw}</div><button className="btn" style={{width:'100%'}} onClick={()=>{navigator.clipboard?.writeText(res.pw);toast('Disalin')}}>Salin</button></Modal></div>}
function Panel({onReady}){
  const{page:pg}=useRoute(),[u,setU]=useState(undefined),[err,setErr]=useState(''),[reqs,setReqs]=useState([]),[users,setUsers]=useState([]),[act,setAct]=useState([]),[rst,setRst]=useState([]),[cnt,setCnt]=useState({});
  useEffect(()=>onAuthStateChanged(auth,async x=>{if(!x){setU(null);return}try{if(await isAdmin(x)){setErr('');setU(x);log('admin_login')}else{setErr({m:'Email atau kata sandi salah.',k:Date.now()});await signOut(auth)}}catch(e){setErr({m:'Tidak dapat memverifikasi akun. Periksa koneksi lalu coba lagi.'});await signOut(auth)}}),[]);
  useEffect(()=>{onReady(u!==undefined)},[u]);
  useEffect(()=>{if(!u)return;return startSessionGuard('admin',{onExpire:()=>signOut(auth),onWarn:()=>toast('Sesi akan berakhir dalam 1 menit karena tidak aktif. Sentuh layar untuk tetap masuk.')})},[u]);
  useEffect(()=>{if(!u)return;['bimbingan','revisi','jadwal','rundown','dokumen'].forEach(c=>getCountFromServer(collection(db,c)).then(s=>setCnt(x=>({...x,[c]:s.data().count}))).catch(()=>{}));const r2=onSnapshot(collection(db,'resetRequests'),s=>setRst(s.docs.map(d=>({...d.data(),id:d.id}))));const a=onSnapshot(collection(db,'registrationRequests'),s=>setReqs(s.docs.map(d=>d.data())),e=>toast(e.message,'err'));const b=onSnapshot(collection(db,'users'),s=>setUsers(s.docs.map(d=>d.data())));const c=onSnapshot(query(collection(db,'aktivitas'),orderBy('createdAt','desc'),limit(50)),s=>setAct(s.docs.map(d=>({...d.data(),id:d.id}))));return()=>{a();b();c();r2()}},[u]);
  if(u===undefined)return <BootScreen/>;
  if(!u)return <Login err={err}/>;
  const pend=reqs.filter(r=>r.status==='pending').length,rpend=rst.filter(r=>r.status==='pending').length;
  const NAV=[{k:'home',label:'Dashboard',icon:'home',main:true,group:'Ringkasan'},{k:'req',label:'Permintaan',icon:'inbox',main:true,badge:pend,group:'Akun'},{k:'usr',label:'Pengguna',icon:'users',main:true},{k:'log',label:'Audit log',icon:'audit',main:true,group:'Keamanan'},{k:'rst',label:'Reset Sandi',icon:'key',badge:rpend},{k:'set',label:'Pengaturan',icon:'pengaturan',group:'Sistem'}];
  const n=s=>reqs.filter(r=>r.status===s).length,page0=NAV.some(x=>x.k===pg)?pg:'home';
  return <AppShell admin nav={NAV} page={page0} onNavigate={k=>navigate(k)} identity={u.email||'Administrator'} sub="Administrator" onLogout={()=>signOut(auth)}>
    <div style={{display:'contents'}} data-page={page0}>
      {page0==='home'&&<div><PageHead title="Dashboard Admin" sub="Ringkasan akun dan aktivitas terbaru"/><div className="grid">{[['Total akun',reqs.length],['Disetujui',n('approved')],['Pending',n('pending')],['Ditolak',n('rejected')]].map(([l,v])=><div className="card stat" key={l}><span className="mut">{l}</span><b>{v}</b></div>)}</div><div className="card"><h2>Data tersimpan</h2><p className="mut" style={{margin:0}}>{Object.keys(cnt).length?Object.entries(cnt).map(([a,b])=>a+': '+b).join(' · '):'Memuat...'}</p></div><div className="card"><h2>Aktivitas terbaru</h2>{act.slice(0,8).map(a=><p key={a.id} style={{margin:'6px 0'}}><b>{a.action}</b> {a.nim||''}<br/><span className="mut" style={{fontSize:'.8rem'}}>{when(a.createdAt)}</span></p>)}{!act.length&&<p className="mut">Belum ada aktivitas.</p>}</div></div>}
      {page0==='req'&&<Requests reqs={reqs}/>}{page0==='usr'&&<Users users={users}/>}{page0==='rst'&&<Resets rst={rst} users={users}/>}
      {page0==='log'&&<div><PageHead title="Audit Log" sub="Riwayat tindakan administrator"/>{act.map(a=><div className="card" key={a.id}><b>{a.action}</b><p className="mut" style={{margin:'4px 0'}}>{a.nim&&'NIM '+a.nim+' · '}admin {a.adminUid?.slice(0,6)}… · {when(a.createdAt)}{a.reason&&' · '+a.reason}</p></div>)}</div>}
      {page0==='set'&&<div><h1>Pengaturan</h1><div className="card"><div className="fld"><label>Tema</label><ThemePick get={getTheme} set={setTheme}/></div><p className="mut">Firebase project: {firebaseConfig.projectId}<br/>Admin UID: {u.uid}</p></div><SessionCard app="admin"/></div>}
    </div></AppShell>}
export default function App(){const[rdy,setRdy]=useState(false);return <><Panel onReady={setRdy}/><Splash ready={rdy}/><ToastHost/></>}

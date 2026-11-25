import {useEffect,useState} from 'react';
import {onAuthStateChanged,signInWithEmailAndPassword,createUserWithEmailAndPassword,updatePassword,signOut} from 'firebase/auth';
import {doc,onSnapshot,setDoc,getDoc,addDoc,updateDoc,collection,query,where,serverTimestamp} from 'firebase/firestore';
import {auth,db} from './firebase';
import {nimEmail,validNim} from './shared/nim';
import {getTheme,setTheme} from './shared/theme';
import {ToastHost,toast,Pass,Ic,P,Badge,ThemePick,Modal} from './shared/ui';
import Crud from './Crud';
import {BAB,BIM,ST,REV,JDW,RUN,DOK,BKT} from './config';
import Cal from './Cal';
import Summary from './Summary';
import Search from './Search';
import ImportExport from './ImportExport';
import PwaBar from './Pwa';
function Auth(){
  const[fg,setFg]=useState(null),[m,setM]=useState('login'),[f,setF]=useState({nim:'',pw:'',nama:'',prodi:'',fakultas:'',universitas:''}),[b,setB]=useState(false);const s=k=>e=>setF({...f,[k]:e.target.value});
  const sendReset=()=>{if(!validNim(fg.nim)||!fg.nama.trim())return toast('Isi NIM dan nama dengan benar','err');addDoc(collection(db,'resetRequests'),{nim:fg.nim.trim(),nama:fg.nama.trim(),status:'pending',createdAt:serverTimestamp()}).catch(e=>toast(e.message,'err'));setFg(null);toast('Permintaan terkirim. Hubungi admin untuk sandi sementara.')};
  const go=async()=>{if(!validNim(f.nim))return toast('Format NIM tidak valid (5-20 huruf/angka)','err');if(f.pw.length<6)return toast('Kata sandi minimal 6 karakter','err');
    if(m==='reg'&&!(f.nama.trim()&&f.prodi.trim()&&f.fakultas.trim()&&f.universitas.trim()))return toast('Lengkapi semua data','err');setB(true);
    try{if(m==='login'){let v=1;try{const d=await getDoc(doc(db,'nimVersion',f.nim.trim().toLowerCase()));if(d.exists())v=d.data().v}catch{}await signInWithEmailAndPassword(auth,nimEmail(f.nim,v),f.pw)}else{const c=await createUserWithEmailAndPassword(auth,nimEmail(f.nim),f.pw);
      await setDoc(doc(db,'registrationRequests',c.user.uid),{uid:c.user.uid,nim:f.nim.trim(),nama:f.nama.trim(),prodi:f.prodi.trim(),fakultas:f.fakultas.trim(),universitas:f.universitas.trim(),status:'pending',createdAt:serverTimestamp()})}}
    catch(e){const c=e.code||'';toast(c==='auth/email-already-in-use'?'NIM sudah terdaftar':c.includes('invalid-credential')||c.includes('wrong-password')||c.includes('user-not-found')?'NIM atau kata sandi salah':e.message,'err')}setB(false)};
  return <div className="auth"><div className="card"><div className="logo" style={{color:'var(--primary)'}}>BIM<i>TRACK</i></div><h2>{m==='login'?'Masuk':'Daftar akun mahasiswa'}</h2>
    {m==='reg'&&[['nama','Nama lengkap'],].map(([k,l])=><div className="fld" key={k}><input className="in" placeholder={l} value={f[k]} onChange={s(k)}/></div>)}
    <div className="fld"><input className="in" placeholder="NIM" inputMode="text" value={f.nim} onChange={s('nim')}/></div>
    {m==='reg'&&['prodi','fakultas','universitas'].map(k=><div className="fld" key={k}><input className="in" placeholder={k[0].toUpperCase()+k.slice(1).replace('prodi','Program studi')} value={f[k]} onChange={s(k)}/></div>)}
    <div className="fld"><Pass value={f.pw} onChange={v=>setF({...f,pw:v})} auto={m==='login'?'current-password':'new-password'}/></div>
    <button className="btn" style={{width:'100%'}} disabled={b} onClick={go}>{m==='login'?'Masuk':'Daftar'}</button>
    <p className="mut" style={{textAlign:'center'}}><button className="ib" style={{minWidth:0,padding:'0 8px',color:'var(--primary)'}} onClick={()=>setM(m==='login'?'reg':'login')}>{m==='login'?'Belum punya akun? Daftar':'Sudah punya akun? Masuk'}</button></p>
    {m==='login'&&<p style={{textAlign:'center'}}><button className="ib" style={{minWidth:0,padding:'0 8px',color:'var(--primary)'}} onClick={()=>setFg({nim:'',nama:''})}>Lupa kata sandi?</button></p>}
    <Modal open={!!fg} title="Lupa kata sandi" onClose={()=>setFg(null)}>{fg&&<><p className="mut">Admin akan memverifikasi identitas Anda lalu memberi sandi sementara.</p><div className="fld"><input className="in" placeholder="NIM" value={fg.nim} onChange={e=>setFg({...fg,nim:e.target.value})}/></div><div className="fld"><input className="in" placeholder="Nama lengkap" value={fg.nama} onChange={e=>setFg({...fg,nama:e.target.value})}/></div><button className="btn" style={{width:'100%'}} onClick={sendReset}>Kirim permintaan</button></>}</Modal></div></div>}
function ChangePass({uid,force}){const[p,setP]=useState(''),[b,setB]=useState(false);
  const go=async()=>{if(p.length<6)return toast('Minimal 6 karakter','err');setB(true);try{await updatePassword(auth.currentUser,p);if(force)updateDoc(doc(db,'users',uid),{mustChangePassword:false}).catch(e=>toast(e.message,'err'));setP('');toast('Kata sandi diganti')}catch(e){toast(e.code==='auth/requires-recent-login'?'Keluar lalu masuk lagi, kemudian ulangi':e.message,'err')}setB(false)};
  return <div className={force?'card':'fld'} style={force?{maxWidth:420,width:'100%'}:{marginTop:12}}>{force&&<h2>Buat kata sandi baru</h2>}<label className="mut" style={{fontSize:'.8rem'}}>{force?'Sandi sementara harus diganti dulu':'Ganti kata sandi'}</label><Pass value={p} onChange={setP} placeholder="Kata sandi baru" auto="new-password"/><button className="btn" style={{width:'100%',marginTop:8}} disabled={b} onClick={go}>Simpan</button></div>}
function Dash({uid,prof}){
  const[b,setB]=useState([]),[r,setR]=useState([]),[j,setJ]=useState([]),[ru,setRu]=useState([]);
  useEffect(()=>{const q=c=>query(collection(db,c),where('ownerUid','==',uid)),m=x=>x.docs.map(d=>d.data());const a=onSnapshot(q('bimbingan'),x=>setB(m(x))),c=onSnapshot(q('revisi'),x=>setR(m(x))),d=onSnapshot(q('jadwal'),x=>setJ(m(x))),e=onSnapshot(q('rundown'),x=>setRu(m(x)));return()=>{a();c();d();e()}},[uid]);
  const n=s=>r.filter(x=>x.status===s).length,done=n(ST[4]),pct=r.length?Math.round(done/r.length*100):0,t=new Date().toISOString().slice(0,10),in3=new Date(Date.now()+3*864e5).toISOString().slice(0,10);
  const last=[...b].sort((x,y)=>(y.tanggal||'')<(x.tanggal||'')?-1:1).slice(0,3),nextJ=j.filter(x=>x.tanggal>=t&&x.status!=='Dibatalkan').sort((x,y)=>(x.tanggal+x.jam)<(y.tanggal+y.jam)?-1:1).slice(0,3),warn=ru.filter(x=>x.deadline&&x.deadline<=in3&&x.status!=='Selesai').sort((x,y)=>x.deadline<y.deadline?-1:1);
  return <div><h1>Halo, {prof.nama}</h1><div className="grid">{[['Bimbingan',b.length],['Revisi',r.length],['Belum dikerjakan',n(ST[0])],['Selesai',done]].map(([l,v])=><div key={l} className="card stat"><span className="mut">{l}</span><b>{v}</b></div>)}</div>
    {warn.length>0&&<div className="card" style={{borderColor:'var(--dan)'}}><h2>Pengingat deadline</h2>{warn.map(x=><p key={x.id} style={{margin:'6px 0'}}><b>{x.nama}</b> · {x.deadline<t?'terlambat sejak ':'deadline '}{x.deadline}</p>)}</div>}
    <div className="card"><h2>Progres revisi {pct}%</h2><div className="bar"><i style={{width:pct+'%'}}/></div><p className="mut" style={{fontSize:'.85rem'}}>Sedang dikerjakan: {n(ST[1])} · Menunggu pemeriksaan: {n(ST[2])} · Perlu revisi ulang: {n(ST[3])}</p></div>
    <div className="card"><h2>Jadwal mendatang</h2>{nextJ.length?nextJ.map(x=><p key={x.id} style={{margin:'6px 0'}}><b>{x.tanggal} {x.jam}</b> · {x.dosen}<br/><span className="mut">{x.agenda} · {x.status}</span></p>):<p className="mut">Belum ada jadwal.</p>}</div>
    <div className="card"><h2>Bimbingan terakhir</h2>{last.length?last.map(x=><p key={x.id}><b>{x.tanggal}</b> · {x.dosen}<br/><span className="mut">{x.topik}</span></p>):<p className="mut">Belum ada data.</p>}</div></div>}
export default function App(){
  const[u,setU]=useState(undefined),[prof,setProf]=useState(undefined),[req,setReq]=useState(undefined),[pg,setPg]=useState('home'),[menu,setMenu]=useState(false);
  useEffect(()=>onAuthStateChanged(auth,x=>{setU(x);setProf(undefined);setReq(undefined)}),[]);
  useEffect(()=>{if(!u)return;const a=onSnapshot(doc(db,'users',u.uid),s=>setProf(s.exists()?s.data():null),()=>setProf(null));const b=onSnapshot(doc(db,'registrationRequests',u.uid),s=>setReq(s.exists()?s.data():null),()=>setReq(null));return()=>{a();b()}},[u]);
  let body;
  if(u===undefined||(u&&(prof===undefined||req===undefined)))body=<div className="auth"><div className="empty">Memuat...</div></div>;
  else if(!u)body=<Auth/>;
  else if(!prof?.approved)body=<div className="auth"><div className="card"><h2>{req?.status==='rejected'?'Pendaftaran ditolak':req?.status==='approved'?'Akses dinonaktifkan':'Menunggu persetujuan admin'}</h2><p className="mut">{req?.status==='rejected'?('Alasan: '+(req.reason||'-')):req?'Akun Anda belum dapat membuka data skripsi.':'Memproses pendaftaran...'}</p><button className="btn sec" onClick={()=>signOut(auth)}>Keluar</button></div></div>;
  else if(prof.mustChangePassword)body=<div className="auth"><ChangePass uid={u.uid} force/></div>;
  else{const du=prof.dataUid||u.uid;
    const PG=[['home','Beranda',P.home],['bim','Bimbingan',P.book],['rev','Revisi',P.edit],['jdw','Jadwal',P.log],['run','Rundown',P.list],['dok','Dokumen & Drive',P.book],['bkt','Bukti revisi',P.eye],['rin','Ringkasan',P.edit],['cari','Pencarian',P.eye],['csv','CSV dan Backup',P.list],['set','Profil',P.user]],MAIN=['home','bim','rev','jdw'],late=x=>x.deadline&&x.deadline<new Date().toISOString().slice(0,10)&&x.status!=='Selesai'?'Terlambat':null;
    const go=k=>{setPg(k);setMenu(false)};
    body=<div className="app"><aside className="side"><div className="logo">BIM<i>TRACK</i></div>{PG.map(([k,l,d])=><button key={k} className={'nl'+(pg===k?' on':'')} onClick={()=>go(k)}><Ic d={d}/>{l}</button>)}</aside>
    <main className="main" key={pg}><PwaBar/>{pg==='home'&&<Dash uid={du} prof={prof}/>}
      {pg==='bim'&&<Crud col="bimbingan" uid={du} title="Bimbingan" fields={BIM} titleKey="topik" subKeys={['tanggal','dosen','metode']} filter={{key:'bab',label:'Bab',options:BAB}}/>}
      {pg==='rev'&&<Crud col="revisi" uid={du} title="Revisi" fields={REV} titleKey="catatan" subKeys={['tanggal','bab','deadline','prioritas']} filter={{key:'status',label:'Status',options:ST}} urlKey="buktiUrl"/>}
      {pg==='jdw'&&<Crud col="jadwal" uid={du} title="Jadwal" fields={JDW} titleKey="agenda" subKeys={['tanggal','jam','dosen','lokasi']} filter={{key:'status',label:'Status',options:JDW[6].options}} header={rows=><Cal rows={rows}/>}/>}
      {pg==='run'&&<Crud col="rundown" uid={du} title="Rundown" fields={RUN} titleKey="nama" subKeys={['deadline','bab','prioritas']} sortKey="deadline" filter={{key:'status',label:'Status',options:RUN[6].options}} badge={late}/>}
      {pg==='dok'&&<Crud col="dokumen" uid={du} title="Dokumen & Drive" fields={DOK} titleKey="nama" subKeys={['tanggal','folder','status']} filter={{key:'kategori',label:'Kategori',options:DOK[1].options}} urlKey="url"/>}
      {pg==='bkt'&&<Crud col="fotoRevisi" uid={du} title="Bukti Revisi" fields={BKT} titleKey="nama" subKeys={['tanggal','revisiId']} filter={{key:'jenis',label:'Jenis',options:BKT[1].options}} urlKey="url"/>}
      {pg==='rin'&&<Summary uid={du}/>}{pg==='cari'&&<Search uid={du} go={go}/>}{pg==='csv'&&<ImportExport uid={du}/>}
      {pg==='set'&&<div><h1>Profil dan Pengaturan</h1><div className="card"><b>{prof.nama}</b><p className="mut">NIM {prof.nim}<br/>{prof.prodi} · {prof.fakultas}<br/>{prof.universitas}</p><Badge>Disetujui</Badge></div><div className="card"><div className="fld"><label>Tema</label><ThemePick get={getTheme} set={setTheme}/></div><ChangePass uid={u.uid}/><button className="btn sec" style={{marginTop:12}} onClick={()=>signOut(auth)}><Ic d={P.out} s={16}/> Keluar</button></div></div>}</main>
    <nav className="bnav">{PG.filter(x=>MAIN.includes(x[0])).map(([k,l,d])=><button key={k} className={pg===k?'on':''} onClick={()=>go(k)}><Ic d={d}/>{l}</button>)}<button className={MAIN.includes(pg)?'':'on'} onClick={()=>setMenu(true)}><Ic d={P.list}/>Menu</button></nav>
    <Modal open={menu} title="Menu" onClose={()=>setMenu(false)}>{PG.filter(x=>!MAIN.includes(x[0])).map(([k,l,d])=><button key={k} className="nl" style={{color:'var(--tx)'}} onClick={()=>go(k)}><Ic d={d}/>{l}</button>)}</Modal></div>}
  return <>{body}<ToastHost/></>}

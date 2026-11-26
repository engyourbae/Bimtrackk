import {useEffect,useState} from 'react';
import {onAuthStateChanged,signInWithEmailAndPassword,createUserWithEmailAndPassword,updatePassword,signOut} from 'firebase/auth';
import {doc,onSnapshot,setDoc,getDoc,addDoc,updateDoc,collection,query,where,serverTimestamp} from 'firebase/firestore';
import {auth,db} from './firebase';
import {getTheme,setTheme} from './shared/theme';
import {ToastHost,toast,Pass,Icon,Badge,ThemePick,PageHead,AuthLayout,BootScreen,Splash,SessionCard,startSessionGuard,markSeen} from './shared/ui';
import Auth from './Auth';
import Dash from './Dash';
import AppShell from '@shared/shell';
import {useRoute,navigate,replaceRoute} from '@shared/router';
import {todayStr} from '@shared/date';
import Crud,{setPrefill} from './Crud';
import {BAB,BIM,ST,REV,JDW,RUN,DOK,BKT,REV_TONE,BIM_TONE,DOK_TONE} from './config';
import Cal from './Cal';
import Summary from './Summary';
import Search from './Search';
import ImportExport from './ImportExport';
import PwaBar from './Pwa';
function ChangePass({uid,force}){const[p,setP]=useState(''),[b,setB]=useState(false);
  const go=async()=>{if(p.length<6)return toast('Minimal 6 karakter','err');setB(true);try{await updatePassword(auth.currentUser,p);if(force)updateDoc(doc(db,'users',uid),{mustChangePassword:false}).catch(e=>toast(e.message,'err'));setP('');toast('Kata sandi diganti')}catch(e){toast(e.code==='auth/requires-recent-login'?'Keluar lalu masuk lagi, kemudian ulangi':e.message,'err')}setB(false)};
  return <div className="field" style={force?undefined:{marginTop:12}}>{!force&&<label>Ganti kata sandi</label>}<Pass value={p} onChange={setP} placeholder="Kata sandi baru" auto="new-password"/><button className="btn" style={{width:'100%',marginTop:8}} disabled={b} onClick={go}>Simpan</button></div>}
export default function App(){
  const[u,setU]=useState(undefined),[prof,setProf]=useState(undefined),[req,setReq]=useState(undefined),{page:pg,action,id:rid}=useRoute();
  useEffect(()=>onAuthStateChanged(auth,x=>{setU(x);if(x)markSeen();setProf(undefined);setReq(undefined)}),[]);
  // kedaluwarsa sesi (hanya aktif bila dinyalakan di Pengaturan; berlaku per perangkat)
  useEffect(()=>{if(!u)return;return startSessionGuard('user',{onExpire:()=>signOut(auth),onWarn:()=>toast('Sesi akan berakhir dalam 1 menit karena tidak aktif. Sentuh layar untuk tetap masuk.')})},[u]);
  useEffect(()=>{if(!u)return;const a=onSnapshot(doc(db,'users',u.uid),s=>setProf(s.exists()?s.data():null),()=>setProf(null));const b=onSnapshot(doc(db,'registrationRequests',u.uid),s=>setReq(s.exists()?s.data():null),()=>setReq(null));return()=>{a();b()}},[u]);
  let body;
  const boot=u===undefined||(u&&(prof===undefined||req===undefined));
  if(boot)body=<BootScreen/>;
  else if(!u)body=<Auth/>;
  else if(!prof?.approved)body=<AuthLayout panel={false} title={req?.status==='rejected'?'Pendaftaran ditolak':req?.status==='approved'?'Akses dinonaktifkan':'Menunggu persetujuan admin'} sub={req?.status==='rejected'?('Alasan: '+(req.reason||'-')):req?'Akun kamu belum dapat membuka data skripsi. Halaman ini akan terbuka otomatis setelah disetujui.':'Memproses pendaftaran…'}><button type="button" className="btn sec block" onClick={()=>signOut(auth)}><Icon name="logout" size={18}/> Keluar</button></AuthLayout>;
  else if(prof.mustChangePassword)body=<AuthLayout panel={false} title="Buat kata sandi baru" sub="Sandi sementara harus diganti dulu sebelum melanjutkan."><ChangePass uid={u.uid} force/></AuthLayout>;
  else{const du=prof.dataUid||u.uid;
    const NAV=[{k:'home',label:'Beranda',icon:'home',main:true,group:'Utama'},{k:'bim',label:'Bimbingan',icon:'bimbingan',main:true,group:'Kerja skripsi'},{k:'rev',label:'Revisi',icon:'revisi',main:true},{k:'jdw',label:'Jadwal',icon:'jadwal',main:true},{k:'run',label:'Rundown',icon:'rundown'},{k:'dok',label:'Dokumen & Drive',icon:'dokumen'},{k:'bkt',label:'Bukti revisi',icon:'image'},{k:'rin',label:'Ringkasan',icon:'ringkasan'},{k:'cari',label:'Pencarian',icon:'cari',group:'Alat'},{k:'csv',label:'CSV dan Backup',icon:'backup'},{k:'set',label:'Profil & Pengaturan',icon:'pengaturan'}];
    const page=NAV.some(n=>n.k===pg)?pg:'home',go=k=>navigate(k),late=x=>x.deadline&&x.deadline<todayStr()&&x.status!=='Selesai'?'Terlambat':null,auto=k=>page===k&&action==='baru',opn=k=>page===k?rid:null,done=()=>replaceRoute(page);
    body=<AppShell nav={NAV} page={page} onNavigate={go} identity={prof.nama} sub={'NIM '+prof.nim} onLogout={()=>signOut(auth)}><PwaBar/>
      {page==='home'&&<Dash uid={du} prof={prof} go={p=>navigate(...p.split('/'))}/>}
      {page==='bim'&&<Crud col="bimbingan" uid={du} title="Bimbingan" fields={BIM} titleKey="topik" subKeys={['tanggal','dosen','metode']} filters={[{key:'bab',label:'Bab',options:BAB},{key:'status',label:'Status',options:BIM[15].options},{key:'jenis',label:'Jenis',options:BIM[4].options},{key:'dosen',label:'Dosen',options:'data'}]} range="tanggal" statusKey="status" tones={BIM_TONE} archivable defaults={()=>({tanggal:todayStr(),status:'Terlaksana'})} autoNew={auto('bim')} onAutoNew={done} openId={opn('bim')} onOpenId={done}
        relations={[{col:'revisi',via:'bimbinganId',title:'Revisi dari bimbingan ini',titleKey:'catatan',sub:['status','deadline'],empty:'Belum ada revisi yang dicatat dari bimbingan ini.',add:x=>({bimbinganId:x.id,bab:x.bab||'',tanggal:x.tanggal||todayStr(),status:ST[0]})}]}
        actions={[{label:'Jadwalkan pertemuan berikutnya',icon:'jadwal',show:x=>!!x.jadwalNext,onClick:x=>{setPrefill('jadwal',{tanggal:x.jadwalNext,dosen:x.dosen||'',agenda:x.targetNext||'',lokasi:x.lokasi||'',metode:x.metode||'',status:'Direncanakan'});navigate('jdw','baru')}}]}/>}
      {page==='rev'&&<Crud col="revisi" uid={du} title="Revisi" fields={REV} titleKey="catatan" subKeys={['tanggal','bab','deadline','prioritas']} filters={[{key:'status',label:'Status',options:ST},{key:'bab',label:'Bab',options:BAB},{key:'prioritas',label:'Prioritas',options:['Rendah','Sedang','Tinggi']}]} range="tanggal" statusKey="status" tones={REV_TONE} history doneStatus={ST[4]} doneKey="tanggalSelesai" archivable defaults={()=>({tanggal:todayStr(),status:ST[0],prioritas:'Sedang'})} urlKey="buktiUrl" badge={late} autoNew={auto('rev')} onAutoNew={done} openId={opn('rev')} onOpenId={done}
        relations={[{col:'fotoRevisi',via:'revisiId',title:'Bukti revisi',titleKey:'nama',sub:['jenis','tanggal'],empty:'Belum ada bukti. Tambahkan foto lembar revisi atau screenshot komentar.',add:x=>({revisiId:x.id,nama:'Bukti: '+(x.catatan||'').slice(0,40),tanggal:todayStr()})}]}/>}
      {page==='jdw'&&<Crud autoNew={auto('jdw')} onAutoNew={done} openId={opn('jdw')} onOpenId={done} col="jadwal" uid={du} title="Jadwal" fields={JDW} titleKey="agenda" subKeys={['tanggal','jam','dosen','lokasi']} filters={[{key:'status',label:'Status',options:JDW[6].options}]} header={rows=><Cal rows={rows}/>}/>}
      {page==='run'&&<Crud autoNew={auto('run')} onAutoNew={done} openId={opn('run')} onOpenId={done} col="rundown" uid={du} title="Rundown" fields={RUN} titleKey="nama" subKeys={['deadline','bab','prioritas']} sortKey="deadline" filters={[{key:'status',label:'Status',options:RUN[6].options}]} badge={late}/>}
      {page==='dok'&&<Crud autoNew={auto('dok')} onAutoNew={done} openId={opn('dok')} onOpenId={done} col="dokumen" uid={du} title="Dokumen & Drive" fields={DOK} titleKey="nama" subKeys={['tanggal','folder','status']} filters={[{key:'kategori',label:'Kategori',options:DOK[1].options},{key:'status',label:'Status',options:DOK[6].options}]} range="tanggal" statusKey="status" tones={DOK_TONE} archivable views={['list','group']} groupKey="kategori" defaults={()=>({tanggal:todayStr(),status:'Draft'})} urlKey="url"/>}
      {page==='bkt'&&<Crud autoNew={auto('bkt')} onAutoNew={done} openId={opn('bkt')} onOpenId={done} col="fotoRevisi" uid={du} title="Bukti Revisi" fields={BKT} titleKey="nama" subKeys={['tanggal','jenis']} filters={[{key:'jenis',label:'Jenis',options:BKT[1].options}]} range="tanggal" archivable views={['gallery','list']} defaults={()=>({tanggal:todayStr()})} urlKey="url"/>}
      {page==='rin'&&<Summary uid={du}/>}{page==='cari'&&<Search uid={du} go={go}/>}{page==='csv'&&<ImportExport uid={du}/>}
      {page==='set'&&<div><PageHead title="Profil dan Pengaturan"/><div className="card"><b>{prof.nama}</b><p className="mut">NIM {prof.nim}<br/>{prof.prodi} · {prof.fakultas}<br/>{prof.universitas}</p><Badge tone="ok">Disetujui</Badge></div><div className="card"><div className="field"><label>Tema tampilan</label><ThemePick get={getTheme} set={setTheme}/></div><ChangePass uid={u.uid}/></div><SessionCard app="user"/></div>}
    </AppShell>}
  return <>{body}<Splash ready={!boot}/><ToastHost/></>}

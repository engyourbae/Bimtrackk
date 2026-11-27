import {useEffect,useState} from 'react';
import {onAuthStateChanged,signOut} from 'firebase/auth';
import {useDocPaths} from './useData';
import {auth} from './firebase';
import {ToastHost,toast,Icon,AuthLayout,BootScreen,Splash,Skeleton,startSessionGuard,markSeen,LogoutButton,ErrorState} from './shared/ui';
import {logoutUser,offlineOn,LO} from './offline';
import Auth from './Auth';
import Dash from './Dash';
import AppShell from '@shared/shell';
import {useRoute,navigate,replaceRoute} from '@shared/router';
import {todayStr} from '@shared/date';
import Crud,{setPrefill} from './Crud';
import {BAB,BIM,ST,REV,DOK,BKT,REV_TONE,BIM_TONE,DOK_TONE} from './config';
import {NAV,ALIAS,PAGES} from './nav';
import Journey from './Journey';
import JadwalPage from './Jadwal';
import Laporan from './Laporan';
import Search from './Search';
import Jejak from './Jejak';
import Bantuan from './Bantuan';
import Settings,{ChangePass} from './Settings';
import PwaBar from './Pwa';
import PageSkeleton from './PageSkeleton';
export default function App(){
  const[u,setU]=useState(undefined),{page:pg,action,id:rid}=useRoute();
  useEffect(()=>onAuthStateChanged(auth,x=>{setU(x);if(x)markSeen()}),[]);
  // kedaluwarsa sesi (hanya aktif bila dinyalakan di Pengaturan; berlaku per perangkat)
  useEffect(()=>{if(!u)return;return startSessionGuard('user',{onExpire:()=>signOut(auth),holdOffline:()=>offlineOn()&&!navigator.onLine,onWarn:()=>toast('Sesi akan berakhir dalam 1 menit karena tidak aktif. Sentuh layar untuk tetap masuk.')})},[u]);
  // pintasan papan ketik: tekan "/" untuk membuka Pencarian (tidak aktif saat mengetik atau saat dialog terbuka)
  useEffect(()=>{if(!u)return;const f=e=>{if(e.key!=='/'||e.ctrlKey||e.metaKey||e.altKey||document.body.classList.contains('lock'))return;const t=e.target;if(/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)||t.isContentEditable)return;e.preventDefault();navigate('cari')};document.addEventListener('keydown',f);return()=>document.removeEventListener('keydown',f)},[u]);
  // profil + permintaan pendaftaran: memuat / galat / offline dibedakan dari "belum ada" (tidak lagi dianggap menunggu persetujuan saat galat)
  const pl=useDocPaths(u?[{key:'prof',path:['users',u.uid]},{key:'req',path:['registrationRequests',u.uid]}]:[],u?.uid||''),
    prof=pl.d.prof?(pl.d.prof[0]??null):undefined,req=pl.d.req?(pl.d.req[0]??null):undefined;
  let body;
  // boot = status masuk belum diketahui. Setelah itu splash naik; selama profil dimuat tampil kerangka skeleton seluruh aplikasi.
  const boot=u===undefined,loadingApp=!!u&&pl.status==='loading';
  if(boot)body=<BootScreen/>;
  else if(!u)body=<Auth/>;
  else if(loadingApp){const page=PAGES.includes(pg)?pg:'home';
    body=<AppShell loading nav={NAV} page={ALIAS[page]||page} onNavigate={k=>navigate(k)} onLogout={logoutUser} logoutOpts={LO} topSlot={<Skeleton w={44} h={44} r={22}/>}><PageSkeleton page={page} label={NAV.find(n=>n.k===(ALIAS[page]||page))?.label}/></AppShell>}
  else if(['error','timeout','offline'].includes(pl.status))body=<AuthLayout panel={false} title="Akunmu belum bisa dimuat" sub="Data akun diperlukan sebelum aplikasi bisa dibuka."><ErrorState compact kind={pl.status} error={pl.error} onRetry={pl.retry}/><LogoutButton onLogout={logoutUser} {...LO} className="btn sec block"/></AuthLayout>;
  else if(!prof?.approved)body=<AuthLayout panel={false} title={req?.status==='rejected'?'Pendaftaran ditolak':req?.status==='approved'?'Akses dinonaktifkan':'Menunggu persetujuan admin'} sub={req?.status==='rejected'?('Alasan: '+(req.reason||'-')):req?'Akun kamu belum dapat membuka data skripsi. Halaman ini akan terbuka otomatis setelah disetujui.':'Memproses pendaftaran…'}><LogoutButton onLogout={logoutUser} {...LO} className="btn sec block"/></AuthLayout>;
  else if(prof.mustChangePassword)body=<AuthLayout panel={false} title="Buat kata sandi baru" sub="Sandi sementara harus diganti dulu sebelum melanjutkan."><ChangePass uid={u.uid} force/></AuthLayout>;
  else{const du=prof.dataUid||u.uid;
    const search=<button type="button" className="ib" aria-label="Cari" title="Cari (tekan /)" onClick={()=>navigate('cari')}><Icon name="cari"/></button>;
    const page=PAGES.includes(pg)?pg:'home',go=k=>navigate(k),late=x=>x.deadline&&x.deadline<todayStr()&&x.status!=='Selesai'?'Terlambat':null,auto=k=>page===k&&action==='baru',opn=k=>page===k?rid:null,done=()=>replaceRoute(page);
    body=<AppShell nav={NAV} page={ALIAS[page]||page} onNavigate={go} identity={prof.nama} sub={'NIM '+prof.nim} onLogout={logoutUser} logoutOpts={LO} topSlot={search}><PwaBar/>
      {page==='home'&&<Dash uid={du} prof={prof} go={p=>navigate(...p.split('/'))}/>}
      {page==='bim'&&<Crud col="bimbingan" uid={du} title="Bimbingan" heading="Catatan Bimbingan" fields={BIM} titleKey="topik" subKeys={['tanggal','dosen','metode']} filters={[{key:'bab',label:'Bab',options:BAB},{key:'status',label:'Status',options:BIM[15].options},{key:'jenis',label:'Jenis',options:BIM[4].options},{key:'dosen',label:'Dosen',options:'data'}]} range="tanggal" statusKey="status" tones={BIM_TONE} archivable defaults={()=>({tanggal:todayStr(),status:'Terlaksana'})} autoNew={auto('bim')} onAutoNew={done} openId={opn('bim')} onOpenId={done}
        relations={[{col:'revisi',via:'bimbinganId',title:'Revisi dari bimbingan ini',titleKey:'catatan',sub:['status','deadline'],empty:'Belum ada revisi yang dicatat dari bimbingan ini.',add:x=>({bimbinganId:x.id,bab:x.bab||'',tanggal:x.tanggal||todayStr(),status:ST[0]})}]}
        actions={[{label:'Jadwalkan pertemuan berikutnya',icon:'jadwal',show:x=>!!x.jadwalNext,onClick:x=>{setPrefill('jadwal',{tanggal:x.jadwalNext,dosen:x.dosen||'',agenda:x.targetNext||'',lokasi:x.lokasi||'',metode:x.metode||'',status:'Direncanakan'});navigate('jdw','baru')}}]}/>}
      {page==='rev'&&<Crud col="revisi" uid={du} title="Revisi" heading="Manajemen Revisi" fields={REV} titleKey="catatan" subKeys={['tanggal','bab','deadline','prioritas']} filters={[{key:'status',label:'Status',options:ST},{key:'bab',label:'Bab',options:BAB},{key:'prioritas',label:'Prioritas',options:['Rendah','Sedang','Tinggi']}]} range="tanggal" statusKey="status" tones={REV_TONE} history doneStatus={ST[4]} doneKey="tanggalSelesai" archivable defaults={()=>({tanggal:todayStr(),status:ST[0],prioritas:'Sedang'})} urlKey="buktiUrl" badge={late} autoNew={auto('rev')} onAutoNew={done} openId={opn('rev')} onOpenId={done}
        relations={[{col:'fotoRevisi',via:'revisiId',title:'Bukti revisi',titleKey:'nama',sub:['jenis','tanggal'],empty:'Belum ada bukti. Tambahkan foto lembar revisi atau screenshot komentar.',add:x=>({revisiId:x.id,nama:'Bukti: '+(x.catatan||'').slice(0,40),tanggal:todayStr()})}]}/>}
      {page==='prog'&&<Journey uid={du}/>}
      {(page==='jdw'||page==='run')&&<JadwalPage uid={du} tab={page} late={late} autoNew={auto(page)} onAutoNew={done} openId={opn(page)} onOpenId={done}/>}
      {page==='dok'&&<Crud autoNew={auto('dok')} onAutoNew={done} openId={opn('dok')} onOpenId={done} col="dokumen" uid={du} title="Dokumen" heading="Arsip Dokumen" fields={DOK} titleKey="nama" subKeys={['tanggal','folder','status']} filters={[{key:'kategori',label:'Kategori',options:DOK[1].options},{key:'status',label:'Status',options:DOK[6].options}]} range="tanggal" statusKey="status" tones={DOK_TONE} archivable views={['list','group']} groupKey="kategori" defaults={()=>({tanggal:todayStr(),status:'Draft'})} urlKey="url"/>}
      {page==='bkt'&&<Crud autoNew={auto('bkt')} onAutoNew={done} openId={opn('bkt')} onOpenId={done} col="fotoRevisi" uid={du} title="Bukti Revisi" heading="Dokumentasi & Bukti" fields={BKT} titleKey="nama" subKeys={['tanggal','jenis']} filters={[{key:'jenis',label:'Jenis',options:BKT[1].options}]} range="tanggal" archivable views={['gallery','list']} defaults={()=>({tanggal:todayStr()})} urlKey="url"/>}
      {(page==='rin'||page==='csv')&&<Laporan uid={du} tab={page} prof={prof}/>}{page==='cari'&&<Search uid={du}/>}
      {page==='jjk'&&<Jejak uid={du} autoNew={auto('jjk')} onAutoNew={done} openId={opn('jjk')} onOpenId={done}/>}
      {page==='bantuan'&&<Bantuan/>}
      {page==='set'&&<Settings prof={prof} uid={u.uid}/>}
    </AppShell>}
  return <>{body}<Splash ready={!boot}/><ToastHost/></>}

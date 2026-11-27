import {useState} from 'react';
import {getAuth,createUserWithEmailAndPassword,signOut} from 'firebase/auth';
import {initializeApp,getApps} from 'firebase/app';
import {doc,getDoc,getDocs,collection,writeBatch,serverTimestamp} from 'firebase/firestore';
import {db,auth,firebaseConfig} from '../firebase';
import {nimEmail} from '../shared/nim';
import {toast,Modal,PageHead,EmptyState,ConfirmDialog,DataState,when} from '../shared/ui';
import {useAdminCols,ds} from '../useAdmin';
import {ListSk} from '../common';
const tmp=()=>{const c='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789',a=new Uint32Array(10);crypto.getRandomValues(a);return[...a].map(x=>c[x%c.length]).join('')};
export default function Resets({uid}){
  const a=useAdminCols(['rst'],uid),list=(a.d.rst||[]).filter(r=>r.status==='pending'),[res,setRes]=useState(null),[askRej,setAskRej]=useState(null),[askOk,setAskOk]=useState(null),[busy,setBusy]=useState(false);
  const approve=async r=>{setBusy(true);try{const nim=r.nim.trim().toLowerCase(),
      users=(await getDocs(collection(db,'users'))).docs.map(d=>({...d.data(),id:d.id})),cur=users.filter(x=>(x.nim||'').toLowerCase()===nim&&x.approved);
    if(!cur.length)throw new Error('NIM tidak ditemukan atau akses tidak aktif');
    const o=cur[0],dataUid=o.dataUid||o.uid,vs=await getDoc(doc(db,'nimVersion',nim)),v=(vs.exists()?vs.data().v:1)+1,pw=tmp();
    const sec=getApps().find(x=>x.name==='sec')||initializeApp(firebaseConfig,'sec'),sa=getAuth(sec);
    const c=await createUserWithEmailAndPassword(sa,nimEmail(nim,v),pw);await signOut(sa);
    const b=writeBatch(db),t=serverTimestamp(),adm=auth.currentUser.uid;
    b.set(doc(db,'users',c.user.uid),{uid:c.user.uid,dataUid,nim:o.nim,nama:o.nama,prodi:o.prodi,fakultas:o.fakultas,universitas:o.universitas,approved:true,mustChangePassword:true,approvedAt:t});
    cur.forEach(x=>b.update(doc(db,'users',x.uid),{approved:false}));
    b.set(doc(db,'nimVersion',nim),{v});
    b.update(doc(db,'resetRequests',r.id),{status:'done',decidedAt:t,decidedBy:adm});
    b.set(doc(collection(db,'aktivitas')),{action:'reset_password',nim:o.nim,adminUid:adm,createdAt:t});
    await b.commit();setRes({nim:o.nim,pw})}catch(e){toast(e.code==='auth/email-already-in-use'?'Akun sementara sudah ada (percobaan sebelumnya gagal). Hapus di Firebase Console lalu ulangi.':e.message,'err')}setBusy(false)};
  const reject=async r=>{setBusy(true);try{const b=writeBatch(db);b.update(doc(db,'resetRequests',r.id),{status:'rejected',decidedAt:serverTimestamp(),decidedBy:auth.currentUser.uid});await b.commit();toast('Ditolak: '+r.nama)}catch(e){toast(e.message,'err')}setBusy(false)};
  return <div><PageHead title="Reset Sandi" sub="Permintaan reset dari mahasiswa"/>
    <DataState {...ds(a)} label="Memuat permintaan reset" skeleton={<ListSk/>} isEmpty={!list.length} empty={<EmptyState compact title="Tidak ada permintaan reset" text="Permintaan reset sandi dari mahasiswa akan muncul di sini."/>}>
      {list.map(r=><div className="card" key={r.id}><b>{r.nama}</b><p className="mut" style={{margin:'6px 0'}}>NIM {r.nim}<br/>{when(r.createdAt)}</p><p className="mut" style={{fontSize:'.8rem'}}>Verifikasi identitas mahasiswa dulu sebelum menyetujui.</p>
        <div className="row"><button type="button" className="btn sp" disabled={busy} onClick={()=>setAskOk(r)}>Setujui dan buat sandi</button><button type="button" className="btn dan sp" disabled={busy} onClick={()=>setAskRej(r)}>Tolak</button></div></div>)}</DataState>
    <ConfirmDialog open={!!askOk} title="Buat sandi sementara?" confirmLabel="Setujui dan buat sandi" danger={false} autoFocusCancel onCancel={()=>setAskOk(null)} onConfirm={()=>{const x=askOk;setAskOk(null);approve(x)}} text={<>Akun login baru dibuat untuk {askOk?.nama} (NIM {askOk?.nim}) dan akun lamanya dinonaktifkan di Firestore. Pastikan identitas mahasiswa sudah diverifikasi. Sandi sementara hanya tampil sekali.</>}/>
    <ConfirmDialog open={!!askRej} title="Tolak permintaan reset?" confirmLabel="Tolak" onCancel={()=>setAskRej(null)} onConfirm={()=>{const x=askRej;setAskRej(null);reject(x)}} text={<>Permintaan reset sandi atas nama {askRej?.nama} (NIM {askRej?.nim}) akan ditolak dan mahasiswa harus mengajukan ulang.</>}/>
    <Modal open={!!res} title="Sandi sementara" onClose={()=>setRes(null)}><p>NIM {res?.nim}. Sandi ini hanya tampil sekali, sampaikan langsung ke mahasiswa:</p><div className="card" style={{fontSize:'1.4rem',textAlign:'center',letterSpacing:2,userSelect:'all'}}>{res?.pw}</div><button type="button" className="btn" style={{width:'100%'}} onClick={()=>{navigator.clipboard?.writeText(res.pw);toast('Disalin')}}>Salin</button></Modal></div>}

import {useEffect,useRef,useState} from 'react';
import {writeBatch,doc,collection,getDoc,serverTimestamp} from 'firebase/firestore';
import {db,auth} from '../firebase';
import {toast,PageHead,EmptyState,ConfirmDialog,Checkbox,Icon,DataState} from '../shared/ui';
import {useAdminCols,ds} from '../useAdmin';
import {ListSk} from '../common';
/** Keluarkan paksa: menulis kickedAt/kickBy ke sesi/{uid} (perangkat akun itu keluar otomatis saat online), opsional memblokir akses (approved:false). */
function Kick({u,onClose}){
  const[block,setBlock]=useState(false),[busy,setBusy]=useState(false),keep=useRef(null);if(u)keep.current=u;const v=u||keep.current;
  useEffect(()=>{setBlock(false)},[u]);
  const go=async()=>{setBusy(true);try{const adm=auth.currentUser.uid,ref=doc(db,'sesi',v.uid),sn=await getDoc(ref);
    if(!sn.exists()&&!block){toast('Akun ini belum punya sesi tercatat, jadi belum ada yang bisa dikeluarkan. Gunakan "Blokir akses" bila perlu.','err');setBusy(false);return}
    const b=writeBatch(db),t=serverTimestamp();
    if(sn.exists())b.update(ref,{kickedAt:t,kickBy:adm});
    if(block&&v.approved)b.update(doc(db,'users',v.uid),{approved:false});
    b.set(doc(collection(db,'aktivitas')),{action:'force_logout',targetUid:v.uid,nim:v.nim,block:!!block,hadSession:sn.exists(),adminUid:adm,createdAt:t});
    await b.commit();onClose();
    toast((sn.exists()?'Perintah keluar dikirim untuk '+v.nama+'. Perangkatnya keluar otomatis saat online.':'Belum ada sesi tercatat untuk '+v.nama+'.')+(block?' Akses diblokir.':''))}catch(e){toast(e.code==='permission-denied'?'Ditolak server. Pastikan firestore.rules terbaru (koleksi sesi) sudah diterbitkan.':e.message,'err')}setBusy(false)};
  return <ConfirmDialog open={!!u} title="Keluarkan paksa akun ini?" confirmLabel="Keluarkan paksa" busy={busy} autoFocusCancel onCancel={onClose} onConfirm={go}>
    <p style={{margin:0}}><b>{v?.nama}</b> (NIM {v?.nim}) akan keluar otomatis dari perangkat mana pun yang sedang memakai akunnya, begitu perangkat itu online.</p>
    <div style={{marginTop:12}}><Checkbox checked={block} onChange={setBlock} label="Blokir akses sekaligus"/><p className="mut" style={{margin:'6px 0 0',fontSize:'var(--fs-xs)'}}>Akses data dinonaktifkan di server sehingga perangkat itu tidak bisa membaca atau menulis data lagi. Bisa diaktifkan lagi lewat tombol Aktifkan akses.</p></div>
    <div className="lockmsg" style={{margin:'12px 0 0'}}><Icon name="alert" size={18}/><span>Batasan: perangkat yang offline tetap bisa membaca salinan data di penyimpanannya (tidak terenkripsi) sampai ia online. Reset sandi tidak mencabut sesi. Pencabutan token sebenarnya butuh Cloud Functions (Blaze) dan tidak diaktifkan.</span></div></ConfirmDialog>}
export default function Users({uid}){
  const a=useAdminCols(['users'],uid),users=[...(a.d.users||[])].sort((x,y)=>(x.nama||'').localeCompare(y.nama||'')),[q,setQ]=useState(''),[ask,setAsk]=useState(null),[en,setEn]=useState(null),[kick,setKick]=useState(null),[busy,setBusy]=useState(false);
  const list=users.filter(u=>((u.nim||'')+(u.nama||'')).toLowerCase().includes(q.toLowerCase()));
  const acc=async(u,v)=>{setBusy(true);try{const b=writeBatch(db);b.update(doc(db,'users',u.uid),{approved:v});b.set(doc(collection(db,'aktivitas')),{action:v?'enable_access':'revoke_access',targetUid:u.uid,nim:u.nim,adminUid:auth.currentUser.uid,createdAt:serverTimestamp()});await b.commit();toast(v?'Akses diaktifkan: '+u.nama:'Akses dicabut: '+u.nama)}catch(e){toast(e.message,'err')}setBusy(false)};
  return <div><PageHead title="Pengguna" sub="Akses data, keluarkan paksa"/>
    <input className="in" style={{marginBottom:12}} aria-label="Cari NIM atau nama" placeholder="Cari NIM / nama" value={q} onChange={e=>setQ(e.target.value)}/>
    <DataState {...ds(a)} label="Memuat pengguna" skeleton={<ListSk/>} isEmpty={!list.length} empty={<EmptyState compact title={q?'Tidak ada hasil':'Belum ada pengguna'} text={q?'Coba kata kunci NIM atau nama lain.':'Pengguna yang disetujui akan muncul di sini.'}/>}>
      {list.map(u=><div className="card" key={u.uid||u.id}><div className="row"><b className="sp">{u.nama}</b><span className={'badge '+(u.approved?'ok':'no')}>{u.approved?'Aktif':'Nonaktif'}</span></div><p className="mut" style={{margin:'6px 0'}}>NIM {u.nim} · {u.prodi}</p>
        <div className="row" style={{flexWrap:'wrap'}}><button type="button" className={'btn sp '+(u.approved?'dan':'')} disabled={busy} onClick={()=>u.approved?setAsk(u):setEn(u)}>{u.approved?'Cabut akses':'Aktifkan akses'}</button>
          <button type="button" className="btn sec sp" onClick={()=>setKick(u)}><Icon name="logout" size={16}/> Keluarkan paksa</button></div></div>)}</DataState>
    <ConfirmDialog open={!!ask} title="Cabut akses data?" confirmLabel="Cabut akses" onCancel={()=>setAsk(null)} onConfirm={()=>{const x=ask;setAsk(null);acc(x,false)}} text={<>{ask?.nama} (NIM {ask?.nim}) tidak akan bisa membuka data skripsinya sampai aksesnya diaktifkan lagi.</>}/>
    <ConfirmDialog open={!!en} title="Aktifkan akses data?" confirmLabel="Aktifkan" danger={false} autoFocusCancel onCancel={()=>setEn(null)} onConfirm={()=>{const x=en;setEn(null);acc(x,true)}} text={<>{en?.nama} (NIM {en?.nim}) akan bisa membuka dan mengisi data skripsinya lagi.</>}/>
    <Kick u={kick} onClose={()=>setKick(null)}/>
    <p className="mut" style={{fontSize:'.8rem'}}>Catatan: Cabut akses menutup akses mahasiswa ke data skripsinya di server. Akun masuk miliknya tidak dihapus atau dinonaktifkan.</p></div>}

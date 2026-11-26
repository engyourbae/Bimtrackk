import {useState} from 'react';
import {signInWithEmailAndPassword,createUserWithEmailAndPassword} from 'firebase/auth';
import {doc,setDoc,getDoc,addDoc,collection,serverTimestamp} from 'firebase/firestore';
import {auth,db} from './firebase';
import {nimEmail,validNim} from './shared/nim';
import {AuthLayout,Field,Pass,Segmented,Modal,Icon,toast,useAttemptLimit} from './shared/ui';

const friendly=e=>{const c=e?.code||'';
  if(c.includes('invalid-credential')||c.includes('wrong-password')||c.includes('user-not-found'))return'NIM atau kata sandi salah.';
  if(c==='auth/email-already-in-use')return'NIM ini sudah terdaftar. Silakan masuk, atau hubungi admin jika lupa kata sandi.';
  if(c==='auth/weak-password')return'Kata sandi terlalu lemah. Gunakan minimal 6 karakter.';
  if(c==='auth/network-request-failed')return'Tidak ada koneksi internet. Periksa sinyal lalu coba lagi.';
  if(c==='auth/too-many-requests')return'Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.';
  return'Terjadi kendala. Coba lagi sebentar lagi.'};
const NIM_MSG='NIM harus 5–20 huruf atau angka, tanpa spasi.';

export default function Auth(){
  const[mode,setMode]=useState('login'),[step,setStep]=useState(1),[f,setF]=useState({nim:'',pw:'',pw2:'',nama:'',prodi:'',fakultas:'',universitas:''}),[err,setErr]=useState({}),[busy,setBusy]=useState(false),[fg,setFg]=useState(null),lim=useAttemptLimit('bimtrack-user-attempts');
  const set=k=>v=>{setF(s=>({...s,[k]:v}));if(err[k])setErr(s=>({...s,[k]:undefined}))},inp=k=>e=>set(k)(e.target.value);
  const check=keys=>{const e={};keys.forEach(k=>{const v=(f[k]||'').trim();
    if(k==='nim'&&!validNim(f.nim))e.nim=NIM_MSG;else if(['nama','prodi','fakultas','universitas'].includes(k)&&!v)e[k]='Wajib diisi.';
    else if(k==='pw'&&f.pw.length<6)e.pw='Minimal 6 karakter.';else if(k==='pw2'&&f.pw2!==f.pw)e.pw2='Kata sandi tidak sama.'});setErr(e);return!Object.keys(e).length};
  const switchMode=m=>{setMode(m);setStep(1);setErr({})};
  const submit=async ev=>{ev.preventDefault();
    if(mode==='reg'&&step===1){if(check(['nama','nim','prodi','fakultas','universitas']))setStep(2);return}
    if(lim.locked)return;if(!check(mode==='login'?['nim','pw']:['pw','pw2']))return;setBusy(true);
    try{
      if(mode==='login'){let v=1;try{const d=await getDoc(doc(db,'nimVersion',f.nim.trim().toLowerCase()));if(d.exists())v=d.data().v}catch{}await signInWithEmailAndPassword(auth,nimEmail(f.nim,v),f.pw);lim.ok()}
      else{const c=await createUserWithEmailAndPassword(auth,nimEmail(f.nim),f.pw);
        await setDoc(doc(db,'registrationRequests',c.user.uid),{uid:c.user.uid,nim:f.nim.trim(),nama:f.nama.trim(),prodi:f.prodi.trim(),fakultas:f.fakultas.trim(),universitas:f.universitas.trim(),status:'pending',createdAt:serverTimestamp()})}
    }catch(e){if(mode==='login'&&/credential|password|user-not-found/.test(e.code||''))lim.fail();const m=friendly(e);if(e.code==='auth/email-already-in-use'){setStep(1);setErr({nim:m})}else setErr({form:m})}
    setBusy(false)};
  const sendReset=()=>{const e={};if(!validNim(fg.nim))e.nim=NIM_MSG;if(!fg.nama.trim())e.nama='Wajib diisi.';setFg(s=>({...s,e}));if(Object.keys(e).length)return;
    addDoc(collection(db,'resetRequests'),{nim:fg.nim.trim(),nama:fg.nama.trim(),status:'pending',createdAt:serverTimestamp()}).catch(()=>toast('Permintaan belum terkirim. Periksa koneksi lalu coba lagi.','err'));setFg(null);toast('Permintaan terkirim. Hubungi admin untuk sandi sementara.')};
  const reg=mode==='reg';
  return <AuthLayout title={reg?'Buat akun mahasiswa':'Selamat datang kembali'} sub={reg?'Akun akan aktif setelah disetujui admin.':'Masuk dengan NIM untuk melanjutkan skripsimu.'}
    footer={<>{reg?'Sudah punya akun?':'Belum punya akun?'} <button type="button" className="btn ghost sm" onClick={()=>switchMode(reg?'login':'reg')}>{reg?'Masuk':'Daftar'}</button></>}>
    <div className="auth-tabs"><Segmented label="Pilih tindakan" value={mode} onChange={switchMode} options={[{value:'login',label:'Masuk'},{value:'reg',label:'Daftar'}]}/></div>
    <form onSubmit={submit} noValidate>
      {reg&&<ol className="steps" aria-label="Langkah pendaftaran"><li className={step>=1?'on':''} aria-current={step===1?'step':undefined}>1. Data diri</li><li className={step>=2?'on':''} aria-current={step===2?'step':undefined}>2. Kata sandi</li></ol>}
      {err.form&&<div className="lockmsg" role="alert"><Icon name="alert" size={18}/><span>{err.form}</span></div>}
      {lim.locked&&<div className="lockmsg" role="alert"><Icon name="clock" size={18}/><span>Terlalu banyak percobaan. Coba lagi dalam {lim.secs} detik.</span></div>}
      {(!reg||step===1)&&<>
        {reg&&<Field id="a-nama" label="Nama lengkap" req error={err.nama}><input id="a-nama" className="in" autoComplete="name" value={f.nama} onChange={inp('nama')} aria-invalid={!!err.nama}/></Field>}
        <Field id="a-nim" label="NIM" req error={err.nim} hint={reg?'Dipakai untuk masuk. Tidak bisa diubah sendiri.':undefined}><input id="a-nim" className="in" inputMode="text" autoComplete="username" autoCapitalize="none" value={f.nim} onChange={inp('nim')} aria-invalid={!!err.nim}/></Field>
        {reg&&<><Field id="a-prodi" label="Program studi" req error={err.prodi}><input id="a-prodi" className="in" value={f.prodi} onChange={inp('prodi')} aria-invalid={!!err.prodi}/></Field>
          <Field id="a-fak" label="Fakultas" req error={err.fakultas}><input id="a-fak" className="in" value={f.fakultas} onChange={inp('fakultas')} aria-invalid={!!err.fakultas}/></Field>
          <Field id="a-univ" label="Universitas" req error={err.universitas}><input id="a-univ" className="in" autoComplete="organization" value={f.universitas} onChange={inp('universitas')} aria-invalid={!!err.universitas}/></Field></>}
      </>}
      {(!reg||step===2)&&<>
        <Field id="a-pw" label="Kata sandi" req error={err.pw} hint={reg?'Minimal 6 karakter.':undefined}><Pass id="a-pw" value={f.pw} onChange={set('pw')} auto={reg?'new-password':'current-password'} invalid={!!err.pw}/></Field>
        {reg&&<Field id="a-pw2" label="Ulangi kata sandi" req error={err.pw2}><Pass id="a-pw2" value={f.pw2} onChange={set('pw2')} placeholder="Ulangi kata sandi" auto="new-password" invalid={!!err.pw2}/></Field>}</>}
      <div className="row" style={{marginTop:8}}>
        {reg&&step===2&&<button type="button" className="btn sec" onClick={()=>setStep(1)}><Icon name="chev-left" size={18}/> Kembali</button>}
        <button type="submit" className="btn sp" disabled={busy||lim.locked}>{busy?'Memproses…':reg?(step===1?'Lanjut':'Daftar'):'Masuk'}</button></div>
      {!reg&&<p style={{textAlign:'center',marginTop:12}}><button type="button" className="btn ghost sm" onClick={()=>setFg({nim:'',nama:'',e:{}})}>Lupa kata sandi?</button></p>}
    </form>
    <Modal open={!!fg} title="Lupa kata sandi" onClose={()=>setFg(null)}>{fg&&<><p className="mut">Admin akan memastikan identitasmu, lalu memberi sandi sementara.</p>
      <Field id="r-nim" label="NIM" req error={fg.e?.nim}><input id="r-nim" className="in" value={fg.nim} onChange={e=>setFg({...fg,nim:e.target.value})}/></Field>
      <Field id="r-nama" label="Nama lengkap" req error={fg.e?.nama}><input id="r-nama" className="in" value={fg.nama} onChange={e=>setFg({...fg,nama:e.target.value})}/></Field>
      <button type="button" className="btn block" onClick={sendReset}>Kirim permintaan</button></>}</Modal>
  </AuthLayout>}

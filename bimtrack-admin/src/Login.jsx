import {useEffect,useState} from 'react';
import {signInWithEmailAndPassword,setPersistence,browserLocalPersistence,browserSessionPersistence} from 'firebase/auth';
import {auth} from './firebase';
import {nimEmail} from './shared/nim';
import {Pass,Icon,AuthLayout,Field,useLoginGuard,LockNotice,Checkbox,resetSessionClock} from './shared/ui';
export default function Login({err}){const[i,setI]=useState(''),[p,setP]=useState(''),[b,setB]=useState(false),[e,setE]=useState(''),[keep,setKeep]=useState(true),lim=useLoginGuard(i);
  useEffect(()=>{if(err?.k)lim.fail()},[err?.k]);
  const go=async ev=>{ev.preventDefault();if(lim.locked)return;if(!i.trim()||!p){setE('Isi email dan kata sandi.');return}setB(true);setE('');
    try{const id=i.includes('@')?i.trim():nimEmail(i);await setPersistence(auth,keep?browserLocalPersistence:browserSessionPersistence).catch(()=>{});resetSessionClock('admin');await signInWithEmailAndPassword(auth,id,p);lim.ok()}catch(x){lim.fail(x?.code==='auth/too-many-requests'?300:0);setE('Email atau kata sandi salah.')}setB(false)};
  const msg=e||err?.m;
  return <AuthLayout variant="admin" title="Masuk administrator" sub="Gunakan akun pengelola yang terdaftar.">
    <form onSubmit={go} noValidate>
      {msg&&<div className="lockmsg" role="alert"><Icon name="alert" size={18}/><span>{msg}</span></div>}
      <LockNotice g={lim}/>
      <Field id="ad-email" label="Email" req><input id="ad-email" className="in" type="text" inputMode="email" autoComplete="username" autoCapitalize="none" value={i} onChange={x=>setI(x.target.value)}/></Field>
      <Field id="ad-pw" label="Kata sandi" req><Pass id="ad-pw" value={p} onChange={setP} auto="current-password"/></Field>
      <div className="keep"><Checkbox checked={keep} onChange={setKeep} label="Tetap masuk di perangkat ini"/></div>
      <button type="submit" className="btn block" disabled={b||lim.locked}>{b?'Memproses…':'Masuk'}</button></form></AuthLayout>}

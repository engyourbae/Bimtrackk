// Mode offline per perangkat (opt-in) dan jalur Keluar untuk aplikasi user.
// Catatan jujur: data cache Firestore di IndexedDB TIDAK terenkripsi. Jangan aktifkan di perangkat bersama.
import {setPersistence,browserLocalPersistence,signOut} from 'firebase/auth';
import {terminate,clearIndexedDbPersistence,waitForPendingWrites} from 'firebase/firestore';
import {auth,db} from './firebase';
const K='bimtrack-offline',F='bimtrack-clearfail';
const store=(s,k,v)=>{try{if(v===undefined)return s.getItem(k);v===null?s.removeItem(k):s.setItem(k,v)}catch{return null}};
export const offlineOn=()=>store(localStorage,K)==='1';
/** Aktifkan/matikan mode offline. Saat aktif: sesi dipaksa tersimpan permanen dan penyimpanan diminta bersifat persisten. */
export async function setOffline(on){
  if(!on){store(localStorage,K,null);return{}}
  await setPersistence(auth,browserLocalPersistence);
  let persisted=null;try{persisted=(await navigator.storage?.persist?.())??null}catch{}
  store(localStorage,K,'1');return{persisted}}
/** true bila masih ada perubahan yang belum dikonfirmasi server (menunggu maksimal 1,2 detik). */
export const hasPending=()=>Promise.race([waitForPendingWrites(db).then(()=>false,()=>false),new Promise(r=>setTimeout(()=>r(true),1200))]);
/** Keluar. clearData: hapus cache data lokal (IndexedDB Firestore) lalu muat ulang halaman. */
export async function logoutUser({clearData}={}){
  await signOut(auth);
  if(!clearData)return;
  store(localStorage,K,null);
  try{await terminate(db);await clearIndexedDbPersistence(db)}catch{store(sessionStorage,F,'1')}
  location.reload()}
export const consumeClearFail=()=>{const v=store(sessionStorage,F);if(v)store(sessionStorage,F,null);return !!v};
export const LO={cache:true,pending:hasPending};

import {collection,doc,onSnapshot,query,where} from 'firebase/firestore';
import {db} from './firebase';
import {useLive} from '@shared/data-state';
const OPT={includeMetadataChanges:true};
/** Langganan beberapa koleksi milik pengguna (ownerUid == uid).
 *  Hasil: {d:{koleksi:[...]},status,error,retry}. d[koleksi] hanya ada setelah datang.
 *  status: 'loading'|'ready'|'error'|'timeout'|'offline' (lihat shared/data-state.jsx); pakai <DataState/> untuk menampilkannya. */
export function useCols(cols,uid){
  return useLive(cols,c=>(ok,er)=>onSnapshot(query(collection(db,c),where('ownerUid','==',uid)),OPT,s=>ok(s.docs.map(z=>z.data()),{fromCache:s.metadata.fromCache}),er),uid)}
/** Langganan dokumen berdasarkan jalur: hasil berupa [data] atau [] bila belum ada. */
export function useDocPaths(specs,depKey){
  return useLive(specs.map(x=>x.key),k=>{const x=specs.find(z=>z.key===k);return(ok,er)=>onSnapshot(doc(db,...x.path),OPT,s=>ok(s.exists()?[s.data()]:[],{fromCache:s.metadata.fromCache}),er)},depKey,{enabled:specs.length>0})}

import {collection,doc,onSnapshot,query,where} from 'firebase/firestore';
import {db} from './firebase';
import {useLive} from '@shared/data-state';
import {shareSub,peekShared,resetShared} from '@shared/live-store';
const OPT={includeMetadataChanges:true};
const ms=t=>t&&t.toMillis?t.toMillis():0;
const colKey=(c,uid)=>'c|'+c+'|'+uid;
// meta per snapshot: fromCache, pending (ada tulisan lokal yang belum dikonfirmasi server), conf = {id: updatedAt(ms)} hanya dari
// snapshot yang DIKONFIRMASI SERVER dan dokumen tanpa tulisan tertunda (dasar peringatan konflik di Crud).
const colStart=(c,uid)=>(ok,er)=>onSnapshot(query(collection(db,c),where('ownerUid','==',uid)),OPT,s=>{
  const conf={};if(!s.metadata.fromCache)s.docs.forEach(z=>{if(!z.metadata.hasPendingWrites)conf[z.id]=ms(z.data().updatedAt)});
  ok(s.docs.map(z=>z.data()),{fromCache:s.metadata.fromCache,pending:s.metadata.hasPendingWrites,conf})},er);
/** Langganan beberapa koleksi milik pengguna (ownerUid == uid), memakai listener bersama tingkat aplikasi (lihat shared/live-store.js):
 *  pindah halaman tidak memasang ulang listener, dan data yang sudah ada langsung tampil tanpa skeleton.
 *  Hasil: {d:{koleksi:[...]},status,error,retry}. status: 'loading'|'ready'|'error'|'timeout'|'offline'; pakai <DataState/> untuk menampilkannya. */
export function useCols(cols,uid){
  return useLive(cols,c=>(ok,er)=>shareSub(colKey(c,uid),colStart(c,uid),{ok,er}),uid,{enabled:cols.length>0,peek:c=>peekShared(colKey(c,uid))})}
/** Langganan dokumen berdasarkan jalur: hasil berupa [data] atau [] bila belum ada. */
export function useDocPaths(specs,depKey){
  const K=x=>'d|'+x.path.join('/');
  return useLive(specs.map(x=>x.key),k=>{const x=specs.find(z=>z.key===k);return(ok,er)=>shareSub(K(x),(o,e)=>onSnapshot(doc(db,...x.path),OPT,s=>o(s.exists()?[s.data()]:[],{fromCache:s.metadata.fromCache,pending:s.metadata.hasPendingWrites}),e),{ok,er})},depKey,
    {enabled:specs.length>0,peek:k=>{const x=specs.find(z=>z.key===k);return x&&peekShared(K(x))}})}
/** updatedAt (ms) dokumen menurut snapshot yang dikonfirmasi server; undefined bila belum/tidak bisa dipastikan (offline, atau ada tulisan tertunda). */
export const confirmedAt=(col,uid,id)=>peekShared(colKey(col,uid))?.meta?.conf?.[id];
/** Lepas semua listener bersama (saat keluar). */
export const resetData=resetShared;
// Panduan Alur (ditulis admin, dibaca semua mahasiswa): bukan data milik pengguna, jadi tanpa ownerUid. Hanya yang terbit/tampil yang diminta;
// aturan Firestore juga hanya mengizinkan pembacaan yang terbit. Listener bersama seperti koleksi lain (pindah halaman tidak memasang ulang).
const PUB={panduanKategori:()=>query(collection(db,'panduanKategori'),where('terbit','==',true)),panduanLangkah:()=>query(collection(db,'panduanLangkah'),where('tampil','==',true))};
export function usePanduan(uid){
  return useLive(['panduanKategori','panduanLangkah'],c=>(ok,er)=>shareSub('p|'+c,(o,e)=>onSnapshot(PUB[c](),OPT,s=>o(s.docs.map(z=>z.data()),{fromCache:s.metadata.fromCache,pending:false}),e),{ok,er}),uid,{peek:c=>peekShared('p|'+c)})}

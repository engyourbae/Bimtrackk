import {useEffect,useState} from 'react';
import {collection,onSnapshot,query,where} from 'firebase/firestore';
import {db} from './firebase';
/** Langganan beberapa koleksi milik pengguna. Hasil: {koleksi: [...]} ; kunci belum ada = belum selesai dimuat. */
export function useCols(cols,uid){
  const[d,setD]=useState({}),key=cols.join();
  useEffect(()=>{setD({});const offs=cols.map(c=>onSnapshot(query(collection(db,c),where('ownerUid','==',uid)),s=>setD(x=>({...x,[c]:s.docs.map(z=>z.data())})),()=>setD(x=>({...x,[c]:[]}))));return()=>offs.forEach(f=>f())},[key,uid]);// eslint-disable-line
  return d}

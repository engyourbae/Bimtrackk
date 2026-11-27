// Jumlah data per koleksi untuk dashboard. getCountFromServer berbayar per pemanggilan (1 baca per 1000 entri indeks),
// jadi hasilnya disimpan di sessionStorage 10 menit: membuka dashboard berulang tidak menghitung ulang. Tombol "Hitung ulang" memaksa.
import {useEffect,useState} from 'react';
import {collection,getCountFromServer} from 'firebase/firestore';
import {db} from './firebase';
const K='bimtrack-admin-counts',TTL=600000,COLS=['bimbingan','revisi','jadwal','rundown','dokumen'];
const read=()=>{try{const v=JSON.parse(sessionStorage.getItem(K));return v&&v.v?v:null}catch{return null}};
const write=o=>{try{sessionStorage.setItem(K,JSON.stringify(o))}catch{}};
export function useCounts(uid){
  const[st,setSt]=useState(()=>{const c=read();return c?{status:'ready',...c}:{status:'loading'}}),[tick,setTick]=useState(0);
  useEffect(()=>{if(!uid)return;const c=read();if(c&&Date.now()-c.t<TTL&&!tick)return;let on=true;
    setSt(s=>s.v?{...s,busy:true,failed:false}:{status:'loading'});
    Promise.allSettled(COLS.map(c=>getCountFromServer(collection(db,c)).then(r=>[c,r.data().count]))).then(rs=>{if(!on)return;
      const v={};let bad=0;rs.forEach(r=>r.status==='fulfilled'?v[r.value[0]]=r.value[1]:bad++);
      if(!Object.keys(v).length)setSt(s=>s.v?{...s,busy:false,failed:true}:{status:navigator.onLine===false?'offline':'error'});
      else{const o={t:Date.now(),v,bad};write(o);setSt({status:'ready',...o})}});
    return()=>{on=false}},[uid,tick]);
  return{...st,refresh:()=>setTick(t=>t+1)}}

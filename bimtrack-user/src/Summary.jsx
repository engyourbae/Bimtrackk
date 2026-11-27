import {useEffect,useState} from 'react';
import {collection,doc,onSnapshot,query,where,setDoc,deleteDoc,serverTimestamp} from 'firebase/firestore';
import {db} from './firebase';
import {BAB,ST} from './config';
import {Select,Btn,ConfirmDialog,Skeleton,EmptyState,useFlash,toast} from './shared/ui';
const SC=['Bimbingan terakhir',...BAB.slice(0,5).map(b=>'Seluruh bimbingan '+b)];
const esc=t=>t.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
export default function Summary({uid,embedded}){
  const[b,setB]=useState([]),[r,setR]=useState([]),[s,setS]=useState([]),[scope,setScope]=useState(SC[0]),[txt,setTxt]=useState(''),[cur,setCur]=useState(null),[ld,setLd]=useState(false),[del,setDel]=useState(null),[copied,flash]=useFlash();
  useEffect(()=>{const q=c=>query(collection(db,c),where('ownerUid','==',uid)),m=x=>x.docs.map(d=>d.data());
    const a=onSnapshot(q('bimbingan'),x=>setB(m(x))),c=onSnapshot(q('revisi'),x=>setR(m(x))),d=onSnapshot(q('ringkasan'),x=>{setS(m(x));setLd(true)},()=>setLd(true));return()=>{a();c();d()}},[uid]);
  const gen=()=>{const bab=scope.replace('Seluruh bimbingan ',''),bs=[...b].sort((x,y)=>(x.tanggal||'')<(y.tanggal||'')?-1:1),isLast=scope===SC[0];
    const inS=isLast?bs.slice(-1):bs.filter(x=>x.bab===bab),rv=isLast?r:r.filter(x=>x.bab===bab);setCur(null);
    if(!inS.length)return setTxt('Belum tersedia catatan bimbingan yang cukup untuk ringkasan ini.');
    const L=(t,a)=>t+'\n'+(a.length?a.map(x=>'- '+x).join('\n'):'- (belum ada catatan)')+'\n\n',d=x=>`${x.tanggal} (${x.dosen}): `,last=inS[inS.length-1];
    setTxt(`RINGKASAN BIMBINGAN - ${scope}\n\n`+L('A. Kesimpulan bimbingan',inS.filter(x=>x.kesimpulan).map(x=>d(x)+x.kesimpulan))+L('B. Arahan dosen (periksa tindak lanjutnya)',inS.filter(x=>x.arahan).map(x=>d(x)+x.arahan))+L('C. Revisi selesai',rv.filter(x=>x.status===ST[4]).map(x=>x.catatan))+L('D. Revisi tertunda',rv.filter(x=>x.status!==ST[4]).map(x=>`[${x.status}] ${x.catatan}`))+L('E. Catatan dan keputusan penting',inS.filter(x=>x.catatan).map(x=>d(x)+x.catatan))+L('F. Pertanyaan untuk pertemuan berikutnya',inS.filter(x=>x.pertanyaan).map(x=>d(x)+x.pertanyaan))+L('G. Target berikutnya',last.targetNext?[last.targetNext]:[]))};
  const save=()=>{if(!txt.trim())return;const id=cur||doc(collection(db,'ringkasan')).id,base={scope,teks:txt,updatedAt:serverTimestamp()};
    (cur?setDoc(doc(db,'ringkasan',id),base,{merge:true}):setDoc(doc(db,'ringkasan',id),{...base,id,ownerUid:uid,createdAt:serverTimestamp()})).catch(e=>toast(e.message,'err'));setCur(id);toast('Ringkasan disimpan')};
  const print=()=>{const w=window.open('');if(!w)return toast('Pop-up diblokir','err');w.document.write('<pre style="font:14px system-ui;white-space:pre-wrap">'+esc(txt)+'</pre>');w.document.close();w.print()};
  return <div>{!embedded&&<h1>Ringkasan Bimbingan</h1>}<div className="fld"><Select value={scope} options={SC} onChange={setScope}/></div>
    <button className="btn" style={{width:'100%',marginBottom:12}} onClick={gen}>Buat ringkasan</button>
    {txt&&<><textarea className="in" style={{minHeight:320,fontFamily:'inherit'}} value={txt} onChange={e=>setTxt(e.target.value)}/>
      <div className="row" style={{marginTop:8}}><button className="btn sp" onClick={save}>Simpan</button><Btn className="btn sec sp" done={copied} onClick={()=>{navigator.clipboard?.writeText(txt).then(()=>{flash();toast('Ringkasan disalin')},()=>toast('Tidak bisa menyalin. Pilih teks lalu salin manual.','err'))}}>{copied?'Tersalin':'Salin'}</Btn><button className="btn sec sp" onClick={print}>Cetak / PDF</button></div></>}
    <h2 style={{marginTop:18}}>Tersimpan</h2>{!ld&&<Skeleton h={56} r={14}/>}{ld&&!s.length&&<EmptyState compact title="Belum ada ringkasan tersimpan" text="Buat ringkasan lalu tekan Simpan agar bisa dibuka lagi di sini."/>}
    {[...s].sort((x,y)=>(y.createdAt?.seconds||0)-(x.createdAt?.seconds||0)).map(x=><div className="card clk" key={x.id} onClick={()=>{setTxt(x.teks);setScope(x.scope);setCur(x.id);scrollTo(0,0)}}><div className="row"><b className="sp">{x.scope}</b><button className="ib" aria-label="Hapus" onClick={e=>{e.stopPropagation();setDel(x)}}>×</button></div></div>)}<ConfirmDialog open={!!del} title="Hapus ringkasan?" text={<>Ringkasan “{del?.scope}” akan dihapus permanen dan tidak bisa dikembalikan.</>} onCancel={()=>setDel(null)} onConfirm={()=>{const x=del;setDel(null);deleteDoc(doc(db,'ringkasan',x.id)).catch(er=>toast(er.message,'err'));toast('Ringkasan dihapus');if(cur===x.id)setCur(null)}}/></div>}

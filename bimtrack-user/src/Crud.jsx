import {useEffect,useMemo,useState} from 'react';
import {collection,doc,onSnapshot,query,where,setDoc,updateDoc,deleteDoc,serverTimestamp} from 'firebase/firestore';
import {db} from './firebase';
import {Modal,Select,Badge,Ic,P,toast} from './shared/ui';
export default function Crud({col,uid,title,fields,titleKey,subKeys,filter,sortKey='tanggal',urlKey,badge,header}){
  const[rows,setRows]=useState(null),[q,setQ]=useState(''),[f,setF]=useState(''),[desc,setDesc]=useState(true),[form,setForm]=useState(null),[del,setDel]=useState(null),[det,setDet]=useState(null);
  useEffect(()=>onSnapshot(query(collection(db,col),where('ownerUid','==',uid)),s=>setRows(s.docs.map(d=>d.data())),e=>toast(e.message,'err')),[col,uid]);
  const list=useMemo(()=>{if(!rows)return[];const r=rows.filter(x=>(!f||x[filter.key]===f)&&(!q||JSON.stringify(Object.values(x)).toLowerCase().includes(q.toLowerCase())));r.sort((a,b)=>((a[sortKey]||'')<(b[sortKey]||'')?-1:1)*(desc?-1:1));return r},[rows,q,f,desc]);
  const save=()=>{for(const x of fields){const v=(form[x.k]||'').trim();if(x.req&&!v)return toast(x.label+' wajib diisi','err');if(x.drive&&v&&!/^https:\/\/(drive|docs)\.google\.com\//.test(v))return toast(x.label+' harus link Google Drive/Docs (https://drive.google.com/...)','err')}
    const id=form.id||doc(collection(db,col)).id,data={};fields.forEach(x=>data[x.k]=form[x.k]||'');
    const p=form.id?updateDoc(doc(db,col,id),{...data,updatedAt:serverTimestamp()}):setDoc(doc(db,col,id),{...data,id,ownerUid:uid,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
    p.catch(e=>toast(e.message,'err'));setForm(null);toast('Tersimpan (sinkron otomatis saat online)')};
  const remove=()=>{deleteDoc(doc(db,col,del.id)).catch(e=>toast(e.message,'err'));setDel(null);setDet(null);toast('Dihapus')};
  return <div>
    <div className="row"><h1 className="sp">{title}</h1><button className="btn" onClick={()=>setForm({})}><Ic d={P.plus} s={16}/> Tambah</button></div>
    {header&&header(rows||[])}<div className="row" style={{marginBottom:12}}>
      <input className="in" style={{flex:2,minWidth:140}} placeholder="Cari..." value={q} onChange={e=>setQ(e.target.value)}/>
      <div style={{flex:1,minWidth:120}}><Select value={f} placeholder={'Semua '+filter.label} options={['Semua',...filter.options]} onChange={v=>setF(v==='Semua'?'':v)}/></div>
      <button className="btn sec" onClick={()=>setDesc(!desc)}>{desc?'Terbaru':'Terlama'}</button></div>
    {rows===null?<div className="empty">Memuat...</div>:!list.length?<div className="empty">Belum ada data.</div>:list.map(x=>
      <div key={x.id} className="card clk" onClick={()=>setDet(x)}><div className="row"><b className="sp">{x[titleKey]||'-'}</b>{x[filter.key]&&<Badge>{x[filter.key]}</Badge>}{badge&&badge(x)&&<span className="badge no">{badge(x)}</span>}</div>
      <div className="mut" style={{fontSize:'.85rem',marginTop:4}}>{subKeys.map(k=>x[k]).filter(Boolean).join(' · ')}</div></div>)}
    <Modal open={!!det} title={'Detail '+title} onClose={()=>setDet(null)}>{det&&<>{fields.map(x=>det[x.k]?<div className="fld" key={x.k}><label>{x.label}</label><div style={{whiteSpace:'pre-wrap'}}>{det[x.k]}</div></div>:null)}
      {urlKey&&det[urlKey]&&<div className="row" style={{marginBottom:10}}><a className="btn sec sp" style={{textAlign:'center',lineHeight:'44px',textDecoration:'none'}} href={det[urlKey]} target="_blank" rel="noopener noreferrer">Buka di Drive</a><button className="btn sec sp" onClick={()=>{navigator.clipboard?.writeText(det[urlKey]);toast('Link disalin')}}>Salin link</button></div>}<div className="row"><button className="btn sec sp" onClick={()=>{setForm(det);setDet(null)}}>Edit</button><button className="btn dan sp" onClick={()=>setDel(det)}>Hapus</button></div></>}</Modal>
    <Modal open={!!form} title={form?.id?'Edit':'Tambah'} onClose={()=>setForm(null)}>{form&&<>{fields.map(x=><div className="fld" key={x.k}><label>{x.label}{x.req&&' *'}</label>
      {x.type==='select'?<Select value={form[x.k]} options={x.options} onChange={v=>setForm({...form,[x.k]:v})}/>:x.type==='textarea'?<textarea className="in" value={form[x.k]||''} onChange={e=>setForm({...form,[x.k]:e.target.value})}/>:<input className="in" type={x.type||'text'} value={form[x.k]||''} onChange={e=>setForm({...form,[x.k]:e.target.value})}/>}</div>)}
      <button className="btn" style={{width:'100%'}} onClick={save}>Simpan</button></>}</Modal>
    <Modal open={!!del} title="Hapus data?" onClose={()=>setDel(null)}><p>Data ini akan dihapus permanen.</p><div className="row"><button className="btn sec sp" onClick={()=>setDel(null)}>Batal</button><button className="btn dan sp" onClick={remove}>Hapus</button></div></Modal>
  </div>}

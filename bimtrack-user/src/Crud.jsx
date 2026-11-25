import {useEffect,useMemo,useState} from 'react';
import {collection,doc,onSnapshot,query,where,setDoc,updateDoc,deleteDoc,serverTimestamp} from 'firebase/firestore';
import {db} from './firebase';
import {Modal,Select,DatePicker,TimePicker,Badge,Icon,PageHead,EmptyState,SkeletonList,Pagination,usePager,Menu,ContextMenu,toast} from './shared/ui';
import {fmtDate} from '@shared/date';
const show=(fields,k,v)=>fields.find(f=>f.k===k)?.type==='date'?fmtDate(v):v;
export default function Crud({col,uid,title,fields,titleKey,subKeys,filter,sortKey='tanggal',urlKey,badge,header,autoNew,onAutoNew}){
  const[rows,setRows]=useState(null),[q,setQ]=useState(''),[f,setF]=useState(''),[desc,setDesc]=useState(true),[form,setForm]=useState(null),[del,setDel]=useState(null),[det,setDet]=useState(null);
  useEffect(()=>onSnapshot(query(collection(db,col),where('ownerUid','==',uid)),s=>setRows(s.docs.map(d=>d.data())),e=>toast(e.message,'err')),[col,uid]);
  useEffect(()=>{if(autoNew){setForm({});onAutoNew?.()}},[autoNew]);
  const list=useMemo(()=>{if(!rows)return[];const r=rows.filter(x=>(!f||x[filter.key]===f)&&(!q||JSON.stringify(Object.values(x)).toLowerCase().includes(q.toLowerCase())));r.sort((a,b)=>((a[sortKey]||'')<(b[sortKey]||'')?-1:1)*(desc?-1:1));return r},[rows,q,f,desc]);
  const pg=usePager(list,20),set=k=>v=>setForm(s=>({...s,[k]:v}));
  const save=()=>{for(const x of fields){const v=(form[x.k]||'').trim();if(x.req&&!v)return toast(x.label+' wajib diisi','err');if(x.drive&&v&&!/^https:\/\/(drive|docs)\.google\.com\//.test(v))return toast(x.label+' harus link Google Drive/Docs (https://drive.google.com/...)','err')}
    const id=form.id||doc(collection(db,col)).id,data={};fields.forEach(x=>data[x.k]=form[x.k]||'');
    const p=form.id?updateDoc(doc(db,col,id),{...data,updatedAt:serverTimestamp()}):setDoc(doc(db,col,id),{...data,id,ownerUid:uid,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
    p.catch(e=>toast(e.message,'err'));setForm(null);toast('Tersimpan (sinkron otomatis saat online)')};
  const remove=()=>{deleteDoc(doc(db,col,del.id)).catch(e=>toast(e.message,'err'));setDel(null);setDet(null);toast('Dihapus')};
  const acts=x=>[{label:'Lihat detail',icon:'eye',onClick:()=>setDet(x)},{label:'Edit',icon:'pencil',onClick:()=>setForm(x)},{sep:true},{label:'Hapus',icon:'trash',danger:true,onClick:()=>setDel(x)}];
  const filtered=!!(q||f);
  return <div>
    <PageHead title={title} actions={<button type="button" className="btn" onClick={()=>setForm({})}><Icon name="plus" size={18}/> Tambah</button>}/>
    {header&&header(rows||[])}
    <div className="toolbar">
      <div className="search"><Icon name="cari"/><input className="in" placeholder="Cari..." aria-label={'Cari '+title.toLowerCase()} value={q} onChange={e=>setQ(e.target.value)}/></div>
      <div className="tb-sel"><Select label={filter.label} value={f} placeholder={'Semua '+filter.label.toLowerCase()} options={['Semua',...filter.options]} onChange={v=>setF(v==='Semua'?'':v)}/></div>
      <button type="button" className="btn sec" onClick={()=>setDesc(!desc)} aria-label="Ubah urutan"><Icon name="sort" size={18}/> {desc?'Terbaru':'Terlama'}</button></div>
    {rows===null?<SkeletonList n={3}/>:!list.length?<EmptyState title={filtered?'Tidak ada hasil':'Belum ada '+title.toLowerCase()} text={filtered?'Coba ubah kata kunci atau filter.':'Data yang kamu tambahkan akan muncul di sini.'} action={!filtered&&<button type="button" className="btn" onClick={()=>setForm({})}><Icon name="plus" size={18}/> Tambah {title.toLowerCase()}</button>}/>:<>
      {pg.slice.map(x=><ContextMenu key={x.id} items={acts(x)}><div className="card clk" onClick={()=>setDet(x)}><div className="row"><b className="sp">{x[titleKey]||'-'}</b>{x[filter.key]&&<Badge>{x[filter.key]}</Badge>}{badge&&badge(x)&&<Badge tone="danger">{badge(x)}</Badge>}<Menu items={acts(x)} label={'Tindakan untuk '+(x[titleKey]||'data')}/></div>
        <div className="mut" style={{fontSize:'var(--fs-sm)'}}>{subKeys.map(k=>show(fields,k,x[k])).filter(Boolean).join(' · ')}</div></div></ContextMenu>)}
      <Pagination page={pg.page} pages={pg.pages} onPage={pg.setPage} total={pg.total}/></>}
    <Modal open={!!det} title={'Detail '+title} onClose={()=>setDet(null)} footer={det&&<div className="row"><button type="button" className="btn sec sp" onClick={()=>{setForm(det);setDet(null)}}><Icon name="pencil" size={18}/> Edit</button><button type="button" className="btn dan sp" onClick={()=>setDel(det)}><Icon name="trash" size={18}/> Hapus</button></div>}>
      {det&&<>{fields.map(x=>det[x.k]?<div className="field" key={x.k}><label>{x.label}</label><div style={{whiteSpace:'pre-wrap'}}>{show(fields,x.k,det[x.k])}</div></div>:null)}
      {urlKey&&det[urlKey]&&<div className="row"><a className="btn sec sp" href={det[urlKey]} target="_blank" rel="noopener noreferrer"><Icon name="external" size={18}/> Buka di Drive</a><button type="button" className="btn sec sp" onClick={()=>{navigator.clipboard?.writeText(det[urlKey]);toast('Link disalin')}}><Icon name="copy" size={18}/> Salin link</button></div>}</>}</Modal>
    <Modal open={!!form} title={form?.id?'Edit '+title.toLowerCase():'Tambah '+title.toLowerCase()} onClose={()=>setForm(null)} size="lg" footer={<div className="row"><button type="button" className="btn sec sp" onClick={()=>setForm(null)}>Batal</button><button type="button" className="btn sp" onClick={save}>Simpan</button></div>}>
      {form&&fields.map(x=>{const id='f-'+x.k,v=form[x.k]||'';return <div className="field" key={x.k}><label htmlFor={id}>{x.label}{x.req&&<span className="req"> *</span>}</label>
        {x.type==='select'?<Select id={id} label={x.label} value={v} options={x.options} placeholder={'Pilih '+x.label.toLowerCase()} onChange={set(x.k)}/>
        :x.type==='date'?<DatePicker id={id} label={x.label} value={v} onChange={set(x.k)}/>
        :x.type==='time'?<TimePicker id={id} label={x.label} value={v} onChange={set(x.k)}/>
        :x.type==='textarea'?<textarea id={id} className="in" value={v} onChange={e=>set(x.k)(e.target.value)}/>
        :<input id={id} className="in" type={x.type==='url'?'url':'text'} inputMode={x.type==='url'?'url':undefined} value={v} onChange={e=>set(x.k)(e.target.value)}/>}</div>})}</Modal>
    <Modal open={!!del} title="Hapus data?" onClose={()=>setDel(null)}><p>Data ini akan dihapus permanen dan tidak bisa dikembalikan.</p><div className="row"><button type="button" className="btn sec sp" onClick={()=>setDel(null)}>Batal</button><button type="button" className="btn dan sp" onClick={remove}>Hapus</button></div></Modal>
  </div>}

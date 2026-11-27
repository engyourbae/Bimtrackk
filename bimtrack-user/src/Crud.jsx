import {useEffect,useMemo,useRef,useState} from 'react';
import {collection,doc,onSnapshot,query,where,setDoc,updateDoc,deleteDoc,serverTimestamp} from 'firebase/firestore';
import {db} from './firebase';
import {Modal,Select,StatusSelect,Segmented,DatePicker,TimePicker,Badge,Icon,PageHead,EmptyState,SkeletonList,Pagination,usePager,Menu,ContextMenu,Timeline,ConfirmDialog,toast} from './shared/ui';
import {fmtDate,todayStr,relDay,BULAN,BULAN_S} from '@shared/date';
import {navigate} from '@shared/router';
import {PAGE,REL_LABEL} from './config';
import {parseDrive,isDriveUrl} from './drive';

const show=(fields,k,v)=>fields.find(f=>f.k===k)?.type==='date'?fmtDate(v):v;
const ls=(k,v)=>{try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch{return null}};
/** Titip data awal untuk formulir "Tambah" di halaman lain (relasi antar data). */
export const setPrefill=(col,data)=>{try{sessionStorage.setItem('bimtrack-prefill:'+col,JSON.stringify(data))}catch{}};
const takePrefill=col=>{try{const k='bimtrack-prefill:'+col,v=sessionStorage.getItem(k);sessionStorage.removeItem(k);return v?JSON.parse(v):{}}catch{return{}}};

/** Titip filter awal untuk halaman daftar (mis. dari Perjalanan Skripsi: hanya Bab II). */
export const setFilter=(col,data)=>{try{sessionStorage.setItem('bimtrack-filter:'+col,JSON.stringify(data))}catch{}};
const takeFilter=col=>{try{const k='bimtrack-filter:'+col,v=sessionStorage.getItem(k);sessionStorage.removeItem(k);return v?JSON.parse(v):{}}catch{return{}}};
/** Umpan balik simpan yang jujur: Firestore menyimpan di perangkat dulu, lalu sinkron saat online. */
const savedMsg=()=>typeof navigator!=='undefined'&&navigator.onLine===false?'Tersimpan di perangkat. Akan disinkronkan saat online.':'Tersimpan';

function useCols(cols,uid){
  const[m,setM]=useState({}),key=cols.join();
  useEffect(()=>{const offs=cols.map(c=>onSnapshot(query(collection(db,c),where('ownerUid','==',uid)),s=>setM(p=>({...p,[c]:s.docs.map(d=>d.data())})),()=>{}));return()=>offs.forEach(f=>f())},[key,uid]);// eslint-disable-line
  return m}

function Preview({row,urlKey,onClose}){
  const info=row&&parseDrive(row[urlKey]);
  return <Modal open={!!row} title={row?'Pratinjau: '+(row.nama||row.catatan||'berkas'):''} onClose={onClose} size="lg"
    footer={row&&<div className="row"><a className="btn sec sp" href={row[urlKey]} target="_blank" rel="noopener noreferrer"><Icon name="external" size={18}/> Buka di Drive</a><button type="button" className="btn sp" onClick={onClose}>Tutup</button></div>}>
    {info?.preview?<><iframe className="prev-f" title="Pratinjau Google Drive" src={info.preview} sandbox="allow-scripts allow-same-origin allow-popups allow-forms" referrerPolicy="no-referrer" loading="lazy"/>
      <p className="mut" style={{fontSize:'var(--fs-sm)',marginTop:8}}>Pratinjau hanya tampil bila kamu sedang online dan akun Google di peramban ini punya akses ke berkas. Jika kosong atau meminta masuk, gunakan "Buka di Drive".</p></>
      :<EmptyState compact title="Pratinjau tidak tersedia" text="Bentuk link ini tidak bisa ditampilkan di sini. Buka langsung di Drive."/>}</Modal>}

function Thumb({url}){
  const t=parseDrive(url)?.thumb,[bad,setBad]=useState(false);
  return t&&!bad?<img className="gal-i" src={t} alt="" loading="lazy" referrerPolicy="no-referrer" onError={()=>setBad(true)}/>:<span className="gal-i ph"><Icon name="image" size={28}/></span>}

export default function Crud({col,uid,title,heading,listTitle,embedded,fields,titleKey,subKeys,filters=[],sortKey='tanggal',urlKey,badge,header,autoNew,onAutoNew,openId,onOpenId,
  statusKey,tones={},history,doneStatus,doneKey,defaults,relations=[],actions=[],archivable,views=['list'],groupKey,range,scope,scopeKey='',descDefault=true,timeKey,sortLabels=['Terbaru','Terlama']}){
  const[rows,setRows]=useState(null),[q,setQ]=useState(''),[fv,setFv]=useState(()=>takeFilter(col)),[rg,setRg]=useState({}),[desc,setDesc]=useState(descDefault),[showF,setShowF]=useState(false),
    [tab,setTab]=useState('aktif'),[view,setView]=useState(()=>{const v=ls('bimtrack-view-'+col);return views.includes(v)?v:views[0]}),
    [form,setForm]=useState(null),[errs,setErrs]=useState({}),[askClose,setAskClose]=useState(false),[del,setDel]=useState(null),[det,setDet]=useState(null),[prev,setPrev]=useState(null);
  const init=useRef(''),delRef=useRef(null);
  const relCols=useMemo(()=>[...new Set([...fields.filter(f=>f.type==='rel').map(f=>f.col),...relations.map(r=>r.col)])],[fields,relations]);
  const rel=useCols(relCols,uid);
  useEffect(()=>onSnapshot(query(collection(db,col),where('ownerUid','==',uid)),s=>setRows(s.docs.map(d=>d.data())),e=>toast(e.message,'err')),[col,uid]);
  const empty=()=>{const base={...(defaults?.()||{})};filters.forEach(f=>{if(fv[f.key]&&(f.options||f.from)&&fields.some(x=>x.k===f.key))base[f.key]=fv[f.key]});return{...base,...takePrefill(col)}};
  const openForm=v=>{const d=v||empty();init.current=JSON.stringify(d);setErrs({});setForm(d)};
  useEffect(()=>{if(autoNew){openForm();onAutoNew?.()}},[autoNew]);// eslint-disable-line
  useEffect(()=>{if(!openId||rows===null)return;const x=rows.find(r=>r.id===openId);if(x)setDet(x);else toast('Data tidak ditemukan','err');onOpenId?.()},[openId,rows]);// eslint-disable-line
  const optsOf=f=>f.options&&f.options!=='data'?f.options:[...new Set((rows||[]).map(r=>r[f.key]).filter(Boolean))].sort();
  const dateKey=range;
  const list=useMemo(()=>{if(!rows)return[];const ql=q.toLowerCase();
    const r=rows.filter(x=>(!scope||scope(x))&&(archivable?(tab==='arsip')===!!x.archived:true)&&filters.every(f=>!fv[f.key]||x[f.key]===fv[f.key])&&(!dateKey||((!rg.from||(x[dateKey]||'')>=rg.from)&&(!rg.to||(x[dateKey]||'')<=rg.to)))&&(!ql||fields.some(f=>String(x[f.k]||'').toLowerCase().includes(ql))));
    r.sort((a,b)=>{const x=a[sortKey]||'',y=b[sortKey]||'';if(!x!==!y)return x?-1:1;return(x<y?-1:x>y?1:0)*(desc?-1:1)});return r},[rows,q,fv,rg,desc,tab,scopeKey]);// eslint-disable-line
  useEffect(()=>{setDesc(descDefault)},[scopeKey]);// eslint-disable-line
  if(del)delRef.current=del;
  const pg=usePager(list,20),set=k=>v=>{setForm(s=>({...s,[k]:v}));setErrs(e=>({...e,[k]:undefined}))};
  useEffect(()=>{pg.setPage(1)},[q,fv,rg,desc,tab,view,scopeKey]);// eslint-disable-line
  const nf=Object.values(fv).filter(Boolean).length+(rg.from||rg.to?1:0),filtered=!!(q||nf);
  const relLabel=(c,id)=>{const r=(rel[c]||[]).find(x=>x.id===id);return r?REL_LABEL[c](r):null};
  const relOpts=f=>{const r=[...(rel[f.col]||[])].sort((a,b)=>((a.tanggal||'')<(b.tanggal||'')?1:-1)),o=[{value:'',label:'Tidak ada'},...r.map(x=>({value:x.id,label:REL_LABEL[f.col](x)}))];const cur=form?.[f.k];if(cur&&!r.some(x=>x.id===cur))o.push({value:cur,label:'(data tidak ditemukan)'});return o};
  const dupOf=url=>urlKey&&url?(rows||[]).find(r=>r.id!==form?.id&&(r[urlKey]||'').trim()===url.trim()):null;

  const histOf=(prevRow,status)=>{const h=[...(prevRow?.riwayat||[])];if(!h.length||h[h.length-1].s!==status)h.push({s:status,t:Date.now()});return h};
  const doneFix=(data,status)=>{if(!doneKey)return data;if(status===doneStatus&&!data[doneKey])data[doneKey]=todayStr();else if(status!==doneStatus&&data[doneKey]&&data._wasDone)data[doneKey]='';delete data._wasDone;return data};
  const validate=()=>{const e={};for(const x of fields){const v=(form[x.k]||'').trim();if(x.req&&!v)e[x.k]=x.label+' wajib diisi';else if(x.drive&&v&&!isDriveUrl(v))e[x.k]='Harus link Google Drive/Docs (https://drive.google.com/…)'}
    if(form.jamMulai&&form.jamSelesai&&form.jamSelesai<form.jamMulai)e.jamSelesai='Jam selesai tidak boleh lebih awal dari jam mulai';
    if(form.tanggalSelesai&&form.tanggal&&form.tanggalSelesai<form.tanggal)e.tanggalSelesai='Tanggal selesai tidak boleh sebelum tanggal diberikan';
    return e};
  const save=()=>{const e=validate();setErrs(e);const bad=Object.keys(e)[0];if(bad){document.getElementById('f-'+bad)?.focus();return}
    const prevRow=form.id?rows.find(r=>r.id===form.id):null,id=form.id||doc(collection(db,col)).id,data={};fields.forEach(x=>data[x.k]=(form[x.k]||'').trim());
    if(history&&statusKey){data._wasDone=prevRow?.[statusKey]===doneStatus;doneFix(data,data[statusKey]);if(data[statusKey])data.riwayat=histOf(prevRow,data[statusKey]);else if(prevRow?.riwayat)data.riwayat=prevRow.riwayat}
    const p=form.id?updateDoc(doc(db,col,id),{...data,updatedAt:serverTimestamp()}):setDoc(doc(db,col,id),{...data,id,ownerUid:uid,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
    p.catch(er=>toast(er.message,'err'));setForm(null);toast(savedMsg())};
  const closeForm=()=>{if(JSON.stringify(form)!==init.current)setAskClose(true);else setForm(null)};
  const remove=()=>{const x=del;deleteDoc(doc(db,col,x.id)).catch(e=>toast(e.message,'err'));setDel(null);setDet(null);toast('Dihapus: '+((x[titleKey]||'data').slice(0,40)))};
  const setStatus=(x,s)=>{const d={[statusKey]:s,updatedAt:serverTimestamp()};if(history)d.riwayat=histOf(x,s);if(doneKey){const dd={[doneKey]:x[doneKey]||'',_wasDone:x[statusKey]===doneStatus};doneFix(dd,s);d[doneKey]=dd[doneKey]}
    updateDoc(doc(db,col,x.id),d).catch(e=>toast(e.message,'err'));setDet(v=>v&&v.id===x.id?{...v,...d,updatedAt:undefined}:v);toast('Status diubah ke “'+s+'”')};
  const archive=x=>{const was=!!x.archived;updateDoc(doc(db,col,x.id),{archived:!was,updatedAt:serverTimestamp()}).catch(e=>toast(e.message,'err'));setDet(null);
    toast(was?'Dipulihkan dari arsip':'Dipindahkan ke arsip','ok',{label:'Urungkan',onClick:()=>updateDoc(doc(db,col,x.id),{archived:was,updatedAt:serverTimestamp()}).catch(e=>toast(e.message,'err'))})};
  const acts=x=>[{label:'Lihat detail',icon:'eye',onClick:()=>setDet(x)},{label:'Edit',icon:'pencil',onClick:()=>openForm(x)},...(urlKey&&parseDrive(x[urlKey])?.preview?[{label:'Pratinjau',icon:'image',onClick:()=>setPrev(x)}]:[]),
    ...(archivable?[{label:x.archived?'Pulihkan dari arsip':'Arsipkan',icon:'arsip',onClick:()=>archive(x)}]:[]),{sep:true},{label:'Hapus',icon:'trash',danger:true,onClick:()=>setDel(x)}];
  const pickView=v=>{setView(v);ls('bimtrack-view-'+col,v)};
  const VL={list:{value:'list',label:'Daftar',icon:'list'},gallery:{value:'gallery',label:'Galeri',icon:'image'},group:{value:'group',label:'Per kategori',icon:'grid'},board:{value:'board',label:'Papan',icon:'board'},timeline:{value:'timeline',label:'Linimasa',icon:'timeline'}};
  const badgeVal=x=>statusKey&&x[statusKey]?<Badge tone={tones[x[statusKey]]||'neutral'}>{x[statusKey]}</Badge>:(filters[0]&&x[filters[0].key]?<Badge>{x[filters[0].key]}</Badge>:null);
  const Card=x=><ContextMenu key={x.id} items={acts(x)}><div className="card clk" onClick={()=>setDet(x)}><div className="row"><b className="sp">{x[titleKey]||'-'}</b>{badgeVal(x)}{badge&&badge(x)&&<Badge tone="danger">{badge(x)}</Badge>}<Menu items={acts(x)} label={'Tindakan untuk '+(x[titleKey]||'data')}/></div>
    <div className="mut" style={{fontSize:'var(--fs-sm)'}}>{subKeys.map(k=>show(fields,k,x[k])).filter(Boolean).join(' · ')}</div></div></ContextMenu>;
  const GCard=x=><ContextMenu key={x.id} items={acts(x)}><div className="gal-c" onClick={()=>setDet(x)} role="button" tabIndex={0} onKeyDown={e=>(e.key==='Enter'||e.key===' ')&&(e.preventDefault(),setDet(x))}><Thumb url={x[urlKey]}/><div className="gal-t"><b>{x[titleKey]||'-'}</b><span className="mut">{subKeys.map(k=>show(fields,k,x[k])).filter(Boolean).join(' · ')}</span></div></div></ContextMenu>;
  const boardOpts=statusKey?fields.find(f=>f.k===statusKey)?.options||[]:[],tone0=o=>tones[o]==='neutral'?'':tones[o]||'';
  const BCard=x=>{const cur=x[statusKey]||boardOpts[0],mv=boardOpts.filter(o=>o!==cur).map(o=>({label:'Pindahkan ke “'+o+'”',icon:'chev-right',onClick:()=>setStatus(x,o)}));
    return <ContextMenu key={x.id} items={[...mv,{sep:true},...acts(x)]}><div className="card clk bc" onClick={()=>setDet(x)}><div className="row"><b className="sp">{x[titleKey]||'-'}</b>{badge&&badge(x)&&<Badge tone="danger">{badge(x)}</Badge>}<Menu items={[...mv,{sep:true},...acts(x)]} label={'Tindakan untuk '+(x[titleKey]||'data')}/></div>
      <div className="mut" style={{fontSize:'var(--fs-sm)'}}>{subKeys.map(k=>show(fields,k,x[k])).filter(Boolean).join(' · ')}</div></div></ContextMenu>};
  const body=()=>{
    if(view==='board')return <div className="board">{boardOpts.map(o=>{const items=list.filter(x=>(x[statusKey]||boardOpts[0])===o);
      return <section className="bcol" key={o} aria-label={o}><div className="bcol-h"><i className={'dot '+tone0(o)}/><h3>{o}</h3><Badge>{items.length}</Badge></div>{items.length?items.map(BCard):<p className="bcol-e">Tidak ada data di kolom ini.</p>}</section>})}</div>;
    if(view==='timeline'){const k=timeKey||sortKey,dated=list.filter(x=>x[k]).sort((a,b)=>a[k]<b[k]?-1:a[k]>b[k]?1:0),undated=list.filter(x=>!x[k]),g=[];
      dated.forEach(x=>{const m=x[k].slice(0,7),l=g[g.length-1];if(l&&l.m===m)l.items.push(x);else g.push({m,items:[x]})});
      const Row=x=>{const t=x[k];return <div className="tlv" key={x.id}><div className="tlv-d">{t?<><b>{+t.slice(8,10)}</b><span>{BULAN_S[+t.slice(5,7)-1]}</span><small>{relDay(t)}</small></>:<span>–</span>}</div>{Card(x)}</div>};
      return <>{g.map(z=><section key={z.m} className="grp"><div className="sec-h"><h2>{BULAN[+z.m.slice(5,7)-1]} {z.m.slice(0,4)}</h2><Badge>{z.items.length}</Badge></div>{z.items.map(Row)}</section>)}
        {undated.length>0&&<section className="grp"><div className="sec-h"><h2>Tanpa tanggal</h2><Badge>{undated.length}</Badge></div>{undated.map(Row)}</section>}</>}
    if(view==='gallery')return <div className="gal">{pg.slice.map(GCard)}</div>;
    if(view==='group'){const g={};pg.slice.forEach(x=>{(g[x[groupKey]||'Tanpa kategori']=g[x[groupKey]||'Tanpa kategori']||[]).push(x)});return Object.keys(g).sort().map(k=><section key={k} className="grp"><div className="sec-h"><h2>{k}</h2><Badge>{g[k].length}</Badge></div>{g[k].map(Card)}</section>)}
    return pg.slice.map(Card)};

  return <div>
    {embedded?<div className="sec-h"><h2>{listTitle||title}</h2><button type="button" className="btn" onClick={()=>openForm()}><Icon name="plus" size={18}/> Tambah</button></div>
      :<PageHead title={heading||title} actions={<button type="button" className="btn" onClick={()=>openForm()}><Icon name="plus" size={18}/> Tambah</button>}/>}
    {header&&header(rows||[])}
    {archivable&&<div style={{marginBottom:'var(--s3)'}}><Segmented label="Tampilkan" value={tab} onChange={setTab} options={[{value:'aktif',label:'Aktif'},{value:'arsip',label:'Arsip',icon:'arsip'}]}/></div>}
    <div className="toolbar">
      <div className="search"><Icon name="cari"/><input className="in" placeholder="Cari..." aria-label={'Cari '+title.toLowerCase()} value={q} onChange={e=>setQ(e.target.value)}/></div>
      {(filters.length>0||dateKey)&&<button type="button" className="btn sec" onClick={()=>setShowF(true)} aria-label="Buka filter"><Icon name="filter" size={18}/> Filter{nf>0&&<span className="cnt">{nf}</span>}</button>}
      <button type="button" className="btn sec" onClick={()=>setDesc(!desc)} aria-label="Ubah urutan"><Icon name="sort" size={18}/> {desc?sortLabels[0]:sortLabels[1]}</button>
      {views.length>1&&<Segmented label="Tampilan" value={view} onChange={pickView} options={views.map(v=>VL[v])}/>}</div>
    {nf>0&&<div className="fchips">{filters.filter(f=>fv[f.key]).map(f=><button type="button" className="fchip" key={f.key} onClick={()=>setFv(s=>({...s,[f.key]:''}))}>{f.label}: {fv[f.key]} <Icon name="x" size={14}/><span className="sr">Hapus filter</span></button>)}
      {(rg.from||rg.to)&&<button type="button" className="fchip" onClick={()=>setRg({})}>{rg.from?fmtDate(rg.from,'sedang'):'…'} – {rg.to?fmtDate(rg.to,'sedang'):'…'} <Icon name="x" size={14}/><span className="sr">Hapus filter tanggal</span></button>}
      <button type="button" className="btn ghost sm" onClick={()=>{setFv({});setRg({})}}>Reset semua</button></div>}
    {rows!==null&&filtered&&<p className="mut cnt-l">{list.length} data ditemukan</p>}
    {rows===null?<SkeletonList n={3}/>:!list.length?<EmptyState title={filtered?'Tidak ada hasil':tab==='arsip'?'Arsip kosong':'Belum ada '+title.toLowerCase()} text={filtered?'Coba ubah kata kunci atau filter.':tab==='arsip'?'Data yang diarsipkan akan muncul di sini.':'Data yang kamu tambahkan akan muncul di sini.'} action={filtered?<button type="button" className="btn sec" onClick={()=>{setQ('');setFv({});setRg({})}}>Hapus pencarian dan filter</button>:tab==='aktif'&&<button type="button" className="btn" onClick={()=>openForm()}><Icon name="plus" size={18}/> Tambah {title.toLowerCase()}</button>}/>:<>
      {body()}{view!=='board'&&view!=='timeline'&&<Pagination page={pg.page} pages={pg.pages} onPage={pg.setPage} total={pg.total}/>}</>}

    <Modal open={showF} title="Filter" onClose={()=>setShowF(false)} footer={<div className="row"><button type="button" className="btn sec sp" onClick={()=>{setFv({});setRg({})}}>Reset</button><button type="button" className="btn sp" onClick={()=>setShowF(false)}>Tampilkan {list.length} data</button></div>}>
      {filters.map(f=><div className="field" key={f.key}><label>{f.label}</label><Select label={f.label} value={fv[f.key]||''} placeholder={'Semua '+f.label.toLowerCase()} options={[{value:'',label:'Semua'},...optsOf(f).map(o=>({value:o,label:o}))]} onChange={v=>setFv(s=>({...s,[f.key]:v}))}/></div>)}
      {dateKey&&<><div className="field"><label>Dari tanggal</label><DatePicker label="Dari tanggal" value={rg.from||''} max={rg.to||undefined} onChange={v=>setRg(s=>({...s,from:v}))}/></div>
        <div className="field"><label>Sampai tanggal</label><DatePicker label="Sampai tanggal" value={rg.to||''} min={rg.from||undefined} onChange={v=>setRg(s=>({...s,to:v}))}/></div></>}</Modal>

    <Modal open={!!det} title={'Detail '+title} onClose={()=>setDet(null)} footer={det&&<div className="row"><button type="button" className="btn sec sp" onClick={()=>{openForm(det);setDet(null)}}><Icon name="pencil" size={18}/> Edit</button>{archivable&&<button type="button" className="btn sec sp" onClick={()=>archive(det)}><Icon name="arsip" size={18}/> {det.archived?'Pulihkan':'Arsipkan'}</button>}<button type="button" className="btn dan sp" onClick={()=>setDel(det)}><Icon name="trash" size={18}/> Hapus</button></div>}>
      {det&&<>
        {statusKey&&<div className="field"><label>Status</label><StatusSelect label="Ubah status" value={det[statusKey]||''} placeholder="Belum ada status" options={fields.find(f=>f.k===statusKey).options} tones={Object.fromEntries(Object.entries(tones).map(([k,v])=>[k,v==='neutral'?'':v]))} onChange={s=>setStatus(det,s)}/></div>}
        {fields.map(x=>{if(!det[x.k]||x.k===statusKey)return null;
          if(x.type==='rel'){const l=relLabel(x.col,det[x.k]);return <div className="field" key={x.k}><label>{x.label.replace(' (opsional)','')}</label>{l?<button type="button" className="lnk" onClick={()=>navigate(PAGE[x.col],det[x.k])}>{l} <Icon name="chev-left" size={14} style={{transform:'rotate(180deg)'}}/></button>:<span className="mut">Data terkait sudah tidak ada</span>}</div>}
          return <div className="field" key={x.k}><label>{x.label}</label><div style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{show(fields,x.k,det[x.k])}</div></div>})}
        {urlKey&&det[urlKey]&&<div className="row" style={{flexWrap:'wrap'}}><a className="btn sec sp" href={det[urlKey]} target="_blank" rel="noopener noreferrer"><Icon name="external" size={18}/> Buka di Drive</a>{parseDrive(det[urlKey])?.preview&&<button type="button" className="btn sec sp" onClick={()=>setPrev(det)}><Icon name="eye" size={18}/> Pratinjau</button>}<button type="button" className="btn sec sp" onClick={()=>{navigator.clipboard?.writeText(det[urlKey]);toast('Link disalin')}}><Icon name="copy" size={18}/> Salin link</button></div>}
        {relations.map(r=>{const items=(rel[r.col]||[]).filter(x=>x[r.via]===det.id);return <section className="relb" key={r.col}><div className="row"><h3 className="sp">{r.title} <Badge>{items.length}</Badge></h3>{r.add&&<button type="button" className="btn ghost sm" onClick={()=>{setPrefill(r.col,r.add(det));navigate(PAGE[r.col],'baru')}}><Icon name="plus" size={16}/> Tambah</button>}</div>
          {items.length?items.map(x=><button type="button" key={x.id} className="rel-i" onClick={()=>navigate(PAGE[r.col],x.id)}><b>{x[r.titleKey]||'-'}</b><span className="mut">{r.sub.map(k=>x[k]&&(/^\d{4}-\d\d-\d\d$/.test(x[k])?fmtDate(x[k],'sedang'):x[k])).filter(Boolean).join(' · ')}</span></button>):<p className="mut" style={{fontSize:'var(--fs-sm)'}}>{r.empty||'Belum ada.'}</p>}</section>})}
        {actions.filter(a=>!a.show||a.show(det)).map(a=><button type="button" key={a.label} className="btn sec block" style={{marginBottom:8}} onClick={()=>a.onClick(det)}><Icon name={a.icon} size={18}/> {a.label}</button>)}
        {history&&det.riwayat?.length>0&&<section className="relb"><h3>Riwayat status</h3><Timeline items={[...det.riwayat].reverse().map((h,i)=>({key:i,title:h.s,meta:new Date(h.t).toLocaleString('id-ID',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}),tone:tones[h.s]==='neutral'?'':tones[h.s]}))}/></section>}
      </>}</Modal>

    <Modal open={!!form} title={form?.id?'Edit '+title.toLowerCase():'Tambah '+title.toLowerCase()} onClose={closeForm} size="lg" footer={<div className="row"><button type="button" className="btn sec sp" onClick={closeForm}>Batal</button><button type="button" className="btn sp" onClick={save}>Simpan</button></div>}>
      {form&&fields.map(x=>{const id='f-'+x.k,v=form[x.k]||'',er=errs[x.k],dup=x.k===urlKey?dupOf(v):null;return <div className="field" key={x.k}><label htmlFor={id}>{x.label}{x.req&&<span className="req"> *</span>}</label>
        {x.type==='rel'?<Select id={id} label={x.label} value={v} options={relOpts(x)} placeholder="Tidak ada" searchable onChange={set(x.k)}/>
        :x.type==='select'?<Select id={id} label={x.label} value={v} options={x.options} placeholder={'Pilih '+x.label.toLowerCase()} invalid={!!er} onChange={set(x.k)}/>
        :x.type==='date'?<DatePicker id={id} label={x.label} value={v} invalid={!!er} onChange={set(x.k)}/>
        :x.type==='time'?<TimePicker id={id} label={x.label} value={v} invalid={!!er} onChange={set(x.k)}/>
        :x.type==='textarea'?<textarea id={id} className="in" value={v} aria-invalid={!!er||undefined} onChange={e=>set(x.k)(e.target.value)}/>
        :<input id={id} className="in" type={x.type==='url'?'url':'text'} inputMode={x.type==='url'?'url':undefined} value={v} aria-invalid={!!er||undefined} onChange={e=>set(x.k)(e.target.value)}/>}
        {er&&<div className="err" role="alert">{er}</div>}
        {dup&&<div className="hint">Link yang sama sudah dipakai di "{dup[titleKey]}".</div>}</div>})}</Modal>
    <Modal open={askClose} title="Buang perubahan?" onClose={()=>setAskClose(false)}><p>Isian yang belum disimpan akan hilang.</p><div className="row"><button type="button" className="btn sec sp" onClick={()=>setAskClose(false)}>Lanjut mengisi</button><button type="button" className="btn dan sp" onClick={()=>{setAskClose(false);setForm(null)}}>Buang</button></div></Modal>
    <ConfirmDialog open={!!del} title="Hapus data?" confirmLabel="Hapus" onCancel={()=>setDel(null)} onConfirm={remove}
      text={<><b style={{overflowWrap:'anywhere'}}>{(delRef.current?.[titleKey]||'Data ini').slice(0,120)}</b> akan dihapus permanen dan tidak bisa dikembalikan.{archivable&&!delRef.current?.archived&&' Jika hanya ingin menyembunyikan, gunakan Arsipkan.'}</>}/>
    <Preview row={prev} urlKey={urlKey} onClose={()=>setPrev(null)}/>
  </div>}

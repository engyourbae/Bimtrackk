import {useEffect,useMemo,useRef,useState} from 'react';
import {collection,doc,setDoc,updateDoc,deleteDoc,writeBatch,serverTimestamp} from 'firebase/firestore';
import {useCols,confirmedAt} from './useData';
import {send} from './sync';
import {db} from './firebase';
import {Modal,Select,StatusSelect,Segmented,DatePicker,TimePicker,Badge,Icon,PageHead,EmptyState,Pagination,usePager,Menu,ContextMenu,Timeline,ConfirmDialog,DataState,toast} from './shared/ui';
import {fmtDate,todayStr,relDay,BULAN,BULAN_S} from '@shared/date';
import {navigate} from '@shared/router';
import {PAGE,REL_LABEL} from './config';
import {parseDrive,isDriveUrl} from './drive';
import {ListSkeleton} from './PageSkeleton';
import {sortDosen,roleLabel} from './dosen';

const show=(fields,k,v)=>fields.find(f=>f.k===k)?.type==='date'?fmtDate(v):v;
const ls=(k,v)=>{try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch{return null}};
/** Titip data awal untuk formulir "Tambah" di halaman lain (relasi antar data). */
export const setPrefill=(col,data)=>{try{sessionStorage.setItem('bimtrack-prefill:'+col,JSON.stringify(data))}catch{}};
const takePrefill=col=>{try{const k='bimtrack-prefill:'+col,v=sessionStorage.getItem(k);sessionStorage.removeItem(k);return v?JSON.parse(v):{}}catch{return{}}};

/** Titip filter awal untuk halaman daftar (mis. dari Perjalanan Skripsi: hanya Bab II). */
export const setFilter=(col,data)=>{try{sessionStorage.setItem('bimtrack-filter:'+col,JSON.stringify(data))}catch{}};
const takeFilter=col=>{try{const k='bimtrack-filter:'+col,v=sessionStorage.getItem(k);sessionStorage.removeItem(k);return v?JSON.parse(v):{}}catch{return{}}};
// Semua tulisan lewat send() (sync.js): umpan balik jujur (tersimpan / menunggu kirim / ditolak) dan galat tidak hilang diam-diam.

function Preview({row,urlKey,onClose}){
  const info=row&&parseDrive(row[urlKey]);
  return <Modal open={!!row} title={row?'Pratinjau: '+(row.nama||row.catatan||'berkas'):''} onClose={onClose} size="lg"
    footer={row&&<div className="row"><a className="btn sec sp" href={isDriveUrl(row[urlKey])?row[urlKey]:undefined} target="_blank" rel="noopener noreferrer"><Icon name="external" size={18}/> Buka di Drive</a><button type="button" className="btn sp" onClick={onClose}>Tutup</button></div>}>
    {info?.preview?<><iframe className="prev-f" title="Pratinjau Google Drive" src={info.preview} sandbox="allow-scripts allow-same-origin allow-popups allow-forms" referrerPolicy="no-referrer" loading="lazy"/>
      <p className="mut" style={{fontSize:'var(--fs-sm)',marginTop:8}}>Pratinjau hanya tampil bila kamu sedang online dan akun Google di peramban ini punya akses ke berkas. Jika kosong atau meminta masuk, gunakan "Buka di Drive".</p></>
      :<EmptyState compact title="Pratinjau tidak tersedia" text="Bentuk link ini tidak bisa ditampilkan di sini. Buka langsung di Drive."/>}</Modal>}

function Thumb({url}){
  const t=parseDrive(url)?.thumb,[bad,setBad]=useState(false);
  return t&&!bad?<img className="gal-i" src={t} alt="" loading="lazy" referrerPolicy="no-referrer" onError={()=>setBad(true)}/>:<span className="gal-i ph"><Icon name="image" size={28}/></span>}

/** Isian nama dengan dropdown kustom: tiap pilihan menampilkan peran (mis. Dosen pembimbing 1) dan namanya; tetap bisa diketik bebas. */
function ComboField({id,value,onChange,items,invalid}){
  const[open,setOpen]=useState(false),q=String(value||'').trim().toLowerCase(),exact=items.some(o=>o.nama.toLowerCase()===q),
    list=!q||exact?items:items.filter(o=>(o.nama+' '+o.label).toLowerCase().includes(q));
  const pick=o=>{onChange(o.nama);setOpen(false)};
  return <div style={{position:'relative'}} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))setOpen(false)}}>
    <input id={id} className="in" autoComplete="off" role="combobox" aria-expanded={open} aria-controls={id+'-l'} value={value} aria-invalid={invalid||undefined} style={items.length?{paddingRight:44}:undefined}
      onFocus={()=>setOpen(true)} onChange={e=>{onChange(e.target.value);setOpen(true)}} onKeyDown={e=>{if(e.key==='Escape')setOpen(false)}}/>
    {items.length>0&&<button type="button" tabIndex={-1} aria-label="Buka daftar" onMouseDown={e=>e.preventDefault()} onClick={()=>setOpen(o=>!o)} style={{position:'absolute',right:4,top:0,bottom:0,width:40,background:'none',border:0,color:'var(--tx2)',fontSize:'.8rem'}}>{open?'▲':'▼'}</button>}
    {open&&list.length>0&&<div id={id+'-l'} role="listbox" style={{position:'absolute',left:0,right:0,top:'calc(100% + 4px)',zIndex:30,maxHeight:240,overflowY:'auto',background:'var(--surface)',border:'1px solid var(--bd-strong)',borderRadius:'var(--r-md)',boxShadow:'0 8px 24px rgba(0,0,0,.18)'}}>
      {list.map(o=><button type="button" role="option" aria-selected={o.nama===value} key={o.nama} onMouseDown={e=>e.preventDefault()} onClick={()=>pick(o)}
        style={{display:'flex',flexDirection:'column',alignItems:'flex-start',gap:2,width:'100%',textAlign:'left',padding:'10px var(--s4)',border:0,borderBottom:'1px solid var(--bd)',background:o.nama===value?'var(--surface-2)':'transparent',color:'var(--tx)'}}>
        <small style={{color:'var(--tx2)',fontSize:'var(--fs-xs)'}}>{o.label}</small><span style={{fontWeight:600,overflowWrap:'anywhere'}}>{o.nama}</span></button>)}
    </div>}
  </div>}

export default function Crud({col,uid,title,heading,listTitle,embedded,fields,titleKey,subKeys,filters=[],sortKey='tanggal',urlKey,badge,header,autoNew,onAutoNew,openId,onOpenId,
  statusKey,tones={},titleOf,sortFn,extra,reorder,history,doneStatus,doneKey,defaults,relations=[],actions=[],archivable,views=['list'],groupKey,range,scope,scopeKey='',descDefault=true,timeKey,sortLabels=['Terbaru','Terlama']}){
  const[q,setQ]=useState(''),[fv,setFv]=useState(()=>takeFilter(col)),[rg,setRg]=useState({}),[desc,setDesc]=useState(descDefault),[showF,setShowF]=useState(false),
    [tab,setTab]=useState('aktif'),[view,setView]=useState(()=>{const v=ls('bimtrack-view-'+col);return views.includes(v)?v:views[0]}),
    [form,setForm]=useState(null),[errs,setErrs]=useState({}),[askClose,setAskClose]=useState(false),[del,setDel]=useState(null),[det,setDet]=useState(null),[prev,setPrev]=useState(null);
  const init=useRef(''),delRef=useRef(null),base=useRef(null);
  const relCols=useMemo(()=>[...new Set([...fields.filter(f=>f.type==='rel').map(f=>f.col),...relations.map(r=>r.col)])],[fields,relations]);
  // satu langganan untuk daftar utama + data relasi; status memuat/galat/offline ditangani DataState (tidak ada lagi skeleton tanpa ujung)
  const live=useCols([col,...relCols.filter(c=>c!==col)],uid),rel=live.d,rows=live.status==='ready'?(live.d[col]??null):null;
  // sumber pilihan untuk isian bertipe combo (mis. nama dosen): langganan TERPISAH agar galatnya tidak menutup halaman ini
  const comboSrc=useMemo(()=>[...new Set(fields.filter(f=>f.type==='combo').map(f=>f.src))],[fields]),cb=useCols(comboSrc,uid);
  const comboOpts=f=>{if(cb.status!=='ready')return[];const rows=cb.d[f.src]||[],seen=new Set();return sortDosen(rows).filter(r=>!f.roles||f.roles.includes(r.peran)).map(r=>({nama:String(r.nama||'').trim(),label:roleLabel(r,rows)})).filter(o=>o.nama&&!seen.has(o.nama)&&seen.add(o.nama))};
  const tt=x=>(titleOf?titleOf(x,rows||[]):x[titleKey]);
  const vis=x=>!x.showIf||x.showIf(form||{});
  const empty=()=>{const base={...(defaults?.()||{})};filters.forEach(f=>{if(fv[f.key]&&(f.options||f.from)&&fields.some(x=>x.k===f.key))base[f.key]=fv[f.key]});return{...base,...takePrefill(col)}};
  // base = updatedAt dokumen menurut snapshot yang dikonfirmasi server saat formulir edit dibuka (null = belum bisa dipastikan, mis. offline)
  const openForm=v=>{const d=v||empty();init.current=JSON.stringify(d);base.current=d.id?(confirmedAt(col,uid,d.id)??null):null;setErrs({});setForm(d)};
  const curMs=form?.id?confirmedAt(col,uid,form.id):undefined,stale=!!form?.id&&base.current!=null&&curMs!=null&&curMs!==base.current;
  const reload=()=>{const x=(rows||[]).find(r=>r.id===form.id);if(!x){setForm(null);toast('Data ini sudah tidak ada','err');return}const d={...x};init.current=JSON.stringify(d);base.current=confirmedAt(col,uid,x.id)??null;setErrs({});setForm(d)};
  useEffect(()=>{if(autoNew){openForm();onAutoNew?.()}},[autoNew]);// eslint-disable-line
  useEffect(()=>{if(!openId||rows===null)return;const x=rows.find(r=>r.id===openId);if(x)setDet(x);else toast('Data tidak ditemukan','err');onOpenId?.()},[openId,rows]);// eslint-disable-line
  const optsOf=f=>f.options&&f.options!=='data'?f.options:[...new Set((rows||[]).map(r=>r[f.key]).filter(Boolean))].sort();
  const dateKey=range;
  const list=useMemo(()=>{if(!rows)return[];const ql=q.toLowerCase();
    const r=rows.filter(x=>(!scope||scope(x))&&(archivable?(tab==='arsip')===!!x.archived:true)&&filters.every(f=>!fv[f.key]||x[f.key]===fv[f.key])&&(!dateKey||((!rg.from||(x[dateKey]||'')>=rg.from)&&(!rg.to||(x[dateKey]||'')<=rg.to)))&&(!ql||fields.some(f=>String(x[f.k]||'').toLowerCase().includes(ql))));
    if(sortFn)r.sort((a,b)=>sortFn(a,b));else r.sort((a,b)=>{const x=a[sortKey]||'',y=b[sortKey]||'';if(!x!==!y)return x?-1:1;return(x<y?-1:x>y?1:0)*(desc?-1:1)});return r},[rows,q,fv,rg,desc,tab,scopeKey]);// eslint-disable-line
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
  const validate=()=>{const e={};for(const x of fields){if(!vis(x))continue;const v=(form[x.k]||'').trim();if((x.req||(x.reqIf&&x.reqIf(form)))&&!v)e[x.k]=x.label+' wajib diisi';else if(x.max&&v.length>x.max)e[x.k]=x.label.replace(' (opsional)','')+' maksimal '+x.max+' karakter'
    else if(x.drive&&v&&!isDriveUrl(v))e[x.k]='Harus link Google Drive/Docs (https://drive.google.com/…)'}
    if(form.jamMulai&&form.jamSelesai&&form.jamSelesai<form.jamMulai)e.jamSelesai='Jam selesai tidak boleh lebih awal dari jam mulai';
    if(form.tanggalSelesai&&form.tanggal&&form.tanggalSelesai<form.tanggal)e.tanggalSelesai='Tanggal selesai tidak boleh sebelum tanggal diberikan';
    return e};
  const save=(force)=>{const e=validate();setErrs(e);const bad=Object.keys(e)[0];if(bad){document.getElementById('f-'+bad)?.focus();return}
    if(stale&&!force){toast('Data ini baru diubah di perangkat lain. Pilih Muat ulang atau Timpa.','err');return}
    const prevRow=form.id?rows.find(r=>r.id===form.id):null,id=form.id||doc(collection(db,col)).id,data={};fields.forEach(x=>data[x.k]=vis(x)?(form[x.k]||'').trim():'');if(extra)Object.assign(data,extra(data,prevRow,rows||[]));
    if(history&&statusKey){data._wasDone=prevRow?.[statusKey]===doneStatus;doneFix(data,data[statusKey]);if(data[statusKey])data.riwayat=histOf(prevRow,data[statusKey]);else if(prevRow?.riwayat)data.riwayat=prevRow.riwayat}
    const edit=!!form.id,ref=doc(db,col,id),payload=edit?{...data,updatedAt:serverTimestamp()}:{...data,id,ownerUid:uid,createdAt:serverTimestamp(),updatedAt:serverTimestamp()};
    send(()=>edit?updateDoc(ref,payload):setDoc(ref,payload),{label:title+' “'+((data[titleKey]||'data').slice(0,40))+'”'});setForm(null)};
  const closeForm=()=>{if(JSON.stringify(form)!==init.current)setAskClose(true);else setForm(null)};
  const remove=()=>{const x=del,t=(tt(x)||'data').slice(0,40);send(()=>deleteDoc(doc(db,col,x.id)),{label:'Hapus “'+t+'”',ok:'Dihapus: '+t});setDel(null);setDet(null)};
  const setStatus=(x,s)=>{const d={[statusKey]:s,updatedAt:serverTimestamp()};if(history)d.riwayat=histOf(x,s);if(doneKey){const dd={[doneKey]:x[doneKey]||'',_wasDone:x[statusKey]===doneStatus};doneFix(dd,s);d[doneKey]=dd[doneKey]}
    send(()=>updateDoc(doc(db,col,x.id),d),{label:'Status “'+(tt(x)||'data').slice(0,30)+'”',ok:'Status diubah ke “'+s+'”'});setDet(v=>v&&v.id===x.id?{...v,...d,updatedAt:undefined}:v)};
  const archive=x=>{const was=!!x.archived,t=(tt(x)||'data').slice(0,30);send(()=>updateDoc(doc(db,col,x.id),{archived:!was,updatedAt:serverTimestamp()}),{label:(was?'Pulihkan “':'Arsipkan “')+t+'”',ok:was?'Dipulihkan dari arsip':'Dipindahkan ke arsip'});setDet(null);
    toast(was?'Dipulihkan dari arsip':'Dipindahkan ke arsip','ok',{label:'Urungkan',onClick:()=>send(()=>updateDoc(doc(db,col,x.id),{archived:was,updatedAt:serverTimestamp()}),{label:'Urungkan arsip “'+t+'”',ok:'Dikembalikan'})})};
  const acts=x=>[{label:'Lihat detail',icon:'eye',onClick:()=>setDet(x)},{label:'Edit',icon:'pencil',onClick:()=>openForm(x)},...(urlKey&&parseDrive(x[urlKey])?.preview?[{label:'Pratinjau',icon:'image',onClick:()=>setPrev(x)}]:[]),
    ...(reorder?[...(reorder.can(rows||[],x,-1)?[{label:'Naikkan urutan',icon:'sort',onClick:()=>moveRow(x,-1)}]:[]),...(reorder.can(rows||[],x,1)?[{label:'Turunkan urutan',icon:'sort',onClick:()=>moveRow(x,1)}]:[])]:[]),...(archivable?[{label:x.archived?'Pulihkan dari arsip':'Arsipkan',icon:'arsip',onClick:()=>archive(x)}]:[]),{sep:true},{label:'Hapus',icon:'trash',danger:true,onClick:()=>setDel(x)}];
  const moveRow=(x,dir)=>{const plan=reorder.plan(rows||[],x.id,dir);if(!plan.length)return;send(()=>{const b=writeBatch(db);plan.forEach(p=>b.update(doc(db,col,p.id),{[reorder.key]:p.urut,updatedAt:serverTimestamp()}));return b.commit()},{label:'Urutan “'+(tt(x)||'data').slice(0,40)+'”',ok:'Urutan diubah'})};
  const pickView=v=>{setView(v);ls('bimtrack-view-'+col,v)};
  const VL={list:{value:'list',label:'Daftar',icon:'list'},gallery:{value:'gallery',label:'Galeri',icon:'image'},group:{value:'group',label:'Per kategori',icon:'grid'},board:{value:'board',label:'Papan',icon:'board'},timeline:{value:'timeline',label:'Linimasa',icon:'timeline'}};
  const badgeVal=x=>statusKey&&x[statusKey]?<Badge tone={tones[x[statusKey]]||'neutral'}>{x[statusKey]}</Badge>:(filters[0]&&x[filters[0].key]?<Badge>{x[filters[0].key]}</Badge>:null);
  const metaOf=x=>subKeys.map(k=>show(fields,k,x[k])).filter(Boolean).join(' · ');
  // Kotak seragam: judul maks 2 baris (ellipsis), badge di baris sendiri, meta satu baris. Judul lengkap ada di Detail.
  const CardBody=(x,items,cls,noBadge)=>{const bd=noBadge?null:badgeVal(x),lt=badge&&badge(x);
    return <div className={'card clk cc'+(cls||'')} onClick={()=>setDet(x)}><div className="cc-h"><b className="cc-t" title={tt(x)||undefined}>{tt(x)||'-'}</b><Menu items={items} label={'Tindakan untuk '+(tt(x)||'data')}/></div>
      <div className="cc-b">{bd}{lt&&<Badge tone="danger">{lt}</Badge>}</div><div className="mut cc-m" title={metaOf(x)||undefined}>{metaOf(x)}</div></div>};
  const Card=x=><ContextMenu key={x.id} className="cc-w" items={acts(x)}>{CardBody(x,acts(x))}</ContextMenu>;
  const GCard=x=><ContextMenu key={x.id} className="gal-w" items={acts(x)}><div className="gal-c" onClick={()=>setDet(x)} role="button" tabIndex={0} onKeyDown={e=>(e.key==='Enter'||e.key===' ')&&(e.preventDefault(),setDet(x))}><Thumb url={x[urlKey]}/><div className="gal-t"><b title={tt(x)||undefined}>{tt(x)||'-'}</b><span className="mut" title={metaOf(x)||undefined}>{metaOf(x)}</span></div></div></ContextMenu>;
  const boardOpts=statusKey?fields.find(f=>f.k===statusKey)?.options||[]:[],tone0=o=>tones[o]==='neutral'?'':tones[o]||'';
  const BCard=x=>{const cur=x[statusKey]||boardOpts[0],mv=boardOpts.filter(o=>o!==cur).map(o=>({label:'Pindahkan ke “'+o+'”',icon:'chev-right',onClick:()=>setStatus(x,o)})),items=[...mv,{sep:true},...acts(x)];
    return <ContextMenu key={x.id} className="cc-w" items={items}>{CardBody(x,items,' bc',true)}</ContextMenu>};
  const body=()=>{
    if(view==='board')return <div className="board">{boardOpts.map(o=>{const items=list.filter(x=>(x[statusKey]||boardOpts[0])===o);
      return <section className="bcol" key={o} aria-label={o}><div className="bcol-h"><i className={'dot '+tone0(o)}/><h3>{o}</h3><Badge>{items.length}</Badge></div>{items.length?items.map(BCard):<p className="bcol-e">Tidak ada data di kolom ini.</p>}</section>})}</div>;
    if(view==='timeline'){const k=timeKey||sortKey,dated=list.filter(x=>x[k]).sort((a,b)=>a[k]<b[k]?-1:a[k]>b[k]?1:0),undated=list.filter(x=>!x[k]),g=[];
      dated.forEach(x=>{const m=x[k].slice(0,7),l=g[g.length-1];if(l&&l.m===m)l.items.push(x);else g.push({m,items:[x]})});
      const Row=x=>{const t=x[k];return <div className="tlv" key={x.id}><div className="tlv-d">{t?<><b>{+t.slice(8,10)}</b><span>{BULAN_S[+t.slice(5,7)-1]}</span><small>{relDay(t)}</small></>:<span>–</span>}</div>{Card(x)}</div>};
      return <>{g.map(z=><section key={z.m} className="grp"><div className="sec-h"><h2>{BULAN[+z.m.slice(5,7)-1]} {z.m.slice(0,4)}</h2><Badge>{z.items.length}</Badge></div>{z.items.map(Row)}</section>)}
        {undated.length>0&&<section className="grp"><div className="sec-h"><h2>Tanpa tanggal</h2><Badge>{undated.length}</Badge></div>{undated.map(Row)}</section>}</>}
    if(view==='gallery')return <div className="gal">{pg.slice.map(GCard)}</div>;
    if(view==='group'){const g={};pg.slice.forEach(x=>{(g[x[groupKey]||'Tanpa kategori']=g[x[groupKey]||'Tanpa kategori']||[]).push(x)});return Object.keys(g).sort().map(k=><section key={k} className="grp"><div className="sec-h"><h2>{k}</h2><Badge>{g[k].length}</Badge></div><div className="crud-g">{g[k].map(Card)}</div></section>)}
    return <div className="crud-g">{pg.slice.map(Card)}</div>};

  return <div>
    {embedded?<div className="sec-h"><h2>{listTitle||title}</h2><button type="button" className="btn" onClick={()=>openForm()}><Icon name="plus" size={18}/> Tambah</button></div>
      :<PageHead title={heading||title} actions={<button type="button" className="btn" onClick={()=>openForm()}><Icon name="plus" size={18}/> Tambah</button>}/>}
    {header&&header(rows||[])}
    {archivable&&<div style={{marginBottom:'var(--s3)'}}><Segmented label="Tampilkan" value={tab} onChange={setTab} options={[{value:'aktif',label:'Aktif'},{value:'arsip',label:'Arsip',icon:'arsip'}]}/></div>}
    <div className="toolbar">
      <div className="search"><Icon name="cari"/><input className="in" placeholder="Cari..." aria-label={'Cari '+title.toLowerCase()} value={q} onChange={e=>setQ(e.target.value)}/></div>
      {(filters.length>0||dateKey)&&<button type="button" className="btn sec" onClick={()=>setShowF(true)} aria-label="Buka filter"><Icon name="filter" size={18}/> Filter{nf>0&&<span className="cnt">{nf}</span>}</button>}
      {!sortFn&&<button type="button" className="btn sec" onClick={()=>setDesc(!desc)} aria-label={'Ubah urutan, sekarang '+(desc?sortLabels[0]:sortLabels[1])}><Icon name="sort" size={18}/><span className="sort-t">{sortLabels.map((l,i)=><span key={l} className={(desc?i===0:i===1)?'on':''} aria-hidden="true">{l}</span>)}</span></button>}
      {views.length>1&&<Segmented label="Tampilan" value={view} onChange={pickView} options={views.map(v=>VL[v])}/>}</div>
    {nf>0&&<div className="fchips">{filters.filter(f=>fv[f.key]).map(f=><button type="button" className="fchip" key={f.key} onClick={()=>setFv(s=>({...s,[f.key]:''}))}>{f.label}: {fv[f.key]} <Icon name="x" size={14}/><span className="sr">Hapus filter</span></button>)}
      {(rg.from||rg.to)&&<button type="button" className="fchip" onClick={()=>setRg({})}>{rg.from?fmtDate(rg.from,'sedang'):'…'} – {rg.to?fmtDate(rg.to,'sedang'):'…'} <Icon name="x" size={14}/><span className="sr">Hapus filter tanggal</span></button>}
      <button type="button" className="btn ghost sm" onClick={()=>{setFv({});setRg({})}}>Reset semua</button></div>}
    {live.status==='ready'&&filtered&&<p className="mut cnt-l">{list.length} data ditemukan</p>}
    <DataState status={live.status} error={live.error} onRetry={live.retry} skeleton={<ListSkeleton view={view}/>} label="Memuat data" isEmpty={!list.length} empty={<EmptyState title={filtered?'Tidak ada hasil':tab==='arsip'?'Arsip kosong':'Belum ada '+title.toLowerCase()} text={filtered?'Coba ubah kata kunci atau filter.':tab==='arsip'?'Data yang diarsipkan akan muncul di sini.':'Data yang kamu tambahkan akan muncul di sini.'} action={filtered?<button type="button" className="btn sec" onClick={()=>{setQ('');setFv({});setRg({})}}>Hapus pencarian dan filter</button>:tab==='aktif'&&<button type="button" className="btn" onClick={()=>openForm()}><Icon name="plus" size={18}/> Tambah {title.toLowerCase()}</button>}/>}>
      {body()}{view!=='board'&&view!=='timeline'&&<Pagination page={pg.page} pages={pg.pages} onPage={pg.setPage} total={pg.total}/>}</DataState>

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
        {reorder&&<div className="row" style={{flexWrap:'wrap',marginBottom:8}}><button type="button" className="btn sec sp" disabled={!reorder.can(rows||[],det,-1)} onClick={()=>moveRow(det,-1)}><Icon name="sort" size={18} style={{transform:'scaleY(-1)'}}/> Naikkan</button><button type="button" className="btn sec sp" disabled={!reorder.can(rows||[],det,1)} onClick={()=>moveRow(det,1)}><Icon name="sort" size={18}/> Turunkan</button></div>}
        {urlKey&&det[urlKey]&&<div className="row" style={{flexWrap:'wrap'}}><a className="btn sec sp" href={isDriveUrl(det[urlKey])?det[urlKey]:undefined} target="_blank" rel="noopener noreferrer"><Icon name="external" size={18}/> Buka di Drive</a>{parseDrive(det[urlKey])?.preview&&<button type="button" className="btn sec sp" onClick={()=>setPrev(det)}><Icon name="eye" size={18}/> Pratinjau</button>}<button type="button" className="btn sec sp" onClick={()=>{navigator.clipboard?.writeText(det[urlKey]);toast('Link disalin')}}><Icon name="copy" size={18}/> Salin link</button></div>}
        {relations.map(r=>{const items=(rel[r.col]||[]).filter(x=>x[r.via]===det.id);return <section className="relb" key={r.col}><div className="row"><h3 className="sp">{r.title} <Badge>{items.length}</Badge></h3>{r.add&&<button type="button" className="btn ghost sm" onClick={()=>{setPrefill(r.col,r.add(det));navigate(PAGE[r.col],'baru')}}><Icon name="plus" size={16}/> Tambah</button>}</div>
          {items.length?items.map(x=><button type="button" key={x.id} className="rel-i" onClick={()=>navigate(PAGE[r.col],x.id)}><b>{x[r.titleKey]||'-'}</b><span className="mut">{r.sub.map(k=>x[k]&&(/^\d{4}-\d\d-\d\d$/.test(x[k])?fmtDate(x[k],'sedang'):x[k])).filter(Boolean).join(' · ')}</span></button>):<p className="mut" style={{fontSize:'var(--fs-sm)'}}>{r.empty||'Belum ada.'}</p>}</section>})}
        {actions.filter(a=>!a.show||a.show(det)).map(a=><button type="button" key={a.label} className="btn sec block" style={{marginBottom:8}} onClick={()=>a.onClick(det)}><Icon name={a.icon} size={18}/> {a.label}</button>)}
        {history&&det.riwayat?.length>0&&<section className="relb"><h3>Riwayat status</h3><Timeline items={[...det.riwayat].reverse().map((h,i)=>({key:i,title:h.s,meta:new Date(h.t).toLocaleString('id-ID',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}),tone:tones[h.s]==='neutral'?'':tones[h.s]}))}/></section>}
      </>}</Modal>

    <Modal open={!!form} title={form?.id?'Edit '+title.toLowerCase():'Tambah '+title.toLowerCase()} onClose={closeForm} size="lg" footer={<div className="row"><button type="button" className="btn sec sp" onClick={closeForm}>Batal</button><button type="button" className="btn sp" onClick={()=>save()}>Simpan</button></div>}>
      {form&&stale&&<div className="lockmsg" role="alert"><Icon name="alert" size={18}/><div style={{minWidth:0}}><b>Data ini baru diubah di perangkat lain.</b> Muat ulang untuk memakai versi terbaru (isianmu di formulir ini dibuang), atau Timpa dengan isianmu.<div className="row" style={{marginTop:8,flexWrap:'wrap'}}><button type="button" className="btn sec sm" onClick={reload}>Muat ulang</button><button type="button" className="btn dan sm" onClick={()=>save(true)}>Timpa</button></div></div></div>}
      {form&&fields.filter(vis).map(x=>{const id='f-'+x.k,v=form[x.k]||'',er=errs[x.k],dup=x.k===urlKey?dupOf(v):null;return <div className="field" key={x.k}><label htmlFor={id}>{x.label}{(x.req||(x.reqIf&&x.reqIf(form)))&&<span className="req"> *</span>}</label>
        {x.type==='rel'?<Select id={id} label={x.label} value={v} options={relOpts(x)} placeholder="Tidak ada" searchable onChange={set(x.k)}/>
        :x.type==='select'?<Select id={id} label={x.label} value={v} options={x.options} placeholder={'Pilih '+x.label.toLowerCase()} invalid={!!er} onChange={set(x.k)}/>
        :x.type==='date'?<DatePicker id={id} label={x.label} value={v} invalid={!!er} onChange={set(x.k)}/>
        :x.type==='time'?<TimePicker id={id} label={x.label} value={v} invalid={!!er} onChange={set(x.k)}/>
        :x.type==='combo'?<><ComboField id={id} value={v} invalid={!!er} items={comboOpts(x)} onChange={set(x.k)}/>
          <div className="hint">{comboOpts(x).length?'Ketuk kolom lalu pilih dosen atau pejabat (Dosen pembimbing 1, 2, Kaprodi, dst), atau ketik sendiri (mis. TU).':'Bebas diketik. Tambahkan dosen di Dosen dan Pejabat agar bisa dipilih dari daftar.'}</div></>
        :x.type==='textarea'?<textarea id={id} className="in" value={v} aria-invalid={!!er||undefined} onChange={e=>set(x.k)(e.target.value)}/>
        :<input id={id} className="in" type={x.type==='url'?'url':'text'} inputMode={x.type==='url'?'url':undefined} value={v} aria-invalid={!!er||undefined} onChange={e=>set(x.k)(e.target.value)}/>}
        {er&&<div className="err" role="alert">{er}</div>}
        {dup&&<div className="hint">Link yang sama sudah dipakai di "{dup[titleKey]}".</div>}</div>})}</Modal>
    <Modal open={askClose} title="Buang perubahan?" onClose={()=>setAskClose(false)}><p>Isian yang belum disimpan akan hilang.</p><div className="row"><button type="button" className="btn sec sp" onClick={()=>setAskClose(false)}>Lanjut mengisi</button><button type="button" className="btn dan sp" onClick={()=>{setAskClose(false);setForm(null)}}>Buang</button></div></Modal>
    <ConfirmDialog open={!!del} title="Hapus data?" confirmLabel="Hapus" onCancel={()=>setDel(null)} onConfirm={remove}
      text={<><b style={{overflowWrap:'anywhere'}}>{((delRef.current&&tt(delRef.current))||'Data ini').slice(0,120)}</b> akan dihapus permanen dan tidak bisa dikembalikan.{archivable&&!delRef.current?.archived&&' Jika hanya ingin menyembunyikan, gunakan Arsipkan.'}</>}/>
    <Preview row={prev} urlKey={urlKey} onClose={()=>setPrev(null)}/>
  </div>}

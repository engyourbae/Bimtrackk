import {useEffect,useState} from 'react';
import {collection,getDocs,query,where,writeBatch,doc,deleteDoc,setDoc,onSnapshot,serverTimestamp} from 'firebase/firestore';
import {db} from './firebase';
import {COLS} from './config';
import {Select,Badge,DatePicker,Icon,toast} from './shared/ui';
import {todayStr} from '@shared/date';
const safe=v=>{v=String(v??'');return /^[=+\-@\t\r]/.test(v)?"'"+v:v};
const esc=(v,d)=>{v=safe(v);return v.includes('"')||v.includes(d)||/[\n\r]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};
function parse(t){t=t.replace(/^\uFEFF/,'');const f=t.split(/\r?\n/)[0]||'',d=(f.match(/;/g)||[]).length>(f.match(/,/g)||[]).length?';':',',rows=[];let r=[],c='',q=false;
  for(let i=0;i<t.length;i++){const ch=t[i];if(q){if(ch==='"'){if(t[i+1]==='"'){c+='"';i++}else q=false}else c+=ch}else if(ch==='"')q=true;else if(ch===d){r.push(c);c=''}else if(ch==='\n'||ch==='\r'){if(ch==='\r'&&t[i+1]==='\n')i++;r.push(c);c='';if(r.some(x=>x.trim()))rows.push(r);r=[]}else c+=ch}
  r.push(c);if(r.some(x=>x.trim()))rows.push(r);return rows}
const iso=v=>{v=(v||'').trim();const m=v.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);return m?`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`:v};
const save=(name,text,type)=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000)};
const names=Object.keys(COLS).map(k=>COLS[k].t),keyOf=t=>Object.keys(COLS).find(k=>COLS[k].t===t),today=todayStr;
const load=(c,uid)=>getDocs(query(collection(db,c),where('ownerUid','==',uid))).then(s=>s.docs.map(d=>d.data()));
export default function ImportExport({uid}){
  const[tab,setTab]=useState('Ekspor'),[col,setCol]=useState('Bimbingan'),[rows,setRows]=useState([]),[sel,setSel]=useState({}),[from,setFrom]=useState(''),[to,setTo]=useState(''),[delim,setDelim]=useState('Titik koma (Excel Indonesia)');
  const[csv,setCsv]=useState(null),[map,setMap]=useState({}),[busy,setBusy]=useState(false),[logs,setLogs]=useState([]);
  const k=keyOf(col),F=COLS[k].f,cols=F.filter(f=>sel[f.k]!==false),D=delim.startsWith('Titik')?';':',';
  useEffect(()=>{load(k,uid).then(setRows).catch(e=>toast(e.message,'err'))},[k,uid]);
  useEffect(()=>onSnapshot(query(collection(db,'backupLogs'),where('ownerUid','==',uid)),s=>setLogs(s.docs.map(d=>d.data()).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0)).slice(0,5))),[uid]);
  const inRange=r=>{const t=r.tanggal||r.deadline||'';return(!from||t>=from)&&(!to||t<=to)},data=rows.filter(inRange);
  const exportCsv=()=>{const t='\uFEFF'+[cols.map(f=>esc(f.label,D)).join(D),...data.map(r=>cols.map(f=>esc(r[f.k]??'',D)).join(D))].join('\r\n');save(`bimtrack-${k}-${today()}.csv`,t,'text/csv;charset=utf-8')};
  const pick=async e=>{const f=e.target.files[0];if(!f)return;const p=parse(await f.text());if(p.length<2)return toast('CSV kosong atau tidak valid','err');const h=p[0].map(x=>x.trim()),m={};
    F.forEach(x=>{const i=h.findIndex(y=>[x.k,x.label].some(z=>z.toLowerCase()===y.toLowerCase()));if(i>=0)m[x.k]=h[i]});setMap(m);setCsv({h,body:p.slice(1)});e.target.value=''};
  const analyze=()=>{if(!csv)return null;const ex=new Set(rows.map(r=>F.filter(f=>f.req).map(f=>String(r[f.k]||'').toLowerCase()).join('|'))),seen=new Set(),ok=[],bad=[],dup=[];
    csv.body.forEach((line,n)=>{const o={};F.forEach(f=>{const i=csv.h.indexOf(map[f.k]);let v=i>=0?(line[i]||'').trim():'';if(f.type==='date')v=iso(v);o[f.k]=v?safe(v):''});
      let why='';for(const f of F){const v=o[f.k];if(f.req&&!v){why=f.label+' kosong';break}if(v&&f.type==='date'&&!/^\d{4}-\d{2}-\d{2}$/.test(v)){why=f.label+' bukan tanggal valid';break}if(v&&f.type==='select'&&!f.options.includes(v)){why=f.label+' tidak dikenali: '+v;break}if(v&&f.drive&&!/^https:\/\/(drive|docs)\.google\.com\//.test(v)){why=f.label+' bukan link Drive';break}}
      if(why)return bad.push({n:n+2,why});const key=F.filter(f=>f.req).map(f=>String(o[f.k]).toLowerCase()).join('|');if(ex.has(key)||seen.has(key))return dup.push({n:n+2});seen.add(key);ok.push(o)});return{ok,bad,dup}};
  const A=analyze();
  const doImport=async()=>{if(!A?.ok.length)return;setBusy(true);const made=[];try{for(let i=0;i<A.ok.length;i+=400){const b=writeBatch(db);A.ok.slice(i,i+400).forEach(o=>{const r=doc(collection(db,k));made.push(r);b.set(r,{...o,id:r.id,ownerUid:uid,createdAt:serverTimestamp(),updatedAt:serverTimestamp()})});await b.commit()}
    toast(`${A.ok.length} baris diimpor`);setCsv(null);load(k,uid).then(setRows)}catch(e){await Promise.all(made.map(r=>deleteDoc(r).catch(()=>{})));toast('Impor gagal dan dibatalkan (rollback): '+e.message,'err')}setBusy(false)};
  const backup=async()=>{setBusy(true);try{const out={app:'BIMTRACK',ownerUid:uid,createdAt:new Date().toISOString()},counts={};for(const c of Object.keys(COLS)){out[c]=await load(c,uid);counts[c]=out[c].length}
    save(`bimtrack-backup-${today()}.json`,JSON.stringify(out,null,1),'application/json');const id=doc(collection(db,'backupLogs')).id;setDoc(doc(db,'backupLogs',id),{id,ownerUid:uid,tipe:'json',counts,status:'berhasil',createdAt:serverTimestamp(),updatedAt:serverTimestamp()}).catch(()=>{});toast('Backup diunduh')}catch(e){toast(e.message,'err')}setBusy(false)};
  return <div><h1>CSV dan Backup</h1><div className="row" style={{marginBottom:12}}>{['Ekspor','Impor','Backup'].map(t=><button key={t} className={'btn '+(tab===t?'':'sec')} onClick={()=>setTab(t)}>{t}</button>)}</div>
    {tab!=='Backup'&&<div className="fld"><label>Data</label><Select value={col} options={names} onChange={v=>{setCol(v);setSel({});setCsv(null)}}/></div>}
    {tab==='Ekspor'&&<><div className="fld"><label>Pemisah kolom</label><Select value={delim} options={['Titik koma (Excel Indonesia)','Koma']} onChange={setDelim}/></div>
      <div className="row" style={{marginBottom:10}}><div style={{flex:1,minWidth:140}}><DatePicker label="Dari tanggal" placeholder="Dari tanggal" value={from} onChange={setFrom}/></div><div style={{flex:1,minWidth:140}}><DatePicker label="Sampai tanggal" placeholder="Sampai tanggal" value={to} onChange={setTo}/></div></div>
      <div className="row" style={{marginBottom:10}}>{F.map(f=><button key={f.k} className={'badge '+(sel[f.k]===false?'':'ok')} style={{border:0,minHeight:32}} onClick={()=>setSel({...sel,[f.k]:sel[f.k]===false})}>{f.label}</button>)}</div>
      <div className="card" style={{overflowX:'auto'}}><p className="mut" style={{margin:'0 0 6px'}}>Pratinjau ({data.length} baris)</p><table style={{fontSize:'.8rem',borderCollapse:'collapse'}}><thead><tr>{cols.map(f=><th key={f.k} style={{textAlign:'left',padding:4}}>{f.label}</th>)}</tr></thead><tbody>{data.slice(0,5).map(r=><tr key={r.id}>{cols.map(f=><td key={f.k} style={{padding:4,maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r[f.k]}</td>)}</tr>)}</tbody></table></div>
      <button className="btn" style={{width:'100%'}} disabled={!data.length} onClick={exportCsv}>Ekspor CSV (UTF-8 BOM)</button></>}
    {tab==='Impor'&&<><label className="btn sec block" style={{cursor:"pointer"}}><Icon name="upload" size={18}/> Pilih berkas CSV<input type="file" accept=".csv,text/csv" className="sr" onChange={pick}/></label>
      {csv&&<><h2 style={{marginTop:14}}>Pemetaan kolom</h2>{F.map(f=><div className="fld" key={f.k}><label>{f.label}{f.req&&' *'}</label><Select value={map[f.k]} placeholder="(abaikan)" options={['(abaikan)',...csv.h]} onChange={v=>setMap({...map,[f.k]:v==='(abaikan)'?undefined:v})}/></div>)}
        <div className="card"><p style={{margin:0}}><Badge>Valid {A.ok.length}</Badge> <Badge>Duplikat {A.dup.length}</Badge> <span className="badge no">Tidak valid {A.bad.length}</span></p>{A.bad.slice(0,8).map(b=><p key={b.n} className="mut" style={{margin:'4px 0',fontSize:'.85rem'}}>Baris {b.n}: {b.why}</p>)}{A.dup.length>0&&<p className="mut" style={{fontSize:'.85rem'}}>Duplikat dilewati: baris {A.dup.slice(0,10).map(d=>d.n).join(', ')}</p>}</div>
        <button className="btn" style={{width:'100%'}} disabled={busy||!A.ok.length} onClick={doImport}>Impor {A.ok.length} baris (data lama tidak diubah)</button></>}</>}
    {tab==='Backup'&&<><p className="mut">Mengunduh seluruh data skripsi Anda sebagai JSON. Backup dibuat manual oleh Anda, tidak ada backup otomatis. Tanpa kata sandi atau kredensial.</p><button className="btn" style={{width:'100%'}} disabled={busy} onClick={backup}>Buat backup JSON</button>
      <h2 style={{marginTop:16}}>Riwayat backup</h2>{!logs.length&&<p className="mut">Belum ada.</p>}{logs.map(l=><div key={l.id} className="card"><b>{l.createdAt?.toDate?.().toLocaleString('id-ID')||'...'}</b> <Badge>{l.status}</Badge><p className="mut" style={{margin:'4px 0',fontSize:'.8rem'}}>{Object.entries(l.counts||{}).map(([a,b])=>a+': '+b).join(' · ')}</p></div>)}</>}</div>}

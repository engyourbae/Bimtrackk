import {useRef,useState} from 'react';
import {writeBatch,doc,collection,serverTimestamp} from 'firebase/firestore';
import {db,auth} from '../firebase';
import {toast,PageHead,EmptyState,ConfirmDialog,Modal,Icon,DataState,Checkbox,when} from '../shared/ui';
import {useAdminCols,ds} from '../useAdmin';
import {ListSk} from '../common';
import {LIM,cekKategori,cekLangkah,sortU,nextUrutan,geser,tampilOf,barisSyarat} from '@shared/panduan';

const KOSONG_K={judul:'',terbit:false},KOSONG_L={judul:'',isi:'',syarat:'',lama:'',url:'',terbit:false};
const Bdg=({on})=><span className={'badge '+(on?'ok':'no')}>{on?'Terbit':'Draf'}</span>;
const Up=({size=16})=><Icon name="chev-left" size={size} style={{transform:'rotate(90deg)'}}/>,Down=({size=16})=><Icon name="chev-left" size={size} style={{transform:'rotate(-90deg)'}}/>;

/** Panduan Alur Perjalanan: HANYA admin yang membuat, mengubah, mengurutkan, menerbitkan, dan menghapus (ditegakkan firestore.rules). Mahasiswa membacanya di aplikasi user.
 *  Koleksi: panduanKategori + panduanLangkah. Draf = tidak terbaca mahasiswa. Setiap perubahan ditulis satu batch bersama baris Audit log (atomik: tulis panduan dan catat, atau tidak keduanya). */
export default function Panduan({uid}){
  const a=useAdminCols(['pk','pl'],uid),kats=sortU(a.d.pk||[]),langs=a.d.pl||[],stepsOf=id=>sortU(langs.filter(l=>l.kategoriId===id));
  const[open,setOpen]=useState({}),[kf,setKf]=useState(null),[lf,setLf]=useState(null),[errs,setErrs]=useState({}),[busy,setBusy]=useState(false),[del,setDel]=useState(null),[askClose,setAskClose]=useState(false);
  const init=useRef(''),keep=useRef(null);if(del)keep.current=del;const dv=del||keep.current;
  const openK=v=>{const d=v?{id:v.id,judul:v.judul,terbit:v.terbit===true}:{...KOSONG_K};init.current=JSON.stringify(d);setErrs({});setKf(d)};
  const openL=(k,v)=>{const d=v?{id:v.id,kategoriId:k.id,judul:v.judul||'',isi:v.isi||'',syarat:v.syarat||'',lama:v.lama||'',url:v.url||'',terbit:v.terbit===true}:{...KOSONG_L,kategoriId:k.id};init.current=JSON.stringify(d);setErrs({});setLf(d)};
  const form=kf||lf,dirty=!!form&&JSON.stringify(form)!==init.current;
  const closeForm=()=>{if(dirty)setAskClose(true);else{setKf(null);setLf(null)}};
  // satu batch: perubahan panduan + baris audit log
  const commit=async(fn,okMsg)=>{setBusy(true);try{const b=writeBatch(db),t=serverTimestamp();fn(b,t);await b.commit();if(okMsg)toast(okMsg);return true}
    catch(e){toast(e.code==='permission-denied'?'Ditolak server. Pastikan firestore.rules terbaru (koleksi panduan) sudah diterbitkan.':(e.message||'Gagal menyimpan'),'err');return false}finally{setBusy(false)}};
  const log=(b,t,action,ket,extra={})=>b.set(doc(collection(db,'aktivitas')),{action,ket:String(ket||'').slice(0,120),adminUid:auth.currentUser.uid,createdAt:t,...extra});

  const saveKat=async()=>{const e=cekKategori(kf);setErrs(e);if(Object.keys(e).length)return;
    const edit=!!kf.id,id=kf.id||doc(collection(db,'panduanKategori')).id,judul=kf.judul.trim(),terbit=!!kf.terbit,prev=edit?kats.find(k=>k.id===id):null;
    if(!edit&&kats.length>=LIM.KATEGORI_MAX)return toast('Maksimal '+LIM.KATEGORI_MAX+' kategori. Hapus atau gabungkan kategori dulu.','err');
    const flip=!!prev&&(prev.terbit===true)!==terbit,action=!edit?'guide_cat_add':flip?(terbit?'guide_cat_pub':'guide_cat_hide'):'guide_cat_edit';
    const ok=await commit((b,t)=>{const ref=doc(db,'panduanKategori',id);
      if(edit){b.update(ref,{judul,terbit,updatedAt:t});if(flip)stepsOf(id).forEach(l=>b.update(doc(db,'panduanLangkah',l.id),{kategoriTerbit:terbit,tampil:tampilOf(l.terbit===true,terbit)}))}
      else b.set(ref,{id,judul,urutan:nextUrutan(kats),terbit,createdAt:t,updatedAt:t});
      log(b,t,action,judul)},edit?'Kategori disimpan':'Kategori ditambahkan');
    if(ok){setKf(null);if(!edit)setOpen(o=>({...o,[id]:true}))}};
  const pubKat=k=>{const terbit=k.terbit!==true;commit((b,t)=>{b.update(doc(db,'panduanKategori',k.id),{terbit,updatedAt:t});
    stepsOf(k.id).forEach(l=>b.update(doc(db,'panduanLangkah',l.id),{kategoriTerbit:terbit,tampil:tampilOf(l.terbit===true,terbit)}));log(b,t,terbit?'guide_cat_pub':'guide_cat_hide',k.judul)},terbit?'Kategori diterbitkan':'Kategori dijadikan draf (disembunyikan dari mahasiswa)')};
  const moveKat=(k,dir)=>{const p=geser(kats,k.id,dir);if(p.length)commit((b,t)=>{p.forEach(x=>b.update(doc(db,'panduanKategori',x.id),{urutan:x.urutan}));log(b,t,'guide_reorder',k.judul)},'Urutan kategori diubah')};

  const saveLgk=async()=>{const e=cekLangkah(lf);setErrs(e);if(Object.keys(e).length)return;
    const k=kats.find(z=>z.id===lf.kategoriId);if(!k)return toast('Kategori tidak ditemukan','err');
    const edit=!!lf.id,id=lf.id||doc(collection(db,'panduanLangkah')).id,ls=stepsOf(k.id),prev=edit?langs.find(l=>l.id===id):null;
    if(!edit&&ls.length>=LIM.LANGKAH_MAX)return toast('Satu kategori maksimal '+LIM.LANGKAH_MAX+' langkah.','err');
    const d={judul:lf.judul.trim(),isi:lf.isi.trim(),syarat:(lf.syarat||'').trim(),lama:(lf.lama||'').trim(),url:(lf.url||'').trim(),terbit:!!lf.terbit,kategoriTerbit:k.terbit===true};d.tampil=tampilOf(d.terbit,d.kategoriTerbit);
    const flip=!!prev&&(prev.terbit===true)!==d.terbit,action=!edit?'guide_step_add':flip?(d.terbit?'guide_step_pub':'guide_step_hide'):'guide_step_edit';
    const ok=await commit((b,t)=>{const ref=doc(db,'panduanLangkah',id);
      if(edit)b.update(ref,{...d,updatedAt:t});else b.set(ref,{...d,id,kategoriId:k.id,urutan:nextUrutan(ls),createdAt:t,updatedAt:t});
      log(b,t,action,k.judul+' › '+d.judul)},edit?'Langkah disimpan':'Langkah ditambahkan');
    if(ok)setLf(null)};
  const pubLgk=(k,l)=>{const terbit=l.terbit!==true;commit((b,t)=>{b.update(doc(db,'panduanLangkah',l.id),{terbit,tampil:tampilOf(terbit,k.terbit===true),updatedAt:t});log(b,t,terbit?'guide_step_pub':'guide_step_hide',k.judul+' › '+l.judul)},terbit?(k.terbit?'Langkah diterbitkan':'Langkah diterbitkan, tetapi baru tampil setelah kategorinya terbit'):'Langkah dijadikan draf')};
  const moveLgk=(k,l,dir)=>{const p=geser(stepsOf(k.id),l.id,dir);if(p.length)commit((b,t)=>{p.forEach(x=>b.update(doc(db,'panduanLangkah',x.id),{urutan:x.urutan}));log(b,t,'guide_reorder',k.judul+' › '+l.judul)},'Urutan langkah diubah')};

  const doDel=async()=>{const{tipe,x,k}=del;
    const ok=await commit((b,t)=>{if(tipe==='kat'){const ls=stepsOf(x.id);ls.forEach(l=>b.delete(doc(db,'panduanLangkah',l.id)));b.delete(doc(db,'panduanKategori',x.id));log(b,t,'guide_cat_del',x.judul,{jumlahLangkah:ls.length})}
      else{b.delete(doc(db,'panduanLangkah',x.id));log(b,t,'guide_step_del',(k?.judul||'')+' › '+x.judul)}},tipe==='kat'?'Kategori dihapus':'Langkah dihapus');
    if(ok)setDel(null)};

  const F=(id,label,node,er,hint)=><div className="field"><label htmlFor={id}>{label}</label>{node}{er&&<div className="err" role="alert">{er}</div>}{hint&&<div className="hint">{hint}</div>}</div>;
  const setL=k=>v=>{setLf(s=>({...s,[k]:v}));setErrs(e=>({...e,[k]:undefined}))};
  const atKMax=kats.length>=LIM.KATEGORI_MAX;
  return <div className="stack"><PageHead title="Panduan Alur" sub="Alur perjalanan skripsi yang dibaca mahasiswa. Hanya admin yang bisa mengubah." actions={<button type="button" className="btn" disabled={busy||atKMax||a.status!=='ready'} onClick={()=>openK()}><Icon name="plus" size={18}/> Tambah kategori</button>}/>
    {a.status==='ready'&&atKMax&&<p className="mut" style={{margin:0,fontSize:'var(--fs-sm)'}}>Batas {LIM.KATEGORI_MAX} kategori tercapai.</p>}
    <DataState {...ds(a)} label="Memuat panduan" skeleton={<ListSk/>} isEmpty={!kats.length} empty={<EmptyState title="Belum ada panduan" text="Buat kategori pertama (mis. “Pengajuan Outline sampai Seminar Proposal”), lalu isi langkah-langkahnya. Kategori dan langkah berstatus draf tidak terlihat oleh mahasiswa sampai kamu terbitkan." action={<button type="button" className="btn" onClick={()=>openK()}><Icon name="plus" size={18}/> Tambah kategori</button>}/>}>
      {kats.map((k,ki)=>{const ls=stepsOf(k.id),isOpen=!!open[k.id],atLMax=ls.length>=LIM.LANGKAH_MAX;
        return <section className="card" key={k.id} aria-label={k.judul}>
          <div className="row"><b className="sp pdn-adm-t">{k.judul}</b><Bdg on={k.terbit===true}/></div>
          <p className="mut" style={{margin:'6px 0'}}>{ls.length} langkah ({ls.filter(l=>l.terbit===true).length} terbit) · Diperbarui {when(k.updatedAt)}</p>
          <div className="row" style={{flexWrap:'wrap'}}>
            <button type="button" className="btn sec sm" aria-expanded={isOpen} onClick={()=>setOpen(o=>({...o,[k.id]:!isOpen}))}>{isOpen?'Tutup langkah':'Lihat langkah'}</button>
            <button type="button" className="btn sec sm" disabled={busy} onClick={()=>openK(k)}><Icon name="pencil" size={16}/> Edit</button>
            <button type="button" className="btn sec sm" disabled={busy} onClick={()=>pubKat(k)}>{k.terbit?'Jadikan draf':'Terbitkan'}</button>
            <button type="button" className="btn sec sm" disabled={busy||ki===0} aria-label={'Naikkan kategori '+k.judul} onClick={()=>moveKat(k,-1)}><Up/></button>
            <button type="button" className="btn sec sm" disabled={busy||ki===kats.length-1} aria-label={'Turunkan kategori '+k.judul} onClick={()=>moveKat(k,1)}><Down/></button>
            <button type="button" className="btn dan sm" disabled={busy} onClick={()=>setDel({tipe:'kat',x:k})}><Icon name="trash" size={16}/> Hapus</button></div>
          {isOpen&&<div className="pdn-a">
            {ls.length?ls.map((l,i)=>{const sy=barisSyarat(l.syarat).length;return <div className="pdn-ai" key={l.id}>
              <div className="row"><b className="sp">{i+1}. {l.judul}</b><Bdg on={l.terbit===true}/></div>
              <p className="mut pdn-cnt" style={{margin:'4px 0 8px'}}>{[l.lama,sy?sy+' dokumen/syarat':'',l.url?'ada tautan Drive':'','diperbarui '+when(l.updatedAt)].filter(Boolean).join(' · ')}</p>
              <div className="row"><button type="button" className="btn sec sm" disabled={busy} onClick={()=>openL(k,l)}><Icon name="pencil" size={16}/> Edit</button>
                <button type="button" className="btn sec sm" disabled={busy} onClick={()=>pubLgk(k,l)}>{l.terbit?'Jadikan draf':'Terbitkan'}</button>
                <button type="button" className="btn sec sm" disabled={busy||i===0} aria-label={'Naikkan langkah '+l.judul} onClick={()=>moveLgk(k,l,-1)}><Up/></button>
                <button type="button" className="btn sec sm" disabled={busy||i===ls.length-1} aria-label={'Turunkan langkah '+l.judul} onClick={()=>moveLgk(k,l,1)}><Down/></button>
                <button type="button" className="btn dan sm" disabled={busy} onClick={()=>setDel({tipe:'lgk',x:l,k})}><Icon name="trash" size={16}/> Hapus</button></div></div>}):<p className="mut" style={{margin:0}}>Belum ada langkah di kategori ini.</p>}
            <button type="button" className="btn sec sm" style={{alignSelf:'flex-start'}} disabled={busy||atLMax} onClick={()=>openL(k)}><Icon name="plus" size={16}/> Tambah langkah</button>
            {atLMax&&<p className="mut pdn-cnt" style={{margin:0}}>Batas {LIM.LANGKAH_MAX} langkah per kategori tercapai.</p>}</div>}</section>})}</DataState>

    <Modal open={!!kf} title={kf?.id?'Edit kategori':'Tambah kategori'} onClose={closeForm} footer={<div className="row"><button type="button" className="btn sec sp" onClick={closeForm}>Batal</button><button type="button" className="btn sp" disabled={busy} onClick={saveKat}>Simpan</button></div>}>
      {kf&&<>{F('pk-j','Judul kategori *',<input id="pk-j" className="in" maxLength={LIM.JUDUL_KAT+20} value={kf.judul} aria-invalid={!!errs.judul||undefined} onChange={e=>{setKf(s=>({...s,judul:e.target.value}));setErrs({})}}/>,errs.judul,'Contoh: Seminar Hasil. '+kf.judul.trim().length+'/'+LIM.JUDUL_KAT)}
        <Checkbox checked={kf.terbit} onChange={v=>setKf(s=>({...s,terbit:v}))} label="Terbitkan (terlihat oleh mahasiswa)"/>
        <p className="mut" style={{fontSize:'var(--fs-xs)',margin:'8px 0 0'}}>Selama draf, kategori dan semua langkahnya tidak terlihat oleh mahasiswa.</p></>}</Modal>

    <Modal open={!!lf} size="lg" title={lf?.id?'Edit langkah':'Tambah langkah'} onClose={closeForm} footer={<div className="row"><button type="button" className="btn sec sp" onClick={closeForm}>Batal</button><button type="button" className="btn sp" disabled={busy} onClick={saveLgk}>Simpan</button></div>}>
      {lf&&<>{F('pl-j','Judul langkah *',<input id="pl-j" className="in" value={lf.judul} aria-invalid={!!errs.judul||undefined} onChange={e=>setL('judul')(e.target.value)}/>,errs.judul,lf.judul.trim().length+'/'+LIM.JUDUL)}
        {F('pl-i','Penjelasan *',<textarea id="pl-i" className="in" rows={7} value={lf.isi} aria-invalid={!!errs.isi||undefined} onChange={e=>setL('isi')(e.target.value)}/>,errs.isi,lf.isi.trim().length+'/'+LIM.ISI)}
        {F('pl-s','Dokumen atau syarat yang dibutuhkan (opsional)',<textarea id="pl-s" className="in" rows={4} value={lf.syarat} aria-invalid={!!errs.syarat||undefined} onChange={e=>setL('syarat')(e.target.value)}/>,errs.syarat,'Satu per baris. '+lf.syarat.trim().length+'/'+LIM.SYARAT)}
        {F('pl-l','Perkiraan lama (opsional)',<input id="pl-l" className="in" value={lf.lama} aria-invalid={!!errs.lama||undefined} onChange={e=>setL('lama')(e.target.value)}/>,errs.lama,'Contoh: 1–2 minggu')}
        {F('pl-u','Tautan Google Drive (opsional)',<input id="pl-u" className="in" type="url" inputMode="url" value={lf.url} aria-invalid={!!errs.url||undefined} onChange={e=>setL('url')(e.target.value)}/>,errs.url,'Hanya tautan https dari drive.google.com atau docs.google.com.')}
        <Checkbox checked={lf.terbit} onChange={v=>setLf(s=>({...s,terbit:v}))} label="Terbitkan langkah ini"/>
        <p className="mut" style={{fontSize:'var(--fs-xs)',margin:'8px 0 0'}}>Langkah baru tampil ke mahasiswa bila langkah dan kategorinya sama-sama terbit.</p></>}</Modal>

    <ConfirmDialog open={askClose} title="Buang perubahan?" confirmLabel="Buang" cancelLabel="Lanjut mengisi" onCancel={()=>setAskClose(false)} onConfirm={()=>{setAskClose(false);setKf(null);setLf(null)}} text="Isian yang belum disimpan akan hilang."/>
    <ConfirmDialog open={!!del} title={dv?.tipe==='kat'?'Hapus kategori?':'Hapus langkah?'} confirmLabel="Hapus" busy={busy} autoFocusCancel onCancel={()=>setDel(null)} onConfirm={doDel}
      text={dv?<><b style={{overflowWrap:'anywhere'}}>{dv.x.judul}</b>{dv.tipe==='kat'?<> beserta {stepsOf(dv.x.id).length} langkah di dalamnya akan dihapus permanen dan tidak bisa dikembalikan. Jika hanya ingin menyembunyikan dari mahasiswa, pakai Jadikan draf.</>:<> akan dihapus permanen dan tidak bisa dikembalikan. Jika hanya ingin menyembunyikan, pakai Jadikan draf.</>} Penghapusan dicatat di Audit log.</>:''}/>
  </div>}

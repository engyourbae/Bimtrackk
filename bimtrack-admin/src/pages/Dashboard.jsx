import {PageHead,DataState,EmptyState,when} from '../shared/ui';
import {useAdminCols,ds} from '../useAdmin';
import {useCounts} from '../counts';
import {StatSk,LineSk,actLabel} from '../common';
/** Dashboard: tiap bagian punya status memuat/kosong/galat sendiri (akun · jumlah data · aktivitas), jadi satu galat tidak menggagalkan yang lain. */
export default function Dashboard({uid}){
  const a=useAdminCols(['reqs'],uid),b=useAdminCols(['act'],uid),c=useCounts(uid),reqs=a.d.reqs||[],act=b.d.act||[],n=s=>reqs.filter(r=>r.status===s).length;
  return <div className="stack"><PageHead title="Dashboard Admin" sub="Ringkasan akun dan aktivitas terbaru"/>
    <DataState {...ds(a)} label="Memuat ringkasan akun" skeleton={<StatSk/>} compact>
      <div className="grid">{[['Total akun',reqs.length],['Disetujui',n('approved')],['Pending',n('pending')],['Ditolak',n('rejected')]].map(([l,v])=><div className="card stat" key={l}><span className="mut">{l}</span><b>{v}</b></div>)}</div></DataState>
    <section className="card" aria-label="Data tersimpan"><div className="row"><h2 className="sp">Data tersimpan</h2>{c.status==='ready'&&<button type="button" className="btn ghost sm" disabled={c.busy} onClick={c.refresh}>{c.busy?'Menghitung…':'Hitung ulang'}</button>}</div>
      <DataState status={c.status} onRetry={c.refresh} label="Menghitung data" skeleton={<LineSk/>} compact>
        <p className="mut" style={{margin:'6px 0 0'}}>{Object.entries(c.v||{}).map(([k,v])=>k+': '+v).join(' · ')}{c.bad?' · '+c.bad+' koleksi gagal dihitung':''}</p>
        <p className="mut" style={{fontSize:'var(--fs-xs)',margin:'6px 0 0'}}>Dihitung {c.t?new Date(c.t).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'}):'-'}{c.failed?'. Hitung ulang gagal; angka di atas dari hitungan sebelumnya.':'. Disimpan 10 menit agar tidak memakai kuota baca tiap dibuka.'}</p></DataState></section>
    <section className="card" aria-label="Aktivitas terbaru"><h2>Aktivitas terbaru</h2>
      <DataState {...ds(b)} label="Memuat aktivitas" skeleton={<LineSk/>} compact isEmpty={!act.length} empty={<EmptyState compact title="Belum ada aktivitas" text="Tindakan administrator akan tercatat di sini."/>}>
        {act.slice(0,8).map(x=><p key={x.id} style={{margin:'6px 0'}}><b>{actLabel(x.action)}</b> {x.nim||''}<br/><span className="mut" style={{fontSize:'.8rem'}}>{when(x.createdAt)}</span></p>)}</DataState></section></div>}

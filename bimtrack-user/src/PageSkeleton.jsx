// Kerangka skeleton: dipakai saat profil/data dimuat. Bentuknya meniru halaman asli (kelas yang sama dengan Crud/Dash/Journey)
// supaya isi menggantikan skeleton tanpa lompatan tata letak.
import {Skeleton,PageHead} from './shared/ui';

/** Satu kotak daftar (meniru .cc di Crud). */
export const CardSk=()=><div className="card cc" aria-hidden="true"><div className="cc-h"><span className="cc-t sk-t"><Skeleton w="88%" h={14}/><Skeleton w="56%" h={14}/></span></div>
  <div className="cc-b"><Skeleton w={92} h={22} r={11}/></div><div className="cc-m"><Skeleton w="72%" h={12}/></div></div>;

/** Satu kotak galeri (meniru .gal-c di Crud). */
export const GalSk=()=><div className="gal-w" aria-hidden="true"><div className="gal-c"><span className="gal-i sk"/><div className="gal-t"><Skeleton w="86%" h={14}/><Skeleton w="60%" h={12}/></div></div></div>;

/** Isi daftar Crud saat data belum datang. view: 'gallery' memakai grid galeri, selainnya grid kotak. */
export const ListSkeleton=({view})=>view==='gallery'
  ?<div className="gal" aria-hidden="true">{Array.from({length:4},(_,i)=><GalSk key={i}/>)}</div>
  :<div className="crud-g" aria-hidden="true">{Array.from({length:4},(_,i)=><CardSk key={i}/>)}</div>;

export const DashSkeleton=()=><div aria-hidden="true"><div className="greet"><Skeleton w="55%" h={32}/></div><div className="dash"><div className="dash-col"><Skeleton h={130} r={16}/><Skeleton h={84} r={16}/><Skeleton h={260} r={16}/></div><div className="dash-col"><Skeleton h={160} r={16}/><Skeleton h={160} r={16}/></div></div></div>;

/** Ringkasan Bimbingan: pilihan cakupan + tombol + daftar tersimpan. */
export const SummarySk=()=><div aria-hidden="true"><div className="fld"><Skeleton h={48} r={12}/></div><div style={{margin:'0 0 12px'}}><Skeleton h={48} r={12}/></div><h2 style={{marginTop:18}}>Tersimpan</h2><div className="stack"><Skeleton h={56} r={14}/><Skeleton h={56} r={14}/></div></div>;
/** CSV dan Backup: pilihan data, pratinjau, tombol. */
export const ExportSk=()=><div aria-hidden="true"><div className="fld"><Skeleton h={48} r={12}/></div><div className="fld"><Skeleton h={48} r={12}/></div><div className="card"><Skeleton w="40%" h={14}/><div style={{height:10}}/><Skeleton h={14}/><div style={{height:8}}/><Skeleton w="90%" h={14}/><div style={{height:8}}/><Skeleton w="75%" h={14}/></div><Skeleton h={48} r={12}/></div>;
/** Hasil pencarian: beberapa baris kartu. */
export const SearchSk=()=><div className="stack" aria-hidden="true">{Array.from({length:3},(_,i)=><div className="card" key={i}><div className="row"><span style={{flex:1}}><Skeleton w="70%" h={16}/></span><Skeleton w={72} h={22} r={11}/></div><div style={{height:8}}/><Skeleton w="30%" h={12}/></div>)}</div>;
/** Kartu judul skripsi + daftar tahapan pra-skripsi. */
export const SkripsiSk=()=><div className="stack" aria-hidden="true"><div className="card"><Skeleton w="35%" h={14}/><div style={{height:12}}/><Skeleton h={18}/><div style={{height:8}}/><Skeleton w="80%" h={18}/></div><div className="card"><Skeleton w="45%" h={14}/><div style={{height:12}}/><Skeleton h={44} r={12}/><div style={{height:8}}/><Skeleton h={44} r={12}/><div style={{height:8}}/><Skeleton h={44} r={12}/></div></div>;
/** Pengaturan: kartu profil + kartu pengaturan. */
export const SettingsSk=()=><div className="stack" aria-hidden="true"><div className="card"><Skeleton w="50%" h={18}/><div style={{height:10}}/><Skeleton w="70%" h={12}/><div style={{height:6}}/><Skeleton w="60%" h={12}/></div><Skeleton h={180} r={16}/><Skeleton h={120} r={16}/></div>;

// Judul halaman bersifat tetap (bukan data), jadi tampil asli; hanya tombol dan isi yang berupa skeleton.
const HeadSk=({title,sub,act=true})=><header className="pagehead"><div><h1>{title}</h1>{sub&&<p>{sub}</p>}</div>{act&&<div className="pagehead-act" aria-hidden="true"><Skeleton w={126} h={44} r={12}/></div>}</header>;
const ToolbarSk=({views})=><div className="toolbar" aria-hidden="true"><div className="search"><Skeleton h={44} r={12}/></div><Skeleton w={96} h={44} r={12}/><Skeleton w={104} h={44} r={12}/>{views&&<Skeleton w={views===3?236:176} h={44} r={12}/>}</div>;
const TabSk=({w=150,cls})=><div className={cls} style={cls?undefined:{marginBottom:'var(--s3)'}} aria-hidden="true"><Skeleton w={w} h={44} r={12}/></div>;

const ARSIP=['bim','rev','dok','bkt','jjk']; // halaman dengan tab Aktif | Arsip
const VIEWS={bkt:2,dok:2,jjk:2};            // halaman dengan pilihan tampilan di toolbar

/** Kerangka halaman aktif sesuai rute. label = judul menu halaman itu. */
export default function PageSkeleton({page,label}){
  let body;
  if(page==='home')body=<DashSkeleton/>;
  else if(page==='prog')body=<div><PageHead title="Perjalanan Skripsi"/><SkripsiSk/><div className="stack" style={{marginTop:'var(--s4)'}}><Skeleton h={140} r={16}/><Skeleton h={170} r={16}/><Skeleton h={170} r={16}/></div></div>;
  else if(page==='rin')body=<div><PageHead title="Laporan Bimbingan" sub="Ringkasan untuk dosen, ekspor CSV, dan cadangan data"/><TabSk w={260} cls="subtabs"/><SummarySk/></div>;
  else if(page==='csv')body=<div><PageHead title="Laporan Bimbingan" sub="Ringkasan untuk dosen, ekspor CSV, dan cadangan data"/><TabSk w={260} cls="subtabs"/><ExportSk/></div>;
  else if(page==='cari')body=<div><h1>Pencarian</h1><Skeleton h={48} r={12}/><div style={{height:12}}/><SearchSk/></div>;
  else if(page==='set')body=<div><PageHead title="Pengaturan" sub="Profil, tampilan, dan keamanan akun"/><SettingsSk/></div>;
  else if(ARSIP.includes(page))body=<div><HeadSk title={label}/><TabSk/><ToolbarSk views={VIEWS[page]}/><ListSkeleton view={page==='bkt'?'gallery':'list'}/></div>;
  else if(page==='jdw'||page==='run')body=<div><PageHead title="Jadwal Bimbingan" sub="Pertemuan dengan dosen dan rundown kegiatan skripsimu"/><TabSk w={220} cls="subtabs"/>
    {page==='jdw'?<div className="stack"><Skeleton h={150} r={16}/><Skeleton h={260} r={16}/></div>:<><ToolbarSk views={3}/><ListSkeleton view="list"/></>}</div>;
  else body=<div><PageHead title={label||'Memuat'}/><div className="stack"><Skeleton h={140} r={16}/><Skeleton h={170} r={16}/></div></div>;
  return <div role="status" aria-label="Memuat halaman">{body}</div>}

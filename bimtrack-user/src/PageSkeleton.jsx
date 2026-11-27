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
  ?<div className="gal" role="status" aria-label="Memuat data">{Array.from({length:4},(_,i)=><GalSk key={i}/>)}</div>
  :<div className="crud-g" role="status" aria-label="Memuat data">{Array.from({length:4},(_,i)=><CardSk key={i}/>)}</div>;

export const DashSkeleton=()=><div><div className="greet"><Skeleton w="55%" h={32}/></div><div className="dash"><div className="dash-col"><Skeleton h={130} r={16}/><Skeleton h={84} r={16}/><Skeleton h={260} r={16}/></div><div className="dash-col"><Skeleton h={160} r={16}/><Skeleton h={160} r={16}/></div></div></div>;

// Judul halaman bersifat tetap (bukan data), jadi tampil asli; hanya tombol dan isi yang berupa skeleton.
const HeadSk=({title,sub,act=true})=><header className="pagehead"><div><h1>{title}</h1>{sub&&<p>{sub}</p>}</div>{act&&<div className="pagehead-act" aria-hidden="true"><Skeleton w={126} h={44} r={12}/></div>}</header>;
const ToolbarSk=({views})=><div className="toolbar" aria-hidden="true"><div className="search"><Skeleton h={44} r={12}/></div><Skeleton w={96} h={44} r={12}/><Skeleton w={104} h={44} r={12}/>{views&&<Skeleton w={views===3?236:176} h={44} r={12}/>}</div>;
const TabSk=({w=150,cls})=><div className={cls} style={cls?undefined:{marginBottom:'var(--s3)'}} aria-hidden="true"><Skeleton w={w} h={44} r={12}/></div>;

const ARSIP=['bim','rev','dok','bkt']; // halaman dengan tab Aktif | Arsip
const VIEWS={bkt:2,dok:2};            // halaman dengan pilihan tampilan di toolbar

/** Kerangka halaman aktif sesuai rute. label = judul menu halaman itu. */
export default function PageSkeleton({page,label}){
  let body;
  if(page==='home')body=<DashSkeleton/>;
  else if(page==='prog')body=<div><PageHead title="Perjalanan Skripsi"/><div className="stack"><Skeleton h={140} r={16}/><Skeleton h={170} r={16}/><Skeleton h={170} r={16}/></div></div>;
  else if(ARSIP.includes(page))body=<div><HeadSk title={label}/><TabSk/><ToolbarSk views={VIEWS[page]}/><ListSkeleton view={page==='bkt'?'gallery':'list'}/></div>;
  else if(page==='jdw'||page==='run')body=<div><PageHead title="Jadwal Bimbingan" sub="Pertemuan dengan dosen dan rundown kegiatan skripsimu"/><TabSk w={220} cls="subtabs"/>
    {page==='jdw'?<div className="stack"><Skeleton h={150} r={16}/><Skeleton h={260} r={16}/></div>:<><ToolbarSk views={3}/><ListSkeleton view="list"/></>}</div>;
  else body=<div><PageHead title={label||'Memuat'}/><div className="stack"><Skeleton h={140} r={16}/><Skeleton h={170} r={16}/></div></div>;
  return <div role="status" aria-label="Memuat halaman">{body}</div>}

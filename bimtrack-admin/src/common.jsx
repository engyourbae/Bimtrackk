import {Skeleton} from './shared/ui';
/** Skeleton daftar kartu; judul halaman tetap asli karena bukan data. */
export const ListSk=({n=3})=><div className="stack" aria-hidden="true">{Array.from({length:n},(_,i)=><div className="card" key={i}><Skeleton w="45%" h={18}/><div style={{height:10}}/><Skeleton w="80%" h={12}/><div style={{height:6}}/><Skeleton w="60%" h={12}/><div style={{height:12}}/><Skeleton w={110} h={44} r={12}/></div>)}</div>;
export const StatSk=()=><div className="grid" aria-hidden="true">{[0,1,2,3].map(i=><div className="card stat" key={i}><Skeleton w="50%" h={12}/><div style={{height:10}}/><Skeleton w={56} h={28}/></div>)}</div>;
export const LineSk=()=><div aria-hidden="true"><Skeleton h={12}/><div style={{height:8}}/><Skeleton w="85%" h={12}/></div>;
const ACT={approve:'Pendaftaran disetujui',reject:'Pendaftaran ditolak',enable_access:'Akses diaktifkan',revoke_access:'Akses dicabut',reset_password:'Reset sandi disetujui',admin_login:'Admin masuk',force_logout:'Keluarkan paksa'};
export const actLabel=a=>ACT[a]||a||'-';

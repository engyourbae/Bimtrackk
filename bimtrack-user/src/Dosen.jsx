import Crud from './Crud';
import {DSN,PERAN} from './config';
import {titleOf,cmpDosen,extraUrut,moveUrut,canMove} from './dosen';

/** Daftar Dosen dan Pejabat: pembimbing 1, 2, 3, …, penguji 1, 2, …, Kaprodi, Dekan, Rektor, dan peran bebas. Jumlah tidak dibatasi.
 *  Memakai Crud bersama (keadaan memuat/kosong/galat, pencarian, ekspor CSV, backup, pencarian global). Catatan pribadi; tidak ikut rumus progres. */
export default function Dosen({uid,autoNew,onAutoNew,openId,onOpenId}){
  return <Crud col="dosenPejabat" uid={uid} title="Dosen dan pejabat" heading="Dosen dan Pejabat" fields={DSN} titleKey="nama" titleOf={titleOf} subKeys={['nip','kontak']}
    sortFn={cmpDosen} extra={extraUrut} reorder={{key:'urut',plan:moveUrut,can:canMove}} defaults={()=>({peran:PERAN[0]})}
    autoNew={autoNew} onAutoNew={onAutoNew} openId={openId} onOpenId={onOpenId}/>}

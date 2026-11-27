import Crud from './Crud';
import {Badge} from './shared/ui';
import {JEJ,JEJ_TONE,JEJ_TAHAP} from './config';
import {todayStr} from '@shared/date';

/** Ringkasan di atas daftar: berapa kali ditolak, berapa kali disetujui. */
function Head({rows}){
  const n=t=>rows.filter(x=>x.tahap===t).length,ok=rows.filter(x=>['Outline disetujui','Metode penelitian disetujui','Judul skripsi'].includes(x.tahap)).length;
  if(!rows.length)return null;
  return <div className="mini"><Badge>Catatan {rows.length}</Badge><Badge tone="danger">Ditolak {n('Outline ditolak')}</Badge><Badge tone="warn">Direvisi {n('Outline direvisi')}</Badge><Badge tone="ok">Disetujui {ok}</Badge></div>}

/** Jejak Judul dan Outline: kenang-kenangan perjalanan dari pengajuan outline (termasuk yang ditolak) sampai judul skripsi.
 *  Catatan pribadi; TIDAK ikut rumus progres Bab I–V. Memakai Crud bersama, jadi otomatis punya keadaan memuat/kosong/galat,
 *  pencarian, filter, linimasa, ekspor CSV, backup, dan pencarian global. */
export default function Jejak({uid,autoNew,onAutoNew,openId,onOpenId}){
  return <Crud col="jejak" uid={uid} title="Jejak" heading="Jejak Judul dan Outline" fields={JEJ} titleKey="judul" subKeys={['tanggal','tahap','pihak']}
    statusKey="tahap" tones={JEJ_TONE} filters={[{key:'tahap',label:'Tahap',options:JEJ_TAHAP}]} range="tanggal" archivable views={['timeline','list']} timeKey="tanggal" sortLabels={['Terbaru','Terlama']}
    urlKey="url" defaults={()=>({tanggal:todayStr(),tahap:JEJ_TAHAP[0]})} header={rows=><Head rows={rows.filter(x=>!x.archived)}/>}
    autoNew={autoNew} onAutoNew={onAutoNew} openId={openId} onOpenId={onOpenId}/>}

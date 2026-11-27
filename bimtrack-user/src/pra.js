// Progres "Outline sampai Seminar Proposal" — murni (tanpa Firebase/React) agar bisa diuji unit.
// Sumber data: dokumen `skripsi/{uid}` yang diisi di halaman Perjalanan (tahapan pra-skripsi, config.js > PRA).
// Hanya tahap berstatus "selesai" yang dihitung (tahap "berjalan" ditampilkan tetapi belum menambah persen).
// Terpisah dari progres Bab I–V (progress.js tidak berubah).
import {PRA} from './config.js';

/** row = dokumen skripsi (atau null/undefined bila belum ada). */
export function calcPra(row,stages=PRA){
  const steps=stages.map(p=>{
    const s=row?.['st_'+p.k],status=s==='selesai'||s==='berjalan'?s:'belum';
    return{k:p.k,t:p.t,status,date:status==='selesai'?(row?.['tg_'+p.k]||''):''}});
  const done=steps.filter(x=>x.status==='selesai').length,total=steps.length;
  const current=steps.find(x=>x.status==='berjalan')||steps.find(x=>x.status==='belum')||null;
  return{pct:total?Math.round(100*done/total):0,done,total,steps,current,complete:total>0&&done===total};
}

// Rumus progres BIMTRACK — murni (tanpa Firebase/React) agar bisa diuji unit.
//  Progres bab (Bab I-V)  = 20% "sudah dibahas dosen" + 80% x rata-rata skor revisi & skor rundown bab itu (hanya yang ada datanya).
//  Skor revisi : Selesai dan disetujui 1 | Menunggu pemeriksaan 0,75 | Sedang dikerjakan 0,4 | Perlu revisi ulang 0,2 | Belum dikerjakan 0
//  Skor rundown: Selesai 1 | Berjalan 0,5 | Belum mulai 0
//  "Sudah dibahas": ada bimbingan berstatus Terlaksana untuk bab itu.
//  Progres keseluruhan = rata-rata kelima bab (bab tanpa data dihitung 0). Revisi/rundown tanpa bab Bab I-V tidak ikut dihitung.
import {BAB,ST} from './config.js';
import {diffDays,relDay} from '../../shared/date.js';
export const BABS=BAB.slice(0,5);
export const REV_SCORE={[ST[0]]:0,[ST[1]]:.4,[ST[2]]:.75,[ST[3]]:.2,[ST[4]]:1};
export const RUN_SCORE={'Belum mulai':0,'Berjalan':.5,'Selesai':1};
const avg=a=>a.reduce((s,x)=>s+x,0)/a.length;
const openRev=x=>x.status!==ST[4],openRun=x=>x.status!=='Selesai';

export function calcProgress({bimbingan=[],revisi=[],rundown=[],today}){
  const babs=BABS.map(bab=>{
    const rv=revisi.filter(x=>x.bab===bab),rn=rundown.filter(x=>x.bab===bab),bm=bimbingan.filter(x=>x.bab===bab&&x.status==='Terlaksana');
    const parts=[rv.length?avg(rv.map(x=>REV_SCORE[x.status]??0)):null,rn.length?avg(rn.map(x=>RUN_SCORE[x.status]??0)):null].filter(v=>v!==null);
    const discussed=bm.length>0,pct=Math.round(20*discussed+80*(parts.length?avg(parts):0));
    const late=rv.filter(x=>openRev(x)&&x.deadline&&x.deadline<today).length+rn.filter(x=>openRun(x)&&x.deadline&&x.deadline<today).length;
    const redo=rv.filter(x=>x.status===ST[3]).length,waiting=rv.filter(x=>x.status===ST[2]).length;
    let status;
    if(!(discussed||rv.length||rn.length))status='Belum dimulai';
    else if(pct>=100)status='Selesai';
    else if(late+redo>0)status='Perlu perhatian';
    else if(waiting>0&&rv.every(x=>x.status===ST[2]||x.status===ST[4]))status='Siap diperiksa';
    else status='Dalam proses';
    return{bab,pct,status,discussed,late,redo,waiting,rev:{total:rv.length,done:rv.filter(x=>x.status===ST[4]).length},run:{total:rn.length,done:rn.filter(x=>x.status==='Selesai').length}};
  });
  return{overall:Math.round(avg(babs.map(b=>b.pct))),babs,outside:{rev:revisi.filter(x=>!BABS.includes(x.bab)).length,run:rundown.filter(x=>!BABS.includes(x.bab)).length}};
}
export const STATUS_TONE={'Selesai':'ok','Siap diperiksa':'info','Dalam proses':'neutral','Perlu perhatian':'danger','Belum dimulai':'neutral'};

const PRIO={Tinggi:0,Sedang:1,Rendah:2};
/** Revisi yang belum selesai, diurutkan: terlambat dulu, lalu deadline terdekat, lalu prioritas. */
export function urgentRevisi(revisi,today,limit=3){
  return revisi.filter(openRev).map(x=>({...x,_d:x.deadline?diffDays(x.deadline,today):null}))
    .filter(x=>(x._d!==null&&x._d<=7)||x.prioritas==='Tinggi'||x.status===ST[3])
    .sort((a,b)=>(a._d??999)-(b._d??999)||(PRIO[a.prioritas]??1)-(PRIO[b.prioritas]??1)).slice(0,limit);
}
/** Satu "langkah berikutnya" paling penting. */
export function nextStep({bimbingan=[],revisi=[],jadwal=[],rundown=[],today}){
  const lateRev=revisi.filter(x=>openRev(x)&&x.deadline&&x.deadline<today).sort((a,b)=>a.deadline<b.deadline?-1:1)[0];
  if(lateRev)return{tone:'danger',title:`Selesaikan revisi ${lateRev.bab||''}`.trim(),detail:`${(lateRev.catatan||'').slice(0,90)} · terlambat ${-diffDays(lateRev.deadline,today)} hari`,to:'rev',cta:'Buka revisi'};
  const lateRun=rundown.filter(x=>openRun(x)&&x.deadline&&x.deadline<today).sort((a,b)=>a.deadline<b.deadline?-1:1)[0];
  if(lateRun)return{tone:'danger',title:`Kejar kegiatan "${lateRun.nama}"`,detail:`Deadline terlewat ${-diffDays(lateRun.deadline,today)} hari`,to:'run',cta:'Buka rundown'};
  const redo=revisi.find(x=>x.status===ST[3]);
  if(redo)return{tone:'warn',title:`Perbaiki ulang revisi ${redo.bab||''}`.trim(),detail:(redo.catatan||'').slice(0,100),to:'rev',cta:'Buka revisi'};
  const jd=jadwal.filter(x=>x.tanggal>=today&&!['Dibatalkan','Selesai'].includes(x.status)).sort((a,b)=>(a.tanggal+(a.jam||''))<(b.tanggal+(b.jam||''))?-1:1)[0];
  if(jd&&diffDays(jd.tanggal,today)<=2)return{tone:'info',title:`Siapkan pertemuan dengan ${jd.dosen||'dosen'}`,detail:`${relDay(jd.tanggal,today)}${jd.jam?' pukul '+jd.jam:''} · ${jd.agenda||''}`,to:'jdw',cta:'Lihat jadwal'};
  const soon=[...revisi.filter(openRev).map(x=>({d:x.deadline,t:`revisi ${x.bab||''}`.trim(),to:'rev'})),...rundown.filter(openRun).map(x=>({d:x.deadline,t:`kegiatan "${x.nama}"`,to:'run'}))].filter(x=>x.d&&diffDays(x.d,today)<=7).sort((a,b)=>a.d<b.d?-1:1)[0];
  if(soon)return{tone:'warn',title:`Kerjakan ${soon.t}`,detail:`Deadline ${relDay(soon.d,today).toLowerCase()}`,to:soon.to,cta:'Buka'};
  const go=revisi.filter(openRev).sort((a,b)=>(PRIO[a.prioritas]??1)-(PRIO[b.prioritas]??1))[0];
  if(go)return{tone:'info',title:`Lanjutkan revisi ${go.bab||''}`.trim(),detail:(go.catatan||'').slice(0,100),to:'rev',cta:'Buka revisi'};
  if(!bimbingan.length)return{tone:'info',title:'Catat bimbingan pertamamu',detail:'Mulai dari pertemuan terakhir dengan dosen pembimbing.',to:'bim/baru',cta:'Tambah bimbingan'};
  return{tone:'ok',title:'Semua tertata untuk saat ini',detail:'Tidak ada revisi atau kegiatan yang mendesak. Rencanakan pertemuan berikutnya.',to:'jdw/baru',cta:'Tambah jadwal'};
}

// Logika jadwal murni (tanpa Firebase/React) agar bisa diuji unit.
//  Status "aktif" = pertemuan yang masih akan/seharusnya berlangsung. Riwayat = sudah lewat tanggalnya atau berstatus selesai/dibatalkan/dijadwalkan ulang.
import {addDays,diffDays,toIso,parseDate,isTime} from '../../shared/date.js';
export const AKTIF=['Direncanakan','Menunggu konfirmasi','Dikonfirmasi'];
export const SELESAI=['Selesai','Dibatalkan','Dijadwalkan ulang'];
export const isActive=x=>!SELESAI.includes(x.status);
export const isPast=(x,today)=>(!!x.tanggal&&x.tanggal<today)||SELESAI.includes(x.status);
const key=x=>(x.tanggal||'')+' '+(isTime(x.jam)?x.jam:'99:99');
export const byWhen=(a,b)=>key(a)<key(b)?-1:key(a)>key(b)?1:0;
/** Senin sebagai awal minggu. */
export const weekStart=s=>{const d=parseDate(s)||new Date(),off=(d.getDay()+6)%7;return addDays(toIso(d),-off)};
export const weekDays=start=>Array.from({length:7},(_,i)=>addDays(start,i));
/** Pengingat: stale = tanggal sudah lewat tetapi status belum selesai/dibatalkan; soon = hari ini atau besok. */
export function reminders(rows,today){
  const act=rows.filter(isActive),stale=act.filter(x=>x.tanggal&&x.tanggal<today).sort((a,b)=>byWhen(b,a)),
    soon=act.filter(x=>x.tanggal&&diffDays(x.tanggal,today)>=0&&diffDays(x.tanggal,today)<=1).sort(byWhen);
  return{stale,soon}}
/** Rencana notifikasi perangkat: pertemuan aktif ber-jam dalam 24 jam ke depan. lead = menit sebelum mulai. */
export function notifyPlan(rows,nowMs,lead=30){
  const out=[];
  for(const x of rows){if(!isActive(x)||!x.tanggal||!isTime(x.jam))continue;const d=parseDate(x.tanggal);if(!d)continue;
    const[h,m]=x.jam.split(':').map(Number),ev=new Date(d.getFullYear(),d.getMonth(),d.getDate(),h,m).getTime();
    if(ev<=nowMs||ev>nowMs+864e5)continue;
    out.push({id:x.id+'@'+x.tanggal+' '+x.jam,at:Math.max(nowMs,ev-lead*6e4),eventAt:ev,title:x.agenda||'Bimbingan',body:`${x.jam}${x.dosen?' · '+x.dosen:''}${x.lokasi?' · '+x.lokasi:''}`})}
  return out.sort((a,b)=>a.at-b.at)}

// Berkas kalender (.ics) untuk jadwal bimbingan. Murni (tanpa Firebase/React) agar bisa diuji unit.
//  Waktu ditulis "mengambang" (tanpa zona): kalender HP membacanya sebagai waktu lokal perangkat, sama dengan cara jadwal diisi di BIMTRACK.
//  Jadwal ber-jam  → acara 1 jam + alarm 30 menit sebelum mulai.
//  Jadwal tanpa jam → acara seharian, TANPA alarm (tidak ada jam acuan untuk alarm).
import {parseDate,isTime,toIso} from '../../shared/date.js';
import {isActive} from './schedule.js';
const p2=n=>String(n).padStart(2,'0');
const D=iso=>iso.replace(/-/g,'');
const L=(y,mo,d,h,mi)=>`${y}${p2(mo)}${p2(d)}T${p2(h)}${p2(mi)}00`;
const utcStamp=ms=>{const d=new Date(ms);return `${d.getUTCFullYear()}${p2(d.getUTCMonth()+1)}${p2(d.getUTCDate())}T${p2(d.getUTCHours())}${p2(d.getUTCMinutes())}${p2(d.getUTCSeconds())}Z`};
/** Escape nilai teks sesuai RFC 5545. */
export const icsText=t=>String(t??'').replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\r?\n/g,'\\n');
/** Lipat baris > 75 byte UTF-8 (lanjutan diawali satu spasi). */
export function fold(line){
  const enc=new TextEncoder(),out=[];let cur='',bytes=0,limit=75;
  for(const ch of line){const b=enc.encode(ch).length;if(bytes+b>limit){out.push(cur);cur=' ';bytes=1;limit=75}cur+=ch;bytes+=b}
  out.push(cur);return out.join('\r\n')}
/** Jadwal yang layak diekspor: aktif, bertanggal valid, dan belum lewat. */
export const exportable=(rows,today)=>rows.filter(x=>isActive(x)&&x.tanggal&&parseDate(x.tanggal)&&x.tanggal>=today).sort((a,b)=>(a.tanggal+(a.jam||''))<(b.tanggal+(b.jam||''))?-1:1);
function vevent(x,nowMs){
  const d=parseDate(x.tanggal),timed=isTime(x.jam),seq=Math.max(0,Math.floor((x.updatedAt?.seconds||0)/60)%2147483647);
  const desc=[x.dosen&&'Dosen: '+x.dosen,x.metode&&'Metode: '+x.metode,x.status&&'Status: '+x.status,x.catatan].filter(Boolean).join('\n');
  const o=['BEGIN:VEVENT','UID:'+x.id+'@bimtrack.app','DTSTAMP:'+utcStamp(nowMs),'SEQUENCE:'+seq];
  if(timed){const[h,m]=x.jam.split(':').map(Number),s=new Date(d.getFullYear(),d.getMonth(),d.getDate(),h,m),e=new Date(s.getTime()+36e5);
    o.push('DTSTART:'+L(s.getFullYear(),s.getMonth()+1,s.getDate(),s.getHours(),s.getMinutes()),'DTEND:'+L(e.getFullYear(),e.getMonth()+1,e.getDate(),e.getHours(),e.getMinutes()))}
  else{const n=new Date(d.getFullYear(),d.getMonth(),d.getDate()+1);o.push('DTSTART;VALUE=DATE:'+D(x.tanggal),'DTEND;VALUE=DATE:'+D(toIso(n)))}
  o.push('SUMMARY:'+icsText('Bimbingan: '+(x.agenda||'Pertemuan')));
  if(x.lokasi)o.push('LOCATION:'+icsText(x.lokasi));
  if(desc)o.push('DESCRIPTION:'+icsText(desc));
  o.push('STATUS:'+(x.status==='Dikonfirmasi'?'CONFIRMED':'TENTATIVE'));
  if(timed)o.push('BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+icsText('Bimbingan 30 menit lagi: '+(x.agenda||'Pertemuan')),'TRIGGER:-PT30M','END:VALARM');
  o.push('END:VEVENT');return o}
/** Susun isi berkas .ics (CRLF, baris dilipat) dari daftar jadwal. */
export function buildIcs(rows,nowMs=Date.now()){
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//BIMTRACK//Jadwal Bimbingan//ID','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:BIMTRACK',...rows.flatMap(x=>vevent(x,nowMs)),'END:VCALENDAR'];
  return lines.map(fold).join('\r\n')+'\r\n'}

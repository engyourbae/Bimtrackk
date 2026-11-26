// Utilitas tanggal berbasis zona waktu PERANGKAT (bukan UTC), format ISO 'YYYY-MM-DD' dan 'HH:MM'.
const pad=n=>String(n).padStart(2,'0');
export const BULAN=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
export const BULAN_S=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
export const HARI=['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
export const toIso=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
export const todayStr=()=>toIso(new Date());
export const parseDate=s=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s||'');if(!m)return null;const d=new Date(+m[1],+m[2]-1,+m[3]);return d.getMonth()===+m[2]-1&&d.getDate()===+m[3]?d:null};
export const addDays=(s,n)=>{const d=parseDate(s)||new Date();d.setDate(d.getDate()+n);return toIso(d)};
const utc=s=>{const d=parseDate(s);return d?Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()):NaN};
export const diffDays=(a,b)=>Math.round((utc(a)-utc(b))/864e5);
export const isTime=s=>/^([01]\d|2[0-3]):[0-5]\d$/.test(s||'');
export const FORMATS={panjang:'25 November 2026',sedang:'25 Nov 2026',angka:'25/11/2026'};
const FK='bimtrack-datefmt';
export const getDateFormat=()=>{let f=null;try{f=localStorage.getItem(FK)}catch{}return FORMATS[f]?f:'sedang'};
export const setDateFormat=f=>{try{localStorage.setItem(FK,f)}catch{}};
export function fmtDate(s,f=getDateFormat()){const d=parseDate(s);if(!d)return s||'';const D=d.getDate(),M=d.getMonth(),Y=d.getFullYear();
  return f==='panjang'?`${D} ${BULAN[M]} ${Y}`:f==='angka'?`${pad(D)}/${pad(M+1)}/${Y}`:`${D} ${BULAN_S[M]} ${Y}`}
/** Label relatif: "Hari ini", "Besok", "3 hari lagi", "2 hari lalu". */
export function relDay(s,now=todayStr()){const n=diffDays(s,now);if(isNaN(n))return '';return n===0?'Hari ini':n===1?'Besok':n===-1?'Kemarin':n>0?`${n} hari lagi`:`${-n} hari lalu`}
/** Sel kalender sebuah bulan, minggu mulai Senin. */
export function monthGrid(y,m){const off=(new Date(y,m,1).getDay()+6)%7,dim=new Date(y,m+1,0).getDate(),total=Math.ceil((off+dim)/7)*7,out=[];
  for(let i=0;i<total;i++){const d=new Date(y,m,1-off+i);out.push({date:toIso(d),day:d.getDate(),inMonth:d.getMonth()===m})}return out}
/** Waktu relatif dari detik epoch: "baru saja", "5 menit lalu", "3 jam lalu", atau tanggal. */
export function relTime(sec,nowMs=Date.now()){const d=Math.floor(nowMs/1000-sec);if(!isFinite(d))return '';if(d<60)return 'baru saja';if(d<3600)return `${Math.floor(d/60)} menit lalu`;if(d<86400)return `${Math.floor(d/3600)} jam lalu`;
  if(d<172800)return 'kemarin';return fmtDate(toIso(new Date(sec*1000)))}
export const sapaan=(h=new Date().getHours())=>h<11?'Selamat pagi':h<15?'Selamat siang':h<18?'Selamat sore':'Selamat malam';
export const hariPanjang=(s=todayStr())=>{const d=parseDate(s);return d?`${HARI[d.getDay()]}, ${fmtDate(s,'panjang')}`:''};

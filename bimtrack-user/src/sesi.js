// Sesi tunggal per akun (user app). Perangkat yang baru masuk menang; perangkat lama keluar otomatis saat online.
// Dokumen sesi/{uid}: {deviceId, startedAt (serverTimestamp), kickedAt?, kickBy?}. kickedAt/kickBy hanya bisa ditulis admin (lihat firestore.rules).
const K='bimtrack-device';
const rand=()=>{const a=new Uint8Array(16);(crypto||window.crypto).getRandomValues(a);return[...a].map(x=>x.toString(16).padStart(2,'0')).join('')};
/** ID acak perangkat ini, disimpan di localStorage (dibagi antar tab peramban yang sama). */
let mem=null;
export function deviceId(){
  if(mem)return mem;
  try{let v=localStorage.getItem(K);if(!v||v.length<8){v=rand();localStorage.setItem(K,v)}return mem=v}catch{return mem='tmp-'+rand()}}
export const MSG_OTHER='Akun dibuka di perangkat lain. Kamu keluar otomatis dari perangkat ini.';
export const MSG_KICK='Sesi dihentikan oleh administrator. Hubungi admin bila ini tidak seharusnya.';

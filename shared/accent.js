// Pilihan warna aplikasi (aksen). Disimpan per perangkat di localStorage; default Navy (tanpa atribut data-accent).
// Hanya dipanggil oleh aplikasi user. Admin memakai identitas ochre sendiri dan tidak membaca pilihan ini.
export const ACCENTS=[
  {id:'navy',label:'Navy',sw:'#172B3A'},
  {id:'hijau',label:'Hijau',sw:'#1F5A43'},
  {id:'burgundy',label:'Burgundy',sw:'#7A1F33'},
  {id:'teal',label:'Teal',sw:'#14595E'},
  {id:'ungu',label:'Ungu',sw:'#5B3A73'},
  {id:'biru',label:'Biru',sw:'#1F4E8C'}];
const K='bimtrack-accent',IDS=ACCENTS.map(a=>a.id);
const safe=f=>{try{return f()}catch{return null}};
export const getAccent=()=>{const a=safe(()=>localStorage.getItem(K));return IDS.includes(a)?a:'navy'};
export function applyAccent(a=getAccent()){const r=document.documentElement;if(a==='navy'||!IDS.includes(a))delete r.dataset.accent;else r.dataset.accent=a}
export function setAccent(a){if(!IDS.includes(a))return;safe(()=>localStorage.setItem(K,a));applyAccent(a)}

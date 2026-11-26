// Mengurai tautan Google Drive/Docs untuk pratinjau. Murni (tanpa React/Firebase) agar bisa diuji.
// Pratinjau hanya tampil bila akun Google di peramban punya akses ke berkas itu.
const OK=/^https:\/\/(drive|docs)\.google\.com\//;
export const isDriveUrl=u=>OK.test(String(u||'').trim());
export function parseDrive(url){
  const u=String(url||'').trim();if(!isDriveUrl(u))return null;
  let m;
  if((m=u.match(/\/folders\/([\w-]+)/)))return{kind:'folder',id:m[1],preview:`https://drive.google.com/embeddedfolderview?id=${m[1]}#grid`,thumb:null};
  if((m=u.match(/docs\.google\.com\/(document|spreadsheets|presentation|forms)\/d\/([\w-]+)/)))return{kind:m[1],id:m[2],preview:`https://docs.google.com/${m[1]}/d/${m[2]}/preview`,thumb:`https://drive.google.com/thumbnail?id=${m[2]}&sz=w480`};
  if((m=u.match(/\/file\/d\/([\w-]+)/)||u.match(/[?&]id=([\w-]+)/)))return{kind:'file',id:m[1],preview:`https://drive.google.com/file/d/${m[1]}/preview`,thumb:`https://drive.google.com/thumbnail?id=${m[1]}&sz=w480`};
  return{kind:'other',id:null,preview:null,thumb:null};
}

// Logika murni Panduan Alur Perjalanan (ditulis admin, dibaca mahasiswa). Dipakai aplikasi admin dan user; tanpa React/Firebase agar bisa diuji.
// Batas di sini HARUS sama dengan firestore.rules (dijaga tes konsistensi). Batas jumlah (kategori/langkah) hanya ditegakkan di klien admin:
// aturan Firestore tidak bisa menghitung dokumen, jadi aturan hanya membatasi rentang `urutan`.
export const LIM={KATEGORI_MAX:12,LANGKAH_MAX:40,JUDUL_KAT:100,JUDUL:120,ISI:4000,SYARAT:1000,LAMA:60,URL:500};

const DRIVE=/^https:\/\/(drive|docs)\.google\.com\//;
/** Tautan harus https dan berasal dari Google Drive/Docs (sama seperti fitur lain dan aturan Firestore). */
export const isDrive=u=>DRIVE.test(String(u||'').trim());

const t=v=>String(v??'').trim();
/** Validasi formulir kategori. Mengembalikan {kolom: pesan}; objek kosong = valid. */
export function cekKategori(f){const e={},j=t(f.judul);
  if(!j)e.judul='Judul kategori wajib diisi';else if(j.length>LIM.JUDUL_KAT)e.judul='Judul kategori maksimal '+LIM.JUDUL_KAT+' karakter';
  return e}
/** Validasi formulir langkah. */
export function cekLangkah(f){const e={},j=t(f.judul),i=t(f.isi),s=t(f.syarat),l=t(f.lama),u=t(f.url);
  if(!j)e.judul='Judul langkah wajib diisi';else if(j.length>LIM.JUDUL)e.judul='Judul langkah maksimal '+LIM.JUDUL+' karakter';
  if(!i)e.isi='Penjelasan wajib diisi';else if(i.length>LIM.ISI)e.isi='Penjelasan maksimal '+LIM.ISI+' karakter';
  if(s.length>LIM.SYARAT)e.syarat='Dokumen/syarat maksimal '+LIM.SYARAT+' karakter';
  if(l.length>LIM.LAMA)e.lama='Perkiraan lama maksimal '+LIM.LAMA+' karakter';
  if(u){if(u.length>LIM.URL)e.url='Tautan maksimal '+LIM.URL+' karakter';else if(!isDrive(u))e.url='Harus tautan Google Drive/Docs (https://drive.google.com/…)'}
  return e}

/** Langkah tampil ke mahasiswa hanya bila langkah dan kategorinya sama-sama terbit. Disimpan sebagai `tampil` agar aturan Firestore bisa menyaring. */
export const tampilOf=(langkahTerbit,kategoriTerbit)=>langkahTerbit===true&&kategoriTerbit===true;

const cmp=(a,b)=>a===b?0:a<b?-1:1;
const secs=x=>x?.createdAt?.seconds??0;
/** Urutan tetap: `urutan`, lalu waktu dibuat, lalu id. */
export const byUrutan=(a,b)=>cmp(Number.isFinite(a.urutan)?a.urutan:1e9,Number.isFinite(b.urutan)?b.urutan:1e9)||cmp(secs(a),secs(b))||cmp(a.id||'',b.id||'');
export const sortU=rows=>[...rows].sort(byUrutan);
/** `urutan` untuk item baru: setelah yang terakhir. */
export const nextUrutan=rows=>Math.max(rows.length,rows.reduce((m,r)=>Number.isFinite(r.urutan)?Math.max(m,r.urutan):m,-1)+1);
/** Rencana tulis menggeser satu item (dir -1 naik, +1 turun): seluruh daftar dinomori ulang 0..n-1, hanya yang berubah dikembalikan. */
export function geser(rows,id,dir){const l=sortU(rows),i=l.findIndex(r=>r.id===id),j=i+dir;if(i<0||j<0||j>=l.length)return[];
  [l[i],l[j]]=[l[j],l[i]];return l.map((r,k)=>({id:r.id,urutan:k})).filter(p=>rows.find(r=>r.id===p.id).urutan!==p.urutan)}

/** ms dari Firestore Timestamp, objek {seconds}, atau angka (salinan offline). */
export const toMs=v=>v==null?0:typeof v==='number'?v:typeof v.toMillis==='function'?v.toMillis():Number.isFinite(v.seconds)?v.seconds*1000:0;

/** Susun pohon untuk mahasiswa: kategori terurut, tiap kategori berisi langkahnya (terurut). `diperbarui` = yang terbaru antara kategori dan langkah-langkahnya.
 *  Hanya kategori terbit dan langkah `tampil`; langkah yatim (kategorinya tidak ada atau draf) dibuang walau terbaca. */
export function susun(kategori,langkah){
  const ks=sortU((kategori||[]).filter(k=>k.terbit===true));
  return ks.map(k=>{const ls=sortU((langkah||[]).filter(l=>l.kategoriId===k.id&&l.tampil===true));
    return{...k,langkah:ls,diperbarui:Math.max(toMs(k.updatedAt),...ls.map(l=>toMs(l.updatedAt)))}})}

const hay=(...a)=>a.map(x=>String(x||'')).join('\n').toLowerCase();
/** Cari di pohon: langkah cocok bila judul/penjelasan/syarat/lama memuat kata kunci; bila judul kategori cocok, seluruh langkahnya ikut. Kategori tanpa kecocokan dibuang. */
export function cari(pohon,q){const s=t(q).toLowerCase();if(!s)return pohon;
  return pohon.map(k=>{if(hay(k.judul).includes(s))return k;const ls=k.langkah.filter(l=>hay(l.judul,l.isi,l.syarat,l.lama).includes(s));return ls.length?{...k,langkah:ls}:null}).filter(Boolean)}
/** Baris syarat/dokumen dari teks (satu per baris, tanda "-" atau "•" di depan dibuang). */
export const barisSyarat=v=>String(v||'').split(/\r?\n/).map(x=>x.replace(/^\s*[-•*]\s*/,'').trim()).filter(Boolean);

// Salinan Panduan Alur di perangkat (localStorage) supaya tetap terbaca saat offline, walaupun mode offline Firestore tidak dinyalakan.
// Isinya panduan umum yang ditulis admin (bukan data pribadi). Dihapus saat Keluar dengan opsi "hapus data di perangkat".
import {toMs} from '@shared/panduan';
export const PANDUAN_CACHE='bimtrack-panduan-cache';
const slim=x=>({...x,createdAt:toMs(x.createdAt),updatedAt:toMs(x.updatedAt)});
export function readPanduanCache(){try{const v=JSON.parse(localStorage.getItem(PANDUAN_CACHE));return v&&Array.isArray(v.kategori)&&Array.isArray(v.langkah)?v:null}catch{return null}}
export function writePanduanCache(kategori,langkah){try{localStorage.setItem(PANDUAN_CACHE,JSON.stringify({t:Date.now(),kategori:kategori.map(slim),langkah:langkah.map(slim)}))}catch{}}
export function clearPanduanCache(){try{localStorage.removeItem(PANDUAN_CACHE)}catch{}}

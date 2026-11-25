// Router hash kecil (#/halaman/id/aksi): aman di GitHub Pages, tombol Kembali HP bekerja, tanpa dependency.
import {useEffect,useState} from 'react';
export const parseHash=(h=typeof location!=='undefined'?location.hash:'')=>{const p=h.replace(/^#\/?/,'').split('/').filter(Boolean).map(decodeURIComponent);return{page:p[0]||'home',id:p[1]&&p[1]!=='baru'?p[1]:null,action:p[1]==='baru'?'baru':p[2]||null}};
export const hrefOf=(page,id)=>'#/'+[page,id].filter(Boolean).map(encodeURIComponent).join('/');
export function useRoute(){const[r,setR]=useState(parseHash);useEffect(()=>{const f=()=>setR(parseHash());addEventListener('hashchange',f);return()=>removeEventListener('hashchange',f)},[]);return r}
export const navigate=(page,id)=>{location.hash=hrefOf(page,id)};
/** Ganti alamat tanpa menambah riwayat (mis. setelah aksi "baru" ditangani). */
export const replaceRoute=(page,id)=>{history.replaceState(null,'',hrefOf(page,id));dispatchEvent(new HashChangeEvent('hashchange'))};

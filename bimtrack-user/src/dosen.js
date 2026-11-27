// Logika murni Daftar Dosen dan Pejabat (tanpa React/Firebase) agar bisa diuji.
// Urutan disimpan sebagai angka `urut` per kelompok (peran baku, atau nama peran bebas). Nomor "Dosen pembimbing 1, 2, …" tidak disimpan:
// selalu dihitung dari urutan, jadi mengubah urutan atau menghapus satu orang otomatis merapikan nomor.
import {PERAN,PERAN_LAIN} from './config.js';

export const NUMBERED=['Dosen pembimbing','Dosen penguji'];
const rankOf=p=>{const i=PERAN.indexOf(p);return i<0?PERAN.length:i};
const cmp=(a,b)=>a===b?0:a<b?-1:1;
/** Kunci kelompok urutan. */
export const groupOf=x=>x.peran===PERAN_LAIN?'lain:'+String(x.peranLain||'').trim().toLowerCase():String(x.peran||'');
const num=v=>Number.isFinite(v)?v:Infinity; // data tanpa `urut` (mis. dari impor CSV lama) diletakkan di akhir kelompoknya
/** Pembanding: peran baku sesuai urutan PERAN, lalu kelompok, lalu `urut`, lalu waktu dibuat, lalu id (hasil selalu deterministik). */
export const cmpDosen=(a,b)=>rankOf(a.peran)-rankOf(b.peran)||cmp(groupOf(a),groupOf(b))||cmp(num(a.urut),num(b.urut))||cmp(a.createdAt?.seconds??0,b.createdAt?.seconds??0)||cmp(a.id||'',b.id||'');
export const sortDosen=rows=>[...rows].sort(cmpDosen);
/** {id: nomor} untuk peran bernomor (pembimbing, penguji), mulai dari 1. */
export function numbering(rows){const m={},c={};sortDosen(rows).forEach(x=>{if(NUMBERED.includes(x.peran)){c[x.peran]=(c[x.peran]||0)+1;m[x.id]=c[x.peran]}});return m}
export const roleName=x=>x.peran===PERAN_LAIN?(String(x.peranLain||'').trim()||PERAN_LAIN):String(x.peran||'');
/** "Dosen pembimbing 2", "Dekan", atau nama peran bebas. */
export const roleLabel=(x,rows)=>{const n=numbering(rows)[x.id];return n?x.peran+' '+n:roleName(x)};
export const titleOf=(x,rows)=>roleLabel(x,rows)+(x.nama?' · '+x.nama:'');
/** `urut` untuk orang baru di kelompok x: setelah yang terakhir, dan tidak kurang dari jumlah anggota (data lama tanpa urut ikut dihitung). */
export function nextUrut(rows,x){const g=groupOf(x),grp=rows.filter(r=>groupOf(r)===g),mx=grp.reduce((a,r)=>Number.isFinite(r.urut)?Math.max(a,r.urut):a,-1);return Math.max(mx+1,grp.length)}
/** Data tambahan saat menyimpan (dipakai Crud): beri `urut` hanya bila belum punya atau pindah kelompok. */
export function extraUrut(data,prev,rows){if(prev&&groupOf(prev)===groupOf(data)&&Number.isFinite(prev.urut))return{};return{urut:nextUrut(rows.filter(r=>!prev||r.id!==prev.id),data)}}
/** Rencana tulis untuk menggeser satu orang (dir -1 naik, +1 turun) di dalam kelompoknya: kelompok dinomori ulang 0..n-1, hanya yang berubah dikembalikan. */
export function moveUrut(rows,id,dir){const x=rows.find(r=>r.id===id);if(!x)return[];const grp=sortDosen(rows.filter(r=>groupOf(r)===groupOf(x))),i=grp.findIndex(r=>r.id===id),j=i+dir;
  if(j<0||j>=grp.length)return[];[grp[i],grp[j]]=[grp[j],grp[i]];
  return grp.map((r,k)=>({id:r.id,urut:k})).filter(p=>rows.find(r=>r.id===p.id).urut!==p.urut)}
export const canMove=(rows,x,dir)=>moveUrut(rows,x.id,dir).length>0;
/** Beri `urut` berurutan pada baris impor (setelah data yang sudah ada). */
export function assignUrut(existing,incoming){const all=[...existing];return incoming.map(o=>{const r={...o,urut:nextUrut(all,o)};all.push(r);return r})}
/** Nama untuk pilihan isian Dosen di Bimbingan/Jadwal (tanpa duplikat), terurut seperti daftar. roles = peran yang ditampilkan (kosong = semua). */
export function dosenOptions(rows,roles){const seen=new Set();return sortDosen(rows).filter(r=>!roles||roles.includes(r.peran)).map(r=>String(r.nama||'').trim()).filter(n=>n&&!seen.has(n)&&seen.add(n))}

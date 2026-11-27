// Arsitektur informasi menu pengguna. Kunci rute lama tetap berlaku (#/bim, #/rev, #/run, …) agar tautan dalam yang sudah ada tidak patah.
//  Jadwal Bimbingan = Jadwal + Rundown (tab) · Laporan Bimbingan = Ringkasan + CSV/Backup (tab) · Pencarian ada di ikon header.
export const NAV=[
  {k:'home',label:'Dashboard',short:'Dasbor',icon:'home',main:true,group:'Utama'},
  {k:'prog',label:'Perjalanan Skripsi',icon:'route'},
  {k:'jdw',label:'Jadwal Bimbingan',short:'Jadwal',icon:'jadwal',main:true,group:'Kerja bimbingan'},
  {k:'bim',label:'Catatan Bimbingan',short:'Catatan',icon:'bimbingan',main:true},
  {k:'rev',label:'Manajemen Revisi',short:'Revisi',icon:'revisi',main:true},
  {k:'bkt',label:'Dokumentasi & Bukti',icon:'image',group:'Arsip dan laporan'},
  {k:'dok',label:'Arsip Dokumen',icon:'arsip'},
  {k:'rin',label:'Laporan Bimbingan',icon:'laporan'},
  {k:'set',label:'Pengaturan',icon:'pengaturan',group:'Akun'}];
/** Rute yang tidak punya item menu sendiri → item menu yang disorot. */
export const ALIAS={run:'jdw',csv:'rin'};
export const PAGES=[...NAV.map(n=>n.k),'cari',...Object.keys(ALIAS)];

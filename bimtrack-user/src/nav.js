// Arsitektur informasi menu pengguna. Kunci rute lama tetap berlaku (#/bim, #/rev, #/run, …) agar tautan dalam yang sudah ada tidak patah.
//  Jadwal Bimbingan = Jadwal + Rundown (tab) · Laporan Bimbingan = Ringkasan + CSV/Backup (tab) · Pencarian ada di ikon header.
//  Jejak Judul dan Outline (#/jjk) = riwayat pengajuan outline sampai judul skripsi · Pusat Bantuan (#/bantuan) = panduan pemakaian.
export const NAV=[
  {k:'home',label:'Dashboard',short:'Dasbor',icon:'home',main:true,group:'Utama'},
  {k:'prog',label:'Perjalanan Skripsi',icon:'route'},
  {k:'pdn',label:'Panduan Alur',icon:'timeline'},
  {k:'jjk',label:'Jejak Judul dan Outline',icon:'flag'},
  {k:'dsn',label:'Dosen dan Pejabat',icon:'users'},
  {k:'jdw',label:'Jadwal Bimbingan',short:'Jadwal',icon:'jadwal',main:true,group:'Kerja bimbingan'},
  {k:'bim',label:'Catatan Bimbingan',short:'Catatan',icon:'bimbingan',main:true},
  {k:'rev',label:'Manajemen Revisi',short:'Revisi',icon:'revisi',main:true},
  {k:'bkt',label:'Dokumentasi & Bukti',icon:'image',group:'Arsip dan laporan'},
  {k:'dok',label:'Arsip Dokumen',icon:'arsip'},
  {k:'rin',label:'Laporan Bimbingan',icon:'laporan'},
  {k:'set',label:'Pengaturan',icon:'pengaturan',group:'Akun'},
  {k:'bantuan',label:'Pusat Bantuan',icon:'book'}];
/** Rute yang tidak punya item menu sendiri → item menu yang disorot. */
export const ALIAS={run:'jdw',csv:'rin'};
export const PAGES=[...NAV.map(n=>n.k),'cari',...Object.keys(ALIAS)];

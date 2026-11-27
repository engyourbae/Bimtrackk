# Audit Batch 7

Tanggal: 28 November 2026. Cakupan: Daftar Dosen dan Pejabat, judul dasbor mengalir, Panduan Alur, serta dampaknya ke backup, CSV, pencarian, aturan Firestore, dan Audit log.

## Status verifikasi — baca ini dulu
- **Sudah dijalankan di sini (Vitest asli):** `npm install` di akar repo dan `npm run test:unit` (logika dosen, logika panduan, dan pemeriksaan konsistensi repo). Juga `npm install` + `vite build` untuk bimtrack-user dan bimtrack-admin: keduanya berhasil dibangun.
- **BELUM dijalankan:** tes aturan di Emulator (`npm run test:rules`). Emulator Firestore tidak bisa diunduh di lingkungan pembuatan, jadi tes aturan Batch 7 di `tests/rules/rules.test.js` ditulis tetapi belum pernah dijalankan, dan sintaks `firestore.rules` yang baru belum diperiksa oleh Firebase. Jalankan `npm run test:rules` di laptopmu sebelum menerbitkan aturan; bila ada yang merah, kirim pesan galatnya.
- **BELUM dilihat di layar atau di perangkat:** Dosen dan Pejabat, kartu judul dasbor, Panduan (user dan admin), pilihan dosen (datalist) di Android/iPhone, perilaku offline Panduan. Gunakan `docs/UJI-MANUAL.md` bagian 12 dan bagian 3.

## Rencana data dan aturan (ringkas)
| Koleksi | Pemilik | Siapa menulis | Siapa membaca | Catatan |
|---|---|---|---|---|
| `dosenPejabat/{id}` | mahasiswa (`ownerUid`) | pemilik (`canWriteOwn`) | pemilik, admin | aturan ketat sendiri, TIDAK di `studentCol` |
| `panduanKategori/{id}` | tidak ada (umum) | hanya admin | mahasiswa disetujui (`terbit == true`), admin | |
| `panduanLangkah/{id}` | tidak ada (umum) | hanya admin | mahasiswa disetujui (`tampil == true`), admin | `tampil == terbit && kategoriTerbit` dipaksa aturan |
| `panduanTanda/{uid_langkahId}` | mahasiswa | pemilik | pemilik, admin | di `studentCol` (aturan umum), catatan pribadi |

Tidak ada migrasi: koleksi lama tidak diubah. `skripsi/{uid}`, `jejak`, dan lainnya tidak tersentuh. `progress.js` dan kunci tahap PRA tidak diubah.

## Temuan dan keputusan
| # | Hal | Keputusan |
|---|---|---|
| 1 | Menambah `dosenPejabat` ke `studentCol` akan membuat aturan umum (longgar) ikut berlaku dan meniadakan aturan ketat | Dibuat blok `match /dosenPejabat/{docId}` sendiri; tes konsistensi memastikan koleksi bertanda `strict` tidak ada di `studentCol` |
| 2 | Daftar peran harus sama di kode dan aturan | Dijaga tes konsistensi (PERAN, batas panjang, daftar field) |
| 3 | Nomor "pembimbing 1, 2…" bila disimpan akan basi saat urutan berubah atau ada yang dihapus | Nomor tidak disimpan; dihitung dari urutan (`urut`). Menggeser menomori ulang satu kelompok |
| 4 | Isian Dosen sebagai pilihan wajib akan memaksa mahasiswa | Isian bertipe `combo` (datalist): memilih dari daftar atau mengetik bebas. Daftar dimuat lewat langganan terpisah sehingga galat aturan tidak merusak halaman Bimbingan/Jadwal |
| 5 | Langkah dalam kategori draf bisa terbaca bila hanya langkahnya yang berstatus terbit | `tampil` (terdenormalisasi) dipaksa aturan; aplikasi admin memperbarui `kategoriTerbit` dan `tampil` semua langkah dalam satu batch saat kategori diterbitkan/disembunyikan |
| 6 | Batas jumlah kategori (12) dan langkah per kategori (40) | **Hanya di aplikasi admin.** Aturan Firestore tidak bisa menghitung dokumen; aturan hanya membatasi rentang `urutan` (<50 / <100) dan panjang teks. Admin dipercaya; klien admin yang dimodifikasi bisa melampaui batas jumlah |
| 7 | Langkah dalam kategori draf yang sudah pernah tersalin di perangkat mahasiswa | Salinan offline hanya berisi yang terbit saat disalin; ditimpa pada pembukaan berikutnya (online) |
| 8 | Salinan offline Panduan di localStorage | Isinya panduan umum, bukan data pribadi. Dihapus saat Keluar dengan opsi hapus data di perangkat |
| 9 | Hapus dosen memakai `canWriteOwn()` (koleksi lama memakai `isApproved()`, temuan #2 Batch 6) | Koleksi baru sudah ketat; koleksi lama sengaja belum diubah |
| 10 | `panduanTanda` tidak ikut backup | Disengaja: penanda pribadi yang bisa dibuat ulang |
| 11 | Backup lama (tanpa `dosenPejabat`) | Tetap bisa dipulihkan; koleksi yang tidak ada di berkas dilewati |
| 12 | Audit log | Setiap tulisan panduan (tambah/ubah/terbit/draf/urut/hapus) ditulis satu batch dengan baris `aktivitas` (atomik). Aturan `aktivitas` tidak berubah; label aksi ditambah di halaman admin |

## Dibiarkan sengaja
- Pembacaan panduan bersifat terbuka untuk semua mahasiswa yang disetujui (memang isi umum). Admin tetap hanya membaca data pribadi mahasiswa (termasuk `dosenPejabat`).
- Datalist di iOS Safari bisa kurang nyaman dibanding Android; isian tetap bisa diketik bebas.

## Belum bisa dibuktikan tanpa perangkat
Tampilan HP 360 px dan tema Gelap/semua warna untuk halaman baru, kenyamanan datalist, dan perilaku offline sungguhan.

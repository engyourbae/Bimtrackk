# Audit akhir Batch 6

Tanggal: 27 November 2026. Cakupan: seluruh isi repo (bimtrack-user, bimtrack-admin, shared, landing, firestore.rules, workflow).

## Status verifikasi — baca ini dulu
- **Dijalankan di lingkungan pembuatan (tanpa akses internet/npm):** semua tes unit lewat pelari tes sementara yang meniru API Vitest, termasuk hitungan judul segitiga dan progres Outline–Seminar Proposal. Itu membuktikan logikanya, bukan bahwa Vitest asli sudah lulus.
- **BELUM dijalankan:** `npm install`, Vitest asli, tes aturan di Emulator (butuh Java dan firebase-tools), dan build Vite. Jalankan sendiri: `npm install && npm run test:all`, lalu build tiap aplikasi. Bila ada tes yang merah, itu temuan nyata atau salah tulis tes; kabari saya lengkap dengan pesan galatnya.
- Tampilan baru (judul segitiga, tombol sejajar, warna) belum pernah dilihat di layar. Cek dengan daftar di `docs/UJI-MANUAL.md` bagian 3 dan 4.

## Yang diperiksa
1. Konsistensi aturan Firestore dengan kode (kunci tahap pra-skripsi, daftar koleksi, batas judul, status judul, aturan penutup): diotomatiskan di `tests/unit/konsistensi.test.js`.
2. Kebocoran rahasia: tidak ada kunci `AIza…`, `.env` asli, atau kunci akun layanan di repo.
3. Pola berbahaya: `eval`, `new Function`, `dangerouslySetInnerHTML`, `console.log`, `debugger`; tautan `target=_blank` tanpa `rel`.
4. Permukaan XSS: satu-satunya `document.write` ada di Cetak/PDF ringkasan dan semua isinya melewati fungsi `h()` (escape `& < >`).
5. Validasi tautan Drive di formulir, impor CSV, dan pulihkan backup.
6. Aturan sesi tunggal, reset sandi (dataUid), pendaftaran, audit log, versi NIM: dibuktikan lewat `tests/rules/rules.test.js`.

## Temuan dan tindakan
| # | Temuan | Tingkat | Tindakan |
|---|--------|---------|----------|
| 1 | Tombol "Buka di Drive" memakai `href` langsung dari data. Validasi hanya di formulir/impor; aturan Firestore tidak memeriksa isi tautan, jadi klien yang dimodifikasi bisa menyimpan `javascript:` | Rendah (hanya terkena pemilik data sendiri) | **Diperbaiki** di `Crud.jsx`: `href` hanya diisi bila `isDriveUrl` benar. Dijaga tes konsistensi |
| 2 | `allow delete` data mahasiswa memakai `isApproved()`, bukan `canWriteOwn()`: akun bersandi sementara masih bisa menghapus datanya sendiri sebelum mengganti sandi | Rendah (hanya data sendiri) | **Belum diubah** (mengubah aturan berarti menerbitkan ulang). Usul: ganti ke `canWriteOwn()` bila ingin ketat |
| 3 | Aturan tidak memeriksa isi field bebas pada koleksi data biasa (hanya pemilik, id, jumlah field ≤ 80) | Rendah | Diterima: konsisten dengan desain; tervalidasi di klien. Koleksi `skripsi` sudah ketat |
| 4 | `nimVersion/{NIM}` terbaca publik dan `resetRequests` bisa dibuat tanpa login | Diketahui (README) | Diterima di paket Spark. Tes menjaga agar `list` tetap ditolak dan bentuk dokumen ketat |
| 5 | Cabut akses dan keluar paksa tidak mencabut token Auth; cache IndexedDB tidak terenkripsi | Diketahui (README) | Butuh Cloud Functions (Blaze). Tidak diubah |
| 6 | Pilihan warna disimpan di localStorage yang sama untuk `/user/` dan `/admin/` (satu origin) | Info | Admin tidak membaca nilainya; dijaga tes konsistensi |

## Tidak ditemukan
Rahasia di repo, `eval`/`innerHTML` berbahaya, tautan `_blank` tanpa `noopener`, koleksi di `config.js` yang tidak terdaftar di aturan, kunci tahap yang berbeda antara kode dan aturan.

## Yang belum bisa dibuktikan tanpa perangkat
Kinerja di HP lama, perilaku PWA/notifikasi di iOS, kenyamanan judul segitiga pada judul sangat panjang, dan pembaca layar. Semuanya ada di daftar uji manual.

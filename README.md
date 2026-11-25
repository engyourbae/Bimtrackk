# BIMTRACK — versi awal (admin + user)

Isi: `bimtrack-user/`, `bimtrack-admin/` (React + Vite, Firebase proyek `bimtrack-8ac84`), `firestore.rules`.
Belum diuji dijalankan (dibuat tanpa akses npm). Jalankan dulu `npm install && npm run dev` di tiap folder.

## Langkah wajib
1. Firebase Console > Authentication: aktifkan **Email/Password**.
2. Firestore: tempel `firestore.rules` > Publish.
3. Pastikan dokumen `admins/sVJlWFklJqhlpC8FGOrmlFXLQOO2` berisi `role` bertipe **boolean** true (bukan teks "true") dan UID cocok dengan akun admin di Authentication. Login admin: email akun itu (atau NIM jika dibuat dengan format NIM@auth.bimtrack.app).
4. Authentication > Settings > Authorized domains: tambahkan `USERNAME.github.io`.
5. Deploy: dua repo (`bimtrack-user`, `bimtrack-admin`), push ke `main`, GitHub Settings > Pages > Source: GitHub Actions.

## Sudah ada
Login/daftar NIM (1 kolom sandi + ikon mata), status pending/approved/rejected, admin: dashboard, permintaan akun (terima/tolak + alasan), pengguna (cabut/aktifkan akses), audit log. User: dashboard dari data asli, CRUD bimbingan & revisi (cari, filter, urut, detail, hapus konfirmasi, link bukti Drive per revisi), tema terang/gelap/sistem, komponen custom, PWA dasar, cache offline Firestore (IndexedDB), Security Rules.

Reset sandi: mahasiswa kirim permintaan (Lupa kata sandi) > admin verifikasi identitas > Reset Sandi > Setujui: dibuat akun Auth baru (NIM.v2@auth.bimtrack.app) dengan sandi acak yang tampil sekali; akun lama dinonaktifkan di Firestore; data lama tetap lewat `dataUid`; mahasiswa wajib ganti sandi saat masuk. Akun Auth lama jadi yatim, hapus sesekali di Console. Catatan: `nimVersion/{NIM}` dapat dibaca publik (hanya angka versi) dan `resetRequests` dapat dibuat tanpa login (bisa disalahgunakan untuk spam, admin yang memverifikasi).

## Belum ada (tahap berikutnya)
Jadwal/kalender, rundown, ringkasan, halaman Dokumen & Drive, CSV impor/ekspor, backup, pencarian global, galeri bukti multi-link, riwayat perubahan, date/time picker custom, ikon PNG (iOS).

## Keterbatasan Spark
- "Cabut akses" hanya mengubah Firestore; akun Auth tidak dinonaktifkan (perlu Admin SDK/Cloud Functions = Blaze).
- Reset sandi memakai alur admin (di bawah), bukan email otomatis, karena email internal NIM@auth.bimtrack.app bukan email nyata.
- Penolakan tidak bisa mencegah pembuatan akun Auth; hanya mencegah akses data.

# BIMTRACK — versi awal (admin + user)

Isi: `bimtrack-user/`, `bimtrack-admin/` (React + Vite, Firebase proyek `bimtrack-8ac84`), `firestore.rules`.
Belum diuji dijalankan (dibuat tanpa akses npm). Jalankan dulu `npm install && npm run dev` di tiap folder.

## Konfigurasi Firebase (.env) — wajib
Semua konfigurasi database tidak lagi ada di kode. Aplikasi membaca `VITE_FIREBASE_*` lewat `shared/firebase-config.js` dan berhenti dengan pesan jelas bila ada yang kosong.
- **Lokal:** di `bimtrack-user/` dan `bimtrack-admin/` salin `.env.example` menjadi `.env.local`, isi dari Firebase Console > Project settings > Your apps (user dan admin memakai **App ID berbeda**). `.env.local` sudah di `.gitignore`; jangan di-commit.
- **Deploy:** GitHub repo > Settings > Secrets and variables > Actions > New repository secret: `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET` (opsional), `FIREBASE_MESSAGING_SENDER_ID`, `FIREBASE_APP_ID_USER`, `FIREBASE_APP_ID_ADMIN`. Workflow gagal dengan pesan jelas jika ada yang kosong.
- **Catatan keamanan:** config web Firebase bukan rahasia sungguhan. Nilainya tetap terbaca di hasil build karena dijalankan di peramban. `.env` mencegahnya masuk ke repo dan memudahkan ganti proyek, tetapi pengamanan sebenarnya adalah `firestore.rules` dan pembatasan API key: Google Cloud Console > APIs & Services > Credentials > pilih Browser key > *Website restrictions* > tambahkan `https://USERNAME.github.io/*` (dan `http://localhost:*` untuk dev). Key lama sudah ada di riwayat git; setelah dibatasi, key itu tidak berguna dari domain lain.

## Langkah wajib
1. Firebase Console > Authentication: aktifkan **Email/Password**.
2. Firestore: tempel `firestore.rules` > Publish.
3. Pastikan dokumen `admins/sVJlWFklJqhlpC8FGOrmlFXLQOO2` berisi `role` bertipe **boolean** true (bukan teks "true") dan UID cocok dengan akun admin di Authentication. Login admin: email akun itu (atau NIM jika dibuat dengan format NIM@auth.bimtrack.app).
4. Authentication > Settings > Authorized domains: tambahkan `USERNAME.github.io`.
5. Deploy (satu repo berisi kedua folder): push ke `main`, lalu GitHub Settings > Pages > **Source: GitHub Actions** (bukan "Deploy from branch", itu yang menampilkan README). Hasil: `.../NAMA-REPO/user/` dan `.../NAMA-REPO/admin/`. Folder `.github/workflows` di dalam tiap aplikasi tidak dipakai, boleh dihapus.

## Sudah ada
Login/daftar NIM (1 kolom sandi + ikon mata), status pending/approved/rejected, admin: dashboard, permintaan akun (terima/tolak + alasan), pengguna (cabut/aktifkan akses), audit log. User: dashboard dari data asli, CRUD bimbingan & revisi (cari, filter, urut, detail, hapus konfirmasi, link bukti Drive per revisi), tema terang/gelap/sistem, komponen custom, PWA dasar, cache offline Firestore (IndexedDB), Security Rules.

Reset sandi: mahasiswa kirim permintaan (Lupa kata sandi) > admin verifikasi identitas > Reset Sandi > Setujui: dibuat akun Auth baru (NIM.v2@auth.bimtrack.app) dengan sandi acak yang tampil sekali; akun lama dinonaktifkan di Firestore; data lama tetap lewat `dataUid`; mahasiswa wajib ganti sandi saat masuk. Akun Auth lama jadi yatim, hapus sesekali di Console. Catatan: `nimVersion/{NIM}` dapat dibaca publik (hanya angka versi) dan `resetRequests` dapat dibuat tanpa login (bisa disalahgunakan untuk spam, admin yang memverifikasi).

## Tambahan v2
Dokumen & Drive, bukti revisi multi-link (validasi link Drive), jadwal (kalender bulanan + daftar), rundown (indikator terlambat), pengingat deadline di dashboard, ringkasan (dibuat dari catatan tersimpan, bisa diedit, salin, cetak/PDF), pencarian global, CSV ekspor/impor (pemetaan kolom, validasi, duplikat, rollback), backup JSON manual + riwayat, indikator offline, tombol pasang aplikasi, ikon PNG, hitungan data di dashboard admin, sesi login user dan admin dipisah.

## Belum ada (tahap berikutnya)
Kalender mingguan, restore backup, riwayat perubahan per revisi, pratinjau gambar Drive di dalam aplikasi, date/time picker custom, sinkronisasi offline selain cache bawaan Firestore, uji otomatis.

## Keterbatasan Spark
- "Cabut akses" hanya mengubah Firestore; akun Auth tidak dinonaktifkan (perlu Admin SDK/Cloud Functions = Blaze).
- Reset sandi memakai alur admin (di bawah), bukan email otomatis, karena email internal NIM@auth.bimtrack.app bukan email nyata.
- Penolakan tidak bisa mencegah pembuatan akun Auth; hanya mencegah akses data.

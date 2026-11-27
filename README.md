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
Riwayat perubahan per revisi, pratinjau gambar Drive di dalam aplikasi, date/time picker custom, sinkronisasi offline selain cache bawaan Firestore, uji otomatis.

## PWA, offline, dan notifikasi (Batch 4D)
- **Instal:** landing, `/user/`, dan `/admin/` masing-masing punya `manifest.webmanifest` dan `service-worker.js` dengan scope sub-path sendiri. Service worker user/admin diisi daftar precache (termasuk aset ber-hash) dan versi otomatis oleh `shared/pwa-plugin.js` saat `npm run build`; landing diberi versi hash commit oleh `deploy.yml`. Tombol/petunjuk pasang ada di Pengaturan.
- **Pembaruan:** versi baru menunggu sampai pengguna menekan **Perbarui**.
- **Keluar:** semua jalur lewat dialog konfirmasi (tombol Keluar ada di Pengaturan > Akun). Di app user ada opsi menghapus data offline perangkat.
- **Mode offline (opt-in, per perangkat, default mati):** Pengaturan > Mode offline. Cache Firestore di IndexedDB tidak terenkripsi; jangan aktifkan di perangkat bersama. Login pertama di perangkat baru butuh internet.
- **Notifikasi:** status izin ditampilkan apa adanya (belum diminta/diizinkan/diblokir). Hanya muncul saat BIMTRACK terbuka; notifikasi saat tertutup butuh Cloud Functions + FCM (Blaze) dan belum diaktifkan.

## Batch 4F
- **Jejak Judul dan Outline** (`#/jjk`): riwayat pengajuan outline (termasuk yang ditolak), outline disetujui, metode penelitian disetujui, judul proposal, seminar proposal, judul skripsi, sidang. Koleksi baru `jejak`; tidak ikut rumus progres. Karena koleksi baru, **`firestore.rules` wajib diterbitkan ulang** (hanya `jejak` ditambahkan ke `studentCol`). Sebelum diterbitkan, halaman Jejak menampilkan galat dengan tombol Coba lagi, sedangkan fitur lain tetap jalan (backup dan pencarian melewati jejak dan memberi tahu).
- **Pencarian global:** mengetuk hasil membuka detail data (bukan hanya daftar); mencakup jejak judul dan judul skripsi; menampilkan potongan teks yang cocok.
- **Laporan:** cakupan ringkasan baru "Jejak judul dan outline"; Cetak/PDF memakai kop (nama, NIM, prodi, tanggal cetak); tombol Rekap progres per bab (CSV) memakai rumus progres yang sama (`progress.js` tidak diubah).
- **Backup dan pulihkan:** backup JSON kini menyertakan jejak dan judul skripsi. Tab **Pulihkan** memeriksa tiap baris, hanya menambah data yang ID-nya belum ada (tidak menimpa), semua pemilik data diganti ke akun yang sedang masuk, dan dibatalkan (rollback) bila gagal. Judul skripsi ditulis terakhir karena aturan Firestore tidak mengizinkan penghapusan dokumen itu.
- **Kalender HP:** tombol Tambahkan ke kalender HP (kartu Pengingat dan detail jadwal) mengunduh berkas `.ics`. Jadwal ber-jam menjadi acara 1 jam + alarm 30 menit sebelum mulai; tanpa jam menjadi acara seharian tanpa alarm. Pengingat saat aplikasi tertutup tanpa Blaze, alarm dijalankan aplikasi kalender di HP.
- **Pengaturan** dirapikan (Profil, Tampilan + format tanggal, Keamanan, Perangkat, Data dan bantuan, Akun) dan **Pusat Bantuan** (`#/bantuan`) berisi panduan nyata dengan pencarian.
- Catatan privasi: admin dapat membaca (tidak mengubah) semua koleksi data mahasiswa, termasuk `jejak`.

## Batch 5 — sinkronisasi, sesi tunggal, performa, admin
- **`firestore.rules` wajib diterbitkan ulang** (koleksi baru `sesi`; aturan lama tidak berubah). Sebelum diterbitkan, sesi tunggal tidak aktif (aplikasi tetap terbuka) dan "Keluarkan paksa" di admin ditolak server dengan pesan jelas.
- **Status sinkronisasi (chip di bilah atas user):** Tersinkron · Menunggu kirim · Offline · Gagal kirim · Menyambung, dari `hasPendingWrites` + hasil janji tulis. Semua tulisan Crud, Skripsi, dan Ringkasan lewat `src/sync.js`: toast hanya "Tersimpan" setelah server menjawab (offline: "Disimpan di perangkat. Menunggu kirim"), galat server tampil sebagai toast, chip merah, dan daftar dengan **Coba kirim ulang**; tidak hilang diam-diam. Batas: penolakan server atas tulisan dari sesi sebelumnya (aplikasi ditutup saat offline) tidak bisa dideteksi SDK.
- **Konflik tulis:** saat Edit, `updatedAt` dari snapshot yang dikonfirmasi server dicatat. Bila berubah selagi formulir terbuka, tampil "Data ini baru diubah di perangkat lain" dengan **Muat ulang** / **Timpa** (tanpa transaksi). Tidak diperiksa bila offline atau belum terkonfirmasi server; ubah status/arsip/hapus tidak diperiksa.
- **Sesi tunggal (user):** `sesi/{uid}` = `{deviceId, startedAt, kickedAt?, kickBy?}`. Masuk di perangkat baru saat sesi lain tercatat aktif meminta konfirmasi lalu menimpa sesi; perangkat lama keluar otomatis (hanya dari snapshot yang dikonfirmasi server, setelah tulisan tertunda dikirim, maksimal 6 dtk) dengan pesan di layar masuk. Admin tidak ikut sesi tunggal. Bila server tidak terjangkau saat masuk, aplikasi tetap terbuka dan pemeriksaan diulang saat online.
- **Admin "Keluarkan paksa"** (halaman Pengguna): lewat konfirmasi, opsional "Blokir akses sekaligus" (`approved:false`), tercatat di audit log (`force_logout`). **Batasan jujur:** perangkat hilang yang offline tetap bisa membaca cache IndexedDB (tidak terenkripsi) sampai online; reset sandi tidak mencabut sesi; pencabutan token sungguhan butuh Cloud Functions (Blaze), tidak diaktifkan.
- **Performa:** halaman jarang dipakai (Perjalanan, Jadwal, Laporan, Pencarian, Jejak, Bantuan, Pengaturan; admin: semua halaman) dimuat malas dan semua chunk masuk precache PWA, jadi tetap terbuka offline. Listener Firestore dipakai bersama (`shared/live-store.js`), ditahan 30 dtk setelah halaman ditutup; data yang sudah ada tampil tanpa skeleton. Vendor React dan Firebase dipisah jadi chunk sendiri.
- **Admin dirombak:** satu berkas per halaman (`bimtrack-admin/src/pages/`), tiap halaman dan tiap bagian dashboard punya status memuat/kosong/galat sendiri, semua tindakan lewat konfirmasi, jumlah data dashboard di-cache 10 menit (tombol Hitung ulang), audit log memuat 50 terbaru lalu **Muat lebih banyak**.

## Keterbatasan Spark
- "Cabut akses" hanya mengubah Firestore; akun Auth tidak dinonaktifkan (perlu Admin SDK/Cloud Functions = Blaze).
- Reset sandi memakai alur admin (di bawah), bukan email otomatis, karena email internal NIM@auth.bimtrack.app bukan email nyata.
- Penolakan tidak bisa mencegah pembuatan akun Auth; hanya mencegah akses data.

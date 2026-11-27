# Daftar uji manual BIMTRACK (Batch 6)

Tes otomatis (`npm run test:all`) hanya mencakup logika murni dan aturan Firestore. Hal-hal di bawah butuh tangan dan perangkat sungguhan.
Cara pakai: salin daftar ini, centang sambil menguji, tulis perangkat dan tanggalnya. Uji minimal di: HP Android (Chrome), satu HP lain (iOS Safari bila ada), dan laptop.
Siapkan: 2 akun mahasiswa (A dan B), 1 akun admin, dan 2 perangkat/peramban berbeda untuk uji sesi.

## 0. Sebelum mulai
- [ ] `firestore.rules` versi terbaru sudah diterbitkan (Firebase Console > Firestore > Rules > Publish)
- [ ] Secret GitHub lengkap, deploy terakhir hijau, situs `/user/` dan `/admin/` terbuka
- [ ] `npm run test:all` hijau di komputer atau di GitHub Actions (workflow Tes)

## 1. Akun dan masuk
- [ ] Daftar akun baru: status pending, tidak bisa masuk ke data sebelum disetujui
- [ ] Admin menyetujui: mahasiswa bisa masuk. Admin menolak (dengan alasan): alasan tampil di sisi mahasiswa
- [ ] Salah sandi 3 kali: muncul waktu tunggu yang makin lama; benar lagi setelah menunggu: berhasil dan hitungan di-reset
- [ ] Ikon mata di kolom sandi menampilkan dan menyembunyikan sandi
- [ ] Lupa sandi: permintaan terkirim; admin Setujui: sandi acak tampil sekali; mahasiswa masuk, WAJIB ganti sandi, data lama tetap ada
- [ ] Setelah reset, akun lama tidak bisa dipakai masuk dengan sandi lama

## 2. Sesi tunggal dan keluar paksa
- [ ] Masuk akun A di perangkat 1, lalu masuk akun A di perangkat 2: muncul konfirmasi; setelah lanjut, perangkat 1 keluar sendiri dengan pesan di layar masuk
- [ ] Tulisan yang masih menunggu kirim di perangkat 1 tidak hilang (cek setelah masuk lagi)
- [ ] Admin > Pengguna > Keluarkan paksa (tanpa blokir): perangkat A keluar, bisa masuk lagi
- [ ] Keluarkan paksa dengan "Blokir akses sekaligus": A tidak bisa membaca data; Aktifkan kembali memulihkan akses
- [ ] Tindakan tercatat di Audit log (force_logout)
- [ ] Kedaluwarsa sesi (Pengaturan > Keamanan, 15 menit): tanpa aktivitas, keluar otomatis dengan pemberitahuan

## 3. Dasbor: judul skripsi dan progres
- [ ] Belum ada judul: kartu "Judul skripsi" mengajak mengisi; tombol Isi judul membuka Perjalanan
- [ ] Isi judul di Perjalanan: kembali ke dasbor, judul tampil rata tengah dan menyempit ke bawah (segitiga terbalik), tanpa kata terpotong
- [ ] Uji judul pendek (3 kata), sedang (±60 karakter), dan panjang (±150 karakter) di lebar HP 360 px dan layar 1280 px: tidak terpotong, tidak keluar kartu, huruf masih terbaca
- [ ] Ubah status judul (Draf, Diajukan, Disetujui, Perlu diganti): lencana di dasbor ikut berubah
- [ ] Judul bisa disalin dengan menyentuh lama
- [ ] Kartu Progres skripsi: tombol "Cara menghitung" dan "Perjalanan" sejajar sama lebar di HP, satu baris dengan judul di layar lebar
- [ ] Progres "Outline sampai Seminar Proposal": 0% saat belum ada yang ditandai; tandai satu tahap Selesai di Perjalanan: persen naik (1 dari 6 = 17%); tahap Berjalan tampil tetapi belum menambah persen; semua 6 selesai = 100%
- [ ] Progres Bab I sampai Bab V tidak berubah saat tahapan pra-skripsi diubah
- [ ] Matikan internet lalu buka dasbor: judul dan progres tetap tampil bila mode offline aktif

## 4. Warna aplikasi
- [ ] Pengaturan > Tampilan > Warna aplikasi: pilih Hijau, Burgundy, Teal, Ungu, Biru, Navy; tombol, ikon aksi cepat, bilah progres, dan garis kartu "Langkah berikutnya" ikut berubah seketika
- [ ] Ulangi di tema Terang dan Gelap: teks di tombol terbaca jelas di semua warna
- [ ] Tutup lalu buka aplikasi: warna tetap, tanpa berkedip warna lain saat memuat
- [ ] Warna Danger (merah) untuk "terlambat" dan "hapus" tetap berbeda jelas dari Burgundy
- [ ] Aplikasi admin TIDAK ikut berubah (tetap ochre)

## 5. Data (bimbingan, revisi, jadwal, rundown, dokumen, bukti, jejak)
- [ ] Tambah, ubah, hapus (dengan konfirmasi) tiap jenis data; toast "Tersimpan" muncul setelah server menjawab
- [ ] Link Drive: link non-Drive ditolak; link Drive valid terbuka di tab baru; pratinjau tampil bila akun Google punya akses
- [ ] Cari, filter, urut, dan arsip bekerja; pencarian global membuka detail yang tepat
- [ ] Konflik tulis: buka satu data di dua perangkat, ubah di perangkat 1, simpan di perangkat 2: muncul "Muat ulang / Timpa"
- [ ] Mahasiswa B tidak bisa melihat data A (coba tempel alamat detail A di akun B)

## 6. Offline dan sinkronisasi
- [ ] Chip status: Tersinkron, Menunggu kirim (offline, setelah menyimpan), Offline, Gagal kirim, Menyambung
- [ ] Mode offline aktif: simpan data saat pesawat; nyalakan internet: chip kembali Tersinkron dan data muncul di perangkat lain
- [ ] Mode offline mati: login pertama tanpa internet menampilkan pesan jelas, bukan layar kosong
- [ ] "Hapus data offline" di Pengaturan benar-benar mengosongkan cache perangkat

## 7. PWA, notifikasi, kalender
- [ ] Pasang ke layar utama (Android dan iOS); ikon dan nama benar; buka tanpa bilah alamat
- [ ] Rilis baru: banner Perbarui muncul dan hanya memperbarui setelah ditekan
- [ ] Notifikasi: status izin ditampilkan jujur; pengingat muncul saat aplikasi terbuka
- [ ] Tambahkan ke kalender HP: berkas .ics terbuka di aplikasi kalender; jadwal ber-jam punya alarm 30 menit sebelumnya, tanpa jam jadi acara seharian

## 8. Laporan, backup, CSV
- [ ] Ringkasan: dibuat, diedit, disalin, Cetak/PDF dengan kop (nama, NIM, prodi, tanggal)
- [ ] Rekap progres per bab (CSV) cocok dengan angka di dasbor
- [ ] Backup JSON lalu Pulihkan di akun yang sama: tidak ada data ganda, tidak ada yang tertimpa
- [ ] CSV impor: baris salah ditolak dengan alasan; impor dibatalkan penuh bila gagal di tengah
- [ ] Buka CSV ekspor di Excel/Sheets: sel berawalan = + - @ tidak dieksekusi sebagai rumus

## 9. Admin
- [ ] Dashboard: hitungan muncul, "Hitung ulang" berfungsi; tiap bagian punya status memuat/kosong/galat
- [ ] Permintaan akun, Pengguna (cabut/aktifkan), Reset sandi, Audit log (Muat lebih banyak) berfungsi dan setiap tindakan lewat konfirmasi
- [ ] Alamat khusus admin terbuka; versi publik tidak menampilkan tautan ke admin

## 10. Tampilan lintas perangkat
- [ ] HP 360 px, HP besar, tablet, laptop: tidak ada teks terpotong atau tergeser ke samping
- [ ] Tema Terang, Gelap, Sistem; tabel dan kartu terbaca di Gelap
- [ ] Animasi mulus; dengan "kurangi gerakan" aktif di perangkat, animasi hampir tidak ada
- [ ] Pembaca layar (TalkBack/VoiceOver): judul skripsi dibaca utuh satu kalimat, bukan per baris

## 11. Keamanan, uji dengan sengaja
- [ ] Buka Firestore dari konsol peramban dengan akun mahasiswa B untuk membaca koleksi milik A: ditolak
- [ ] Akun belum disetujui tidak bisa membaca atau menulis apa pun
- [ ] Kunci API sudah dibatasi ke domain situs (Google Cloud Console > Credentials)

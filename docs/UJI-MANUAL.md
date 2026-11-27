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
- [ ] Isi judul di Perjalanan: kembali ke dasbor, judul tampil sebagai teks biasa rata kiri yang membungkus alami, seluruh judul terlihat tanpa terpotong
- [ ] Uji judul pendek (3 kata), sedang (±60 karakter), panjang (±150 karakter), dan 300 karakter di lebar HP 360 px dan layar 1280 px: seluruh judul terlihat, ukuran huruf sama, kartu tidak melebar berlebihan; ulangi di tema Gelap dan semua pilihan warna
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
- [ ] Pembaca layar (TalkBack/VoiceOver): judul skripsi dibaca utuh satu kalimat

## 11. Keamanan, uji dengan sengaja
- [ ] Buka Firestore dari konsol peramban dengan akun mahasiswa B untuk membaca koleksi milik A: ditolak
- [ ] Akun belum disetujui tidak bisa membaca atau menulis apa pun
- [ ] Kunci API sudah dibatasi ke domain situs (Google Cloud Console > Credentials)

## 12. Batch 7: dosen dan pejabat, panduan alur
Prasyarat: `firestore.rules` terbaru sudah diterbitkan.
- [ ] Dosen dan Pejabat: tambah 3 pembimbing, 2 penguji, Kaprodi, Dekan, Rektor, dan satu "Peran lain" (nama peran wajib diisi): nomor otomatis 1, 2, 3 dan 1, 2; tombol Tambah tetap ada sesudah banyak data
- [ ] Naikkan/Turunkan lewat menu kartu dan di Detail: nomor ikut berganti; tombol tidak aktif di paling atas/bawah; urutan tidak tercampur antar peran
- [ ] Hapus pembimbing 1: yang lama menjadi 1 (nomor merapikan diri); hapus lewat konfirmasi
- [ ] Ubah peran satu orang ke peran lain: pindah ke akhir kelompok barunya
- [ ] Nama lebih dari 150 karakter ditolak dengan pesan di formulir (bukan galat server)
- [ ] Bimbingan dan Jadwal, isian Dosen: nama dari daftar muncul sebagai pilihan (cek di Android dan iPhone), tetap bisa mengetik nama lain; daftar kosong: ada petunjuk
- [ ] Pencarian global menemukan nama dosen dan membuka detailnya; ekspor CSV berurutan; backup lalu Pulihkan di akun lain: daftar dan urutan terbawa; impor CSV memberi urutan lanjutan
- [ ] Sebelum rules diterbitkan: halaman Dosen menampilkan galat + Coba lagi, Bimbingan tetap normal
- [ ] Panduan (admin): tambah kategori "Pengajuan Outline sampai Seminar Proposal" sebagai draf, tambah 3 langkah (satu dengan tautan Drive, satu dengan syarat berbaris); tautan non-Drive/http ditolak di formulir
- [ ] Mahasiswa belum melihat apa pun selama draf; terbitkan kategori: langkah berstatus terbit tampil, langkah draf tetap tersembunyi; jadikan draf lagi: semua hilang dari mahasiswa
- [ ] Urutkan kategori dan langkah di admin: urutan sama di aplikasi mahasiswa; "Diperbarui" berubah setelah edit isi
- [ ] Hapus langkah dan hapus kategori (konfirmasi menyebut jumlah langkah); batas 12 kategori dan 40 langkah menonaktifkan tombol Tambah
- [ ] Audit log admin mencatat setiap tambah/ubah/terbit/draf/urut/hapus panduan dengan keterangan
- [ ] Mahasiswa: cari, filter kategori, buka langkah, Buka di Drive; centang "Sudah saya lewati" (tidak mengubah persen di dasbor); hitungan "x dari n" benar
- [ ] Matikan internet setelah membuka Panduan: tetap terbaca dengan keterangan salinan; di HP 360 px tidak ada teks terpotong; tema Gelap dan semua warna terbaca
- [ ] Uji sengaja dari konsol dengan akun mahasiswa: tulis ke panduanKategori/panduanLangkah ditolak; baca langkah draf ditolak; akun belum disetujui tidak bisa membaca

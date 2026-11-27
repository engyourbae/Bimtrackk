import {Modal} from './shared/ui';
/** Penjelasan rumus progres (sesuai progress.js). */
export default function Formula({open,onClose}){
  return <Modal open={open} title="Cara menghitung progres" onClose={onClose}><div className="formula">
    <p>Progres dihitung dari datamu sendiri, per bab (Bab I sampai Bab V):</p>
    <ul><li><b>20%</b> jika sudah ada bimbingan berstatus <i>Terlaksana</i> yang membahas bab itu.</li><li><b>80%</b> dari rata-rata skor revisi dan skor kegiatan rundown bab itu. Jika salah satunya tidak ada, yang ada saja yang dipakai.</li></ul>
    <p><b>Skor revisi:</b> Selesai dan disetujui 1 · Menunggu pemeriksaan 0,75 · Sedang dikerjakan 0,4 · Perlu revisi ulang 0,2 · Belum dikerjakan 0.</p>
    <p><b>Skor rundown:</b> Selesai 1 · Berjalan 0,5 · Belum mulai 0.</p>
    <p><b>Progres keseluruhan</b> adalah rata-rata kelima bab. Bab tanpa data dihitung 0%.</p>
    <p><b>Progres Outline sampai Seminar Proposal</b> dihitung terpisah: jumlah tahapan pra-skripsi yang kamu tandai <i>Selesai</i> di halaman Perjalanan dibagi jumlah seluruh tahapan. Tahap berstatus <i>Berjalan</i> tampil, tetapi belum menambah persen. Progres ini tidak memengaruhi progres Bab I sampai Bab V.</p>
    <p><b>Status bab:</b> Selesai (100%) · Perlu perhatian (ada revisi ulang atau yang terlambat) · Siap diperiksa (semua revisi menunggu pemeriksaan atau selesai) · Dalam proses · Belum dimulai.</p></div></Modal>}

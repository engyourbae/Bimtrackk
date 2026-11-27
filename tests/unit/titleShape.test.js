import {describe,it,expect} from 'vitest';
import {funnelLines,widest} from '../../bimtrack-user/src/titleShape.js';

const len=s=>[...s].length;
const TITLES=[
  'Sistem Informasi Bimbingan Skripsi Berbasis Web',
  'Pengaruh Kepemimpinan Transformasional dan Motivasi Kerja terhadap Kinerja Pegawai pada Dinas Pendidikan Kabupaten Gowa',
  'Rancang Bangun Aplikasi Monitoring Progres Skripsi Mahasiswa Berbasis Progressive Web App dengan Firebase',
  'Implementasi Algoritma K-Means Clustering untuk Pengelompokan Data Penjualan di Toko XYZ Makassar Tahun 2025',
  'Pengembangan Media Pembelajaran Interaktif Menggunakan Articulate Storyline pada Mata Pelajaran Matematika Kelas VIII SMP Negeri 1 Sungguminasa',
  'Analisis Faktor-Faktor yang Memengaruhi Minat Beli Konsumen Generasi Z terhadap Produk Skincare Lokal melalui Marketplace Digital di Kota Makassar pada Tahun 2026'];

describe('funnelLines (judul segitiga terbalik)',()=>{
  it('judul kosong atau spasi saja menghasilkan array kosong',()=>{
    expect(funnelLines('')).toEqual([]);expect(funnelLines('   ')).toEqual([]);expect(funnelLines(null)).toEqual([]);expect(funnelLines(undefined)).toEqual([]);
  });
  it('judul pendek atau satu kata tetap satu baris',()=>{
    expect(funnelLines('Analisis')).toEqual(['Analisis']);
    expect(funnelLines('Kajian Pustaka')).toEqual(['Kajian Pustaka']);
  });
  it('spasi berlebih dirapikan',()=>{
    expect(funnelLines('  Sistem   Informasi \n Bimbingan Skripsi Berbasis Web ').join(' ')).toBe('Sistem Informasi Bimbingan Skripsi Berbasis Web');
  });
  it.each(TITLES)('bentuk benar: %s',t=>{
    const lines=funnelLines(t);
    expect(lines.length).toBeGreaterThanOrEqual(2);
    expect(lines.join(' ')).toBe(t);                                  // kata utuh dan urutan tidak berubah
    for(let i=1;i<lines.length;i++)expect(len(lines[i])).toBeLessThanOrEqual(len(lines[i-1])); // tidak pernah melebar ke bawah
    expect(len(lines.at(-1))).toBeLessThan(len(lines[0]));              // ujung bawah lebih sempit dari atas
  });
  it('baris pertama dibatasi maxFirst bila kata-katanya memungkinkan',()=>{
    const lines=funnelLines('Sistem Informasi Bimbingan Skripsi Berbasis Web',{maxFirst:30});
    expect(len(lines[0])).toBeLessThanOrEqual(30);
  });
  it('kata yang lebih panjang dari maxFirst tidak dipotong',()=>{
    const w='Konstitusionalisasi';const lines=funnelLines(`${w} Pembangunan Hukum Nasional di Indonesia`,{maxFirst:10});
    expect(lines.join(' ')).toContain(w);
  });
  it('hasil sama untuk masukan sama (deterministik)',()=>{
    expect(funnelLines(TITLES[1])).toEqual(funnelLines(TITLES[1]));
  });
  it('widest = jumlah karakter baris terpanjang, minimal 1',()=>{
    expect(widest(['abc','abcdef','ab'])).toBe(6);expect(widest([])).toBe(1);
  });
});

import {describe,it,expect} from 'vitest';
import {LIM,isDrive,cekKategori,cekLangkah,tampilOf,sortU,byUrutan,nextUrutan,geser,toMs,susun,cari,barisSyarat} from '../../shared/panduan.js';

const K=(id,judul,urutan,terbit=true,extra={})=>({id,judul,urutan,terbit,...extra});
const L=(id,kategoriId,judul,urutan,tampil=true,extra={})=>({id,kategoriId,judul,urutan,tampil,isi:'isi '+judul,...extra});

describe('tautan Drive',()=>{
  it.each(['https://drive.google.com/file/d/abc/view','https://docs.google.com/document/d/abc/edit','  https://drive.google.com/drive/folders/x  '])('diterima: %s',u=>expect(isDrive(u)).toBe(true));
  it.each(['http://drive.google.com/file/d/abc','https://example.com/x','javascript:alert(1)','https://drive.google.com.evil.com/x','ftp://drive.google.com/x','','https://evil.com/?https://drive.google.com/'])('ditolak: %s',u=>expect(isDrive(u)).toBe(false));
});

describe('validasi formulir',()=>{
  it('kategori: judul wajib dan dibatasi',()=>{
    expect(cekKategori({judul:' '}).judul).toBeTruthy();
    expect(cekKategori({judul:'Seminar Hasil'})).toEqual({});
    expect(cekKategori({judul:'x'.repeat(LIM.JUDUL_KAT)})).toEqual({});
    expect(cekKategori({judul:'x'.repeat(LIM.JUDUL_KAT+1)}).judul).toBeTruthy();
  });
  it('langkah: judul dan penjelasan wajib; batas panjang tiap kolom',()=>{
    const ok={judul:'Ajukan outline',isi:'Serahkan outline ke prodi.'};
    expect(cekLangkah(ok)).toEqual({});
    expect(Object.keys(cekLangkah({judul:'',isi:''})).sort()).toEqual(['isi','judul']);
    expect(cekLangkah({...ok,isi:'x'.repeat(LIM.ISI)})).toEqual({});
    expect(cekLangkah({...ok,isi:'x'.repeat(LIM.ISI+1)}).isi).toBeTruthy();
    expect(cekLangkah({...ok,judul:'x'.repeat(LIM.JUDUL+1)}).judul).toBeTruthy();
    expect(cekLangkah({...ok,syarat:'x'.repeat(LIM.SYARAT+1)}).syarat).toBeTruthy();
    expect(cekLangkah({...ok,lama:'x'.repeat(LIM.LAMA+1)}).lama).toBeTruthy();
  });
  it('langkah: tautan non-Drive atau non-https ditolak; kosong boleh',()=>{
    const ok={judul:'J',isi:'I'};
    expect(cekLangkah({...ok,url:''})).toEqual({});
    expect(cekLangkah({...ok,url:'https://drive.google.com/file/d/abc'})).toEqual({});
    expect(cekLangkah({...ok,url:'http://drive.google.com/file/d/abc'}).url).toBeTruthy();
    expect(cekLangkah({...ok,url:'https://contoh.com/x'}).url).toBeTruthy();
    expect(cekLangkah({...ok,url:'javascript:alert(1)'}).url).toBeTruthy();
    expect(cekLangkah({...ok,url:'https://drive.google.com/'+'a'.repeat(LIM.URL)}).url).toBeTruthy();
  });
  it('batas jumlah tercatat',()=>{expect(LIM.KATEGORI_MAX).toBe(12);expect(LIM.LANGKAH_MAX).toBe(40)});
});

describe('draf dan terbit',()=>{
  it('langkah tampil hanya bila langkah dan kategorinya sama-sama terbit',()=>{
    expect(tampilOf(true,true)).toBe(true);expect(tampilOf(true,false)).toBe(false);expect(tampilOf(false,true)).toBe(false);expect(tampilOf(undefined,true)).toBe(false);expect(tampilOf(true,'ya')).toBe(false);
  });
});

describe('urutan',()=>{
  it('terurut menurut urutan lalu waktu dibuat lalu id; tanpa urutan di akhir',()=>{
    const rows=[{id:'c'},{id:'b',urutan:1},{id:'a',urutan:0},{id:'d',urutan:1,createdAt:{seconds:1}}];
    expect(sortU(rows).map(r=>r.id)).toEqual(['a','b','d','c']);
    expect([...rows].reverse().sort(byUrutan).map(r=>r.id)).toEqual(['a','b','d','c']);
  });
  it('urutan baru di akhir, tidak bentrok walau ada lubang',()=>{
    expect(nextUrutan([])).toBe(0);expect(nextUrutan([{urutan:0},{urutan:1}])).toBe(2);expect(nextUrutan([{urutan:0},{urutan:5}])).toBe(6);expect(nextUrutan([{},{}])).toBe(2);
  });
  it('geser menukar dua item dan menomori ulang; batas atas/bawah tidak menulis',()=>{
    const rows=[{id:'a',urutan:0},{id:'b',urutan:1},{id:'c',urutan:2}];
    expect(geser(rows,'b',-1)).toEqual([{id:'b',urutan:0},{id:'a',urutan:1}]);
    expect(geser(rows,'a',-1)).toEqual([]);expect(geser(rows,'c',1)).toEqual([]);expect(geser(rows,'x',1)).toEqual([]);
  });
  it('geser merapikan urutan yang berlubang setelah penghapusan',()=>{
    expect(geser([{id:'a',urutan:0},{id:'b',urutan:3}],'b',-1)).toEqual([{id:'b',urutan:0},{id:'a',urutan:1}]);
  });
});

describe('pohon untuk mahasiswa',()=>{
  const kats=[K('k2','Seminar Hasil',1),K('k1','Pengajuan Outline',0),K('k3','Draf',2,false)];
  const langs=[L('l2','k1','Dua',1,true,{updatedAt:{seconds:200}}),L('l1','k1','Satu',0,true,{updatedAt:{seconds:100}}),L('l3','k1','Tersembunyi',2,false),L('l4','k2','Hasil',0),L('l5','k3','Di kategori draf',0),L('l6','kx','Yatim',0)];
  it('hanya kategori terbit dan langkah tampil, terurut; yatim dibuang',()=>{
    const t=susun(kats,langs);
    expect(t.map(k=>k.id)).toEqual(['k1','k2']);
    expect(t[0].langkah.map(l=>l.id)).toEqual(['l1','l2']);
    expect(t[1].langkah.map(l=>l.id)).toEqual(['l4']);
  });
  it('tanggal pembaruan kategori = yang terbaru antara kategori dan langkahnya',()=>{
    const t=susun([K('k1','A',0,true,{updatedAt:{seconds:50}})],[L('l1','k1','S',0,true,{updatedAt:{seconds:300}})]);
    expect(t[0].diperbarui).toBe(300000);
    expect(susun([K('k1','A',0,true,{updatedAt:{seconds:50}})],[])[0].diperbarui).toBe(50000);
  });
  it('toMs menerima Timestamp, {seconds}, angka, dan kosong',()=>{
    expect(toMs({toMillis:()=>7})).toBe(7);expect(toMs({seconds:2})).toBe(2000);expect(toMs(9)).toBe(9);expect(toMs(null)).toBe(0);
  });
  it('pencarian: cocok pada judul/penjelasan/syarat/lama; judul kategori cocok membawa semua langkahnya; kategori tanpa kecocokan dibuang',()=>{
    const t=susun([K('k1','Pengajuan Outline',0),K('k2','Seminar Hasil',1)],[L('a','k1','Siapkan berkas',0,true,{isi:'Cetak lembar pengesahan',syarat:'- KRS\n- Transkrip',lama:'2 minggu'}),L('b','k2','Daftar',0,true,{isi:'Isi formulir'})]);
    expect(cari(t,'')).toBe(t);
    expect(cari(t,'pengesahan').map(k=>k.id)).toEqual(['k1']);
    expect(cari(t,'TRANSKRIP')[0].langkah.map(l=>l.id)).toEqual(['a']);
    expect(cari(t,'minggu')[0].id).toBe('k1');
    expect(cari(t,'seminar')[0].langkah.map(l=>l.id)).toEqual(['b']);
    expect(cari(t,'tidak ada kata ini')).toEqual([]);
  });
  it('baris syarat: satu per baris, tanda daftar dibuang, baris kosong dilewati',()=>{
    expect(barisSyarat('- KRS\n• Transkrip\n\n  * Foto 3x4 ')).toEqual(['KRS','Transkrip','Foto 3x4']);
    expect(barisSyarat('')).toEqual([]);expect(barisSyarat(undefined)).toEqual([]);
  });
});

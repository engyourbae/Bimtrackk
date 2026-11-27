import {describe,it,expect} from 'vitest';
import {calcProgress,nextStep,urgentRevisi,BABS} from '../../bimtrack-user/src/progress.js';
import {ST} from '../../bimtrack-user/src/config.js';

const TODAY='2026-11-27';
const [BELUM,SEDANG,MENUNGGU,ULANG,SELESAI]=ST;

describe('calcProgress (rumus Bab I-V)',()=>{
  it('tanpa data: semua bab 0% dan belum dimulai',()=>{
    const P=calcProgress({today:TODAY});
    expect(P.overall).toBe(0);
    expect(P.babs).toHaveLength(5);
    expect(P.babs.map(b=>b.bab)).toEqual(BABS);
    P.babs.forEach(b=>{expect(b.pct).toBe(0);expect(b.status).toBe('Belum dimulai')});
  });
  it('bimbingan Terlaksana saja = 20%',()=>{
    const P=calcProgress({bimbingan:[{bab:'Bab I',status:'Terlaksana'}],today:TODAY});
    expect(P.babs[0].pct).toBe(20);expect(P.babs[0].discussed).toBe(true);expect(P.babs[0].status).toBe('Dalam proses');
    expect(P.overall).toBe(4); // 20 dibagi 5 bab
  });
  it('bimbingan Dijadwalkan atau Dibatalkan tidak dihitung sudah dibahas',()=>{
    const P=calcProgress({bimbingan:[{bab:'Bab I',status:'Dijadwalkan'},{bab:'Bab I',status:'Dibatalkan'}],today:TODAY});
    expect(P.babs[0].discussed).toBe(false);expect(P.babs[0].pct).toBe(0);
  });
  it('dibahas + semua revisi selesai = 100% dan Selesai',()=>{
    const P=calcProgress({bimbingan:[{bab:'Bab I',status:'Terlaksana'}],revisi:[{bab:'Bab I',status:SELESAI}],today:TODAY});
    expect(P.babs[0].pct).toBe(100);expect(P.babs[0].status).toBe('Selesai');expect(P.overall).toBe(20);
  });
  it('skor revisi dan rundown dirata-rata: (0,4 + 0,5)/2 x 80 = 36',()=>{
    const P=calcProgress({revisi:[{bab:'Bab II',status:SEDANG}],rundown:[{bab:'Bab II',status:'Berjalan'}],today:TODAY});
    expect(P.babs[1].pct).toBe(36);
  });
  it('bila hanya salah satu (revisi/rundown) ada, hanya itu yang dipakai',()=>{
    const P=calcProgress({rundown:[{bab:'Bab III',status:'Selesai'}],today:TODAY});
    expect(P.babs[2].pct).toBe(80);
  });
  it('setiap skor revisi sesuai tabel',()=>{
    const pct=s=>calcProgress({revisi:[{bab:'Bab I',status:s}],today:TODAY}).babs[0].pct;
    expect(pct(BELUM)).toBe(0);expect(pct(SEDANG)).toBe(32);expect(pct(MENUNGGU)).toBe(60);expect(pct(ULANG)).toBe(16);expect(pct(SELESAI)).toBe(80);
  });
  it('revisi terlambat dan revisi ulang membuat status Perlu perhatian',()=>{
    const late=calcProgress({revisi:[{bab:'Bab I',status:SEDANG,deadline:'2026-11-01'}],today:TODAY}).babs[0];
    expect(late.late).toBe(1);expect(late.status).toBe('Perlu perhatian');
    const redo=calcProgress({revisi:[{bab:'Bab I',status:ULANG}],today:TODAY}).babs[0];
    expect(redo.redo).toBe(1);expect(redo.status).toBe('Perlu perhatian');
  });
  it('revisi selesai atau diarsipkan tidak dihitung terlambat',()=>{
    const b=calcProgress({revisi:[{bab:'Bab I',status:SELESAI,deadline:'2026-11-01'},{bab:'Bab I',status:SEDANG,deadline:'2026-11-01',archived:true}],today:TODAY}).babs[0];
    expect(b.late).toBe(0);
  });
  it('semua revisi menunggu pemeriksaan = Siap diperiksa',()=>{
    const b=calcProgress({revisi:[{bab:'Bab I',status:MENUNGGU},{bab:'Bab I',status:SELESAI}],today:TODAY}).babs[0];
    expect(b.status).toBe('Siap diperiksa');expect(b.waiting).toBe(1);
  });
  it('revisi/rundown tanpa Bab I-V (mis. Umum) dihitung sebagai di luar bab',()=>{
    const P=calcProgress({revisi:[{bab:'Umum',status:SELESAI},{status:SELESAI}],rundown:[{bab:'Umum',status:'Selesai'}],today:TODAY});
    expect(P.outside).toEqual({rev:2,run:1});expect(P.overall).toBe(0);
  });
  it('progres keseluruhan = rata-rata lima bab dibulatkan',()=>{
    const P=calcProgress({rundown:[{bab:'Bab I',status:'Selesai'},{bab:'Bab II',status:'Selesai'},{bab:'Bab III',status:'Berjalan'}],today:TODAY});
    expect(P.overall).toBe(Math.round((80+80+40)/5));
  });
});

describe('urgentRevisi',()=>{
  const rows=[
    {id:'a',status:SEDANG,deadline:'2026-11-20',prioritas:'Rendah'},      // terlambat
    {id:'b',status:SEDANG,deadline:'2026-11-30',prioritas:'Sedang'},      // 3 hari lagi
    {id:'c',status:SEDANG,deadline:'2026-12-30',prioritas:'Rendah'},      // jauh, tidak mendesak
    {id:'d',status:SEDANG,prioritas:'Tinggi'},                            // prioritas tinggi tanpa deadline
    {id:'e',status:SELESAI,deadline:'2026-11-20',prioritas:'Tinggi'},     // selesai
    {id:'f',status:ULANG,deadline:'2026-12-30'}];                          // revisi ulang
  it('terlambat dulu, lalu deadline terdekat; selesai dan jauh tidak ikut',()=>{
    const ids=urgentRevisi(rows,TODAY,10).map(x=>x.id);
    expect(ids.slice(0,2)).toEqual(['a','b']);
    expect(ids).toContain('d');expect(ids).toContain('f');
    expect(ids).not.toContain('c');expect(ids).not.toContain('e');
  });
  it('menghormati limit',()=>{expect(urgentRevisi(rows,TODAY,2)).toHaveLength(2)});
});

describe('nextStep',()=>{
  it('tanpa data apa pun: ajak catat bimbingan pertama',()=>{
    expect(nextStep({today:TODAY}).to).toBe('bim/baru');
  });
  it('revisi terlambat paling diutamakan',()=>{
    const n=nextStep({revisi:[{bab:'Bab I',status:SEDANG,deadline:'2026-11-20',catatan:'Perbaiki latar belakang'}],jadwal:[{tanggal:'2026-11-28',status:'Dikonfirmasi'}],today:TODAY});
    expect(n.tone).toBe('danger');expect(n.to).toBe('rev');expect(n.detail).toContain('terlambat 7 hari');
  });
  it('kegiatan rundown terlambat',()=>{
    const n=nextStep({rundown:[{nama:'Kuesioner',status:'Berjalan',deadline:'2026-11-25'}],today:TODAY});
    expect(n.tone).toBe('danger');expect(n.to).toBe('run');
  });
  it('jadwal dalam 2 hari: siapkan pertemuan',()=>{
    const n=nextStep({bimbingan:[{status:'Terlaksana'}],jadwal:[{tanggal:'2026-11-28',jam:'09:00',dosen:'Dr. A',agenda:'Bab I',status:'Dikonfirmasi'}],today:TODAY});
    expect(n.to).toBe('jdw');expect(n.title).toContain('Dr. A');
  });
  it('jadwal yang dibatalkan atau selesai diabaikan',()=>{
    const n=nextStep({bimbingan:[{status:'Terlaksana'}],jadwal:[{tanggal:'2026-11-28',status:'Dibatalkan'},{tanggal:'2026-11-28',status:'Selesai'}],today:TODAY});
    expect(n.tone).toBe('ok');
  });
  it('semua beres: Semua tertata',()=>{
    const n=nextStep({bimbingan:[{status:'Terlaksana'}],revisi:[{status:SELESAI}],today:TODAY});
    expect(n.tone).toBe('ok');expect(n.title).toBe('Semua tertata untuk saat ini');expect(n.to).toBe('jdw/baru');
  });
});

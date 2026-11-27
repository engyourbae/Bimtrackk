import {describe,it,expect} from 'vitest';
import {parseDate,toIso,addDays,diffDays,isTime,fmtDate,relDay,monthGrid,relTime,sapaan,hariPanjang,FORMATS} from '../../shared/date.js';

describe('tanggal',()=>{
  it('parseDate menolak tanggal tidak nyata',()=>{
    expect(parseDate('2026-02-30')).toBeNull();expect(parseDate('2026-13-01')).toBeNull();expect(parseDate('27-11-2026')).toBeNull();expect(parseDate('')).toBeNull();expect(parseDate(undefined)).toBeNull();
    expect(toIso(parseDate('2026-11-27'))).toBe('2026-11-27');
  });
  it('addDays melewati batas bulan dan tahun',()=>{
    expect(addDays('2026-11-30',1)).toBe('2026-12-01');expect(addDays('2026-12-31',1)).toBe('2027-01-01');expect(addDays('2026-03-01',-1)).toBe('2026-02-28');
  });
  it('diffDays tepat dalam hari, tidak terpengaruh zona waktu',()=>{
    expect(diffDays('2026-11-27','2026-11-27')).toBe(0);expect(diffDays('2026-12-01','2026-11-27')).toBe(4);expect(diffDays('2026-11-20','2026-11-27')).toBe(-7);
  });
  it('isTime',()=>{
    expect(isTime('00:00')).toBe(true);expect(isTime('23:59')).toBe(true);expect(isTime('24:00')).toBe(false);expect(isTime('9:30')).toBe(false);expect(isTime('')).toBe(false);
  });
  it('fmtDate: tiga format',()=>{
    expect(fmtDate('2026-11-27','panjang')).toBe('27 November 2026');
    expect(fmtDate('2026-11-27','sedang')).toBe('27 Nov 2026');
    expect(fmtDate('2026-11-27','angka')).toBe('27/11/2026');
    expect(Object.keys(FORMATS)).toEqual(['panjang','sedang','angka']);
  });
  it('fmtDate mengembalikan masukan apa adanya bila bukan tanggal',()=>{expect(fmtDate('bukan tanggal','sedang')).toBe('bukan tanggal');expect(fmtDate('', 'sedang')).toBe('')});
  it('relDay',()=>{
    const n='2026-11-27';
    expect(relDay('2026-11-27',n)).toBe('Hari ini');expect(relDay('2026-11-28',n)).toBe('Besok');expect(relDay('2026-11-26',n)).toBe('Kemarin');
    expect(relDay('2026-11-30',n)).toBe('3 hari lagi');expect(relDay('2026-11-24',n)).toBe('3 hari lalu');expect(relDay('x',n)).toBe('');
  });
  it('monthGrid: minggu mulai Senin, kelipatan 7 sel, memuat seluruh hari bulan itu',()=>{
    const g=monthGrid(2026,10); // November 2026 (1 Nov = Minggu)
    expect(g.length%7).toBe(0);expect(g[0].date).toBe('2026-10-26');expect(g.filter(x=>x.inMonth)).toHaveLength(30);
    expect(g.find(x=>x.date==='2026-11-01').inMonth).toBe(true);
  });
  it('sapaan menurut jam',()=>{
    expect(sapaan(5)).toBe('Selamat pagi');expect(sapaan(10)).toBe('Selamat pagi');expect(sapaan(11)).toBe('Selamat siang');expect(sapaan(14)).toBe('Selamat siang');
    expect(sapaan(15)).toBe('Selamat sore');expect(sapaan(17)).toBe('Selamat sore');expect(sapaan(18)).toBe('Selamat malam');expect(sapaan(23)).toBe('Selamat malam');
  });
  it('hariPanjang',()=>{expect(hariPanjang('2026-11-27')).toBe('Jumat, 27 November 2026')});
  it('relTime',()=>{
    const now=Date.UTC(2026,10,27,12,0,0),s=now/1000;
    expect(relTime(s-10,now)).toBe('baru saja');expect(relTime(s-5*60,now)).toBe('5 menit lalu');expect(relTime(s-3*3600,now)).toBe('3 jam lalu');expect(relTime(s-30*3600,now)).toBe('kemarin');
  });
});

import {describe,it,expect} from 'vitest';
import {isActive,isPast,byWhen,weekStart,weekDays,reminders,notifyPlan} from '../../bimtrack-user/src/schedule.js';

const TODAY='2026-11-27';
describe('jadwal',()=>{
  it('isActive: hanya yang belum selesai/dibatalkan/dijadwalkan ulang',()=>{
    ['Direncanakan','Menunggu konfirmasi','Dikonfirmasi'].forEach(s=>expect(isActive({status:s})).toBe(true));
    ['Selesai','Dibatalkan','Dijadwalkan ulang'].forEach(s=>expect(isActive({status:s})).toBe(false));
  });
  it('isPast',()=>{
    expect(isPast({tanggal:'2026-11-26',status:'Direncanakan'},TODAY)).toBe(true);
    expect(isPast({tanggal:'2026-11-27',status:'Direncanakan'},TODAY)).toBe(false);
    expect(isPast({tanggal:'2026-12-01',status:'Selesai'},TODAY)).toBe(true);
  });
  it('byWhen: urut tanggal lalu jam; tanpa jam di akhir hari itu',()=>{
    const a=[{id:1,tanggal:'2026-11-28',jam:'10:00'},{id:2,tanggal:'2026-11-28'},{id:3,tanggal:'2026-11-27',jam:'15:00'},{id:4,tanggal:'2026-11-28',jam:'08:00'}].sort(byWhen).map(x=>x.id);
    expect(a).toEqual([3,4,1,2]);
  });
  it('weekStart: Senin; weekDays: tujuh hari berurutan',()=>{
    expect(weekStart('2026-11-27')).toBe('2026-11-23');expect(weekStart('2026-11-29')).toBe('2026-11-23');expect(weekStart('2026-11-23')).toBe('2026-11-23');
    expect(weekDays('2026-11-23')).toEqual(['2026-11-23','2026-11-24','2026-11-25','2026-11-26','2026-11-27','2026-11-28','2026-11-29']);
  });
  it('reminders: stale = lewat tapi belum selesai; soon = hari ini/besok',()=>{
    const rows=[{id:'a',tanggal:'2026-11-20',status:'Direncanakan'},{id:'b',tanggal:'2026-11-27',jam:'09:00',status:'Dikonfirmasi'},{id:'c',tanggal:'2026-11-28',status:'Direncanakan'},{id:'d',tanggal:'2026-12-10',status:'Direncanakan'},{id:'e',tanggal:'2026-11-20',status:'Selesai'}];
    const r=reminders(rows,TODAY);
    expect(r.stale.map(x=>x.id)).toEqual(['a']);expect(r.soon.map(x=>x.id)).toEqual(['b','c']);
  });
  it('notifyPlan: hanya yang ber-jam, aktif, dan dalam 24 jam; pengingat 30 menit sebelum',()=>{
    const now=new Date(2026,10,27,8,0).getTime(),ev=new Date(2026,10,27,9,0).getTime();
    const rows=[{id:'a',tanggal:'2026-11-27',jam:'09:00',agenda:'Bab I',dosen:'Dr. A',status:'Dikonfirmasi'},
      {id:'b',tanggal:'2026-11-27',jam:'07:00',status:'Dikonfirmasi'},   // sudah lewat
      {id:'c',tanggal:'2026-11-29',jam:'09:00',status:'Dikonfirmasi'},   // lebih dari 24 jam
      {id:'d',tanggal:'2026-11-27',status:'Dikonfirmasi'},                // tanpa jam
      {id:'e',tanggal:'2026-11-27',jam:'10:00',status:'Dibatalkan'}];     // tidak aktif
    const p=notifyPlan(rows,now);
    expect(p).toHaveLength(1);expect(p[0].eventAt).toBe(ev);expect(p[0].at).toBe(ev-30*6e4);expect(p[0].title).toBe('Bab I');expect(p[0].body).toContain('Dr. A');
  });
  it('notifyPlan: bila pengingat sudah lewat tetapi acara belum, dibunyikan sekarang',()=>{
    const now=new Date(2026,10,27,8,50).getTime();
    const p=notifyPlan([{id:'a',tanggal:'2026-11-27',jam:'09:00',status:'Dikonfirmasi'}],now);
    expect(p[0].at).toBe(now);
  });
});

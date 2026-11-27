import {describe,it,expect} from 'vitest';
import {buildIcs,icsText,fold,exportable} from '../../bimtrack-user/src/ics.js';

const NOW=Date.UTC(2026,10,27,1,0,0);
describe('.ics',()=>{
  it('icsText meng-escape karakter khusus RFC 5545',()=>{
    expect(icsText('a,b;c\\d\ne')).toBe('a\\,b\\;c\\\\d\\ne');expect(icsText(null)).toBe('');
  });
  it('fold: tiap baris maksimal 75 byte dan bisa disambung lagi tanpa kehilangan teks',()=>{
    const long='SUMMARY:'+'Bimbingan Bab Pendahuluan é '.repeat(12),out=fold(long),enc=new TextEncoder();
    out.split('\r\n').forEach(l=>expect(enc.encode(l).length).toBeLessThanOrEqual(75));
    expect(out.replace(/\r\n /g,'')).toBe(long);
  });
  it('exportable: aktif, tanggal valid, belum lewat, terurut',()=>{
    const r=exportable([{id:'a',tanggal:'2026-11-30',status:'Direncanakan'},{id:'b',tanggal:'2026-11-20',status:'Direncanakan'},{id:'c',tanggal:'2026-11-28',status:'Selesai'},{id:'d',tanggal:'bukan',status:'Direncanakan'},{id:'e',tanggal:'2026-11-28',status:'Dikonfirmasi'}],'2026-11-27');
    expect(r.map(x=>x.id)).toEqual(['e','a']);
  });
  it('jadwal ber-jam: acara 1 jam waktu lokal + alarm 30 menit',()=>{
    const s=buildIcs([{id:'j1',tanggal:'2026-11-28',jam:'09:30',agenda:'Bab I',dosen:'Dr. A',lokasi:'Ruang 3',status:'Dikonfirmasi'}],NOW);
    expect(s).toContain('DTSTART:20261128T093000');expect(s).toContain('DTEND:20261128T103000');
    expect(s).toContain('BEGIN:VALARM');expect(s).toContain('TRIGGER:-PT30M');expect(s).toContain('STATUS:CONFIRMED');
    expect(s).toContain('UID:j1@bimtrack.app');expect(s).toContain('LOCATION:Ruang 3');expect(s).toContain('SUMMARY:Bimbingan: Bab I');
  });
  it('jadwal tanpa jam: acara seharian tanpa alarm',()=>{
    const s=buildIcs([{id:'j2',tanggal:'2026-11-30',agenda:'Revisi',status:'Direncanakan'}],NOW);
    expect(s).toContain('DTSTART;VALUE=DATE:20261130');expect(s).toContain('DTEND;VALUE=DATE:20261201');expect(s).not.toContain('VALARM');expect(s).toContain('STATUS:TENTATIVE');
  });
  it('berkas valid secara struktur: CRLF, diawali VCALENDAR, ditutup CRLF',()=>{
    const s=buildIcs([{id:'j1',tanggal:'2026-11-28',jam:'09:30',agenda:'A',status:'Dikonfirmasi'}],NOW);
    expect(s.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);expect(s.endsWith('END:VCALENDAR\r\n')).toBe(true);expect(s.includes('\n')&&!/[^\r]\n/.test(s)).toBe(true);
    expect((s.match(/BEGIN:VEVENT/g)||[]).length).toBe(1);expect((s.match(/END:VEVENT/g)||[]).length).toBe(1);
  });
});

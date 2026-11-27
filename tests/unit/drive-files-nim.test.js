import {describe,it,expect} from 'vitest';
import {isDriveUrl,parseDrive} from '../../bimtrack-user/src/drive.js';
import {safe,esc} from '../../bimtrack-user/src/files.js';
import {nimEmail,validNim} from '../../bimtrack-user/src/shared/nim.js';

describe('tautan Google Drive',()=>{
  it('hanya menerima https drive.google.com / docs.google.com',()=>{
    expect(isDriveUrl('https://drive.google.com/file/d/abc/view')).toBe(true);
    expect(isDriveUrl('https://docs.google.com/document/d/abc/edit')).toBe(true);
    expect(isDriveUrl('http://drive.google.com/file/d/abc')).toBe(false);
    expect(isDriveUrl('https://evil.example/drive.google.com/file/d/abc')).toBe(false);
    expect(isDriveUrl('https://drive.google.com.evil.example/x')).toBe(false);
    expect(isDriveUrl('javascript:alert(1)')).toBe(false);expect(isDriveUrl('')).toBe(false);expect(isDriveUrl(null)).toBe(false);
  });
  it('parseDrive: file, folder, dokumen, id di query, lainnya',()=>{
    expect(parseDrive('https://drive.google.com/file/d/ID_1-x/view')).toMatchObject({kind:'file',id:'ID_1-x'});
    expect(parseDrive('https://drive.google.com/open?id=ABC123')).toMatchObject({kind:'file',id:'ABC123'});
    expect(parseDrive('https://drive.google.com/drive/folders/FOLD1')).toMatchObject({kind:'folder',id:'FOLD1',thumb:null});
    expect(parseDrive('https://docs.google.com/spreadsheets/d/SHEET1/edit')).toMatchObject({kind:'spreadsheets',id:'SHEET1'});
    expect(parseDrive('https://drive.google.com/drive/my-drive')).toMatchObject({kind:'other',preview:null});
    expect(parseDrive('https://example.com/file/d/abc')).toBeNull();
  });
  it('alamat pratinjau selalu di domain Google',()=>{
    const p=parseDrive('https://drive.google.com/file/d/ID1/view');
    expect(p.preview.startsWith('https://drive.google.com/')).toBe(true);expect(p.thumb.startsWith('https://drive.google.com/')).toBe(true);
  });
});

describe('CSV: pencegahan injeksi rumus dan escape',()=>{
  it('safe memberi apostrof pada sel berawalan = + - @ tab CR',()=>{
    ['=1+1','+1','-1','@SUM(A1)','\tx','\rx'].forEach(v=>expect(safe(v).startsWith("'")).toBe(true));
    expect(safe('biasa')).toBe('biasa');expect(safe(null)).toBe('');expect(safe(12)).toBe('12');
  });
  it('esc membungkus sel berisi pemisah, tanda kutip, atau baris baru',()=>{
    expect(esc('a,b',',')).toBe('"a,b"');expect(esc('say "hi"',',')).toBe('"say ""hi"""');expect(esc('baris1\nbaris2',',')).toBe('"baris1\nbaris2"');
    expect(esc('a;b',';')).toBe('"a;b"');expect(esc('a;b',',')).toBe('a;b');expect(esc('=cmd|calc',',')).toBe("'=cmd|calc");
  });
});

describe('NIM',()=>{
  it('nimEmail: huruf kecil, tanpa spasi, versi >1 diberi .vN',()=>{
    expect(nimEmail('  2023ABC ')).toBe('2023abc@auth.bimtrack.app');expect(nimEmail('2023ABC',1)).toBe('2023abc@auth.bimtrack.app');expect(nimEmail('2023ABC',2)).toBe('2023abc.v2@auth.bimtrack.app');
  });
  it('validNim: 5 sampai 20 huruf/angka',()=>{
    expect(validNim('12345')).toBe(true);expect(validNim('A1B2C3D4E5F6G7H8I9J0')).toBe(true);
    expect(validNim('1234')).toBe(false);expect(validNim('123456789012345678901')).toBe(false);expect(validNim('12 345')).toBe(false);expect(validNim('12345@x')).toBe(false);
  });
});

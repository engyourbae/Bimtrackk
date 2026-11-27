import {describe,it,expect} from 'vitest';
import {PERAN,PERAN_LAIN,COLS} from '../../bimtrack-user/src/config.js';
import {numbering,roleLabel,titleOf,cmpDosen,sortDosen,nextUrut,extraUrut,moveUrut,canMove,assignUrut,dosenOptions,groupOf} from '../../bimtrack-user/src/dosen.js';

const P=(id,peran,nama,urut,extra={})=>({id,peran,nama,urut,...extra});
const base=()=>[P('a','Dosen pembimbing','Dr. Ani, M.Si.',0),P('b','Dosen pembimbing','Prof. Budi',1),P('c','Dosen pembimbing','Citra, M.Pd.',2),
  P('d','Dosen penguji','Dedi, M.T.',0),P('e','Dosen penguji','Eka, M.Kom.',1),P('f','Dekan','Prof. Farid',0),P('g','Ketua Program Studi','Gita, M.M.',0),P('h','Rektor','Prof. Hadi',0),
  P('i',PERAN_LAIN,'Indra, S.E.',0,{peranLain:'Wakil Dekan'}),P('j',PERAN_LAIN,'Joko',0,{peranLain:'Admin Akademik'})];

describe('urutan dan nomor otomatis',()=>{
  it('urutan daftar: pembimbing, penguji, Kaprodi, Dekan, Rektor, lalu peran bebas, apa pun urutan datanya',()=>{
    const rows=[...base()].reverse(),s=sortDosen(rows).map(x=>x.id);
    expect(s).toEqual(['a','b','c','d','e','g','f','h','j','i']);
  });
  it('nomor hanya untuk pembimbing dan penguji, mulai dari 1, berurutan',()=>{
    const n=numbering(base());
    expect(n).toEqual({a:1,b:2,c:3,d:1,e:2});
  });
  it('label: "Dosen pembimbing 2", "Dekan", nama peran bebas; judul kartu memuat nama',()=>{
    const rows=base();
    expect(roleLabel(rows[1],rows)).toBe('Dosen pembimbing 2');
    expect(roleLabel(rows[4],rows)).toBe('Dosen penguji 2');
    expect(roleLabel(rows[5],rows)).toBe('Dekan');
    expect(roleLabel(rows[8],rows)).toBe('Wakil Dekan');
    expect(titleOf(rows[0],rows)).toBe('Dosen pembimbing 1 · Dr. Ani, M.Si.');
  });
  it('peran bebas tanpa nama peran tetap punya label',()=>{expect(roleLabel(P('z',PERAN_LAIN,'X',0),[])).toBe(PERAN_LAIN)});
  it('jumlah tidak dibatasi: 25 pembimbing dinomori 1..25',()=>{
    const rows=Array.from({length:25},(_,i)=>P('p'+i,'Dosen pembimbing','D'+i,i));
    const n=numbering(rows);expect(n.p0).toBe(1);expect(n.p24).toBe(25);expect(Object.keys(n)).toHaveLength(25);
  });
  it('data tanpa urut (mis. impor lama) di akhir kelompok, lalu menurut waktu dibuat lalu id; hasil stabil',()=>{
    const rows=[P('x','Dosen penguji','X',undefined,{createdAt:{seconds:5}}),P('y','Dosen penguji','Y',undefined,{createdAt:{seconds:2}}),P('z','Dosen penguji','Z',0)];
    expect(sortDosen(rows).map(r=>r.id)).toEqual(['z','y','x']);
    expect([...rows].reverse().sort(cmpDosen).map(r=>r.id)).toEqual(['z','y','x']);
  });
  it('menghapus satu orang merapikan nomor otomatis',()=>{
    const rows=base().filter(x=>x.id!=='a');expect(numbering(rows)).toMatchObject({b:1,c:2});
  });
  it('kelompok peran bebas dibedakan menurut namanya (tanpa peduli huruf besar-kecil)',()=>{
    expect(groupOf(P('1',PERAN_LAIN,'A',0,{peranLain:' Wakil Dekan '}))).toBe(groupOf(P('2',PERAN_LAIN,'B',0,{peranLain:'wakil dekan'})));
    expect(groupOf(P('1',PERAN_LAIN,'A',0,{peranLain:'Wakil Dekan'}))).not.toBe(groupOf(P('3',PERAN_LAIN,'C',0,{peranLain:'Admin'})));
  });
});

describe('urutan baru dan menggeser',()=>{
  it('orang baru diletakkan di akhir kelompoknya',()=>{
    expect(nextUrut(base(),P('n','Dosen pembimbing','Baru'))).toBe(3);
    expect(nextUrut(base(),P('n','Rektor','Baru'))).toBe(1);
    expect(nextUrut([],P('n','Dekan','Baru'))).toBe(0);
  });
  it('anggota tanpa urut ikut dihitung agar tidak bentrok',()=>{
    expect(nextUrut([P('a','Dekan','A',undefined),P('b','Dekan','B',undefined)],P('n','Dekan','N'))).toBe(2);
  });
  it('extraUrut: pembuatan baru diberi urut; edit di kelompok sama tidak mengubah; pindah peran memberi urut baru',()=>{
    const rows=base();
    expect(extraUrut(P('','Dosen penguji','N'),null,rows)).toEqual({urut:2});
    expect(extraUrut(P('b','Dosen pembimbing','Prof. Budi'),rows[1],rows)).toEqual({});
    expect(extraUrut(P('b','Dosen penguji','Prof. Budi'),rows[1],rows)).toEqual({urut:2});
    expect(extraUrut(P('x','Dekan','X'),P('x','Dekan','X',undefined),[P('x','Dekan','X',undefined)])).toEqual({urut:0});
  });
  it('naik/turun menukar dua orang dalam kelompok yang sama dan menomori ulang',()=>{
    const rows=base();
    expect(moveUrut(rows,'b',-1)).toEqual([{id:'b',urut:0},{id:'a',urut:1}]);
    expect(moveUrut(rows,'b',1)).toEqual([{id:'c',urut:1},{id:'b',urut:2}]);
  });
  it('tidak bisa naik dari paling atas atau turun dari paling bawah; id asing tidak menulis apa pun',()=>{
    const rows=base();
    expect(moveUrut(rows,'a',-1)).toEqual([]);expect(moveUrut(rows,'c',1)).toEqual([]);expect(moveUrut(rows,'zzz',1)).toEqual([]);
    expect(canMove(rows,rows[0],-1)).toBe(false);expect(canMove(rows,rows[0],1)).toBe(true);
    expect(canMove(rows,rows[5],1)).toBe(false); // Dekan sendirian
  });
  it('urutan lintas peran tidak pernah tercampur',()=>{
    const ids=moveUrut(base(),'d',1).map(p=>p.id);expect(ids.every(i=>['d','e'].includes(i))).toBe(true);
  });
  it('data lama tanpa urut dinomori rapi saat digeser',()=>{
    const rows=[P('a','Dekan','A',undefined,{createdAt:{seconds:1}}),P('b','Dekan','B',undefined,{createdAt:{seconds:2}})];
    expect(moveUrut(rows,'b',-1)).toEqual([{id:'b',urut:0},{id:'a',urut:1}]);
  });
  it('impor CSV: baris baru diberi urut lanjutan setelah data yang sudah ada',()=>{
    const out=assignUrut([P('a','Dosen pembimbing','A',0)],[{peran:'Dosen pembimbing',nama:'B'},{peran:'Dosen pembimbing',nama:'C'},{peran:'Dekan',nama:'D'}]);
    expect(out.map(o=>o.urut)).toEqual([1,2,0]);
  });
});

describe('pilihan dosen di Bimbingan dan Jadwal',()=>{
  it('hanya peran yang diminta, tanpa duplikat, urut seperti daftar',()=>{
    const rows=[...base(),P('k','Dosen pembimbing','Prof. Budi',9)];
    expect(dosenOptions(rows,['Dosen pembimbing'])).toEqual(['Dr. Ani, M.Si.','Prof. Budi','Citra, M.Pd.']);
    expect(dosenOptions(rows,['Dosen pembimbing','Dosen penguji'])).toEqual(['Dr. Ani, M.Si.','Prof. Budi','Citra, M.Pd.','Dedi, M.T.','Eka, M.Kom.']);
    expect(dosenOptions([],['Dosen pembimbing'])).toEqual([]);
  });
});

describe('konfigurasi koleksi dosenPejabat',()=>{
  it('terdaftar di COLS dengan peran baku dan penanda koleksi ketat',()=>{
    expect(COLS.dosenPejabat.strict).toBe(true);expect(COLS.dosenPejabat.num).toEqual(['urut']);
    expect(COLS.dosenPejabat.f.find(f=>f.k==='peran').options).toEqual(PERAN);
  });
  it('nama peran bebas wajib hanya bila peran = "Peran lain", dan hanya tampil saat itu',()=>{
    const f=COLS.dosenPejabat.f.find(x=>x.k==='peranLain');
    expect(f.showIf({peran:PERAN_LAIN})).toBe(true);expect(f.showIf({peran:'Dekan'})).toBe(false);
    expect(f.reqIf({peran:PERAN_LAIN})).toBe(true);expect(f.reqIf({peran:'Dekan'})).toBe(false);
  });
  it('isian Dosen di Bimbingan dan Jadwal bisa memilih dari daftar tetapi tetap bebas diketik (bukan select)',()=>{
    expect(COLS.bimbingan.f.find(f=>f.k==='dosen')).toMatchObject({type:'combo',src:'dosenPejabat',req:1});
    expect(COLS.jadwal.f.find(f=>f.k==='dosen')).toMatchObject({type:'combo',src:'dosenPejabat',req:1});
  });
});

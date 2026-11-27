import {describe,it,expect} from 'vitest';
import {calcPra} from '../../bimtrack-user/src/pra.js';
import {PRA} from '../../bimtrack-user/src/config.js';

describe('calcPra (progres Outline sampai Seminar Proposal)',()=>{
  it('belum ada dokumen: 0% dari semua tahap, tahap pertama jadi tahap berikutnya',()=>{
    for(const row of [null,undefined,{}]){
      const P=calcPra(row);
      expect(P.pct).toBe(0);expect(P.done).toBe(0);expect(P.total).toBe(PRA.length);expect(P.complete).toBe(false);
      expect(P.steps.every(s=>s.status==='belum')).toBe(true);expect(P.current.k).toBe(PRA[0].k);
    }
  });
  it('hanya tahap Selesai yang dihitung; Berjalan tidak menambah persen',()=>{
    const P=calcPra({st_topik:'selesai',tg_topik:'2026-10-01',st_judul:'berjalan'});
    expect(P.done).toBe(1);expect(P.pct).toBe(Math.round(100/PRA.length));
    expect(P.steps[1].status).toBe('berjalan');expect(P.current.k).toBe('judul');
  });
  it('tanggal selesai hanya diambil untuk tahap Selesai',()=>{
    const P=calcPra({st_topik:'selesai',tg_topik:'2026-10-01',st_judul:'berjalan',tg_judul:'2026-10-05'});
    expect(P.steps[0].date).toBe('2026-10-01');expect(P.steps[1].date).toBe('');
  });
  it('semua selesai = 100% dan complete',()=>{
    const row={};PRA.forEach(p=>{row['st_'+p.k]='selesai'});
    const P=calcPra(row);expect(P.pct).toBe(100);expect(P.complete).toBe(true);expect(P.current).toBeNull();
  });
  it('nilai status tidak dikenal dianggap belum',()=>{
    expect(calcPra({st_topik:'done',st_judul:'SELESAI'}).done).toBe(0);
  });
  it('urutan tahap mengikuti PRA: Seminar proposal paling akhir',()=>{
    const P=calcPra({});expect(P.steps.map(s=>s.k)).toEqual(PRA.map(p=>p.k));expect(P.steps.at(-1).k).toBe('sem');
  });
  it('menerima daftar tahap sendiri',()=>{
    const P=calcPra({st_a:'selesai',st_b:'selesai'},[{k:'a',t:'A'},{k:'b',t:'B'},{k:'c',t:'C'},{k:'d',t:'D'}]);
    expect(P.pct).toBe(50);expect(P.total).toBe(4);
  });
  it('daftar tahap kosong tidak membagi nol',()=>{expect(calcPra({},[]).pct).toBe(0)});
});

// Pemeriksaan konsistensi repo (audit otomatis): hal-hal yang gampang terlewat saat satu sisi diubah tetapi sisi lain lupa.
import {describe,it,expect} from 'vitest';
import {readFileSync,readdirSync,statSync,existsSync} from 'node:fs';
import {join,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {PRA,COLS,PAGE,TITLEK} from '../../bimtrack-user/src/config.js';
import {ACCENTS} from '../../shared/accent.js';
import {LIM} from '../../shared/panduan.js';
import {PERAN,DSN} from '../../bimtrack-user/src/config.js';

const root=join(fileURLToPath(new URL('.',import.meta.url)),'..','..');
const read=p=>readFileSync(join(root,p),'utf8');
const rules=read('firestore.rules');
const walk=(d,out=[])=>{for(const n of readdirSync(join(root,d))){if(['node_modules','dist','site','.git'].includes(n))continue;const rel=join(d,n),st=statSync(join(root,rel));st.isDirectory()?walk(rel,out):out.push(rel)}return out};
const files=walk('.');
const appFiles=files.filter(f=>!f.startsWith('tests')); // tes sendiri memuat pola yang dicari, jadi dikecualikan dari pemindaian
const src=files.filter(f=>/\.(jsx?|html|css|ya?ml|json|md)$/.test(f)&&!f.startsWith('tests'));

describe('firestore.rules <-> config.js',()=>{
  it('kunci tahapan pra-skripsi (PRA) sama persis dengan kunci st_/tg_ di aturan skripsi',()=>{
    const block=rules.slice(rules.indexOf('function skripsiOk'));
    const inRules=[...new Set([...block.matchAll(/'st_([a-z]+)'/g)].map(m=>m[1]))].sort();
    expect(inRules).toEqual(PRA.map(p=>p.k).sort());
    const tg=[...new Set([...block.matchAll(/'tg_([a-z]+)'/g)].map(m=>m[1]))].sort();
    expect(tg).toEqual(PRA.map(p=>p.k).sort());
  });
  it('setiap koleksi data di config.js ada di studentCol, atau (koleksi ketat) punya blok aturan sendiri dan TIDAK ada di studentCol',()=>{
    const m=rules.match(/function studentCol\(c\)\s*\{\s*return c in \[([^\]]+)\]/);
    expect(m).toBeTruthy();
    const list=[...m[1].matchAll(/'([A-Za-z]+)'/g)].map(x=>x[1]);
    Object.keys(COLS).forEach(c=>{
      if(COLS[c].strict){expect(list).not.toContain(c);expect(rules).toContain(`match /${c}/{docId}`)}
      else expect(list).toContain(c);
    });
    expect(list.filter(c=>!COLS[c])).toEqual(['backupLogs','panduanTanda']); // koleksi tambahan yang sah (riwayat backup, penanda langkah panduan)
    expect(list).not.toContain('panduanKategori');expect(list).not.toContain('panduanLangkah');
  });
  it('PAGE dan TITLEK memiliki kunci yang sama dengan COLS',()=>{
    expect(Object.keys(PAGE).sort()).toEqual(Object.keys(COLS).sort());
    expect(Object.keys(TITLEK).sort()).toEqual(Object.keys(COLS).sort());
  });
  it('batas panjang judul di aturan (300) sama dengan maxLength di formulir',()=>{
    expect(rules).toContain("d.get('judul', '').size() <= 300");
    expect(read('bimtrack-user/src/Skripsi.jsx')).toContain('maxLength={300}');
  });
  it('status judul di aturan sama dengan JUDUL_ST',()=>{
    for(const s of ['Draf','Diajukan','Disetujui','Perlu diganti'])expect(rules).toContain(`'${s}'`);
  });
  it('aturan penutup menolak semua koleksi lain, dan admins tidak bisa ditulis dari klien',()=>{
    expect(rules).toMatch(/match \/\{document=\*\*\}\s*\{\s*allow read, write: if false;/);
    expect(rules).toMatch(/match \/admins\/\{uid\}[\s\S]*?allow write: if false;/);
  });
  it('tidak ada aturan "allow ... if true" selain get nimVersion',()=>{
    const hits=[...rules.matchAll(/allow ([a-z, ]+): if true;/g)].map(m=>m[1]);
    expect(hits).toEqual(['get']);
  });
});

describe('kebersihan kode dan rahasia',()=>{
  it('tidak ada kunci API Google/Firebase tertulis di kode',()=>{
    src.forEach(f=>expect([f,/AIza[0-9A-Za-z_-]{20,}/.test(read(f))]).toEqual([f,false]));
  });
  it('tidak ada berkas rahasia (.env asli, kunci akun layanan) di repo',()=>{
    appFiles.forEach(f=>{expect(/(^|\/)\.env(\.local|\.production)?$/.test(f)).toBe(false);expect(/serviceAccount|-adminsdk-/.test(f)).toBe(false)});
  });
  it('tidak memakai eval / new Function / dangerouslySetInnerHTML (kecuali ikon SVG bawaan)',()=>{
    appFiles.filter(f=>/\.jsx?$/.test(f)&&f!=='shared/icons.jsx').forEach(f=>{const t=read(f);expect([f,/\beval\(|new Function\(|dangerouslySetInnerHTML/.test(t)]).toEqual([f,false])});
  });
  it('satu-satunya dangerouslySetInnerHTML (shared/icons.jsx) hanya memasukkan path SVG dari tabel tetap, bukan teks pengguna',()=>{
    const t=read('shared/icons.jsx');
    expect((t.match(/dangerouslySetInnerHTML/g)||[]).length).toBe(1);
    expect(t).toContain('__html:I[name]||I.info');       // isi dari tabel I (konstanta), dengan cadangan ikon info
    expect(t).not.toMatch(/__html:\s*(props|r\b|children|\w+\.\w+)/); // bukan dari props atau data lain
  });
  it('setiap tautan target=_blank memakai rel="noopener noreferrer"',()=>{
    appFiles.filter(f=>/\.jsx$/.test(f)).forEach(f=>{
      for(const m of read(f).matchAll(/<a\b[^>]*target="_blank"[^>]*>/g))expect([f,/rel="noopener noreferrer"/.test(m[0])]).toEqual([f,true]);
    });
  });
  it('tombol "Buka di Drive" hanya memberi href bila tautan benar-benar tautan Drive',()=>{
    const t=read('bimtrack-user/src/Crud.jsx');
    expect(t).toContain('isDriveUrl(row[urlKey])?row[urlKey]:undefined');expect(t).toContain('isDriveUrl(det[urlKey])?det[urlKey]:undefined');
  });
  it('console.log / debugger tidak tertinggal di kode aplikasi',()=>{
    appFiles.filter(f=>/^(bimtrack-(user|admin)\/src|shared)\/.*\.jsx?$/.test(f)).forEach(f=>expect([f,/console\.(log|debug)\(|\bdebugger\b/.test(read(f))]).toEqual([f,false]));
  });
  it('.env.example hanya berisi nama variabel (tanpa nilai rahasia)',()=>{
    for(const app of ['bimtrack-user','bimtrack-admin']){
      const t=read(`${app}/.env.example`);
      t.split('\n').filter(l=>l.trim()&&!l.startsWith('#')).forEach(l=>expect(l).toMatch(/^VITE_FIREBASE_[A-Z_]+=isi-[a-z0-9.-]+$/)); // hanya penanda "isi-..."; nilai asli tidak boleh ada
    }
  });
});

describe('pilihan warna',()=>{
  it('setiap warna di ACCENTS punya blok terang dan gelap di tokens.css (navy = bawaan)',()=>{
    const css=read('shared/tokens.css');
    ACCENTS.filter(a=>a.id!=='navy').forEach(a=>{
      expect(css).toContain(`:root[data-accent=${a.id}]{`);
      expect(css).toContain(`:root[data-theme=dark][data-accent=${a.id}]{`);
    });
  });
  it('skrip awal index.html user mengenali semua id warna selain navy',()=>{
    const html=read('bimtrack-user/index.html');
    ACCENTS.filter(a=>a.id!=='navy').forEach(a=>expect(html).toContain(a.id));
  });
  it('aplikasi admin tidak memakai pilihan warna (identitas ochre tetap)',()=>{
    files.filter(f=>f.startsWith('bimtrack-admin/')&&/\.(jsx?|html)$/.test(f)).forEach(f=>expect([f,/bimtrack-accent|applyAccent/.test(read(f))]).toEqual([f,false]));
  });
  it('kontras teks pada warna utama terang minimal 4,5:1 (putih di atas primary)',()=>{
    const css=read('shared/tokens.css'),lum=h=>{const c=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255).map(v=>v<=.03928?v/12.92:((v+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2]};
    ACCENTS.filter(a=>a.id!=='navy').forEach(a=>{
      const m=css.match(new RegExp(`:root\\[data-accent=${a.id}\\]\\{--primary:(#[0-9A-Fa-f]{6})`));expect(m).toBeTruthy();
      const ratio=1.05/(lum(m[1])+.05);expect([a.id,ratio>=4.5]).toEqual([a.id,true]);
    });
  });
});

describe('berkas yang dijanjikan ada',()=>{
  it.each(['firestore.rules','firebase.json','README.md','docs/UJI-MANUAL.md','docs/AUDIT-B6.md','docs/AUDIT-B7.md','bimtrack-admin/src/pages/Panduan.jsx','bimtrack-user/src/Panduan.jsx','bimtrack-user/src/Dosen.jsx','tests/rules/rules.test.js','.github/workflows/deploy.yml','.github/workflows/test.yml'])('%s',p=>{expect(existsSync(join(root,p))).toBe(true)});
});

describe('Batch 7: dosen dan pejabat',()=>{
  const blk=rules.slice(rules.indexOf('match /dosenPejabat/'),rules.indexOf('match /panduanKategori/'));
  it('daftar PERAN di aturan sama persis dengan PERAN di config.js',()=>{
    const m=blk.match(/d\.peran in \[([^\]]+)\]/);expect(m).toBeTruthy();
    expect([...m[1].matchAll(/'([^']+)'/g)].map(x=>x[1])).toEqual(PERAN);
  });
  it('batas panjang tiap kolom di formulir (max) sama dengan aturan',()=>{
    const mx=Object.fromEntries(DSN.filter(f=>f.max).map(f=>[f.k,f.max]));
    expect(mx).toEqual({peranLain:80,nama:150,nip:40,kontak:120,catatan:1000});
    expect(blk).toContain("isStr(d.nama, 150)");
    for(const [k,n] of [['peranLain',80],['nip',40],['kontak',120],['catatan',1000]])expect(blk).toContain(`d.get('${k}', '').size() <= ${n}`);
  });
  it('field yang diizinkan di aturan = kolom formulir + id, ownerUid, urut, createdAt, updatedAt',()=>{
    const m=blk.match(/hasOnly\(\[([^\]]+)\]\)/);const keys=[...m[1].matchAll(/'([^']+)'/g)].map(x=>x[1]).sort();
    expect(keys).toEqual([...DSN.map(f=>f.k),'id','ownerUid','urut','createdAt','updatedAt'].sort());
  });
  it('hapus memakai canWriteOwn (lebih ketat dari koleksi lama) dan tidak ada tulis oleh admin',()=>{
    expect(blk).toMatch(/allow delete: if canWriteOwn\(\)/);expect(blk).not.toMatch(/allow (create|update|delete|write)[^;]*isAdmin\(\)/);
  });
  it('Crud memuat pilihan dosen lewat langganan terpisah (galat tidak menutup halaman Bimbingan/Jadwal)',()=>{
    expect(read('bimtrack-user/src/Crud.jsx')).toMatch(/cb=useCols\(comboSrc,uid\)/);
  });
  it('pencarian dan backup menyertakan dosenPejabat sebagai koleksi tambahan',()=>{
    expect(read('bimtrack-user/src/Search.jsx')).toContain("EXTRA=['jejak','dosenPejabat','skripsi']");
    expect(read('bimtrack-user/src/ImportExport.jsx')).toContain("dosenPejabat:'dosen dan pejabat'");
  });
});

describe('Batch 7: panduan alur (hanya admin menulis)',()=>{
  const kat=rules.slice(rules.indexOf('match /panduanKategori/'),rules.indexOf('match /panduanLangkah/'));
  const lgk=rules.slice(rules.indexOf('match /panduanLangkah/'),rules.indexOf('match /skripsi/'));
  it('semua create/update/delete di dua koleksi panduan mensyaratkan isAdmin(); mahasiswa hanya read',()=>{
    for(const b of [kat,lgk]){
      const w=[...b.matchAll(/allow (create|update|delete|write)[^;]*;/g)].map(m=>m[0]);
      expect(w.length).toBe(3);w.forEach(x=>expect(x).toContain('isAdmin()'));
      expect(b).toMatch(/allow read: if \(isApproved\(\) && resource\.data\.(terbit|tampil) == true\) \|\| isAdmin\(\)/);
    }
  });
  it('batas teks di aturan sama dengan LIM di shared/panduan.js',()=>{
    expect(kat).toContain(`isStr(d.judul, ${LIM.JUDUL_KAT})`);
    expect(lgk).toContain(`isStr(d.judul, ${LIM.JUDUL})`);expect(lgk).toContain(`isStr(d.isi, ${LIM.ISI})`);
    expect(lgk).toContain(`d.get('syarat', '').size() <= ${LIM.SYARAT}`);expect(lgk).toContain(`d.get('lama', '').size() <= ${LIM.LAMA}`);expect(lgk).toContain(`d.get('url', '').size() <= ${LIM.URL}`);
  });
  it('aturan memaksa tampil == (terbit && kategoriTerbit) dan tautan hanya https Drive/Docs',()=>{
    expect(lgk).toContain('d.tampil == (d.terbit && d.kategoriTerbit)');
    expect(lgk).toContain("matches('^https://(drive|docs)\\\\.google\\\\.com/.*')");
  });
  it('rentang urutan di aturan cukup untuk batas jumlah (kategori < 50, langkah < 100)',()=>{
    expect(kat).toContain('d.urutan < 50');expect(lgk).toContain('d.urutan < 100');
    expect(LIM.KATEGORI_MAX).toBeLessThan(50);expect(LIM.LANGKAH_MAX).toBeLessThan(100);
  });
  it('aplikasi user tidak pernah menulis koleksi panduan (hanya membaca lewat useData.js)',()=>{
    files.filter(f=>/^bimtrack-user\/src\/.*\.jsx?$/.test(f)).forEach(f=>{
      const t=read(f);expect([f,/(setDoc|updateDoc|deleteDoc|writeBatch)[^;]*panduan(Kategori|Langkah)/.test(t)||/doc\(db,\s*'panduan(Kategori|Langkah)'/.test(t)]).toEqual([f,false]);
    });
  });
  it('halaman admin: hapus lewat ConfirmDialog, tiap tulisan memanggil log() (Audit log), dan semua aksi punya label',()=>{
    const t=read('bimtrack-admin/src/pages/Panduan.jsx'),c=read('bimtrack-admin/src/common.jsx');
    expect(t).toContain('ConfirmDialog');expect((t.match(/b\.delete\(/g)||[]).length).toBe(3);
    const acts=[...new Set([...t.matchAll(/'(guide_[a-z_]+)'/g)].map(m=>m[1]))];
    expect(acts.length).toBeGreaterThanOrEqual(10);
    acts.forEach(a=>{expect(c).toContain(a+':');expect(a.length).toBeLessThanOrEqual(40)});
    expect((t.match(/commit\(\(b,t\)=>/g)||[]).length+(t.match(/await commit\(\(b,t\)=>/g)||[]).length).toBeGreaterThan(0);
  });
  it('tautan Drive pada langkah hanya dibuka bila lolos isDrive',()=>{
    expect(read('bimtrack-user/src/Panduan.jsx')).toContain('l.url&&isDrive(l.url)');
  });
});

describe('Batch 7: judul skripsi mengalir (tanpa sisa tata letak lama)',()=>{
  it('tidak ada sisa kode, gaya, atau dokumen tata letak judul lama',()=>{
    expect(existsSync(join(root,'bimtrack-user/src/titleShape.js'))).toBe(false);
    expect(existsSync(join(root,'tests/unit/titleShape.test.js'))).toBe(false);
    src.forEach(f=>expect([f,/segitiga|funnelLines|titleShape|\.jfun|jfun-/i.test(read(f))]).toEqual([f,false]));
  });
  it('kartu judul di dasbor memakai teks biasa (jdash), rata kiri, tanpa ukuran huruf yang dihitung',()=>{
    const css=read('shared/views.css');expect(css).toMatch(/\.jdash-t\{[^}]*text-align:left/);expect(css).not.toMatch(/\.jdash-t\{[^}]*(cqw|clamp)/);
    expect(read('bimtrack-user/src/Dash.jsx')).toContain('className="jdl jdash-t"');
  });
});

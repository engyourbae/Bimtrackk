// Tes aturan Firestore di Emulator. Jalankan: npm install && npm run test:rules (butuh Java 11+).
// Setiap tes memakai data awal yang sama (lihat seed) dan membuktikan SATU aturan: yang boleh berhasil, dan yang harus ditolak.
import {describe,it,beforeAll,afterAll,beforeEach} from 'vitest';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {doc,collection,getDoc,getDocs,setDoc,updateDoc,deleteDoc,deleteField,query,where,serverTimestamp,Timestamp} from 'firebase/firestore';

const rules=readFileSync(fileURLToPath(new URL('../../firestore.rules',import.meta.url)),'utf8');
const [host,port]=(process.env.FIRESTORE_EMULATOR_HOST||'127.0.0.1:8080').split(':');
const OLD=Timestamp.fromDate(new Date('2026-01-01T00:00:00Z'));
let env;

// Akun uji: adm1 = admin; u1/u2 = mahasiswa disetujui; pend = belum disetujui; tmp = sandi sementara (wajib ganti);
// u1b = akun baru hasil reset sandi milik u1 (dataUid menunjuk u1); fake = dokumen admins dengan role teks "true" (bukan boolean)
const seed=async()=>{
  await env.withSecurityRulesDisabled(async ctx=>{
    const d=ctx.firestore(),w=(p,v)=>setDoc(doc(d,...p.split('/')),v);
    await w('admins/adm1',{role:true});await w('admins/fake',{role:'true'});
    await w('users/u1',{uid:'u1',nim:'111',approved:true});await w('users/u2',{uid:'u2',nim:'222',approved:true});
    await w('users/pend',{uid:'pend',nim:'333',approved:false});await w('users/tmp',{uid:'tmp',nim:'444',approved:true,mustChangePassword:true});
    await w('users/u1b',{uid:'u1b',nim:'111',approved:true,dataUid:'u1'});
    await w('bimbingan/b1',{id:'b1',ownerUid:'u1',topik:'Awal'});
    await w('revisi/r1',{id:'r1',ownerUid:'u1',catatan:'Perbaiki',createdAt:OLD});
    await w('skripsi/u1',{id:'u1',ownerUid:'u1',judul:'Judul awal',judulStatus:'Draf',createdAt:OLD,updatedAt:OLD});
    await w('sesi/u1',{deviceId:'device-old-1',startedAt:OLD});
    await w('registrationRequests/u2',{uid:'u2',nim:'222',nama:'B',prodi:'P',fakultas:'F',universitas:'U',status:'pending',createdAt:OLD});
    await w('resetRequests/rr1',{nim:'111',nama:'A',status:'pending',createdAt:OLD});
    await w('nimVersion/111',{v:1});
    await w('aktivitas/a1',{adminUid:'adm1',action:'accept',createdAt:OLD});
  });
};
const as=uid=>env.authenticatedContext(uid).firestore();
const anon=()=>env.unauthenticatedContext().firestore();
const ref=(d,p)=>doc(d,...p.split('/'));
const now=()=>serverTimestamp();

beforeAll(async()=>{env=await initializeTestEnvironment({projectId:'demo-bimtrack',firestore:{rules,host,port:Number(port)}})});
afterAll(async()=>{await env.cleanup()});
beforeEach(async()=>{await env.clearFirestore();await seed()});

describe('admins dan users',()=>{
  it('admin dikenali hanya bila role bertipe boolean true',async()=>{
    await assertSucceeds(getDoc(ref(as('adm1'),'users/u1')));
    await assertFails(getDoc(ref(as('fake'),'users/u1')));
  });
  it('pemilik membaca dokumennya sendiri; orang lain dan anonim tidak',async()=>{
    await assertSucceeds(getDoc(ref(as('u1'),'users/u1')));
    await assertFails(getDoc(ref(as('u2'),'users/u1')));
    await assertFails(getDoc(ref(anon(),'users/u1')));
  });
  it('dokumen admins: admin hanya membaca miliknya; tidak ada yang bisa menulis',async()=>{
    await assertSucceeds(getDoc(ref(as('adm1'),'admins/adm1')));
    await assertFails(getDoc(ref(as('u1'),'admins/adm1')));
    await assertFails(setDoc(ref(as('adm1'),'admins/adm1'),{role:true}));
    await assertFails(setDoc(ref(as('u1'),'admins/u1'),{role:true}));
  });
  it('hanya admin yang membuat atau menyetujui akun; mahasiswa tidak bisa menyetujui dirinya',async()=>{
    await assertSucceeds(setDoc(ref(as('adm1'),'users/baru'),{uid:'baru',nim:'555',approved:true}));
    await assertFails(setDoc(ref(as('baru2'),'users/baru2'),{uid:'baru2',nim:'556',approved:true}));
    await assertFails(updateDoc(ref(as('pend'),'users/pend'),{approved:true}));
    await assertSucceeds(updateDoc(ref(as('adm1'),'users/pend'),{approved:true}));
  });
  it('akun tidak bisa dihapus siapa pun',async()=>{
    await assertFails(deleteDoc(ref(as('adm1'),'users/u1')));
    await assertFails(deleteDoc(ref(as('u1'),'users/u1')));
  });
  it('sandi sementara: mahasiswa hanya boleh mengubah mustChangePassword menjadi false',async()=>{
    await assertSucceeds(updateDoc(ref(as('tmp'),'users/tmp'),{mustChangePassword:false}));
    await assertFails(updateDoc(ref(as('tmp'),'users/tmp'),{mustChangePassword:true}));
    await assertFails(updateDoc(ref(as('tmp'),'users/tmp'),{mustChangePassword:false,approved:false}));
    await assertFails(updateDoc(ref(as('tmp'),'users/tmp'),{dataUid:'u2'}));
  });
});

describe('data mahasiswa (bimbingan, revisi, dst)',()=>{
  const mk=(id,owner,extra={})=>({id,ownerUid:owner,topik:'x',...extra});
  it('akun disetujui membuat data miliknya sendiri',async()=>{
    await assertSucceeds(setDoc(ref(as('u1'),'bimbingan/b2'),mk('b2','u1')));
  });
  it('menolak: ownerUid milik orang lain, id tidak sama dengan ID dokumen, lebih dari 80 field',async()=>{
    await assertFails(setDoc(ref(as('u1'),'bimbingan/b3'),mk('b3','u2')));
    await assertFails(setDoc(ref(as('u1'),'bimbingan/b4'),mk('lain','u1')));
    const big={};for(let i=0;i<80;i++)big['k'+i]=i;
    await assertFails(setDoc(ref(as('u1'),'bimbingan/b5'),{...big,id:'b5',ownerUid:'u1'}));
  });
  it('menolak koleksi yang tidak dikenal dan subkoleksi',async()=>{
    await assertFails(setDoc(ref(as('u1'),'catatanLain/c1'),mk('c1','u1')));
    await assertFails(getDoc(ref(as('u1'),'bimbingan/b1/sub/s1')));
    await assertFails(getDoc(ref(as('adm1'),'pengaturan/x')));
  });
  it('menolak penulisan oleh akun belum disetujui, akun sandi sementara, dan anonim',async()=>{
    await assertFails(setDoc(ref(as('pend'),'bimbingan/p1'),mk('p1','pend')));
    await assertFails(setDoc(ref(as('tmp'),'bimbingan/t1'),mk('t1','tmp')));
    await assertFails(setDoc(ref(anon(),'bimbingan/a1'),mk('a1','x')));
  });
  it('membaca: pemilik dan admin boleh; mahasiswa lain dan anonim tidak',async()=>{
    await assertSucceeds(getDoc(ref(as('u1'),'bimbingan/b1')));
    await assertSucceeds(getDoc(ref(as('adm1'),'bimbingan/b1')));
    await assertFails(getDoc(ref(as('u2'),'bimbingan/b1')));
    await assertFails(getDoc(ref(anon(),'bimbingan/b1')));
  });
  it('daftar: query milik sendiri berhasil; query milik orang lain ditolak',async()=>{
    await assertSucceeds(getDocs(query(collection(as('u1'),'bimbingan'),where('ownerUid','==','u1'))));
    await assertFails(getDocs(query(collection(as('u2'),'bimbingan'),where('ownerUid','==','u1'))));
    await assertFails(getDocs(collection(as('u2'),'bimbingan')));
  });
  it('ubah: boleh isi biasa; tidak boleh pindah pemilik, ganti id, atau ubah createdAt',async()=>{
    await assertSucceeds(updateDoc(ref(as('u1'),'bimbingan/b1'),{topik:'Baru'}));
    await assertFails(updateDoc(ref(as('u1'),'bimbingan/b1'),{ownerUid:'u2'}));
    await assertFails(updateDoc(ref(as('u1'),'bimbingan/b1'),{id:'zzz'}));
    await assertSucceeds(updateDoc(ref(as('u1'),'revisi/r1'),{catatan:'Lebih jelas'}));
    await assertFails(updateDoc(ref(as('u1'),'revisi/r1'),{createdAt:Timestamp.fromDate(new Date('2030-01-01'))}));
    await assertFails(updateDoc(ref(as('u2'),'bimbingan/b1'),{topik:'Curang'}));
  });
  it('hapus: hanya pemilik; admin hanya membaca',async()=>{
    await assertFails(deleteDoc(ref(as('u2'),'bimbingan/b1')));
    await assertFails(deleteDoc(ref(as('adm1'),'bimbingan/b1')));
    await assertFails(setDoc(ref(as('adm1'),'bimbingan/ax'),mk('ax','u1')));
    await assertSucceeds(deleteDoc(ref(as('u1'),'bimbingan/b1')));
  });
  it('akun hasil reset sandi (dataUid) tetap memegang data lama dan menulis atas nama pemilik lama',async()=>{
    await assertSucceeds(getDoc(ref(as('u1b'),'bimbingan/b1')));
    await assertSucceeds(setDoc(ref(as('u1b'),'bimbingan/b9'),mk('b9','u1')));
    await assertFails(setDoc(ref(as('u1b'),'bimbingan/b10'),mk('b10','u1b')));
    await assertSucceeds(getDocs(query(collection(as('u1b'),'bimbingan'),where('ownerUid','==','u1'))));
  });
});

describe('skripsi (judul dan tahapan pra-skripsi)',()=>{
  const full=(o={})=>({id:'u2',ownerUid:'u2',judul:'Judul saya',judulStatus:'Diajukan',createdAt:now(),updatedAt:now(),st_topik:'selesai',tg_topik:'2026-11-01',st_judul:'berjalan',tg_judul:'',...o});
  it('membuat dokumen dengan ID = UID pemilik data',async()=>{
    await assertSucceeds(setDoc(ref(as('u2'),'skripsi/u2'),full()));
  });
  it('ID dokumen harus sama dengan dataUid; ownerUid harus milik sendiri',async()=>{
    await assertFails(setDoc(ref(as('u2'),'skripsi/xyz'),full({id:'xyz'})));
    await assertFails(setDoc(ref(as('u2'),'skripsi/u2'),full({ownerUid:'u1'})));
    await assertSucceeds(setDoc(ref(as('u1b'),'skripsi/u1'),{id:'u1',ownerUid:'u1',judul:'Dari akun baru',updatedAt:now()},{merge:true}));
  });
  it('menolak nilai tidak sah: judul > 300, status judul asing, status tahap asing, field asing, tanggal terlalu panjang',async()=>{
    await assertFails(setDoc(ref(as('u2'),'skripsi/u2'),full({judul:'a'.repeat(301)})));
    await assertFails(setDoc(ref(as('u2'),'skripsi/u2'),full({judulStatus:'Lainnya'})));
    await assertFails(setDoc(ref(as('u2'),'skripsi/u2'),full({st_topik:'done'})));
    await assertFails(setDoc(ref(as('u2'),'skripsi/u2'),full({foo:'bar'})));
    await assertFails(setDoc(ref(as('u2'),'skripsi/u2'),full({tg_topik:'2026-11-01X'})));
    await assertSucceeds(setDoc(ref(as('u2'),'skripsi/u2'),full({judul:'a'.repeat(300)}))); // batas tepat 300 masih sah (dicoba terakhir agar tes di atas murni membuat dokumen baru)
  });
  it('semua kunci tahap (topik, judul, acc, pemb, prop, sem) diterima',async()=>{
    const f={};for(const k of ['topik','judul','acc','pemb','prop','sem']){f['st_'+k]='selesai';f['tg_'+k]='2026-11-01'}
    await assertSucceeds(setDoc(ref(as('u2'),'skripsi/u2'),full(f)));
  });
  it('ubah dengan merge (cara aplikasi menulis): boleh; createdAt tidak boleh berubah',async()=>{
    await assertSucceeds(setDoc(ref(as('u1'),'skripsi/u1'),{id:'u1',ownerUid:'u1',updatedAt:now(),st_prop:'selesai',tg_prop:'2026-11-20'},{merge:true}));
    await assertFails(setDoc(ref(as('u1'),'skripsi/u1'),{id:'u1',ownerUid:'u1',updatedAt:now(),createdAt:Timestamp.fromDate(new Date('2030-01-01'))},{merge:true}));
  });
  it('tidak bisa dihapus; mahasiswa lain tidak bisa membaca atau menulis; admin hanya membaca',async()=>{
    await assertFails(deleteDoc(ref(as('u1'),'skripsi/u1')));
    await assertFails(getDoc(ref(as('u2'),'skripsi/u1')));
    await assertFails(updateDoc(ref(as('u2'),'skripsi/u1'),{judul:'Curang',updatedAt:now()}));
    await assertSucceeds(getDoc(ref(as('adm1'),'skripsi/u1')));
    await assertFails(updateDoc(ref(as('adm1'),'skripsi/u1'),{judul:'Admin',updatedAt:now()}));
  });
  it('akun belum disetujui dan akun sandi sementara tidak bisa menulis',async()=>{
    await assertFails(setDoc(ref(as('pend'),'skripsi/pend'),full({id:'pend',ownerUid:'pend'})));
    await assertFails(setDoc(ref(as('tmp'),'skripsi/tmp'),full({id:'tmp',ownerUid:'tmp'})));
  });
});

describe('sesi tunggal (sesi/{uid})',()=>{
  const dev=(s='device-new-2')=>({deviceId:s,startedAt:now()});
  it('pemilik membuat sesi dengan deviceId 8-64 karakter dan startedAt = waktu server',async()=>{
    await assertSucceeds(setDoc(ref(as('u2'),'sesi/u2'),dev()));
  });
  it('menolak: deviceId terlalu pendek/panjang, startedAt dari jam klien, field asing, kickedAt/kickBy saat membuat',async()=>{
    await assertFails(setDoc(ref(as('u2'),'sesi/u2'),dev('abc')));
    await assertFails(setDoc(ref(as('u2'),'sesi/u2'),dev('x'.repeat(65))));
    await assertFails(setDoc(ref(as('u2'),'sesi/u2'),{deviceId:'device-new-2',startedAt:OLD}));
    await assertFails(setDoc(ref(as('u2'),'sesi/u2'),{...dev(),foo:1}));
    await assertFails(setDoc(ref(as('u2'),'sesi/u2'),{...dev(),kickedAt:now()}));
    await assertFails(setDoc(ref(as('u2'),'sesi/u2'),{...dev(),kickBy:'adm1'}));
    await assertSucceeds(setDoc(ref(as('u2'),'sesi/u2'),dev('x'.repeat(64)))); // batas tepat 64 masih sah (terakhir)
  });
  it('orang lain tidak bisa membuat sesi atas nama pemilik',async()=>{
    await assertFails(setDoc(ref(as('u2'),'sesi/u1'),dev()));
    await assertFails(setDoc(ref(anon(),'sesi/u1'),dev()));
  });
  it('perangkat baru mengambil alih sesi (ganti deviceId + startedAt baru)',async()=>{
    await assertSucceeds(updateDoc(ref(as('u1'),'sesi/u1'),dev('device-new-2')));
    await assertFails(updateDoc(ref(as('u1'),'sesi/u1'),{deviceId:'device-new-3',startedAt:OLD}));
  });
  it('pemilik tidak bisa mengisi, mengubah, atau menghapus kickedAt/kickBy',async()=>{
    await assertFails(updateDoc(ref(as('u1'),'sesi/u1'),{...dev(),kickedAt:now()}));
    await assertFails(updateDoc(ref(as('u1'),'sesi/u1'),{...dev(),kickBy:'u1'}));
    await env.withSecurityRulesDisabled(async ctx=>{await updateDoc(ref(ctx.firestore(),'sesi/u1'),{kickedAt:OLD,kickBy:'adm1'})});
    await assertFails(updateDoc(ref(as('u1'),'sesi/u1'),{...dev(),kickedAt:deleteField()}));
    await assertFails(updateDoc(ref(as('u1'),'sesi/u1'),{...dev(),kickBy:deleteField()}));
    await assertSucceeds(updateDoc(ref(as('u1'),'sesi/u1'),dev('device-after-kick'))); // masuk lagi setelah dikeluarkan: tanda kick tetap utuh
  });
  it('admin "Keluarkan paksa": hanya kickedAt (waktu server) dan kickBy (UID admin itu sendiri)',async()=>{
    await assertFails(updateDoc(ref(as('adm1'),'sesi/u1'),{kickedAt:now(),kickBy:'orang-lain'}));
    await assertFails(updateDoc(ref(as('adm1'),'sesi/u1'),{kickedAt:OLD,kickBy:'adm1'}));
    await assertFails(updateDoc(ref(as('adm1'),'sesi/u1'),{kickedAt:now(),kickBy:'adm1',deviceId:'device-curang'}));
    await assertFails(updateDoc(ref(as('fake'),'sesi/u1'),{kickedAt:now(),kickBy:'fake'}));
    await assertFails(updateDoc(ref(as('u2'),'sesi/u1'),{kickedAt:now(),kickBy:'u2'}));
    await assertSucceeds(updateDoc(ref(as('adm1'),'sesi/u1'),{kickedAt:now(),kickBy:'adm1'}));
  });
  it('baca: pemilik dan admin; mahasiswa lain tidak. Tidak bisa dihapus.',async()=>{
    await assertSucceeds(getDoc(ref(as('u1'),'sesi/u1')));
    await assertSucceeds(getDoc(ref(as('adm1'),'sesi/u1')));
    await assertFails(getDoc(ref(as('u2'),'sesi/u1')));
    await assertFails(deleteDoc(ref(as('u1'),'sesi/u1')));
    await assertFails(deleteDoc(ref(as('adm1'),'sesi/u1')));
  });
});

describe('pendaftaran, reset sandi, versi NIM, audit log',()=>{
  const reg=(o={})=>({uid:'u9',nim:'999',nama:'N',prodi:'P',fakultas:'F',universitas:'U',status:'pending',createdAt:now(),...o});
  it('pendaftaran: dibuat sekali oleh pemilik akun dengan status pending dan waktu server',async()=>{
    await assertFails(setDoc(ref(as('u8'),'registrationRequests/u9'),reg()));
    await assertFails(setDoc(ref(as('u9'),'registrationRequests/u9'),reg({status:'approved'})));
    await assertFails(setDoc(ref(as('u9'),'registrationRequests/u9'),reg({foo:1})));
    await assertFails(setDoc(ref(as('u9'),'registrationRequests/u9'),reg({createdAt:OLD})));
    await assertFails(setDoc(ref(as('u9'),'registrationRequests/u9'),reg({nama:''})));
    await assertSucceeds(setDoc(ref(as('u9'),'registrationRequests/u9'),reg()));
  });
  it('pendaftaran: hanya admin memutuskan (approved/rejected), pemilik tidak',async()=>{
    await assertSucceeds(updateDoc(ref(as('adm1'),'registrationRequests/u2'),{status:'approved',decidedAt:now(),decidedBy:'adm1'}));
    await assertFails(updateDoc(ref(as('adm1'),'registrationRequests/u2'),{status:'pending'}));
    await assertFails(updateDoc(ref(as('u2'),'registrationRequests/u2'),{status:'approved'}));
    await assertFails(deleteDoc(ref(as('adm1'),'registrationRequests/u2')));
  });
  it('reset sandi: anonim boleh membuat permintaan yang ketat, tidak boleh membaca; admin membaca dan memutuskan',async()=>{
    const rr=(o={})=>({nim:'111',nama:'A',status:'pending',createdAt:now(),...o});
    await assertSucceeds(setDoc(ref(anon(),'resetRequests/rr2'),rr()));
    await assertFails(setDoc(ref(anon(),'resetRequests/rr3'),rr({status:'done'})));
    await assertFails(setDoc(ref(anon(),'resetRequests/rr4'),rr({foo:1})));
    await assertFails(setDoc(ref(anon(),'resetRequests/rr5'),rr({nim:''})));
    await assertFails(getDoc(ref(anon(),'resetRequests/rr1')));
    await assertFails(getDoc(ref(as('u1'),'resetRequests/rr1')));
    await assertSucceeds(getDoc(ref(as('adm1'),'resetRequests/rr1')));
    await assertSucceeds(updateDoc(ref(as('adm1'),'resetRequests/rr1'),{status:'done',decidedAt:now(),decidedBy:'adm1'}));
    await assertFails(updateDoc(ref(as('adm1'),'resetRequests/rr1'),{status:'pending'}));
    await assertFails(updateDoc(ref(as('u1'),'resetRequests/rr1'),{status:'done'}));
  });
  it('versi NIM: dibaca publik per dokumen, tidak bisa didaftar; hanya admin menulis angka versi sah',async()=>{
    await assertSucceeds(getDoc(ref(anon(),'nimVersion/111')));
    await assertFails(getDocs(collection(anon(),'nimVersion')));
    await assertSucceeds(setDoc(ref(as('adm1'),'nimVersion/111'),{v:2}));
    await assertFails(setDoc(ref(as('adm1'),'nimVersion/111'),{v:0}));
    await assertFails(setDoc(ref(as('adm1'),'nimVersion/111'),{v:2,x:1}));
    await assertFails(setDoc(ref(as('u1'),'nimVersion/111'),{v:2}));
    await assertFails(deleteDoc(ref(as('adm1'),'nimVersion/111')));
  });
  it('audit log: hanya admin menambah (adminUid = dirinya, waktu server); tidak bisa diubah/dihapus; mahasiswa tidak bisa membaca',async()=>{
    await assertSucceeds(setDoc(ref(as('adm1'),'aktivitas/a2'),{adminUid:'adm1',action:'force_logout',createdAt:now()}));
    await assertFails(setDoc(ref(as('adm1'),'aktivitas/a3'),{adminUid:'orang-lain',action:'x',createdAt:now()}));
    await assertFails(setDoc(ref(as('adm1'),'aktivitas/a4'),{adminUid:'adm1',action:'x',createdAt:OLD}));
    await assertFails(setDoc(ref(as('u1'),'aktivitas/a5'),{adminUid:'u1',action:'x',createdAt:now()}));
    await assertFails(updateDoc(ref(as('adm1'),'aktivitas/a1'),{action:'diubah'}));
    await assertFails(deleteDoc(ref(as('adm1'),'aktivitas/a1')));
    await assertSucceeds(getDoc(ref(as('adm1'),'aktivitas/a1')));
    await assertFails(getDoc(ref(as('u1'),'aktivitas/a1')));
  });
});

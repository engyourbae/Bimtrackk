// Alur pembuka: splash yang mengalir ke layar berikutnya, orientasi pertama kali (4 slide), pager Masuk | Info & FAQ.
// Prinsip Miller's Law: informasi dipecah menjadi kelompok kecil (maks. 4–5 butir per kelompok), navigasi bawah maks. 4 + "Lainnya".
import {Children,useEffect,useLayoutEffect,useRef,useState} from 'react';
import {Icon} from './icons';
import {Logo} from './logo';
import {prefersReduced} from './motion';

const SEEN='bimtrack-seen';
export const hasSeen=()=>{try{return localStorage.getItem(SEEN)==='1'}catch{return true}};
export const markSeen=()=>{try{localStorage.setItem(SEEN,'1')}catch{}};

/** Splash: logo tampil, lalu meluncur ke posisi logo di layar berikutnya sementara latar memudar dan konten masuk berurutan (tanpa jeda). */
export function Splash({ready}){
  const[done,setDone]=useState(prefersReduced),[minOk,setMinOk]=useState(prefersReduced),[late,setLate]=useState(false),[out,setOut]=useState(false),ref=useRef(null);
  useLayoutEffect(()=>{const h=document.documentElement;if(done){h.classList.remove('splashing');return}h.classList.add('splashing');
    const el=ref.current,w=el.offsetWidth,hh=el.offsetHeight,s=Math.min(1.35,(innerWidth-40)/w);el.style.transform=`translate(${(innerWidth-w*s)/2}px,${(innerHeight-hh*s)/2}px) scale(${s})`},[done]);
  useEffect(()=>{if(done)return;const a=setTimeout(()=>setMinOk(true),1250),b=setTimeout(()=>setLate(true),4000);return()=>{clearTimeout(a);clearTimeout(b)}},[done]);
  useEffect(()=>{if(done||!minOk||!ready)return;const el=ref.current,h=document.documentElement,hh=el.offsetHeight;
    const tg=[...document.querySelectorAll('[data-brand-target]')].map(n=>n.getBoundingClientRect()).find(r=>r.width>0&&r.height>0);
    el.classList.add('go');if(tg)el.style.transform=`translate(${tg.left}px,${tg.top}px) scale(${tg.height/hh})`;else el.classList.add('fade');
    h.classList.add('flow-go');setOut(true);
    const t=setTimeout(()=>setDone(true),600);return()=>clearTimeout(t)},[minOk,ready,done]);
  useEffect(()=>{if(!done)return;const h=document.documentElement;h.classList.remove('splashing');const t=setTimeout(()=>h.classList.remove('flow-go'),1100);return()=>clearTimeout(t)},[done]);
  if(done)return null;
  return <div className={'splash'+(out?' out':'')} aria-hidden="true"><div className="splash-bg"/><div className="splash-logo" ref={ref}><Logo size={60}/></div>
    {late&&!ready&&<p className="splash-late">Menyambungkan…</p>}</div>}

/* ---------- orientasi pertama kali ---------- */
const SLIDES=[['bimbingan','Catat setiap bimbingan','Topik, arahan dosen, dan tindak lanjut tersimpan rapi, jadi tidak ada yang terlupa.'],
  ['revisi','Ubah arahan jadi revisi','Setiap revisi punya prioritas, tenggat, status, dan bukti, sehingga jelas mana yang dikerjakan dulu.'],
  ['ringkasan','Pantau progres Bab I–V','Lihat posisi skripsimu dan langkah berikutnya yang paling penting.'],
  ['shield','Aman dan tetap jalan saat sinyal lemah','Catatan tanpa sinyal tersimpan di perangkat lalu tersinkron saat online. Akun baru aktif setelah disetujui admin.']];
export function Onboarding({onDone}){
  const[i,setI]=useState(0),x0=useRef(null),last=i===SLIDES.length-1;
  const go=n=>setI(Math.max(0,Math.min(SLIDES.length-1,n)));
  useEffect(()=>{const f=e=>{if(e.key==='ArrowRight')go(i+1);if(e.key==='ArrowLeft')go(i-1)};addEventListener('keydown',f);return()=>removeEventListener('keydown',f)},[i]);
  return <main id="main" className="onb" tabIndex={-1} onTouchStart={e=>{x0.current=e.touches[0].clientX}} onTouchEnd={e=>{if(x0.current==null)return;const d=e.changedTouches[0].clientX-x0.current;x0.current=null;if(Math.abs(d)>50)go(i+(d<0?1:-1))}}>
    <div className="onb-top"><Logo size={34} target/>{!last&&<button type="button" className="btn ghost sm" onClick={onDone}>Lewati</button>}</div>
    <div className="onb-body"><div className="onb-view"><div className="onb-track" style={{transform:`translateX(${-i*100}%)`}}>
      {SLIDES.map(([ic,t,d],k)=><section key={t} className="onb-slide" aria-hidden={k!==i} aria-label={`Langkah ${k+1} dari ${SLIDES.length}`}><div className="onb-art"><Icon name={ic} size={56} strokeWidth={1.5}/></div><h1>{t}</h1><p className="lead">{d}</p></section>)}</div></div>
      <div className="dots" role="tablist" aria-label="Langkah orientasi">{SLIDES.map((s,k)=><button key={k} type="button" role="tab" aria-selected={k===i} aria-label={`Langkah ${k+1}: ${s[1]}`} className={k===i?'on':''} onClick={()=>go(k)}/>)}</div></div>
    <div className="onb-act">{i>0&&<button type="button" className="btn sec" onClick={()=>go(i-1)}><Icon name="chev-left" size={18}/> Kembali</button>}
      <button type="button" className="btn sp" onClick={()=>last?onDone():go(i+1)}>{last?'Mulai':'Lanjut'}{!last&&<Icon name="chev-right" size={18}/>}</button></div></main>}

/* ---------- pager: slide Masuk | Info & FAQ ---------- */
export function Pager({tabs,index,onChange,children,label='Bagian'}){
  const x0=useRef(null),id=useRef('pg'+Math.random().toString(36).slice(2,7)).current;
  return <div className="pager-w" onTouchStart={e=>{x0.current=e.touches[0].clientX}} onTouchEnd={e=>{if(x0.current==null)return;const d=e.changedTouches[0].clientX-x0.current;x0.current=null;if(Math.abs(d)>70){const n=index+(d<0?1:-1);if(n>=0&&n<tabs.length)onChange(n)}}}>
    <div className="ptabs" role="tablist" aria-label={label} onKeyDown={e=>{if(e.key==='ArrowRight')onChange(Math.min(tabs.length-1,index+1));if(e.key==='ArrowLeft')onChange(Math.max(0,index-1))}}>
      {tabs.map((t,k)=><button key={t} type="button" role="tab" id={`${id}-t${k}`} aria-selected={k===index} aria-controls={`${id}-p${k}`} tabIndex={k===index?0:-1} onClick={()=>onChange(k)}>{t}</button>)}
      <span className="pt-ind" aria-hidden="true" style={{transform:`translateX(${index*100}%)`}}/></div>
    <div className="pgs">{Children.toArray(children).map((c,k)=><div key={k} role="tabpanel" id={`${id}-p${k}`} aria-labelledby={`${id}-t${k}`} className={'pg-panel'+(k===index?'':(k<index?' off l':' off r'))}>{c}</div>)}</div></div>}

/* ---------- Info & FAQ (isi nyata; dikelompokkan menjadi 4 langkah + 3 kelompok tanya-jawab) ---------- */
const STEPS=[['Daftar dengan NIM','Isi data diri, lalu buat kata sandi.'],['Disetujui admin','Admin memastikan akunmu, lalu membukanya.'],['Catat dan kerjakan','Rekam bimbingan, ubah arahan dosen menjadi revisi, atur jadwal.'],['Pantau progres','Lihat progres Bab I–V dan langkah berikutnya.']];
const FAQ=[{t:'Mengenal BIMTRACK',q:[
  ['Apa itu BIMTRACK?','Catatan kerja skripsi untuk mahasiswa: bimbingan, revisi, jadwal, rundown, dokumen, dan bukti revisi di satu tempat, dengan progres per bab.'],
  ['Siapa yang bisa memakainya?','Mahasiswa yang mendaftar dengan NIM. Akun baru aktif setelah disetujui administrator.']]},
 {t:'Akun dan masuk',q:[
  ['Bagaimana cara mendaftar?','Pilih “Daftar” di bawah form masuk, isi data diri (langkah 1), lalu buat kata sandi (langkah 2). Setelah itu tunggu persetujuan admin; halaman akan terbuka sendiri begitu disetujui.'],
  ['Lupa kata sandi?','Pilih “Lupa kata sandi?” di form masuk, isi NIM dan nama lengkap. Admin memastikan identitasmu lalu memberi sandi sementara; kamu akan diminta menggantinya saat masuk.'],
  ['Kenapa ada waktu tunggu saat salah sandi?','Untuk melindungi akunmu. Dua kali salah masih bebas; mulai kesalahan ketiga masuk dikunci sementara untuk NIM itu, mulai 15 detik lalu berlipat dua setiap salah (maksimum 1 jam). Hitungan kembali nol setelah berhasil masuk atau 24 jam tanpa salah. Pembatas ini bekerja di perangkat ini; Firebase tetap menjadi penjaga utama di server.'],
  ['Bagaimana agar tidak masuk terus-menerus?','Hapus centang “Tetap masuk di perangkat ini” saat masuk (sesi berakhir saat peramban ditutup), dan/atau aktifkan “Kedaluwarsakan sesi otomatis” di Profil dan Pengaturan agar keluar sendiri setelah tidak aktif.']]},
 {t:'Data dan offline',q:[
  ['Bisakah dipakai tanpa internet?','Bisa untuk data yang sudah pernah dimuat. Catatan yang dibuat saat offline disimpan di perangkat dan tersinkron otomatis ketika online. Masuk pertama kali tetap memerlukan internet.'],
  ['Di mana foto, bukti, dan dokumen disimpan?','Di Google Drive milikmu. BIMTRACK hanya menyimpan tautannya, jadi pastikan pengaturan berbagi Drive sesuai kebutuhan.'],
  ['Siapa yang bisa melihat datamu?','Hanya akunmu sendiri dan administrator pengelola aplikasi. Akun mahasiswa lain tidak dapat membukanya.']]}];
export function InfoPanel(){
  const[open,setOpen]=useState(null);
  return <div className="info">
    <section className="faq-g"><h3>Empat langkah menuju Bab V</h3><ol className="info-steps">{STEPS.map(([t,d],k)=><li key={t}><span className="n" aria-hidden="true">{k+1}</span><div><b>{t}</b><span>{d}</span></div></li>)}</ol></section>
    {FAQ.map((g,gi)=><section className="faq-g" key={g.t}><h3>{g.t}</h3>{g.q.map(([q,a],qi)=>{const k=gi+'-'+qi,on=open===k;
      return <div className={'faq-i'+(on?' on':'')} key={k}><h4><button type="button" aria-expanded={on} aria-controls={'faq-'+k} onClick={()=>setOpen(on?null:k)}><span>{q}</span><Icon name="chev-down" size={18}/></button></h4>
        <div className="faq-a" id={'faq-'+k} role="region" hidden={!on}><p>{a}</p></div></div>})}</section>)}</div>}

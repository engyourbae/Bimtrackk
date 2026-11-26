import {useEffect,useState} from 'react';
import {Icon} from './icons';
import {Logo,LogoMark} from './logo';

export const BootScreen=()=><div className="boot" role="status"><LogoMark size={56} title="BIMTRACK"/><span>Memuat…</span></div>;

const MISI=[['bimbingan','Merekam setiap bimbingan dan arahan dosen agar tidak ada yang terlupa.'],['revisi','Mengubah revisi menjadi daftar kerja yang jelas, berprioritas, dan berbukti.'],['lock','Menjaga data mahasiswa tetap pribadi dan aman.'],['wifi','Nyaman di HP, tablet, dan laptop, bahkan saat sinyal lemah.']];
const ADMIN_PTS=[['inbox','Setujui atau tolak pendaftaran akun mahasiswa.'],['key','Bantu mahasiswa yang lupa kata sandi.'],['audit','Setiap tindakan administrator tercatat di audit log.']];
/* jejak tanda tangan menuju Bab I-V: motif khas BIMTRACK */
const Trail=()=><svg className="trail" viewBox="0 0 420 150" fill="none" aria-hidden="true"><path d="M16 120C60 118 74 78 118 82S170 112 214 70 300 30 396 22" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 9" opacity=".7"/>
  {[[40,119],[118,82],[214,70],[300,38]].map(([x,y],i)=><g key={i}><circle cx={x} cy={y} r="9" fill="currentColor" opacity=".9"/><text x={x} y={y+3.5} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--panel-bg)" fontFamily="var(--font-display)">{['I','II','III','IV'][i]}</text></g>)}
  <circle cx="396" cy="22" r="13" fill="var(--panel-gold)"/><path d="M390 22.5l4.2 4.2 8-9" stroke="#23382F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>;

/** Tata letak masuk/daftar. variant 'user' | 'admin'. panel=false => kartu tunggal di tengah (status akun, ganti sandi). */
export function AuthLayout({variant='user',title,sub,children,footer,panel=true}){
  const admin=variant==='admin';
  return <div className={'auth-wrap'+(panel?'':' solo')}>
    {panel&&<aside className="auth-panel"><Logo size={44}/>
      {admin?<div><h2>Panel pengelola</h2><p className="vision">Tempat mengelola akun mahasiswa BIMTRACK dengan aman dan tercatat.</p><ul>{ADMIN_PTS.map(([ic,t])=><li key={ic}><Icon name={ic} size={20}/><span>{t}</span></li>)}</ul></div>
        :<div><h2>Skripsi tertata, bimbingan terarah.</h2><p className="vision">Menjadi teman kerja akademik yang membuat setiap mahasiswa tahu posisi skripsinya dan langkah berikutnya.</p><ul>{MISI.map(([ic,t])=><li key={ic}><Icon name={ic} size={20}/><span>{t}</span></li>)}</ul></div>}
      <Trail/></aside>}
    <main id="main" className="auth-main"><div className="auth-m-brand"><Logo size={36}/>{!admin&&<p className="tag">Skripsi tertata, bimbingan terarah.</p>}</div>
      {admin&&<div style={{marginBottom:12}}><span className="badge info"><Icon name="shield" size={14}/> Khusus administrator</span></div>}
      <h1>{title}</h1>{sub&&<p className="lead">{sub}</p>}{children}{footer&&<div className="auth-foot">{footer}</div>}</main></div>}

/** Batas percobaan beruntun di sisi tampilan (pembatas UI; perlindungan sebenarnya ada di Firebase Auth). */
export const lockSeconds=n=>n>0&&n%5===0?Math.min(30*2**(n/5-1),900):0;
export function useAttemptLimit(key='bimtrack-attempts'){
  const read=()=>{try{return JSON.parse(sessionStorage.getItem(key))||{n:0,until:0}}catch{return{n:0,until:0}}},write=v=>{try{sessionStorage.setItem(key,JSON.stringify(v))}catch{}};
  const[st,setSt]=useState(read),[now,setNow]=useState(Date.now());
  useEffect(()=>{if(st.until<=Date.now())return;const t=setInterval(()=>setNow(Date.now()),500);return()=>clearInterval(t)},[st.until]);
  const secs=Math.max(0,Math.ceil((st.until-now)/1000));
  return{locked:secs>0,secs,fail(){const n=st.n+1,s=lockSeconds(n),v={n,until:s?Date.now()+s*1000:st.until};write(v);setSt(v);setNow(Date.now())},ok(){write({n:0,until:0});setSt({n:0,until:0})}}}

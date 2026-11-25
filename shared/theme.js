// Tema: default TERANG. "Sistem" hanya berlaku jika dipilih sendiri oleh pengguna.
const K='bimtrack-theme',META={light:'#F5F6F2',dark:'#141A17'};
const safe=f=>{try{return f()}catch{return null}};
export const getTheme=()=>{const t=safe(()=>localStorage.getItem(K));return t==='dark'||t==='system'?t:'light'};
export const resolveTheme=(t=getTheme())=>t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light';
export function applyTheme(t=getTheme()){const r=resolveTheme(t);document.documentElement.dataset.theme=r;
  document.querySelectorAll('meta[name=theme-color]').forEach(m=>m.setAttribute('content',META[r]))}
export function setTheme(t){safe(()=>localStorage.setItem(K,t));applyTheme(t)}
if(typeof matchMedia==='function')matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{if(getTheme()==='system')applyTheme()});

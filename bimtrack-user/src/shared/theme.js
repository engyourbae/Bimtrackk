const K='bimtrack-theme';
export const getTheme=()=>localStorage.getItem(K)||'system';
export function applyTheme(t=getTheme()){const d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light';}
export function setTheme(t){localStorage.setItem(K,t);applyTheme(t)}
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>applyTheme());

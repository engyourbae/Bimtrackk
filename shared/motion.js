// Gerak halus: efek muncul saat scroll (IntersectionObserver, sekali saja). Hanya opacity + transform; dilewati bila pengguna memilih kurangi gerak.
import {useEffect} from 'react';
export const prefersReduced=()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const SEL='.card,.stat,.tbl-wrap,.gal>*,.faq-g,.relb,.empty-s,.more-i';
export function useReveal(rootSel,dep){
  useEffect(()=>{const root=document.querySelector(rootSel);if(!root||prefersReduced()||!('IntersectionObserver' in window))return;
    const t0=performance.now(),vh=()=>innerHeight||document.documentElement.clientHeight;
    const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('rv-in');io.unobserve(e.target)}}),{rootMargin:'0px 0px -6% 0px',threshold:.06});
    const add=x=>{if(x.dataset.rv)return;x.dataset.rv='1';
      // konten yang sudah terlihat saat halaman baru terbuka ikut animasi halaman (page-in); selebihnya muncul saat di-scroll
      if(performance.now()-t0<350&&x.getBoundingClientRect().top<vh())return;x.classList.add('rv');io.observe(x)};
    const reg=n=>{if(n.nodeType!==1)return;if(n.matches(SEL))add(n);n.querySelectorAll(SEL).forEach(add)};
    reg(root);const mo=new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(reg)));mo.observe(root,{childList:true,subtree:true});
    return()=>{io.disconnect();mo.disconnect()}},[rootSel,dep])}

/** Kunci cubit-zoom ala aplikasi. Chrome/Android: viewport + touch-action (base.css). iOS Safari mengabaikan user-scalable=no, jadi gesture* ditahan di sini. */
export function lockGestures(){
  if(typeof document==='undefined')return;
  ['gesturestart','gesturechange','gestureend'].forEach(t=>document.addEventListener(t,e=>e.preventDefault()));
  document.addEventListener('touchmove',e=>{if(e.touches.length>1)e.preventDefault()},{passive:false})}

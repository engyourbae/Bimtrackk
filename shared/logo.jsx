// Logo BIMTRACK: topi wisuda + huruf B + goresan tanda tangan (persetujuan dosen).
// Tanda gambar adalah jalur vektor hasil penelusuran logo resmi (brand-paths.js); warna mengikuti tema lewat CSS (.lg-ink / .lg-g).
// Wordmark memakai Manrope ExtraBold (font branding): "BIM" warna tinta, "TRACK" warna aksen.
import {MARK_VB,MARK_INK,MARK_GREEN} from './brand-paths';
const AR=776/568;
export const LogoMark=({size=32,className='',title})=><svg className={'logo-mark '+className} width={Math.round(size*AR)} height={size} viewBox={MARK_VB} role={title?'img':undefined} aria-label={title} aria-hidden={title?undefined:true} focusable="false">
  <path className="lg-ink" d={MARK_INK} fillRule="evenodd"/><path className="lg-g" d={MARK_GREEN} fillRule="evenodd"/></svg>;
export const Wordmark=({height=20,className=''})=><span className={'wordmark '+className} role="img" aria-label="BIMTRACK" style={{fontSize:height}}><span aria-hidden="true" className="wm-a">BIM<b className="wm-b">TRACK</b></span></span>;
/** target: tandai sebagai tujuan animasi pembuka (logo splash meluncur ke posisi ini). fontSize = size membuat jarak (em) ikut berskala, jadi logo splash yang diperkecil identik dengan logo tujuan. */
export const Logo=({size=32,text=true,stacked=false,target=false})=><span className={'logo-lockup'+(stacked?' stacked':'')} data-brand-target={target?'':undefined} style={stacked?undefined:{fontSize:size}}><LogoMark size={size}/>{text&&<Wordmark height={size*.62}/>}</span>;

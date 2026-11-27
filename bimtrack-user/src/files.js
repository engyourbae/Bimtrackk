// Pembantu berkas untuk ekspor (CSV, JSON, .ics). Murni peramban, tanpa Firebase.
/** Cegah injeksi rumus spreadsheet: sel yang diawali = + - @ tab atau CR diberi awalan apostrof. */
export const safe=v=>{v=String(v??'');return /^[=+\-@\t\r]/.test(v)?"'"+v:v};
/** Escape satu sel CSV dengan pemisah d. */
export const esc=(v,d)=>{v=safe(v);return v.includes('"')||v.includes(d)||/[\n\r]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};
/** Unduh teks sebagai berkas. */
export const save=(name,text,type)=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000)};

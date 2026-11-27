// Tata letak judul "segitiga terbalik" (corong): baris pertama terpanjang, makin ke bawah makin pendek, semua rata tengah.
// Murni (tanpa React/DOM) agar bisa diuji unit. Kata tidak pernah dipotong; urutan kata tidak berubah.
//
// Cara kerja: untuk jumlah baris k, panjang ideal baris ke-i (0 = paling atas) sebanding dengan (k - i), jadi total
// panjangnya sama dengan panjang judul. Dicari pembagian kata yang (1) tidak pernah bertambah panjang ke bawah dan
// (2) paling dekat dengan panjang ideal itu (jumlah selisih kuadrat terkecil). Baris pertama dibatasi maxFirst karakter
// supaya muat di layar HP; k dimulai dari nilai terkecil yang masih memungkinkan batas itu.
const MAX_LINES=10;

/** Pecah judul menjadi baris-baris menyempit. Mengembalikan array string (kosong bila judul kosong). */
export function funnelLines(text,{maxFirst=30}={}){
  const words=String(text??'').trim().split(/\s+/).filter(Boolean);
  if(!words.length)return[];
  const n=words.length,len=words.map(w=>[...w].length);
  const pre=[0];for(let i=0;i<n;i++)pre.push(pre[i]+len[i]);
  const width=(a,b)=>pre[b]-pre[a]+(b-a-1); // karakter kata a..b-1 digabung spasi tunggal
  const total=width(0,n),longest=Math.max(...len);
  if(n===1||total<=Math.min(Math.max(maxFirst,longest),14))return[words.join(' ')];

  // Judul sangat panjang: bila 10 baris belum cukup untuk batas maxFirst, batas baris pertama dilonggarkan bertahap.
  for(const extra of[0,6,12,20,32]){
  const cap=Math.max(maxFirst+extra,longest),kMin=Math.max(2,Math.ceil(2*total/cap-1));
  for(let k=kMin;k<=Math.min(n,MAX_LINES);k++){
    const ideal=i=>2*total*(k-i)/(k*(k+1));
    const memo=new Map();
    // best(i, a, prev): biaya terkecil untuk menaruh kata a..n-1 pada baris i..k-1, dengan baris sebelumnya selebar prev
    const best=(i,a,prev)=>{
      if(i===k)return a===n?{c:0,cut:[]}:null;
      if(a>=n)return null;
      const key=i+'|'+a+'|'+prev;if(memo.has(key))return memo.get(key);
      let out=null;
      const lastLine=i===k-1;
      for(let b=a+1;b<=n;b++){
        const w=width(a,b);
        if(w>prev)break;                 // melebihi baris di atasnya: tidak menyempit
        if(lastLine&&b!==n)continue;     // baris terakhir harus menghabiskan sisa kata
        if(!lastLine&&n-b<k-i-1)break;   // sisa kata tidak cukup untuk baris berikutnya
        const rest=best(i+1,b,w);if(!rest)continue;
        const c=(w-ideal(i))**2+rest.c;
        if(!out||c<out.c)out={c,cut:[b,...rest.cut]};
      }
      memo.set(key,out);return out};
    const r=best(0,0,cap);
    if(r){const lines=[];let a=0;for(const b of r.cut){lines.push(words.slice(a,b).join(' '));a=b}return lines}
  }}
  // Tidak ada pembagian yang benar-benar menyempit (mis. satu kata sangat panjang di tengah): jatuh ke satu baris per kata panjang
  return[words.join(' ')];
}

/** Jumlah karakter baris terpanjang (baris pertama); dipakai CSS untuk menentukan ukuran huruf agar muat. */
export const widest=lines=>lines.reduce((m,l)=>Math.max(m,[...l].length),1);

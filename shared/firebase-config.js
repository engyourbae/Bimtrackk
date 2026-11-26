// Membaca konfigurasi Firebase dari variabel lingkungan Vite (VITE_FIREBASE_*), bukan dari kode.
// Nilai asli disimpan di .env.local (lokal, tidak di-commit) atau GitHub Secrets (saat deploy). Lihat .env.example dan README.
const KEYS={apiKey:'VITE_FIREBASE_API_KEY',authDomain:'VITE_FIREBASE_AUTH_DOMAIN',projectId:'VITE_FIREBASE_PROJECT_ID',storageBucket:'VITE_FIREBASE_STORAGE_BUCKET',messagingSenderId:'VITE_FIREBASE_MESSAGING_SENDER_ID',appId:'VITE_FIREBASE_APP_ID'};
const OPTIONAL=new Set(['storageBucket']); // aplikasi tidak memakai Firebase Storage
const PLACEHOLDER=/^(isi|your|xxx|changeme|<)/i;
export function readFirebaseConfig(env){
  const cfg={},missing=[];
  for(const[k,name]of Object.entries(KEYS)){const v=String(env&&env[name]!=null?env[name]:'').trim();
    if((!v||PLACEHOLDER.test(v))&&!OPTIONAL.has(k))missing.push(name);cfg[k]=v}
  if(missing.length)throw new Error('Konfigurasi Firebase belum lengkap: '+missing.join(', ')+'. Salin .env.example menjadi .env.local lalu isi nilainya (lihat README).');
  return Object.freeze(cfg)}

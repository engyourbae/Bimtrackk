import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {bimtrackPwa} from '../shared/pwa-plugin.js';
// Kode bersama (design token, komponen, ikon, logo) ada di ../shared. React dipaksa dari node_modules aplikasi ini
// supaya berkas di luar folder aplikasi tidak mencari React di tempat lain.
const here=path.dirname(fileURLToPath(import.meta.url)),nm=p=>path.resolve(here,'node_modules',p);
export default defineConfig({
  base:'./',
  plugins:[react(),bimtrackPwa()],
  resolve:{alias:{'@shared':path.resolve(here,'../shared'),react:nm('react'),'react-dom':nm('react-dom')},dedupe:['react','react-dom']},
  // Pecah vendor: React dan Firebase masing-masing satu chunk (cache peramban lebih awet, dimuat paralel). Semua chunk (termasuk halaman lazy) masuk precache lewat pwa-plugin.
  build:{rollupOptions:{output:{manualChunks(id){if(!id.includes('node_modules'))return;if(/node_modules\/(react|react-dom|scheduler)\//.test(id))return'react';if(/node_modules\/(firebase|@firebase)\//.test(id))return'firebase'}}}},
  server:{fs:{allow:[path.resolve(here,'..')]}}
});

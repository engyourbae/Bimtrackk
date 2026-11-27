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
  server:{fs:{allow:[path.resolve(here,'..')]}}
});

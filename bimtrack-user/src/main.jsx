import {createRoot} from 'react-dom/client';
import '@fontsource-variable/fraunces';
import '@fontsource-variable/public-sans';
import './shared/styles.css';
import {applyTheme} from '@shared/theme';
import App from './App';
applyTheme();
createRoot(document.getElementById('root')).render(<App/>);
if('serviceWorker' in navigator&&import.meta.env.PROD)navigator.serviceWorker.register('./service-worker.js');

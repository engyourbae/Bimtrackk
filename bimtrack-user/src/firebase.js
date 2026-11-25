import {initializeApp} from 'firebase/app';
import {getAuth} from 'firebase/auth';
import {initializeFirestore,persistentLocalCache,persistentMultipleTabManager} from 'firebase/firestore';
const firebaseConfig={apiKey:"AIzaSyDyizua9Z0xJiRgOytQsmoWDHqJ6g6Dw90",authDomain:"bimtrack-8ac84.firebaseapp.com",projectId:"bimtrack-8ac84",storageBucket:"bimtrack-8ac84.firebasestorage.app",messagingSenderId:"755393973772",appId:"1:755393973772:web:2e9042025cafc3c6146829"};
const app=initializeApp(firebaseConfig,'bimtrack-user');
export const auth=getAuth(app);
export const db=initializeFirestore(app,{localCache:persistentLocalCache({tabManager:persistentMultipleTabManager()})});

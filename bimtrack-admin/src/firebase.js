import {initializeApp} from 'firebase/app';
import {getAuth} from 'firebase/auth';
import {getFirestore} from 'firebase/firestore';
export const firebaseConfig={apiKey:"AIzaSyDyizua9Z0xJiRgOytQsmoWDHqJ6g6Dw90",authDomain:"bimtrack-8ac84.firebaseapp.com",projectId:"bimtrack-8ac84",storageBucket:"bimtrack-8ac84.firebasestorage.app",messagingSenderId:"755393973772",appId:"1:755393973772:web:87de9c15e4597eb7146829"};
const app=initializeApp(firebaseConfig);
export const auth=getAuth(app);
export const db=getFirestore(app);

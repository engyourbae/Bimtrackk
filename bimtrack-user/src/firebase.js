import {initializeApp} from 'firebase/app';
import {getAuth} from 'firebase/auth';
import {readFirebaseConfig} from '@shared/firebase-config';
import {initializeFirestore,persistentLocalCache,persistentMultipleTabManager} from 'firebase/firestore';
const firebaseConfig=readFirebaseConfig(import.meta.env);
const app=initializeApp(firebaseConfig,'bimtrack-user');
export const auth=getAuth(app);
export const db=initializeFirestore(app,{localCache:persistentLocalCache({tabManager:persistentMultipleTabManager()})});

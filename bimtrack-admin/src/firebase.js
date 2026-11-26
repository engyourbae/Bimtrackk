import {initializeApp} from 'firebase/app';
import {getAuth} from 'firebase/auth';
import {readFirebaseConfig} from '@shared/firebase-config';
import {getFirestore} from 'firebase/firestore';
export const firebaseConfig=readFirebaseConfig(import.meta.env);
const app=initializeApp(firebaseConfig,'bimtrack-admin');
export const auth=getAuth(app);
export const db=getFirestore(app);

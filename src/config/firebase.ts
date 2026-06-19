import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyARPztbUQsJ2jKaVntiVuZok-WkDTkrQCM',
  authDomain: 'pisilist-app.firebaseapp.com',
  projectId: 'pisilist-app',
  storageBucket: 'pisilist-app.firebasestorage.app',
  messagingSenderId: '579611680236',
  appId: '1:579611680236:web:3ca7f2cf07be57ab0634c9',
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  throw new Error(
    'Firebase configuration is missing required fields. Check your .env setup.',
  );
}

// Initialize Firebase only once (prevents duplicate app errors in hot reload)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;

/**
 * Firebase Client SDK Configuration & Initialization
 * Uses direct static Vite environment variable access (VITE_FIREBASE_*)
 * with Node/SSR fallback.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';

export const firebaseConfig = {
  apiKey: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_API_KEY) || 
          (typeof process !== 'undefined' ? process.env?.VITE_FIREBASE_API_KEY : '') || '',
  authDomain: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN) || 
              (typeof process !== 'undefined' ? process.env?.VITE_FIREBASE_AUTH_DOMAIN : '') || '',
  projectId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_PROJECT_ID) || 
             (typeof process !== 'undefined' ? process.env?.VITE_FIREBASE_PROJECT_ID : '') || '',
  storageBucket: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET) || 
                 (typeof process !== 'undefined' ? process.env?.VITE_FIREBASE_STORAGE_BUCKET : '') || '',
  messagingSenderId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID) || 
                     (typeof process !== 'undefined' ? process.env?.VITE_FIREBASE_MESSAGING_SENDER_ID : '') || '',
  appId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_APP_ID) || 
         (typeof process !== 'undefined' ? process.env?.VITE_FIREBASE_APP_ID : '') || '',
  measurementId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_MEASUREMENT_ID) || 
                 (typeof process !== 'undefined' ? process.env?.VITE_FIREBASE_MEASUREMENT_ID : '') || ''
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey.length > 10 &&
  firebaseConfig.apiKey !== 'your_firebase_api_key_here' &&
  firebaseConfig.projectId === 'codetogether-f21ac'
);

// Initialize Firebase App & Authentication
let app = null;
let auth = null;
let googleProvider = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });
    if (typeof window !== 'undefined') {
      console.log('[Firebase] Successfully connected to project:', firebaseConfig.projectId);
    }
  } catch (err) {
    console.error('[Firebase] Initialization error:', err);
  }
} else if (typeof window !== 'undefined') {
  console.warn('[Firebase] Configured projectId does not match codetogether-f21ac or apiKey is missing.');
}

export { 
  app, 
  auth, 
  googleProvider,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  signInWithPopup
};
export default firebaseConfig;

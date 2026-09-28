import { initializeApp } from 'firebase/app';

export const emulatorEnabled = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const hasFirebaseConfig = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId,
);

export const isFirebaseConfigured = hasFirebaseConfig || emulatorEnabled;

const effectiveConfig = hasFirebaseConfig
  ? firebaseConfig
  : emulatorEnabled
    ? {
        apiKey: 'demo-api-key',
        authDomain: 'demo-pharmacy.localhost',
        projectId: 'demo-pharmacy',
        appId: 'demo-pharmacy-app',
      }
    : null;

export const firebaseApp = effectiveConfig ? initializeApp(effectiveConfig) : null;

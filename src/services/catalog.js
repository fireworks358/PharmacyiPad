import {
  addDoc,
  collection,
  connectFirestoreEmulator,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore/lite';
import { emulatorEnabled, firebaseApp } from '../lib/firebase';

const CACHE_KEY = 'pharmacy_catalog_v2';
const db = firebaseApp ? getFirestore(firebaseApp) : null;
let authPromise;

if (emulatorEnabled && db) connectFirestoreEmulator(db, '127.0.0.1', 8080);

export function readCatalogCache() {
  try {
    const value = window.localStorage.getItem(CACHE_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export function writeCatalogCache(drugs, locations) {
  try {
    window.localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ drugs, locations, cachedAt: new Date().toISOString() }),
    );
  } catch {
    // A failed cache write must never block the online catalogue.
  }
}

export async function loadCatalog() {
  if (!db) throw new Error('Firebase is not configured');

  const drugsQuery = query(
    collection(db, 'drugs'),
    where('status', '==', 'active'),
  );
  const locationsQuery = query(
    collection(db, 'locations'),
    where('status', '==', 'active'),
  );

  const [drugSnapshot, locationSnapshot] = await Promise.all([
    getDocs(drugsQuery),
    getDocs(locationsQuery),
  ]);
  return {
    drugs: drugSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })),
    locations: locationSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })),
  };
}

async function ensureReporter() {
  if (!firebaseApp) throw new Error('Firebase is not configured');
  if (!authPromise) {
    authPromise = import('firebase/auth').then((module) => {
      const auth = module.getAuth(firebaseApp);
      if (emulatorEnabled) module.connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      return { auth, signInAnonymously: module.signInAnonymously };
    });
  }
  const { auth, signInAnonymously } = await authPromise;
  if (auth.currentUser) return auth.currentUser;
  const credential = await signInAnonymously(auth);
  return credential.user;
}

export async function submitIssueReport({ drug, issueType, suggestedLocation, comment }) {
  if (!db) throw new Error('Firebase is not configured');
  const reporter = await ensureReporter();

  return addDoc(collection(db, 'reports'), {
    drugId: drug.id,
    drugNameSnapshot: drug.displayName,
    locationSnapshot: drug.locationDisplay,
    issueType,
    suggestedLocation: String(suggestedLocation || '').trim(),
    comment: String(comment || '').trim(),
    reporterId: reporter.uid,
    status: 'open',
    createdAt: serverTimestamp(),
  });
}

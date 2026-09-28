import {
  collection,
  connectFirestoreEmulator,
  doc,
  initializeFirestore,
  onSnapshot,
  orderBy,
  persistentLocalCache,
  persistentMultipleTabManager,
  query,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import {
  connectAuthEmulator,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { emulatorEnabled, firebaseApp } from '../lib/firebase';

const auth = firebaseApp ? getAuth(firebaseApp) : null;
const db = firebaseApp
  ? initializeFirestore(firebaseApp, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    })
  : null;

if (emulatorEnabled && auth && db) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}

function cleanList(values) {
  return [...new Set((values || []).map((value) => String(value).trim()).filter(Boolean))];
}

function snapshotForAudit(value) {
  if (!value) return null;
  const copy = { ...value };
  delete copy.createdAt;
  delete copy.updatedAt;
  return copy;
}

export function watchAuth(callback) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export function loginAdmin(email, password) {
  if (!auth) throw new Error('Firebase is not configured');
  return signInWithEmailAndPassword(auth, email.trim(), password);
}

export function logoutAdmin() {
  return auth ? signOut(auth) : Promise.resolve();
}

export async function verifyAdmin(user) {
  return Boolean(user?.providerData?.some(({ providerId }) => providerId === 'password'));
}

function subscribe(name, ordering, callback, onError) {
  const reference = ordering
    ? query(collection(db, name), orderBy(ordering.field, ordering.direction || 'asc'))
    : collection(db, name);
  return onSnapshot(reference, (snapshot) => {
    callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
  }, onError);
}

export function subscribeToAdminData({ onDrugs, onLocations, onReports, onError }) {
  if (!db) return () => {};
  const unsubscribers = [
    subscribe('drugs', { field: 'displayName' }, onDrugs, onError),
    subscribe('locations', { field: 'label' }, onLocations, onError),
    subscribe('reports', { field: 'createdAt', direction: 'desc' }, onReports, onError),
  ];
  return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
}

async function saveWithAudit({ collectionName, id, before, after, action, user }) {
  const batch = writeBatch(db);
  const entityRef = id ? doc(db, collectionName, id) : doc(collection(db, collectionName));
  const auditRef = doc(collection(db, 'auditLogs'));
  const now = serverTimestamp();
  const next = {
    ...after,
    updatedAt: now,
    updatedBy: user.uid,
  };

  if (!id) {
    next.createdAt = now;
    next.createdBy = user.uid;
  }

  batch.set(entityRef, next, { merge: Boolean(id) });
  batch.set(auditRef, {
    entityType: collectionName === 'drugs' ? 'drug' : 'location',
    entityId: entityRef.id,
    action,
    before: snapshotForAudit(before),
    after: snapshotForAudit(after),
    actorId: user.uid,
    actorEmail: user.email || '',
    createdAt: now,
  });
  await batch.commit();
  return entityRef.id;
}

export function saveDrug(values, existing, user) {
  const data = {
    displayName: String(values.displayName || '').trim(),
    aliases: cleanList(values.aliases),
    strength: String(values.strength || '').trim(),
    form: String(values.form || '').trim(),
    route: String(values.route || '').trim(),
    locationIds: cleanList(values.locationIds),
    locationNote: String(values.locationNote || '').trim(),
    notes: String(values.notes || '').trim(),
    stockStatus: values.stockStatus === 'out_of_stock' ? 'out_of_stock' : 'in_stock',
    status: existing ? existing.status : 'active',
  };

  if (!data.displayName) throw new Error('Drug name is required');
  return saveWithAudit({
    collectionName: 'drugs',
    id: existing && existing.id,
    before: existing,
    after: data,
    action: existing ? 'updated' : 'created',
    user,
  });
}

export function setDrugStatus(drug, status, user) {
  return saveWithAudit({
    collectionName: 'drugs',
    id: drug.id,
    before: drug,
    after: { ...snapshotForAudit(drug), status },
    action: status === 'archived' ? 'archived' : 'restored',
    user,
  });
}

export function saveLocation(values, existing, user) {
  const data = {
    label: String(values.label || '').trim(),
    area: String(values.area || '').trim(),
    sortOrder: Number(values.sortOrder) || 0,
    status: existing ? existing.status : 'active',
  };
  if (!data.label) throw new Error('Location label is required');
  return saveWithAudit({
    collectionName: 'locations',
    id: existing && existing.id,
    before: existing,
    after: data,
    action: existing ? 'updated' : 'created',
    user,
  });
}

export function setLocationStatus(location, status, user) {
  return saveWithAudit({
    collectionName: 'locations',
    id: location.id,
    before: location,
    after: { ...snapshotForAudit(location), status },
    action: status === 'archived' ? 'archived' : 'restored',
    user,
  });
}

export async function updateReportStatus(report, status, resolutionNote, user) {
  const batch = writeBatch(db);
  const reportRef = doc(db, 'reports', report.id);
  const auditRef = doc(collection(db, 'auditLogs'));
  const now = serverTimestamp();
  batch.update(reportRef, {
    status,
    resolutionNote: String(resolutionNote || '').trim(),
    resolvedAt: now,
    resolvedBy: user.uid,
  });
  batch.set(auditRef, {
    entityType: 'report',
    entityId: report.id,
    action: status,
    before: snapshotForAudit(report),
    after: { status, resolutionNote: String(resolutionNote || '').trim() },
    actorId: user.uid,
    actorEmail: user.email || '',
    createdAt: now,
  });
  await batch.commit();
}

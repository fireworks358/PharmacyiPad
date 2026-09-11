import { readFile } from 'node:fs/promises';
import { afterAll, beforeAll, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  where,
} from 'firebase/firestore';

let environment;
const projectId = 'demo-pharmacy';
const activeDrug = {
  displayName: 'Adrenaline', aliases: ['Epinephrine'], strength: '', form: '', route: 'IV',
  locationIds: [], locationNote: '', notes: '', stockStatus: 'in_stock', status: 'active',
  createdAt: new Date(), createdBy: 'seed', updatedAt: new Date(), updatedBy: 'seed',
};

beforeAll(async () => {
  environment = await initializeTestEnvironment({
    projectId,
    firestore: { rules: await readFile(new URL('../firestore.rules', import.meta.url), 'utf8') },
  });
  await environment.withSecurityRulesDisabled(async (context) => {
    const firestore = context.firestore();
    await setDoc(doc(firestore, 'drugs', 'active-drug'), activeDrug);
    await setDoc(doc(firestore, 'drugs', 'archived-drug'), { ...activeDrug, displayName: 'Archived', status: 'archived' });
  });
});

afterAll(async () => environment.cleanup());

describe('Firestore security rules', () => {
  it('allows public reads only for active catalogue records', async () => {
    const firestore = environment.unauthenticatedContext().firestore();
    await assertSucceeds(getDoc(doc(firestore, 'drugs', 'active-drug')));
    await assertFails(getDoc(doc(firestore, 'drugs', 'archived-drug')));
    await assertSucceeds(getDocs(query(collection(firestore, 'drugs'), where('status', '==', 'active'))));
    await assertFails(getDocs(collection(firestore, 'drugs')));
  });

  it('prevents an iPad reporter from changing catalogue records', async () => {
    const firestore = environment.authenticatedContext('reporter-user', { firebase: { sign_in_provider: 'anonymous' } }).firestore();
    await assertFails(updateDoc(doc(firestore, 'drugs', 'active-drug'), { displayName: 'Changed' }));
    await assertFails(deleteDoc(doc(firestore, 'drugs', 'active-drug')));
  });

  it('allows a signed-in reporter to create one valid report', async () => {
    const firestore = environment.authenticatedContext('reporter-user', { firebase: { sign_in_provider: 'anonymous' } }).firestore();
    await assertSucceeds(addDoc(collection(firestore, 'reports'), {
      drugId: 'active-drug', drugNameSnapshot: 'Adrenaline', locationSnapshot: 'Drawer A3',
      issueType: 'missing', suggestedLocation: '', comment: '', reporterId: 'reporter-user',
      status: 'open', createdAt: serverTimestamp(),
    }));
  });

  it('does not let reporters read submitted reports', async () => {
    const firestore = environment.authenticatedContext('reporter-user', { firebase: { sign_in_provider: 'anonymous' } }).firestore();
    await assertFails(getDocs(collection(firestore, 'reports')));
  });

  it('rejects forged or malformed reports', async () => {
    const firestore = environment.authenticatedContext('reporter-user', { firebase: { sign_in_provider: 'anonymous' } }).firestore();
    await assertFails(addDoc(collection(firestore, 'reports'), {
      drugId: 'active-drug', drugNameSnapshot: 'Adrenaline', locationSnapshot: 'Drawer A3',
      issueType: 'missing', suggestedLocation: '', comment: '', reporterId: 'someone-else',
      status: 'open', createdAt: serverTimestamp(),
    }));
  });

  it('allows Email/Password staff to edit but never hard-delete drugs', async () => {
    const firestore = environment.authenticatedContext('staff-user', { firebase: { sign_in_provider: 'password' } }).firestore();
    await assertSucceeds(setDoc(doc(firestore, 'drugs', 'active-drug'), { ...activeDrug, notes: 'Checked' }));
    await assertFails(deleteDoc(doc(firestore, 'drugs', 'active-drug')));
  });

  it('allows Email/Password staff to resolve a report and append an audit record atomically', async () => {
    let reportId;
    await environment.withSecurityRulesDisabled(async (context) => {
      const result = await addDoc(collection(context.firestore(), 'reports'), {
        drugId: 'active-drug', drugNameSnapshot: 'Adrenaline', locationSnapshot: 'Drawer A3',
        issueType: 'missing', suggestedLocation: '', comment: '', reporterId: 'reporter-user',
        status: 'open', createdAt: new Date(),
      });
      reportId = result.id;
    });

    const firestore = environment.authenticatedContext('staff-user', { firebase: { sign_in_provider: 'password' } }).firestore();
    const batch = writeBatch(firestore);
    batch.update(doc(firestore, 'reports', reportId), {
      status: 'resolved', resolutionNote: 'Returned to drawer', resolvedBy: 'staff-user',
      resolvedAt: serverTimestamp(),
    });
    batch.set(doc(firestore, 'auditLogs', 'resolution-log'), {
      entityType: 'report', entityId: reportId, action: 'resolved', actorId: 'staff-user',
      actorEmail: 'admin@example.test', createdAt: serverTimestamp(), before: null, after: null,
    });
    await assertSucceeds(batch.commit());
  });
});

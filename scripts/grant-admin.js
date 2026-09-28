/**
 * Adds an existing Firebase Authentication user to the administrator allowlist.
 * Usage: FIREBASE_PROJECT_ID=... ADMIN_EMAIL=... npm run grant-admin
 */
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const projectId = process.env.FIREBASE_PROJECT_ID;
const email = process.env.ADMIN_EMAIL;
if (!projectId || !email) throw new Error('FIREBASE_PROJECT_ID and ADMIN_EMAIL are required');

const appOptions = { projectId };
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  appOptions.credential = cert(process.env.GOOGLE_APPLICATION_CREDENTIALS);
}

const app = getApps()[0] || initializeApp(appOptions);
const user = await getAuth(app).getUserByEmail(email);
await getFirestore(app).collection('admins').doc(user.uid).set({
  email: user.email,
  active: true,
  grantedAt: FieldValue.serverTimestamp(),
}, { merge: true });

console.log(`Granted catalogue administrator access to ${user.email} (${user.uid}).`);


/**
 * Imports the existing data.json catalogue into Firestore.
 *
 * Production:
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json \
 *   FIREBASE_PROJECT_ID=your-project npm run migrate
 *
 * Emulator:
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 \
 *   FIREBASE_PROJECT_ID=demo-pharmacy npm run migrate
 */
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const projectId = process.env.FIREBASE_PROJECT_ID;
if (!projectId) throw new Error('FIREBASE_PROJECT_ID is required');

const appOptions = { projectId };
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  appOptions.credential = applicationDefault();
}

const app = getApps()[0] || initializeApp(appOptions);
const firestore = getFirestore(app);
firestore.settings({ ignoreUndefinedProperties: true });

const source = JSON.parse(await readFile(new URL('../data.json', import.meta.url), 'utf8'));
const sourceDrugs = source.drugs || [];
const routeOnlyAliases = new Set(['iv', 'im', 'oral', 'topical', 'inhaler', 'intranasal']);

function stableLocationId(label) {
  return `loc_${createHash('sha1').update(label.toLowerCase()).digest('hex').slice(0, 12)}`;
}

function aliasesFromName(name) {
  const aliases = [];
  const matches = name.matchAll(/\(([^)]+)\)/g);
  for (const match of matches) {
    for (const part of match[1].split(',')) {
      const alias = part.trim();
      if (alias && !routeOnlyAliases.has(alias.toLowerCase())) aliases.push(alias);
    }
  }
  return [...new Set(aliases)];
}

const locationLabels = [...new Set(
  sourceDrugs.map((drug) => String(drug.location || '').trim()).filter(Boolean),
)];

const writer = firestore.bulkWriter();
const now = FieldValue.serverTimestamp();

for (const label of locationLabels) {
  const id = stableLocationId(label);
  writer.set(firestore.collection('locations').doc(id), {
    label,
    area: '',
    sortOrder: 0,
    status: 'active',
    createdAt: now,
    createdBy: 'initial-migration',
    updatedAt: now,
    updatedBy: 'initial-migration',
  }, { merge: true });
}

for (const drug of sourceDrugs) {
  const location = String(drug.location || '').trim();
  writer.set(firestore.collection('drugs').doc(String(drug.id)), {
    displayName: String(drug.name || '').trim(),
    aliases: aliasesFromName(String(drug.name || '')),
    strength: '',
    form: '',
    route: String(drug.drugType || '').trim(),
    locationIds: location ? [stableLocationId(location)] : [],
    locationNote: '',
    notes: String(drug.notes || '').trim(),
    stockStatus: drug.outOfStock ? 'out_of_stock' : 'in_stock',
    status: 'active',
    createdAt: now,
    createdBy: 'initial-migration',
    updatedAt: now,
    updatedBy: 'initial-migration',
  }, { merge: true });
}

await writer.close();
console.log(`Imported ${sourceDrugs.length} drugs and ${locationLabels.length} locations into ${projectId}.`);

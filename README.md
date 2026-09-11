# Pharmacy Drug Finder

Two deliberately separate web portals backed by Firebase:

- `/` is the read-only iPad drug finder. It can search names, aliases, routes, strengths, and locations. Users can report a missing drug or wrong location, but cannot change catalogue data.
- `/admin` is the Email/Password-authenticated desktop portal for drugs, aliases, locations, stock status, archived records, and user reports. Every Email/Password account can administer the catalogue.

Firestore Security Rules enforce these permissions independently of the interface. Catalogue records cannot be hard-deleted by any browser client; the admin portal archives and restores them instead.

## Requirements

- Node.js 20 or later
- A Firebase project using Cloud Firestore in Native mode
- Firebase Authentication with Email/Password and Anonymous providers enabled
- Java 11 or later when running the local Firestore emulator

The public build is transpiled for iOS 12 and avoids flexbox `gap` in the iPad interface. The app shell and a localStorage catalogue snapshot provide a cached finder after the first successful load; offline reports are not queued by this app. The admin portal uses Firestore's persistent cache and realtime listeners.

## Firebase setup

1. Create a Firebase project and web app. Choose the appropriate Firestore region before creating the database.
2. In Authentication > Sign-in method, enable Email/Password and Anonymous.
3. Copy `.env.example` to `.env.local` and enter the web app configuration.
4. Copy `.firebaserc.example` to `.firebaserc` and set the project ID.
5. Deploy the rules before making the app available:

   ```sh
   npx firebase deploy --only firestore:rules,firestore:indexes
   ```

Firebase web configuration is not a secret. Access is protected by `firestore.rules`; never put a service-account key or legacy JSONBin master key in a `VITE_` variable.

## Create staff accounts

Create Email/Password users in Firebase Authentication for everyone who should manage the catalogue. No separate Firestore allowlist is required. Anonymous iPad users can search and submit reports, but cannot change catalogue records.

## Import the existing catalogue

Back up JSONBin before migration, then run:

```sh
GOOGLE_APPLICATION_CREDENTIALS=/secure/path/service-account.json \
FIREBASE_PROJECT_ID=your-project-id \
npm run migrate
```

The importer reads `data.json`, creates stable location records, preserves existing drug IDs, and extracts useful aliases from parentheses. Review the imported aliases and split strength/form fields in the admin portal afterward. The importer is repeatable and merges records with the same IDs.

To test migration against the emulator instead:

```sh
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 \
FIREBASE_PROJECT_ID=demo-pharmacy \
npm run migrate
```


## Development

Run Firebase emulators in one terminal:

```sh
npx firebase emulators:start
```

Create `.env.local` with the normal Firebase variables plus:

```text
VITE_USE_FIREBASE_EMULATOR=true
```

Then run the app:

```sh
npm run dev
```

The iPad portal is at `http://localhost:5173/` and admin is at `http://localhost:5173/admin/`.

## Verification

```sh
npm run lint
npm test
npm run test:rules
npm run build
```

The rules tests prove that public users can read active records, reporters cannot mutate the catalogue, valid reports can be submitted, and even administrators cannot hard-delete drug records.

## Deployment

Build and deploy everything locally with:

```sh
npm run build
npm run firebase:deploy
```

The GitHub Actions workflow deploys Hosting on pushes to `main`. Configure these repository values first:

- Secret: `FIREBASE_SERVICE_ACCOUNT`
- Secret: `VITE_FIREBASE_API_KEY`
- Variables: `FIREBASE_PROJECT_ID`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`

Deploy Firestore Rules separately whenever `firestore.rules` changes, or extend the workflow with a service-account-authenticated Firebase CLI step.

## Data collections

- `drugs`: formulation-specific catalogue records with aliases and one or more location IDs
- `locations`: centrally managed location labels
- `reports`: create-only for anonymous iPad identities; readable and resolvable by admins
- `auditLogs`: append-only browser-side admin change history

Do not put patient names, identifiers, or clinical details into catalogue notes or issue reports.

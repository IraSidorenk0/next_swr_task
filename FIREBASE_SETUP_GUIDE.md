# Firebase Setup Guide (Client SDK + Firebase Admin)

This project uses **both** the Firebase client SDK (in the browser) and the **Firebase Admin SDK** (on the server) for authentication and Firestore access.

**Important**: This project now uses **environment variables** for Firebase Admin SDK configuration instead of JSON service account files for better security and deployment flexibility.

Use this guide to:

1. Configure your Firebase project and service account.
2. Set up the Admin SDK using environment variables in `firebase/firebase-admin.ts`.
3. Understand how session cookies and authentication work in this app.

---

## 1. Create / Configure the Firebase Project

1. Go to: https://console.firebase.google.com
2. Select or create the project: `my-project-1516289182804` (or your own project).
3. Make sure **Firestore Database** and **Authentication** are enabled.
4. In **Authentication → Sign-in method**, enable at least **Email/Password**.

---

## 2. Client SDK Configuration (`firebase/firebase.ts`)

The client SDK is used in the browser for things like `signInWithEmailAndPassword` and Firestore reads/writes.

In `firebase/firebase.ts` you should have something like:

```ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: '... ',
  authDomain: '... ',
  projectId: '... ',
  // etc.
};

const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
```

Make sure these values match your project’s **Web app** configuration in the Firebase console.

---

## 3. Firebase Admin SDK Setup (`firebase/firebase-admin.ts`)

The Admin SDK runs **only on the server** (API routes, server actions, NextAuth). It now uses **environment variables** instead of JSON service account files.

### 3.1 Generate Service Account Key

1. In Firebase Console, go to **Project settings → Service accounts**.
2. Click **Generate new private key** for the Firebase Admin SDK.
3. Download the JSON file - you'll need its contents for the environment variables.

### 3.2 Configure Environment Variables

Create or update your `.env` file with the Firebase Admin SDK configuration:

```env
# Firebase Admin SDK (keep these secret!)
FIREBASE_ADMIN_TYPE=service_account
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----\n"
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_CLIENT_ID=your-client-id
FIREBASE_ADMIN_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_ADMIN_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_ADMIN_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_ADMIN_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxx%40your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_UNIVERSE_DOMAIN=googleapis.com
```

**Important**: When copying the private key from the JSON file, make sure to:
- Replace actual newlines with `\n` 
- Wrap the entire key in quotes
- Escape any existing quotes in the key

### 3.3 Admin SDK Implementation

In `firebase/firebase-admin.ts` the configuration now uses environment variables:

```ts
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { ServiceAccount } from 'firebase-admin';

// Initialize Firebase Admin with environment variables
const serviceAccount: ServiceAccount = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID as string,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL as string,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n') as string,
};

let adminApp: App;

if (!getApps().length) {
  adminApp = initializeApp({
    credential: cert(serviceAccount),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  });
} else {
  adminApp = getApps()[0];
}

export const adminDb = getFirestore(adminApp);
export const adminAuth = getAuth(adminApp);
```

### 3.4 NextAuth Integration

The NextAuth route also uses the same environment variables:

```ts
// app/api/auth/[...nextauth]/route.ts
import { cert } from 'firebase-admin/app';
import type { ServiceAccount } from 'firebase-admin';

const firebaseServiceAccount: ServiceAccount = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID as string,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL as string,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n') as string,
};

export const authOptions: NextAuthOptions = {
  adapter: FirestoreAdapter({
    credential: cert(firebaseServiceAccount),
  }),
  // ... other configuration
};
```

---

## 4. How Authentication Works (Session Cookies)

The app uses a **session cookie** set by the server after sign-in. Key pieces:

- `firebase/actions.ts` (or `app/auth/actions.ts`) signs the user in and creates a session cookie using `adminAuth.createSessionCookie`.
- The cookie is stored as `session` via `next/headers` `cookies()` API.
- `firebase/auth.ts` and other server code read and verify this cookie with `getAuth().verifySessionCookie(...)`.

### 4.1 Sign-in flow (example)

1. Client calls a server action and sends `email` and `password`.
2. Server uses the **client SDK** (`signInWithEmailAndPassword`) or Admin SDK to authenticate.
3. Server calls `adminAuth.createSessionCookie(idToken, { expiresIn })`.
4. Server sets the `session` cookie (HTTP-only, secure in production).
5. Subsequent server requests use `adminAuth.verifySessionCookie(sessionCookie, true)` to get the Firebase user.

If you see errors here, check:

- All Firebase Admin environment variables are set correctly in your `.env` file.
- The project ID in the environment variables matches your Firebase project.
- The private key is properly formatted with `\n` for newlines and wrapped in quotes.
- `NEXTAUTH_SECRET` (and any other required env vars) are set correctly.

---

## 5. Firestore Security Rules (Recommended Dev Setup)

Even with Firebase Admin, Firestore security rules still apply to **client SDK** access. For local development you can use permissive rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // Development only
    }
  }
}
```

For production, tighten the rules to require authentication, for example:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /posts/{postId} {
      allow read: if true;
      allow create, update, delete: if request.auth != null;
    }

    match /comments/{commentId} {
      allow read: if true;
      allow create, update, delete: if request.auth != null;
    }
  }
}
```

Publish the rules in **Firestore Database → Rules**.

---

## 6. Troubleshooting

- **Admin SDK initialization errors**  
  Check that all Firebase Admin environment variables are set correctly and the private key is properly formatted.

- **`verifySessionCookie` or `createSessionCookie` errors**  
  Confirm that the ID token or custom token is created from the same project as the Admin SDK configuration.

- **Client SDK permission / 400 errors**  
  Re-check Firestore rules and that the client is using the correct project ID and API key.

- **NextAuth issues**  
  Make sure `NEXTAUTH_SECRET` is set and the Firestore adapter is configured with the same environment variables.

- **Environment variable issues**  
  - Verify the `.env` file is in the project root
  - Check that private key newlines are properly escaped with `\n`
  - Ensure all required environment variables are present
  - Restart the development server after changing environment variables

- **TypeScript errors**  
  The environment variables use type assertions (`as string`) to satisfy TypeScript. If you prefer stricter typing, you can add validation logic.


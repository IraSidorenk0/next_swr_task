# Firebase Admin Setup Guide

This project uses **only the Firebase Admin SDK** (server-side) for authentication and Firestore access. All Firebase operations are handled through API routes and server actions.

**Important**: This project uses **environment variables** for Firebase Admin SDK configuration instead of JSON service account files for better security and deployment flexibility.

Use this guide to:

1. Configure your Firebase project and service account.
2. Set up the Admin SDK using environment variables in `firebase/firebase-admin.ts`.
3. Understand how server-side authentication and API routes work in this app.

---

## 1. Create / Configure the Firebase Project

1. Go to: https://console.firebase.google.com
2. Select or create the project: `my-project-1516289182804` (or your own project).
3. Make sure **Firestore Database** and **Authentication** are enabled.
4. In **Authentication → Sign-in method**, enable at least **Email/Password**.

---

## 2. Firebase Admin SDK Setup (`firebase/firebase-admin.ts`)

The Admin SDK runs **only on the server** (API routes, server actions). It uses **environment variables** instead of JSON service account files.

### 2.1 Generate Service Account Key

1. In Firebase Console, go to **Project settings → Service accounts**.
2. Click **Generate new private key** for the Firebase Admin SDK.
3. Download the JSON file - you'll need its contents for the environment variables.

### 2.2 Configure Environment Variables

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

### 2.3 Admin SDK Implementation

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

### 2.4 API Route Integration

The API routes also use the same environment variables for Firebase Admin operations:

```ts
// app/api/posts/route.ts
import { adminDb, adminAuth } from '@/firebase/firebase-admin';

export async function GET(request: Request) {
  // Use adminDb for Firestore operations
  const posts = await adminDb.collection('posts').get();
  // ...
}

export async function POST(request: Request) {
  // Use adminAuth for authentication verification
  const sessionCookie = request.cookies.get('session')?.value;
  const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
  // ...
}
```

---

## 3. How Authentication Works (Server-Side)

The app uses **server-side authentication** with session cookies. Key pieces:

- `app/auth/actions.ts` handles sign-in and creates session cookies using `adminAuth.createSessionCookie`.
- The cookie is stored as `session` via `next/headers` `cookies()` API.
- API routes and server actions read and verify this cookie with `adminAuth.verifySessionCookie(...)`.
- All Firebase operations are performed through API routes using the Admin SDK.

### 3.1 Sign-in flow (example)

1. Client submits email/password to an API route (`/api/auth/signin`).
2. Server uses the Admin SDK to authenticate credentials.
3. Server calls `adminAuth.createSessionCookie(idToken, { expiresIn })`.
4. Server sets the `session` cookie (HTTP-only, secure in production).
5. Subsequent API requests use `adminAuth.verifySessionCookie(sessionCookie, true)` to get the Firebase user.

If you see errors here, check:

- All Firebase Admin environment variables are set correctly in your `.env` file.
- The project ID in the environment variables matches your Firebase project.
- The private key is properly formatted with `\n` for newlines and wrapped in quotes.
- API routes are properly implementing authentication checks.

---

## 4. Firestore Security Rules

Since this project uses Firebase Admin SDK, security rules are **bypassed for server-side operations**. However, it's still recommended to have proper rules for security and potential future client-side access:

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

**Note**: Admin SDK operations bypass these rules, but they're still important for security.

## 5. API Routes and Server Actions

All Firebase operations are handled through API routes and server actions:

### 5.1 Example API Route Structure

```ts
// app/api/posts/route.ts
import { adminDb, adminAuth } from '@/firebase/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('session')?.value;
    
    // Verify authentication
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie!, true);
    
    // Fetch data using Admin SDK
    const postsSnapshot = await adminDb.collection('posts').get();
    const posts = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return NextResponse.json(posts);
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
```

### 5.2 Server Actions

```ts
// app/actions/posts.ts
'use server';

import { adminDb, adminAuth } from '@/firebase/firebase-admin';
import { cookies } from 'next/headers';

export async function createPost(title: string, content: string) {
  const sessionCookie = cookies().get('session')?.value;
  const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie!, true);
  
  const post = {
    title,
    content,
    authorId: decodedClaims.uid,
    createdAt: new Date().toISOString(),
  };
  
  const docRef = await adminDb.collection('posts').add(post);
  return { id: docRef.id, ...post };
}
```

## 6. Troubleshooting

- **Admin SDK initialization errors**  
  Check that all Firebase Admin environment variables are set correctly and the private key is properly formatted.

- **`verifySessionCookie` or `createSessionCookie` errors**  
  Confirm that the ID token or custom token is created from the same project as the Admin SDK configuration.

- **API route authentication errors**  
  Check that session cookies are being properly set and verified in API routes.

- **Environment variable issues**  
  - Verify the `.env` file is in the project root
  - Check that private key newlines are properly escaped with `\n`
  - Ensure all required environment variables are present
  - Restart the development server after changing environment variables

- **TypeScript errors**  
  The environment variables use type assertions (`as string`) to satisfy TypeScript. If you prefer stricter typing, you can add validation logic.

- **Permission errors**  
  Since Admin SDK bypasses security rules, permission errors usually indicate:
  - Incorrect service account permissions
  - Invalid environment variable configuration
  - Firebase project misconfiguration


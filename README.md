# SWR Test Task - Next.js Firebase Application

This is a [Next.js](https://nextjs.org) project with Firebase integration, demonstrating SWR (Stale-While-Revalidate) data fetching patterns with Firebase Authentication and Firestore.

## Features

- **Firebase Authentication**: Email/password authentication with session management
- **Firestore Database**: Real-time database for posts and comments
- **SWR Integration**: Efficient data fetching and caching
- **Environment-based Configuration**: Secure Firebase admin configuration via environment variables

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Firebase Project** with Firestore and Authentication enabled
3. **Environment Variables** configured (see setup below)

## Setup

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd swr_test_task
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory with your Firebase configuration:

```env
# Public Firebase config (safe to expose)
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id

# Firebase Admin SDK (keep these secret!)
FIREBASE_ADMIN_TYPE=service_account
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_CLIENT_ID=your-client-id
FIREBASE_ADMIN_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_ADMIN_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_ADMIN_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_ADMIN_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxx%40your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_UNIVERSE_DOMAIN=googleapis.com

# NextAuth
NEXTAUTH_SECRET=your-nextauth-secret
```

### 3. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or use an existing one
3. Enable **Firestore Database** and **Authentication**
4. In Authentication → Sign-in method, enable **Email/Password**
5. Generate service account keys in Project Settings → Service accounts
6. Add the configuration to your `.env` file

For detailed setup instructions, see [FIREBASE_SETUP_GUIDE.md](./FIREBASE_SETUP_GUIDE.md).

## Getting Started

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── actions/           # Server actions
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   └── components/        # React components
├── firebase/              # Firebase configuration
│   ├── firebase-admin.ts  # Firebase Admin SDK setup
│   └── firebase.ts       # Firebase Client SDK setup
├── firebase-actions/      # Custom hooks with SWR
├── store/                 # State management
└── types/                 # TypeScript type definitions
```

## Key Features

### Authentication
- Email/password authentication
- Session management with secure cookies
- Server-side authentication verification

### Data Management
- SWR for efficient data fetching
- Real-time updates with Firestore
- Optimistic UI updates

### Environment-based Configuration
- Firebase Admin SDK configured via environment variables
- No service account JSON files needed
- Secure configuration management

## Troubleshooting

For common issues and solutions, see [TROUBLESHOOTING_GUIDE.md](./TROUBLESHOOTING_GUIDE.md).

## Learn More

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API
- [Firebase Documentation](https://firebase.google.com/docs) - learn about Firebase services
- [SWR Documentation](https://swr.vercel.app/) - learn about data fetching with SWR

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/pages/building-your-application/deploying) for more details.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn-pages-router) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/pages/building-your-application/deploying) for more details.

import NextAuth, { type NextAuthOptions, type SessionStrategy } from 'next-auth';
import { FirestoreAdapter } from '@auth/firebase-adapter';
import { cert } from 'firebase-admin/app';
import type { ServiceAccount } from 'firebase-admin';

const firebaseServiceAccount: ServiceAccount = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID as string,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL as string,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n') as string,
};

export const authOptions: NextAuthOptions = {
  providers: [
    // Configure your authentication providers here
    // For example, you can add email/password, Google, etc.
  ],
  adapter: FirestoreAdapter({
    credential: cert(firebaseServiceAccount),
  }),
  // Add any additional NextAuth configuration here
  session: {
    strategy: 'jwt' as SessionStrategy,
  },
  secret: process.env.NEXTAUTH_SECRET, // Make sure to set this in your .env file
  callbacks: {
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.sub || '';
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

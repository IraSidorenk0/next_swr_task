'server';

import { adminAuth } from '../../firebase/firebase-admin';
import { verifyUserCredentials } from '../../firebase/user-credentials';
import { cookies } from 'next/headers';

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) return null;

  try {
    const decodedClaims = await adminAuth.verifySessionCookie(session, true);
    return { uid: decodedClaims.uid, email: decodedClaims.email };
  } catch (error) {
    return null;
  }
}

export async function signIn(email: string, password: string) {
  try {
    // Firebase Admin only: Verify credentials using custom store
    const credentials = await verifyUserCredentials(email, password);
    
    if (!credentials) {
      return { success: false, error: 'Invalid credentials' };
    }

    // Create custom token for the user
    const customToken = await adminAuth.createCustomToken(credentials.uid);
    
    // Create session cookie from custom token
    const sessionCookie = await adminAuth.createSessionCookie(
      customToken, 
      { expiresIn: 60 * 60 * 24 * 5 * 1000 } // 5 days
    );

    // Set the session cookie
    const cookieStore = await cookies();
    cookieStore.set('session', sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 5, // 5 days
      path: '/',
    });

    return { success: true, uid: credentials.uid };
  } catch (error) {
    console.error('Sign in error:', error);
    return { success: false, error: 'Authentication failed' };
  }
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
  return { success: true };
}

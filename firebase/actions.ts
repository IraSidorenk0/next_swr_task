'use server';

import { adminAuth } from './firebase-admin';
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

export async function signInAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const idToken = formData.get('idToken') as string;

  try {
    if (!idToken) {
      return { 
        success: false, 
        error: 'Authentication token is required' 
      };
    }
    
    // Verify the ID token and create a session cookie
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: 60 * 60 * 24 * 5 * 1000 // 5 days
    });

    // Set the session cookie
    const cookieStore = await cookies();
    cookieStore.set('session', sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 5, // 5 days
      path: '/',
    });

    return { success: true };
  } catch (error: any) {
    console.error('Authentication error:', error);
    return { 
      success: false, 
      error: error.message || 'Invalid authentication' 
    };
  }
}

export async function registerAndSignInAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const displayName = formData.get('displayName') as string;

  try {
    // Create user with Firebase Admin SDK
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName,
    });

    // Create a custom token for the new user
    const customToken = await adminAuth.createCustomToken(userRecord.uid);

    return { 
      success: true, 
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      customToken
    };
  } catch (error: any) {
    console.error('Registration error:', error);
    
    let errorMessage = 'Registration error. Please try again.';
    
    if (error && typeof error === 'object' && 'code' in error) {
      const errorCode = (error as { code: string }).code;
      if (errorCode === 'auth/email-already-exists') {
        errorMessage = 'User with this email already exists.';
      } else if (errorCode === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (errorCode === 'auth/weak-password') {
        errorMessage = 'Password too weak. Use a stronger password.';
      } else if (errorCode === 'auth/invalid-password') {
        errorMessage = 'Invalid password format.';
      }
    }
    
    return { 
      success: false, 
      error: errorMessage 
    };
  }
}

export async function signOut() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  
  if (session) {
    try {
      // Verify and decode the session cookie
      const decodedClaims = await adminAuth.verifySessionCookie(session);
      
      // Revoke all refresh tokens for the user
      await adminAuth.revokeRefreshTokens(decodedClaims.sub);
    } catch (error) {
      console.error('Error during token revocation:', error);
      return { success: false, error: 'Failed to revoke session' };
    }
    
    // Clear the session cookie
    cookieStore.delete('session');
  }
  
  return { success: true };
}
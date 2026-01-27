import { NextResponse } from 'next/server';
import { adminAuth } from '../../../../firebase/firebase-admin';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { email, password, displayName } = await request.json();

    if (!email || !password || !displayName) {
      return NextResponse.json(
        { error: 'Email, password, and display name are required' },
        { status: 400 }
      );
    }

    // Create user with Firebase Admin SDK
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName,
    });

    // Create a custom token for the new user so they can be signed in immediately
    const customToken = await adminAuth.createCustomToken(userRecord.uid);

    return NextResponse.json({ 
      success: true, 
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      customToken
    });
  } catch (error: unknown) {
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
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}

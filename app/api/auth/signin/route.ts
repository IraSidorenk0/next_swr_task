import { NextResponse } from 'next/server';
import { adminAuth } from '../../../../firebase/firebase-admin';
import { verifyUserCredentials } from '../../../../firebase/user-credentials';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Firebase Admin only approach: Verify credentials using custom store
    const credentials = await verifyUserCredentials(email, password);
    
    if (!credentials) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Get Firebase user record
    const user = await adminAuth.getUser(credentials.uid);
    
    // Create custom token for the user
    const customToken = await adminAuth.createCustomToken(user.uid);
    
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

    return NextResponse.json({ 
      success: true,
      uid: user.uid,
      email: user.email,
      displayName: user.displayName
    });
  } catch (error: unknown) {
    console.error('Sign in error:', error);
    
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

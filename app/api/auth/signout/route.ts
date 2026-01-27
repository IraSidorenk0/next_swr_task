import { NextResponse } from 'next/server';
import { signOut } from '../../../../firebase/actions';

export async function POST() {
  try {
    const result = await signOut();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Sign out error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to sign out' },
      { status: 500 }
    );
  }
}

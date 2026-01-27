import { NextResponse } from 'next/server';
import { getConnectionStatus } from '../../../firebase/firebase-admin';

export async function GET() {
  try {
    const isOnline = await getConnectionStatus();
    return NextResponse.json({ isOnline });
  } catch (error) {
    console.error('Connection check failed:', error);
    return NextResponse.json({ isOnline: false }, { status: 500 });
  }
}

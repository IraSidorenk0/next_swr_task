import { adminDb } from './firebase-admin';
import bcrypt from 'bcryptjs';

interface UserCredentials {
  uid: string;
  email: string;
  hashedPassword: string;
  createdAt: string;
}

export async function createUserCredentials(uid: string, email: string, password: string): Promise<void> {
  const hashedPassword = await bcrypt.hash(password, 10);
  
  await adminDb.collection('userCredentials').doc(uid).set({
    uid,
    email,
    hashedPassword,
    createdAt: new Date().toISOString()
  });
}

export async function verifyUserCredentials(email: string, password: string): Promise<UserCredentials | null> {
  try {
    // Find user by email
    const snapshot = await adminDb
      .collection('userCredentials')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const credentials = doc.data() as UserCredentials;

    // Verify password
    const isValidPassword = await bcrypt.compare(password, credentials.hashedPassword);
    
    if (!isValidPassword) {
      return null;
    }

    return credentials;
  } catch (error) {
    console.error('Error verifying user credentials:', error);
    return null;
  }
}

export async function updateUserPassword(uid: string, newPassword: string): Promise<void> {
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  await adminDb.collection('userCredentials').doc(uid).update({
    hashedPassword,
    updatedAt: new Date().toISOString()
  });
}

export async function deleteUserCredentials(uid: string): Promise<void> {
  await adminDb.collection('userCredentials').doc(uid).delete();
}

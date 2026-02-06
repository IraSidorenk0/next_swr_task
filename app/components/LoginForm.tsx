'use client';

import { LoginFormProps } from '../types/interfaces';
import { useActionState } from 'react';
import { useState } from 'react';
import { useTheme } from 'next-themes';
import { z } from 'zod';
import { signInAction } from '../../firebase/actions';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { getAuth } from 'firebase/auth';
import { initializeApp } from 'firebase/app';

// Zod schema for login validation
const loginSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email'),
  password: z.string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters')
});


export default function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  const [state, formAction] = useActionState(signInAction, null);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});
  const [submitMessage, setSubmitMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { theme } = useTheme();
  
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const form = e.currentTarget;
    const formData = new FormData(form);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    // Update local state for display
    setFormData({ email, password });
    
    // Client-side validation
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const flat = parsed.error.flatten();
      setFieldErrors({
        email: flat.fieldErrors.email?.[0],
        password: flat.fieldErrors.password?.[0]
      });
      setIsSubmitting(false);
      return;
    }
    
    // Clear previous errors
    setFieldErrors({});
    
    try {
      // Initialize Firebase (you may want to move this to a separate config file)
      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
      };

      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);
      
      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Get the ID token
      const idToken = await userCredential.user.getIdToken();
      
      // Create a new FormData with the ID token
      const serverFormData = new FormData();
      serverFormData.append('email', email);
      serverFormData.append('password', password);
      serverFormData.append('idToken', idToken);
      
      // Submit to server action
      const result = await signInAction(null, serverFormData);
      
      if (result?.success) {
        setSubmitMessage('Login successful!');
        if (onSuccess) {
          setTimeout(() => onSuccess(), 1500);
        }
      } else {
        setSubmitMessage(result?.error || 'Error logging in');
      }
    } catch (error: unknown) {
      console.error('Firebase auth error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Invalid email or password';
      setSubmitMessage(errorMessage);
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/20">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800 dark:text-white">
        Login
      </h1>
      
      <form onSubmit={onSubmit} className="space-y-6">
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            autoComplete="email"
            className={`mt-1 block w-full px-3 py-2 border ${fieldErrors.email ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400`}
            placeholder="Enter your email..."
          />
          {fieldErrors.email && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Password *
          </label>
          <input
            name="password"
            value={formData.password || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            type="password"
            id="password"
            autoComplete="current-password"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="Enter your password..."
          />
          {fieldErrors.password && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
          )}
        </div>

        {/* Message about result */}
        {submitMessage && (
          <div className={`p-4 rounded-md ${
            submitMessage.includes('successful') 
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
          }`}>
            {submitMessage}
          </div>
        )}
        {/* Buttons */}
        <div className="space-y-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-700 dark:hover:bg-blue-800"
          >
            {isSubmitting ? 'Login...' : 'Login'}
          </button>
          
          {onSwitchToRegister && (
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="w-full bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:bg-gray-600 dark:hover:bg-gray-700"
            >
              No account? Register
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

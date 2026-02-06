'use client';

import { useState, useTransition } from 'react';
import { useActionState } from 'react';
import { useTheme } from 'next-themes';
import { z } from 'zod';
import { registerAndSignInAction } from '../../firebase/actions';
import { signInWithCustomToken } from 'firebase/auth';
import { getAuth } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { signInAction } from '../../firebase/actions';
import { RegistrationFormData } from '../types';

// Zod schema for registration validation
const registrationSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Input valid email'),
  password: z.string()
    .min(1, 'Password is required')
    .min(6, 'Password must contain at least 6 characters')
    .max(100, 'Password must not exceed 100 characters'),
  confirmPassword: z.string()
    .min(1, 'Confirm password is required'),
  displayName: z.string()
    .min(1, 'Display name is required')
    .min(2, 'Display name must contain at least 2 characters')
    .max(50, 'Display name must not exceed 50 characters')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

interface RegistrationFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export default function RegistrationForm({ onSuccess, onSwitchToLogin }: RegistrationFormProps) {
  const [state, formAction] = useActionState(registerAndSignInAction, null);
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState<RegistrationFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });
  const { theme } = useTheme();

  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const form = e.currentTarget;
    const formData = new FormData(form);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    const displayName = formData.get('displayName') as string;
    
    // Update local state for display
    setFormData({ email, password, confirmPassword, displayName });
    setServerError(null); // Clear previous server errors
    
    // Client-side validation
    const parsed = registrationSchema.safeParse({ email, password, confirmPassword, displayName });
    if (!parsed.success) {
      const flat = parsed.error.flatten();
      setFieldErrors({
        email: flat.fieldErrors.email?.[0],
        password: flat.fieldErrors.password?.[0],
        confirmPassword: flat.fieldErrors.confirmPassword?.[0],
        displayName: flat.fieldErrors.displayName?.[0]
      });
      return;
    }
    
    // Clear previous errors
    setFieldErrors({});
    
    // Submit to server action within transition
    startTransition(async () => {
      const result = await registerAndSignInAction(null, formData);
      
      // If registration was successful and we got a custom token, sign in the user
      if (result?.success && result.customToken) {
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
          
          // Sign in with the custom token
          const userCredential = await signInWithCustomToken(auth, result.customToken);
          
          // Get the ID token
          const idToken = await userCredential.user.getIdToken();
          
          // Create a new FormData with the ID token to create session
          const sessionFormData = new FormData();
          sessionFormData.append('email', email);
          sessionFormData.append('password', password);
          sessionFormData.append('idToken', idToken);
          
          // Submit to signInAction to create session cookie
          await signInAction(null, sessionFormData);
          
          // Call onSuccess callback if provided
          if (onSuccess) {
            setTimeout(() => {
              onSuccess();
            }, 1500);
          }
        } catch (error: unknown) {
          console.error('Error signing in with custom token:', error);
          setServerError('Error signing in after registration. Please try logging in manually.');
        }
      } else if (result?.error) {
        // Display server error
        setServerError(result.error);
      }
    });
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/20">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800 dark:text-white">
        Registration
      </h1>
      
      <form onSubmit={onSubmit} className="space-y-6">
        {/* Display Name */}
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            User name *
          </label>
          <input
            name="displayName"
            value={formData.displayName}
            onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
            type="text"
            id="displayName"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="Enter your name..."
          />
          {fieldErrors.displayName && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.displayName}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email *
          </label>
          <input
            name="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            type="email"
            id="email"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
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
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            type="password"
            id="password"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="Enter your password (minimum 6 characters)..."
          />
          {fieldErrors.password && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Confirm Password *
          </label>
          <input
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
            type="password"
            id="confirmPassword"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="Confirm Password..."
          />
          {fieldErrors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.confirmPassword}</p>
          )}
        </div>

        {/* Result message */}
        {(state || serverError) && (
          <div className={`p-4 rounded-md ${
            state?.success || (!state?.error && !serverError)
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
          }`}>
            {state?.success ? 'Registration successful! Signing you in...' : 
             serverError || state?.error || 'An error occurred'}
          </div>
        )}

        {/* Buttons */}
        <div className="space-y-4">
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-700 dark:hover:bg-blue-800"
          >
            {isPending ? 'Registration...' : 'Register'}
          </button>
          
          {onSwitchToLogin && (
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="w-full bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:bg-gray-600 dark:hover:bg-gray-700"
            >
              Already have an account? Login
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

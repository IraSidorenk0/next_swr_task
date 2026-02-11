'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import ThemeToggleButton from './ThemeToggleButton';

type User = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
};

interface NavigationProps {
  currentUser: User | null;
  commentsCount?: number;
}

export default function Navigation({ currentUser, commentsCount = 0 }: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      // Call the signout API route
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
      });
      
      const result = await response.json();
      
      if (result.success) {
        setIsMenuOpen(false);
        // Refresh the page to update the UI
        router.refresh();
      } else {
        console.error('Failed to sign out:', result.error);
      }
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50 dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm mr-3">
                BB
              </div>
              <span className="text-xl font-bold text-gray-900 hidden sm:block dark:text-gray-200">Best Blog</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            <Link 
              href="/" 
              className={`text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors dark:text-gray-300 dark:hover:text-white ${pathname === '/' ? 'text-purple-800 hover:text-purple-600 dark:text-green-300 dark:hover:text-green-600' : ''}`}
            >
              Home
            </Link>
            
            {currentUser ? (
              <>
                <div className="flex items-center space-x-4">
                  <Link
                    href="/profile"
                    className={`flex items-center space-x-2 dark:text-gray-300 ${pathname === '/profile' ? 'text-purple-800 hover:text-purple-600 dark:text-green-300 dark:hover:text-green-600' : ''}`}
                  >
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {(currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col ">
                      {currentUser.email}
                      {commentsCount > 0 && (
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <span className="mr-1">❤️</span>
                          {commentsCount} {commentsCount === 1 ? 'comment' : 'comments'}
                        </div>
                      )}
                    </div>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link 
                  href="/auth" 
                  className={`text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors dark:text-gray-300 dark:hover:text-white ${pathname === '/auth' ? 'text-purple-800 hover:text-purple-600 dark:text-green-300 dark:hover:text-green-600' : ''}`}
                >
                  Login/Registration
                </Link>
              </div>
            )}
             <ThemeToggleButton />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-gray-700 hover:text-blue-600 focus:outline-none focus:text-blue-600 transition-colors dark:text-gray-300 dark:hover:text-white"
              aria-label="Hide menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4 dark:border-gray-700">
            <div className="space-y-2">
              <Link 
                href="/" 
                className="block text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-base font-medium transition-colors dark:text-gray-300 dark:hover:text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              
              {currentUser ? (
                <div className="space-y-2">
                  <div className="flex items-center px-3 py-2">
                    <Link
                      href="/profile"
                      className={`flex items-center ${pathname === '/profile' ? 'text-purple-800 hover:text-purple-600 dark:text-green-300 dark:hover:text-green-600' : ''}`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-3">
                        {(currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col ml-3">
                        {currentUser.email}
                        {commentsCount > 0 && (
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <span className="mr-1">❤️</span>
                            {commentsCount} {commentsCount === 1 ? 'comment' : 'comments'}
                          </div>
                        )}
                      </div>
                    </Link>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left text-red-600 hover:text-red-800 px-3 py-2 rounded-md text-base font-medium transition-colors"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link 
                    href="/auth" 
                    className="block text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-base font-medium transition-colors dark:text-gray-300 dark:hover:text-white"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link 
                    href="/auth" 
                    className="block bg-blue-600 text-white px-3 py-2 rounded-md text-base font-medium hover:bg-blue-700 transition-colors mx-3"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Registration
                  </Link>
                  <ThemeToggleButton />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

import "../styles/globals.css";
import Navigation from "./components/Navigation";
import { getCurrentUser } from "../firebase/auth";
import { Toaster } from 'react-hot-toast';
import { SWRConfig } from 'swr';
import { Providers } from './providers';
export const metadata = {
  title: 'Best Blog',
  description: 'A blog platform built with Next.js and Firebase',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const currentUser = await getCurrentUser();
  return (
    <SWRConfig value={{
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 0,
    }}>
    <html lang="ru" className="h-full">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen font-sans antialiased dark:bg-gray-900">
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Navigation currentUser={currentUser} />
            <main className="flex-1">
              {children}
            </main>
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 5000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                },
                error: {
                  duration: 5000,
                },
              }}
            />
            <footer className="border-t border-gray-200 py-8 mt-12 dark:bg-gray-800 dark:border-gray-700">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm dark:text-gray-400">
                <p>&copy; 2024 Best Blog. Created with ❤️ using Next.js and Firebase.</p>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
    </SWRConfig>
  );
}
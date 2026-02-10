import { getCurrentUser } from '@/firebase/auth';
import UserInfo from '../components/UserInfo';

export default async function ProfilePage() {
  const currentUser = await getCurrentUser();
  
  if (!currentUser) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 dark:text-white">Not logged in</h2>
          <p className="text-gray-600 dark:text-gray-400">Please log in to view your profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Profile</h1>
      
      {/* User Info Component */}
      <UserInfo user={currentUser} />

    </div>
  );
}
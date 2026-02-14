import PostList from './components/PostList';
import { getCurrentUser } from '../firebase/auth';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const currentUser = await getCurrentUser();
  
  return (
    <div className="container-responsive py-8">
      <div className="text-center mb-12">
        <h1 className="text-responsive-xl font-bold text-gray-900 dark:text-chartreuse mb-4">
          Welcome to the blog
        </h1>
        <p className="text-responsive-base text-gray-600 dark:text-gray-200 max-w-2xl mx-auto">
          Modern blog created with Next.js, Firebase and SWR. 
          Share your thoughts and ideas with the community.
        </p>
      </div>
      <PostList currentUser={currentUser}/>
    </div>
  );
}
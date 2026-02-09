'use server';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import PostDetailClient from '../../components/PostDetailClient';
import { getCurrentUser } from '@/firebase/auth';
import { getPostByIdServer } from '@/firebase/server-actions';

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PostPage({ params }: Props) {
  const { id: postId } = await params;

  let isOnline = true;
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/connection`);
    const data = await response.json();
    isOnline = data.isOnline;
  } catch (error) {
    console.error('Connection check failed:', error);
    isOnline = false;
  }
  if (!isOnline) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="max-w-md p-6 text-center bg-white rounded-lg shadow-md">
          <h2 className="mb-4 text-2xl font-bold text-red-600">Connection Error</h2>
          <p className="mb-4 text-gray-700">
            We&apos;re having trouble connecting to our services. Please check your internet connection and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const currentUser = await getCurrentUser();
  
  if (!postId) {
    notFound();
  }

  try {
    const currentPost = await getPostByIdServer(postId);

    if (!currentPost) {
      notFound();
    }

    return (
      <div className="container mx-auto max-w-4xl p-4">
        <PostDetailClient 
          postId={postId} 
          currentUser={currentUser} 
          currentPost={currentPost} 
        />
      </div>
    );
  } catch (error) {
    console.error('Error loading post:', error);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="max-w-md p-6 text-center bg-white rounded-lg shadow-md">
          <h2 className="mb-4 text-2xl font-bold text-red-600">Error Loading Post</h2>
          <p className="mb-4 text-gray-700">
            We couldn&apos;t load the requested post. Please try again later.
          </p>
          <Link 
            href="/" 
            className="inline-block px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }
}
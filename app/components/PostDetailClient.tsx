'use client';

import PostDetail from './PostDetail';
import { PostDetailClientProps } from '../types';

export default function PostDetailClient({ postId, currentUser, currentPost }: PostDetailClientProps) {
  if (!postId) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p className="text-gray-600">Post ID not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PostDetail postId={postId} currentUser={currentUser} currentPost={currentPost} />
    </div>
  );
}

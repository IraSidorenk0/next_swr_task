'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import InlineNotice from './InlineNotice';
import CommentForm from './CommentForm';
import CommentList from './CommentList';
import { useLikedPosts } from '../../firebase-actions/useLikedPosts';
import { usePosts } from '../../firebase-actions/usePosts';
import { useRouter } from 'next/navigation';
import { PostDetailProps } from '../types/interfaces';

export default function PostDetail({ postId, currentUser, currentPost }: PostDetailProps) {
  const [loading, setLoading] = useState(!currentPost);
  const [liking, setLiking] = useState(false);
  const { theme } = useTheme();
  const { likedPostIds, toggleLike, isLoading, error } = useLikedPosts(currentUser?.uid);
  const { posts } = usePosts();
  const isLiked = currentPost ? likedPostIds.includes(currentPost.id) : false;
  const [showLoginNotice, setShowLoginNotice] = useState(false);
  const router = useRouter();  

  // Get the most up-to-date likes count from SWR cache
  const currentLikes = posts?.find(post => post.id === currentPost?.id)?.likes ?? currentPost?.likes ?? 0;  

  const handleLike = async () => {
    if (!currentUser) {
      setShowLoginNotice(true);
      return;
    }
    if (!currentPost) return;
    
    setLiking(true);
    
    try {
      await toggleLike(currentPost.id);
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setLiking(false);
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Unknown date';
    
    try {
      if (date instanceof Date) {
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Date unknown';
    }
  };

  const handleCommentCreated = () => {
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg dark:text-white">Loading post...</div>
      </div>
    );
  }

  if (!currentPost) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2 dark:text-white">Post not found</h2>
          <p className="text-gray-600 dark:text-gray-400">The requested post does not exist</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 container-responsive py-8 animate-fade-in">
      {/* Back Button */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/')}
          className="btn btn-outline flex items-center gap-2 hover:gap-3 transition-all dark:text-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to list
        </button>
      </div>

      {/* Post Content */}
      <article className="bg-white dark:bg-gray-800 card p-8 mb-12 animate-slide-in">
        {/* Post Header */}
        <header className="mb-8">
          <h1 className="text-responsive-xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">{currentPost?.title}</h1>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                  {currentPost?.authorName?.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <p className="font-medium text-gray-900 dark:text-white">{currentPost?.authorName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Author</p>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                <span>{formatDate(currentPost?.createdAt ? new Date(currentPost.createdAt) : undefined)}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
                <span>{currentLikes} likes</span>
              </div>
            </div>
            
            <button
              onClick={handleLike}
              disabled={liking}
              className={`btn text-sm px-6 py-2 rounded-full transition-all disabled:opacity-50 ${isLiked ? 'bg-pink-600 text-white hover:bg-pink-700' : 'bg-pink-100 text-pink-700 hover:bg-pink-200'}`}
            >
              {liking ? (
                <div className="flex items-center gap-2">
                  <div className="loading-spinner"></div>
                  Processing...
                </div>
              ) : isLiked ? ' Liked' : ' Like'}
            </button>
          </div>
        </header>

        {/* Post Content */}
        <div className="prose prose-lg max-w-none mb-8">
          {showLoginNotice && (
            <div className="mb-4">
              <InlineNotice
                tone="info"
                message="Login to like this post."
                actionLabel="Login"
                onAction={() => {
                  window.location.href = '/auth';
                }}
              />
            </div>
          )}
          <div className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap text-responsive-base">
            {currentPost?.content}
          </div>
        </div>

        {/* Tags */}
        {currentPost?.tags && currentPost.tags.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
              🏷️ Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {currentPost?.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 text-blue-800 dark:text-blue-200 text-sm font-medium px-4 py-2 rounded-full border border-blue-200 dark:border-blue-700 hover:shadow-sm transition-shadow"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </article>

      {/* Comments Section */}
      <div className="space-y-8">
        <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
          <h2 className="text-responsive-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            💬 Comments
          </h2>
          
          {/* Comment Form */}
          <div className="mb-8">
            <CommentForm postId={postId} onSuccess={handleCommentCreated} currentUser={currentUser}/>
          </div>
          
          {/* Comment List */}
          <CommentList postId={postId} />
        </div>
      </div>
    </div>
  );
}
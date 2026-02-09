'use client';

import Link from 'next/link';
import { Post } from '../types';
import { AppUser } from '../types';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useLikedPosts } from '../../firebase-actions/useLikedPosts';
import toast from 'react-hot-toast';

interface PostFormData {
  title: string;
  content: string;
  tags: string[];
}

interface PostCardProps {
  post: Post;
  editingPostId: string | null;
  editData: PostFormData;
  editErrors: Record<string, string | undefined>;
  isEditing: boolean;
  onCancelEdit: () => void;
  onSubmitEdit: (post: Post) => void;
  onDelete: (post: Post) => void;
  onEditDataChange: (data: Partial<PostFormData>) => void;
  formatDate: (date: string | Date | null | undefined) => string;
  isLiked: boolean;
  isOwnPost: boolean;
  currentUser: AppUser | null;
}

export default function PostCard({
  post,
  editingPostId,
  editData,
  editErrors,
  isEditing,
  onCancelEdit,
  onSubmitEdit,
  onDelete,
  onEditDataChange,
  formatDate,
  isLiked,
  isOwnPost,
  currentUser,
}: PostCardProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const isEditingThisPost = isEditing && editingPostId === post.id;
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const contentRef = useRef<HTMLParagraphElement>(null);

  const { toggleLike, likedPostIds } = useLikedPosts(currentUser?.uid);

  const onToggleLike = async (post: Post) => {
    if (!currentUser) {
      toast.error('Please sign in to like posts');
      return;
    }

    try {
      // Optimistically update the UI
      const isCurrentlyLiked = likedPostIds?.includes(post.id) || false;
      const newLikeCount = isCurrentlyLiked ? Math.max(0, (post.likes || 1) - 1) : (post.likes || 0) + 1;
      
      // Create an updated post with the new like count
      const updatedPost = {
        ...post,
        likes: newLikeCount
      };

      // Call the toggleLike function from useLikedPosts
      await toggleLike(post.id);
      
      // Notify the parent component about the like to update the post in the list
      if (onSubmitEdit) {
        await onSubmitEdit(updatedPost);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      // If there's an error, you might want to revert the optimistic update here
    }
  };

  useEffect(() => {
    if (contentRef.current) {
      const element = contentRef.current;
      // Check if content is overflowing by comparing scroll height with max height (96px = 24 * 4 lines)
      const isContentOverflowing = element.scrollHeight > 96; // 24 * 4 lines
      setIsOverflowing(isContentOverflowing);
    }
  }, [post.content]);

  return (
    <article className="bg-white dark:bg-gray-800 card card-hover p-6 animate-fade-in group relative overflow-hidden transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
      {/* Animated decorative gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-pink-50/20 dark:from-blue-900/10 dark:via-purple-900/5 dark:to-pink-900/5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Subtle animated pattern overlay - hydration safe */}
      <div className="absolute inset-0 ">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-blue-100/5 to-purple-100/5 dark:via-blue-900/5 dark:to-purple-900/5" 
             style={{
               backgroundSize: '20px 20px'
             }} />
      </div>
      
      {/* Floating accent elements */}
      
      <header className="mb-4 relative z-10">
        {isEditingThisPost ? (
          <div className="mt-4 p-6 bg-gray-50 dark:bg-gray-700 rounded-xl shadow-inner border border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <h3 className="text-lg font-semibold mb-0 dark:text-white">Edit Post</h3>
            </div>
            <input
              type="text"
              value={editData.title}
              onChange={(e) => onEditDataChange({ title: e.target.value })}
              className="w-full p-3 border border-gray-300 dark:border-gray-500 rounded-lg mb-3 dark:bg-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="Title"
            />
            {editErrors.title && (
              <p className="text-red-500 dark:text-red-400 text-sm mb-3 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {editErrors.title}
              </p>
            )}
            <textarea
              value={editData.content}
              onChange={(e) => onEditDataChange({ content: e.target.value })}
              className="w-full p-3 border border-gray-300 dark:border-gray-500 rounded-lg mb-3 dark:bg-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
              placeholder="Content"
              rows={4}
            />
            {editErrors.content && (
              <p className="text-red-500 dark:text-red-400 text-sm mb-4 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {editErrors.content}
              </p>
            )}
            <div className="flex gap-3 mb-2">
              <button
                onClick={onCancelEdit}
                className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </span>
              </button>
              <button
                onClick={() => onSubmitEdit(post)}
                className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Changes
                </span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Post header with author avatar */}
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-lg">
                {post.authorName?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  <Link href={`/posts/${post.id}`} className="hover:underline block">
                    {post.title}
                  </Link>
                </h2>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-medium">{post.authorName}</span>
                  <span className="mx-2 text-gray-300 dark:text-gray-600">•</span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDate(post.createdAt)}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Post content with improved styling */}
            <div className="relative bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
              <div className="relative">
                <p 
                  ref={contentRef}
                  className={`text-gray-700 dark:text-gray-300 leading-relaxed transition-all duration-300 ${
                    isExpanded ? '' : 'line-clamp-4'
                  }`}
                >
                  {post.content}
                </p>
                {!isExpanded && isOverflowing && (
                  <>
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-gray-50 dark:from-gray-700/50 to-transparent pointer-events-none" />
                    <button
                      onClick={() => setIsExpanded(true)}
                      className="absolute bottom-2 right-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium bg-white dark:bg-gray-700 px-2 py-1 rounded shadow-sm border border-gray-200 dark:border-gray-600"
                    >
                      Show more
                    </button>
                  </>
                )}
                {isExpanded && (
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                  >
                    Show less
                  </button>
                )}
              </div>
            </div>
            
            {/* Action buttons with improved styling */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-600">
              <button 
                onClick={() => {
                  onToggleLike(post);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isLiked 
                    ? 'btn border text-red-600 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50' 
                    : 'btn border text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <span className={`transition-transform duration-200 ${isLiked ? 'scale-110' : 'scale-100'}`}>
                  {isLiked ? '❤️' : '🤍'}
                </span>
                <span>{post.likes || 0} {post.likes === 1 ? 'like' : 'likes'}</span>
              </button>
              
              {isOwnPost && (
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      router.push(`/auth?redirect=${encodeURIComponent(`/posts/${post.id}/edit`)}`);
                    }}
                    className="flex flex-center items-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      onDelete(post);
                    }}
                    className="flex flex-center items-center bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-4 rounded-lg"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </div>
              )}
            </div>
          </>
        )}
        
        {!isEditingThisPost && (
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
            <Link
              href={`/posts/${post.id}`}
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-semibold transition-all duration-200 group"
            >
              <span>Read more</span>
              <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}
      </header>
      
      {/* Interactive border accent */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            
    </article>
  );
}

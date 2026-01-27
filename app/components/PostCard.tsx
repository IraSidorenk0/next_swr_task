'use client';

import Link from 'next/link';
import { Post } from '../types';
import { AppUser } from '../types';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
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
    <article className="card card-hover p-6 animate-fade-in group">
      <header className="mb-4">
        {isEditingThisPost ? (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium mb-2">Edit Post</h3>
            <input
              type="text"
              value={editData.title}
              onChange={(e) => onEditDataChange({ title: e.target.value })}
              className="w-full p-2 border rounded mb-2"
              placeholder="Title"
            />
            {editErrors.title && (
              <p className="text-red-500 text-sm mb-2">{editErrors.title}</p>
            )}
            <textarea
              value={editData.content}
              onChange={(e) => onEditDataChange({ content: e.target.value })}
              className="w-full p-2 border rounded mb-2"
              placeholder="Content"
              rows={4}
            />
            {editErrors.content && (
              <p className="text-red-500 text-sm mb-2">{editErrors.content}</p>
            )}
            <div className="flex gap-2 mb-4">
              <button
                onClick={onCancelEdit}
                className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => onSubmitEdit(post)}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
              <Link href={`/posts/${post.id}`} className="hover:underline">
                {post.title}
              </Link>
            </h2>
            
            <div className="flex items-center text-sm text-gray-500 mb-2">
              <span>By {post.authorName}</span>
              <span className="mx-2">•</span>
              <span>{formatDate(post.createdAt)}</span>
            </div>
            
            <div className="relative">
              <div className="relative">
                <div className="relative">
                  <p 
                    ref={contentRef}
                    className={`text-gray-700 mb-1 mt-2 transition-all duration-300 ${
                      isExpanded ? '' : 'line-clamp-4 max-h-24 overflow-hidden'
                    }`}
                  >
                    {post.content}
                  </p>
                  {!isExpanded && isOverflowing && (
                    <>
                      <div className="absolute -bottom-1 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />                      
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-4">
              <button 
                onClick={() => {
                  onToggleLike(post);
                }}
                className={`flex items-center gap-1 text-sm ${isLiked ? 'text-red-500' : 'text-gray-500'}`}
              >
                <span>❤️</span>
                <span>{post.likes || 0} likes</span>
              </button>
              
              {isOwnPost && (
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      router.push(`/auth?redirect=${encodeURIComponent(`/posts/${post.id}/edit`)}`);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      onDelete(post);
                    }}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </>
        )}
        
        {!isEditingThisPost && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <Link
              href={`/posts/${post.id}`}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center gap-1"
            >
              Read more
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}
      </header>
    </article>
  );
}

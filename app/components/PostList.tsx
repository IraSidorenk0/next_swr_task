'use client';

import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import ConfirmDialog from './ConfirmDialog';
import { AppUser, Post, PostFormData } from '../types';
import PostForm from './PostForm';
import PostCard from './PostCard';
import { PostFilters } from './PostFilters';
import { usePosts } from '../../firebase-actions/usePosts';
import { useLikedPosts } from '../../firebase-actions/useLikedPosts';
import { mutate } from 'swr';

export default function PostList({ currentUser }: { 
  currentUser: AppUser | null
}) {
  // Filters
  const [authorFilter, setAuthorFilter] = useState<string>('');
  const [tagFilter, setTagFilter] = useState<string>('');

  // Use the usePosts hook for posts CRUD
  const { 
    posts,
    updatePost,
    deletePost,
    mutate
  } = usePosts({ 
    author: authorFilter, 
    tag: tagFilter,
  });

  // Use the useLikedPosts hook for tracking liked posts and toggling like state
  const { likedPostIds } = useLikedPosts(currentUser?.uid);

  const [showPostForm, setShowPostForm] = useState(false);
  const [formData, setFormData] = useState<PostFormData>({
    title: '',
    content: '',
    tags: [],
    likes: 0
  });
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Omit<Post, 'id' | 'authorId' | 'authorName' | 'createdAt' | 'updatedAt'>>({
    title: '', 
    content: '', 
    tags: [], 
    likes: 0,
    likedBy: []
  });
  const [editErrors, setEditErrors] = useState<Record<string, string | undefined>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [appliedAuthorFilter, setAppliedAuthorFilter] = useState<string>('');
  const [appliedTagFilter, setAppliedTagFilter] = useState<string>('');

  // Authentication states
  const [showAuthModal, setShowAuthModal] = useState(false);

  const filteredPosts = useMemo(() => {
    const authorTerm = appliedAuthorFilter.trim().toLowerCase();
    const tagTerm = appliedTagFilter.trim().toLowerCase();

    if (!authorTerm && !tagTerm) {
      return posts;
    }

    return posts.filter((post) => {
      const matchesAuthor = authorTerm
        ? (post.authorName || '').toLowerCase().startsWith(authorTerm)
        : true;

      const matchesTag = tagTerm
        ? (post.tags || []).some((t) => (t || '').toLowerCase().startsWith(tagTerm))
        : true;

      return matchesAuthor && matchesTag;
    });
  }, [posts, appliedAuthorFilter, appliedTagFilter]);

  const handlePostCreated = () => {
    setShowPostForm(false);
    // Trigger data refresh to ensure the post list is updated
    mutate();
  };

  const cancelEditPost = () => {
    setEditingPostId(null);
    setEditErrors({});
    setIsEditing(false);
    setEditData({ title: '', content: '', tags: [], likes: 0, likedBy: [] });
  };

  const handleSubmitEdit = async (post: Post) => {
    if (!editingPostId) {
      // This is a like update
      try {
        // Update the post with the new like count
        await updatePost(post.id, {
          likes: post.likes
        });
        
        // Trigger a revalidation to ensure the UI is in sync with the server
        mutate();
      } catch (error) {
        console.error('Error updating like count:', error);
      }
      return;
    }
  
  // Existing edit post logic
  try {
    await updatePost(editingPostId, {
      title: editData.title,
      content: editData.content,
      tags: editData.tags
    });
    
    setShowPostForm(false);
    setEditingPostId(null);
    setIsEditing(false);
    setEditData({ title: '', content: '', tags: [], likes: 0, likedBy: [] });
    
  } catch (error) {
    console.error('Error updating post:', error);
  }
};

  const handleDeletePost = (post: Post) => {
    if (!currentUser) return;
    if (post.authorId !== currentUser.uid) return;
    setPostToDelete(post);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!postToDelete) return;
    
    try {
      await deletePost(postToDelete.id);
      setConfirmOpen(false);
      setPostToDelete(null);
      toast.success('Post deleted successfully');
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return 'Unknown date';
    
    try {
      let dateObj: Date;
      
      // Handle string or Date
      if (typeof date === 'string') {
        dateObj = new Date(date);
      } else {
        dateObj = date;
      }
      
      // If we still don't have a valid date, return unknown
      if (isNaN(dateObj.getTime())) {
        return 'Date unknown';
      }
      
      // Use a consistent format that doesn't depend on locale
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const hours = String(dateObj.getHours() % 12 || 12).padStart(2, '0');
      const minutes = String(dateObj.getMinutes()).padStart(2, '0');
      const ampm = dateObj.getHours() >= 12 ? 'PM' : 'AM';
      
      return `${month}/${day}/${year} ${hours}:${minutes} ${ampm}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date unknown';
    }
  };

  const cancelDelete = (): void => {
    setConfirmOpen(false);
    setPostToDelete(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 dark:bg-gray-900">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Posts</h1>
        <button
          onClick={() => currentUser ? setShowPostForm(true) : setShowAuthModal(true)}
          className="bg-blue-600 font-medium hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          {currentUser ? 'Create Post' : 'Sign In to Post'}
        </button>
      </div>
      <PostFilters
        authorFilter={authorFilter}
        tagFilter={tagFilter}
        onAuthorFilterChange={setAuthorFilter}
        onTagFilterChange={setTagFilter}
        onApplyFilters={(author, tag) => {
          setAuthorFilter(author);
          setTagFilter(tag);
          setAppliedAuthorFilter(author);
          setAppliedTagFilter(tag);
        }}
        onResetFilters={() => {
          setAuthorFilter('');
          setTagFilter('');
          setAppliedAuthorFilter('');
          setAppliedTagFilter('');
        }}
      />
      {showPostForm ? (
        <div className="mb-8">
          <PostForm 
            currentUser={currentUser}
            formData={formData}
            setFormData={setFormData}
            onCancel={() => setShowPostForm(false)}
            errors={{}}
            onSuccess={handlePostCreated}
          />
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredPosts.map((post: Post) => (
              <PostCard
                key={post.id}
                post={post}
                editingPostId={editingPostId}
                editData={editData}
                editErrors={editErrors}
                isEditing={editingPostId === post.id}
                onCancelEdit={cancelEditPost}
                onSubmitEdit={handleSubmitEdit}
                onDelete={handleDeletePost}
                onEditDataChange={(data) => setEditData(prev => ({ ...prev, ...data }))}
                formatDate={formatDate}
                isLiked={likedPostIds.includes(post.id)}
                isOwnPost={!!currentUser && post.authorId === currentUser.uid}
                currentUser={currentUser}
              />  
            ))}
          </div>
          <ConfirmDialog
            isOpen={confirmOpen}
            title="Delete this post?"
            description="This action is irreversible."
            confirmText="Delete"
            cancelText="Cancel"
            onConfirm={confirmDelete}
            onCancel={cancelDelete}
          />  
        </div>
      )}
    </div>
  );
}
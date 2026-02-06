'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { z } from 'zod';
import { useSession } from 'next-auth/react';
import { usePosts } from '../../firebase-actions/usePosts';
import { PostFormData } from '../types';
import toast from 'react-hot-toast';

import TagManager from './TagManager';
import UserInfo from './UserInfo';
import LoadingSpinner from './LoadingSpinner';
import { AppUser } from '../types';

// Zod schema for post validation
const postSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .min(5, 'Title must contain at least 5 characters')
    .max(100, 'Title cannot exceed 100 characters'),
  content: z.string()
    .min(1, 'Content is required')
    .min(10, 'Content must contain at least 10 characters')
    .max(5000, 'Main text cannot exceed 5000 characters'),
  tags: z.array(z.string())
    .min(1, 'Add at least one tag')
    .max(10, 'Maximum 10 tags')
    .refine(tags => tags.every(tag => tag.trim().length > 0), {
      message: 'Tags cannot be empty'
    }),
  likes: z.number().optional()
});

interface PostFormProps {
  currentUser: AppUser | null;
  formData: PostFormData;
  setFormData: React.Dispatch<React.SetStateAction<PostFormData>>;
  onCancel: () => void;
  errors: Record<string, string>;
  isEditing?: boolean;
  onSuccess?: () => void;
  isSubmitting?: boolean;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
}

export default function PostForm({
  currentUser,
  formData, 
  setFormData, 
  onCancel, 
  isEditing = false,
  onSuccess,
  onSubmit
}: PostFormProps) {
  
  const { data: session, status } = useSession();
  const { theme } = useTheme();
  const loading = status === 'loading';
  const error = null; // useSession handles errors differently
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [submitMessage, setSubmitMessage] = useState('');
  const [isOnline, setIsOnline] = useState(true);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});

  const { posts, createPost, updatePost } = usePosts();

  // Monitor connection status
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch('/api/connection');
        const data = await response.json();
        setIsOnline(data.isOnline);
      } catch (error) {
        console.error('Connection check failed:', error);
        setIsOnline(false);
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const handleTagsChange = (tags: string[]) => {
    setFormData(prev => ({ ...prev, tags }));
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (isEditing && onSubmit) {
      await onSubmit(e);
      return;
    }
    
    if (!currentUser) {      
      setSubmitMessage('Error: User is not authenticated');
      return;
    }

    if (!isOnline) {
      setSubmitMessage('Error: No internet connection. Please check your connection.');
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');
    setFieldErrors({});

    try {
      const dataToValidate: PostFormData = {
        title: formData.title,
        content: formData.content,
        tags: (formData.tags || []).map((t: string | null) => (t == null ? '' : t)),
        likes: formData.likes || 0
      };

      const parsed = postSchema.safeParse(dataToValidate);
      if (!parsed.success) {
        const flat = parsed.error.flatten();
        setFieldErrors({
          title: flat.fieldErrors.title?.[0],
          content: flat.fieldErrors.content?.[0],
          tags: flat.fieldErrors.tags?.[0]
        });
        setIsSubmitting(false);
        return;
      }

      const validData = parsed.data;

      // Clean and validate tags
      const cleanedTags = validData.tags.filter(tag => tag.trim() !== '');
      if (cleanedTags.length === 0) {
        setFieldErrors({ tags: 'Add at least one tag' });
        setIsSubmitting(false);
        return;
      }

      const loadingToast = toast.loading(isEditing ? 'Updating post...' : 'Creating post...');
            
      try {
        const postData = {
          ...formData,
          id: isEditing && formData.id ? formData.id : crypto.randomUUID(),
          authorId: currentUser.uid,
          author: currentUser.displayName || currentUser.email || 'Anonymous',
          authorName: currentUser.displayName || currentUser.email || 'Anonymous',
          likedBy: formData.likedBy || [],
          likes: formData.likes || 0,
          updatedAt: new Date().toISOString(),
          ...(isEditing ? {} : { createdAt: new Date().toISOString() })
        };
        
        if (isEditing) {
          if (!formData.id) {
            throw new Error('Post ID is required for updating');
          }
          await updatePost(formData.id, postData);
          toast.success('Post updated successfully!', { id: loadingToast });
        } else {
          await createPost(postData);
          toast.success('Post created successfully!', { id: loadingToast });
          // Reset form after successful creation
          setFormData({ title: '', content: '', tags: [], likes: 0, likedBy: [] });
        }
        
        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        }
      } catch (error) {
        console.error('Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An error occurred';
        toast.error(errorMessage, { id: loadingToast });
        throw error;
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitMessage(
        error instanceof Error ? error.message : 'An error occurred while processing your request'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  if (!currentUser) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 dark:text-white">Authorization required</h2>
          <p className="text-gray-600 dark:text-gray-400">To create a post, you need to log in to the system</p>
        </div>
      </div>
    );
  } 

  return (
    <div className="max-w-2xl mx-auto card p-6 animate-fade-in dark:bg-gray-800 dark:border-gray-700">
      <h3 className="text-responsive-lg font-bold mb-6 text-center text-gray-900 dark:text-white flex items-center justify-center gap-2" >
        {isEditing ? '✍️ Edit post' : '✍️ Create new post'}
      </h3>        
      
      <form onSubmit={handleFormSubmit} className="space-y-6">
        {/* Post title */}
        <div>
          <label htmlFor="title" className="form-label dark:text-gray-300">
            📝 Title *
          </label>
          <input
            value={formData.title || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            type="text"
            id="title"
            className="form-input dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            placeholder="Enter post title..."
          />
          {fieldErrors.title && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.title}</p>
          )}
        </div>

        {/* Main content */}
        <div>
          <label htmlFor="content" className="form-label dark:text-gray-300">
            📄 Content *
          </label>
          <textarea
            value={formData.content || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            id="content"
            rows={8}
            className="form-textarea dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            placeholder="Enter post content..."
          />
          {fieldErrors.content && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.content}</p>
          )}
        </div>

        {/* Tags */}
        <TagManager
          tags={formData.tags || []}
          onTagsChange={handleTagsChange}
          error={fieldErrors.tags}
        />


        {/* User info */}
        <UserInfo user={currentUser} />

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={isSubmitting || !isOnline}
            className="btn btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="loading-spinner"></div>
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : !isOnline ? (
              <>📡 No connection</>
            ) : (
              <>{isEditing ? 'Update post' : 'Create post'}</>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              if (isEditing) {
                onCancel();
              } else {
                setFormData({ title: '', content: '', tags: [], likes: 0 });
                setFieldErrors({});
              }
            }}
            className="btn btn-secondary sm:w-auto"
          >
            {isEditing ? '❌ Cancel' : '🧹 Clear'}
          </button>
        </div>
      </form>
    </div>
  );
}



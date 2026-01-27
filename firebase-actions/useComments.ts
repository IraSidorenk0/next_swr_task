'use client';
import useSWR, { mutate } from 'swr';
import type { Comment } from '../app/types';
import { UseCommentsPostsOptions } from '../app/types/swr-types';

const COMMENTS_KEY = 'comments';

// Fetcher for SWR
const fetcher = async (args: [string, string]): Promise<Comment[]> => {
  try {
    const [url, postId] = args;
    if (!postId) {
      console.log('No postId provided, returning empty comments array');
      return [];
    }
    
    console.log(`Fetching comments for post: ${postId}`);
    const res = await fetch(`${url}?postId=${encodeURIComponent(postId)}`);
    
    if (!res.ok) {
      const errorText = await res.text().catch(() => 'No error details');
      console.error(`Failed to fetch comments. Status: ${res.status} ${res.statusText}`, {
        url,
        postId,
        error: errorText
      });
      throw new Error(`Failed to fetch comments: ${res.status} ${res.statusText}`);
    }
    
    const data = await res.json();
    console.log(`Successfully fetched ${data.comments?.length || 0} comments`);
    return Array.isArray(data.comments) ? data.comments : [];
  } catch (error) {
    console.error('Error in fetcher:', error);
    throw error;
  }
};

// Fetcher function for SWR
export const useFetchComments = (postId?: string, options: UseCommentsPostsOptions = {}) => {
  const { initialData, fallbackData, ...swrConfig } = options;
  
  const { data, mutate, isLoading, error } = useSWR<Comment[]>(
    postId ? ['/api/comments', postId] : null,
    fetcher,
    {
      ...swrConfig,
      fallbackData: (initialData || fallbackData) as Comment[] | undefined,
      revalidateOnMount: !initialData,
      onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
        // Don't retry on 404
        if (error.message.includes('404')) return;
        // Retry up to 3 times
        if (retryCount >= 3) return;
        // Retry after 5 seconds
        setTimeout(() => revalidate({ retryCount }), 5000);
      },
    }
  );

  const createComment = async (data: { postId: string; content: string; authorId: string; authorName: string }) => {
    const newComment: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'> = {
      postId: data.postId,
      content: data.content,
      authorId: data.authorId,
      authorName: data.authorName,
    };
    
    await mutate(
      async (currentData: Comment[] = []) => {
        const res = await fetch('/api/comments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newComment),
        });

        if (!res.ok) throw new Error('Failed to create comment');
        const createdComment = await res.json();
        
        return [...currentData, createdComment];
      },
      {
        rollbackOnError: true,
        revalidate: true
      }
    );
  };

  const updateComment = async (commentId: string, content: string) => {
    await mutate(
      async (currentData: Comment[] = []) => {
        const res = await fetch(`/api/comments/${commentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId }),
        });
        
        if (!res.ok) throw new Error('Failed to update comment');
        return data;
      },
      {
        rollbackOnError: true,
        revalidate: true
      }
    );
  }

  const removeComment = async (commentId: string) => {
    await mutate(
      async (currentData: Comment[] = []) => {
        const res = await fetch(`/api/comments/${commentId}`, {
          method: 'DELETE',
        });
        
        if (!res.ok) throw new Error('Failed to delete comment');

        // Return the updated data (remove the deleted comment)
        return currentData.filter(comment => comment.id !== commentId);
      },
      {
        rollbackOnError: true,
        revalidate: true // Re-sync with server after the call
      }
    );
  }
  
  const comments = data || [];
  return {
    comments,
    isLoading,
    error,
    createComment,
    updateComment,
    removeComment,
    refetchComments: mutate,
    mutate, // Also expose mutate directly for more flexibility
  };
};

export const mutateComments = (postId: string) => {
  return mutate([COMMENTS_KEY, postId]);
};

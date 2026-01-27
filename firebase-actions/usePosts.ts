// firebase-actions/usePosts.ts
'use client';

import useSWR, { mutate } from 'swr';
import type { Post } from '../app/types';

const POSTS_KEY = 'posts';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch posts');
  }
  return res.json();
};

export const fetchPosts = async (filters?: { author?: string; tag?: string }): Promise<Post[]> => {
  const params = new URLSearchParams();

  if (filters?.author?.trim()) {
    params.set('author', filters.author.trim());
  }
  if (filters?.tag?.trim()) {
    params.set('tag', filters.tag.trim());
  }

  const queryString = params.toString();
  const url = queryString ? `/api/posts?${queryString}` : '/api/posts';

  const data = await fetcher(url);
  return data.posts || [];
};

export const getPostById = async (postId: string): Promise<Post | null> => {
  try {
    const res = await fetch(`/api/posts/${postId}`);
    if (!res.ok) {
      if (res.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch post');
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching post by ID:', error);
    throw error;
  }
};

export const usePosts = (filters?: { author?: string; tag?: string }) => {
  const { data: posts = [], error, mutate } = useSWR<Post[]>(
    [POSTS_KEY, filters],
    ([_, filters]) => fetchPosts(filters as { author?: string; tag?: string }),
    {
      revalidateOnFocus: false,
    }
  );

  const createPost = async (postData: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>) => {
    const tempId = `temp-${Date.now()}`; // Temporary ID for optimistic update
    const optimisticPost: Post = {
      id: tempId,
      title: postData.title,
      content: postData.content,
      tags: postData.tags || [],
      authorId: postData.authorId,
      authorName: postData.authorName || 'Anonymous',
      likes: postData.likes || 0,
      likedBy: postData.likedBy || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    try {
      // Optimistically update the local cache
      await mutate(
        async (currentData = []) => {
          // Make the API call
          const res = await fetch('/api/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(postData),
          });
          
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to create post');
          }
          
          const createdPost = await res.json();
          
          // Replace the optimistic post with the actual server response
          return currentData
            .filter(post => post.id !== tempId) // Remove the temporary post
            .concat(createdPost) // Add the server-created post
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Sort by date
        },
        {
          optimisticData: (currentData = []) => [optimisticPost, ...currentData],
          rollbackOnError: true,
          revalidate: true, // Revalidate to ensure we have the latest data
          populateCache: true
        }
      );
      
      // Trigger a revalidation to ensure the cache is up to date
      const foundPost = posts.find(post => post.id === optimisticPost.id);
      if (foundPost) {
        await mutate([foundPost]);
      }
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  };

  const updatePost = async (postId: string, updates: Partial<Post>) => {
    await mutate(
      async (currentData = []) => {
        const res = await fetch('/api/posts', {
          method: 'PUT',
          headers: {  
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            postId: postId,
            title: updates.title,
            content: updates.content,
            tags: updates.tags
          })
        });
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to update post');
        }
        
        const updatedPost = await res.json();
        
        // Ensure dates are properly formatted as strings
        const formattedPost = {
          ...updatedPost,
          createdAt: updatedPost.createdAt || new Date().toISOString(),
          updatedAt: updatedPost.updatedAt || new Date().toISOString(),
        };
        
        return currentData.map(post => 
          post.id === postId ? { ...post, ...formattedPost } : post
        );
      },
      {
        optimisticData: (currentPosts = []) => 
          currentPosts.map(post => 
            post.id === postId 
              ? { 
                  ...post, 
                  ...updates, 
                  updatedAt: new Date().toISOString(),
                  // Keep the original createdAt date for optimistic update
                  createdAt: post.createdAt || new Date().toISOString()
                } 
              : post
          ),
        rollbackOnError: true,
        revalidate: true,
      }
    );
  };

  const deletePost = async (postId: string) => {
    await mutate(
      async (currentData = []) => {
        const res = await fetch('/api/posts', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            postId: postId
          })
        });
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to delete post');
        }
        
        return currentData.filter(post => post.id !== postId);
      },
      {
        optimisticData: (currentPosts = []) => 
          currentPosts.filter(post => post.id !== postId),
        rollbackOnError: true,
        revalidate: true,
      }
    );
  };

  return {
    posts,
    isLoading: !error && !posts,
    error,
    createPost,
    updatePost,
    deletePost,
    mutate,
  };
};
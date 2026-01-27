import useSWR, { SWRConfiguration, mutate as globalMutate } from 'swr';

// Fetcher for SWR
const fetcher = async ([url, userId]: [string, string]) => {
  const res = await fetch(`${url}?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error('Failed to fetch liked posts');
  const data = await res.json();
  return data.postIds as string[];
};

interface UseLikedPostsOptions extends Omit<SWRConfiguration<string[]>, 'fallbackData'> {
  initialData?: string[];
  fallbackData?: string[];
}

export const useLikedPosts = (userId?: string, options: UseLikedPostsOptions = {}) => {
  const { initialData, fallbackData, ...swrConfig } = options;
  
  const { data, mutate, isLoading, error } = useSWR<string[]>(
    userId ? ['/api/likes', userId] : null,
    fetcher,
    {
      ...swrConfig,
      fallbackData: initialData || fallbackData,
      revalidateOnMount: !initialData,
    }
  );

  const likedPostIds = data || [];

  const toggleLike = async (postId: string) => {
    if (!userId) return;

    const isLiked = likedPostIds.includes(postId);
    
    // 1. Define the optimistic data (what the UI should look like immediately)
    const optimisticData = isLiked
      ? likedPostIds.filter(id => id !== postId)
      : [...likedPostIds, postId];

    // 2. Optimistically update the posts cache for immediate UI feedback
    globalMutate(
      (key) => Array.isArray(key) && key[0] === 'posts',
      (currentData: any[] = []) => {
        return currentData.map((post: any) => 
          post.id === postId 
            ? { 
                ...post, 
                likes: isLiked ? Math.max(0, post.likes - 1) : post.likes + 1
              } 
            : post
        );
      },
      false // Don't revalidate yet, we'll do that after the API call
    );

    // 3. Use mutate to handle the optimistic update for liked posts
    await mutate(
      async () => {
        const res = await fetch('/api/likes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, postId }),
        });
        
        if (!res.ok) throw new Error('Failed to update likes');
        
        const result = await res.json();
        
        // Trigger revalidation of posts cache to sync with server
        globalMutate(
          (key) => Array.isArray(key) && key[0] === 'posts'
        );
        
        // Return the final data (or trigger a revalidation)
        return optimisticData; 
      },
      {
        optimisticData,
        rollbackOnError: true,
        revalidate: true, // Re-sync with server after the call
      }
    );
  };

  return {
    likedPostIds,
    isLoading,
    error,
    toggleLike,
    refetchLikes: mutate,
  };
};
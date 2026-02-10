import { Post } from '../../types/post';
import { adminDb } from '../../firebase/firebase-admin';

export async function fetchPosts(filters?: { author?: string; tag?: string }): Promise<Post[]> {
  
  try {
    let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = adminDb.collection('posts');
    
    if (filters?.author?.trim()) {
      query = query.where('authorName', '==', filters.author.trim());
    }
    
    if (filters?.tag?.trim()) {
      query = query.where('tags', 'array-contains', filters.tag.trim());
    }
    
    const snapshot = await query.get();
    
    // Convert docs to Post objects
    const posts = snapshot.docs.map((doc): Post => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || '',
        content: data.content || '',
        authorId: data.authorId || '',
        authorName: data.authorName || data.author || 'Unknown',
        authorAvatar: data.authorAvatar,
        tags: Array.isArray(data.tags) ? data.tags : [],
        likes: typeof data.likes === 'number' ? data.likes : 0,
        likedBy: Array.isArray(data.likedBy) ? data.likedBy : [],
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
      };
    });
    
    // Sort posts by createdAt in descending order (newest first)
    return posts.sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return bTime - aTime;
    });
  } catch (error) {
    console.error('Error fetching posts on server:', error);
    throw error;
  }
  
}

import { adminDb } from './firebase-admin';
import { Post } from '../types/post';

export async function getPostByIdServer(postId: string): Promise<Post | null> {
  try {
    if (!postId) {
      return null;
    }

    const postDoc = await adminDb.collection('posts').doc(postId).get();

    if (!postDoc.exists) {
      return null;
    }

    const data = postDoc.data();
    if (!data) {
      return null;
    }

    const post: Post = {
      id: postDoc.id,
      title: data.title || '',
      content: data.content || '',
      authorId: data.authorId || '',
      authorName: data.authorName || data.author || '',
      authorAvatar: data.authorAvatar,
      tags: Array.isArray(data.tags) ? data.tags : [],
      likes: typeof data.likes === 'number' ? data.likes : 0,
      likedBy: Array.isArray(data.likedBy) ? data.likedBy : [],
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
    };

    return post;
  } catch (error) {
    console.error('Error fetching post by ID:', error);
    throw error;
  }
}

import { adminDb } from '../../../../firebase/firebase-admin';
import { NextResponse } from 'next/server';
import { Post } from '../../../../types/post';

// GET /api/posts/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }

    const postDoc = await adminDb.collection('posts').doc(id).get();

    if (!postDoc.exists) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    const data = postDoc.data();
    if (!data) {
      return NextResponse.json(
        { error: 'Post data not found' },
        { status: 404 }
      );
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

    return NextResponse.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    );
  }
}

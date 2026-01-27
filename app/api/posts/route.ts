import { adminDb } from '../../../firebase/firebase-admin';
import { NextResponse, NextRequest } from 'next/server';
import { Post } from '../../../types/post';

// GET /api/posts
export async function GET() {
  try {
    const snapshot = await adminDb.collection('posts').get();
    
    const posts = snapshot.docs.map((doc): Post => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || '',
        content: data.content || '',
        authorId: data.authorId || '',
        authorName: data.authorName || data.author || '',
        authorAvatar: data.authorAvatar,
        tags: Array.isArray(data.tags) ? data.tags : [],
        likes: typeof data.likes === 'number' ? data.likes : 0,
        likedBy: Array.isArray(data.likedBy) ? data.likedBy : [],
        createdAt: data.createdAt || '',
        updatedAt: data.updatedAt || '',
      };
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

// POST /api/posts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, authorName, authorId, tags = [] } = body;

    if (!title || !content || !authorName || !authorId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const postData = {
      title,
      content,
      authorName,
      authorId,
      tags: Array.isArray(tags) ? tags : [],
      likes: 0,
      likedBy: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await adminDb.collection('posts').add(postData);
    
    return NextResponse.json({
      id: docRef.id,
      ...postData
    });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}

// PUT /api/posts
export async function PUT(request: NextRequest) {
  try {
    const { postId, ...updateData } = await request.json();

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }

    const postRef = adminDb.collection('posts').doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    const updatePayload = {
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    await postRef.update(updatePayload);

    return NextResponse.json({
      id: postDoc.id,
      ...postDoc.data(),
      ...updatePayload,
    });
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    );
  }
}

// DELETE /api/posts
export async function DELETE(request: NextRequest) {
  try {
    const { postId } = await request.json();

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }

    const postRef = adminDb.collection('posts').doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Delete the post
    await postRef.delete();

    // Also delete related comments
    const commentsSnapshot = await adminDb
      .collection('comments')
      .where('postId', '==', postId)
      .get();

    const batch = adminDb.batch();
    commentsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    );
  }
}
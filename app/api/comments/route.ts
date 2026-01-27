// app/api/comments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../firebase/firebase-admin';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get('postId');

  if (!postId) {
    return NextResponse.json({ comments: [] });
  }

  try {
    console.log(`Fetching comments for post: ${postId}`);
    
    // First try with ordering
    try {
      const snapshot = await adminDb
        .collection('comments')
        .where('postId', '==', postId)
        .orderBy('createdAt', 'desc')
        .get();

      const comments = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      return NextResponse.json({ comments });
    } catch (orderError: unknown) {
      const errorMessage = orderError instanceof Error ? orderError.message : 'An unknown error occurred';
      console.log('Ordered query failed, trying without ordering:', errorMessage);
      
      // If ordering fails, try without it
      const snapshot = await adminDb
        .collection('comments')
        .where('postId', '==', postId)
        .get();

      const comments = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return NextResponse.json({ comments });
    }
  } catch (e) {
    const error = e as Error;
    return NextResponse.json(
      { error: 'Failed to fetch comments', details: error.message }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { postId, content, authorId, authorName } = await request.json();
    console.log('Creating comment with data:', { postId, authorId, content });

    if (!postId || !content || !authorId || !authorName) {
      console.error('Missing required fields', { postId, content, authorId, authorName });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const commentData = {
      postId,
      content,
      authorId,
      authorName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log('Adding comment to Firestore:', commentData);
    const docRef = await adminDb.collection('comments').add(commentData);
    
    const createdComment = {
      id: docRef.id,
      ...commentData
    };
    
    console.log('Successfully created comment:', createdComment);
    return NextResponse.json(createdComment);
  } catch (e: unknown) {
    const error = e as Error;
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment', details: error.message },
      { status: 500 }
    );
  }
}
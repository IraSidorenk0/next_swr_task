'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { z } from 'zod';
import { CommentFormProps } from '../types/interfaces';
import { useFetchComments } from '../../firebase-actions/useComments';

// Zod schema for comment validation
const commentSchema = z.object({
  content: z.string()
    .min(1, 'Comment cannot be empty')
    .min(5, 'Comment must contain at least 5 characters')
    .max(1000, 'Comment cannot exceed 1000 characters')
});

type CommentFormData = z.infer<typeof commentSchema>;

export default function CommentForm({ postId, onSuccess, currentUser }: CommentFormProps) {
  const { createComment } = useFetchComments(postId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [formData, setFormData] = useState<CommentFormData>({
    content: ''
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});
  const { theme } = useTheme();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser) {
      setSubmitMessage('Error: User is not authenticated');
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');
    setFieldErrors({});

    try {
      const parsed = commentSchema.safeParse(formData);
      if (!parsed.success) {
        const flat = parsed.error.flatten();
        setFieldErrors({
          content: flat.fieldErrors.content?.[0] || '',
        });
        setIsSubmitting(false);
        return;
      }

      // Create the comment using the SWR mutation
      await createComment({
        content: formData.content,
        postId,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || 'Anonymous',
      });

      // Clear the form and show success message
      setFormData({ content: '' });
      setSubmitMessage('Comment submitted successfully!');
      
      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: Error | unknown) {
      console.error('Error adding comment:', error);
      
      let errorMessage = 'Error adding comment. Please try again.';
      
      if (error && typeof error === 'object' && 'code' in error && error.code === 'permission-denied') {
        errorMessage = 'Access denied. Check Firebase Security Rules.';
      } else if (error && typeof error === 'object' && 'code' in error && error.code === 'unavailable') {
        errorMessage = 'Firebase is unavailable. Please check your internet connection.';
      } else if (error && typeof error === 'object' && 'code' in error && error.code === 'unauthenticated') {
        errorMessage = 'Authentication error. Please log in again.';
      } else if (error && typeof error === 'object' && 'message' in error && error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      setSubmitMessage(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="card p-6 text-center animate-fade-in dark:bg-gray-800 dark:border-gray-700">
        <div className="text-4xl mb-3">🔒</div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Authorization required</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">To add a comment, you need to log in to the system</p>
        <p className="text-xs text-gray-500 dark:text-gray-500">Log in through the navigation menu at the top of the page</p>
      </div>
    );
  }

  return (
    <div className="card p-6 animate-fade-in dark:bg-gray-800 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        ✍️ Add comment
      </h3>
      
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="content" className="form-label dark:text-gray-300">
            💬 Your comment *
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            id="content"
            rows={4}
            className="form-textarea dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            placeholder="Write your comment..."
          />
          {fieldErrors.content && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.content}</p>
          )}
        </div>

        {/* Messages about result */}
        {submitMessage && (
          <div className={`p-3 rounded-md text-sm ${
            submitMessage.includes('success') 
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
          }`}>
            {submitMessage}
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="loading-spinner"></div>
                Adding...
              </>
            ) : (
              <>
                📨 Publish
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setFormData({ content: '' });
              setFieldErrors({});
              setSubmitMessage('');
            }}
            className="btn btn-secondary sm:w-auto"
          >
            🧹 Clear
          </button>
        </div>
      </form>
    </div>
  );
}
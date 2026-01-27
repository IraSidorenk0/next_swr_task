import { AppUserWithoutEmailVerified, Post, AppUser } from '../types/index';

export interface AuthModalProps {
  isVisible: boolean;
  initialMode?: 'login' | 'register';
  onClose: () => void;
}

export interface UserInfoProps {
  user: {
    uid: string;
    displayName?: string | null;
    email?: string | null;
  };
}

export interface CommentFormProps {
  postId: string;
  onSuccess?: () => void;
  currentUser: AppUserWithoutEmailVerified | null;
}

export interface TagManagerProps {
  tags: string[];
  maxTags?: number;
  onTagsChange: (tags: string[]) => void;
  error?: string;
}

export interface PostFiltersProps {
  authorFilter: string;
  tagFilter: string;
  onAuthorFilterChange: (value: string) => void;
  onTagFilterChange: (value: string) => void;
  onApplyFilters: (author: string, tag: string) => void;
  onResetFilters: () => void;
}

export interface PostDetailProps {
  postId: string;
  currentUser: AppUserWithoutEmailVerified | null;
  currentPost: Post | null;
}

export interface PostFormData {
  title: string;
  content: string;
  tags: string[];
}

export interface PostCardProps {
  post: Post;
  editingPostId: string | null;
  editData: PostFormData;
  editErrors: Record<string, string | undefined>;
  isEditing: boolean;
  onCancelEdit: () => void;
  onSubmitEdit: (post: Post) => void;
  onDelete: (post: Post) => void;
  onEditDataChange: (data: Partial<PostFormData>) => void;
  formatDate: (date: string | Date | null | undefined) => string;
  isLiked: boolean;
  isOwnPost: boolean;
  currentUser: AppUser | null;
}

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
}

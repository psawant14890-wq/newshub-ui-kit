export interface DbArticle {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  excerpt?: string;
  body?: string;
  thumbnail?: string;
  category: string;
  tags?: string[];
  author_id?: string;
  author_name?: string;
  author_avatar?: string;
  author_bio?: string;
  status: 'draft' | 'published';
  featured: boolean;
  views: number;
  read_time: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
}

export interface Profile {
  id: string;
  name?: string;
  avatar_url?: string;
  bio?: string;
  website?: string;
  twitter?: string;
  articles_count: number;
  followers_count: number;
  created_at: string;
  updated_at: string;
}

export interface DbCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  article_count: number;
  banner_image?: string;
  is_featured: boolean;
  created_at: string;
}

export interface DbComment {
  id: string;
  article_slug: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  body: string;
  parent_id?: string;
  likes: number;
  is_edited: boolean;
  created_at: string;
  updated_at?: string;
}

export interface SavedArticle {
  id: string;
  user_id: string;
  article_slug: string;
  article_title: string;
  article_thumbnail?: string;
  article_category?: string;
  saved_at: string;
}

export interface ReadingHistory {
  id: string;
  user_id: string;
  article_slug: string;
  article_title: string;
  article_thumbnail?: string;
  read_at: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  name?: string;
  subscribed_at: string;
  is_active: boolean;
}

// Re-export existing types for backward compatibility
export type { Author, Category, Article, Tag, ArticleTag, Comment, User } from '../types/index';

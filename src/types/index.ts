export interface Author {
  id: string;
  name: string;
  slug: string;
  bio: string;
  avatar_url: string | null;
  twitter_handle: string | null;
  email: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  display_order: number;
  created_at: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image_url: string | null;
  author_id: string | null;
  category_id: string | null;
  is_featured: boolean;
  is_breaking: boolean;
  is_opinion: boolean;
  is_fact_checked: boolean;
  view_count: number;
  published_at: string;
  updated_at: string;
  created_at: string;
  meta_title: string | null;
  meta_description: string | null;
  author?: Author;
  category?: Category;
  tags?: Tag[];
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface ArticleTag {
  article_id: string;
  tag_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  article_id: string;
  author_name: string;
  author_email: string;
  content: string;
  is_approved: boolean;
  created_at: string;
  likes?: number;
  replies?: Comment[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

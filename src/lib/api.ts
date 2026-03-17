import { supabase } from './supabase';
import type { Article, Category, Tag, Comment, Author } from '../types';

// ============================================================
// Helper: map Supabase article rows → Article type
// ============================================================
function mapArticle(row: any): Article {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt || '',
    content: row.body || row.content || '',
    featured_image_url: row.thumbnail || row.featured_image_url || null,
    author_id: row.author_id || null,
    category_id: null,
    is_featured: row.featured === true || row.views >= 5000 || false,
    is_breaking: false,
    is_opinion: false,
    is_fact_checked: false,
    view_count: row.views || 0,
    published_at: row.published_at || row.created_at,
    updated_at: row.updated_at || row.created_at,
    created_at: row.created_at,
    meta_title: null,
    meta_description: null,
    author: {
      id: row.author_id || '0',
      name: row.author_name || 'NewsHub Staff',
      slug: (row.author_name || 'staff').toLowerCase().replace(/\s+/g, '-'),
      bio: '',
      avatar_url: row.author_avatar || null,
      twitter_handle: null,
      email: null,
      created_at: row.created_at,
    },
    category: row.category ? {
      id: row.category,
      name: row.category,
      slug: row.category.toLowerCase().replace(/\s+/g, '-'),
      description: '',
      display_order: 0,
      created_at: row.created_at,
    } : undefined,
    tags: row.tags ? row.tags.map((t: string, i: number) => ({
      id: `tag-${i}`,
      name: t,
      slug: t.toLowerCase().replace(/\s+/g, '-'),
      created_at: row.created_at,
    })) : [],
  };
}

function mapCategory(row: any): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description || '',
    display_order: 0,
    created_at: row.created_at,
    color: row.color,
    article_count: row.article_count || 0,
  } as Category & { color?: string; article_count?: number };
}

// ============================================================
// Mock Data (fallback when Supabase tables don't exist yet)
// ============================================================
const mockAuthors: Author[] = [
  { id: '1', name: 'Sarah Chen', slug: 'sarah-chen', bio: 'Senior political correspondent.', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah', twitter_handle: '@sarahchen', email: 'sarah@newshub.com', created_at: '2024-01-01' },
  { id: '2', name: 'James Rodriguez', slug: 'james-rodriguez', bio: 'Tech editor.', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=james', twitter_handle: '@jamesrod', email: 'james@newshub.com', created_at: '2024-01-01' },
  { id: '3', name: 'Emily Park', slug: 'emily-park', bio: 'Sports analyst.', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emily', twitter_handle: '@emilypark', email: 'emily@newshub.com', created_at: '2024-01-01' },
  { id: '4', name: 'Michael Torres', slug: 'michael-torres', bio: 'International affairs correspondent.', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=michael', twitter_handle: '@mtorres', email: 'michael@newshub.com', created_at: '2024-01-01' },
  { id: '5', name: 'Lisa Wang', slug: 'lisa-wang', bio: 'Entertainment writer.', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisa', twitter_handle: '@lisawang', email: 'lisa@newshub.com', created_at: '2024-01-01' },
];

const mockCategories: Category[] = [
  { id: '1', name: 'Politics', slug: 'politics', description: 'Political news and analysis', display_order: 1, created_at: '2024-01-01' },
  { id: '2', name: 'Technology', slug: 'technology', description: 'Technology and innovation', display_order: 2, created_at: '2024-01-01' },
  { id: '3', name: 'Sports', slug: 'sports', description: 'Sports news and updates', display_order: 3, created_at: '2024-01-01' },
  { id: '4', name: 'World', slug: 'world', description: 'International news', display_order: 4, created_at: '2024-01-01' },
  { id: '5', name: 'Entertainment', slug: 'entertainment', description: 'Entertainment and culture', display_order: 5, created_at: '2024-01-01' },
  { id: '6', name: 'Business', slug: 'business', description: 'Business and finance', display_order: 6, created_at: '2024-01-01' },
];

const mockArticles: Article[] = [
  {
    id: '1', title: 'Global Climate Summit Reaches Historic Agreement on Carbon Emissions',
    slug: 'global-climate-summit-historic-agreement',
    excerpt: 'World leaders have reached a landmark agreement to reduce carbon emissions by 50% by 2035.',
    content: '<h2>A Historic Moment</h2><p>In a groundbreaking session at the Global Climate Summit, representatives from over 190 countries unanimously agreed to a sweeping new framework aimed at reducing global carbon emissions by 50% by the year 2035.</p><h2>Key Provisions</h2><p>The framework introduces several key mechanisms including carbon pricing, renewable energy mandates, and deforestation prevention programs.</p>',
    featured_image_url: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=800&h=450&fit=crop',
    author_id: '4', category_id: '4', is_featured: true, is_breaking: false, is_opinion: false,
    is_fact_checked: true, view_count: 15420, published_at: '2026-03-14T08:00:00Z',
    updated_at: '2026-03-14T08:00:00Z', created_at: '2026-03-14T08:00:00Z',
    meta_title: null, meta_description: null, author: mockAuthors[3], category: mockCategories[3],
  },
  {
    id: '2', title: 'AI Breakthrough: New Model Achieves Human-Level Reasoning',
    slug: 'ai-breakthrough-human-level-reasoning',
    excerpt: 'A revolutionary AI model has demonstrated human-level reasoning capabilities in complex scientific research tasks.',
    content: '<h2>The Next Frontier</h2><p>Researchers from MIT, Stanford, and Oxford have jointly announced the development of an AI system that can independently formulate hypotheses and design experiments.</p>',
    featured_image_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=450&fit=crop',
    author_id: '2', category_id: '2', is_featured: false, is_breaking: true, is_opinion: false,
    is_fact_checked: true, view_count: 28930, published_at: '2026-03-14T06:00:00Z',
    updated_at: '2026-03-14T06:00:00Z', created_at: '2026-03-14T06:00:00Z',
    meta_title: null, meta_description: null, author: mockAuthors[1], category: mockCategories[1],
  },
  {
    id: '3', title: 'Championship Finals Set: Underdogs Stun Favorites',
    slug: 'championship-finals-underdogs-stun',
    excerpt: 'In one of the most thrilling semifinal matchups in recent memory, the underdog squad pulled off a stunning upset.',
    content: '<h2>Against All Odds</h2><p>The packed stadium erupted as the final whistle blew, confirming what few had dared to predict.</p>',
    featured_image_url: 'https://images.unsplash.com/photo-1461896836934-bd45ba7e2cac?w=800&h=450&fit=crop',
    author_id: '3', category_id: '3', is_featured: false, is_breaking: false, is_opinion: false,
    is_fact_checked: false, view_count: 12340, published_at: '2026-03-13T20:00:00Z',
    updated_at: '2026-03-13T20:00:00Z', created_at: '2026-03-13T20:00:00Z',
    meta_title: null, meta_description: null, author: mockAuthors[2], category: mockCategories[2],
  },
  {
    id: '4', title: 'Senate Passes Landmark Digital Privacy Act',
    slug: 'senate-digital-privacy-act',
    excerpt: 'The Senate has passed the Digital Privacy Act, establishing new federal standards for data collection.',
    content: '<h2>A New Era for Privacy</h2><p>In a rare display of bipartisan cooperation, the Senate voted 78-22 to pass the Digital Privacy Act.</p>',
    featured_image_url: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&h=450&fit=crop',
    author_id: '1', category_id: '1', is_featured: false, is_breaking: true, is_opinion: false,
    is_fact_checked: true, view_count: 9870, published_at: '2026-03-13T14:00:00Z',
    updated_at: '2026-03-13T14:00:00Z', created_at: '2026-03-13T14:00:00Z',
    meta_title: null, meta_description: null, author: mockAuthors[0], category: mockCategories[0],
  },
  {
    id: '5', title: 'Oscar-Winning Director Announces Ambitious New Film Trilogy',
    slug: 'oscar-director-new-trilogy',
    excerpt: 'Award-winning filmmaker reveals plans for an epic three-part saga exploring AI through family drama.',
    content: '<h2>A Vision for Cinema</h2><p>Fresh off their Academy Award win, the acclaimed director has announced an ambitious new project.</p>',
    featured_image_url: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&h=450&fit=crop',
    author_id: '5', category_id: '5', is_featured: false, is_breaking: false, is_opinion: false,
    is_fact_checked: false, view_count: 7650, published_at: '2026-03-13T10:00:00Z',
    updated_at: '2026-03-13T10:00:00Z', created_at: '2026-03-13T10:00:00Z',
    meta_title: null, meta_description: null, author: mockAuthors[4], category: mockCategories[4],
  },
  {
    id: '6', title: 'Quantum Computing Startup Raises $2B in Record Funding',
    slug: 'quantum-computing-startup-funding',
    excerpt: 'A Silicon Valley quantum computing startup has secured $2 billion in Series C funding.',
    content: '<h2>Breaking Records</h2><p>The funding round values the company at over $15 billion and will accelerate development of their room-temperature quantum processor.</p>',
    featured_image_url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&h=450&fit=crop',
    author_id: '2', category_id: '2', is_featured: false, is_breaking: false, is_opinion: false,
    is_fact_checked: true, view_count: 18200, published_at: '2026-03-12T16:00:00Z',
    updated_at: '2026-03-12T16:00:00Z', created_at: '2026-03-12T16:00:00Z',
    meta_title: null, meta_description: null, author: mockAuthors[1], category: mockCategories[1],
  },
  {
    id: '7', title: 'EU Proposes Bold New Economic Integration Framework',
    slug: 'eu-economic-integration-framework',
    excerpt: 'The European Commission has unveiled a plan for deeper economic integration including a unified digital currency.',
    content: '<h2>A Unified Vision</h2><p>The proposal represents the most significant step toward deeper EU integration since the adoption of the euro.</p>',
    featured_image_url: 'https://images.unsplash.com/photo-1519922639192-e73293ca430e?w=800&h=450&fit=crop',
    author_id: '4', category_id: '4', is_featured: false, is_breaking: false, is_opinion: false,
    is_fact_checked: true, view_count: 6540, published_at: '2026-03-12T12:00:00Z',
    updated_at: '2026-03-12T12:00:00Z', created_at: '2026-03-12T12:00:00Z',
    meta_title: null, meta_description: null, author: mockAuthors[3], category: mockCategories[3],
  },
  {
    id: '8', title: 'The Future of Remote Work: Hybrid Models Are Here to Stay',
    slug: 'future-remote-work-hybrid',
    excerpt: 'Data shows that hybrid work models are not just surviving — they\'re thriving and reshaping corporate culture.',
    content: '<h2>The New Normal</h2><p>Three years after the pandemic, hybrid work models have become the dominant arrangement for knowledge workers.</p>',
    featured_image_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=450&fit=crop',
    author_id: '2', category_id: '6', is_featured: false, is_breaking: false, is_opinion: true,
    is_fact_checked: false, view_count: 11200, published_at: '2026-03-12T08:00:00Z',
    updated_at: '2026-03-12T08:00:00Z', created_at: '2026-03-12T08:00:00Z',
    meta_title: null, meta_description: null, author: mockAuthors[1], category: mockCategories[5],
  },
  {
    id: '9', title: 'Major League Draft Shakes Up Team Rosters',
    slug: 'major-league-draft-new-season',
    excerpt: 'The annual draft has produced several surprise picks that could dramatically alter the competitive landscape.',
    content: '<h2>Draft Day Drama</h2><p>In one of the most eventful drafts in league history, several teams made unexpected moves.</p>',
    featured_image_url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=450&fit=crop',
    author_id: '3', category_id: '3', is_featured: false, is_breaking: false, is_opinion: false,
    is_fact_checked: false, view_count: 8900, published_at: '2026-03-11T18:00:00Z',
    updated_at: '2026-03-11T18:00:00Z', created_at: '2026-03-11T18:00:00Z',
    meta_title: null, meta_description: null, author: mockAuthors[2], category: mockCategories[2],
  },
  {
    id: '10', title: 'Streaming Wars Heat Up: Major Platform Announces Free Tier',
    slug: 'streaming-wars-free-tier',
    excerpt: 'One of the largest streaming platforms has announced a completely free, ad-supported viewing tier.',
    content: '<h2>Disrupting the Market</h2><p>The announcement sent shockwaves through the entertainment industry.</p>',
    featured_image_url: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=800&h=450&fit=crop',
    author_id: '5', category_id: '5', is_featured: false, is_breaking: false, is_opinion: false,
    is_fact_checked: false, view_count: 14300, published_at: '2026-03-11T14:00:00Z',
    updated_at: '2026-03-11T14:00:00Z', created_at: '2026-03-11T14:00:00Z',
    meta_title: null, meta_description: null, author: mockAuthors[4], category: mockCategories[4],
  },
  {
    id: '11', title: 'Infrastructure Bill Allocates $200B for Rural Broadband',
    slug: 'infrastructure-bill-rural-broadband',
    excerpt: 'A major infrastructure bill includes unprecedented funding to bring high-speed internet to rural communities.',
    content: '<h2>Connecting America</h2><p>The bipartisan infrastructure bill represents the largest single investment in rural broadband infrastructure.</p>',
    featured_image_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=450&fit=crop',
    author_id: '1', category_id: '1', is_featured: false, is_breaking: false, is_opinion: false,
    is_fact_checked: true, view_count: 5430, published_at: '2026-03-11T10:00:00Z',
    updated_at: '2026-03-11T10:00:00Z', created_at: '2026-03-11T10:00:00Z',
    meta_title: null, meta_description: null, author: mockAuthors[0], category: mockCategories[0],
  },
  {
    id: '12', title: 'EV Sales Surpass Gas Cars for First Time in Major Market',
    slug: 'ev-sales-surpass-gas-cars',
    excerpt: 'For the first time, electric vehicle sales have overtaken gas-powered car sales in a major automotive market.',
    content: '<h2>A Tipping Point</h2><p>The milestone marks a significant turning point in the global transition to electric mobility.</p>',
    featured_image_url: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&h=450&fit=crop',
    author_id: '2', category_id: '2', is_featured: false, is_breaking: false, is_opinion: false,
    is_fact_checked: true, view_count: 22100, published_at: '2026-03-10T12:00:00Z',
    updated_at: '2026-03-10T12:00:00Z', created_at: '2026-03-10T12:00:00Z',
    meta_title: null, meta_description: null, author: mockAuthors[1], category: mockCategories[1],
  },
];

const mockTags: Tag[] = [
  { id: '1', name: 'Climate', slug: 'climate', created_at: '2024-01-01' },
  { id: '2', name: 'AI', slug: 'ai', created_at: '2024-01-01' },
  { id: '3', name: 'Privacy', slug: 'privacy', created_at: '2024-01-01' },
  { id: '4', name: 'Sports', slug: 'sports', created_at: '2024-01-01' },
  { id: '5', name: 'Film', slug: 'film', created_at: '2024-01-01' },
  { id: '6', name: 'Quantum', slug: 'quantum', created_at: '2024-01-01' },
  { id: '7', name: 'EU', slug: 'eu', created_at: '2024-01-01' },
  { id: '8', name: 'Remote Work', slug: 'remote-work', created_at: '2024-01-01' },
  { id: '9', name: 'Streaming', slug: 'streaming', created_at: '2024-01-01' },
  { id: '10', name: 'EV', slug: 'ev', created_at: '2024-01-01' },
  { id: '11', name: 'Broadband', slug: 'broadband', created_at: '2024-01-01' },
  { id: '12', name: 'Technology', slug: 'technology', created_at: '2024-01-01' },
];

const mockComments: Comment[] = [
  {
    id: '1', article_id: '1', author_name: 'John Smith', author_email: 'john@email.com',
    content: 'This is a historic moment for climate action.',
    is_approved: true, created_at: '2026-03-14T10:00:00Z', likes: 24,
    replies: [{
      id: '1a', article_id: '1', author_name: 'Maria Garcia', author_email: 'maria@email.com',
      content: 'Agreed! The enforcement mechanisms will be key.',
      is_approved: true, created_at: '2026-03-14T11:00:00Z', likes: 8,
    }],
  },
  {
    id: '2', article_id: '1', author_name: 'Alex Johnson', author_email: 'alex@email.com',
    content: 'I remain skeptical about the timeline.',
    is_approved: true, created_at: '2026-03-14T12:00:00Z', likes: 12,
  },
  {
    id: '3', article_id: '2', author_name: 'Dr. Robert Lee', author_email: 'robert@email.com',
    content: 'As a researcher, this represents a genuine leap forward.',
    is_approved: true, created_at: '2026-03-14T09:00:00Z', likes: 45,
  },
];

// ============================================================
// API Functions — try Supabase first, fall back to mock data
// ============================================================

export async function getCategories(): Promise<Category[]> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    if (error) throw error;
    if (data && data.length > 0) return data.map(mapCategory);
  } catch {
    // fall through to mock
  }
  return mockCategories;
}

export async function getFeaturedArticle(): Promise<Article | null> {
  try {
    // First try to get a featured article
    const { data: featuredData, error: featuredError } = await supabase
      .from('articles')
      .select('*')
      .eq('status', 'published')
      .eq('featured', true)
      .order('published_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!featuredError && featuredData) return mapArticle(featuredData);

    // Fallback to most viewed
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('status', 'published')
      .order('views', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (data) return mapArticle(data);
  } catch {
    // fall through
  }
  return mockArticles.find(a => a.is_featured) || mockArticles[0];
}

export async function getBreakingNews(): Promise<Article[]> {
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(5);
    if (error) throw error;
    if (data && data.length > 0) return data.map(mapArticle);
  } catch {
    // fall through
  }
  return mockArticles.filter(a => a.is_breaking);
}

export async function getTrendingArticles(limit = 4): Promise<Article[]> {
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('status', 'published')
      .order('views', { ascending: false })
      .limit(limit);
    if (error) throw error;
    if (data && data.length > 0) return data.map(mapArticle);
  } catch {
    // fall through
  }
  return [...mockArticles].sort((a, b) => b.view_count - a.view_count).slice(0, limit);
}

export async function getArticlesByCategory(categorySlug: string, limit = 6): Promise<Article[]> {
  try {
    // Map slug to category name for Supabase query
    const catName = categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1);
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('status', 'published')
      .ilike('category', catName)
      .order('published_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    if (data && data.length > 0) return data.map(mapArticle);
  } catch {
    // fall through
  }
  return mockArticles.filter(a => a.category?.slug === categorySlug).slice(0, limit);
}

export async function getRecentArticles(limit = 10): Promise<Article[]> {
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    if (data && data.length > 0) return data.map(mapArticle);
  } catch {
    // fall through
  }
  return [...mockArticles].sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()).slice(0, limit);
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();
    if (error) throw error;
    if (data) return mapArticle(data);
  } catch {
    // fall through
  }
  return mockArticles.find(a => a.slug === slug) || null;
}

export async function getArticleTags(articleId: string): Promise<Tag[]> {
  // Tags are stored as TEXT[] on the article row in Supabase
  // If we already have the article, tags come with it
  const index = parseInt(articleId) % mockTags.length;
  return mockTags.slice(index, index + 3);
}

export async function getRelatedArticles(articleId: string, categoryId: string, limit = 3): Promise<Article[]> {
  try {
    // Try to find the source article's category name
    const { data: srcArticle } = await supabase
      .from('articles')
      .select('category')
      .eq('id', articleId)
      .maybeSingle();

    if (srcArticle) {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('status', 'published')
        .eq('category', srcArticle.category)
        .neq('id', articleId)
        .limit(limit);
      if (error) throw error;
      if (data && data.length > 0) return data.map(mapArticle);
    }
  } catch {
    // fall through
  }
  return mockArticles.filter(a => a.category_id === categoryId && a.id !== articleId).slice(0, limit);
}

export async function getArticleComments(articleSlug: string): Promise<Comment[]> {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('article_slug', articleSlug)
      .is('parent_id', null)
      .order('created_at', { ascending: true });
    if (error) throw error;
    if (data && data.length > 0) {
      // Fetch replies
      const commentIds = data.map(c => c.id);
      const { data: replies } = await supabase
        .from('comments')
        .select('*')
        .in('parent_id', commentIds)
        .order('created_at', { ascending: true });

      return data.map(c => ({
        id: c.id,
        article_id: c.article_slug,
        author_name: c.user_name,
        author_email: '',
        content: c.body,
        is_approved: true,
        created_at: c.created_at,
        likes: c.likes || 0,
        replies: (replies || [])
          .filter(r => r.parent_id === c.id)
          .map(r => ({
            id: r.id,
            article_id: r.article_slug,
            author_name: r.user_name,
            author_email: '',
            content: r.body,
            is_approved: true,
            created_at: r.created_at,
            likes: r.likes || 0,
          })),
      }));
    }
  } catch {
    // fall through
  }
  // Use article id for mock fallback
  return mockComments.filter(c => c.article_id === articleSlug);
}

export async function incrementArticleViews(slug: string): Promise<void> {
  try {
    await supabase.rpc('increment_views', { article_slug: slug });
  } catch {
    // silently fail
  }
}

export async function getMostPopularArticles(limit = 5): Promise<Article[]> {
  return getTrendingArticles(limit);
}

export async function getAllTags(): Promise<Tag[]> {
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('tags')
      .eq('status', 'published');
    if (error) throw error;
    if (data && data.length > 0) {
      const tagSet = new Map<string, number>();
      data.forEach(row => {
        (row.tags || []).forEach((t: string) => {
          tagSet.set(t, (tagSet.get(t) || 0) + 1);
        });
      });
      return Array.from(tagSet.entries()).map(([name], i) => ({
        id: `tag-${i}`,
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        created_at: new Date().toISOString(),
      }));
    }
  } catch {
    // fall through
  }
  return mockTags;
}

export async function searchArticles(query: string): Promise<Article[]> {
  if (!query.trim()) return [];
  try {
    // Try RPC full-text search first
    const { data: rpcData, error: rpcError } = await supabase.rpc('search_articles', {
      search_query: query,
      limit_count: 20,
      offset_count: 0,
    });
    if (!rpcError && rpcData && rpcData.length > 0) {
      return rpcData.map((row: any) => mapArticle(row));
    }

    // Fallback to ILIKE search
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('status', 'published')
      .or(`title.ilike.%${query}%,excerpt.ilike.%${query}%,category.ilike.%${query}%`)
      .order('published_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    if (data && data.length > 0) return data.map(mapArticle);
  } catch {
    // fall through
  }
  const q = query.toLowerCase();
  return mockArticles.filter(a =>
    a.title.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q)
  );
}

export async function addComment(
  articleSlug: string,
  body: string,
  userId: string,
  userName: string,
  userAvatar?: string,
  parentId?: string,
): Promise<Comment | null> {
  try {
    const { data, error } = await supabase
      .from('comments')
      .insert({
        article_slug: articleSlug,
        user_id: userId,
        user_name: userName,
        user_avatar: userAvatar || null,
        body,
        parent_id: parentId || null,
      })
      .select()
      .single();
    if (error) throw error;
    return {
      id: data.id,
      article_id: data.article_slug,
      author_name: data.user_name,
      author_email: '',
      content: data.body,
      is_approved: true,
      created_at: data.created_at,
      likes: 0,
    };
  } catch (err) {
    console.error('Error adding comment:', err);
    return null;
  }
}

export async function deleteComment(commentId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    return !error;
  } catch {
    return false;
  }
}

export async function toggleCommentLike(commentId: string, userId: string): Promise<boolean> {
  try {
    const { data: existing } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      await supabase.from('comment_likes').delete().eq('id', existing.id);
      await supabase.from('comments').update({ likes: supabase.rpc ? undefined : 0 }).eq('id', commentId);
      return false;
    } else {
      await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: userId });
      return true;
    }
  } catch {
    return false;
  }
}

// Admin functions
export async function getAllArticles(): Promise<Article[]> {
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    if (data) return data.map(mapArticle);
  } catch {
    // fall through
  }
  return mockArticles;
}

export async function createArticle(article: {
  slug: string; title: string; excerpt: string; body: string;
  thumbnail: string; category: string; tags: string[];
  author_name: string; author_avatar: string; status: string;
}): Promise<Article | null> {
  try {
    const { data, error } = await supabase
      .from('articles')
      .insert({
        ...article,
        published_at: article.status === 'published' ? new Date().toISOString() : null,
      })
      .select()
      .single();
    if (error) throw error;
    return mapArticle(data);
  } catch (err) {
    console.error('Error creating article:', err);
    return null;
  }
}

export async function updateArticle(id: string, updates: Record<string, any>): Promise<boolean> {
  try {
    if (updates.status === 'published' && !updates.published_at) {
      updates.published_at = new Date().toISOString();
    }
    const { error } = await supabase.from('articles').update(updates).eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

export async function deleteArticle(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('articles').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

export { mockArticles, mockCategories, mockAuthors, mockTags };

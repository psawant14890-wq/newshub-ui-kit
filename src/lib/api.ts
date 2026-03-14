import type { Article, Category, Tag, Comment, Author } from '../types';

// Mock data for development - replace with Supabase calls when connected

const mockAuthors: Author[] = [
  {
    id: '1', name: 'Sarah Chen', slug: 'sarah-chen',
    bio: 'Senior political correspondent covering Washington D.C.',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
    twitter_handle: '@sarahchen', email: 'sarah@newshub.com', created_at: '2024-01-01'
  },
  {
    id: '2', name: 'James Rodriguez', slug: 'james-rodriguez',
    bio: 'Tech editor and Silicon Valley reporter.',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=james',
    twitter_handle: '@jamesrod', email: 'james@newshub.com', created_at: '2024-01-01'
  },
  {
    id: '3', name: 'Emily Park', slug: 'emily-park',
    bio: 'Sports analyst and columnist.',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emily',
    twitter_handle: '@emilypark', email: 'emily@newshub.com', created_at: '2024-01-01'
  },
  {
    id: '4', name: 'Michael Torres', slug: 'michael-torres',
    bio: 'International affairs correspondent.',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=michael',
    twitter_handle: '@mtorres', email: 'michael@newshub.com', created_at: '2024-01-01'
  },
  {
    id: '5', name: 'Lisa Wang', slug: 'lisa-wang',
    bio: 'Entertainment and culture writer.',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisa',
    twitter_handle: '@lisawang', email: 'lisa@newshub.com', created_at: '2024-01-01'
  },
];

const mockCategories: Category[] = [
  { id: '1', name: 'Politics', slug: 'politics', description: 'Political news and analysis', display_order: 1, created_at: '2024-01-01' },
  { id: '2', name: 'Tech', slug: 'tech', description: 'Technology and innovation', display_order: 2, created_at: '2024-01-01' },
  { id: '3', name: 'Sports', slug: 'sports', description: 'Sports news and updates', display_order: 3, created_at: '2024-01-01' },
  { id: '4', name: 'World', slug: 'world', description: 'International news', display_order: 4, created_at: '2024-01-01' },
  { id: '5', name: 'Entertainment', slug: 'entertainment', description: 'Entertainment and culture', display_order: 5, created_at: '2024-01-01' },
  { id: '6', name: 'Business', slug: 'business', description: 'Business and finance', display_order: 6, created_at: '2024-01-01' },
];

const mockArticles: Article[] = [
  {
    id: '1', title: 'Global Climate Summit Reaches Historic Agreement on Carbon Emissions',
    slug: 'global-climate-summit-historic-agreement',
    excerpt: 'World leaders have reached a landmark agreement to reduce carbon emissions by 50% by 2035, marking the most ambitious climate commitment in history.',
    content: '<h2>A Historic Moment</h2><p>In a groundbreaking session at the Global Climate Summit, representatives from over 190 countries unanimously agreed to a sweeping new framework aimed at reducing global carbon emissions by 50% by the year 2035.</p><p>The agreement, which has been hailed as the most ambitious climate commitment in history, includes binding targets for industrial nations and a $500 billion fund to support developing countries in their green transition.</p><h2>Key Provisions</h2><p>The framework introduces several key mechanisms including carbon pricing, renewable energy mandates, and deforestation prevention programs. Critics, however, argue that enforcement remains a challenge.</p><p>Environmental activists have cautiously welcomed the deal while pushing for even more aggressive timelines.</p>',
    featured_image_url: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=800&h=450&fit=crop',
    author_id: '4', category_id: '4', is_featured: true, is_breaking: false, is_opinion: false,
    is_fact_checked: true, view_count: 15420, published_at: '2026-03-14T08:00:00Z',
    updated_at: '2026-03-14T08:00:00Z', created_at: '2026-03-14T08:00:00Z',
    meta_title: null, meta_description: null,
    author: mockAuthors[3], category: mockCategories[3]
  },
  {
    id: '2', title: 'AI Breakthrough: New Model Achieves Human-Level Reasoning in Scientific Research',
    slug: 'ai-breakthrough-human-level-reasoning',
    excerpt: 'A revolutionary AI model developed by a consortium of universities has demonstrated human-level reasoning capabilities in complex scientific research tasks.',
    content: '<h2>The Next Frontier</h2><p>Researchers from MIT, Stanford, and Oxford have jointly announced the development of an AI system that can independently formulate hypotheses, design experiments, and interpret results at a level comparable to experienced human scientists.</p><p>The model, named ScienceGPT-7, has already contributed to three peer-reviewed papers in molecular biology and materials science.</p>',
    featured_image_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=450&fit=crop',
    author_id: '2', category_id: '2', is_featured: false, is_breaking: true, is_opinion: false,
    is_fact_checked: true, view_count: 28930, published_at: '2026-03-14T06:00:00Z',
    updated_at: '2026-03-14T06:00:00Z', created_at: '2026-03-14T06:00:00Z',
    meta_title: null, meta_description: null,
    author: mockAuthors[1], category: mockCategories[1]
  },
  {
    id: '3', title: 'Championship Finals Set: Underdogs Stun Favorites in Dramatic Semifinal',
    slug: 'championship-finals-underdogs-stun',
    excerpt: 'In one of the most thrilling semifinal matchups in recent memory, the underdog squad pulled off a stunning upset to book their place in the championship finals.',
    content: '<h2>Against All Odds</h2><p>The packed stadium erupted as the final whistle blew, confirming what few had dared to predict. The underdogs had done it – defeating the heavily favored champions in a dramatic semifinal that will be talked about for years to come.</p>',
    featured_image_url: 'https://images.unsplash.com/photo-1461896836934-bd45ba7e2cac?w=800&h=450&fit=crop',
    author_id: '3', category_id: '3', is_featured: false, is_breaking: false, is_opinion: false,
    is_fact_checked: false, view_count: 12340, published_at: '2026-03-13T20:00:00Z',
    updated_at: '2026-03-13T20:00:00Z', created_at: '2026-03-13T20:00:00Z',
    meta_title: null, meta_description: null,
    author: mockAuthors[2], category: mockCategories[2]
  },
  {
    id: '4', title: 'Senate Passes Landmark Digital Privacy Act with Bipartisan Support',
    slug: 'senate-digital-privacy-act',
    excerpt: 'The U.S. Senate has passed the comprehensive Digital Privacy Act, establishing new federal standards for how companies collect and use personal data.',
    content: '<h2>A New Era for Privacy</h2><p>In a rare display of bipartisan cooperation, the Senate voted 78-22 to pass the Digital Privacy Act, the most comprehensive federal privacy legislation in decades.</p><p>The bill establishes a federal standard for data collection, gives consumers the right to delete their data, and creates a new enforcement division within the FTC.</p>',
    featured_image_url: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&h=450&fit=crop',
    author_id: '1', category_id: '1', is_featured: false, is_breaking: true, is_opinion: false,
    is_fact_checked: true, view_count: 9870, published_at: '2026-03-13T14:00:00Z',
    updated_at: '2026-03-13T14:00:00Z', created_at: '2026-03-13T14:00:00Z',
    meta_title: null, meta_description: null,
    author: mockAuthors[0], category: mockCategories[0]
  },
  {
    id: '5', title: 'Oscar-Winning Director Announces Ambitious New Film Trilogy',
    slug: 'oscar-director-new-trilogy',
    excerpt: 'Award-winning filmmaker reveals plans for an epic three-part saga exploring humanity\'s relationship with artificial intelligence through the lens of a family drama.',
    content: '<h2>A Vision for Cinema</h2><p>Fresh off their Academy Award win, the acclaimed director has announced an ambitious new project that promises to push the boundaries of cinematic storytelling.</p>',
    featured_image_url: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&h=450&fit=crop',
    author_id: '5', category_id: '5', is_featured: false, is_breaking: false, is_opinion: false,
    is_fact_checked: false, view_count: 7650, published_at: '2026-03-13T10:00:00Z',
    updated_at: '2026-03-13T10:00:00Z', created_at: '2026-03-13T10:00:00Z',
    meta_title: null, meta_description: null,
    author: mockAuthors[4], category: mockCategories[4]
  },
  {
    id: '6', title: 'Quantum Computing Startup Raises $2B in Record-Breaking Funding Round',
    slug: 'quantum-computing-startup-funding',
    excerpt: 'A Silicon Valley quantum computing startup has secured $2 billion in Series C funding, the largest ever for a quantum technology company.',
    content: '<h2>Breaking Records</h2><p>The funding round, led by prominent venture capital firms, values the company at over $15 billion and will accelerate development of their room-temperature quantum processor.</p>',
    featured_image_url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&h=450&fit=crop',
    author_id: '2', category_id: '2', is_featured: false, is_breaking: false, is_opinion: false,
    is_fact_checked: true, view_count: 18200, published_at: '2026-03-12T16:00:00Z',
    updated_at: '2026-03-12T16:00:00Z', created_at: '2026-03-12T16:00:00Z',
    meta_title: null, meta_description: null,
    author: mockAuthors[1], category: mockCategories[1]
  },
  {
    id: '7', title: 'European Union Proposes Bold New Economic Integration Framework',
    slug: 'eu-economic-integration-framework',
    excerpt: 'The European Commission has unveiled an ambitious plan to deepen economic integration among member states, including a unified digital currency.',
    content: '<h2>A Unified Vision</h2><p>The proposal represents the most significant step toward deeper EU integration since the adoption of the euro, with plans for a unified digital payment system and harmonized corporate tax rates.</p>',
    featured_image_url: 'https://images.unsplash.com/photo-1519922639192-e73293ca430e?w=800&h=450&fit=crop',
    author_id: '4', category_id: '4', is_featured: false, is_breaking: false, is_opinion: false,
    is_fact_checked: true, view_count: 6540, published_at: '2026-03-12T12:00:00Z',
    updated_at: '2026-03-12T12:00:00Z', created_at: '2026-03-12T12:00:00Z',
    meta_title: null, meta_description: null,
    author: mockAuthors[3], category: mockCategories[3]
  },
  {
    id: '8', title: 'The Future of Remote Work: Why Hybrid Models Are Here to Stay',
    slug: 'future-remote-work-hybrid',
    excerpt: 'As companies navigate the post-pandemic landscape, data shows that hybrid work models are not just surviving — they\'re thriving and reshaping corporate culture.',
    content: '<h2>The New Normal</h2><p>Three years after the pandemic forced a global experiment in remote work, the verdict is in: hybrid work models combining remote and in-office days have become the dominant arrangement for knowledge workers.</p>',
    featured_image_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=450&fit=crop',
    author_id: '2', category_id: '6', is_featured: false, is_breaking: false, is_opinion: true,
    is_fact_checked: false, view_count: 11200, published_at: '2026-03-12T08:00:00Z',
    updated_at: '2026-03-12T08:00:00Z', created_at: '2026-03-12T08:00:00Z',
    meta_title: null, meta_description: null,
    author: mockAuthors[1], category: mockCategories[5]
  },
  {
    id: '9', title: 'Major League Draft Shakes Up Team Rosters Ahead of New Season',
    slug: 'major-league-draft-new-season',
    excerpt: 'The annual draft has produced several surprise picks that could dramatically alter the competitive landscape heading into the upcoming season.',
    content: '<h2>Draft Day Drama</h2><p>In one of the most eventful drafts in league history, several teams made unexpected moves that analysts say could reshape the balance of power for years to come.</p>',
    featured_image_url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=450&fit=crop',
    author_id: '3', category_id: '3', is_featured: false, is_breaking: false, is_opinion: false,
    is_fact_checked: false, view_count: 8900, published_at: '2026-03-11T18:00:00Z',
    updated_at: '2026-03-11T18:00:00Z', created_at: '2026-03-11T18:00:00Z',
    meta_title: null, meta_description: null,
    author: mockAuthors[2], category: mockCategories[2]
  },
  {
    id: '10', title: 'Streaming Wars Heat Up: Major Platform Announces Free Ad-Supported Tier',
    slug: 'streaming-wars-free-tier',
    excerpt: 'In a bold move to capture market share, one of the largest streaming platforms has announced a completely free, ad-supported viewing tier.',
    content: '<h2>Disrupting the Market</h2><p>The announcement sent shockwaves through the entertainment industry, with competitors scrambling to respond to what analysts are calling the most disruptive move in the streaming wars to date.</p>',
    featured_image_url: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=800&h=450&fit=crop',
    author_id: '5', category_id: '5', is_featured: false, is_breaking: false, is_opinion: false,
    is_fact_checked: false, view_count: 14300, published_at: '2026-03-11T14:00:00Z',
    updated_at: '2026-03-11T14:00:00Z', created_at: '2026-03-11T14:00:00Z',
    meta_title: null, meta_description: null,
    author: mockAuthors[4], category: mockCategories[4]
  },
  {
    id: '11', title: 'Infrastructure Bill Allocates $200B for Rural Broadband Expansion',
    slug: 'infrastructure-bill-rural-broadband',
    excerpt: 'A major infrastructure spending bill includes unprecedented funding to bring high-speed internet access to underserved rural communities across the nation.',
    content: '<h2>Connecting America</h2><p>The bipartisan infrastructure bill represents the largest single investment in rural broadband infrastructure in American history.</p>',
    featured_image_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=450&fit=crop',
    author_id: '1', category_id: '1', is_featured: false, is_breaking: false, is_opinion: false,
    is_fact_checked: true, view_count: 5430, published_at: '2026-03-11T10:00:00Z',
    updated_at: '2026-03-11T10:00:00Z', created_at: '2026-03-11T10:00:00Z',
    meta_title: null, meta_description: null,
    author: mockAuthors[0], category: mockCategories[0]
  },
  {
    id: '12', title: 'Electric Vehicle Sales Surpass Gas Cars for First Time in Major Market',
    slug: 'ev-sales-surpass-gas-cars',
    excerpt: 'For the first time in automotive history, electric vehicle sales have overtaken traditional gasoline-powered car sales in a major automotive market.',
    content: '<h2>A Tipping Point</h2><p>The milestone marks a significant turning point in the global transition to electric mobility, with implications for the oil industry, power grid infrastructure, and urban planning.</p>',
    featured_image_url: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&h=450&fit=crop',
    author_id: '2', category_id: '2', is_featured: false, is_breaking: false, is_opinion: false,
    is_fact_checked: true, view_count: 22100, published_at: '2026-03-10T12:00:00Z',
    updated_at: '2026-03-10T12:00:00Z', created_at: '2026-03-10T12:00:00Z',
    meta_title: null, meta_description: null,
    author: mockAuthors[1], category: mockCategories[1]
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
    content: 'This is a historic moment for climate action. I hope nations follow through on their commitments.',
    is_approved: true, created_at: '2026-03-14T10:00:00Z', likes: 24, replies: [
      {
        id: '1a', article_id: '1', author_name: 'Maria Garcia', author_email: 'maria@email.com',
        content: 'Agreed! The enforcement mechanisms will be key to making this work.',
        is_approved: true, created_at: '2026-03-14T11:00:00Z', likes: 8
      }
    ]
  },
  {
    id: '2', article_id: '1', author_name: 'Alex Johnson', author_email: 'alex@email.com',
    content: 'I remain skeptical about the timeline. Previous agreements have fallen short.',
    is_approved: true, created_at: '2026-03-14T12:00:00Z', likes: 12
  },
  {
    id: '3', article_id: '2', author_name: 'Dr. Robert Lee', author_email: 'robert@email.com',
    content: 'As a researcher in the field, this represents a genuine leap forward. The implications are enormous.',
    is_approved: true, created_at: '2026-03-14T09:00:00Z', likes: 45
  },
];

// Simulate async delay
const delay = (ms: number = 200) => new Promise(resolve => setTimeout(resolve, ms));

export async function getCategories(): Promise<Category[]> {
  await delay();
  return mockCategories;
}

export async function getFeaturedArticle(): Promise<Article | null> {
  await delay();
  return mockArticles.find(a => a.is_featured) || null;
}

export async function getBreakingNews(): Promise<Article[]> {
  await delay();
  return mockArticles.filter(a => a.is_breaking);
}

export async function getTrendingArticles(limit = 4): Promise<Article[]> {
  await delay();
  return [...mockArticles].sort((a, b) => b.view_count - a.view_count).slice(0, limit);
}

export async function getArticlesByCategory(categorySlug: string, limit = 6): Promise<Article[]> {
  await delay();
  return mockArticles.filter(a => a.category?.slug === categorySlug).slice(0, limit);
}

export async function getRecentArticles(limit = 10): Promise<Article[]> {
  await delay();
  return [...mockArticles]
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
    .slice(0, limit);
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  await delay();
  return mockArticles.find(a => a.slug === slug) || null;
}

export async function getArticleTags(articleId: string): Promise<Tag[]> {
  await delay();
  // Return 2-3 random tags per article
  const index = parseInt(articleId) % mockTags.length;
  return mockTags.slice(index, index + 3);
}

export async function getRelatedArticles(articleId: string, categoryId: string, limit = 3): Promise<Article[]> {
  await delay();
  return mockArticles
    .filter(a => a.category_id === categoryId && a.id !== articleId)
    .slice(0, limit);
}

export async function getArticleComments(articleId: string): Promise<Comment[]> {
  await delay();
  return mockComments.filter(c => c.article_id === articleId);
}

export async function incrementArticleViews(slug: string): Promise<void> {
  // No-op in mock
}

export async function getMostPopularArticles(limit = 5): Promise<Article[]> {
  await delay();
  return [...mockArticles].sort((a, b) => b.view_count - a.view_count).slice(0, limit);
}

export async function getAllTags(): Promise<Tag[]> {
  await delay();
  return mockTags;
}

export { mockArticles, mockCategories, mockAuthors, mockTags };

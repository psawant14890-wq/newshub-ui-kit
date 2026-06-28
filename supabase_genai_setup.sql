-- ============================================================
-- NewsHub GenAI Upgrade: pgvector + Semantic Search + RAG
-- Run this ENTIRE file in your Supabase SQL Editor.
-- Safe to re-run (uses IF NOT EXISTS / OR REPLACE).
-- ============================================================

-- 1. Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add embedding column to articles (1536 dims = OpenAI text-embedding-3-small)
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- HNSW index for fast cosine-distance search on articles
CREATE INDEX IF NOT EXISTS articles_embedding_idx
  ON articles USING hnsw (embedding vector_cosine_ops);

-- 3. Chunks table for RAG
CREATE TABLE IF NOT EXISTS article_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  chunk_index int NOT NULL,
  content text NOT NULL,
  embedding vector(1536),
  token_count int,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS article_chunks_embedding_idx
  ON article_chunks USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS article_chunks_article_id_idx
  ON article_chunks (article_id);

-- Grants (required for Supabase Data API)
GRANT SELECT ON public.article_chunks TO anon, authenticated;
GRANT ALL ON public.article_chunks TO service_role;

ALTER TABLE public.article_chunks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Chunks are publicly readable" ON public.article_chunks;
CREATE POLICY "Chunks are publicly readable"
  ON public.article_chunks FOR SELECT
  USING (true);

-- 4. Semantic search RPC with two-stage rerank
-- Stage 1: top 20 by cosine similarity. Stage 2: rerank with similarity + recency + popularity.
CREATE OR REPLACE FUNCTION match_articles(
  query_embedding vector(1536),
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  title text,
  slug text,
  excerpt text,
  thumbnail text,
  category text,
  author_name text,
  published_at timestamptz,
  views int,
  similarity float,
  final_score float
)
LANGUAGE sql STABLE
AS $$
  WITH candidates AS (
    SELECT
      a.id, a.title, a.slug, a.excerpt, a.thumbnail, a.category,
      a.author_name, a.published_at, COALESCE(a.views, 0) AS views,
      1 - (a.embedding <=> query_embedding) AS similarity
    FROM articles a
    WHERE a.embedding IS NOT NULL
      AND COALESCE(a.status, 'published') = 'published'
    ORDER BY a.embedding <=> query_embedding
    LIMIT 20
  )
  SELECT
    id, title, slug, excerpt, thumbnail, category, author_name,
    published_at, views, similarity,
    (0.60 * similarity)
    + (0.25 * EXP(-EXTRACT(EPOCH FROM (NOW() - published_at)) / (60.0*60*24*14)))
    + (0.15 * LEAST(1.0, LN(views + 1) / LN(10000))) AS final_score
  FROM candidates
  ORDER BY final_score DESC
  LIMIT match_count;
$$;

-- 5. RAG chunk-matching RPC
CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding vector(1536),
  match_count int DEFAULT 5
)
RETURNS TABLE (
  chunk_id uuid,
  article_id uuid,
  content text,
  similarity float,
  article_title text,
  article_slug text
)
LANGUAGE sql STABLE
AS $$
  SELECT
    c.id AS chunk_id,
    c.article_id,
    c.content,
    1 - (c.embedding <=> query_embedding) AS similarity,
    a.title AS article_title,
    a.slug AS article_slug
  FROM article_chunks c
  JOIN articles a ON a.id = c.article_id
  WHERE c.embedding IS NOT NULL
    AND COALESCE(a.status, 'published') = 'published'
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- 6. Enable Realtime on articles (for live news feed)
ALTER PUBLICATION supabase_realtime ADD TABLE articles;
-- If "already member" error appears, ignore it — it's idempotent intent.

-- ============================================================
-- POST-MIGRATION STEPS (do this in Supabase Dashboard):
-- ============================================================
-- A. Edge Function Secrets → Add:
--    LOVABLE_API_KEY = <your key from Lovable>
--
-- B. Deploy edge functions (from your local CLI):
--    supabase functions deploy embed-article --no-verify-jwt
--    supabase functions deploy semantic-search --no-verify-jwt
--    supabase functions deploy rag-qa --no-verify-jwt
--
-- C. Database Webhook (Dashboard → Database → Webhooks):
--    - Table: articles
--    - Events: INSERT, UPDATE
--    - Type: Supabase Edge Function → embed-article
--
-- D. Backfill existing articles (one-time):
--    Call POST /functions/v1/embed-article with {"backfill": true}
-- ============================================================

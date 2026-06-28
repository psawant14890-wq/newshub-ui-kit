# NewsHub GenAI Upgrade: Semantic Search + RAG Q&A + Realtime

Adds three architecturally-central capabilities so AI is no longer a side feature.

## Implementation Order

1. **SQL migrations** (run in Supabase SQL editor): pgvector, `embedding` column on `articles`, `article_chunks` table, RPCs.
2. **Secrets**: store `OPENAI_API_KEY` (or use existing `LOVABLE_API_KEY` via Gateway — recommended, no extra key needed).
3. **Edge Functions**: `embed-article` (chunk + embed on insert), `semantic-search`, `rag-qa` (SSE streaming), `realtime-broadcast`.
4. **Frontend**: upgrade `SearchBar`/`SearchPage` to call semantic-search RPC, new `AskNewsHub` component with streaming + citations, live-feed banner via Supabase Realtime.

## Recommendation: use Lovable AI Gateway, not OpenAI directly

You already have `LOVABLE_API_KEY` provisioned. The Gateway exposes OpenAI-compatible `/embeddings` and `/chat/completions` endpoints — same code shape, no separate OpenAI billing, no new secret to add. I'll use:
- `openai/text-embedding-3-small` (1536 dims) for embeddings — widely supported, cheap.
- `google/gemini-3-flash-preview` for RAG generation (streaming).

If you insist on OpenAI directly, swap the base URL + header — I'll note where.

**Important:** the prompt asks for 384-dim vectors (MiniLM). The Gateway does not host MiniLM. I'll use 1536-dim `text-embedding-3-small` instead and size the pgvector columns to match. This is the correct call — mismatched dims = runtime errors.

## Addition 1: Semantic Search

**SQL** (`supabase_genai_setup.sql`):
- `create extension vector;`
- `alter table articles add column embedding vector(1536);`
- HNSW index on `articles.embedding`.
- RPC `match_articles(query_embedding vector, match_count int)` → returns top-K with cosine similarity, joined with view_count + recency for two-stage rerank score: `0.6*similarity + 0.25*recency_decay + 0.15*log(view_count+1)`.

**Edge Function `embed-article`** (triggered by DB webhook on `articles` insert/update of `content`):
- Fetches article, generates embedding via Gateway, updates row.
- Also chunks `content` on `\n\n`, embeds each, inserts into `article_chunks`.

**Edge Function `semantic-search`**:
- Input: `{ query: string, k?: number }`.
- Embeds query → calls `match_articles` RPC → returns ranked results.

**Frontend**:
- `src/lib/api.ts` → add `semanticSearch(query)`.
- `SearchBar.tsx` + `SearchPage.tsx` → use semantic search; keep keyword fallback.

## Addition 2 (originally "3"): RAG Q&A

**SQL**:
```sql
create table article_chunks (
  id uuid primary key default gen_random_uuid(),
  article_id uuid references articles(id) on delete cascade,
  chunk_index int not null,
  content text not null,
  embedding vector(1536),
  token_count int
);
create index on article_chunks using hnsw (embedding vector_cosine_ops);
```
RPC `match_chunks(query_embedding, match_count)` → top-K chunks with article title + slug.

**Edge Function `rag-qa`** (SSE streaming):
- Embed question → `match_chunks` top-5 → build context block → stream Gemini response with strict grounding system prompt.
- If model returns the exact fallback phrase, surface it as a UI state.

**Frontend `AskNewsHub.tsx`** (new component, mounted on HomePage + standalone `/ask` route):
- Input box, streams answer token-by-token via `fetch` + `ReadableStream`.
- Skeleton while retrieving, then streams.
- Citations rendered as clickable article links below the answer.
- Hallucination-guard UI state for the fallback phrase.

## Addition 3: Realtime news feed

- Subscribe to `articles` table via Supabase Realtime on HomePage.
- New `<LiveFeedBanner />` slides in when a new published article arrives: "🔴 New story: <title> — Refresh".
- Browser push via existing `usePushNotifications` hook when permission granted.
- Existing `NotificationBell` already uses Realtime — extend the same channel pattern for the article stream.

## Files to create

- `supabase_genai_setup.sql` (migrations + RPCs, user runs in Supabase SQL editor)
- `supabase/functions/embed-article/index.ts`
- `supabase/functions/semantic-search/index.ts`
- `supabase/functions/rag-qa/index.ts`
- `supabase/functions/_shared/cors.ts`, `_shared/gateway.ts`
- `src/components/AskNewsHub.tsx`
- `src/components/LiveFeedBanner.tsx`
- `src/hooks/useRealtimeArticles.ts`
- `src/pages/AskPage.tsx`

## Files to edit

- `src/lib/api.ts` — add `semanticSearch`, `askNewsHub` (streaming).
- `src/components/SearchBar.tsx` — call semantic search.
- `src/pages/SearchPage.tsx` — semantic + filter combo.
- `src/pages/HomePage.tsx` — mount `AskNewsHub` + `LiveFeedBanner`.
- `src/App.tsx` — `/ask` route.
- `src/components/index.ts` — exports.

## Gotchas I'll handle

- **Embedding dims must match column size exactly** (1536, not 384). pgvector errors are hard-fail.
- **HNSW > IVFFlat** for our scale — no `lists` tuning, better recall, simpler.
- **Edge function cold starts** — keep `_shared` modules tiny.
- **SSE through Supabase Edge Functions** — return `ReadableStream` with `text/event-stream`, manual chunk parsing on client.
- **CORS** — all functions return `corsHeaders` on every response including errors.
- **DB webhook** for embedding trigger — you'll wire it once in Supabase dashboard (I'll give exact steps).
- **Backfill**: SQL script to embed existing articles in batches.

## After build — what the resume can/can't claim

**Can claim**: pgvector semantic search with two-stage rerank, RAG pipeline with strict grounding + citations + hallucination guard, SSE streaming, realtime feed via WebSockets, multi-stage AI architecture where removing AI breaks search and Q&A.

**Cannot claim**: custom model training, fine-tuning, self-hosted LLMs, distributed inference. It's an applied-GenAI fullstack project — which is exactly what FAANG/MNC GenAI Fullstack roles screen for.

Approve and I'll build it all in one pass.

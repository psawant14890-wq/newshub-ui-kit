// Triggered by Supabase DB webhook on articles INSERT/UPDATE.
// Embeds the article, chunks its body, embeds each chunk, stores all of it.
// Also supports {"backfill": true} to (re)embed existing articles.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { embed, embedBatch } from "../_shared/gateway.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

function chunkParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 40);
}

async function processArticle(article: {
  id: string;
  title: string;
  excerpt?: string | null;
  body?: string | null;
  content?: string | null;
}) {
  const body = article.body ?? article.content ?? "";
  const docText = `${article.title}\n\n${article.excerpt ?? ""}\n\n${body}`.slice(0, 30000);

  // 1. Article-level embedding
  const articleVec = await embed(docText);
  await supabase.from("articles").update({ embedding: articleVec }).eq("id", article.id);

  // 2. Chunk + embed
  const chunks = chunkParagraphs(body);
  await supabase.from("article_chunks").delete().eq("article_id", article.id);
  if (chunks.length === 0) return { article_id: article.id, chunks: 0 };

  const vectors = await embedBatch(chunks);
  const rows = chunks.map((content, i) => ({
    article_id: article.id,
    chunk_index: i,
    content,
    embedding: vectors[i],
    token_count: Math.ceil(content.length / 4),
  }));
  const { error } = await supabase.from("article_chunks").insert(rows);
  if (error) throw error;
  return { article_id: article.id, chunks: rows.length };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const payload = await req.json().catch(() => ({}));

    // Backfill mode
    if (payload.backfill) {
      const { data: articles } = await supabase
        .from("articles")
        .select("id, title, excerpt, body, content")
        .eq("status", "published")
        .is("embedding", null)
        .limit(50);
      const results = [];
      for (const a of articles ?? []) {
        try {
          results.push(await processArticle(a));
        } catch (e) {
          results.push({ article_id: a.id, error: String(e) });
        }
      }
      return new Response(JSON.stringify({ processed: results.length, results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Webhook mode: { type, record, old_record }
    const record = payload.record ?? payload;
    if (!record?.id) {
      return new Response(JSON.stringify({ error: "missing record.id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Skip if content unchanged on UPDATE
    if (payload.type === "UPDATE" && payload.old_record) {
      const sameBody =
        (payload.old_record.body ?? payload.old_record.content) ===
        (record.body ?? record.content);
      const sameTitle = payload.old_record.title === record.title;
      if (sameBody && sameTitle) {
        return new Response(JSON.stringify({ skipped: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const result = await processArticle(record);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("embed-article error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

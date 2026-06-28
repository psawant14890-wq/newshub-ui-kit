// RAG Q&A with strict grounding + streaming SSE response.
// Returns text/event-stream lines:
//   data: {"type":"citations","sources":[...]}
//   data: {"type":"token","content":"..."}
//   data: {"type":"done"}
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { embed, chatStream } from "../_shared/gateway.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const FALLBACK = "I don't have enough information in the current articles to answer this.";

const SYSTEM = `You are a news assistant. Answer ONLY using the provided article excerpts below.
If the excerpts do not contain enough information to answer, respond exactly with:
"${FALLBACK}"
Never use your training knowledge. Always cite which article each piece of information came from using [Article: <title>].`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { question } = await req.json();
    if (!question || typeof question !== "string") {
      return new Response(JSON.stringify({ error: "question required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Retrieve
    const qVec = await embed(question);
    const { data: chunks, error } = await supabase.rpc("match_chunks", {
      query_embedding: qVec,
      match_count: 5,
    });
    if (error) throw error;

    const sources = (chunks ?? []).map((c: {
      article_id: string;
      article_title: string;
      article_slug: string;
      similarity: number;
    }) => ({
      article_id: c.article_id,
      title: c.article_title,
      slug: c.article_slug,
      similarity: c.similarity,
    }));
    // Dedup by article
    const uniqueSources = Array.from(
      new Map(sources.map((s: { article_id: string }) => [s.article_id, s])).values(),
    );

    // 2. Build context
    const context = (chunks ?? [])
      .map((c: { article_title: string; content: string }, i: number) =>
        `[Excerpt ${i + 1} | Article: ${c.article_title}]\n${c.content}`)
      .join("\n\n---\n\n");

    const userPrompt = chunks?.length
      ? `Article excerpts:\n\n${context}\n\nQuestion: ${question}`
      : `Article excerpts:\n\n(no relevant excerpts found)\n\nQuestion: ${question}`;

    // 3. Stream completion
    const upstream = await chatStream([
      { role: "system", content: SYSTEM },
      { role: "user", content: userPrompt },
    ]);

    if (!upstream.ok || !upstream.body) {
      const txt = await upstream.text();
      throw new Error(`Chat failed ${upstream.status}: ${txt}`);
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "citations", sources: uniqueSources })}\n\n`),
        );

        const reader = upstream.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data:")) continue;
              const payload = trimmed.slice(5).trim();
              if (payload === "[DONE]") continue;
              try {
                const json = JSON.parse(payload);
                const token = json.choices?.[0]?.delta?.content;
                if (token) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: "token", content: token })}\n\n`),
                  );
                }
              } catch {
                // skip malformed
              }
            }
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
        } catch (e) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "error", message: String(e) })}\n\n`),
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (e) {
    console.error("rag-qa error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

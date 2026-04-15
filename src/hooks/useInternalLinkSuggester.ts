import { useState } from 'react';
import { generateWithGemini } from '../lib/gemini';
import { supabase } from '../lib/supabase';

interface LinkSuggestion {
  keyword: string;
  articleTitle: string;
  articleSlug: string;
}

export function useInternalLinkSuggester() {
  const [suggestions, setSuggestions] = useState<LinkSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const suggestLinks = async (body: string) => {
    setLoading(true);
    try {
      const { data: articles } = await supabase
        .from('articles')
        .select('title, slug')
        .eq('status', 'published')
        .limit(50);

      if (!articles || articles.length === 0) {
        setSuggestions([]);
        return [];
      }

      const articleList = articles.map(a => `"${a.title}" (slug: ${a.slug})`).join('\n');
      const result = await generateWithGemini(
        `Given this article body (first 1000 chars): "${body.slice(0, 1000)}"\n\nAnd these existing articles:\n${articleList}\n\nFind keywords in the body that match existing article topics. Return ONLY a JSON array:\n[{"keyword":"word in body","articleTitle":"matching title","articleSlug":"slug"}]\nMax 5 suggestions. If none found return [].`
      );

      const cleaned = result.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned) as LinkSuggestion[];
      setSuggestions(parsed);
      return parsed;
    } catch {
      setSuggestions([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return { suggestLinks, suggestions, loading };
}

import { useState } from 'react';
import { generateWithGemini } from '../lib/gemini';
import { supabase } from '../lib/supabase';

interface GeneratedArticle {
  title: string;
  meta_title: string;
  meta_description: string;
  excerpt: string;
  body: string;
  tags: string[];
  category: string;
  focus_keyword: string;
  read_time: number;
}

export function useArticleGenerator() {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);

  const generateArticle = async (topic: string, category?: string, summary?: string) => {
    setGenerating(true);
    setError(null);

    try {
      setProgress('Researching topic...');
      const prompt = `You are a professional news journalist.
Write a complete news article about: ${topic}
${summary ? `Additional context: ${summary}` : ''}
${category ? `Category: ${category}` : ''}

Return ONLY valid JSON (no markdown, no backticks):
{
  "title": "engaging headline",
  "meta_title": "SEO title under 60 chars",
  "meta_description": "SEO description under 160 chars",
  "excerpt": "2 sentence summary",
  "body": "full HTML article with h2 subheadings, minimum 400 words",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "category": "${category || 'one of Politics/Technology/Sports/World/Entertainment/Business'}",
  "focus_keyword": "main SEO keyword",
  "read_time": 3
}`;

      const response = await generateWithGemini(prompt);
      setProgress('Writing article...');

      let parsed: GeneratedArticle;
      try {
        const cleaned = response.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
        parsed = JSON.parse(cleaned);
      } catch {
        throw new Error('Failed to parse AI response');
      }

      setProgress('Finding thumbnail...');
      let thumbnail = '';
      try {
        const imgRes = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(topic)}&per_page=1&client_id=demo`
        );
        if (imgRes.ok) {
          const imgData = await imgRes.json();
          thumbnail = imgData.results?.[0]?.urls?.regular || '';
        }
      } catch {
        // no thumbnail
      }

      if (!thumbnail) {
        thumbnail = `https://images.unsplash.com/photo-1504711434969-e33886168d5c?w=800&h=450&fit=crop`;
      }

      setProgress('Saving draft...');
      const slug = parsed.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      const { data, error: insertError } = await supabase.from('articles').insert({
        slug,
        title: parsed.title,
        excerpt: parsed.excerpt,
        body: parsed.body,
        thumbnail,
        category: parsed.category,
        tags: parsed.tags,
        author_name: 'AI Writer',
        author_avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ai',
        status: 'draft',
        meta_title: parsed.meta_title,
        meta_description: parsed.meta_description,
        focus_keyword: parsed.focus_keyword,
        read_time: parsed.read_time || 3,
        is_ai_generated: true,
        ai_generated_at: new Date().toISOString(),
      }).select().single();

      if (insertError) throw insertError;

      setProgress('Done!');
      return data;
    } catch (err: any) {
      setError(err.message || 'Generation failed');
      return null;
    } finally {
      setGenerating(false);
    }
  };

  return { generateArticle, generating, progress, error };
}

import { useState } from 'react';
import { generateWithGemini } from '../lib/gemini';

export function useTagGenerator() {
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const generateTags = async (title: string, body: string) => {
    setLoading(true);
    try {
      const prompt = `Read this article and generate 5-8 relevant tags.\nReturn ONLY a JSON array of strings. No explanation.\nArticle: ${title} ${body.slice(0, 500)}`;
      const response = await generateWithGemini(prompt);
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) {
        setTags(parsed);
        return parsed;
      }
    } catch (error) {
      console.error('Tag generation error:', error);
    } finally {
      setLoading(false);
    }
    return [];
  };

  return { generateTags, tags, loading };
}

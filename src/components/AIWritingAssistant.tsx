import { useState } from 'react';
import { Sparkles, Wand2, FileText } from 'lucide-react';
import { generateWithGemini } from '../lib/gemini';
import toast from 'react-hot-toast';

interface AIWritingAssistantProps {
  title: string;
  body: string;
  onTitleChange: (title: string) => void;
  onExcerptChange: (excerpt: string) => void;
  onBodyChange: (body: string) => void;
}

export function AIWritingAssistant({ title, body, onTitleChange, onExcerptChange, onBodyChange }: AIWritingAssistantProps) {
  const [headlineSuggestions, setHeadlineSuggestions] = useState<string[]>([]);
  const [showHeadlines, setShowHeadlines] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const improveHeadline = async () => {
    if (!title) { toast.error('Enter a title first'); return; }
    setLoading('headline');
    try {
      const prompt = `Improve this news headline to be more engaging and SEO friendly. Give 3 alternatives.\nReturn JSON: {"suggestions": ["h1","h2","h3"]}\nHeadline: ${title}`;
      const response = await generateWithGemini(prompt);
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      setHeadlineSuggestions(parsed.suggestions || []);
      setShowHeadlines(true);
    } catch {
      toast.error('Failed to generate headlines');
    } finally {
      setLoading(null);
    }
  };

  const generateExcerpt = async () => {
    if (!body) { toast.error('Write body content first'); return; }
    setLoading('excerpt');
    try {
      const prompt = `Write a compelling 2-sentence excerpt for this article that makes readers want to click. Max 160 characters. Return just the excerpt text.\n\nArticle: ${body.slice(0, 1000)}`;
      const response = await generateWithGemini(prompt);
      onExcerptChange(response.trim());
      toast.success('Excerpt generated!');
    } catch {
      toast.error('Failed to generate excerpt');
    } finally {
      setLoading(null);
    }
  };

  const expandContent = async () => {
    if (!body) { toast.error('Write body content first'); return; }
    setLoading('expand');
    try {
      const prompt = `Expand this article content with more detail, facts, and context. Keep same tone and style. Return HTML.\n\nContent: ${body.slice(0, 2000)}`;
      const response = await generateWithGemini(prompt);
      onBodyChange(response.trim());
      toast.success('Content expanded!');
    } catch {
      toast.error('Failed to expand content');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={improveHeadline}
          disabled={loading === 'headline'}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-500/20 disabled:opacity-50 transition-all"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {loading === 'headline' ? 'Generating...' : 'Improve Headline'}
          <span className="px-1 py-0.5 text-[10px] bg-purple-500/20 rounded">AI</span>
        </button>
        <button
          onClick={generateExcerpt}
          disabled={loading === 'excerpt'}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-500/20 disabled:opacity-50 transition-all"
        >
          <FileText className="h-3.5 w-3.5" />
          {loading === 'excerpt' ? 'Generating...' : 'Generate Excerpt'}
          <span className="px-1 py-0.5 text-[10px] bg-purple-500/20 rounded">AI</span>
        </button>
        <button
          onClick={expandContent}
          disabled={loading === 'expand'}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-500/20 disabled:opacity-50 transition-all"
        >
          <Wand2 className="h-3.5 w-3.5" />
          {loading === 'expand' ? 'Expanding...' : 'Expand Content'}
          <span className="px-1 py-0.5 text-[10px] bg-purple-500/20 rounded">AI</span>
        </button>
      </div>

      {showHeadlines && headlineSuggestions.length > 0 && (
        <div className="p-3 bg-purple-500/5 border border-purple-500/20 rounded-lg space-y-1.5">
          <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-2">Headline Suggestions:</p>
          {headlineSuggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => { onTitleChange(s); setShowHeadlines(false); toast.success('Headline applied!'); }}
              className="block w-full text-left px-3 py-2 text-sm text-foreground bg-card hover:bg-accent rounded-lg transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

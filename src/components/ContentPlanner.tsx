import { useState } from 'react';
import { Lightbulb, Sparkles, Zap } from 'lucide-react';
import { generateWithGemini } from '../lib/gemini';
import { supabase } from '../lib/supabase';
import { LoadingSpinner } from './LoadingSpinner';

interface Suggestion {
  title: string;
  category: string;
  reason: string;
  trending_score: number;
}

interface ContentPlannerProps {
  onGenerate?: (topic: string, category: string) => void;
}

export function ContentPlanner({ onGenerate }: ContentPlannerProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const getIdeas = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('articles')
        .select('title, category')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(10);

      const articleList = (data || []).map(a => `- ${a.title} (${a.category})`).join('\n');

      const prompt = `I run a news blog. Here are my recent articles:
${articleList || '(no articles yet)'}

What 5 articles should I write next to balance coverage and maximize engagement?
Return ONLY valid JSON (no markdown, no backticks):
{
  "suggestions": [
    {"title": "string", "category": "string", "reason": "string", "trending_score": 8}
  ]
}`;

      const response = await generateWithGemini(prompt);
      const cleaned = response.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      setSuggestions(parsed.suggestions || []);
    } catch (err) {
      console.error('Content planner error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-primary" /> What to Write Next
        </h3>
        <button onClick={getIdeas} disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition-all">
          {loading ? <LoadingSpinner size="sm" /> : <Sparkles className="h-4 w-4" />}
          {loading ? 'Thinking...' : 'Get Article Ideas'}
        </button>
      </div>

      {suggestions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {suggestions.map((s, i) => (
            <div key={i} className="p-4 bg-card border border-border rounded-lg space-y-2">
              <p className="text-sm font-semibold text-foreground">{s.title}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{s.category}</span>
                <span className="text-xs text-muted-foreground">Score: {s.trending_score}/10</span>
              </div>
              <p className="text-xs text-muted-foreground">{s.reason}</p>
              {onGenerate && (
                <button onClick={() => onGenerate(s.title, s.category)}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded hover:bg-primary/20 transition-all mt-1">
                  <Zap className="h-3 w-3" /> Generate This Article
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {suggestions.length === 0 && !loading && (
        <p className="text-sm text-muted-foreground text-center py-6">
          Click "Get Article Ideas" to get AI-powered content suggestions.
        </p>
      )}
    </div>
  );
}

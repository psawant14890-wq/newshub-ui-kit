import { useState } from 'react';
import { Wand2, Copy, Check } from 'lucide-react';
import { generateWithGemini } from '../lib/gemini';
import { LoadingSpinner } from './LoadingSpinner';
import toast from 'react-hot-toast';

interface Props {
  content: string;
  onApply?: (rewritten: string) => void;
}

type Style = 'concise' | 'engaging' | 'formal' | 'seo';

const STYLES: Array<{ id: Style; label: string; desc: string }> = [
  { id: 'concise', label: 'Concise', desc: 'Tighten and remove filler' },
  { id: 'engaging', label: 'Engaging', desc: 'Punchier hook, active voice' },
  { id: 'formal', label: 'Formal', desc: 'Neutral, journalistic tone' },
  { id: 'seo', label: 'SEO', desc: 'Add keywords, headings' },
];

export function AIRewriteSuggestions({ content, onApply }: Props) {
  const [busy, setBusy] = useState(false);
  const [style, setStyle] = useState<Style | null>(null);
  const [suggestion, setSuggestion] = useState('');
  const [copied, setCopied] = useState(false);

  const run = async (s: Style) => {
    if (!content || content.trim().length < 20) {
      toast.error('Write some content first');
      return;
    }
    setStyle(s);
    setBusy(true);
    setSuggestion('');
    try {
      const map: Record<Style, string> = {
        concise: 'Rewrite the following news article to be significantly shorter while keeping all key facts. Remove filler and repetition.',
        engaging: 'Rewrite this article with a more engaging hook and active voice, while remaining factual.',
        formal: 'Rewrite in a formal, neutral journalistic tone suitable for a wire service.',
        seo: 'Rewrite for SEO: add H2 subheadings, include natural keyword phrasing, keep facts intact.',
      };
      const text = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 6000);
      const result = await generateWithGemini(`${map[s]}\n\nARTICLE:\n${text}\n\nReturn only the rewritten article as HTML with <p> and <h2> tags.`);
      setSuggestion(result.replace(/```html?|```/g, '').trim());
    } catch {
      toast.error('AI rewrite failed');
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(suggestion);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="border border-border rounded-lg bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Wand2 className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-semibold text-foreground">AI rewrite suggestions</h4>
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        {STYLES.map(s => (
          <button
            key={s.id}
            onClick={() => run(s.id)}
            disabled={busy}
            title={s.desc}
            className={`px-3 py-1.5 text-xs rounded-full border ${
              style === s.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-border hover:bg-accent'
            } disabled:opacity-50`}
          >
            {s.label}
          </button>
        ))}
      </div>
      {busy && <div className="py-4 flex justify-center"><LoadingSpinner /></div>}
      {suggestion && (
        <>
          <div className="prose prose-sm max-w-none text-foreground bg-muted rounded p-3 max-h-64 overflow-auto" dangerouslySetInnerHTML={{ __html: suggestion }} />
          <div className="flex gap-2 mt-3">
            <button onClick={copy} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border border-border hover:bg-accent">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            {onApply && (
              <button
                onClick={() => { onApply(suggestion); toast.success('Applied to editor'); }}
                className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded hover:opacity-90"
              >
                Apply to article
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

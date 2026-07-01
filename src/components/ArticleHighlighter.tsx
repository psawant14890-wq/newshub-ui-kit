import { useEffect, useState } from 'react';
import { Highlighter, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface Highlight {
  id: string;
  text: string;
  createdAt: string;
}

interface Props {
  slug: string;
}

const key = (slug: string) => `newshub_highlights_${slug}`;

export function ArticleHighlighter({ slug }: Props) {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<string>('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key(slug));
      setHighlights(raw ? JSON.parse(raw) : []);
    } catch { setHighlights([]); }
  }, [slug]);

  useEffect(() => {
    const onSelect = () => {
      const sel = window.getSelection()?.toString().trim() || '';
      if (sel.length > 8 && sel.length < 500) setPending(sel);
      else setPending('');
    };
    document.addEventListener('selectionchange', onSelect);
    return () => document.removeEventListener('selectionchange', onSelect);
  }, []);

  const save = () => {
    if (!pending) return;
    const next: Highlight[] = [
      { id: crypto.randomUUID(), text: pending, createdAt: new Date().toISOString() },
      ...highlights,
    ];
    setHighlights(next);
    localStorage.setItem(key(slug), JSON.stringify(next));
    window.getSelection()?.removeAllRanges();
    setPending('');
    toast.success('Highlight saved');
  };

  const remove = (id: string) => {
    const next = highlights.filter(h => h.id !== id);
    setHighlights(next);
    localStorage.setItem(key(slug), JSON.stringify(next));
  };

  return (
    <>
      {pending && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full shadow-lg">
          <Highlighter className="h-4 w-4" />
          <button onClick={save} className="text-sm font-medium">Save highlight</button>
          <button onClick={() => setPending('')} aria-label="Dismiss">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-border bg-card hover:bg-accent"
      >
        <Highlighter className="h-4 w-4" /> Highlights ({highlights.length})
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-card border border-border rounded-lg max-w-lg w-full max-h-[80vh] overflow-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-foreground">Your highlights</h3>
              <button onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            {highlights.length === 0 ? (
              <p className="text-sm text-muted-foreground">Select text in the article to save a highlight.</p>
            ) : (
              <ul className="space-y-3">
                {highlights.map(h => (
                  <li key={h.id} className="p-3 bg-muted rounded border-l-4 border-primary flex justify-between gap-2">
                    <p className="text-sm text-foreground">“{h.text}”</p>
                    <button onClick={() => remove(h.id)} className="text-destructive hover:opacity-80">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
}

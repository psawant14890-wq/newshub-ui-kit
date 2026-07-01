import { useState } from 'react';
import { Languages, X } from 'lucide-react';
import { generateWithGemini } from '../lib/gemini';
import { LoadingSpinner } from './LoadingSpinner';
import toast from 'react-hot-toast';

const LANGUAGES = [
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'hi', name: 'Hindi' },
  { code: 'zh', name: 'Chinese (Simplified)' },
  { code: 'ar', name: 'Arabic' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ja', name: 'Japanese' },
];

interface Props {
  title: string;
  body: string;
}

export function TranslateArticle({ title, body }: Props) {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState('');
  const [busy, setBusy] = useState(false);
  const [output, setOutput] = useState('');

  const translate = async (target: string, name: string) => {
    setLang(target);
    setBusy(true);
    setOutput('');
    try {
      const stripped = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 6000);
      const prompt = `Translate the following news article title and body into ${name}. Preserve paragraph breaks. Return plain text only.\n\nTITLE: ${title}\n\nBODY:\n${stripped}`;
      const result = await generateWithGemini(prompt);
      setOutput(result);
    } catch {
      toast.error('Translation failed');
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-border bg-card hover:bg-accent"
      >
        <Languages className="h-4 w-4" /> Translate
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-card border border-border rounded-lg max-w-2xl w-full max-h-[85vh] overflow-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                <Languages className="h-5 w-5" /> Translate article
              </h3>
              <button onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {LANGUAGES.map(l => (
                <button
                  key={l.code}
                  disabled={busy}
                  onClick={() => translate(l.code, l.name)}
                  className={`px-3 py-1.5 text-xs rounded-full border ${
                    lang === l.code ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-border hover:bg-accent'
                  } disabled:opacity-50`}
                >
                  {l.name}
                </button>
              ))}
            </div>
            {busy && <div className="py-6 flex justify-center"><LoadingSpinner /></div>}
            {output && (
              <div className="prose max-w-none text-foreground whitespace-pre-wrap text-sm leading-relaxed">
                {output}
              </div>
            )}
            {!busy && !output && (
              <p className="text-sm text-muted-foreground">Pick a language to translate this article with AI.</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

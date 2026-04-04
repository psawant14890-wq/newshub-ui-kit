import { useState } from 'react';
import { CheckCircle2, AlertCircle, Shield, Sparkles } from 'lucide-react';
import { generateWithGemini } from '../lib/gemini';
import { LoadingSpinner } from './LoadingSpinner';

interface CheckItem {
  label: string;
  passed: boolean;
  detail: string;
}

interface EditorialChecklistProps {
  title: string;
  body: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  tags: string;
  thumbnail: string;
  onPublish: () => void;
  publishing: boolean;
}

export function EditorialChecklist({
  title, body, excerpt, metaTitle, metaDescription, tags, thumbnail, onPublish, publishing,
}: EditorialChecklistProps) {
  const [checks, setChecks] = useState<CheckItem[]>([]);
  const [running, setRunning] = useState(false);
  const [factChecked, setFactChecked] = useState(false);

  const runChecks = async () => {
    setRunning(true);
    const results: CheckItem[] = [];

    // 1. SEO checks
    const titleLen = (metaTitle || title).length;
    results.push({
      label: 'SEO Title Length',
      passed: titleLen > 0 && titleLen <= 60,
      detail: titleLen === 0 ? 'Missing meta title' : `${titleLen}/60 characters`,
    });

    const descLen = (metaDescription || excerpt).length;
    results.push({
      label: 'Meta Description',
      passed: descLen > 0 && descLen <= 160,
      detail: descLen === 0 ? 'Missing description' : `${descLen}/160 characters`,
    });

    // 2. Tag count
    const tagCount = tags.split(',').filter(t => t.trim()).length;
    results.push({
      label: 'Tag Count',
      passed: tagCount >= 3,
      detail: `${tagCount} tags (min 3 recommended)`,
    });

    // 3. Image
    results.push({
      label: 'Thumbnail Image',
      passed: !!thumbnail,
      detail: thumbnail ? 'Image set' : 'No thumbnail provided',
    });

    // 4. AI readability
    try {
      const readPrompt = `Rate this article's readability on a scale of 1-10. Consider clarity, sentence structure, and engagement. Reply with ONLY a number 1-10.
Title: ${title}
Content: ${body.slice(0, 500)}`;
      const readResult = await generateWithGemini(readPrompt);
      const score = parseInt(readResult.trim());
      results.push({
        label: 'Readability Score',
        passed: !isNaN(score) && score >= 6,
        detail: !isNaN(score) ? `${score}/10` : 'Could not assess',
      });
    } catch {
      results.push({ label: 'Readability Score', passed: false, detail: 'Check failed' });
    }

    // 5. Fact check reminder
    results.push({
      label: 'Fact Check Confirmed',
      passed: factChecked,
      detail: factChecked ? 'Confirmed by editor' : 'Please confirm fact-checking',
    });

    setChecks(results);
    setRunning(false);
  };

  const passedCount = checks.filter(c => c.passed).length;

  return (
    <div className="p-4 bg-card border border-border rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" /> Pre-Publish Checklist
        </h3>
        <button onClick={runChecks} disabled={running}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary rounded-lg hover:bg-primary/20 disabled:opacity-50 transition-all">
          {running ? <LoadingSpinner size="sm" /> : <Sparkles className="h-3.5 w-3.5" />}
          {running ? 'Checking...' : 'Run Checks'}
        </button>
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
        <input type="checkbox" checked={factChecked} onChange={e => setFactChecked(e.target.checked)}
          className="rounded border-border" />
        I confirm this article has been fact-checked
      </label>

      {checks.length > 0 && (
        <>
          <div className="space-y-2">
            {checks.map((check, i) => (
              <div key={i} className="flex items-center gap-2">
                {check.passed
                  ? <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                  : <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                }
                <span className="text-sm text-foreground">{check.label}</span>
                <span className="text-xs text-muted-foreground ml-auto">{check.detail}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-sm font-medium text-foreground">
              {passedCount}/{checks.length} checks passed
            </span>
            <div className="flex gap-2">
              <button onClick={onPublish} disabled={publishing}
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition-all">
                {passedCount === checks.length ? 'Publish' : 'Publish Anyway'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

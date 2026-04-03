import { useState } from 'react';
import { Shield, X } from 'lucide-react';
import { generateWithGemini } from '../lib/gemini';
import { Modal } from './Modal';

interface FakeNewsResult {
  score: number;
  verdict: 'Credible' | 'Questionable' | 'Unreliable';
  reasons: string[];
  recommendation: string;
}

interface FakeNewsDetectorProps {
  title: string;
  content: string;
}

export function FakeNewsDetector({ title, content }: FakeNewsDetectorProps) {
  const [result, setResult] = useState<FakeNewsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const analyze = async () => {
    setLoading(true);
    setShowModal(true);
    try {
      const prompt = `Analyze this news article for credibility.\nCheck for: sensational language, missing sources, logical fallacies, one-sided reporting.\nRespond ONLY with JSON:\n{"score": 0-100, "verdict": "Credible" | "Questionable" | "Unreliable", "reasons": ["reason1", "reason2", "reason3"], "recommendation": "short advice for reader"}\n\nTitle: ${title}\nContent: ${content.slice(0, 1000)}`;
      const response = await generateWithGemini(prompt);
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
    } catch {
      setResult({ score: 50, verdict: 'Questionable', reasons: ['Unable to fully analyze'], recommendation: 'Read with critical thinking.' });
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-primary';
    if (score >= 40) return 'text-yellow-500';
    return 'text-destructive';
  };

  const getScoreBg = (score: number) => {
    if (score >= 70) return 'border-primary';
    if (score >= 40) return 'border-yellow-500';
    return 'border-destructive';
  };

  return (
    <>
      <button
        onClick={analyze}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground border border-border rounded-lg hover:text-foreground hover:bg-accent transition-all duration-200"
      >
        <Shield className="h-4 w-4" />
        Check Credibility
      </button>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Credibility Analysis" size="md">
        {loading ? (
          <div className="flex flex-col items-center py-8">
            <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
            <p className="text-sm text-muted-foreground">Analyzing article credibility...</p>
          </div>
        ) : result ? (
          <div className="space-y-6">
            <div className="flex flex-col items-center">
              <div className={`h-24 w-24 rounded-full border-4 ${getScoreBg(result.score)} flex items-center justify-center mb-3`}>
                <span className={`text-3xl font-bold ${getScoreColor(result.score)}`}>{result.score}</span>
              </div>
              <span className={`text-lg font-semibold ${getScoreColor(result.score)}`}>{result.verdict}</span>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Key Findings</h4>
              <ul className="space-y-1.5">
                {result.reasons.map((r, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-1">•</span> {r}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3 bg-accent rounded-lg">
              <p className="text-sm text-foreground"><strong>Recommendation:</strong> {result.recommendation}</p>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}

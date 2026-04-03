import { useState } from 'react';
import { Scale } from 'lucide-react';
import { generateWithGemini } from '../lib/gemini';
import { Modal } from './Modal';

interface BiasResult {
  bias: 'Left' | 'Center-Left' | 'Center' | 'Center-Right' | 'Right';
  confidence: number;
  indicators: string[];
  explanation: string;
}

const biasPositions: Record<string, number> = {
  'Left': 0, 'Center-Left': 25, 'Center': 50, 'Center-Right': 75, 'Right': 100,
};

interface BiasDetectorProps {
  title: string;
  content: string;
}

export function BiasDetector({ title, content }: BiasDetectorProps) {
  const [result, setResult] = useState<BiasResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const analyze = async () => {
    setLoading(true);
    setShowModal(true);
    try {
      const prompt = `Analyze the political bias of this news article.\nReturn ONLY JSON:\n{"bias": "Left" | "Center-Left" | "Center" | "Center-Right" | "Right", "confidence": 0-100, "indicators": ["indicator1", "indicator2"], "explanation": "one sentence explanation"}\n\nTitle: ${title}\nContent: ${content.slice(0, 1000)}`;
      const response = await generateWithGemini(prompt);
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
    } catch {
      setResult({ bias: 'Center', confidence: 50, indicators: ['Unable to fully analyze'], explanation: 'Could not determine bias reliably.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={analyze}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground border border-border rounded-lg hover:text-foreground hover:bg-accent transition-all duration-200"
      >
        <Scale className="h-4 w-4" />
        Check Bias
      </button>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Bias Analysis" size="md">
        {loading ? (
          <div className="flex flex-col items-center py-8">
            <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
            <p className="text-sm text-muted-foreground">Analyzing article bias...</p>
          </div>
        ) : result ? (
          <div className="space-y-6">
            {/* Bias Scale */}
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>Left</span><span>Center</span><span>Right</span>
              </div>
              <div className="relative h-3 bg-gradient-to-r from-blue-500 via-gray-400 to-red-500 rounded-full">
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-5 w-5 bg-foreground rounded-full border-2 border-background shadow-md transition-all"
                  style={{ left: `${biasPositions[result.bias]}%`, transform: 'translate(-50%, -50%)' }}
                />
              </div>
              <p className="text-center mt-3 text-lg font-semibold text-foreground">{result.bias}</p>
              <p className="text-center text-sm text-muted-foreground">Confidence: {result.confidence}%</p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Indicators</h4>
              <ul className="space-y-1.5">
                {result.indicators.map((ind, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-1">•</span> {ind}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3 bg-accent rounded-lg">
              <p className="text-sm text-foreground">{result.explanation}</p>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}

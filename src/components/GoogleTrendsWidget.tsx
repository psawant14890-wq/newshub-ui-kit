import { useState, useEffect } from 'react';
import { TrendingUp, RefreshCw, Zap, Globe } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';
import { useGoogleTrends, type TrendItem } from '../hooks/useGoogleTrends';

interface GoogleTrendsWidgetProps {
  onGenerate?: (topic: string) => void;
}

export function GoogleTrendsWidget({ onGenerate }: GoogleTrendsWidgetProps) {
  const { trends, loading, fetchTrends } = useGoogleTrends();
  const [geo, setGeo] = useState('US');

  useEffect(() => { fetchTrends(geo); }, [geo]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" /> Google Trends
        </h3>
        <div className="flex items-center gap-2">
          <select value={geo} onChange={e => setGeo(e.target.value)}
            className="text-xs px-2 py-1 border border-border rounded bg-background text-foreground">
            <option value="US">US</option>
            <option value="GB">UK</option>
            <option value="IN">India</option>
            <option value="DE">Germany</option>
          </select>
          <button onClick={() => fetchTrends(geo)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {loading ? <div className="flex justify-center py-4"><LoadingSpinner /></div> : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {trends.map((trend, i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 bg-card border border-border rounded-lg hover:border-primary/30 transition-all">
              <span className="text-lg font-bold text-primary/30 w-6 text-right shrink-0">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground line-clamp-1">{trend.title}</p>
                {trend.traffic && (
                  <p className="text-xs text-muted-foreground">{trend.traffic} searches</p>
                )}
              </div>
              {onGenerate && (
                <button onClick={() => onGenerate(trend.title)}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded hover:bg-primary/20 transition-all shrink-0">
                  <Zap className="h-3 w-3" /> Write
                </button>
              )}
            </div>
          ))}
          {trends.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No trends available.</p>}
        </div>
      )}
    </div>
  );
}

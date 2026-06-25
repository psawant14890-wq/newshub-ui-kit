import { Zap, Award } from 'lucide-react';

interface PointsDisplayProps {
  points: number;
  badgeCount?: number;
  compact?: boolean;
}

export function PointsDisplay({ points, badgeCount = 0, compact = false }: PointsDisplayProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="flex items-center gap-1 text-foreground font-medium">
          <Zap className="h-4 w-4 text-yellow-500" />
          {points.toLocaleString()}
        </span>
        {badgeCount > 0 && (
          <span className="flex items-center gap-1 text-foreground font-medium">
            <Award className="h-4 w-4 text-primary" />
            {badgeCount}
          </span>
        )}
      </div>
    );
  }
  return (
    <div className="flex gap-3">
      <div className="flex-1 p-4 rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-muted-foreground">Points</p>
          <Zap className="h-4 w-4 text-yellow-500" />
        </div>
        <p className="text-2xl font-bold text-foreground">{points.toLocaleString()}</p>
      </div>
      <div className="flex-1 p-4 rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-muted-foreground">Badges</p>
          <Award className="h-4 w-4 text-primary" />
        </div>
        <p className="text-2xl font-bold text-foreground">{badgeCount}</p>
      </div>
    </div>
  );
}

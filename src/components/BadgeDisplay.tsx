import { Award, Trophy, Crown, Sparkles, Lock } from 'lucide-react';
import type { Badge, EarnedBadge } from '../hooks/useBadges';

const ICON_MAP = { Award, Trophy, Crown, Sparkles } as const;
const TIER_STYLES: Record<Badge['tier'], string> = {
  bronze:   'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30',
  silver:   'bg-slate-400/10 text-slate-600 dark:text-slate-300 border-slate-400/30',
  gold:     'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30',
  platinum: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
};

function getIcon(name: string) {
  return ICON_MAP[name as keyof typeof ICON_MAP] || Award;
}

interface BadgeDisplayProps {
  earned: EarnedBadge[];
  catalog: Badge[];
  currentPoints: number;
}

export function BadgeDisplay({ earned, catalog, currentPoints }: BadgeDisplayProps) {
  const earnedIds = new Set(earned.map(b => b.id));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {catalog.map(b => {
          const isEarned = earnedIds.has(b.id);
          const Icon = getIcon(b.icon);
          return (
            <div
              key={b.id}
              className={`relative p-4 rounded-lg border-2 transition-all ${
                isEarned ? TIER_STYLES[b.tier] : 'bg-muted/30 border-border opacity-60'
              }`}
              title={b.description}
            >
              <div className="flex flex-col items-center text-center gap-2">
                {isEarned ? (
                  <Icon className="h-8 w-8" />
                ) : (
                  <Lock className="h-7 w-7 text-muted-foreground" />
                )}
                <p className="text-xs font-semibold leading-tight">{b.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {isEarned ? 'Earned' : `${b.points_required} pts`}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground text-center">
        You have {currentPoints} points. Earn more by publishing articles and engaging with the community.
      </p>
    </div>
  );
}

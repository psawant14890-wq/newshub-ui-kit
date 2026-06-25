import { useEffect, useState } from 'react';
import { Trophy, Award, Zap, Medal } from 'lucide-react';
import { Navbar, Footer, LoadingSpinner } from '../components';
import { fetchLeaderboard, type LeaderboardEntry } from '../hooks/useBadges';
import { getCategories } from '../lib/api';
import type { Category } from '../types';

export function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [lb, cats] = await Promise.all([fetchLeaderboard(50), getCategories()]);
      setEntries(lb);
      setCategories(cats);
      setLoading(false);
    })();
  }, []);

  const navigate = (path: string) => {
    history.pushState(null, '', path);
    window.dispatchEvent(new Event('popstate'));
  };

  const rankIcon = (i: number) => {
    if (i === 0) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (i === 1) return <Medal className="h-5 w-5 text-slate-400" />;
    if (i === 2) return <Medal className="h-5 w-5 text-orange-500" />;
    return <span className="text-sm font-bold text-muted-foreground w-5 text-center">{i + 1}</span>;
  };

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="min-h-screen bg-background">
      <Navbar categories={categories} />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="text-center mb-8">
          <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
          <h1 className="font-display text-3xl font-bold text-foreground">Leaderboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Top contributors in the NewsHub community</p>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {entries.length === 0 && (
            <p className="p-12 text-center text-muted-foreground text-sm">No leaderboard data yet. Be the first!</p>
          )}
          {entries.map((e, i) => (
            <button
              key={e.id}
              onClick={() => navigate(`/author/${e.id}`)}
              className={`w-full flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors text-left ${
                i !== entries.length - 1 ? 'border-b border-border' : ''
              } ${i < 3 ? 'bg-gradient-to-r from-primary/5 to-transparent' : ''}`}
            >
              <div className="flex-shrink-0 w-8 flex justify-center">{rankIcon(i)}</div>
              {e.avatar_url ? (
                <img src={e.avatar_url} alt={e.name} className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                  {(e.name || '?').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{e.name || 'Anonymous'}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-3">
                  <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-yellow-500" />{e.total_points} pts</span>
                  <span className="flex items-center gap-1"><Award className="h-3 w-3 text-primary" />{e.badge_count} badges</span>
                </p>
              </div>
            </button>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

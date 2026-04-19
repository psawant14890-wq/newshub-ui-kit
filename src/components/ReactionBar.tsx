import { useReactions, type ReactionType } from '../hooks/useReactions';

const ITEMS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: 'informative', emoji: '🧠', label: 'Informative' },
  { type: 'shocking', emoji: '😮', label: 'Shocking' },
  { type: 'happy', emoji: '😊', label: 'Happy' },
  { type: 'sad', emoji: '😢', label: 'Sad' },
  { type: 'angry', emoji: '😡', label: 'Angry' },
];

export function ReactionBar({ articleSlug }: { articleSlug: string }) {
  const { reactions, userReaction, toggleReaction, loading } = useReactions(articleSlug);

  return (
    <div className="my-8 p-5 bg-card border border-border rounded-lg">
      <h3 className="text-sm font-semibold text-foreground mb-3">How does this article make you feel?</h3>
      <div className="flex flex-wrap gap-2">
        {ITEMS.map(item => {
          const active = userReaction === item.type;
          return (
            <button key={item.type} onClick={() => toggleReaction(item.type)} disabled={loading}
              className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-all ${
                active ? 'bg-primary/10 border-primary text-primary scale-105' : 'bg-background border-border text-foreground hover:border-primary'
              } active:scale-95`}>
              <span className="text-lg">{item.emoji}</span>
              <span className="text-xs font-medium">{item.label}</span>
              <span className="text-xs text-muted-foreground">{reactions[item.type]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

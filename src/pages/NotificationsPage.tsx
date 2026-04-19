import { Bell, Check, Trash2 } from 'lucide-react';
import { Navbar, Footer, EmptyState, LoadingSpinner } from '../components';
import { useNotifications } from '../hooks/useNotifications';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export function NotificationsPage() {
  const { notifications, loading, markAsRead, markAllAsRead, refresh } = useNotifications();

  const groupBy = (date: string) => {
    const d = new Date(date);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const yest = new Date(today); yest.setDate(yest.getDate() - 1);
    if (d >= today) return 'Today';
    if (d >= yest) return 'Yesterday';
    return 'Earlier';
  };

  const grouped = notifications.reduce<Record<string, typeof notifications>>((acc, n) => {
    const k = groupBy(n.created_at);
    (acc[k] ||= []).push(n);
    return acc;
  }, {});

  const remove = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    toast.success('Deleted');
    void refresh();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar categories={[]} />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-3xl font-bold text-foreground">Notifications</h1>
          {notifications.some(n => !n.is_read) && (
            <button onClick={markAllAsRead} className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90">
              <Check className="h-4 w-4" /> Mark all read
            </button>
          )}
        </div>
        {loading ? <LoadingSpinner /> : notifications.length === 0 ? (
          <EmptyState icon={Bell} title="No notifications" description="You're all caught up!" />
        ) : (
          Object.entries(grouped).map(([group, items]) => (
            <div key={group} className="mb-6">
              <h2 className="text-sm font-semibold text-muted-foreground mb-3">{group}</h2>
              <div className="space-y-2">
                {items.map(n => (
                  <div key={n.id} className={`flex items-start gap-3 p-4 rounded-lg border ${!n.is_read ? 'bg-primary/5 border-primary/30' : 'bg-card border-border'}`}>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{n.title}</p>
                      <p className="text-sm text-muted-foreground">{n.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                    {!n.is_read && (
                      <button onClick={() => markAsRead(n.id)} className="p-1.5 hover:bg-accent rounded" title="Mark read">
                        <Check className="h-4 w-4 text-primary" />
                      </button>
                    )}
                    <button onClick={() => remove(n.id)} className="p-1.5 hover:bg-accent rounded" title="Delete">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </main>
      <Footer />
    </div>
  );
}

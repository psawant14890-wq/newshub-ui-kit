import { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);

  const handleClick = (id: string, link?: string) => {
    void markAsRead(id);
    if (link) {
      history.pushState(null, '', link);
      window.dispatchEvent(new Event('popstate'));
    }
    setOpen(false);
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} className="relative p-2 hover:bg-accent rounded-lg transition-all" aria-label="Notifications">
        <Bell className={`h-5 w-5 text-foreground ${unreadCount > 0 ? 'animate-pulse' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-4 w-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-border">
              <h3 className="font-semibold text-foreground text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="text-xs text-primary hover:underline">Mark all read</button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">No notifications yet</p>
              ) : (
                notifications.slice(0, 5).map(n => (
                  <button key={n.id} onClick={() => handleClick(n.id, n.link)}
                    className={`w-full text-left p-3 border-b border-border hover:bg-accent/50 transition-all ${!n.is_read ? 'bg-primary/5' : ''}`}>
                    <p className="text-sm font-medium text-foreground">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleDateString()}</p>
                  </button>
                ))
              )}
            </div>
            {notifications.length > 5 && (
              <button onClick={() => { history.pushState(null, '', '/notifications'); window.dispatchEvent(new Event('popstate')); setOpen(false); }}
                className="w-full p-2 text-sm text-primary hover:bg-accent border-t border-border">View all</button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

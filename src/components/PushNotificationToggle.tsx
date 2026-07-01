import { Bell, BellOff, BellRing } from 'lucide-react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import toast from 'react-hot-toast';

export function PushNotificationToggle() {
  const { permission, requestPermission, sendNotification } = usePushNotifications();

  const enable = async () => {
    const granted = await requestPermission();
    if (granted) {
      sendNotification('NewsHub notifications enabled', 'You’ll be notified about breaking stories and replies.');
      toast.success('Push notifications enabled');
    } else {
      toast.error('Permission denied. Enable it in your browser settings.');
    }
  };

  const supported = typeof window !== 'undefined' && 'Notification' in window;

  if (!supported) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card">
        <BellOff className="h-5 w-5 text-muted-foreground" />
        <div>
          <p className="font-medium text-foreground">Push notifications</p>
          <p className="text-xs text-muted-foreground">Not supported in this browser.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 p-4 rounded-lg border border-border bg-card">
      <div className="flex items-center gap-3">
        {permission === 'granted' ? (
          <BellRing className="h-5 w-5 text-primary" />
        ) : (
          <Bell className="h-5 w-5 text-muted-foreground" />
        )}
        <div>
          <p className="font-medium text-foreground">Browser push notifications</p>
          <p className="text-xs text-muted-foreground">
            {permission === 'granted'
              ? 'Enabled — you’ll get alerts about breaking news and comment replies.'
              : permission === 'denied'
              ? 'Blocked — allow notifications in your browser settings.'
              : 'Get real-time alerts for breaking news and mentions.'}
          </p>
        </div>
      </div>
      {permission !== 'granted' && (
        <button
          onClick={enable}
          disabled={permission === 'denied'}
          className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          Enable
        </button>
      )}
    </div>
  );
}

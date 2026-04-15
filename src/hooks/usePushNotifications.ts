import { useState, useEffect } from 'react';

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) return false;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result === 'granted';
  };

  const sendNotification = (title: string, body: string, url?: string) => {
    if (permission !== 'granted') return;
    const notification = new Notification(title, {
      body,
      icon: '/placeholder.svg',
      tag: 'newshub-article',
    });
    if (url) {
      notification.onclick = () => {
        window.focus();
        window.location.href = url;
      };
    }
  };

  return { permission, requestPermission, sendNotification };
}

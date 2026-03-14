import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useToastContext, type ToastType } from '../context/ToastContext';

const iconMap: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const colorMap: Record<ToastType, string> = {
  success: 'border-category-sports bg-category-sports/10 text-category-sports',
  error: 'border-destructive bg-destructive/10 text-destructive',
  info: 'border-category-politics bg-category-politics/10 text-category-politics',
  warning: 'border-category-world bg-category-world/10 text-category-world',
};

function ToastItem({ id, message, type }: { id: string; message: string; type: ToastType }) {
  const { dismissToast } = useToastContext();
  const [exiting, setExiting] = useState(false);
  const Icon = iconMap[type];

  const handleDismiss = () => {
    setExiting(true);
    setTimeout(() => dismissToast(id), 300);
  };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 border-l-4 rounded-lg shadow-lg bg-popover ${colorMap[type]} ${
        exiting ? 'animate-slide-out-right' : 'animate-slide-in-right'
      }`}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      <p className="text-sm font-medium text-foreground flex-1">{message}</p>
      <button
        onClick={handleDismiss}
        className="p-1 rounded hover:bg-accent transition-colors duration-200"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts } = useToastContext();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
      {toasts.map(toast => (
        <ToastItem key={toast.id} {...toast} />
      ))}
    </div>
  );
}

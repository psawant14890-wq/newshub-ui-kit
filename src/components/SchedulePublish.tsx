import { useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Props {
  articleId: string;
  currentScheduledAt?: string | null;
  onScheduled?: (iso: string) => void;
}

export function SchedulePublish({ articleId, currentScheduledAt, onScheduled }: Props) {
  const [value, setValue] = useState(
    currentScheduledAt ? new Date(currentScheduledAt).toISOString().slice(0, 16) : ''
  );
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!value) {
      toast.error('Pick a date & time');
      return;
    }
    const iso = new Date(value).toISOString();
    if (new Date(iso).getTime() < Date.now()) {
      toast.error('Choose a future time');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('articles')
      .update({ scheduled_at: iso, status: 'scheduled' })
      .eq('id', articleId);
    setSaving(false);
    if (error) {
      toast.error('Could not schedule (add scheduled_at column)');
      return;
    }
    toast.success(`Scheduled for ${new Date(iso).toLocaleString()}`);
    onScheduled?.(iso);
  };

  return (
    <div className="border border-border rounded-lg bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <CalendarClock className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-semibold text-foreground">Schedule publish</h4>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="datetime-local"
          value={value}
          onChange={e => setValue(e.target.value)}
          className="flex-1 px-3 py-2 text-sm rounded border border-border bg-background text-foreground"
        />
        <button
          onClick={save}
          disabled={saving}
          className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Schedule'}
        </button>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Article auto-publishes at the chosen time (requires <code>scheduled_at</code> column + cron).
      </p>
    </div>
  );
}

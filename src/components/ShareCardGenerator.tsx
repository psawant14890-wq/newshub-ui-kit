import { useState } from 'react';
import { ImageDown } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  title: string;
  excerpt?: string;
  author?: string;
}

export function ShareCardGenerator({ title, excerpt = '', author = 'NewsHub' }: Props) {
  const [busy, setBusy] = useState(false);

  const generate = async () => {
    setBusy(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 630;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('canvas unsupported');

      // Gradient background
      const grad = ctx.createLinearGradient(0, 0, 1200, 630);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#1e3a8a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1200, 630);

      // Brand
      ctx.fillStyle = '#60a5fa';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('NEWSHUB', 60, 90);

      // Title (wrap)
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 56px sans-serif';
      const words = title.split(' ');
      let line = '';
      let y = 200;
      for (const w of words) {
        const test = line + w + ' ';
        if (ctx.measureText(test).width > 1080 && line) {
          ctx.fillText(line, 60, y);
          line = w + ' ';
          y += 70;
          if (y > 430) break;
        } else line = test;
      }
      if (y <= 430) ctx.fillText(line, 60, y);

      // Excerpt
      if (excerpt) {
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '24px sans-serif';
        ctx.fillText(excerpt.slice(0, 90) + (excerpt.length > 90 ? '…' : ''), 60, 520);
      }

      // Author
      ctx.fillStyle = '#94a3b8';
      ctx.font = '22px sans-serif';
      ctx.fillText(`By ${author}`, 60, 580);

      const blob: Blob = await new Promise((res, rej) =>
        canvas.toBlob(b => (b ? res(b) : rej(new Error('blob failed'))), 'image/png')
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.slice(0, 40).replace(/[^a-z0-9]+/gi, '-')}-share.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Share card downloaded');
    } catch {
      toast.error('Could not generate share card');
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={generate}
      disabled={busy}
      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-border bg-card hover:bg-accent disabled:opacity-50"
    >
      <ImageDown className="h-4 w-4" /> {busy ? 'Creating…' : 'Share card'}
    </button>
  );
}

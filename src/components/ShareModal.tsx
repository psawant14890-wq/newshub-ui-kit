import { useState } from 'react';
import { Share2, Copy, Check, X } from 'lucide-react';
import { Modal } from './Modal';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  slug: string;
}

export function ShareModal({ isOpen, onClose, title, slug }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/article/${slug}`;
  const text = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(url);

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Article Published! Share it:" size="sm">
      <div className="space-y-3">
        <a href={`https://twitter.com/intent/tweet?text=${text}&url=${encodedUrl}`} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-3 w-full p-3 rounded-lg border border-border hover:bg-accent transition-all text-foreground text-sm font-medium">
          <span className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold">𝕏</span>
          Share on X / Twitter
        </a>
        <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-3 w-full p-3 rounded-lg border border-border hover:bg-accent transition-all text-foreground text-sm font-medium">
          <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">f</span>
          Share on Facebook
        </a>
        <a href={`https://wa.me/?text=${text}%20${encodedUrl}`} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-3 w-full p-3 rounded-lg border border-border hover:bg-accent transition-all text-foreground text-sm font-medium">
          <span className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold">W</span>
          Share on WhatsApp
        </a>
        <button onClick={copyLink}
          className="flex items-center gap-3 w-full p-3 rounded-lg border border-border hover:bg-accent transition-all text-foreground text-sm font-medium">
          {copied ? <Check className="h-5 w-5 text-primary" /> : <Copy className="h-5 w-5" />}
          {copied ? 'Link Copied!' : 'Copy Link'}
        </button>
      </div>
    </Modal>
  );
}

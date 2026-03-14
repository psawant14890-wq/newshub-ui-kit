import { Twitter, Facebook, MessageCircle, Link as LinkIcon, Check } from 'lucide-react';
import { useState } from 'react';

interface ShareButtonsProps {
  title: string;
  url: string;
}

export function ShareButtons({ title, url }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const fullUrl = typeof window !== 'undefined' ? window.location.origin + url : url;
  const encoded = encodeURIComponent(fullUrl);
  const encodedTitle = encodeURIComponent(title);

  const handleCopy = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title, url: fullUrl });
        return;
      }
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // Fallback
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const platforms = [
    {
      icon: Twitter,
      label: 'Twitter',
      href: `https://twitter.com/intent/tweet?url=${encoded}&text=${encodedTitle}`,
    },
    {
      icon: Facebook,
      label: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
    },
    {
      icon: MessageCircle,
      label: 'WhatsApp',
      href: `https://wa.me/?text=${encodedTitle}%20${encoded}`,
    },
  ];

  return (
    <div className="flex items-center gap-2">
      {platforms.map(platform => (
        <a
          key={platform.label}
          href={platform.href}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
          aria-label={`Share on ${platform.label}`}
        >
          <platform.icon className="h-4 w-4" />
        </a>
      ))}
      <button
        onClick={handleCopy}
        className={`p-2 rounded-lg border border-border transition-all duration-200 ${
          copied ? 'text-primary bg-primary/10 border-primary/30' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
        }`}
        aria-label="Copy link"
      >
        {copied ? <Check className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
      </button>
    </div>
  );
}

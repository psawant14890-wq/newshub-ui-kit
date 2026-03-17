import { useState, useEffect } from 'react';
import { TrendingUp, ChevronDown, ChevronUp, Mail, Twitter, Facebook, Instagram, Youtube, Linkedin } from 'lucide-react';
import { ArticleCard } from './ArticleCard';
import { CategoryBadge } from './CategoryBadge';
import { getTrendingArticles, getAllTags, getCategories } from '../lib/api';
import { useNewsletter } from '../hooks/useNewsletter';
import type { Article, Tag } from '../types';

interface SidebarProps {
  showNewsletter?: boolean;
  showTrending?: boolean;
}

function CollapsibleSection({ title, icon, defaultOpen = true, children }: {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3 text-sm font-semibold text-foreground hover:text-primary transition-colors duration-200"
      >
        <span className="flex items-center gap-2">{icon}{title}</span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-[500px] opacity-100 pb-4' : 'max-h-0 opacity-0'}`}
      >
        {children}
      </div>
    </div>
  );
}

export function Sidebar({ showNewsletter = true, showTrending = true }: SidebarProps) {
  const [trending, setTrending] = useState<Article[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const { subscribe, loading: nlLoading, subscribed } = useNewsletter();

  useEffect(() => {
    if (showTrending) {
      getTrendingArticles(5).then(setTrending);
    }
    getAllTags().then(setTags);
    getCategories().then(setCats);
  }, [showTrending]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    await subscribe(email);
    if (!nlLoading) setEmail('');
  };

  const socialLinks = [
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Youtube, href: '#', label: 'YouTube' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
  ];

  return (
    <aside className="hidden lg:block w-80 flex-shrink-0">
      <div className="sticky top-20 space-y-0 bg-card border border-border rounded-lg p-4">
        {/* Trending */}
        {showTrending && trending.length > 0 && (
          <CollapsibleSection title="Trending Now" icon={<TrendingUp className="h-4 w-4 text-primary" />}>
            <div className="space-y-1">
              {trending.map((article, i) => (
                <div key={article.id} className="flex items-start gap-3">
                  <span className="text-2xl font-display font-bold text-primary/30 leading-none mt-1">{i + 1}</span>
                  <div className="flex-1">
                    <ArticleCard article={article} variant="horizontal" />
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Categories */}
        <CollapsibleSection title="Popular Categories" icon={<span className="text-sm">📁</span>}>
          <div className="flex flex-wrap gap-2">
            {cats.map(cat => (
              <CategoryBadge key={cat.id} category={cat.name} size="md" />
            ))}
          </div>
        </CollapsibleSection>

        {/* Tags */}
        <CollapsibleSection title="Popular Tags" icon={<span className="text-sm">🏷️</span>} defaultOpen={false}>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag, i) => (
              <span
                key={tag.id}
                className={`px-2 py-1 text-muted-foreground bg-muted rounded-md cursor-pointer hover:bg-accent hover:text-foreground transition-all duration-200 ${
                  i < 3 ? 'text-sm font-medium' : i < 6 ? 'text-xs' : 'text-[11px]'
                }`}
              >
                #{tag.name}
              </span>
            ))}
          </div>
        </CollapsibleSection>

        {/* Newsletter */}
        {showNewsletter && (
          <CollapsibleSection title="Newsletter" icon={<Mail className="h-4 w-4 text-primary" />}>
            {subscribed ? (
              <p className="text-sm text-primary">Subscribed! ✓</p>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Your email"
                  required
                  className="w-full px-3 py-2 text-sm bg-accent/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground transition-all duration-200"
                />
                <button type="submit" className="w-full py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all duration-200">
                  Subscribe
                </button>
              </form>
            )}
          </CollapsibleSection>
        )}

        {/* Social */}
        <CollapsibleSection title="Follow Us" icon={<span className="text-sm">🌐</span>} defaultOpen={false}>
          <div className="flex gap-2">
            {socialLinks.map(link => (
              <a
                key={link.label}
                href={link.href}
                aria-label={link.label}
                className="p-2 border border-border rounded-full hover:border-primary hover:text-primary transition-all duration-200"
              >
                <link.icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </CollapsibleSection>
      </div>
    </aside>
  );
}

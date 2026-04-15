import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function Sitemap() {
  const [xml, setXml] = useState('');

  useEffect(() => {
    generateSitemap();
  }, []);

  const generateSitemap = async () => {
    const origin = window.location.origin;
    let urls = [
      { loc: '/', priority: '1.0', changefreq: 'daily' },
      { loc: '/about', priority: '0.5', changefreq: 'monthly' },
      { loc: '/privacy', priority: '0.3', changefreq: 'monthly' },
      { loc: '/terms', priority: '0.3', changefreq: 'monthly' },
    ];

    try {
      const { data: articles } = await supabase
        .from('articles')
        .select('slug, updated_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (articles) {
        articles.forEach(a => {
          urls.push({ loc: `/article/${a.slug}`, priority: '0.8', changefreq: 'weekly' });
        });
      }

      const { data: categories } = await supabase
        .from('categories')
        .select('slug');

      if (categories) {
        categories.forEach(c => {
          urls.push({ loc: `/category/${c.slug}`, priority: '0.6', changefreq: 'daily' });
        });
      }
    } catch { /* use static urls */ }

    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${origin}${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    setXml(sitemapXml);
  };

  if (!xml) return <div className="p-8 text-muted-foreground">Generating sitemap...</div>;

  return (
    <pre className="p-4 text-xs font-mono text-foreground bg-background whitespace-pre-wrap">{xml}</pre>
  );
}

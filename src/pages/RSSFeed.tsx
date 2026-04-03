import { useEffect, useState } from 'react';
import { getRecentArticles } from '../lib/api';
import type { Article } from '../types';

export function RSSFeed() {
  const [xml, setXml] = useState('');

  useEffect(() => {
    generateRSS();
  }, []);

  const generateRSS = async () => {
    const articles = await getRecentArticles(20);
    const baseUrl = window.location.origin;

    const items = articles.map(a => `
    <item>
      <title><![CDATA[${a.title}]]></title>
      <link>${baseUrl}/article/${a.slug}</link>
      <description><![CDATA[${a.excerpt}]]></description>
      <pubDate>${new Date(a.published_at).toUTCString()}</pubDate>
      <guid>${baseUrl}/article/${a.slug}</guid>
      ${a.category ? `<category>${a.category.name}</category>` : ''}
      ${a.featured_image_url ? `<enclosure url="${a.featured_image_url}" type="image/jpeg" />` : ''}
    </item>`).join('');

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>NewsHub</title>
    <link>${baseUrl}</link>
    <description>Latest news from NewsHub - Your trusted source for breaking news and analysis</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

    setXml(rss);
  };

  if (!xml) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-display text-2xl font-bold text-foreground mb-4">RSS Feed</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Subscribe to this feed in your RSS reader: <code className="px-2 py-1 bg-muted rounded text-primary text-xs">{window.location.origin}/rss.xml</code>
        </p>
        <pre className="bg-card border border-border rounded-lg p-4 overflow-x-auto text-xs text-muted-foreground whitespace-pre-wrap">
          {xml}
        </pre>
      </div>
    </div>
  );
}

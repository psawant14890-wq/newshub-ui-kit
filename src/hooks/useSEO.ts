import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: string;
  twitterCard?: string;
  canonicalUrl?: string;
  keywords?: string[];
  jsonLd?: Record<string, any>;
}

export function useSEO({
  title, metaTitle, metaDescription, ogImage, ogUrl,
  ogType = 'article', twitterCard = 'summary_large_image',
  canonicalUrl, keywords, jsonLd
}: SEOProps) {
  useEffect(() => {
    const displayTitle = metaTitle || title;
    if (displayTitle) document.title = `${displayTitle} | NewsHub`;

    const setMeta = (name: string, content: string, isProperty = false) => {
      if (!content) return;
      const attr = isProperty ? 'property' : 'name';
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    if (metaDescription) setMeta('description', metaDescription);
    if (keywords?.length) setMeta('keywords', keywords.join(', '));
    if (displayTitle) setMeta('og:title', displayTitle, true);
    if (metaDescription) setMeta('og:description', metaDescription, true);
    if (ogImage) setMeta('og:image', ogImage, true);
    if (ogUrl) setMeta('og:url', ogUrl, true);
    setMeta('og:type', ogType, true);
    if (displayTitle) setMeta('twitter:title', displayTitle);
    if (metaDescription) setMeta('twitter:description', metaDescription);
    if (ogImage) setMeta('twitter:image', ogImage);
    setMeta('twitter:card', twitterCard);

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (canonicalUrl) {
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.appendChild(canonical);
      }
      canonical.href = canonicalUrl;
    }

    // JSON-LD
    let ldScript = document.querySelector('#article-jsonld') as HTMLScriptElement;
    if (jsonLd) {
      if (!ldScript) {
        ldScript = document.createElement('script');
        ldScript.id = 'article-jsonld';
        ldScript.type = 'application/ld+json';
        document.head.appendChild(ldScript);
      }
      ldScript.textContent = JSON.stringify(jsonLd);
    }

    return () => {
      document.title = 'NewsHub';
      if (ldScript) ldScript.remove();
    };
  }, [title, metaTitle, metaDescription, ogImage, ogUrl, ogType, twitterCard, canonicalUrl, keywords, jsonLd]);
}

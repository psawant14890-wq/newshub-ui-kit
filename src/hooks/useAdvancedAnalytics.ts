import { useEffect, useRef, useCallback } from 'react';
import { trackEvent } from './useAnalytics';
import { useAuth } from '../context/AuthContext';

/**
 * Tracks scroll depth (25%, 50%, 75%, 100%) on an article page.
 */
export function useScrollDepthTracker(slug?: string) {
  const { user } = useAuth();
  const milestones = useRef(new Set<number>());

  useEffect(() => {
    if (!slug) return;
    milestones.current.clear();

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0) return;
      const pct = Math.round((window.scrollY / scrollHeight) * 100);

      [25, 50, 75, 100].forEach(m => {
        if (pct >= m && !milestones.current.has(m)) {
          milestones.current.add(m);
          trackEvent(`scroll_depth_${m}`, slug, user?.id);
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [slug, user?.id]);
}

/**
 * Tracks time spent on page. Fires events at 30s, 60s, 120s, 300s.
 */
export function useTimeOnPageTracker(slug?: string) {
  const { user } = useAuth();
  const startTime = useRef(Date.now());
  const firedRef = useRef(new Set<number>());

  useEffect(() => {
    if (!slug) return;
    startTime.current = Date.now();
    firedRef.current.clear();

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime.current) / 1000);
      [30, 60, 120, 300].forEach(sec => {
        if (elapsed >= sec && !firedRef.current.has(sec)) {
          firedRef.current.add(sec);
          trackEvent(`time_on_page_${sec}s`, slug, user?.id);
        }
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [slug, user?.id]);
}

/**
 * Tracks traffic source from referrer and UTM params.
 */
export function useTrafficSourceTracker(slug?: string) {
  const { user } = useAuth();
  const tracked = useRef(false);

  useEffect(() => {
    if (!slug || tracked.current) return;
    tracked.current = true;

    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get('utm_source');
    const utmMedium = params.get('utm_medium');
    const utmCampaign = params.get('utm_campaign');
    const referrer = document.referrer;

    let source = 'direct';
    if (utmSource) source = utmSource;
    else if (referrer) {
      try {
        const host = new URL(referrer).hostname;
        if (host.includes('google')) source = 'google';
        else if (host.includes('facebook') || host.includes('fb.com')) source = 'facebook';
        else if (host.includes('twitter') || host.includes('t.co')) source = 'twitter';
        else if (host.includes('reddit')) source = 'reddit';
        else source = host;
      } catch { source = 'referral'; }
    }

    trackEvent('traffic_source', slug, user?.id);
    // Store source detail in a separate event with metadata
    trackEvent(`source_${source}`, slug, user?.id);

    if (utmMedium) trackEvent(`utm_medium_${utmMedium}`, slug, user?.id);
    if (utmCampaign) trackEvent(`utm_campaign_${utmCampaign}`, slug, user?.id);
  }, [slug, user?.id]);
}

import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

function getSessionId(): string {
  let sid = sessionStorage.getItem('nh_session');
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem('nh_session', sid);
  }
  return sid;
}

function getDevice(): string {
  return /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
}

export async function trackEvent(
  eventType: string,
  articleSlug?: string,
  userId?: string,
) {
  try {
    await supabase.from('analytics_events').insert({
      event_type: eventType,
      article_slug: articleSlug || null,
      user_id: userId || null,
      session_id: getSessionId(),
      referrer: document.referrer || null,
      device: getDevice(),
    });
  } catch {
    // silently fail
  }
}

export function useTrackPageView(eventType: string, slug?: string) {
  const { user } = useAuth();
  const tracked = useRef(false);

  useEffect(() => {
    if (!tracked.current) {
      tracked.current = true;
      trackEvent(eventType, slug, user?.id);
    }
  }, [eventType, slug, user?.id]);
}

export interface AnalyticsData {
  totalViews: number;
  uniqueVisitors: number;
  totalArticles: number;
  totalComments: number;
  viewsPerDay: { date: string; views: number }[];
  topArticles: { slug: string; title: string; views: number }[];
  categoryBreakdown: { category: string; count: number }[];
  deviceBreakdown: { device: string; count: number }[];
  recentEvents: { event_type: string; article_slug: string; created_at: string }[];
  activeNow: number;
}

export async function fetchAnalytics(): Promise<AnalyticsData> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000).toISOString();
  const fiveMinAgo = new Date(Date.now() - 5 * 60000).toISOString();

  const [eventsRes, articlesRes, commentsRes, recentRes, activeRes] = await Promise.all([
    supabase.from('analytics_events').select('*').gte('created_at', thirtyDaysAgo),
    supabase.from('articles').select('slug, title, views, category').eq('status', 'published'),
    supabase.from('comments').select('id', { count: 'exact', head: true }),
    supabase.from('analytics_events').select('event_type, article_slug, created_at').order('created_at', { ascending: false }).limit(10),
    supabase.from('analytics_events').select('session_id').gte('created_at', fiveMinAgo),
  ]);

  const events = eventsRes.data || [];
  const articles = articlesRes.data || [];

  // Views per day (last 14 days)
  const dayMap = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    dayMap.set(d, 0);
  }
  events.filter(e => e.event_type === 'article_view' && e.created_at >= fourteenDaysAgo)
    .forEach(e => {
      const d = e.created_at.slice(0, 10);
      if (dayMap.has(d)) dayMap.set(d, (dayMap.get(d) || 0) + 1);
    });

  // Category breakdown
  const catMap = new Map<string, number>();
  articles.forEach(a => {
    catMap.set(a.category, (catMap.get(a.category) || 0) + 1);
  });

  // Device breakdown
  const devMap = new Map<string, number>();
  events.forEach(e => {
    const d = e.device || 'unknown';
    devMap.set(d, (devMap.get(d) || 0) + 1);
  });

  // Unique sessions
  const uniqueSessions = new Set(events.map(e => e.session_id)).size;

  // Active now
  const activeSet = new Set((activeRes.data || []).map(e => e.session_id));

  return {
    totalViews: events.filter(e => e.event_type === 'article_view').length,
    uniqueVisitors: uniqueSessions,
    totalArticles: articles.length,
    totalComments: commentsRes.count || 0,
    viewsPerDay: Array.from(dayMap.entries()).map(([date, views]) => ({ date, views })),
    topArticles: [...articles].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5).map(a => ({ slug: a.slug, title: a.title, views: a.views || 0 })),
    categoryBreakdown: Array.from(catMap.entries()).map(([category, count]) => ({ category, count })),
    deviceBreakdown: Array.from(devMap.entries()).map(([device, count]) => ({ device, count })),
    recentEvents: (recentRes.data || []).map(e => ({ event_type: e.event_type, article_slug: e.article_slug || '', created_at: e.created_at })),
    activeNow: activeSet.size,
  };
}

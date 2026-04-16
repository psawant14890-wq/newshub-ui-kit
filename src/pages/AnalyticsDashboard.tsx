import { useState, useEffect } from 'react';
import { BarChart3, Users, FileText, MessageSquare, Activity, ArrowLeft, Eye, Clock, TrendingUp, Globe, Smartphone, Monitor } from 'lucide-react';
import { Navbar, Footer, LoadingSpinner } from '../components';
import { useAuth } from '../context/AuthContext';
import { useRoles } from '../hooks/useRoles';
import { getCategories } from '../lib/api';
import { fetchAnalytics, type AnalyticsData } from '../hooks/useAnalytics';
import { supabase } from '../lib/supabase';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';
import type { Category } from '../types';

const COLORS = ['hsl(160,70%,37%)', 'hsl(217,91%,60%)', 'hsl(263,70%,50%)', 'hsl(25,95%,53%)', 'hsl(340,82%,52%)', 'hsl(47,96%,53%)'];

export function AnalyticsDashboard() {
  const { user } = useAuth();
  const { isEditor } = useRoles();
  const [categories, setCategories] = useState<Category[]>([]);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [scrollData, setScrollData] = useState<{ depth: string; count: number }[]>([]);
  const [timeData, setTimeData] = useState<{ duration: string; count: number }[]>([]);
  const [sourceData, setSourceData] = useState<{ source: string; count: number }[]>([]);

  const isAdmin = isEditor || user?.user_metadata?.role === 'admin' || user?.app_metadata?.role === 'admin';

  const navigate = (path: string) => {
    history.pushState(null, '', path);
    window.dispatchEvent(new Event('popstate'));
  };

  useEffect(() => {
    if (!isAdmin) { navigate('/'); return; }
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  const loadData = async () => {
    const [cats, analytics] = await Promise.all([getCategories(), fetchAnalytics()]);
    setCategories(cats);
    setData(analytics);

    // Fetch advanced analytics
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
    const { data: events } = await supabase
      .from('analytics_events')
      .select('event_type')
      .gte('created_at', thirtyDaysAgo);

    if (events) {
      // Scroll depth breakdown
      const scrollCounts = { '25%': 0, '50%': 0, '75%': 0, '100%': 0 };
      const timeCounts = { '30s': 0, '60s': 0, '2m': 0, '5m': 0 };
      const sourceCounts = new Map<string, number>();

      events.forEach(e => {
        if (e.event_type === 'scroll_depth_25') scrollCounts['25%']++;
        if (e.event_type === 'scroll_depth_50') scrollCounts['50%']++;
        if (e.event_type === 'scroll_depth_75') scrollCounts['75%']++;
        if (e.event_type === 'scroll_depth_100') scrollCounts['100%']++;
        if (e.event_type === 'time_on_page_30s') timeCounts['30s']++;
        if (e.event_type === 'time_on_page_60s') timeCounts['60s']++;
        if (e.event_type === 'time_on_page_120s') timeCounts['2m']++;
        if (e.event_type === 'time_on_page_300s') timeCounts['5m']++;
        if (e.event_type.startsWith('source_')) {
          const src = e.event_type.replace('source_', '');
          sourceCounts.set(src, (sourceCounts.get(src) || 0) + 1);
        }
      });

      setScrollData(Object.entries(scrollCounts).map(([depth, count]) => ({ depth, count })));
      setTimeData(Object.entries(timeCounts).map(([duration, count]) => ({ duration, count })));
      setSourceData(Array.from(sourceCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([source, count]) => ({ source, count })));
    }

    setLoading(false);
  };

  if (!isAdmin) return null;
  if (loading || !data) return <LoadingSpinner fullPage />;

  const statCards = [
    { label: 'Total Views (30d)', value: data.totalViews.toLocaleString(), icon: Eye, color: 'text-primary' },
    { label: 'Unique Visitors', value: data.uniqueVisitors.toLocaleString(), icon: Users, color: 'text-blue-500' },
    { label: 'Published Articles', value: data.totalArticles.toLocaleString(), icon: FileText, color: 'text-purple-500' },
    { label: 'Total Comments', value: data.totalComments.toLocaleString(), icon: MessageSquare, color: 'text-orange-500' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar categories={categories} />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/admin')} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-display text-3xl font-bold text-foreground">Analytics Dashboard</h1>
          <div className="ml-auto flex items-center gap-2 text-sm">
            <Activity className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-foreground font-medium">{data.activeNow} active now</span>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map(s => (
            <div key={s.label} className="p-5 bg-card border border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="p-5 bg-card border border-border rounded-lg">
            <h3 className="text-sm font-semibold text-foreground mb-4">Views per Day (14d)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={data.viewsPerDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => v.slice(5)} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="views" stroke="hsl(160,70%,37%)" fill="hsl(160,70%,37%)" fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="p-5 bg-card border border-border rounded-lg">
            <h3 className="text-sm font-semibold text-foreground mb-4">Top 5 Articles</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.topArticles} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis dataKey="title" type="category" width={120} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => v.length > 20 ? v.slice(0, 20) + '...' : v} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="views" fill="hsl(217,91%,60%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row 2 — Advanced Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Scroll Depth */}
          <div className="p-5 bg-card border border-border rounded-lg">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Scroll Depth
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={scrollData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="depth" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" fill="hsl(263,70%,50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Time on Page */}
          <div className="p-5 bg-card border border-border rounded-lg">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Time on Page
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={timeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="duration" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" fill="hsl(25,95%,53%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Traffic Sources */}
          <div className="p-5 bg-card border border-border rounded-lg">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" /> Traffic Sources
            </h3>
            {sourceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={sourceData} dataKey="count" nameKey="source" cx="50%" cy="50%" outerRadius={70} label={(entry: any) => `${entry.source}: ${entry.count}`}>
                    {sourceData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">No traffic source data yet.</p>
            )}
          </div>
        </div>

        {/* Charts Row 3 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="p-5 bg-card border border-border rounded-lg">
            <h3 className="text-sm font-semibold text-foreground mb-4">Articles by Category</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={data.categoryBreakdown} dataKey="count" nameKey="category" cx="50%" cy="50%" outerRadius={80} label={(entry: any) => `${entry.category}: ${entry.count}`}>
                  {data.categoryBreakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="p-5 bg-card border border-border rounded-lg">
            <h3 className="text-sm font-semibold text-foreground mb-4">Device Breakdown</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={data.deviceBreakdown} dataKey="count" nameKey="device" cx="50%" cy="50%" outerRadius={80} label={(entry: any) => `${entry.device}: ${entry.count}`}>
                  {data.deviceBreakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent events */}
        <div className="p-5 bg-card border border-border rounded-lg">
          <h3 className="text-sm font-semibold text-foreground mb-4">Recent Events</h3>
          <div className="space-y-2">
            {data.recentEvents.map((e, i) => (
              <div key={i} className="flex items-center gap-3 text-sm py-1.5">
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">{e.event_type}</span>
                <span className="text-foreground truncate flex-1">{e.article_slug || '—'}</span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(e.created_at).toLocaleTimeString()}</span>
              </div>
            ))}
            {data.recentEvents.length === 0 && <p className="text-sm text-muted-foreground">No recent events.</p>}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

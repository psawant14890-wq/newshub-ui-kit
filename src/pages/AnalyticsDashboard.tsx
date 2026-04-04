import { useState, useEffect } from 'react';
import { BarChart3, Users, FileText, MessageSquare, Activity, ArrowLeft, Eye } from 'lucide-react';
import { Navbar, Footer, LoadingSpinner } from '../components';
import { useAuth } from '../context/AuthContext';
import { getCategories } from '../lib/api';
import { fetchAnalytics, type AnalyticsData } from '../hooks/useAnalytics';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { Category } from '../types';

const COLORS = ['hsl(160,70%,37%)', 'hsl(217,91%,60%)', 'hsl(263,70%,50%)', 'hsl(25,95%,53%)', 'hsl(340,82%,52%)', 'hsl(47,96%,53%)'];

export function AnalyticsDashboard() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.user_metadata?.role === 'admin' || user?.app_metadata?.role === 'admin';

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

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Views per day */}
          <div className="p-5 bg-card border border-border rounded-lg">
            <h3 className="text-sm font-semibold text-foreground mb-4">Views per Day (14d)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.viewsPerDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => v.slice(5)} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="views" stroke="hsl(160,70%,37%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Top articles */}
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

          {/* Category breakdown */}
          <div className="p-5 bg-card border border-border rounded-lg">
            <h3 className="text-sm font-semibold text-foreground mb-4">Articles by Category</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={data.categoryBreakdown} dataKey="count" nameKey="category" cx="50%" cy="50%" outerRadius={80} label={({ category, count }) => `${category}: ${count}`}>
                  {data.categoryBreakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Device breakdown */}
          <div className="p-5 bg-card border border-border rounded-lg">
            <h3 className="text-sm font-semibold text-foreground mb-4">Device Breakdown</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={data.deviceBreakdown} dataKey="count" nameKey="device" cx="50%" cy="50%" outerRadius={80} label={({ device, count }) => `${device}: ${count}`}>
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

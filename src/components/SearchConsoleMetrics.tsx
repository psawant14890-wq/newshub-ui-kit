import { useEffect, useState } from 'react';
import { Search, MousePointerClick, Eye, TrendingUp, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface Row {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

const SITE_URL = 'https://news-hub-89.lovable.app/';

export function SearchConsoleMetrics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [byDate, setByDate] = useState<Row[]>([]);
  const [byQuery, setByQuery] = useState<Row[]>([]);
  const [byPage, setByPage] = useState<Row[]>([]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dRes, qRes, pRes] = await Promise.all([
        supabase.functions.invoke('gsc-metrics', { body: { siteUrl: SITE_URL, days: 28, dimensions: ['date'] } }),
        supabase.functions.invoke('gsc-metrics', { body: { siteUrl: SITE_URL, days: 28, dimensions: ['query'] } }),
        supabase.functions.invoke('gsc-metrics', { body: { siteUrl: SITE_URL, days: 28, dimensions: ['page'] } }),
      ]);
      const firstErr = dRes.error || qRes.error || pRes.error;
      if (firstErr) throw firstErr;
      setByDate((dRes.data?.rows ?? []) as Row[]);
      setByQuery((qRes.data?.rows ?? []) as Row[]);
      setByPage((pRes.data?.rows ?? []) as Row[]);
    } catch (e: any) {
      const msg = e?.context ? await e.context.text().catch(() => e.message) : e?.message ?? 'Failed to load';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const totals = byDate.reduce(
    (acc, r) => ({
      clicks: acc.clicks + r.clicks,
      impressions: acc.impressions + r.impressions,
      position: acc.position + r.position,
      count: acc.count + 1,
    }),
    { clicks: 0, impressions: 0, position: 0, count: 0 },
  );
  const avgCtr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
  const avgPos = totals.count > 0 ? totals.position / totals.count : 0;

  const chartData = byDate.map(r => ({
    date: r.keys[0],
    clicks: r.clicks,
    impressions: r.impressions,
  }));

  const stats = [
    { label: 'Clicks (28d)', value: totals.clicks.toLocaleString(), icon: MousePointerClick, color: 'text-primary bg-primary/10' },
    { label: 'Impressions', value: totals.impressions.toLocaleString(), icon: Eye, color: 'text-blue-600 dark:text-blue-400 bg-blue-500/10' },
    { label: 'Avg CTR', value: `${avgCtr.toFixed(2)}%`, icon: TrendingUp, color: 'text-purple-600 dark:text-purple-400 bg-purple-500/10' },
    { label: 'Avg Position', value: avgPos.toFixed(1), icon: Search, color: 'text-orange-600 dark:text-orange-400 bg-orange-500/10' },
  ];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" /> Google Search Console
          </h2>
          <p className="text-xs text-muted-foreground">Last 28 days · {SITE_URL}</p>
        </div>
        <button onClick={load} disabled={loading}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all disabled:opacity-50"
          aria-label="Refresh Search Console data">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-2 text-sm">
          <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-destructive">Could not load Search Console data</p>
            <p className="text-xs text-muted-foreground mt-1 break-all">{error}</p>
            <p className="text-xs text-muted-foreground mt-1">Verify the site in Search Console and confirm the connected Google account has access.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="p-4 bg-card border border-border rounded-xl">
            <div className={`inline-flex p-2 rounded-lg mb-2 ${s.color}`}><s.icon className="h-4 w-4" /></div>
            <p className="text-xl font-bold text-foreground">{loading ? '—' : s.value}</p>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {chartData.length > 0 && (
        <div className="p-4 bg-card border border-border rounded-xl">
          <p className="text-sm font-semibold text-foreground mb-3">Clicks & Impressions</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} stroke="hsl(var(--muted-foreground))" />
              <YAxis yAxisId="l" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
              <Line yAxisId="l" type="monotone" dataKey="clicks" stroke="hsl(160,70%,37%)" strokeWidth={2} dot={false} />
              <Line yAxisId="r" type="monotone" dataKey="impressions" stroke="hsl(217,91%,60%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-4 bg-card border border-border rounded-xl">
          <p className="text-sm font-semibold text-foreground mb-3">Top Queries</p>
          {byQuery.length === 0 && !loading ? (
            <p className="text-xs text-muted-foreground">No query data yet.</p>
          ) : (
            <div className="space-y-1.5">
              {byQuery.slice(0, 8).map((r, i) => (
                <div key={i} className="flex items-center justify-between gap-3 text-sm py-1">
                  <span className="text-foreground truncate flex-1">{r.keys[0]}</span>
                  <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                    {r.clicks} clicks · pos {r.position.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 bg-card border border-border rounded-xl">
          <p className="text-sm font-semibold text-foreground mb-3">Top Pages</p>
          {byPage.length === 0 && !loading ? (
            <p className="text-xs text-muted-foreground">No page data yet.</p>
          ) : (
            <div className="space-y-1.5">
              {byPage.slice(0, 8).map((r, i) => (
                <a key={i} href={r.keys[0]} target="_blank" rel="noreferrer"
                  className="flex items-center justify-between gap-3 text-sm py-1 hover:text-primary transition-colors">
                  <span className="truncate flex-1 flex items-center gap-1">
                    <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                    {r.keys[0].replace(SITE_URL, '/') || '/'}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                    {r.clicks} clicks
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

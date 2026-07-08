import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, MousePointerClick, Eye, TrendingUp, ExternalLink, RefreshCw, AlertCircle, CheckCircle2, Circle, Clock, Loader2, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from 'recharts';

interface Row {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

const SITE_URL = 'https://news-hub-89.lovable.app/';
const GSC_PROPERTY_URL = `https://search.google.com/search-console?resource_id=${encodeURIComponent(SITE_URL)}`;
const GSC_ADD_PROPERTY_URL = 'https://search.google.com/search-console/welcome';
const GSC_SITEMAPS_URL = `https://search.google.com/search-console/sitemaps?resource_id=${encodeURIComponent(SITE_URL)}`;

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

type ErrorKind = 'unverified' | 'forbidden' | 'auth' | 'network' | 'unknown';

function classifyError(msg: string): ErrorKind {
  const m = msg.toLowerCase();
  if (m.includes('does not have') || m.includes('not verified') || m.includes('user does not have sufficient permission') || m.includes('permission')) return 'unverified';
  if (m.includes('403') || m.includes('forbidden')) return 'forbidden';
  if (m.includes('401') || m.includes('unauthorized') || m.includes('invalid_grant') || m.includes('credentials')) return 'auth';
  if (m.includes('failed to fetch') || m.includes('network')) return 'network';
  return 'unknown';
}

function GuidanceCard({ title, description, steps, action }: {
  title: string;
  description: string;
  steps: { label: string; href?: string; done?: boolean }[];
  action?: { label: string; href: string };
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm animate-fade-up" style={{ animationDelay: '80ms' }}>
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm">
          <Search className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </div>
      <ol className="mt-6 space-y-3">
        {steps.map((s, i) => (
          <li key={i} className="flex items-start gap-3 text-sm">
            {s.done ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-category-sports" />
            ) : (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-[10px] font-semibold text-muted-foreground">
                {i + 1}
              </div>
            )}
            <div className="flex-1">
              <span className={cn('text-foreground', s.done && 'text-muted-foreground line-through')}>{s.label}</span>
              {s.href && (
                <a href={s.href} target="_blank" rel="noreferrer" className="story-link ml-2 inline-flex items-center gap-1 text-xs font-medium text-primary">
                  Open <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </li>
        ))}
      </ol>
      {action && (
        <a href={action.href} target="_blank" rel="noreferrer"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/25 active:translate-y-0">
          {action.label} <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  );
}

function formatLastUpdated(d: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);
}

function SkeletonCard({ delay = 0 }: { delay?: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm" style={{ animationDelay: `${delay}ms` }}>
      <div className="h-10 w-10 rounded-xl bg-muted animate-shimmer bg-[length:200%_100%]" style={{ backgroundImage: 'linear-gradient(90deg, hsl(var(--muted)) 0%, hsl(var(--card)) 50%, hsl(var(--muted)) 100%)' }} />
      <div className="mt-4 h-7 w-20 rounded-md bg-muted animate-shimmer bg-[length:200%_100%]" style={{ backgroundImage: 'linear-gradient(90deg, hsl(var(--muted)) 0%, hsl(var(--card)) 50%, hsl(var(--muted)) 100%)' }} />
      <div className="mt-2 h-3 w-24 rounded-md bg-muted animate-shimmer bg-[length:200%_100%]" style={{ backgroundImage: 'linear-gradient(90deg, hsl(var(--muted)) 0%, hsl(var(--card)) 50%, hsl(var(--muted)) 100%)' }} />
    </div>
  );
}

function SkeletonRow({ delay = 0 }: { delay?: number }) {
  return (
    <div className="flex items-center gap-3 py-2.5" style={{ animationDelay: `${delay}ms` }}>
      <div className="h-4 w-4 shrink-0 rounded-full bg-muted animate-shimmer bg-[length:200%_100%]" style={{ backgroundImage: 'linear-gradient(90deg, hsl(var(--muted)) 0%, hsl(var(--card)) 50%, hsl(var(--muted)) 100%)' }} />
      <div className="h-4 flex-1 rounded-md bg-muted animate-shimmer bg-[length:200%_100%]" style={{ backgroundImage: 'linear-gradient(90deg, hsl(var(--muted)) 0%, hsl(var(--card)) 50%, hsl(var(--muted)) 100%)' }} />
      <div className="h-4 w-20 rounded-md bg-muted animate-shimmer bg-[length:200%_100%]" style={{ backgroundImage: 'linear-gradient(90deg, hsl(var(--muted)) 0%, hsl(var(--card)) 50%, hsl(var(--muted)) 100%)' }} />
    </div>
  );
}

export function SearchConsoleMetrics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorKind, setErrorKind] = useState<ErrorKind | null>(null);
  const [byDate, setByDate] = useState<Row[]>([]);
  const [byQuery, setByQuery] = useState<Row[]>([]);
  const [byPage, setByPage] = useState<Row[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setErrorKind(null);
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
      setLastUpdated(new Date());
    } catch (e: any) {
      const msg = e?.context ? await e.context.text().catch(() => e.message) : e?.message ?? 'Failed to load';
      const text = typeof msg === 'string' ? msg : JSON.stringify(msg);
      setError(text);
      setErrorKind(classifyError(text));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(() => load(), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  const totals = useMemo(() => byDate.reduce(
    (acc, r) => ({
      clicks: acc.clicks + r.clicks,
      impressions: acc.impressions + r.impressions,
      position: acc.position + r.position,
      count: acc.count + 1,
    }),
    { clicks: 0, impressions: 0, position: 0, count: 0 },
  ), [byDate]);

  const avgCtr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
  const avgPos = totals.count > 0 ? totals.position / totals.count : 0;

  const chartData = useMemo(() => byDate.map(r => ({
    date: r.keys[0],
    clicks: r.clicks,
    impressions: r.impressions,
  })), [byDate]);

  const maxClicks = useMemo(() => Math.max(1, ...byQuery.map(r => r.clicks), ...byPage.map(r => r.clicks)), [byQuery, byPage]);

  const stats = [
    { label: 'Clicks (28d)', value: totals.clicks.toLocaleString(), icon: MousePointerClick, gradient: 'from-primary/20 to-primary/5', iconColor: 'text-primary' },
    { label: 'Impressions', value: totals.impressions.toLocaleString(), icon: Eye, gradient: 'from-blue-500/20 to-blue-500/5', iconColor: 'text-blue-600 dark:text-blue-400' },
    { label: 'Avg CTR', value: `${avgCtr.toFixed(2)}%`, icon: TrendingUp, gradient: 'from-purple-500/20 to-purple-500/5', iconColor: 'text-purple-600 dark:text-purple-400' },
    { label: 'Avg Position', value: avgPos.toFixed(1), icon: Search, gradient: 'from-orange-500/20 to-orange-500/5', iconColor: 'text-orange-600 dark:text-orange-400' },
  ];

  const hasData = byDate.length > 0 || byQuery.length > 0 || byPage.length > 0;
  const showEmptyGuidance = !loading && !error && !hasData;

  const exportCsv = useCallback(() => {
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const header = ['Query / Page', 'Clicks', 'Impressions', 'CTR', 'Position'];
    const rows: string[] = [header.join(',')];

    if (byQuery.length > 0) {
      rows.push('Top Queries');
      byQuery.forEach(r => {
        rows.push([escape(r.keys[0] || ''), r.clicks, r.impressions, `${(r.ctr * 100).toFixed(2)}%`, r.position.toFixed(1)].join(','));
      });
    }

    if (byPage.length > 0) {
      if (byQuery.length > 0) rows.push('');
      rows.push('Top Pages');
      byPage.forEach(r => {
        rows.push([escape(r.keys[0] || ''), r.clicks, r.impressions, `${(r.ctr * 100).toFixed(2)}%`, r.position.toFixed(1)].join(','));
      });
    }

    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `search-console-metrics-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [byQuery, byPage]);

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm">
              <Search className="h-4 w-4" />
            </div>
            <h2 className="font-display text-xl font-bold text-foreground">Google Search Console</h2>
            <span className="hidden h-1.5 w-1.5 rounded-full bg-primary animate-pulse-soft sm:inline-block" aria-hidden="true" />
          </div>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span>Last 28 days · {SITE_URL}</span>
            {lastUpdated && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                <Clock className="h-3 w-3" />
                Updated {formatLastUpdated(lastUpdated)}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCsv} disabled={loading || !hasData}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-accent hover:shadow-md disabled:pointer-events-none disabled:opacity-50 active:translate-y-0">
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button onClick={load} disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/25 disabled:pointer-events-none disabled:opacity-60 active:translate-y-0"
            aria-label="Refresh Search Console metrics">
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            Refresh metrics
          </button>
        </div>
      </div>

      {loading && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} delay={i * 80} />
            ))}
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 h-5 w-32 rounded-md bg-muted animate-shimmer bg-[length:200%_100%]" style={{ backgroundImage: 'linear-gradient(90deg, hsl(var(--muted)) 0%, hsl(var(--card)) 50%, hsl(var(--muted)) 100%)' }} />
            <div className="h-56 w-full rounded-xl bg-muted animate-shimmer bg-[length:200%_100%]" style={{ backgroundImage: 'linear-gradient(90deg, hsl(var(--muted)) 0%, hsl(var(--card)) 50%, hsl(var(--muted)) 100%)' }} />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-4 h-5 w-28 rounded-md bg-muted animate-shimmer bg-[length:200%_100%]" style={{ backgroundImage: 'linear-gradient(90deg, hsl(var(--muted)) 0%, hsl(var(--card)) 50%, hsl(var(--muted)) 100%)' }} />
              {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} delay={i * 60} />)}
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-4 h-5 w-28 rounded-md bg-muted animate-shimmer bg-[length:200%_100%]" style={{ backgroundImage: 'linear-gradient(90deg, hsl(var(--muted)) 0%, hsl(var(--card)) 50%, hsl(var(--muted)) 100%)' }} />
              {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} delay={i * 60 + 80} />)}
            </div>
          </div>
        </div>
      )}

      {error && errorKind === 'unverified' && (
        <GuidanceCard
          title="Verify your site in Google Search Console"
          description="Google can't return data yet because the connected account doesn't have verified access to this property."
          steps={[
            { label: 'Confirm your site is published so the verification meta tag is live in the HTML head.', done: true },
            { label: `Open Search Console and add the property "${SITE_URL}".`, href: GSC_ADD_PROPERTY_URL },
            { label: 'Choose the URL-prefix option and select the "HTML tag" verification method — the tag is already in your <head>.' },
            { label: 'Click "Verify". Once Google confirms ownership, refresh this panel.' },
          ]}
          action={{ label: 'Add property in Search Console', href: GSC_ADD_PROPERTY_URL }}
        />
      )}

      {error && errorKind === 'auth' && (
        <GuidanceCard
          title="Reconnect Google Search Console"
          description="Your Google authorization has expired or was revoked. Reconnect the integration to restore access."
          steps={[
            { label: 'Open your project connectors and disconnect the Google Search Console integration.' },
            { label: 'Reconnect using the same Google account that owns the Search Console property.' },
            { label: 'Return here and click refresh.' },
          ]}
        />
      )}

      {error && (errorKind === 'forbidden' || errorKind === 'unknown' || errorKind === 'network') && (
        <div className="relative overflow-hidden rounded-2xl border border-destructive/30 bg-destructive/10 p-5 animate-fade-up" style={{ animationDelay: '80ms' }}>
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-display font-semibold text-destructive">Could not load Search Console data</p>
              <p className="mt-1 break-all text-xs text-muted-foreground">{error}</p>
              <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-start gap-2"><span className="mt-1.5 h-1 w-1 rounded-full bg-muted-foreground" />Confirm the connected Google account has access to <span className="font-mono">{SITE_URL}</span>.</li>
                <li className="flex items-start gap-2"><span className="mt-1.5 h-1 w-1 rounded-full bg-muted-foreground" />Check that the property exists in Search Console and is verified.</li>
                <li className="flex items-start gap-2"><span className="mt-1.5 h-1 w-1 rounded-full bg-muted-foreground" />Try again in a minute — the API occasionally rate-limits requests.</li>
              </ul>
              <button onClick={load} className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-destructive/15 px-3 py-1.5 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/20">
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg animate-fade-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className={cn('absolute inset-x-0 top-0 h-1 bg-gradient-to-r opacity-70 transition-opacity group-hover:opacity-100', s.gradient)} />
              <div className={cn('inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm transition-transform duration-300 group-hover:scale-110', s.gradient)}>
                <s.icon className={cn('h-5 w-5', s.iconColor)} />
              </div>
              <p className="mt-4 text-2xl font-bold tracking-tight text-foreground">{s.value}</p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {showEmptyGuidance && (
        <GuidanceCard
          title="Waiting for Search Console data"
          description="Your site is verified, but Google hasn't reported any impressions in the last 28 days yet. Speed things up with the steps below."
          steps={[
            { label: 'Submit your sitemap so Google can discover pages.', href: GSC_SITEMAPS_URL },
            { label: 'Request indexing for your homepage and top articles using the URL Inspection tool.', href: GSC_PROPERTY_URL },
            { label: 'Share your site externally — inbound links accelerate crawling.' },
            { label: 'Check back in 2–3 days. Search Console data usually lags 24–48 hours.' },
          ]}
          action={{ label: 'Open Search Console', href: GSC_PROPERTY_URL }}
        />
      )}

      {!loading && chartData.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm animate-fade-up" style={{ animationDelay: '320ms' }}>
          <div className="mb-4 flex items-center justify-between">
            <p className="font-display text-base font-semibold text-foreground">Clicks & Impressions</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Clicks</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500" /> Impressions</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
              <defs>
                <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => v.slice(5)} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
              <YAxis yAxisId="l" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
              <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12, boxShadow: '0 10px 30px -10px rgba(0,0,0,0.15)' }}
                itemStyle={{ fontSize: 12 }}
              />
              <Area yAxisId="l" type="monotone" dataKey="clicks" stroke="hsl(var(--primary))" strokeWidth={2.5} fillOpacity={1} fill="url(#colorClicks)" />
              <Area yAxisId="r" type="monotone" dataKey="impressions" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorImpressions)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm animate-fade-up" style={{ animationDelay: '400ms' }}>
            <p className="mb-4 font-display text-base font-semibold text-foreground">Top Queries</p>
            {byQuery.length === 0 ? (
              <div className="flex items-start gap-3 rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
                <Circle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>No queries yet. Once users find your site through Google, top search terms will appear here.</span>
              </div>
            ) : (
              <div className="space-y-1">
                {byQuery.slice(0, 8).map((r, i) => (
                  <div
                    key={i}
                    className="group rounded-xl px-3 py-2.5 transition-colors hover:bg-accent"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex-1 truncate text-sm font-medium text-foreground">{r.keys[0]}</span>
                      <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
                        {r.clicks} clicks
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
                        style={{ width: `${Math.max(4, (r.clicks / maxClicks) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm animate-fade-up" style={{ animationDelay: '480ms' }}>
            <p className="mb-4 font-display text-base font-semibold text-foreground">Top Pages</p>
            {byPage.length === 0 ? (
              <div className="flex items-start gap-3 rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
                <Circle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>No page impressions yet. Submit your sitemap and request indexing to jump-start discovery.</span>
              </div>
            ) : (
              <div className="space-y-1">
                {byPage.slice(0, 8).map((r, i) => (
                  <a
                    key={i}
                    href={r.keys[0]}
                    target="_blank"
                    rel="noreferrer"
                    className="group block rounded-xl px-3 py-2.5 transition-colors hover:bg-accent"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex flex-1 items-center gap-2 truncate text-sm font-medium text-foreground">
                        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                        {r.keys[0].replace(SITE_URL, '/') || '/'}
                      </span>
                      <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
                        {r.clicks} clicks
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all duration-700 ease-out"
                        style={{ width: `${Math.max(4, (r.clicks / maxClicks) * 100)}%` }}
                      />
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

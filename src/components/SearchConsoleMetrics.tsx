import { useCallback, useEffect, useState } from 'react';
import { Search, MousePointerClick, Eye, TrendingUp, ExternalLink, RefreshCw, AlertCircle, CheckCircle2, Circle, Clock, Loader2, Download } from 'lucide-react';
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
const GSC_PROPERTY_URL = `https://search.google.com/search-console?resource_id=${encodeURIComponent(SITE_URL)}`;
const GSC_ADD_PROPERTY_URL = 'https://search.google.com/search-console/welcome';
const GSC_SITEMAPS_URL = `https://search.google.com/search-console/sitemaps?resource_id=${encodeURIComponent(SITE_URL)}`;

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
    <div className="p-5 bg-card border border-border rounded-xl">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <Search className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-display text-base font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
      </div>
      <ol className="space-y-2.5 mb-4">
        {steps.map((s, i) => (
          <li key={i} className="flex items-start gap-3 text-sm">
            {s.done ? (
              <CheckCircle2 className="h-4 w-4 text-category-sports mt-0.5 shrink-0" />
            ) : (
              <div className="h-5 w-5 rounded-full border border-border flex items-center justify-center text-[10px] font-semibold text-muted-foreground shrink-0">
                {i + 1}
              </div>
            )}
            <div className="flex-1">
              <span className="text-foreground">{s.label}</span>
              {s.href && (
                <a href={s.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 ml-2 text-primary hover:underline text-xs">
                  Open <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </li>
        ))}
      </ol>
      {action && (
        <a href={action.href} target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all">
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
    const interval = setInterval(() => load(), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [load]);

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

  const hasData = byDate.length > 0 || byQuery.length > 0 || byPage.length > 0;
  const showEmptyGuidance = !loading && !error && !hasData;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" /> Google Search Console
          </h2>
          <p className="text-xs text-muted-foreground">
            Last 28 days · {SITE_URL}
            {lastUpdated && (
              <span className="ml-2 inline-flex items-center gap-1 text-muted-foreground/80">
                · Updated {formatLastUpdated(lastUpdated)}
              </span>
            )}
          </p>
        </div>
        <button onClick={load} disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all disabled:opacity-50"
          aria-label="Refresh Search Console metrics">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh metrics
        </button>
      </div>

      {loading && (
        <div className="p-6 bg-card border border-border rounded-xl flex flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span>Loading Search Console metrics…</span>
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
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-3 text-sm">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-destructive">Could not load Search Console data</p>
            <p className="text-xs text-muted-foreground mt-1 break-all">{error}</p>
            <ul className="text-xs text-muted-foreground mt-2 space-y-1 list-disc list-inside">
              <li>Confirm the connected Google account has access to <span className="font-mono">{SITE_URL}</span>.</li>
              <li>Check that the property exists in Search Console and is verified.</li>
              <li>Try again in a minute — the API occasionally rate-limits requests.</li>
            </ul>
            <button onClick={load} className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
              <RefreshCw className="h-3 w-3" /> Retry
            </button>
          </div>
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map(s => (
            <div key={s.label} className="p-4 bg-card border border-border rounded-xl">
              <div className={`inline-flex p-2 rounded-lg mb-2 ${s.color}`}><s.icon className="h-4 w-4" /></div>
              <p className="text-xl font-bold text-foreground">{s.value}</p>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">{s.label}</p>
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

      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-4 bg-card border border-border rounded-xl">
            <p className="text-sm font-semibold text-foreground mb-3">Top Queries</p>
            {byQuery.length === 0 ? (
              <div className="text-xs text-muted-foreground flex items-start gap-2">
                <Circle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>No queries yet. Once users find your site through Google, top search terms will appear here.</span>
              </div>
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
            {byPage.length === 0 ? (
              <div className="text-xs text-muted-foreground flex items-start gap-2">
                <Circle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>No page impressions yet. Submit your sitemap and request indexing to jump-start discovery.</span>
              </div>
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
      )}
    </section>
  );
}

import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const GATEWAY = 'https://connector-gateway.lovable.dev/google_search_console';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  const GSC_KEY = Deno.env.get('GOOGLE_SEARCH_CONSOLE_API_KEY');
  if (!LOVABLE_API_KEY || !GSC_KEY) {
    return new Response(JSON.stringify({ error: 'Missing gateway credentials' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const headers = {
    'Authorization': `Bearer ${LOVABLE_API_KEY}`,
    'X-Connection-Api-Key': GSC_KEY,
    'Content-Type': 'application/json',
  };

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') ?? 'summary';

    if (action === 'sites') {
      const r = await fetch(`${GATEWAY}/webmasters/v3/sites`, { headers });
      const body = await r.text();
      return new Response(body, { status: r.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // summary: query analytics for a site
    const { siteUrl, days = 28, dimensions = ['date'] } = await req.json().catch(() => ({}));
    if (!siteUrl) {
      return new Response(JSON.stringify({ error: 'siteUrl is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const end = new Date();
    const start = new Date(Date.now() - days * 86400000);
    const iso = (d: Date) => d.toISOString().slice(0, 10);

    const encoded = encodeURIComponent(siteUrl);
    const r = await fetch(`${GATEWAY}/webmasters/v3/sites/${encoded}/searchAnalytics/query`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        startDate: iso(start),
        endDate: iso(end),
        dimensions,
        rowLimit: 25,
      }),
    });

    const body = await r.text();
    if (!r.ok) {
      console.error(`GSC gateway failed [${r.status}]: ${body}`);
      return new Response(JSON.stringify({ error: 'Search Console request failed', status: r.status, details: body }), {
        status: r.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    return new Response(body, { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('gsc-metrics error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

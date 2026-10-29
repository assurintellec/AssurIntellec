// Persistent, first-party visit counting. Enquiry/mail integrations are independent.
const VISIT_WINDOW_MS = 30 * 60 * 1000;
const COOKIE = 'assurintellec_visit';
const validToken = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{20,100}$/.test(value);
const integer = value => Number.isSafeInteger(Number(value)) && Number(value) >= 0 ? Number(value) : 0;

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), { status, headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store, max-age=0',
    'x-content-type-options': 'nosniff',
    ...extraHeaders
  }});
}

export class VisitorCounter {
  constructor(ctx) {
    this.storage = ctx.storage;
    this.sql = ctx.storage.sql;
    this.sql.exec('CREATE TABLE IF NOT EXISTS totals (id INTEGER PRIMARY KEY CHECK (id = 1), visits INTEGER NOT NULL)');
    this.sql.exec('INSERT OR IGNORE INTO totals (id, visits) VALUES (1, 0)');
    this.sql.exec('CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, expires INTEGER NOT NULL)');
    this.sql.exec('CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions (expires)');
  }

  async fetch(request) {
    if (request.method === 'GET') {
      return json({ value: this.sql.exec('SELECT visits FROM totals WHERE id = 1').one().visits });
    }
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405, { allow: 'GET, POST' });
    const { token } = await request.json();
    if (!validToken(token)) return json({ error: 'Invalid visit token' }, 400);
    const now = Date.now();
    // Synchronous transaction: duplicate retries and concurrent page requests
    // cannot increment the same session twice or lose another visitor's increment.
    const value = this.storage.transactionSync(() => {
      this.sql.exec('DELETE FROM sessions WHERE expires <= ?', now);
      const seen = this.sql.exec('SELECT token FROM sessions WHERE token = ?', token).toArray().length > 0;
      if (!seen) this.sql.exec('UPDATE totals SET visits = visits + 1 WHERE id = 1');
      this.sql.exec('INSERT INTO sessions (token, expires) VALUES (?, ?) ON CONFLICT(token) DO UPDATE SET expires = excluded.expires', token, now + VISIT_WINDOW_MS);
      return this.sql.exec('SELECT visits FROM totals WHERE id = 1').one().visits;
    });
    return json({ value });
  }
}

export async function handleVisitorCounter(request, env) {
  if (!['GET', 'POST'].includes(request.method)) return json({ error: 'Method not allowed' }, 405, { allow: 'GET, POST' });
  const url = new URL(request.url);
  const origin = request.headers.get('origin');
  if ((origin && origin !== url.origin) || request.headers.get('sec-fetch-site') === 'cross-site') {
    return json({ error: 'Origin not allowed' }, 403);
  }
  if (!env.VISITOR_COUNTER) return json({ error: 'Visitor storage binding is missing' }, 503);
  try {
    // Read the published CMS settings server-side, never an arbitrary client key.
    const settingsResponse = await env.ASSETS.fetch(new Request(new URL('/content/site.json', url)));
    if (!settingsResponse.ok) throw new Error('Cannot read published site settings');
    const cfg = (await settingsResponse.json()).visitor_counter || {};
    if (cfg.enabled === false) return json({ enabled: false });
    const identity = JSON.stringify([cfg.namespace || 'assurintellec.in', cfg.action || 'view', cfg.key || 'website-visitors']);
    const stub = env.VISITOR_COUNTER.get(env.VISITOR_COUNTER.idFromName(identity));
    let token;
    if (request.method === 'POST') {
      if (!request.headers.get('content-type')?.startsWith('application/json')) return json({ error: 'JSON required' }, 415);
      if (Number(request.headers.get('content-length')) > 1024) return json({ error: 'Request too large' }, 413);
      const body = await request.text();
      if (body.length > 1024) return json({ error: 'Request too large' }, 413);
      let data;
      try { data = JSON.parse(body); } catch (_) { return json({ error: 'Invalid JSON' }, 400); }
      const cookie = (request.headers.get('cookie') || '').split(';').map(x => x.trim()).find(x => x.startsWith(COOKIE + '='))?.slice(COOKIE.length + 1);
      token = validToken(cookie) ? cookie : data?.visit_id;
      if (!validToken(token)) return json({ error: 'Invalid visit token' }, 400);
    }
    const result = await stub.fetch(new Request('https://visitor.internal/', {
      method: request.method,
      ...(token ? { headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token }) } : {})
    }));
    if (!result.ok) throw new Error('Visitor storage request failed');
    const { value } = await result.json();
    const startValue = integer(cfg.start_value);
    return json({ value, start_value: startValue, total: startValue + value }, 200, token ? {
      'set-cookie': `${COOKIE}=${token}; Path=/; Max-Age=1800; HttpOnly; SameSite=Lax${url.protocol === 'https:' ? '; Secure' : ''}`
    } : {});
  } catch (error) {
    console.error('Visitor counter:', error.message);
    return json({ error: 'Visitor count is being refreshed' }, 503);
  }
}

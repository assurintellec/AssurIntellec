import { canonicalScriptUrl, getSiteConfig, readBoundedJson, jsonReply } from './newsletter-proxy.js';
const idPattern = /^[a-zA-Z0-9_-]{16,80}$/;
const clean = (value, limit = 120) => String(value || '').replace(/[\x00-\x1f\x7f]/g, '').slice(0, limit);
export function normalizeAnalytics(data, request, cfg, now = Date.now()) {
  if (!idPattern.test(data.page_id || '') || !idPattern.test(data.session_id || '') || data.consent !== 'yes') throw new Error('Invalid analytics.');
  const path = clean(data.path, 220).split(/[?#]/)[0];
  if (!path.startsWith('/') || path.startsWith('//') || /^\/(admin|api|integrations)(\/|$)/.test(path)) throw new Error('Invalid path.');
  const sequence = Number(data.sequence), seconds = Number(data.active_seconds), started = Number(data.started_at);
  if (!Number.isInteger(sequence) || sequence < 1 || sequence > 100000 || !Number.isFinite(seconds) || seconds < 0 || !Number.isFinite(started) || started > now + 60000 || started < now - 7 * 86400000) throw new Error('Invalid timing.');
  const sections = Array.isArray(data.sections) ? data.sections.slice(0, 35).map(item => clean(item, 90)).filter(Boolean) : [];
  const cf = request.cf || {};
  let referrer = '';
  try { const url = new URL(data.referrer); if (['https:', 'http:'].includes(url.protocol)) referrer = url.origin; } catch (_) {}
  return {
    page_id: data.page_id, session_id: data.session_id, started_at: Math.min(started, now),
    sequence, active_seconds: Math.floor(Math.min(seconds, Math.max(0, (now - started) / 1000), 7 * 86400)),
    path, title: clean(data.title, 160), sections: [...new Set(sections)], referrer,
    // Never trust IP/location supplied by browser JSON or X-Forwarded-For.
    ip: cfg.collect_ip === false ? '' : clean(request.headers.get('cf-connecting-ip'), 64),
    city: clean(cf.city), region: clean(cf.region), country: clean(cf.country, 3), timezone: clean(cf.timezone),
    device: ['mobile', 'tablet', 'desktop'].includes(data.device) ? data.device : 'unknown', consent: 'yes'
  };
}
export async function handleAnalyticsRequest(request, env) {
  if (request.method !== 'POST') return jsonReply({ success: false }, 405);
  if (request.headers.get('origin') !== new URL(request.url).origin) return jsonReply({ success: false }, 403);
  try {
    const site = await getSiteConfig(request, env), cfg = site.visitor_analytics || {};
    if (cfg.enabled === false) return jsonReply({ success: false, code: 'DISABLED' }, 403);
    if (String(request.headers.get('sec-gpc') || '') === '1' || request.headers.get('dnt') === '1') return jsonReply({ success: false, code: 'OPTED_OUT' }, 403);
    const secret = String(env.ANALYTICS_BRIDGE_TOKEN || '');
    const endpoint = canonicalScriptUrl(cfg.google_apps_script_url || site.newsletter?.google_apps_script_url);
    if (secret.length < 32 || !endpoint) return jsonReply({ success: false, code: 'SETUP_REQUIRED' }, 503);
    const data = await readBoundedJson(request, 8192);
    let payload;
    try { payload = normalizeAnalytics(data, request, cfg); } catch (_) { return jsonReply({ success: false }, 400); }
    const upstream = await fetch(endpoint, {
      method: 'POST', redirect: 'follow', signal: AbortSignal.timeout(20000),
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ action: 'analytics', bridge_secret: secret, payload: JSON.stringify(payload) })
    });
    const result = await upstream.json();
    return upstream.ok && result.success === true ? jsonReply({ success: true }) : jsonReply({ success: false }, 502);
  } catch (_) { return jsonReply({ success: false }, 502); }
}

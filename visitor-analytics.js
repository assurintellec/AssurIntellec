import { canonicalScriptUrl, getSiteConfig, readBoundedJson, jsonReply } from './newsletter-proxy.js';
import { handleVisitorCounter } from './visitor-counter.js';
export const ANALYTICS_PROTOCOL = '2026-11-02-v4';
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
  if (request.method === 'GET' && new URL(request.url).searchParams.get('action') === 'health') return analyticsHealth(request, env);
  if (request.method !== 'POST') return jsonReply({ success: false, code: 'USE_POST' }, 405);
  if (request.headers.get('origin') !== new URL(request.url).origin) return jsonReply({ success: false }, 403);
  try {
    const site = await getSiteConfig(request, env), cfg = site.visitor_analytics || {};
    if (cfg.enabled === false) return jsonReply({ success: false, code: 'DISABLED' }, 403);
    if (String(request.headers.get('sec-gpc') || '') === '1' || request.headers.get('dnt') === '1') return jsonReply({ success: false, code: 'OPTED_OUT' }, 403);
    const secret = String(env.ANALYTICS_BRIDGE_TOKEN || '');
    const endpoint = canonicalScriptUrl(cfg.google_apps_script_url || site.newsletter?.google_apps_script_url);
    if (secret.length < 32) return jsonReply({ success: false, code: 'MISSING_BRIDGE_SECRET' }, 503);
    if (!endpoint) return jsonReply({ success: false, code: 'MISSING_GOOGLE_URL' }, 503);
    const data = await readBoundedJson(request, 8192);
    let payload;
    try { payload = normalizeAnalytics(data, request, cfg); } catch (_) { return jsonReply({ success: false }, 400); }
    // Server-side snapshot: do not trust a browser-supplied website total.
    try {
      const response = await handleVisitorCounter(new Request(new URL('/api/visitor-count', request.url)), env);
      const counter = await response.json();
      if (response.ok && Number.isSafeInteger(counter.total) && Number.isSafeInteger(counter.value) && Number.isSafeInteger(counter.start_value)) {
        payload.counter = { total: counter.total, new_visits: counter.value, start_value: counter.start_value };
      }
    } catch (_) { /* Detailed visits can still be saved if the counter is offline. */ }
    const upstream = await fetch(endpoint, {
      method: 'POST', redirect: 'follow', signal: AbortSignal.timeout(20000),
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ action: 'analytics', bridge_secret: secret, payload: JSON.stringify(payload) })
    });
    const result = await upstream.json();
    return upstream.ok && result.success === true ? jsonReply({ success: true, protocol: ANALYTICS_PROTOCOL }) : jsonReply({ success: false, code: 'CHECK_GOOGLE_ANALYTICS' }, 502);
  } catch (_) { return jsonReply({ success: false, code: 'GOOGLE_CONNECTION_FAILED' }, 502); }
}

async function analyticsHealth(request, env) {
  const reply = (ready, code, message) => jsonReply({ service: 'assurintellec-visitor-analytics', protocol: ANALYTICS_PROTOCOL, ready, code, message });
  try {
    const site = await getSiteConfig(request, env), cfg = site.visitor_analytics || {};
    if (cfg.enabled === false) return reply(false, 'DISABLED', 'Enable Visitor Analytics & Google Sheets in Decap.');
    const secret = String(env.ANALYTICS_BRIDGE_TOKEN || '');
    if (secret.length < 32) return reply(false, 'MISSING_BRIDGE_SECRET', 'Copy ANALYTICS_BRIDGE_TOKEN from the newsletter Apps Script properties to the main website Worker secret settings, then redeploy.');
    const endpoint = canonicalScriptUrl(cfg.google_apps_script_url || site.newsletter?.google_apps_script_url);
    if (!endpoint) return reply(false, 'MISSING_GOOGLE_URL', 'Set the newsletter or visitor analytics Google /exec URL in Decap.');
    const upstream = await fetch(endpoint, { method: 'POST', redirect: 'follow', signal: AbortSignal.timeout(15000), headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ action: 'analytics_health', bridge_secret: secret }) });
    const result = await upstream.json();
    if (result.code === 'BRIDGE_AUTH_FAILED') return reply(false, 'BRIDGE_AUTH_FAILED', 'The private ANALYTICS_BRIDGE_TOKEN must match in the newsletter project and the main website Worker.');
    if (result.protocol !== ANALYTICS_PROTOCOL) return reply(false, 'UPDATE_GOOGLE_DEPLOYMENT', 'Replace the newsletter Code.gs and VisitorAnalytics.gs, run setupWebsiteUpdate, and deploy a NEW VERSION of the SAME web app as Me / Anyone.');
    if (!upstream.ok || result.ready !== true) return reply(false, 'RUN_ANALYTICS_SETUP', 'Run setupWebsiteUpdate in the newsletter project to create the visitor sheets and total/period reports, then redeploy its web app.');
    return reply(true, 'READY', 'Google visitor sheets and total/rolling reports are ready. A visitor must allow insights before their detailed visit/IP is recorded.');
  } catch (_) {
    return reply(false, 'GOOGLE_CONNECTION_FAILED', 'Check the /exec URL and public web-app deployment (execute as Me, access Anyone). Saving Apps Script code alone does not update its deployment.');
  }
}

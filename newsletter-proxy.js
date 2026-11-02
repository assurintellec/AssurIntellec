// The browser only talks to this website; Google requests carry no browser cookies.
export const NEWSLETTER_PROTOCOL = '2026-11-02-v3';
export const SCRIPT_ORIGIN = 'https://www.assurintellec.in';
const ENDPOINT = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/;
const INTERESTS = ['all', 'gmp-engineering', 'advisory-transactions', 'talent-recruitment', 'life-sciences-trade', 'pharma-laboratory-technologies', 'research-scientific-services', 'pharma-solutions-manufacturing'];
export const jsonReply = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' }
});
export function canonicalScriptUrl(value) {
  const url = String(value || '').trim().replace(/\/macros\/u\/\d+\/s\//, '/macros/s/');
  return ENDPOINT.test(url) ? url : '';
}
export async function readBoundedJson(request, limit) {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new Error('Expected JSON.');
  let length = 0, text = '';
  const decoder = new TextDecoder();
  if (request.body) {
    const reader = request.body.getReader();
    while (true) {
      const part = await reader.read(); if (part.done) break;
      length += part.value.byteLength;
      if (length > limit) { await reader.cancel(); throw new Error('Request too large.'); }
      text += decoder.decode(part.value, { stream: true });
    }
  }
  const data = JSON.parse(text + decoder.decode());
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid request.');
  return data;
}
export async function getSiteConfig(request, env) {
  const config = await env.ASSETS.fetch(new Request(new URL('/content/site.json', request.url)));
  if (!config.ok) throw new Error('Configuration unavailable.');
  return config.json();
}
const validEmail = value => value.length <= 254 && /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i.test(value) && !value.split('@')[0].startsWith('.') && !value.split('@')[0].endsWith('.') && !value.split('@')[0].includes('..');
export async function handleNewsletterRequest(request, env) {
  if (request.method === 'GET' && new URL(request.url).searchParams.get('action') === 'health') {
    try {
      const site = await getSiteConfig(request, env);
      const endpoint = canonicalScriptUrl(site.newsletter?.google_apps_script_url);
      if (!endpoint) throw new Error('Missing URL.');
      const response = await fetch(endpoint + '?action=health', { redirect: 'follow', signal: AbortSignal.timeout(12000) });
      const backend = await response.json();
      const ready = response.ok && backend.service === 'assurintellec-newsletter' && backend.protocol === NEWSLETTER_PROTOCOL && backend.ready === true;
      return jsonReply({ service: 'assurintellec-newsletter-website', protocol: NEWSLETTER_PROTOCOL, ready, code: ready ? 'READY' : 'UPDATE_GOOGLE_DEPLOYMENT', message: ready ? 'Website and Google newsletter deployment are ready.' : 'Run setupWebsiteUpdate and deploy a new version of the SAME newsletter web app as Me / Anyone.' });
    } catch (_) {
      return jsonReply({ ready: false, code: 'CHECK_GOOGLE_DEPLOYMENT', message: 'Check the newsletter /exec URL and deploy the updated Google web app as Me / Anyone. Saving the script alone does not update the deployment.' });
    }
  }
  if (request.method !== 'POST') return jsonReply({ success: false, message: 'Use POST.' }, 405);
  if (request.headers.get('origin') !== new URL(request.url).origin) return jsonReply({ success: false, message: 'Use the form on this website.' }, 403);
  let data;
  try { data = await readBoundedJson(request, 4096); }
  catch (_) { return jsonReply({ success: false, message: 'Invalid or oversized request.' }, 400); }
  const subscribing = data.action === 'subscribe';
  if (!subscribing && data.action !== 'unsubscribe') return jsonReply({ success: false, message: 'Invalid request.' }, 400);
  let payload;
  if (subscribing) {
    const email = String(data.email || '').trim().toLowerCase(), interest = String(data.interest || '');
    if (data.consent !== 'yes' || !validEmail(email) || !INTERESTS.includes(interest) || String(data.company_site_confirm || '').trim()) return jsonReply({ success: false, message: 'Please check your email, selected updates and consent.' }, 400);
    const source = data.source === 'enquiry' ? 'enquiry' : 'newsletter';
    const path = String(data.source_page || '/').split(/[?#]/)[0];
    payload = { action: 'subscribe', email, interest, consent: 'yes', company_site_confirm: '', source_page: path.startsWith('/') && !path.startsWith('//') ? path.slice(0, 200) + (source === 'enquiry' ? '#enquiry-newsletter' : '#newsletter') : '/' };
  } else {
    if (!/^[a-f0-9]{64}$/.test(String(data.token || ''))) return jsonReply({ success: false, message: 'This unsubscribe link is invalid.' }, 400);
    payload = { action: 'unsubscribe', token: data.token };
  }
  try {
    const site = await getSiteConfig(request, env);
    const endpoint = canonicalScriptUrl(site.newsletter?.google_apps_script_url);
    if (!endpoint) return jsonReply({ success: false, message: 'The newsletter service needs its public web-app URL configured.' }, 503);
    if (subscribing && (site.newsletter?.enabled === false || (data.source === 'enquiry' && site.newsletter?.enquiry_optin_enabled === false))) return jsonReply({ success: false, message: 'This subscription form is currently disabled.' }, 403);
    const upstream = await fetch(endpoint, {
      method: 'POST', redirect: 'follow', signal: AbortSignal.timeout(25000),
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ ...payload, _bridge_origin: SCRIPT_ORIGIN, _bridge_format: 'json' })
    });
    const result = await upstream.json();
    if (!upstream.ok || typeof result.success !== 'boolean') throw new Error('Invalid Google response.');
    return jsonReply({ success: result.success, message: String(result.message || (subscribing ? 'Your newsletter preferences have been saved.' : 'You have been unsubscribed from service updates.')).slice(0, 300) });
  } catch (_) {
    return jsonReply({ success: false, message: 'We could not confirm this request. Please retry or contact info@assurintellec.in. The Google web app must allow Anyone and run as its owner.' }, 502);
  }
}

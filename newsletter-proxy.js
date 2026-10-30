// Newsletter requests stay on the website. Google is contacted by the
// Worker without browser account cookies, avoiding account-specific /u/2 URLs.
const ENDPOINT = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/;
const INTERESTS = ['all', 'gmp-engineering', 'advisory-transactions', 'talent-recruitment', 'life-sciences-trade', 'pharma-laboratory-technologies', 'research-scientific-services', 'pharma-solutions-manufacturing'];
const validEmail = value => value.length <= 254 && /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i.test(value) && !value.split('@')[0].startsWith('.') && !value.split('@')[0].endsWith('.') && !value.split('@')[0].includes('..');
const reply = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' }
});

export async function handleNewsletterRequest(request, env) {
  if (request.method !== 'POST') return reply({ success: false, message: 'Use POST.' }, 405);
  const origin = new URL(request.url).origin;
  if (request.headers.get('origin') !== origin) return reply({ success: false, message: 'Use the form on this website.' }, 403);
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return reply({ success: false, message: 'Expected JSON.' }, 415);
  try {
    let body = '', length = 0;
    const decoder = new TextDecoder();
    if (request.body) {
      const reader = request.body.getReader();
      while (true) {
        const part = await reader.read(); if (part.done) break;
        length += part.value.byteLength;
        if (length > 2048) { await reader.cancel(); return reply({ success: false, message: 'Request too large.' }, 413); }
        body += decoder.decode(part.value, { stream: true });
      }
    }
    body += decoder.decode();
    let data;
    try { data = JSON.parse(body); } catch (_) { return reply({ success: false, message: 'Invalid request.' }, 400); }
    if (!data || typeof data !== 'object') return reply({ success: false, message: 'Invalid request.' }, 400);
    if (!['subscribe', 'unsubscribe'].includes(data.action)) return reply({ success: false, message: 'Invalid request.' }, 400);
    const subscribing = data.action === 'subscribe';
    let payload;
    if (subscribing) {
      const email = String(data.email || '').trim().toLowerCase();
      const interest = String(data.interest || '');
      if (data.consent !== 'yes' || !validEmail(email) || !INTERESTS.includes(interest) || String(data.company_site_confirm || '').trim()) return reply({ success: false, message: 'Please check your email, selected updates and consent.' }, 400);
      // Forward only newsletter fields. Enquiry messages, names and phone
      // numbers stay in the existing enquiry system.
      payload = { action: 'subscribe', email, interest, consent: 'yes', company_site_confirm: '', source_page: '/contact.html#enquiry-newsletter' };
    } else {
      if (!/^[a-f0-9]{64}$/.test(String(data.token || ''))) return reply({ success: false, message: 'This unsubscribe link is invalid.' }, 400);
      payload = { action: 'unsubscribe', token: data.token };
    }
    const configResponse = await env.ASSETS.fetch(new Request(new URL('/content/site.json', request.url)));
    if (!configResponse.ok) throw new Error('Configuration unavailable.');
    const site = await configResponse.json();
    const endpoint = String(site.newsletter?.google_apps_script_url || '').trim().replace(/\/macros\/u\/\d+\/s\//, '/macros/s/');
    if (!ENDPOINT.test(endpoint)) return reply({ success: false, message: 'Please contact the team about your newsletter preferences.' }, 503);
    if (subscribing && site.newsletter?.enquiry_optin_enabled === false) return reply({ success: false, message: 'Newsletter signup from enquiries is currently disabled.' }, 403);
    const upstream = await fetch(endpoint, {
      method: 'POST', redirect: 'follow', signal: AbortSignal.timeout(25000),
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ ...payload, _bridge_origin: origin, _bridge_format: 'json' })
    });
    if (!upstream.ok) throw new Error('The subscription service could not be reached.');
    const result = await upstream.json();
    if (typeof result.success !== 'boolean') throw new Error('The subscription service must be updated.');
    return reply({ success: result.success, message: result.success ? (subscribing ? 'Your newsletter preferences have been saved.' : 'You have been unsubscribed from service updates.') : String(result.message || 'We could not confirm your newsletter request.').slice(0, 300) });
  } catch (_) {
    return reply({ success: false, message: 'We could not confirm your newsletter request. Please try again or contact info@assurintellec.in.' }, 502);
  }
}

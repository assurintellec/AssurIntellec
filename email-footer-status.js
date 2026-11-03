// Read-only version checks. This endpoint never sends email or exposes settings.
import { canonicalScriptUrl, getSiteConfig, jsonReply } from './newsletter-proxy.js';

export const EMAIL_FOOTER_VERSION = '2026-11-03-icons-only-v4';

async function checkTemplate(endpoint, service) {
  const url = canonicalScriptUrl(endpoint);
  if (!url) return { ready: false, code: 'CHECK_CONFIGURED_URL' };
  try {
    const response = await fetch(url + '?action=email_footer_status', {
      method: 'GET', redirect: 'follow', headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(12000)
    });
    if (!response.ok) return { ready: false, code: 'CHECK_WEB_APP_ACCESS' };
    const text = await response.text();
    if (text.length > 16384) return { ready: false, code: 'UPDATE_WEB_APP_DEPLOYMENT' };
    let data;
    try { data = JSON.parse(text); } catch (_) { return { ready: false, code: 'UPDATE_WEB_APP_DEPLOYMENT' }; }
    const f = data.footer || {};
    const ready = data.service === service && f.version === EMAIL_FOOTER_VERSION && f.rows === 3 && f.columns === 3 && f.icons === 9 && f.visible_labels === false;
    // Never forward arbitrary fields, response text, IDs, URLs or private data.
    return { ready, code: ready ? 'READY' : 'UPDATE_WEB_APP_DEPLOYMENT', version: f.version === EMAIL_FOOTER_VERSION ? EMAIL_FOOTER_VERSION : null };
  } catch (_) { return { ready: false, code: 'CHECK_WEB_APP_DEPLOYMENT' }; }
}

export async function handleEmailFooterStatus(request, env) {
  if (request.method !== 'GET') return jsonReply({ ready: false, code: 'USE_GET' }, 405);
  try {
    const site = await getSiteConfig(request, env);
    const [enquiry, newsletter] = await Promise.all([
      checkTemplate(site.contact?.google_apps_script_url, 'assurintellec-enquiry'),
      checkTemplate(site.newsletter?.google_apps_script_url, 'assurintellec-newsletter')
    ]);
    return jsonReply({ expected_version: EMAIL_FOOTER_VERSION, ready: enquiry.ready && newsletter.ready, enquiry, newsletter });
  } catch (_) { return jsonReply({ ready: false, code: 'CHECK_WEBSITE_CONFIG' }); }
}

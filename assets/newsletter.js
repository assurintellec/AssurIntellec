(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AssurNewsletter = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  const defaults = {
    enabled: true,
    eyebrow: 'NEWSLETTER & SERVICE UPDATES',
    title: 'Stay connected with AssurIntellec™',
    description: 'Choose the service updates you want to receive, including news, insights and opportunities.',
    email_label: 'Email address', email_placeholder: 'you@example.com',
    interest_label: 'Updates you are interested in', interest_placeholder: 'Choose your interest',
    all_services_label: 'All service updates', include_all_services: true,
    consent_label: 'I agree to receive the selected updates from AssurIntellec. I can unsubscribe at any time.',
    submit_label: 'Subscribe', submitting_label: 'Saving…',
    success_message: 'Thank you! Your email and selected interest have been saved.',
    error_message: 'We could not confirm your subscription. Please try again or contact us.',
    setup_message: 'Newsletter subscriptions will open soon.',
    privacy_note: 'We use your email for the updates you select. You can unsubscribe or contact our team to opt out.',
    google_apps_script_url: ''
  };
  function canonicalEndpoint(value) { return String(value || '').trim().replace(/\/macros\/u\/\d+\/s\//, '/macros/s/'); }
  function endpoint(value) { return /^https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_-]+\/exec$/.test(canonicalEndpoint(value)); }
  function options(services, cfg) {
    const records = (Array.isArray(services) ? services : []).filter(s => s && s.enabled !== false && s.slug && s.title);
    return [...(cfg.include_all_services !== false ? [{ value: 'all', label: cfg.all_services_label }] : []), ...records.map(s => ({ value: s.slug, label: s.title }))];
  }
  function googleOrigin(origin) {
    try { const url = new URL(origin); return url.protocol === 'https:' && (url.hostname === 'script.google.com' || url.hostname === 'script.googleusercontent.com' || /^[a-z0-9-]+-script\.googleusercontent\.com$/.test(url.hostname)); } catch (_) { return false; }
  }
  function bridgeRequest(url, payload, action) {
    return new Promise((resolve, reject) => {
      const token = window.crypto.randomUUID();
      const frame = document.createElement('iframe');
      const form = document.createElement('form');
      frame.name = 'assurNewsletter_' + token.replace(/-/g, '');
      frame.title = 'Newsletter subscription response';
      frame.hidden = true;
      frame.setAttribute('aria-hidden', 'true');
      form.method = 'POST'; form.action = canonicalEndpoint(url); form.target = frame.name; form.hidden = true;
      const cleanup = () => { clearTimeout(timer); window.removeEventListener('message', onMessage); form.remove(); frame.remove(); };
      const onMessage = event => {
        const data = event.data || {};
        if (!googleOrigin(event.origin) || data.type !== 'assurintellec:newsletter:result' || data.token !== token || typeof data.result?.success !== 'boolean') return;
        cleanup(); resolve(data.result);
      };
      const timer = setTimeout(() => { cleanup(); reject(new Error('Subscription confirmation timed out.')); }, 45000);
      window.addEventListener('message', onMessage);
      for (const [name, value] of Object.entries({ ...payload, action, _bridge_format: 'html', _bridge_token: token, _bridge_origin: window.location.origin })) {
        const input = document.createElement('input'); input.type = 'hidden'; input.name = name; input.value = String(value); form.append(input);
      }
      document.body.append(frame, form);
      try { form.submit(); } catch (error) { cleanup(); reject(error); }
      // An iframe load is NOT proof that Google saved a subscriber. Only the
      // validated server reply above can display a successful subscription.
    });
  }
  function subscribe(url, payload) { return bridgeRequest(url, payload, 'subscribe'); }
  async function unsubscribe(url, token) {
    if (!/^[a-f0-9]{64}$/.test(token)) throw new Error('Invalid unsubscribe link.');
    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST', headers: { 'content-type': 'application/json' }, credentials: 'same-origin',
        body: JSON.stringify({ action: 'unsubscribe', token }), signal: AbortSignal.timeout(30000)
      });
      const result = await response.json();
      if (typeof result.success !== 'boolean') throw new Error('Unsubscribe could not be confirmed.');
      if (response.ok || response.status === 400) return result;
      throw new Error(result.message || 'Unsubscribe could not be confirmed.');
    } catch (error) {
      // Static hosts sometimes return a 200 HTML page for /api/*; failures also
      // include network errors and an older Worker. Retry this idempotent action
      // through the existing bridge, requiring a verified server response.
      if (endpoint(url)) return bridgeRequest(url, { token }, 'unsubscribe');
      throw error;
    }
  }
  let unsubscribeEndpoint = '';
  function initUnsubscribe(site = {}) {
    if (endpoint(site.newsletter?.google_apps_script_url)) unsubscribeEndpoint = canonicalEndpoint(site.newsletter.google_apps_script_url);
    const form = document.getElementById('unsubscribeForm');
    if (!form || form.dataset.bound) return;
    form.dataset.bound = 'true';
    const status = document.getElementById('unsubscribeStatus');
    const button = document.getElementById('unsubscribeSubmit');
    const token = new URLSearchParams(window.location.hash.slice(1)).get('token') || new URLSearchParams(window.location.search).get('token') || '';
    if (!/^[a-f0-9]{64}$/.test(token)) {
      status.textContent = 'This link is incomplete. Open the personal unsubscribe link from your email, or contact info@assurintellec.in.';
      button.disabled = true; return;
    }
    status.textContent = 'Select Unsubscribe below to stop receiving service updates.';
    button.disabled = false;
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (button.disabled) return;
      button.disabled = true; button.textContent = 'Updating…'; status.textContent = 'Confirming your request…';
      try {
        const result = await unsubscribe(unsubscribeEndpoint, token);
        if (!result.success) throw new Error(result.message);
        status.textContent = 'You have been unsubscribed. You will no longer receive service updates from this list.';
        status.dataset.success = 'true'; button.textContent = 'Unsubscribed';
        document.getElementById('unsubscribeAlternative')?.remove();
      } catch (_) {
        status.textContent = 'We could not confirm your unsubscribe request. Please try again, or email info@assurintellec.in for help.';
        button.disabled = false; button.textContent = 'Try unsubscribe again';
        if (endpoint(unsubscribeEndpoint) && !document.getElementById('unsubscribeAlternative')) {
          const alternative = document.createElement('a');
          alternative.id = 'unsubscribeAlternative'; alternative.textContent = 'Use alternative unsubscribe form';
          alternative.href = unsubscribeEndpoint + '?action=unsubscribe&token=' + encodeURIComponent(token);
          alternative.target = '_blank'; alternative.rel = 'noopener noreferrer';
          alternative.style.cssText = 'display:block;margin-top:16px;text-decoration:underline'; form.append(alternative);
        }
      }
    });
  }
  function init(site, services) {
    if (typeof document === 'undefined') return;
    initUnsubscribe(site);
    if (document.getElementById('unsubscribeForm')) return;
    document.getElementById('assurNewsletter')?.remove();
    const cfg = { ...defaults, ...(site.newsletter || {}) };
    if (cfg.enabled === false) return;
    const holder = document.getElementById('site-footer');
    if (!holder) return;
    const node = (tag, cls, value) => { const el = document.createElement(tag); if (cls) el.className = cls; if (value !== undefined) el.textContent = value; return el; };
    const section = node('section', 'ai-newsletter'); section.id = 'assurNewsletter'; section.setAttribute('aria-labelledby', 'newsletterHeading');
    const container = node('div', 'container ai-newsletter-grid');
    const copy = node('div', 'ai-newsletter-copy');
    const title = node('h2', '', cfg.title); title.id = 'newsletterHeading';
    copy.append(node('span', 'ai-newsletter-eyebrow', cfg.eyebrow), title, node('p', '', cfg.description));
    const form = node('form', 'ai-newsletter-form');
    const controls = node('div', 'ai-newsletter-controls');
    const emailGroup = node('div', 'ai-newsletter-field');
    const emailLabel = node('label', '', cfg.email_label); emailLabel.htmlFor = 'newsletterEmail';
    const email = node('input', ''); email.id = 'newsletterEmail'; email.name = 'email'; email.type = 'email'; email.autocomplete = 'email'; email.required = true; email.maxLength = 254; email.placeholder = cfg.email_placeholder;
    emailGroup.append(emailLabel, email);
    const interestGroup = node('div', 'ai-newsletter-field');
    const interestLabel = node('label', '', cfg.interest_label); interestLabel.htmlFor = 'newsletterInterest';
    const interest = node('select', ''); interest.id = 'newsletterInterest'; interest.name = 'interest'; interest.required = true;
    const placeholder = node('option', '', cfg.interest_placeholder); placeholder.value = ''; placeholder.disabled = true; placeholder.selected = true; interest.append(placeholder);
    for (const option of options(services, cfg)) { const choice = node('option', '', option.label); choice.value = option.value; interest.append(choice); }
    interestGroup.append(interestLabel, interest);
    const button = node('button', 'ai-newsletter-submit', cfg.submit_label); button.type = 'submit';
    controls.append(emailGroup, interestGroup, button);
    const consentRow = node('label', 'ai-newsletter-consent');
    const consent = node('input', ''); consent.type = 'checkbox'; consent.name = 'consent'; consent.required = true;
    consentRow.append(consent, node('span', '', cfg.consent_label));
    const trap = node('input', 'ai-newsletter-trap'); trap.name = 'company_site_confirm'; trap.tabIndex = -1; trap.autocomplete = 'off'; trap.setAttribute('aria-hidden', 'true');
    const status = node('p', 'ai-newsletter-status'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
    const note = node('p', 'ai-newsletter-note', cfg.privacy_note);
    form.append(controls, consentRow, trap, status, note);
    if (!endpoint(cfg.google_apps_script_url)) { button.disabled = true; status.textContent = cfg.setup_message; }
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (!form.reportValidity() || button.disabled || !endpoint(cfg.google_apps_script_url)) return;
      button.disabled = true; button.textContent = cfg.submitting_label; status.textContent = ''; status.removeAttribute('data-success');
      try {
        const result = await subscribe(cfg.google_apps_script_url.trim(), { email: email.value.trim(), interest: interest.value, consent: consent.checked ? 'yes' : 'no', company_site_confirm: trap.value, source_page: window.location.pathname });
        if (!result.success) throw new Error(result.message || cfg.error_message);
        status.textContent = cfg.success_message; status.dataset.success = 'true'; form.reset();
      } catch (_) { status.textContent = cfg.error_message; }
      finally { button.disabled = false; button.textContent = cfg.submit_label; }
    });
    container.append(copy, form); section.append(container); holder.prepend(section);
  }
  // The unsubscribe control must still work if an unrelated page component
  // (header, services, video or animation) fails while the main site initializes.
  if (typeof document !== 'undefined') {
    const bindUnsubscribe = () => {
      if (!document.getElementById('unsubscribeForm')) return;
      initUnsubscribe();
      fetch('./content/site.json', { cache: 'no-store' }).then(response => response.json()).then(initUnsubscribe).catch(() => {});
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindUnsubscribe);
    else bindUnsubscribe();
  }
  return { init, initUnsubscribe, defaults, endpoint, options, googleOrigin, unsubscribe };
});

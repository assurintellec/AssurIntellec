(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AssurEnquiryNewsletter = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  const defaults = {
    enquiry_optin_enabled: true,
    enquiry_optin_label: 'Yes, email me service updates and the AssurIntellec™ newsletter.',
    enquiry_optin_note: 'Optional. You can unsubscribe at any time. You can send your enquiry without subscribing.',
    enquiry_interest_label: 'Send me updates about',
    enquiry_email_note: 'We’ll use the email address entered above.',
    enquiry_combined_button: 'Send enquiry & subscribe',
    enquiry_newsletter_pending: 'Your enquiry is sent. Confirming your newsletter subscription…',
    enquiry_newsletter_success: 'Your newsletter preferences have been saved. You can unsubscribe at any time.',
    enquiry_newsletter_error: 'Your enquiry was sent successfully. We couldn’t confirm your newsletter subscription.',
    enquiry_newsletter_retry: 'Retry subscription'
  };
  let state;
  const enabledRecords = services => (Array.isArray(services) ? services : []).filter(s => s && s.enabled !== false && s.slug && s.title);
  function chooseInterest(requirement, services, allowAll = true) {
    const text = String(requirement || '').trim().toLowerCase();
    return enabledRecords(services).find(s => String(s.title).trim().toLowerCase() === text)?.slug || (allowAll ? 'all' : '');
  }
  async function submitOptin(payload) {
    if (payload.consent !== 'yes') throw new Error('Newsletter consent is required.');
    const response = await fetch('./api/newsletter', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'subscribe', email: payload.email, interest: payload.interest, consent: 'yes', company_site_confirm: payload.company_site_confirm || '' }),
      signal: AbortSignal.timeout(35000)
    });
    const result = await response.json();
    if (!response.ok || result.success !== true) throw new Error('Subscription could not be confirmed.');
    return result;
  }
  function node(tag, cls, text) {
    const el = document.createElement(tag); if (cls) el.className = cls;
    if (text !== undefined) el.textContent = text; return el;
  }
  function init(site, services) {
    const form = document.getElementById('contactForm');
    const cfg = { ...defaults, ...(site.newsletter || {}) };
    if (!form || form.querySelector('#enquiryNewsletterChoice') || cfg.enquiry_optin_enabled === false || !site.contact?.google_apps_script_url || !window.AssurNewsletter?.endpoint(cfg.google_apps_script_url)) return;
    const grid = form.querySelector('.form-grid'), actions = form.querySelector('.contact-form-actions');
    if (!grid || !actions) return;
    const box = node('div', 'form-group full ai-enquiry-optin'); box.id = 'enquiryNewsletterChoice';
    const label = node('label', 'ai-enquiry-optin-label');
    const checkbox = node('input'); checkbox.type = 'checkbox'; checkbox.name = 'newsletter_optin'; checkbox.value = 'yes'; checkbox.id = 'enquiryNewsletterConsent';
    checkbox.setAttribute('aria-describedby', 'enquiryNewsletterNote'); checkbox.setAttribute('aria-controls', 'enquiryNewsletterPreferences'); checkbox.setAttribute('aria-expanded', 'false');
    label.htmlFor = checkbox.id;
    label.append(checkbox, node('span', '', cfg.enquiry_optin_label));
    const note = node('p', 'ai-enquiry-optin-note', cfg.enquiry_optin_note); note.id = 'enquiryNewsletterNote';
    const preferences = node('div', 'ai-enquiry-optin-preferences'); preferences.id = 'enquiryNewsletterPreferences'; preferences.hidden = true;
    const interestLabel = node('label', '', cfg.enquiry_interest_label); interestLabel.htmlFor = 'enquiryNewsletterInterest';
    const interest = node('select'); interest.id = interestLabel.htmlFor; interest.name = 'newsletter_interest'; interest.disabled = true;
    const choices = window.AssurNewsletter.options(services, { include_all_services: cfg.include_all_services !== false, all_services_label: cfg.all_services_label || 'All service updates' });
    if (!choices.some(choice => choice.value === 'all')) {
      const empty = node('option', '', 'Choose your updates'); empty.value = ''; empty.disabled = true; interest.append(empty);
    }
    choices.forEach(choice => { const option = node('option', '', choice.label); option.value = choice.value; interest.append(option); });
    const requirement = form.querySelector('[name="service"]'); let customInterest = false;
    const syncInterest = () => { if (!customInterest) interest.value = chooseInterest(requirement?.value, services, cfg.include_all_services !== false); };
    syncInterest(); requirement?.addEventListener('change', syncInterest);
    interest.addEventListener('change', () => { customInterest = true; });
    const emailNote = node('p', 'ai-enquiry-optin-note', cfg.enquiry_email_note);
    preferences.append(interestLabel, interest, emailNote);
    const trap = node('input', 'ai-newsletter-trap'); trap.name = 'newsletter_company_site'; trap.tabIndex = -1; trap.autocomplete = 'off'; trap.setAttribute('aria-hidden', 'true');
    const region = node('section', 'form-group full ai-enquiry-newsletter-result'); region.id = 'enquiryNewsletterStatus'; region.hidden = true; region.setAttribute('role', 'status'); region.setAttribute('aria-live', 'polite');
    const button = form.querySelector('button[type="submit"]');
    const baseLabel = site.contact?.form_button || button?.textContent.trim() || 'Send Enquiry';
    const update = () => {
      preferences.hidden = !checkbox.checked; interest.disabled = !checkbox.checked; interest.required = checkbox.checked;
      checkbox.setAttribute('aria-expanded', checkbox.checked ? 'true' : 'false'); box.dataset.selected = String(checkbox.checked);
      if (button && !button.disabled) button.textContent = checkbox.checked ? cfg.enquiry_combined_button : baseLabel;
    };
    checkbox.addEventListener('change', update);
    form.addEventListener('reset', () => queueMicrotask(() => { customInterest = false; syncInterest(); update(); }));
    box.append(label, note, preferences, trap); grid.insertBefore(box, actions); grid.append(region);
    state = { form, cfg, checkbox, interest, trap, region, grid, update, generation: 0 };
    update();
  }
  function capture(form) {
    if (!state || state.form !== form) return null;
    state.generation++;
    state.region.hidden = true; state.region.replaceChildren(); restore();
    if (!state.checkbox.checked || state.interest.disabled || !state.interest.value) return null;
    return { payload: { email: form.querySelector('[name="email"]').value.trim(), interest: state.interest.value, consent: 'yes', company_site_confirm: state.trap.value }, label: state.interest.selectedOptions[0]?.textContent || '', context: state, generation: state.generation };
  }
  function restore() { if (state?.region && state.region.parentElement !== state.grid) state.grid.append(state.region); }
  function complete(selection) {
    if (!selection) return;
    const record = selection.context, { cfg, region } = record;
    const modal = document.querySelector('#enquirySuccessOverlay .enquiry-success-card');
    if (modal) modal.insertBefore(region, modal.querySelector('.enquiry-success-tagline'));
    let busy = false;
    const draw = (message, status) => {
      if (record.generation !== selection.generation) return;
      region.hidden = false; region.dataset.state = status; region.replaceChildren(node('strong', '', 'Newsletter updates'), node('p', '', message));
      region.append(node('span', 'ai-enquiry-newsletter-interest', selection.payload.email + ' · ' + selection.label));
    };
    const run = async () => {
      if (busy) return; busy = true; draw(cfg.enquiry_newsletter_pending, 'pending');
      try { await submitOptin(selection.payload); draw(cfg.enquiry_newsletter_success, 'success'); }
      catch (_) {
        if (record.generation !== selection.generation) return;
        draw(cfg.enquiry_newsletter_error, 'error');
        const retry = node('button', 'ai-enquiry-newsletter-retry', cfg.enquiry_newsletter_retry); retry.type = 'button'; retry.addEventListener('click', run); region.append(retry);
      } finally { busy = false; }
    };
    run();
  }
  return { init, capture, complete, restore, chooseInterest, submitOptin, defaults };
});

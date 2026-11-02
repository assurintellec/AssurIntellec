(function (root) {
  'use strict';
  const defaults = { enabled: true, delay_seconds: 180, eyebrow: 'LET’S CONNECT', title: 'How can we help your business?', description: 'Share your requirement and our team will get in touch.', close_label: 'Close enquiry form' };
  const key = 'assurintellec:enquiry-popup:v1';
  function read() { try { return JSON.parse(sessionStorage.getItem(key) || '{}'); } catch (_) { return {}; } }
  function save(value) { try { sessionStorage.setItem(key, JSON.stringify(value)); } catch (_) {} }
  function init(site, services, prepare) {
    const cfg = { ...defaults, ...(site.enquiry_popup || {}) };
    if (document.getElementById('enquiryPopup') || document.body.dataset.page === 'unsubscribe') return;
    let form = document.getElementById('contactForm');
    // Free mode: the visitor sends via WhatsApp; no paid API opt-in is added.
    if (cfg.enabled === false) return;
    const dialog = document.createElement('dialog'); dialog.id = 'enquiryPopup'; dialog.className = 'ai-enquiry-popup';
    dialog.setAttribute('aria-labelledby', 'enquiryPopupTitle'); dialog.setAttribute('aria-describedby', 'enquiryPopupDescription');
    const close = document.createElement('button'); close.type = 'button'; close.className = 'ai-popup-close'; close.textContent = '×'; close.setAttribute('aria-label', cfg.close_label);
    const intro = document.createElement('header'); intro.className = 'ai-popup-intro';
    const eyebrow = document.createElement('span'); eyebrow.className = 'ai-popup-eyebrow'; eyebrow.textContent = cfg.eyebrow;
    const title = document.createElement('h2'); title.id = 'enquiryPopupTitle'; title.textContent = cfg.title;
    const description = document.createElement('p'); description.id = 'enquiryPopupDescription'; description.textContent = cfg.description;
    intro.append(eyebrow, title, description); dialog.append(close, intro);
    const slot = document.createElement('div'); slot.className = 'ai-popup-form'; dialog.append(slot); document.body.append(dialog);
    let marker;
    if (!form) {
      const template = document.createElement('template');
      template.innerHTML = `<form class="contact-form" id="contactForm" novalidate>
        <h3 id="contactFormTitle"></h3><div class="form-grid">
        <div class="form-group"><label for="name" id="labelName"></label><input id="name" name="name" autocomplete="name" required></div>
        <div class="form-group"><label for="company" id="labelCompany"></label><input id="company" name="company" autocomplete="organization"></div>
        <div class="form-group"><label for="email" id="labelEmail"></label><input id="email" name="email" type="email" autocomplete="email" required></div>
        <div class="form-group"><label for="phone" id="labelPhone"></label><input id="phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" required></div>
        <div class="form-group full"><label for="service" id="labelService"></label><select id="service" name="service" required></select></div>
        <div class="form-group full"><label for="message" id="labelMessage"></label><textarea id="message" name="message" required></textarea></div>
        <div class="form-group full contact-form-actions"><button type="submit" class="btn btn-primary dark-btn" id="contactSubmitButton">Send Enquiry</button><button type="button" class="btn whatsapp-form-button" id="contactWhatsAppButton">Send on WhatsApp</button></div></div></form>`;
      form = template.content.firstElementChild; slot.append(form);
      if (!document.getElementById('enquirySuccessOverlay')) {
        const success = document.createElement('div'); success.className = 'enquiry-success-overlay'; success.id = 'enquirySuccessOverlay'; success.setAttribute('aria-hidden', 'true');
        success.innerHTML = '<div class="enquiry-success-card" role="dialog" aria-modal="true" aria-labelledby="enquirySuccessTitle" tabindex="-1"><button class="enquiry-success-close" id="enquirySuccessClose" type="button" aria-label="Close confirmation message">×</button><div class="enquiry-success-icon" aria-hidden="true">✓</div><h2 id="enquirySuccessTitle"></h2><p class="enquiry-success-received" id="enquirySuccessReceived"></p><p class="enquiry-success-body" id="enquirySuccessBody"></p><p class="enquiry-success-closing" id="enquirySuccessClosing"></p><div class="enquiry-success-tagline" id="enquirySuccessTagline"></div></div>';
        document.body.append(success);
      }
      prepare();
    } else {
      marker = document.createComment('Original enquiry form location'); form.before(marker);
    }
    let state = read();
    if (!Number.isFinite(state.started)) { state.started = Date.now(); save(state); }
    let previousFocus, timer;
    function closePopup() { if (dialog.open) dialog.close(); }
    close.addEventListener('click', closePopup);
    dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closePopup(); } });
    dialog.addEventListener('close', () => {
      document.body.classList.remove('ai-popup-open');
      if (marker) marker.after(form);
      previousFocus?.focus?.({ preventScroll: true });
    });
    document.addEventListener('assurintellec:enquiry-success', () => {
      state.submitted = true; save(state); clearTimeout(timer); closePopup();
    });
    const delay = Math.max(0, Math.min(86400, Number.isFinite(Number(cfg.delay_seconds)) ? Number(cfg.delay_seconds) : 180)) * 1000;
    function attempt() {
      if (state.shown || state.submitted || !dialog.isConnected) return;
      const focused = document.activeElement;
      if (document.hidden || focused?.matches('input,textarea,select,[contenteditable="true"]') || document.querySelector('dialog[open],.enquiry-success-overlay.show,.ai-chat-panel.open')) {
        timer = setTimeout(attempt, 15000); return;
      }
      if (typeof dialog.showModal !== 'function') return;
      previousFocus = focused; slot.append(form);
      dialog.showModal(); document.body.classList.add('ai-popup-open');
      state.shown = true; save(state); close.focus();
    }
    timer = setTimeout(attempt, Math.max(0, state.started + delay - Date.now()));
  }
  root.AssurEnquiryPopup = { init, defaults };
})(window);

(function () {
  'use strict';
  if (window.AssurPreloader) return;
  let enabled = true, appReady = false, loaded = document.readyState === 'complete';
  let timer, closingTimer, overlay;
  const setBusy = busy => {
    document.body?.setAttribute('aria-busy', busy ? 'true' : 'false');
    document.querySelectorAll('body > main, body > #site-header, body > #site-footer').forEach(el => {
      if (busy && !el.inert) { el.inert = true; el.dataset.preloaderInert = 'true'; }
      else if (!busy && el.dataset.preloaderInert) { el.inert = false; delete el.dataset.preloaderInert; }
    });
  };
  const hide = () => {
    clearTimeout(timer); setBusy(false);
    if (!overlay) return;
    const old = overlay; overlay = null;
    old.classList.add('is-leaving');
    closingTimer = setTimeout(() => old.remove(), 320);
  };
  const show = () => {
    if (!enabled || overlay) return;
    overlay = document.createElement('div'); overlay.className = 'ai-preloader'; overlay.id = 'assurPreloader';
    overlay.setAttribute('role', 'status'); overlay.setAttribute('aria-label', 'Loading AssurIntellec website');
    overlay.innerHTML = '<div class="ai-preloader-inner"><div class="ai-preloader-emblem"><span class="ai-preloader-orbit" aria-hidden="true"></span><img class="ai-preloader-logo" src="./images/favicon-512.png" alt="AssurIntellec logo" width="160" height="160"></div><div class="ai-preloader-name">AssurIntellec™</div><div class="ai-preloader-label">Loading your experience</div><div class="ai-preloader-line" aria-hidden="true"></div></div>';
    document.body.append(overlay); setBusy(true);
    // Fail open even if a media request or the main script fails.
    timer = setTimeout(hide, 7000);
  };
  const finish = () => { if (appReady) hide(); };
  window.AssurPreloader = {
    configure(site) {
      const cfg = site.preloader || {}; enabled = cfg.enabled !== false;
      if (!enabled) { hide(); return; }
      if (!overlay) return;
      overlay.querySelector('.ai-preloader-name').textContent = site.company_name || 'AssurIntellec™';
      overlay.querySelector('.ai-preloader-label').textContent = cfg.loading_label || 'Loading your experience';
      const logo = String(cfg.logo || '').trim();
      if (logo && /^(?:\/|\.\/|https:\/\/)/.test(logo)) overlay.querySelector('img').src = logo;
    },
    ready() { appReady = true; finish(); }, hide
  };
  show();
  document.addEventListener('DOMContentLoaded', () => { if (overlay) setBusy(true); });
  window.addEventListener('load', () => { loaded = true; finish(); }, { once: true });
  window.addEventListener('pageshow', event => { if (event.persisted) hide(); });
  document.addEventListener('click', event => {
    const link = event.target.closest?.('a[href]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target || link.hasAttribute('download')) return;
    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin || (url.pathname === window.location.pathname && url.search === window.location.search) || !/\/(?:[^/]*\.html)?$/.test(url.pathname)) return;
    show();
  });
})();

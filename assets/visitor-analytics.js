(function (root) {
  'use strict';
  const consentKey = 'assurintellec:visitor-insights-consent:v1', sessionKey = 'assurintellec:visit-session:v1';
  const defaults = { enabled: true, require_consent: true, collect_ip: true, heartbeat_seconds: 60, notice: 'Help us improve your experience. With your permission, we record pages and sections viewed, active time, IP address and approximate city/country. We do not record form entries.', accept_label: 'Allow insights', decline_label: 'No thanks', preferences_label: 'Visitor privacy' };
  const read = key => { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) { return null; } };
  const save = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {} };
  const id = () => crypto.randomUUID().replace(/-/g, '');
  function session() {
    let value;
    try { value = JSON.parse(sessionStorage.getItem(sessionKey) || 'null'); } catch (_) {}
    if (!value || !/^[a-z0-9]{32}$/.test(value.id) || Date.now() - value.last > 30 * 60000) value = { id: id(), last: Date.now() };
    value.last = Date.now();
    try { sessionStorage.setItem(sessionKey, JSON.stringify(value)); } catch (_) {}
    return value;
  }
  let initialized = false;
  function init(site) {
    const cfg = { ...defaults, ...(site.visitor_analytics || {}) };
    if (initialized || cfg.enabled === false || document.body.dataset.page === 'unsubscribe' || /^\/(admin|api)(\/|$)/.test(location.pathname)) return;
    initialized = true;
    if (navigator.globalPrivacyControl === true || navigator.doNotTrack === '1') return;
    let stop, consent = read(consentKey), running = false;
    const preferences = document.createElement('button'); preferences.type = 'button'; preferences.className = 'ai-privacy-preferences'; preferences.textContent = cfg.preferences_label;
    const holder = document.querySelector('#site-footer footer') || document.getElementById('site-footer') || document.body; holder.append(preferences);
    function choose(value) {
      consent = value; save(consentKey, value); document.getElementById('visitorInsightsNotice')?.remove();
      if (value === 'yes') { if (!running) { stop = track(cfg); running = true; } }
      else if (running) { stop?.(); running = false; }
    }
    function notice() {
      if (document.getElementById('visitorInsightsNotice')) return;
      const box = document.createElement('section'); box.className = 'ai-visitor-notice'; box.id = 'visitorInsightsNotice'; box.setAttribute('aria-label', 'Visitor insights preferences');
      const text = document.createElement('p'); text.textContent = cfg.notice;
      const controls = document.createElement('div');
      for (const [value, label] of [['yes', cfg.accept_label], ['no', cfg.decline_label]]) { const button = document.createElement('button'); button.type = 'button'; button.textContent = label; button.addEventListener('click', () => choose(value)); controls.append(button); }
      box.append(text, controls); document.body.append(box);
    }
    preferences.addEventListener('click', notice);
    if (consent === 'yes' || (cfg.require_consent === false && consent !== 'no')) choose('yes');
    else if (consent !== 'no') notice();
    window.addEventListener('storage', event => { if (event.key === consentKey && read(consentKey) === 'no') choose('no'); });
  }
  function track(cfg) {
    const visit = session(), pageId = id(), started = Date.now();
    let activeMs = 0, lastTick = performance.now(), lastInteraction = performance.now(), sequence = 0, stopped = false, inFlight = false, failures = 0, retry;
    const sections = new Set(), disposals = [];
    const on = (object, type, callback, options) => { object.addEventListener(type, callback, options); disposals.push(() => object.removeEventListener(type, callback, options)); };
    const tick = () => {
      const now = performance.now(), delta = now - lastTick;
      if (!document.hidden && now - lastInteraction < 60000) activeMs += Math.max(0, Math.min(delta, 2000));
      lastTick = now;
    };
    const activity = () => { tick(); lastInteraction = performance.now(); };
    ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach(type => on(document, type, activity, { passive: true }));
    const observer = 'IntersectionObserver' in root ? new IntersectionObserver(entries => {
      entries.filter(entry => entry.isIntersecting).forEach(entry => {
        const heading = entry.target.querySelector('h1,h2,h3');
        const label = String(heading?.textContent || entry.target.getAttribute('aria-label') || entry.target.id || '').trim().replace(/\s+/g, ' ').slice(0, 90);
        if (label && sections.size < 35) sections.add(label);
      });
    }, { threshold: 0.2 }) : null;
    document.querySelectorAll('main section,main article,#assurNewsletter').forEach(element => observer?.observe(element));
    async function send(final = false) {
      if (stopped || (inFlight && !final)) return;
      tick(); sequence++;
      const payload = { page_id: pageId, session_id: visit.id, started_at: started, sequence, active_seconds: Math.floor(activeMs / 1000), path: location.pathname, title: document.title.slice(0, 160), sections: [...sections], referrer: document.referrer, device: innerWidth < 768 ? 'mobile' : innerWidth < 1100 ? 'tablet' : 'desktop', consent: 'yes' };
      // No name, email, telephone, enquiry, URL query or fragment is collected.
      inFlight = true;
      try {
        const response = await fetch('/api/visitor-analytics', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload), keepalive: final, signal: AbortSignal.timeout(25000) });
        let result = {}; try { result = await response.json(); } catch (_) {}
        if (!response.ok || result.success !== true) throw new Error(result.code || 'ANALYTICS_NOT_CONFIRMED');
        failures = 0; clearTimeout(retry);
        document.dispatchEvent(new CustomEvent('assurintellec:analytics-status', { detail: { ready: true, code: 'RECORDED' } }));
      } catch (error) {
        failures++;
        document.dispatchEvent(new CustomEvent('assurintellec:analytics-status', { detail: { ready: false, code: error.message || 'CONNECTION_FAILED' } }));
        // The same page id is reused: a lost response cannot duplicate a row.
        if (!final && !stopped && failures <= 3) { clearTimeout(retry); retry = setTimeout(() => send(), Math.min(45000, failures * 5000)); }
      } finally { inFlight = false; }
      visit.last = Date.now(); try { sessionStorage.setItem(sessionKey, JSON.stringify(visit)); } catch (_) {}
    }
    const clock = setInterval(tick, 1000);
    const heartbeat = setInterval(send, Math.max(30, Math.min(300, Number(cfg.heartbeat_seconds) || 60)) * 1000);
    on(document, 'visibilitychange', () => { tick(); if (document.hidden) send(true); else { lastTick = performance.now(); lastInteraction = lastTick; } });
    on(root, 'pagehide', () => send(true));
    send();
    on(root, 'online', () => { if (!stopped) { failures = 0; clearTimeout(retry); send(); } });
    return () => { stopped = true; clearTimeout(retry); clearInterval(clock); clearInterval(heartbeat); observer?.disconnect(); disposals.forEach(dispose => dispose()); };
  }
  root.AssurVisitorAnalytics = { init, defaults };
})(window);

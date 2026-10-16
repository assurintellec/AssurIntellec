/*
 * Opt-in Decap/Turbo diagnostics.
 * Enable by opening /admin/?debugPublish=1.
 * This script is inert during normal CMS use.
 */
(function () {
  'use strict';

  const params = new URLSearchParams(window.location.search);
  if (params.get('debugPublish') !== '1') return;

  const rows = [];
  const startedAt = new Date();
  let publishEventSeen = false;
  let panel;
  let logView;
  let headline;

  function safeMessage(value) {
    if (value instanceof Error) return value.name + ': ' + value.message;
    if (typeof value === 'string') return value;
    try { return JSON.stringify(value); } catch (_) { return String(value); }
  }

  function shortUrl(raw) {
    try {
      const u = new URL(raw, window.location.href);
      // Deliberately omit query parameters and fragments in case they include tokens.
      return u.origin + u.pathname;
    } catch (_) {
      return String(raw || '').slice(0, 180);
    }
  }

  function draw() {
    if (!logView) return;
    logView.textContent = rows.slice(-14).join('\n');
    logView.scrollTop = logView.scrollHeight;
  }

  function log(message, level) {
    const time = new Date().toLocaleTimeString();
    rows.push('[' + time + '] ' + message);
    if (rows.length > 80) rows.shift();
    draw();
    if (headline && level === 'error') headline.textContent = 'Issue detected — review the log below';
    if (level === 'error') console.error('[Decap Publish Diagnostics]', message);
    else console.info('[Decap Publish Diagnostics]', message);
  }

  function createPanel() {
    panel = document.createElement('section');
    panel.setAttribute('aria-label', 'Decap Publish diagnostics');
    panel.style.cssText = [
      'position:fixed', 'z-index:2147483647', 'right:14px', 'bottom:14px',
      'width:min(460px,calc(100vw - 28px))', 'max-height:48vh', 'overflow:hidden',
      'background:#101820', 'color:#f3f6f9', 'border:1px solid #536779',
      'border-radius:10px', 'box-shadow:0 8px 30px rgba(0,0,0,.32)',
      'font:13px/1.45 Arial,sans-serif', 'padding:12px', 'box-sizing:border-box'
    ].join(';');

    const header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;font-weight:700';
    const title = document.createElement('span');
    title.textContent = 'AssurIntellec · Publish diagnostics';
    const close = document.createElement('button');
    close.type = 'button';
    close.textContent = 'Hide';
    close.style.cssText = 'border:1px solid #8193a3;border-radius:5px;background:#243746;color:#fff;padding:4px 8px;cursor:pointer';
    close.addEventListener('click', function () { panel.style.display = 'none'; });
    header.append(title, close);

    headline = document.createElement('div');
    headline.textContent = 'Starting checks…';
    headline.style.cssText = 'font-weight:600;margin:0 0 8px;color:#b8e0ff';

    logView = document.createElement('pre');
    logView.style.cssText = 'white-space:pre-wrap;overflow:auto;max-height:28vh;margin:0;padding:8px;background:#17232d;border-radius:6px;font:11px/1.45 Consolas,monospace;overflow-wrap:anywhere';

    const footer = document.createElement('div');
    footer.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;margin-top:8px';
    const copy = document.createElement('button');
    copy.type = 'button';
    copy.textContent = 'Copy diagnostics';
    copy.style.cssText = close.style.cssText;
    copy.addEventListener('click', async function () {
      const text = 'Started: ' + startedAt.toISOString() + '\nURL: ' + window.location.origin + window.location.pathname + '\n' + rows.join('\n');
      try {
        await navigator.clipboard.writeText(text);
        headline.textContent = 'Diagnostics copied to clipboard';
      } catch (_) {
        const area = document.createElement('textarea');
        area.value = text;
        area.style.cssText = 'position:fixed;left:-9999px;top:0';
        document.body.appendChild(area);
        area.select();
        try { document.execCommand('copy'); headline.textContent = 'Copy attempted; select the log manually if needed'; }
        catch (err) { headline.textContent = 'Copy not available; take a screenshot of this log'; }
        area.remove();
      }
    });
    const closePanel = document.createElement('button');
    closePanel.type = 'button';
    closePanel.textContent = 'Close panel';
    closePanel.style.cssText = close.style.cssText;
    closePanel.addEventListener('click', function () { panel.remove(); });
    footer.append(copy, closePanel);

    panel.append(header, headline, logView, footer);
    document.body.appendChild(panel);
  }

  function setHeadline(text, error) {
    if (headline) {
      headline.textContent = text;
      headline.style.color = error ? '#ffb4b4' : '#b8e0ff';
    }
  }

  createPanel();
  log('Diagnostic mode enabled. No content is changed by this script.');
  log('Admin origin: ' + window.location.origin + window.location.pathname);
  log('CMS script minimum is set to Decap CMS 3.17.0+ for Turbo backend support.');

  window.addEventListener('error', function (event) {
    const msg = event.message || (event.error && event.error.message) || 'Unknown JavaScript error';
    log('JavaScript error: ' + msg + (event.filename ? ' (' + shortUrl(event.filename) + ')' : ''), 'error');
  });

  window.addEventListener('unhandledrejection', function (event) {
    log('Unhandled promise rejection: ' + safeMessage(event.reason), 'error');
  });

  // Record failed fetch responses in diagnostic mode only. Query strings are deliberately redacted.
  if (typeof window.fetch === 'function') {
    const originalFetch = window.fetch.bind(window);
    window.fetch = async function () {
      const args = arguments;
      const raw = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url) || '';
      const path = shortUrl(raw);
      try {
        const response = await originalFetch.apply(window, args);
        if (!response.ok) log('HTTP ' + response.status + ' ' + path, 'error');
        return response;
      } catch (error) {
        log('Network/fetch failure: ' + path + ' — ' + safeMessage(error), 'error');
        throw error;
      }
    };
  }

  // This click check distinguishes a button click from Decap starting its publish lifecycle.
  document.addEventListener('click', function (event) {
    const button = event.target && event.target.closest ? event.target.closest('button,[role="button"]') : null;
    if (!button) return;
    const label = (button.innerText || button.textContent || button.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ');
    if (/^publish(?:\s+changes)?$/i.test(label) || /^publish$/i.test(button.getAttribute('aria-label') || '')) {
      publishEventSeen = false;
      setHeadline('Publish button clicked — waiting for Decap event…', false);
      log('Publish button click detected.');
      window.setTimeout(function () {
        if (!publishEventSeen) {
          setHeadline('Button click detected, but no prePublish event was observed.', true);
          log('No prePublish event within 5 seconds. This suggests a CMS UI/validation issue, stale admin code, or a handler error. Check browser Console.', 'error');
        }
      }, 5000);
    }
  }, true);

  function registerListeners() {
    if (!window.CMS || typeof window.CMS.registerEventListener !== 'function') return false;
    const events = ['preSave', 'postSave', 'prePublish', 'postPublish'];
    events.forEach(function (name) {
      try {
        window.CMS.registerEventListener({
          name: name,
          handler: function () {
            if (name === 'prePublish') {
              publishEventSeen = true;
              setHeadline('Decap started publishing — waiting for backend result…', false);
            } else if (name === 'postPublish') {
              publishEventSeen = true;
              setHeadline('Decap reports publishing completed. Check GitHub for the commit.', false);
            }
            log('Decap CMS event: ' + name + '.');
          }
        });
      } catch (error) {
        log('Could not register event ' + name + ': ' + safeMessage(error), 'error');
      }
    });
    log('CMS event listeners registered.');
    return true;
  }

  if (!registerListeners()) {
    log('CMS event API not available yet; checking briefly…');
    let attempts = 0;
    const retry = window.setInterval(function () {
      attempts += 1;
      if (registerListeners()) {
        window.clearInterval(retry);
      } else if (attempts >= 10) {
        window.clearInterval(retry);
        setHeadline('Decap CMS did not initialize; check the script/config load.', true);
        log('window.CMS.registerEventListener was unavailable after repeated checks. Check the CMS CDN request, admin/config.yml request, and Console.', 'error');
      }
    }, 500);
  }
})();

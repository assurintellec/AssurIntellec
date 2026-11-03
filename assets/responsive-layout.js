/* Visible-screen sizing for browser toolbars, rotation and mobile keyboards.
   No user-agent sniffing, navigation interception or network requests. */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.AssurResponsive = api; api.init(root); }
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';
  function measureViewport(layoutHeight, visual) {
    var layout = Number(layoutHeight);
    if (!Number.isFinite(layout) || layout <= 0) return null;
    // Let pinch zoom work naturally; do not reflow the page for magnification.
    if (visual && Number(visual.scale) > 1.05) return null;
    var supplied = visual && Number(visual.height);
    var height = Number.isFinite(supplied) && supplied > 0 ? Math.min(layout, supplied) : layout;
    var suppliedTop = visual && Number(visual.offsetTop);
    var top = Number.isFinite(suppliedTop) ? Math.min(Math.max(0, suppliedTop), layout - height) : 0;
    return { height: Math.round(height), top: Math.round(top), bottom: Math.max(0, Math.round(layout - height - top)) };
  }
  function init(win) {
    var doc = win.document;
    if (!doc || doc.documentElement.dataset.responsiveReady === 'true') return;
    var html = doc.documentElement;
    html.dataset.responsiveReady = 'true';
    var queued = false;
    var fieldSelector = 'textarea,select,[contenteditable=""],[contenteditable="true"],input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="hidden"])';
    function sync() {
      queued = false;
      var metrics = measureViewport(win.innerHeight || html.clientHeight, win.visualViewport);
      if (metrics) {
        html.style.setProperty('--visible-viewport-height', metrics.height + 'px');
        html.style.setProperty('--visual-viewport-top', metrics.top + 'px');
        html.style.setProperty('--visual-viewport-bottom', metrics.bottom + 'px');
      }
      var active = doc.activeElement;
      html.classList.toggle('is-editing-field', !!(active && active.matches && active.matches(fieldSelector)));
    }
    function schedule() {
      if (queued) return;
      queued = true;
      if (win.requestAnimationFrame) win.requestAnimationFrame(sync);
      else win.setTimeout(sync, 16);
    }
    ['resize', 'orientationchange', 'pageshow'].forEach(function (name) { win.addEventListener(name, schedule, { passive: true }); });
    if (win.visualViewport) {
      win.visualViewport.addEventListener('resize', schedule, { passive: true });
      win.visualViewport.addEventListener('scroll', schedule, { passive: true });
    }
    ['focusin', 'focusout', 'visibilitychange'].forEach(function (name) { doc.addEventListener(name, schedule); });
    sync();
  }
  return { measureViewport: measureViewport, init: init };
});

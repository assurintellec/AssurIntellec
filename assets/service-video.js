(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AssurServiceVideo = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  const escape = value => String(value || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  function path(value) {
    let raw = String(value || '').trim().replace(/\\/g, '/');
    if (!raw || /^(?:javascript|data|file|blob):/i.test(raw) || raw.startsWith('//')) return '';
    if (/^[a-z][a-z0-9+.-]*:/i.test(raw) && !/^https?:\/\//i.test(raw)) return '';
    if (!/^https?:\/\//i.test(raw)) {
      raw = raw.replace(/^\.\//, '');
      if (!raw.startsWith('/')) raw = (raw.includes('/') ? '/' : '/videos/') + raw;
    }
    try {
      const absolute = /^https?:\/\//i.test(raw), url = new URL(raw, 'https://asset.invalid');
      return absolute ? url.href : url.pathname + url.search + url.hash;
    } catch (_) { return ''; }
  }
  function candidates(source, fallback) { return [...new Set([path(source), path(fallback)].filter(Boolean))]; }
  function legacyPath(value) {
    // Only look in the historical upload folder after a confirmed missing path.
    if (value.startsWith('/videos/')) return '/content' + value;
    if (value.startsWith('/content/videos/')) return value.slice('/content'.length);
    return '';
  }
  function markup(source, description, poster, extraClass, fallback) {
    const src = path(source);
    if (!src) return '';
    return '<div class="service-video-player"><video class="' + escape(extraClass) + ' service-loop-video" src="' + escape(src) + '" data-video-source="' + escape(src) + '" data-video-fallback="' + escape(path(fallback)) + '" autoplay muted loop playsinline webkit-playsinline preload="metadata" disablepictureinpicture disableremoteplayback controlslist="nodownload nofullscreen noplaybackrate noremoteplayback"' + (poster ? ' poster="' + escape(path(poster)) + '"' : '') + ' aria-label="' + escape(description || 'Service introduction video') + '">Your browser does not support this video.</video><button type="button" class="service-video-sound" aria-label="Unmute service video" aria-pressed="false"></button></div>';
  }
  function sync(hero, source, poster, description, fallback) {
    const video = hero && hero.querySelector('.ps2-hero-frame video');
    if (!video) return;
    video.setAttribute('aria-label', description || 'Service introduction video');
    if (poster) video.setAttribute('poster', path(poster)); else video.removeAttribute('poster');
    if (video.dataset.manualVideo === 'true') return;
    const next = path(source);
    video.dataset.videoSource = next;
    video.dataset.videoFallback = path(fallback);
    if (video.assurServicePlayer) video.assurServicePlayer.setSources(next, fallback);
    else if (next && path(video.getAttribute('src')) !== next) {
      video.pause();
      video.querySelectorAll('source').forEach(node => node.remove());
      video.src = next;
      video.load();
    }
  }
  function init(scope) {
    (scope || document).querySelectorAll('.service-video-player').forEach(player => {
      const video = player.querySelector('video');
      if (!video || video.assurServicePlayer) return;
      let sound = player.querySelector('.service-video-sound');
      if (!sound) { sound = document.createElement('button'); sound.type = 'button'; sound.className = 'service-video-sound'; player.append(sound); }
      const feedback = document.createElement('div'); feedback.className = 'service-video-feedback'; feedback.hidden = true;
      const message = document.createElement('p'); message.className = 'service-video-feedback-text'; message.setAttribute('role', 'status');
      const retry = document.createElement('button'); retry.type = 'button'; retry.className = 'service-video-retry'; retry.textContent = 'Play video';
      feedback.append(message, retry); player.querySelector('.service-video-feedback')?.remove(); player.append(feedback);
      let urls = [], index = 0, generation = 0, advancing = false, playPending = false;
      const attempted = new Set();
      video.controls = false; video.autoplay = true; video.loop = true; video.playsInline = true; video.muted = true; video.defaultMuted = true; video.volume = 1;
      video.disablePictureInPicture = true; video.setAttribute('disableremoteplayback', '');
      video.setAttribute('playsinline', ''); video.removeAttribute('controls');
      const show = (text, label) => { message.textContent = text; retry.textContent = label || 'Play video'; feedback.hidden = false; };
      const updateSound = () => {
        const muted = video.muted || video.volume === 0;
        sound.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4V5Z"/>' + (muted ? '<path d="m16 9 5 6m0-6-5 6"/>' : '<path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>') + '</svg>';
        sound.setAttribute('aria-label', muted ? 'Unmute service video' : 'Mute service video'); sound.setAttribute('aria-pressed', String(!muted)); sound.title = muted ? 'Unmute service video' : 'Mute service video';
      };
      function play() {
        if (!video.isConnected || document.hidden || video.error || playPending) return;
        const current = generation; playPending = true;
        Promise.resolve(video.play()).then(() => { if (current === generation) feedback.hidden = true; }).catch(error => {
          if (current !== generation || error?.name === 'AbortError') return;
          if (error?.name === 'NotAllowedError') show('Tap Play to start the video.');
          else if (video.error || error?.name === 'NotSupportedError') fail(error?.name === 'NotSupportedError' ? 4 : undefined);
          else show('Playback was interrupted. Tap Play to continue.');
        }).finally(() => { if (current === generation) playPending = false; });
      }
      function load() {
        generation++; advancing = false; playPending = false; feedback.hidden = true; delete video.dataset.videoError;
        video.pause(); video.querySelectorAll('source').forEach(node => node.remove());
        video.src = urls[index]; attempted.add(urls[index]); video.load(); play();
      }
      async function fail(forcedCode) {
        const errorCode = typeof forcedCode === 'number' ? forcedCode : video.error?.code;
        if (advancing || !errorCode || errorCode === 1) return;
        advancing = true;
        const current = generation, failed = urls[index];
        video.dataset.videoError = String(errorCode);
        // Recover previous relative-folder uploads without ever substituting a
        // different scene. Missing-path recovery is only for the same filename.
        const alternate = legacyPath(failed);
        if (alternate && !attempted.has(alternate)) {
          try {
            const response = await fetch(failed, { method: 'HEAD', cache: 'no-store', signal: AbortSignal.timeout(5000) });
            if (current !== generation) return;
            if ([404, 410].includes(response.status) || (response.ok && /text\/html/i.test(response.headers.get('content-type') || ''))) urls.splice(index + 1, 0, alternate);
          } catch (_) {}
        }
        if (current !== generation) return;
        if (index + 1 < urls.length) { index++; load(); return; }
        advancing = false;
        show(errorCode === 3 || errorCode === 4 ? 'This video is unavailable or cannot play in this browser.' : 'The video could not load. Please try again.', 'Retry playback');
      }
      function setSources(source, fallback) {
        const next = candidates(source, fallback);
        if (!next.length) return;
        const changed = urls.join('|') !== next.join('|');
        urls = next;
        if (changed) { index = 0; attempted.clear(); load(); }
      }
      video.assurServicePlayer = { setSources };
      retry.addEventListener('click', () => { if (video.error) { index = 0; attempted.clear(); load(); } else play(); });
      sound.addEventListener('click', () => { video.muted = !video.muted; video.volume = 1; updateSound(); play(); });
      video.addEventListener('volumechange', updateSound);
      video.addEventListener('canplay', play); video.addEventListener('playing', () => { feedback.hidden = true; });
      video.addEventListener('error', fail);
      video.addEventListener('loadstart', () => { feedback.hidden = true; });
      document.addEventListener('visibilitychange', () => { if (!document.hidden) play(); });
      updateSound(); setSources(video.dataset.videoSource || video.getAttribute('src') || video.querySelector('source')?.getAttribute('src'), video.dataset.videoFallback);
    });
  }
  return { path, candidates, legacyPath, markup, sync, init };
});

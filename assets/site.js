let SITE = null;
let SERVICES = [];
let instagramIndex = 0;
let heroAudioEnabled = true;

const FALLBACK_SITE = {
  company_name: 'AssurIntellec™',
  tagline: 'Intelligent Solutions. Assured Compliance.',
  social: { items: [] },
  contact: { whatsapp: 'https://wa.me/message/BFANWJ2N3FWOP1', email: 'info@assurintellec.in', phone: '+91 7600 666 436', mobile_phone: '7405660185', website: 'https://www.assurintellec.in', website_display: 'www.assurintellec.in' },
  hero: { video: '/videos/hero-60sec.mp4', poster: '/images/uploads/hero.jpg' },
  home: {}, about: {}, why_us: {}, footer: {}, theme: {}
};

const FALLBACK_SERVICES = [];

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function normalizeAsset(value) {
  if (!value) return '';
  const s = String(value).trim();
  if (!s) return '';
  return s.startsWith('/') ? '.' + s : s;
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el && value !== undefined && value !== null) el.textContent = String(value);
}

function setHref(id, value) {
  const el = document.getElementById(id);
  if (el && value) el.href = value;
}

function setImg(img, value, alt = 'Image') {
  if (!img) return;
  img.alt = alt;
  const src = normalizeAsset(value);
  if (!src) {
    img.style.display = 'none';
    return;
  }
  img.style.display = 'block';
  img.style.opacity = '1';
  img.src = src;
  img.onerror = () => showImageFallback(img);
}

function showImageFallback(img) {
  img.style.opacity = '0';
  img.classList.add('image-missing');
}

function iconHtml(icon) {
  return `<i class="fas ${escapeHtml(icon || 'fa-circle-nodes')}"></i>`;
}

async function readJson(path, fallback) {
  try {
    const response = await fetch(path, { cache: 'no-store' });
    if (!response.ok) throw new Error(`${path} ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn('Content fallback:', error);
    return fallback;
  }
}

function firstFamily(value) {
  const first = String(value || '').split(',')[0].trim().replace(/^['"]|['"]$/g, '');
  return first;
}

function loadGoogleFonts(theme) {
  const families = [
    theme.font_body_family,
    theme.font_heading_family,
    theme.font_nav_family,
    theme.font_button_family
  ].map(firstFamily).filter(Boolean);

  const googleCandidates = new Set([
    'Inter','Poppins','Roboto','Montserrat','Lato','Open Sans','Nunito','Raleway',
    'Merriweather','Playfair Display','Oswald','Source Sans 3','Manrope','DM Sans','Outfit'
  ]);

  const selected = [...new Set(families)].filter(f => googleCandidates.has(f));
  if (!selected.length) return;

  let link = document.getElementById('dynamicGoogleFonts');
  if (!link) {
    link = document.createElement('link');
    link.id = 'dynamicGoogleFonts';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }

  const href = 'https://fonts.googleapis.com/css2?family=' +
    selected.map(f => encodeURIComponent(f).replace(/%20/g, '+') + ':wght@300;400;500;600;700;800').join('&family=') +
    '&display=swap';
  link.href = href;
}

function applyTheme(site) {
  const t = site.theme || {};
  const root = document.documentElement;

  const map = {
    navy: ['--navy','value'], blue: ['--blue','value'], blue2: ['--blue2','value'], gold: ['--gold','value'],
    text: ['--text','value'], muted: ['--muted','value'], light: ['--light','value'], light2: ['--light2','value'],
    border: ['--border','value'], footer_background: ['--footer-bg','value'], footer_text: ['--footer-text','value'],
    header_background: ['--header-bg','value'],
    container_max: ['--max','px'],
    logo_max_width_mobile: ['--logo-max-width-mobile','%'], header_logo_width: ['--logo-width','px'], header_logo_height: ['--logo-height','px'],
    hero_min_height: ['--hero-height','px'], hero_overlay_opacity: ['--hero-overlay','value'], instagram_width: ['--instagram-width','px'], instagram_height: ['--instagram-height','px'], instagram_crop_top: ['--instagram-crop-top','px'], instagram_crop_bottom: ['--instagram-crop-bottom','px'],
    hero_left_offset: ['--hero-left-offset','px'],
    profile_photo_ratio_width: ['--profile-photo-ratio-width','value'],
    profile_photo_ratio_height: ['--profile-photo-ratio-height','value'],
    mobile_side_padding: ['--mobile-side-padding','px'], mobile_logo_width: ['--mobile-logo-width','px'], mobile_header_height: ['--mobile-header-height','px'], mobile_section_spacing: ['--mobile-section-spacing','px'], mobile_reel_height: ['--mobile-reel-height','px'],
    base_font_size: ['--base','px'], section_spacing: ['--section-spacing','px'], card_radius: ['--card-radius','px'], social_icon_size: ['--social-icon-size','px'],
    header_min_height: ['--header-height','px'], nav_font_size: ['--nav-font-size','px'], nav_gap: ['--nav-gap','px'], social_gap: ['--social-gap','px'], footer_social_gap: ['--footer-social-gap','px'],
    hero_content_max: ['--hero-content-max','px'], hero_content_padding: ['--hero-content-padding','px'], hero_company_size: ['--hero-company-size','px'],
    hero_company_line_height: ['--hero-company-line-height','value'], hero_heading_size: ['--hero-heading-size','px'], hero_heading_line_height: ['--hero-heading-line-height','value'],
    hero_description_size: ['--hero-description-size','px'], hero_kicker_size: ['--hero-kicker-size','px'], hero_border_width: ['--hero-border-width','px'], hero_border_color: ['--hero-border-color','value'],
    hero_sound_size: ['--hero-sound-size','px'], section_heading_margin: ['--section-heading-margin','px'], section_title_size: ['--section-title-size','px'],
    section_description_size: ['--section-description-size','px'], card_title_size: ['--card-title-size','px'], card_text_size: ['--card-text-size','px'],
    button_font_size: ['--button-font-size','px'], button_padding_y: ['--button-padding-y','px'], button_padding_x: ['--button-padding-x','px'], button_radius: ['--button-radius','px'],
    page_hero_padding: ['--page-hero-padding','px'], page_hero_title_size: ['--page-hero-title-size','px'], page_hero_description_size: ['--page-hero-description-size','px'],
    about_title_size: ['--about-title-size','px'], about_text_size: ['--about-text-size','px'], about_reel_gap: ['--about-reel-gap','px'], instagram_radius: ['--instagram-radius','px'],
    instagram_arrow_size: ['--instagram-arrow-size','px'], instagram_arrow_button_size: ['--instagram-arrow-button-size','px'], profile_card_width: ['--profile-card-width','px'],
    service_detail_title_size: ['--service-detail-title-size','px'], service_detail_text_size: ['--service-detail-text-size','px'], service_image_height: ['--service-image-height','px'],
    detail_heading_size: ['--detail-heading-size','px'], detail_text_size: ['--detail-text-size','px'], why_image_height: ['--why-image-height','px'], process_image_height: ['--process-image-height','px'],
    process_title_size: ['--process-title-size','px'], process_text_size: ['--process-text-size','px'], contact_heading_size: ['--contact-heading-size','px'], contact_text_size: ['--contact-text-size','px'],
    form_label_size: ['--form-label-size','px'], footer_heading_size: ['--footer-heading-size','px'], footer_text_size: ['--footer-text-size','px'], footer_bottom_size: ['--footer-bottom-size','px'],
    footer_logo_width: ['--footer-logo-width','px'], footer_logo_height: ['--footer-logo-height','px'], whatsapp_size: ['--whatsapp-size','px'], whatsapp_right: ['--whatsapp-right','px'],
    whatsapp_bottom: ['--whatsapp-bottom','px'], service_grid_gap: ['--service-grid-gap','px'], why_grid_gap: ['--why-grid-gap','px'], process_grid_gap: ['--process-grid-gap','px'],
    card_padding: ['--card-padding','px'],
    button_primary_background: ['--button-primary-bg','value'],
    button_primary_text: ['--button-primary-text','value'],
    button_dark_background: ['--button-dark-bg','value'],
    button_dark_text: ['--button-dark-text','value'],
    button_outline_border: ['--button-outline-border','value'],
    button_outline_text: ['--button-outline-text','value'],
    button_outline_background: ['--button-outline-bg','value'],
    eyebrow_size: ['--eyebrow-size','px'],
    eyebrow_letter_spacing: ['--eyebrow-letter-spacing','px'],
    trust_title_size: ['--trust-title-size','px'],
    trust_text_size: ['--trust-text-size','px'],
    trust_icon_size: ['--trust-icon-size','px'],
    about_point_size: ['--about-point-size','px'],
    service_number_size: ['--service-number-size','px'],
    service_icon_size: ['--service-icon-size','px'],
    service_arrow_size: ['--service-arrow-size','px'],
    why_icon_size: ['--why-icon-size','px'],
    why_title_size: ['--why-title-size','px'],
    cta_title_size: ['--cta-title-size','px'],
    cta_text_size: ['--cta-text-size','px'],
    profile_label_size: ['--profile-label-size','px'],
    profile_name_size: ['--profile-name-size','px'],
    profile_position_size: ['--profile-position-size','px'],
    about_closing_size: ['--about-closing-size','px'],
    contact_label_size: ['--contact-label-size','px'],
    contact_value_size: ['--contact-value-size','px'],
    form_input_size: ['--form-input-size','px'],
    detail_list_size: ['--detail-list-size','px'],
    footer_link_size: ['--footer-link-size','px'],
    service_icon_background: ['--service-icon-bg','value'],
    service_icon_color: ['--service-icon-color','value'],
    service_arrow_background: ['--service-arrow-bg','value'],
    service_arrow_color: ['--service-arrow-color','value'],
    hero_object_position: ['--hero-object-position','value'],
    hero_overlay_right_opacity: ['--hero-overlay-right-opacity','value'],
    why_image_object_fit: ['--why-image-object-fit','value'],
    service_image_object_fit: ['--service-image-object-fit','value'],
    process_image_object_fit: ['--process-image-object-fit','value'],
    social_icon_padding: ['--social-icon-padding','px'],
    font_body_family: ['--font-body','value'], font_heading_family: ['--font-heading','value'], font_nav_family: ['--font-nav','value'], font_button_family: ['--font-button','value'],
    font_body_style: ['--body-font-style','value'], font_heading_style: ['--font-heading-style','value'], font_nav_style: ['--font-nav-style','value'], font_button_style: ['--font-button-style','value'],
    font_body_weight: ['--font-body-weight','value'], font_heading_weight: ['--font-heading-weight','value'], font_nav_weight: ['--font-nav-weight','value'], font_button_weight: ['--font-button-weight','value']
  };

  Object.entries(map).forEach(([key, [cssVar, unit]]) => {
    const value = t[key];
    if (value === undefined || value === null || value === '') return;
    root.style.setProperty(cssVar, unit === 'value' ? String(value) : `${value}${unit}`);
  });

  loadGoogleFonts(t);

  const customCss = String(site.custom_css || '').trim();
  let customStyle = document.getElementById('customCmsCss');
  if (!customStyle) {
    customStyle = document.createElement('style');
    customStyle.id = 'customCmsCss';
    document.head.appendChild(customStyle);
  }
  customStyle.textContent = customCss;
}

function socialItems(site) {
  return Array.isArray(site.social?.items) ? site.social.items.filter(x => x && x.enabled !== false && x.url).slice(0, 12) : [];
}

function socialHtml(site, location) {
  return socialItems(site).map(item => {
    const color = location === 'footer' ? (item.footer_color || item.color || '#ffffff') : (item.header_color || item.color || '#111111');
    return `<a class="${escapeHtml(item.class_name || '')}" href="${escapeHtml(item.url)}" target="_blank" rel="noopener" aria-label="${escapeHtml(item.label || item.key || 'Social')}" style="--social-color:${escapeHtml(color)}"><i class="${escapeHtml(item.icon || 'fa-solid fa-link')}"></i></a>`;
  }).join('');
}

function renderHeader(site) {
  const n = site.navigation || {};
  const ui = site.ui || {};
  const visibility = site.section_visibility || {};
  const logo = normalizeAsset(site.media_assets?.logo || '/images/uploads/logo_transparent_png_tm.png');
  const social = visibility.header_social === false ? '' : `<div class="social-top">${socialHtml(site,'header')}</div>`;
  const html = `<header><div class="container navbar">
    <a href="./index.html" class="brand" aria-label="${escapeHtml(site.company_name || 'AssurIntellec™')}">
      <img class="brand-logo" src="${escapeHtml(logo)}" alt="${escapeHtml(site.company_name || 'AssurIntellec™')}" onerror="this.style.display='none';this.nextElementSibling.style.display='block';">
      <div class="brand-fallback">${escapeHtml(site.company_name || 'AssurIntellec™')}</div>
    </a>
    <nav id="mainNav">
      <a href="./index.html">${escapeHtml(n.home || 'Home')}</a>
      <a href="./about.html">${escapeHtml(n.about || 'About Us')}</a>
      <a href="./services.html">${escapeHtml(n.services || 'Services')}</a>
      <a href="./why-us.html">${escapeHtml(n.why_us || 'Why Us')}</a>
      <a href="./contact.html">${escapeHtml(n.contact || 'Contact Us')}</a>
      ${social}
    </nav>
    <button class="menu-toggle" id="menuToggle" type="button" aria-label="${escapeHtml(ui.menu_open_label || 'Open navigation')}" title="${escapeHtml(ui.menu_open_label || 'Open navigation')}"><i class="fas fa-bars"></i></button>
  </div></header>`;
  document.getElementById('site-header').innerHTML = html;

  const toggle = document.getElementById('menuToggle');
  const nav = document.getElementById('mainNav');
  toggle?.addEventListener('click', () => {
    nav.classList.toggle('active');
    const open = nav.classList.contains('active');
    const icon = toggle.querySelector('i');
    if (icon) icon.className = open ? 'fas fa-xmark' : 'fas fa-bars';
    toggle.setAttribute('aria-label', open ? (ui.menu_close_label || 'Close navigation') : (ui.menu_open_label || 'Open navigation'));
    toggle.setAttribute('title', open ? (ui.menu_close_label || 'Close navigation') : (ui.menu_open_label || 'Open navigation'));
  });

  document.querySelectorAll('#mainNav a').forEach(a => a.addEventListener('click', () => nav.classList.remove('active')));
}

function telephoneHref(value) {
  const raw = String(value || '').trim();
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `+91${digits}`;
  return `+${digits}`;
}

function renderFooter(site, services) {
  const f = site.footer || {};
  const n = site.navigation || {};
  const visibility = site.section_visibility || {};
  const logo = normalizeAsset(
    site.media_assets?.logo ||
    '/images/uploads/logo_transparent_png_tm.png'
  );

  const serviceLinks = services.slice(0, 7).map(s => `
    <li>
      <a href="./${escapeHtml(s.page_file || `service-${s.slug}.html`)}">
        ${escapeHtml(s.title || '')}
      </a>
    </li>
  `).join('');

  const footerSocial = visibility.footer_social === false
    ? ''
    : `<div class="footer-social">${socialHtml(site, 'footer')}</div>`;

  const holder = document.getElementById('site-footer');
  if (!holder) return;

  holder.innerHTML = `
    <footer>
      <div class="container">
        <div class="footer-grid">

          <div class="footer-brand">
            <img
              class="footer-logo"
              src="${escapeHtml(logo)}"
              alt="${escapeHtml(site.company_name || 'AssurIntellec™')}"
            >
            <p>${escapeHtml(f.description || '')}</p>
          </div>

          <div>
            <h4>${escapeHtml(f.quick_links_title || 'Quick Links')}</h4>
            <ul class="footer-links">
              <li><a href="./index.html">${escapeHtml(n.home || 'Home')}</a></li>
              <li><a href="./about.html">${escapeHtml(n.about || 'About Us')}</a></li>
              <li><a href="./services.html">${escapeHtml(n.services || 'Services')}</a></li>
              <li><a href="./why-us.html">${escapeHtml(n.why_us || 'Why Us')}</a></li>
              <li><a href="./contact.html">${escapeHtml(n.contact || 'Contact Us')}</a></li>
            </ul>
          </div>

          <div>
            <h4>${escapeHtml(f.services_title || 'Services')}</h4>
            <ul class="footer-links">${serviceLinks}</ul>
          </div>

          <div>
            <h4>${escapeHtml(f.social_title || 'Connect')}</h4>
            ${footerSocial}

            <h4 style="margin-top:20px">
              ${escapeHtml(f.contact_title || 'Contact')}
            </h4>

            <div class="footer-contact">
              <span>
                <strong>${escapeHtml(site.contact?.phone_label || 'Office No.')}</strong>
                <a href="tel:${escapeHtml(telephoneHref(site.contact?.phone))}">
                  ${escapeHtml(site.contact?.phone || '')}
                </a>
              </span>

              <span>
                <strong>${escapeHtml(site.contact?.mobile_phone_label || 'Mobile No.')}</strong>
                <a href="tel:${escapeHtml(telephoneHref(site.contact?.mobile_phone))}">
                  ${escapeHtml(site.contact?.mobile_phone || '')}
                </a>
              </span>

              <span>
                <strong>${escapeHtml(site.contact?.email_label || 'Email')}</strong>
                <a href="mailto:${escapeHtml(site.contact?.email || '')}">
                  ${escapeHtml(site.contact?.email || '')}
                </a>
              </span>

              <span>
                <strong>Website</strong>
                <a
                  href="${escapeHtml(site.contact?.website || '#')}"
                  target="_blank"
                  rel="noopener"
                >
                  ${escapeHtml(site.contact?.website_display || site.contact?.website || '')}
                </a>
              </span>
            </div>
          </div>

        </div>

        <div class="footer-bottom">
          <p>
            © ${new Date().getFullYear()}
            ${escapeHtml(site.company_name || 'AssurIntellec™')}.
            ${escapeHtml(f.copyright || '')}
          </p>
          <p>${escapeHtml(site.tagline || '')}</p>
        </div>
      </div>
    </footer>
  `;
}

function renderWhatsApp(site) {
  const holder = document.getElementById('whatsappFloat');
  if (!holder) return;
  if (site.section_visibility?.floating_whatsapp === false) {
    holder.innerHTML = '';
    return;
  }
  const c = site.contact || {};
  if (!c.whatsapp) {
    holder.innerHTML = '';
    return;
  }
  holder.innerHTML = `<a class="whatsapp-float" href="${escapeHtml(c.whatsapp)}" target="_blank" rel="noopener" aria-label="${escapeHtml(c.whatsapp_label || 'WhatsApp')}" title="${escapeHtml(c.whatsapp_text || 'Start WhatsApp conversation')}"><i class="fab fa-whatsapp"></i></a>`;
}

function updateMeta(site) {
  document.title = site.seo?.title || site.company_name || 'AssurIntellec™';

  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.content = site.seo?.description || '';

  const canonical = document.querySelector('link[rel="canonical"]');
  const canonicalBase = String(site.seo?.canonical_base || '').trim().replace(/\/$/, '');

  if (canonical && canonicalBase) {
    const pageName = window.location.pathname.split('/').filter(Boolean).pop() || '';
    canonical.href = pageName && pageName.toLowerCase() !== 'index.html'
      ? `${canonicalBase}/${pageName}`
      : `${canonicalBase}/`;
  }
}

function normalizeServices(data) {
  return Array.isArray(data?.services) ? data.services : (Array.isArray(data) ? data : []);
}

function renderServiceCards(services) {
  const grid = document.getElementById('servicesGrid');
  if (!grid) return;
  const aria = SITE?.ui?.service_read_aria || 'Open service details';
  grid.innerHTML = services.map((service, index) => {
    const file = service.page_file || `service-${service.slug}.html`;
    return `<a class="service-card" href="./${escapeHtml(file)}" aria-label="${escapeHtml(`${aria}: ${service.title || ''}`)}">
      <div class="service-title-content">
        <span class="service-number">${String(index + 1).padStart(2,'0')}.</span>
        <span class="service-icon">${iconHtml(service.icon)}</span>
        <h3>${escapeHtml(service.title)}</h3>
      </div>
      <span class="service-read" aria-hidden="true"><i class="fas fa-arrow-right"></i></span>
    </a>`;
  }).join('');
}

function renderWhyPreview(site) {
  const grid = document.getElementById('whyPreviewGrid');
  if (!grid) return;
  grid.innerHTML = (site.why_us?.cards || []).slice(0,4).map(card => `<article class="why-card">
    <img class="why-card-image" src="${escapeHtml(normalizeAsset(card.image))}" alt="${escapeHtml(card.image_alt || card.title || '')}">
    <div class="why-card-body"><i class="fas ${escapeHtml(card.icon || 'fa-circle-nodes')}"></i><h3>${escapeHtml(card.title || '')}</h3><p>${escapeHtml(card.text || '')}</p></div>
  </article>`).join('');
}

function renderHome(site, services) {
  const h = site.hero || {};
  const home = site.home || {};

  setText('heroCompany', h.company_name || site.company_name);
  setText('heroKicker', h.kicker);
  setText('heroHeading', h.heading);
  setText('heroDescription', h.description);
  setText('heroPrimaryButton', h.button_primary);
  setHref('heroPrimaryButton', h.button_primary_url || './services.html');
  setText('heroSecondaryButton', h.button_secondary);
  setHref('heroSecondaryButton', h.button_secondary_url || './contact.html');

  const video = document.getElementById('heroVideo');
  const poster = document.getElementById('heroImage');
  if (video) {
    video.autoplay = h.video_autoplay !== false;
    video.loop = h.video_loop !== false;
    heroAudioEnabled = h.video_audio_default_enabled !== false;
    video.volume = 1;
    video.muted = !heroAudioEnabled;
    video.innerHTML = `<source src="${escapeHtml(normalizeAsset(h.video || site.media_assets?.hero_video || '/videos/hero-60sec.mp4'))}" type="video/mp4">`;
    video.setAttribute('aria-label', h.video_alt || 'AssurIntellec hero video');
    video.load();
  }
  setImg(poster, h.poster || site.media_assets?.hero_poster || '/images/uploads/hero.jpg', h.poster_alt || 'Pharmaceutical facility');
  if (poster) poster.style.display = 'none';

  const sound = document.getElementById('heroSound');
  const updateHeroSoundButton = () => {
    if (!sound || !video) return;
    const muted = !!video.muted;
    sound.innerHTML = muted ? '<i class="fas fa-volume-xmark"></i>' : '<i class="fas fa-volume-high"></i>';
    sound.setAttribute('aria-label', muted ? (h.video_sound_label || 'Enable hero video sound') : (h.video_mute_label || 'Mute hero video'));
    sound.setAttribute('title', sound.getAttribute('aria-label'));
  };

  if (sound && video) {
    updateHeroSoundButton();
    if (!sound.dataset.bound) {
      sound.dataset.bound = '1';
      sound.addEventListener('click', () => {
        video.muted = !video.muted;
        video.volume = 1;
        updateHeroSoundButton();
        video.play().catch(() => {});
      });
    }

    // Try to honour the CMS default. Most browsers block autoplay with sound;
    // when blocked, fall back to muted autoplay and let the visitor enable audio.
    if (video.autoplay) {
      video.play().then(() => {
        updateHeroSoundButton();
      }).catch(() => {
        if (heroAudioEnabled) {
          video.muted = true;
          updateHeroSoundButton();
        }
      });
    }
  }
  video?.addEventListener('error', () => { if (poster) poster.style.display = 'block'; });

  const trust = document.getElementById('trustGrid');
  if (trust) trust.innerHTML = (home.trust_items || []).map(item => `<div class="trust-item"><i class="fas ${escapeHtml(item.icon || 'fa-circle')}"></i><strong>${escapeHtml(item.title || '')}</strong><span>${escapeHtml(item.text || '')}</span></div>`).join('');

  const about = home.about_preview || {};
  setText('aboutPreviewEyebrow', about.eyebrow);
  setText('aboutPreviewTitle', about.title);
  setText('aboutPreviewText', about.paragraph || about.text);
  setText('aboutPreviewButton', about.button || 'About Us');
  setHref('aboutPreviewButton', about.button_url || './about.html');
  const points = document.getElementById('aboutPreviewPoints');
  if (points) points.innerHTML = (about.points || []).map(point => `<div class="about-point"><i class="fas fa-circle-check"></i><span>${escapeHtml(point)}</span></div>`).join('');

  const servicePreview = home.services_preview || {};
  setText('servicesPreviewEyebrow', servicePreview.eyebrow);
  setText('servicesPreviewTitle', servicePreview.title);
  setText('servicesPreviewDescription', servicePreview.description);
  setText('servicesPreviewButton', servicePreview.button || 'View All Services');
  setHref('servicesPreviewButton', servicePreview.button_url || './services.html');
  renderServiceCards(services);

  const whyPreview = home.why_preview || {};
  setText('whyPreviewEyebrow', whyPreview.eyebrow);
  setText('whyPreviewTitle', whyPreview.title);
  setText('whyPreviewDescription', whyPreview.description);
  setText('whyPreviewButton', whyPreview.button || 'Why Us');
  setHref('whyPreviewButton', whyPreview.button_url || './why-us.html');
  renderWhyPreview(site);

  const cta = home.cta || {};
  setText('homeCtaTitle', cta.title);
  setText('homeCtaText', cta.text);
  setText('homeCtaButton', cta.button || 'Contact Us');
  setHref('homeCtaButton', cta.button_url || './contact.html');

  try {
    renderInstagram(site);
  } catch (error) {
    console.error('Instagram Reel failed to render:', error);
  }
  applyVisibility(site);
}

let instagramEmbedScriptPromise = null;

/*
  Loads Instagram's official public embed.js library exactly once and
  caches the loading promise so every render just re-uses it. This
  function was previously called but never defined anywhere in this
  file, which threw a JavaScript error on every homepage load and
  stopped the Reel (and any code after it) from working at all.
*/
function ensureInstagramEmbedScript() {
  if (window.instgrm?.Embeds) {
    return Promise.resolve();
  }

  if (instagramEmbedScriptPromise) {
    return instagramEmbedScriptPromise;
  }

  instagramEmbedScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(
      'script[data-instagram-embed]'
    );

    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Instagram embed script.')));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://www.instagram.com/embed.js';
    script.async = true;
    script.defer = true;
    script.dataset.instagramEmbed = '1';
    script.addEventListener('load', () => resolve());
    script.addEventListener('error', () => {
      instagramEmbedScriptPromise = null;
      reject(new Error('Failed to load Instagram embed script.'));
    });

    document.head.appendChild(script);
  });

  return instagramEmbedScriptPromise;
}

function instagramId(url) {
  const match = String(url || '').match(/instagram\.com\/(?:reel|reels|p)\/([^/?#]+)/i);
  return match ? match[1] : '';
}

function renderInstagram(site) {
  const holder = document.getElementById('instagramReel');
  if (!holder) return;

  const section = site.home?.instagram_section || {};
  const prev = document.getElementById('instagramPrev');
  const next = document.getElementById('instagramNext');

  if (section.enabled === false) {
    holder.innerHTML = '';
    if (prev) prev.style.display = 'none';
    if (next) next.style.display = 'none';
    return;
  }

  const list = (site.instagram_reels || []).filter(
    item => item && item.enabled !== false && item.url && instagramId(item.url)
  );

  if (!list.length) {
    holder.innerHTML = `
      <div class="instagram-placeholder">
        <i class="fab fa-instagram"></i>
        <strong>Instagram Reel</strong>
        <span>${escapeHtml(
          section.empty_message ||
          'Add public Instagram Reel URLs in Decap CMS.'
        )}</span>
      </div>
    `;
    if (prev) prev.disabled = true;
    if (next) next.disabled = true;
    return;
  }

  instagramIndex = Math.max(
    0,
    Math.min(instagramIndex, list.length - 1)
  );

  const item = list[instagramIndex];
  const id = instagramId(item.url);

  /*
    Use the official public Instagram Reel embed path.
    The non-captioned /embed/ path is used instead of /embed/captioned/.
    The outer viewer is a fixed portrait viewport; the external Instagram
    iframe remains untouched because it is cross-origin.
  */
  const embedUrl =
    `https://www.instagram.com/reel/${encodeURIComponent(id)}/embed/`;

  holder.innerHTML = `
    <blockquote
      class="instagram-media"
      data-instgrm-permalink="https://www.instagram.com/reel/${encodeURIComponent(id)}/"
      data-instgrm-version="14"
      style="background:#fff;border:0;border-radius:0;box-shadow:none;margin:0;padding:0;width:100%;"
    ></blockquote>
  `;

  if (prev) {
    prev.style.display = 'inline-flex';
    prev.disabled = list.length < 2;
    prev.setAttribute(
      'aria-label',
      section.prev_label || 'Previous Instagram Reel'
    );
    prev.title =
      section.prev_label || 'Previous Instagram Reel';
  }

  if (next) {
    next.style.display = 'inline-flex';
    next.disabled = list.length < 2;
    next.setAttribute(
      'aria-label',
      section.next_label || 'Next Instagram Reel'
    );
    next.title =
      section.next_label || 'Next Instagram Reel';
  }

  /*
    The visible media is created by Instagram's official embed.js.
    The embedUrl is retained as a data attribute for diagnostics and
    future CMS-compatible integrations without changing the public URL.
  */
  holder.dataset.embedUrl = embedUrl;

  ensureInstagramEmbedScript()
    .then(() => {
      try {
        window.instgrm?.Embeds?.process();
      } catch (_) {}
    })
    .catch(() => {
      // If Instagram's script cannot be reached (offline, blocked, etc.)
      // show a friendly fallback instead of leaving an empty box.
      if (holder.dataset.embedUrl === embedUrl) {
        holder.innerHTML = `
          <div class="instagram-placeholder">
            <i class="fab fa-instagram"></i>
            <strong>Instagram Reel</strong>
            <span>Unable to load the Reel right now. <a href="${holder.dataset.embedUrl.replace('/embed/', '/')}" target="_blank" rel="noopener">View it on Instagram</a>.</span>
          </div>
        `;
      }
    });
}

function bindInstagramButtons() {
  const prev = document.getElementById('instagramPrev');
  const next = document.getElementById('instagramNext');

  if (prev && !prev.dataset.bound) {
    prev.dataset.bound = '1';

    prev.addEventListener('click', () => {
      const list = (SITE?.instagram_reels || []).filter(
        item => item && item.enabled !== false && item.url && instagramId(item.url)
      );

      if (list.length < 2) return;

      instagramIndex =
        (instagramIndex - 1 + list.length) % list.length;

      renderInstagram(SITE);
    });
  }

  if (next && !next.dataset.bound) {
    next.dataset.bound = '1';

    next.addEventListener('click', () => {
      const list = (SITE?.instagram_reels || []).filter(
        item => item && item.enabled !== false && item.url && instagramId(item.url)
      );

      if (list.length < 2) return;

      instagramIndex =
        (instagramIndex + 1) % list.length;

      renderInstagram(SITE);
    });
  }
}

function renderAbout(site) {
  const about = site.about || {};
  const ui = site.ui || {};

  setText('aboutEyebrow', about.eyebrow);
  setText('aboutPageTitle', about.page_title);
  setText('aboutPageDescription', about.page_description);
  setText('profileCardLabel', about.profile_card_label || 'Founder Profile');
  setText('profileName', about.profile_name);
  setText('profilePosition', about.profile_position);
  setText('profilePhoneText', about.profile_phone || '');
  setHref('profilePhone', `tel:${telephoneHref(about.profile_phone)}`);
  setText('profileEmailText', about.profile_email || '');
  setHref('profileEmail', about.profile_email ? `mailto:${about.profile_email}` : '');
  setText('aboutApproachTitle', about.approach_title);
  setText('aboutApproachFlow', about.approach_flow);
  setText('aboutClosing', about.closing);

  const photo = document.getElementById('profilePhoto');
  setImg(
    photo,
    about.profile_photo || site.media_assets?.profile_photo,
    about.profile_photo_alt || about.profile_name || 'Profile photo'
  );

  const ph = document.getElementById('profilePhotoPlaceholder');
  if (ph) {
    const span = ph.querySelector('span');
    const small = ph.querySelector('small');
    if (span) span.textContent = about.profile_missing_title || ui.profile_placeholder_title || 'Upload profile photo';
    if (small) small.textContent = about.profile_missing_help || ui.profile_placeholder_help || 'Use Decap CMS → Site Settings → About Us';
  }

  const textHolder = document.getElementById('aboutMainText');
  if (textHolder) {
    textHolder.innerHTML = (about.main_paragraphs || [])
      .map(p => `<p>${escapeHtml(p)}</p>`)
      .join('');
  }

  if (photo) {
    photo.addEventListener('load', () => {
      if (ph) ph.style.display = 'none';
    }, { once: true });

    photo.addEventListener('error', () => {
      if (ph) ph.style.display = 'flex';
      photo.style.display = 'none';
    }, { once: true });
  }
}

function renderWhy(site) {
  const why = site.why_us || {};
  setText('whyEyebrow', why.eyebrow);
  setText('whyPageTitle', why.page_title);
  setText('whyPageDescription', why.page_description);
  const grid = document.getElementById('whyGrid');
  if (grid) grid.innerHTML = (why.cards || []).map(card => `<article class="why-card">
    <img class="why-card-image" src="${escapeHtml(normalizeAsset(card.image))}" alt="${escapeHtml(card.image_alt || card.title || '')}">
    <div class="why-card-body"><i class="fas ${escapeHtml(card.icon || 'fa-circle-nodes')}"></i><h3>${escapeHtml(card.title || '')}</h3><p>${escapeHtml(card.text || '')}</p></div>
  </article>`).join('');

  const process = document.getElementById('processGrid');
  if (process) process.innerHTML = (why.process || []).map(item => `<article class="process-card">
    <img src="${escapeHtml(normalizeAsset(item.image))}" alt="${escapeHtml(item.image_alt || item.title || '')}">
    <div class="process-card-body"><div class="process-number">${escapeHtml(item.number || '')}</div><h3>${escapeHtml(item.title || '')}</h3><p>${escapeHtml(item.text || '')}</p></div>
  </article>`).join('');
}

function renderContact(site, services) {
  const c = site.contact || {};
  const ui = site.ui || {};

  setText('contactEyebrow', c.page_eyebrow);
  setText('contactPageTitle', c.page_title);
  setText('contactPageDescription', c.page_description);
  setText('contactHeading', c.heading);
  setText('contactDescription', c.description);
  setText('contactFormTitle', c.form_title);
  setText('labelName', c.form_name_label);
  setText('labelCompany', c.form_company_label);
  setText('labelEmail', c.form_email_label);
  setText('labelPhone', c.form_phone_label);
  setText('labelService', c.form_service_label);
  setText('labelMessage', c.form_message_label);
  setText('contactSubmitButton', c.form_button || 'Send Enquiry');

  [
    ['name', c.form_name_placeholder],
    ['company', c.form_company_placeholder],
    ['email', c.form_email_placeholder],
    ['phone', c.form_phone_placeholder],
    ['message', c.form_message_placeholder]
  ].forEach(([id, placeholder]) => {
    const el = document.getElementById(id);
    if (el) el.placeholder = placeholder || '';
  });

  const items = document.getElementById('contactItems');
  if (items) {
    items.innerHTML = `
      <div class="contact-item">
        <i class="fas fa-building"></i>
        <div>
          <strong>${escapeHtml(c.phone_label || 'Office No.')}</strong>
          <a href="tel:${escapeHtml(telephoneHref(c.phone))}">
            ${escapeHtml(c.phone || '')}
          </a>
        </div>
      </div>

      <div class="contact-item">
        <i class="fas fa-mobile-screen-button"></i>
        <div>
          <strong>${escapeHtml(c.mobile_phone_label || 'Mobile No.')}</strong>
          <a href="tel:${escapeHtml(telephoneHref(c.mobile_phone))}">
            ${escapeHtml(c.mobile_phone || '')}
          </a>
        </div>
      </div>

      <div class="contact-item">
        <i class="fas fa-envelope"></i>
        <div>
          <strong>${escapeHtml(c.email_label || 'Email')}</strong>
          <a href="mailto:${escapeHtml(c.email || '')}">
            ${escapeHtml(c.email || '')}
          </a>
        </div>
      </div>

      <div class="contact-item">
        <i class="fas fa-globe"></i>
        <div>
          <strong>${escapeHtml(c.website_label || 'Website')}</strong>
          <a href="${escapeHtml(c.website || '#')}" target="_blank" rel="noopener">
            ${escapeHtml(c.website_display || c.website || '')}
          </a>
        </div>
      </div>

      <div class="contact-item">
        <i class="fab fa-whatsapp"></i>
        <div>
          <strong>${escapeHtml(c.whatsapp_label || 'WhatsApp')}</strong>
          <a href="${escapeHtml(c.whatsapp || '#')}" target="_blank" rel="noopener">
            ${escapeHtml(c.whatsapp_text || 'Start WhatsApp conversation')}
          </a>
        </div>
      </div>
    `;
  }

  const select = document.getElementById('service');
  if (select) {
    select.innerHTML =
      `<option value="">${escapeHtml(c.form_service_placeholder || ui.contact_select_placeholder || 'Select requirement')}</option>` +
      services.map(service =>
        `<option value="${escapeHtml(service.title)}">${escapeHtml(service.title)}</option>`
      ).join('');
  }

  const form = document.getElementById('contactForm');
  if (form && !form.dataset.bound) {
    form.dataset.bound = '1';

    form.addEventListener(
      'submit',
      event => handleEnquirySubmit(event, site)
    );

    const whatsappButton =
      document.getElementById('contactWhatsAppButton');

    if (whatsappButton) {
      whatsappButton.addEventListener(
        'click',
        () => handleWhatsAppEnquiry(site)
      );
    }
  }

  bindEnquirySuccessOverlay(site);
}

function templateMessage(template, data) {
  return String(template || '')
    .replaceAll('{name}', data.name || '')
    .replaceAll('{company}', data.company || '')
    .replaceAll('{email}', data.email || '')
    .replaceAll('{phone}', data.phone || '')
    .replaceAll('{service}', data.service || '')
    .replaceAll('{message}', data.message || '');
}

function showToast(message, ok = true) {
  const toast = document.getElementById('siteToast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  toast.style.background = ok ? 'var(--navy)' : '#7a1f29';
  clearTimeout(window.__toast);
  window.__toast = setTimeout(() => toast.classList.remove('show'), 4500);
}

function validateForm(form) {
  let validForm = true;
  form.querySelectorAll('[required]').forEach(field => {
    const valid = field.value.trim() !== '' && (field.type !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim()));
    field.classList.toggle('invalid', !valid);
    if (!valid) validForm = false;
  });
  return validForm;
}

let enquiryBridgeFrame = null;
let enquiryBridgeUrl = '';
let enquiryBridgeReady = false;
let enquiryBridgeQueue = [];
let enquiryRequestCounter = 0;
let enquiryBridgeReadyTimeoutId = null;
const pendingEnquiries = new Map();

// How long we wait for the hidden Apps Script bridge iframe to announce
// it has loaded and is ready to receive messages. If this is exceeded,
// the bridge itself is unreachable/misconfigured (e.g. the Apps Script
// web app deployment is stale, or its access is not set to "Anyone"),
// so we fail fast with a specific, actionable message instead of
// leaving the visitor waiting on a generic 60-second timeout.
const ENQUIRY_BRIDGE_READY_TIMEOUT_MS = 12000;

// Overall ceiling for the whole round trip once the bridge is ready.
const ENQUIRY_RESPONSE_TIMEOUT_MS = 25000;

function failAllPendingEnquiries(message) {
  const entries = Array.from(pendingEnquiries.entries());
  pendingEnquiries.clear();
  enquiryBridgeQueue = [];

  entries.forEach(([, pending]) => {
    clearTimeout(pending.timeoutId);
    pending.callback(false, message);
  });
}

function createEnquiryBridge(url) {
  if (
    enquiryBridgeFrame &&
    enquiryBridgeUrl === url
  ) {
    return enquiryBridgeFrame;
  }

  if (enquiryBridgeFrame) {
    try {
      enquiryBridgeFrame.remove();
    } catch (_) {}
  }

  clearTimeout(enquiryBridgeReadyTimeoutId);

  enquiryBridgeFrame = document.createElement('iframe');
  enquiryBridgeFrame.id = 'assurIntellecEnquiryBridge';
  enquiryBridgeFrame.title = 'AssurIntellec enquiry service';
  enquiryBridgeFrame.setAttribute('aria-hidden', 'true');
  enquiryBridgeFrame.setAttribute('tabindex', '-1');
  enquiryBridgeFrame.style.position = 'fixed';
  enquiryBridgeFrame.style.left = '-10000px';
  enquiryBridgeFrame.style.top = '-10000px';
  enquiryBridgeFrame.style.width = '1px';
  enquiryBridgeFrame.style.height = '1px';
  enquiryBridgeFrame.style.border = '0';
  enquiryBridgeFrame.style.opacity = '0';
  enquiryBridgeFrame.style.pointerEvents = 'none';

  enquiryBridgeFrame.addEventListener('error', () => {
    failAllPendingEnquiries(
      'The enquiry service could not be reached. Please check your internet connection, or send your enquiry using the WhatsApp/email options below.'
    );
  });

  enquiryBridgeFrame.src = url;

  enquiryBridgeUrl = url;
  enquiryBridgeReady = false;
  enquiryBridgeQueue = [];

  document.body.appendChild(enquiryBridgeFrame);

  enquiryBridgeReadyTimeoutId = window.setTimeout(() => {
    if (enquiryBridgeReady) return;

    failAllPendingEnquiries(
      'The enquiry service is not responding. This usually means the Apps Script web app needs to be redeployed, or its access is not set to "Anyone". Please try again shortly, or use WhatsApp/email below.'
    );
  }, ENQUIRY_BRIDGE_READY_TIMEOUT_MS);

  return enquiryBridgeFrame;
}

window.addEventListener('message', event => {
  const frame = enquiryBridgeFrame;

  if (!frame) return;
  if (event.source !== frame.contentWindow) return;

  const message = event.data || {};

  if (
    message.type ===
    'assurintellec:bridge-ready'
  ) {
    enquiryBridgeReady = true;
    clearTimeout(enquiryBridgeReadyTimeoutId);

    const queue = [
      ...enquiryBridgeQueue
    ];

    enquiryBridgeQueue = [];

    queue.forEach(item => {
      try {
        frame.contentWindow.postMessage(
          item,
          '*'
        );
      } catch (error) {
        const pending =
          pendingEnquiries.get(
            item.requestId
          );

        if (pending) {
          clearTimeout(pending.timeoutId);
          pendingEnquiries.delete(
            item.requestId
          );
          pending.callback(
            false,
            error?.message ||
            'Unable to contact enquiry service.'
          );
        }
      }
    });

    return;
  }

  if (
    message.type ===
    'assurintellec:result'
  ) {
    const pending =
      pendingEnquiries.get(
        message.requestId
      );

    if (!pending) return;

    clearTimeout(
      pending.timeoutId
    );

    pendingEnquiries.delete(
      message.requestId
    );

    const result =
      message.result || {};

    pending.callback(
      result.success === true,
      result.message || '',
      result
    );
  }
});

function sendEnquiryMessageToBridge(
  frame,
  requestMessage
) {
  if (
    enquiryBridgeReady &&
    frame?.contentWindow
  ) {
    frame.contentWindow.postMessage(
      requestMessage,
      '*'
    );
  } else {
    enquiryBridgeQueue.push(
      requestMessage
    );
  }
}

function sendToGoogleAppsScript(
  url,
  data,
  site,
  callback
) {
  if (
    !url ||
    !url.startsWith('http')
  ) {
    callback(
      false,
      'No Google Apps Script web-app URL has been configured.'
    );
    return;
  }

  const c = site.contact || {};
  const frame =
    createEnquiryBridge(url);

  const requestId =
    `AI-WEB-${Date.now()}-${++enquiryRequestCounter}`;

  const payload = {
    ...data,
    source: 'AssurIntellec website',
    submitted_at:
      new Date().toISOString(),
    confirmation_email_enabled:
      c.customer_confirmation_email_enabled !== false,
    confirmation_email_subject:
      c.customer_confirmation_email_subject ||
      'Thank You for Contacting AssurIntellec™ | Enquiry Received',
    confirmation_email_message:
      c.customer_confirmation_email_message || '',
    confirmation_email_from_email:
      c.customer_confirmation_email_from_email ||
      'info@assurintellec.in'
  };

  const requestMessage = {
    type: 'assurintellec:submit',
    requestId,
    payload
  };

  const timeoutId =
    window.setTimeout(() => {
      const pending =
        pendingEnquiries.get(
          requestId
        );

      if (!pending) return;

      pendingEnquiries.delete(
        requestId
      );

      pending.callback(
        false,
        'The enquiry service did not respond within the expected time. Please try again or use WhatsApp.'
      );
    }, ENQUIRY_RESPONSE_TIMEOUT_MS);

  pendingEnquiries.set(
    requestId,
    {
      callback,
      timeoutId
    }
  );

  sendEnquiryMessageToBridge(
    frame,
    requestMessage
  );
}

function showEnquirySuccess(site) {
  const c = site.contact || {};

  const overlay = document.getElementById('enquirySuccessOverlay');
  const card = overlay?.querySelector('.enquiry-success-card');
  const close = document.getElementById('enquirySuccessClose');

  if (!overlay || !card) return;

  setText(
    'enquirySuccessTitle',
    c.enquiry_success_title ||
      'Thank You for Connecting with AssurIntellec™'
  );

  setText(
    'enquirySuccessReceived',
    c.enquiry_success_received ||
      c.enquiry_success_message ||
      'Your enquiry has been successfully received.'
  );

  setText(
    'enquirySuccessBody',
    c.enquiry_success_body ||
      'Our team will carefully review your requirements and get in touch with you to discuss the most suitable solution.'
  );

  setText(
    'enquirySuccessClosing',
    c.enquiry_success_closing ||
      'We look forward to working with you.'
  );

  setText(
    'enquirySuccessTagline',
    c.enquiry_success_tagline ||
      site.tagline ||
      'Intelligent Solutions. Assured Compliance.'
  );

  if (close) {
    const label =
      c.enquiry_success_close_label ||
      'Close confirmation message';

    close.setAttribute('aria-label', label);
    close.title = label;
  }

  overlay.classList.add('show');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('success-open');

  window.setTimeout(() => {
    try {
      close?.focus();
    } catch (_) {}
  }, 50);
}

function hideEnquirySuccess() {
  const overlay = document.getElementById('enquirySuccessOverlay');
  if (!overlay) return;

  overlay.classList.remove('show');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('success-open');
}

function bindEnquirySuccessOverlay(site) {
  const overlay = document.getElementById('enquirySuccessOverlay');
  const close = document.getElementById('enquirySuccessClose');
  const card = overlay?.querySelector('.enquiry-success-card');

  if (!overlay || !close || !card || overlay.dataset.bound) return;

  overlay.dataset.bound = '1';

  close.addEventListener('click', hideEnquirySuccess);

  overlay.addEventListener('click', event => {
    if (event.target === overlay) hideEnquirySuccess();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && overlay.classList.contains('show')) {
      hideEnquirySuccess();
    }
  });
}

function handleEnquirySubmit(event, site) {
  event.preventDefault();

  const form = event.currentTarget;
  const c = site.contact || {};

  if (!validateForm(form)) {
    showToast(
      c.form_validation_message ||
      'Please complete the required fields.',
      false
    );
    return;
  }

  const data = Object.fromEntries(
    new FormData(form).entries()
  );

  const sendButton =
    form.querySelector('button[type="submit"]');

  const originalButtonText =
    sendButton?.textContent ||
    c.form_button ||
    'Send Enquiry';

  if (sendButton) {
    sendButton.disabled = true;
    sendButton.textContent =
      c.form_sending_text ||
      'Sending…';
  }

  const finish = (ok, errorMessage) => {
    if (sendButton) {
      sendButton.disabled = false;
      sendButton.textContent = originalButtonText;
    }

    if (ok) {
      // Keep all visitor-entered values so they can close the confirmation
      // and use "Send on WhatsApp" without retyping the enquiry.
      showEnquirySuccess(site);
    } else {
      showToast(
        errorMessage ||
        c.enquiry_error_message ||
        'Your enquiry could not be sent automatically. Please use the email or WhatsApp contact options below.',
        false
      );
    }
  };

  if (c.google_apps_script_url) {
    sendToGoogleAppsScript(
      c.google_apps_script_url,
      data,
      site,
      finish
    );
    return;
  }

  const recipient =
    c.enquiry_recipient_email ||
    c.email ||
    'info@assurintellec.in';

  const subject = encodeURIComponent(
    c.enquiry_subject ||
    `${site.company_name || 'AssurIntellec™'} website enquiry`
  );

  const body = encodeURIComponent(
    Object.entries(data)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n')
  );

  window.location.href =
    `mailto:${recipient}?subject=${subject}&body=${body}`;

  setTimeout(() => {
    finish(true);
  }, 500);
}

function handleWhatsAppEnquiry(site) {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const c = site.contact || {};

  if (!validateForm(form)) {
    showToast(
      c.form_validation_message ||
      'Please complete the required fields.',
      false
    );
    return;
  }

  const data = Object.fromEntries(
    new FormData(form).entries()
  );

  const template =
    c.whatsapp_prefill_template ||
    `New AssurIntellec™ website enquiry\nName: {name}\nCompany: {company}\nEmail: {email}\nPhone: {phone}\nRequirement: {service}\nMessage: {message}`;

  const message = templateMessage(
    template,
    data
  );

  const phoneNumber = String(
    c.whatsapp_phone ||
    '917600666436'
  ).replace(/\D/g, '');

  if (!phoneNumber) {
    showToast(
      'WhatsApp phone number is not configured.',
      false
    );
    return;
  }

  const url =
    `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  window.open(
    url,
    '_blank',
    'noopener'
  );
}

function renderServicesPage(site) {
  const page = site.pages?.services || {};
  setText('servicesPageEyebrow', page.eyebrow);
  setText('servicesPageTitle', page.title || site.navigation?.services || 'Services');
  setText('servicesPageDescription', page.description || site.home?.services_preview?.description || '');
  renderServiceCards(SERVICES);
}

function renderServiceDetail(site) {
  const slug = document.body.dataset.serviceSlug || '';
  const service = SERVICES.find(item => item.slug === slug);
  if (!service) return;
  setText('servicePageEyebrow', service.page_eyebrow || 'Service');
  setText('servicePageTitle', service.page_title || service.title);
  setText('servicePageDescription', service.page_description || service.description);
  setText('serviceIntroTitle', service.intro_title || '');
  setText('serviceIntro', service.intro || '');
  const icon = document.getElementById('serviceDetailIcon');
  if (icon) icon.innerHTML = iconHtml(service.icon);

  const image1 = document.getElementById('serviceImage1');
  const image2 = document.getElementById('serviceImage2');
  setImg(image1, service.image_1 || site.media_assets?.pharmaceutical || '/images/uploads/pharmaceutical.jpg', service.image_1_alt || service.title);
  setImg(image2, service.image_2 || site.media_assets?.about_research || '/images/uploads/about-research.jpg', service.image_2_alt || service.title);
  setText('serviceCaption1', service.gallery_caption_1 || 'Supporting visual');
  setText('serviceCaption2', service.gallery_caption_2 || 'Additional visual');
  setText('serviceImageText1', service.image_1_text || service.image_1_alt || 'Technical environment');
  setText('serviceImageText2', service.image_2_text || service.image_2_alt || 'Supporting environment');

  const videoHolder = document.getElementById('serviceVideoHolder');
  if (videoHolder) {
    if (service.service_video) {
      videoHolder.innerHTML = `<video controls playsinline preload="metadata" src="${escapeHtml(normalizeAsset(service.service_video))}"></video>`;
      videoHolder.style.display = 'block';
    } else {
      videoHolder.innerHTML = '';
      videoHolder.style.display = 'none';
    }
  }

  const sectionHolder = document.getElementById('serviceDetailSections');
  if (sectionHolder) sectionHolder.innerHTML = (service.sections || []).map(section => `<article class="detail-card">
    <h3>${escapeHtml(section.heading || '')}</h3>
    ${(section.paragraphs || []).map(p => `<p>${escapeHtml(p)}</p>`).join('')}
    ${(section.bullets || []).length ? `<ul class="detail-list">${section.bullets.map(b => `<li>${escapeHtml(b)}</li>`).join('')}</ul>` : ''}
  </article>`).join('');

  setText('serviceContactLabel', site.contact?.service_contact_label || 'Contact');
  setText('serviceContactEmail', site.contact?.service_contact_email || '');
  setHref('serviceContactEmail', site.contact?.service_contact_email ? `mailto:${site.contact.service_contact_email}` : '');

  setText('serviceCta', service.cta || 'Contact Us');
  setHref('serviceCta', service.cta_url || './contact.html');
  const back = document.querySelector('.detail-cta-row .text-link');
  if (back) {
    back.textContent = site.home?.services_preview?.back_to_services_label || site.ui?.service_back_label || 'Back to Services';
    back.href = site.home?.services_preview?.back_to_services_url || './services.html';
  }
}

function applyVisibility(site) {
  const v = site.section_visibility || {};
  const map = {
    trust_strip: 'trust-strip',
    about_reel_home: 'about-reel-section',
    services_preview_home: 'home-services-preview',
    why_preview_home: 'home-why-preview',
    home_cta: 'home-cta'
  };
  Object.entries(map).forEach(([key, className]) => {
    const el = document.querySelector(`.${className}`);
    if (el) el.style.display = v[key] === false ? 'none' : '';
  });
}

async function init() {
  SITE = await readJson('./content/site.json', FALLBACK_SITE);
  SERVICES = normalizeServices(await readJson('./content/services.json', { services: FALLBACK_SERVICES }));
  applyTheme(SITE);
  updateMeta(SITE);
  renderHeader(SITE);
  renderFooter(SITE, SERVICES);
  renderWhatsApp(SITE);

  const page = document.body.dataset.page;
  if (page === 'home') renderHome(SITE, SERVICES);
  if (page === 'about') renderAbout(SITE);
  if (page === 'services') renderServicesPage(SITE);
  if (page === 'why') renderWhy(SITE);
  if (page === 'contact') renderContact(SITE, SERVICES);
  if (page === 'service') renderServiceDetail(SITE);
}

document.addEventListener('DOMContentLoaded', init);

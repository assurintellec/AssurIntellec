let SITE = null;
let SERVICES = [];
let instagramIndex = 0;
let heroAudioEnabled = true;

const FALLBACK_SITE = {
  company_name: 'AssurIntellec™',
  tagline: 'Intelligent Solutions. Assured Compliance.',
  social: { items: [] },
  contact: { whatsapp: 'https://wa.me/message/BFANWJ2N3FWOP1', email: 'info@assurintellec.in', phone: '+91 7600 666 436', mobile_phone: '7405660185', website: 'https://www.assurintellec.in', website_display: 'www.assurintellec.in' },
  hero: { video: '/videos/hero-60sec.mp4', poster: '/images/uploads/hero.jpg', overlay_enabled: false, overlay_color: '#07182d', overlay_opacity: 0.38, overlay_spread: 45, company_text_color: '#ffffff', kicker_text_color: '#e6cf74', heading_text_color: '#ffffff', description_text_color: '#ffffff' },
  home: {}, about: {}, why_us: {}, footer: {}, theme: {}, visitor_counter: { enabled: true, label: 'Website Visitors', namespace: 'assurintellec.in', action: 'view', key: 'website-visitors' }
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

function safeMediaHref(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^(https?:\/\/|mailto:|tel:|\/|\.\/|#)/i.test(raw)) return raw;
  return '';
}

function mediaLinkWrap(site, item, mediaHtml, label = '') {
  const globalEnabled = site?.media_options?.clickable_images_enabled !== false;
  const enabled = item?.link_enabled === true;
  const href = safeMediaHref(item?.link_url);
  if (!globalEnabled || !enabled || !href) return mediaHtml;
  return `<a class="clickable-media" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(label || 'Open linked media')}" data-media-link="true">${mediaHtml}</a>`;
}

function formatAddress(contact) {
  const display = String(contact?.address_display || '').trim();
  if (display) return display;
  return [contact?.address_line_1, contact?.address_line_2, contact?.address_city, contact?.address_region, contact?.address_postal_code, contact?.address_country]
    .map(value => String(value || '').trim()).filter(Boolean).join(', ');
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
    hero_min_height: ['--hero-height','px'], instagram_width: ['--instagram-width','px'], instagram_height: ['--instagram-height','px'], instagram_crop_top: ['--instagram-crop-top','px'], instagram_crop_bottom: ['--instagram-crop-bottom','px'],
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
  const assets = site.media_assets || {};
  const logo = normalizeAsset(assets.footer_logo_image || assets.logo || '/images/uploads/logo_transparent_png_tm.png');
  const logoVideo = normalizeAsset(assets.footer_logo_video || '');
  const useLogoVideo = assets.footer_logo_mode === 'video' && logoVideo;

  const serviceLinks = services.slice(0, 7).map(s => `
    <li><a href="./${escapeHtml(s.page_file || `service-${s.slug}.html`)}">${escapeHtml(s.title || '')}</a></li>
  `).join('');
  const footerSocial = visibility.footer_social === false ? '' : `<section class="footer-social-section" aria-label="${escapeHtml(f.social_title || 'Connect')}"><h4>${escapeHtml(f.social_title || 'Connect')}</h4><div class="footer-social">${socialHtml(site, 'footer')}</div></section>`;
  const holder = document.getElementById('site-footer');
  if (!holder) return;

  let logoVisual = useLogoVideo
    ? `<video class="footer-logo-video" src="${escapeHtml(logoVideo)}" autoplay muted loop playsinline preload="metadata" aria-label="${escapeHtml(assets.footer_logo_alt || 'AssurIntellec animated logo')}"></video>`
    : `<img class="footer-logo footer-logo-animated" src="${escapeHtml(logo)}" alt="${escapeHtml(assets.footer_logo_alt || site.company_name || 'AssurIntellec™')}" loading="lazy">`;
  logoVisual = mediaLinkWrap(site, {link_enabled:assets.footer_logo_link_enabled,link_url:assets.footer_logo_link_url}, logoVisual, 'Open AssurIntellec logo link');

  holder.innerHTML = `
    <footer>
      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand">
            <div class="footer-logo-stage">${logoVisual}</div>
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
            <h4>${escapeHtml(f.contact_title || 'Contact')}</h4>
            <div class="footer-contact">
              <span><strong>${escapeHtml(site.contact?.phone_label || 'Office No.')}</strong><a href="tel:${escapeHtml(telephoneHref(site.contact?.phone))}">${escapeHtml(site.contact?.phone || '')}</a></span>
              <span><strong>${escapeHtml(site.contact?.mobile_phone_label || 'Mobile No.')}</strong><a href="tel:${escapeHtml(telephoneHref(site.contact?.mobile_phone))}">${escapeHtml(site.contact?.mobile_phone || '')}</a></span>
              <span><strong>${escapeHtml(site.contact?.email_label || 'Email')}</strong><a href="mailto:${escapeHtml(site.contact?.email || '')}">${escapeHtml(site.contact?.email || '')}</a></span>
              <span><strong>Website</strong><a href="${escapeHtml(safeMediaHref(site.contact?.website) || '#')}" target="_blank" rel="noopener">${escapeHtml(site.contact?.website_display || site.contact?.website || '')}</a></span>
            </div>
          </div>
        </div>
        ${footerSocial}
        <div class="footer-bottom">
          <p>© ${new Date().getFullYear()} ${escapeHtml(site.company_name || 'AssurIntellec™')}. ${escapeHtml(f.copyright || '')}</p>
          <div class="footer-bottom-right">
            <p class="visitor-stat" id="visitorStat" aria-live="polite"${site.visitor_counter?.enabled === false ? ' style="display:none"' : ''}>${escapeHtml(site.visitor_counter?.label || 'Website Visitors')}: <strong id="visitorCount">—</strong></p>
            <p>${escapeHtml(site.tagline || '')}</p>
          </div>
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

  // Let the CMS-uploaded favicon drive the browser icon on every site page.
  const favicon = String(site.media_assets?.favicon || '').trim();
  if (favicon) {
    document.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]').forEach(link => {
      link.href = favicon;
    });
  }

  const canonical = document.querySelector('link[rel="canonical"]');
  const canonicalBase = String(site.seo?.canonical_base || '').trim().replace(/\/$/, '');

  if (canonical && canonicalBase) {
    const pageName = window.location.pathname.split('/').filter(Boolean).pop() || '';
    canonical.href = pageName && pageName.toLowerCase() !== 'index.html'
      ? `${canonicalBase}/${pageName}`
      : `${canonicalBase}/`;
  }

  const schema = document.getElementById('organizationSchema');
  if (schema) {
    try {
      const logo = String(site.seo?.logo_url || site.media_assets?.schema_logo || `${canonicalBase || window.location.origin}/images/uploads/Google_Search_Logo.png`).replace(/^\.\//, '');
      const absoluteLogo = /^https?:\/\//i.test(logo) ? logo : `${canonicalBase || window.location.origin}/${logo.replace(/^\//, '')}`;
      const organization = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: site.company_name || 'AssurIntellec™',
        alternateName: 'AssurIntellec',
        url: canonicalBase ? `${canonicalBase}/` : window.location.origin + '/',
        logo: absoluteLogo,
        image: absoluteLogo,
        address: {
          '@type': 'PostalAddress',
          streetAddress: [site.contact?.address_line_1, site.contact?.address_line_2].filter(Boolean).join(', '),
          addressLocality: site.contact?.address_city || 'Kholvad',
          addressRegion: site.contact?.address_region || 'Gujarat',
          postalCode: site.contact?.address_postal_code || '394190',
          addressCountry: site.contact?.address_country || 'IN'
        },
        email: site.contact?.email || '',
        telephone: site.contact?.phone || ''
      };
      const sameAs = socialItems(site).map(item => item.url);
      if (sameAs.length) organization.sameAs = sameAs;
      schema.textContent = JSON.stringify(organization);
    } catch (_) {}
  }
}

function normalizeServices(data) {
  const list = Array.isArray(data?.services) ? data.services : (Array.isArray(data) ? data : []);
  return list.filter(service => service && service.enabled !== false && (service.slug || service.title || service.page_file));
}

function serviceImageSource(item, property) {
  // An original-file selection overrides the standard Decap image picker.
  // The browser receives the uploaded file itself: no generated thumbnails, forced crop or recompression.
  return item?.[`${property}_original`] || item?.[property] || '';
}

function serviceVideoMime(url) {
  const extension = String(url || '').split(/[?#]/)[0].split('.').pop().toLowerCase();
  // The CMS file widget accepts additional formats; the browser decides which can play.
  return ({mp4:'video/mp4',m4v:'video/mp4',webm:'video/webm',ogv:'video/ogg',ogg:'video/ogg',mov:'video/quicktime',avi:'video/x-msvideo',mkv:'video/x-matroska'})[extension] || '';
}

function renderServiceCards(services) {
  const grid = document.getElementById('servicesGrid');
  if (!grid) return;
  const aria = SITE?.ui?.service_read_aria || 'Open service details';
  const shownImages = new Set();
  grid.innerHTML = services.filter(service => service && service.enabled !== false && String(service.title || '').trim()).map((service, index) => {
    const file = service.page_file || `service-${service.slug}.html`;
    // Give each of the seven service tiles its own image, even if a CMS editor mistakenly reused a file.
    const options = [serviceImageSource(service,'listing_image'),serviceImageSource(service,'primary_image'),serviceImageSource(service,'hero_image')];
    const chosen = options.find(candidate => candidate && !shownImages.has(normalizeAsset(candidate))) || '';
    if (chosen) shownImages.add(normalizeAsset(chosen));
    const visual = chosen
      ? `<img src="${escapeHtml(normalizeAsset(chosen))}" alt="${escapeHtml(service.media_alt || service.title || 'Service image')}" loading="lazy" decoding="async">`
      : `<span class="service-tile-image-fallback" aria-hidden="true"><i class="fas ${escapeHtml(service.icon || 'fa-circle-nodes')}"></i></span>`;
    return `<a class="service-card service-card-with-image" href="./${escapeHtml(file)}" aria-label="${escapeHtml(`${aria}: ${service.title || ''}`)}">
      <div class="service-tile-image">${visual}</div>
      <span class="service-tile-body"><span class="service-title-content">
        <span class="service-number">${String(index + 1).padStart(2,'0')}.</span>
        <span class="service-icon">${iconHtml(service.icon)}</span>
        <h3>${escapeHtml(service.title)}</h3>
      </span>
      ${service.description ? `<span class="service-tile-description">${escapeHtml(service.description)}</span>` : ''}
      <span class="service-read" aria-hidden="true"><i class="fas fa-arrow-right"></i></span></span>
    </a>`;
  }).join('');
}

function whyMediaHtml(site, card, label) {
  const mode = card.media_type === 'video' && card.video ? 'video' : 'image';
  let html = '';
  if (mode === 'video') {
    html = `<video class="why-card-video" controls playsinline preload="metadata" src="${escapeHtml(normalizeAsset(card.video))}" aria-label="${escapeHtml(card.image_alt || label || 'Why Us video')}"></video>`;
    // Do not wrap the video player in an anchor: that interferes with native controls.
    return html;
  } else if (card.image) {
    html = `<img class="why-card-image" src="${escapeHtml(normalizeAsset(card.image))}" alt="${escapeHtml(card.image_alt || label || '')}" loading="lazy" decoding="async">`;
  }
  if (!html) html = `<div class="why-card-media-fallback"><i class="fas ${escapeHtml(card.icon || 'fa-circle-nodes')}"></i></div>`;
  return mediaLinkWrap(site,card,html,label);
}

function showWhyDetails(grid, card, site) {
  if (!grid || !card) return;
  let panel = grid.parentElement?.querySelector(':scope > .why-detail-panel');
  if (!panel) {
    panel = document.createElement('section');
    panel.className = 'why-detail-panel';
    panel.setAttribute('aria-live','polite');
    grid.insertAdjacentElement('afterend',panel);
  }
  const title = card.detail_title || card.title || 'Why AssurIntellec';
  const subtitle = card.detail_subtitle || '';
  const media = whyMediaHtml(site,card,title);
  const details = (Array.isArray(card.details)?card.details:[]).filter(item => item && (item.heading || item.text || (item.bullets||[]).length));
  const detailsHtml = details.map(detail => `<article class="why-detail-section">${detail.heading ? `<h4>${escapeHtml(detail.heading)}</h4>`:''}${detail.text ? `<p>${escapeHtml(detail.text)}</p>`:''}${(detail.bullets||[]).length ? `<ul>${detail.bullets.filter(Boolean).map(point=>`<li>${escapeHtml(typeof point==='string'?point:(point.point||''))}</li>`).join('')}</ul>`:''}</article>`).join('');
  const intro = card.detail_intro || '';
  panel.innerHTML = `<button type="button" class="why-detail-close" aria-label="${escapeHtml(site.why_us?.detail_close_label || 'Close details')}"><i class="fas fa-xmark" aria-hidden="true"></i> ${escapeHtml(site.why_us?.detail_close_label || 'Close details')}</button>
    <div class="why-detail-layout"><div class="why-detail-visual">${media}</div><div class="why-detail-copy"><span class="eyebrow">Why AssurIntellec</span><h3>${escapeHtml(title)}</h3>${subtitle ? `<h4 class="why-detail-subtitle">${escapeHtml(subtitle)}</h4>`:''}${intro ? `<p class="why-detail-intro">${escapeHtml(intro)}</p>`:''}${detailsHtml}</div></div>`;
  panel.classList.add('is-open');
  panel.querySelector('.why-detail-close')?.addEventListener('click',()=>{panel.classList.remove('is-open');panel.innerHTML='';});
  panel.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'nearest'});
}

function slugifyWhyTitle(value, index = 0) {
  const slug = String(value || '')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || `why-point-${index + 1}`;
}

function whyCardSlug(card, index = 0) {
  const configured = String(card?.slug || '').trim();
  return configured ? slugifyWhyTitle(configured, index) : slugifyWhyTitle(card?.detail_title || card?.title, index);
}

function renderWhyCardGrid(site, gridId, cards) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  const items = (Array.isArray(cards)?cards:[]).filter(card=>card && card.enabled !== false && (card.title || card.text || card.home_text || card.image || card.video)).slice(0,4);
  grid.innerHTML = items.map((card,index) => {
    const slug = whyCardSlug(card,index);
    const url = `./why-us-detail.html?point=${encodeURIComponent(slug)}`;
    // In the card grid, selecting a point must always open its dedicated detail page.
    // Keep optional media destination settings available on the detail page itself.
    const cardPreview = { ...card, link_enabled: false, link_url: '' };
    return `<article class="why-card why-card-interactive" role="link" tabindex="0" aria-label="Open full details for ${escapeHtml(card.title || `Why ${index+1}`)}" data-detail-url="${escapeHtml(url)}">
      <div class="why-card-media">${whyMediaHtml(site,cardPreview,card.title || `Why ${index+1}`)}</div>
      <div class="why-card-body"><i class="fas ${escapeHtml(card.icon || 'fa-circle-nodes')}" aria-hidden="true"></i><h3>${escapeHtml(card.title || '')}</h3><p>${escapeHtml(card.home_text || card.text || '')}</p><span class="why-card-open">Explore details <i class="fas fa-arrow-right" aria-hidden="true"></i></span></div>
    </article>`;
  }).join('');
  grid.querySelectorAll('.why-card-interactive').forEach(el=>{
    const activate = event => {
      if (event?.target?.closest?.('a,video,button')) return;
      event?.preventDefault?.();
      const destination = el.getAttribute('data-detail-url');
      if (destination) window.location.href = destination;
    };
    el.addEventListener('click',activate);
    el.addEventListener('keydown',event=>{
      if (event.target !== el && event.target?.closest?.('a,video,button')) return;
      if (event.key === 'Enter' || event.key === ' ') activate(event);
    });
  });
}

function renderWhyPreview(site) {
  renderWhyCardGrid(site,'whyPreviewGrid',site.why_us?.cards || []);
}

function setupHorizontalCarousel(grid, prevButton, nextButton, itemSelector, visibleDesktop = 5) {
  if (!grid || !prevButton || !nextButton) return;
  const items = Array.from(grid.querySelectorAll(itemSelector));
  if (!items.length) {
    prevButton.style.visibility = 'hidden';
    nextButton.style.visibility = 'hidden';
    return;
  }

  let offset = 0;
  const getVisible = () => {
    if (window.matchMedia('(max-width: 700px)').matches) return 1;
    if (window.matchMedia('(max-width: 980px)').matches) return 3;
    return visibleDesktop;
  };
  const update = () => {
    const visible = getVisible();
    const maxOffset = Math.max(0, items.length - visible);
    offset = Math.min(Math.max(offset, 0), maxOffset);
    const first = items[0];
    const itemWidth = first ? first.getBoundingClientRect().width : 0;
    const gap = parseFloat(getComputedStyle(grid).gap || '0');
    grid.style.transform = `translateX(-${offset * (itemWidth + gap)}px)`;
    prevButton.disabled = offset === 0;
    nextButton.disabled = offset >= maxOffset;
    prevButton.style.visibility = 'visible';
    nextButton.style.visibility = 'visible';
  };

  if (!grid.dataset.carouselBound) {
    grid.dataset.carouselBound = '1';
    prevButton.addEventListener('click', () => { offset -= 1; update(); });
    nextButton.addEventListener('click', () => { offset += 1; update(); });
    window.addEventListener('resize', update, { passive: true });
  }
  update();
}

function renderLogoShowcase(site, configKey, ids, cardClass = '', options = {}) {
  const config = site.home?.[configKey] || {};
  setText(ids.eyebrow, config.eyebrow || '');
  setText(ids.title, config.title || '');
  setText(ids.description, config.description || '');
  const grid = document.getElementById(ids.grid);
  if (!grid) return;
  const maxItems = Number.isFinite(options.maxItems) ? options.maxItems : 5;
  const items = Array.isArray(config.items) ? config.items.slice(0, maxItems) : [];
  grid.innerHTML = items.filter(item => item && item.image && item.enabled !== false).map((item, index) => {
    const src = normalizeAsset(item.image);
    const alt = item.alt || item.title || `Logo ${index + 1}`;
    const image = `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async" onerror="this.closest('article')?.classList.add('logo-image-error')">`;
    const media = mediaLinkWrap(site,item,image,item.title || alt);
    return `<article class="logo-showcase-card ${escapeHtml(cardClass)}" data-media-label="${escapeHtml(item.title || alt)}">${media}</article>`;
  }).join('');
  if (options.carousel) setupHorizontalCarousel(grid,document.getElementById(options.prevId),document.getElementById(options.nextId),`.${cardClass}`,options.visibleDesktop || 5);
}

function renderLogoShowcases(site) {
  renderLogoShowcase(site, 'approval_logos', {
    eyebrow: 'approvalLogosEyebrow', title: 'approvalLogosTitle', description: 'approvalLogosDescription', grid: 'approvalLogosGrid'
  }, 'approval-logo-card', { maxItems: 6, carousel: false });

  renderLogoShowcase(site, 'client_logos', {
    eyebrow: 'clientLogosEyebrow', title: 'clientLogosTitle', description: 'clientLogosDescription', grid: 'clientLogosGrid'
  }, 'client-logo-card', { maxItems: 5 });
}

function renderTestimonials(site) {
  const cfg = site.home?.testimonials || {};
  setText('testimonialsEyebrow', cfg.eyebrow || 'TESTIMONIALS');
  setText('testimonialsTitle', cfg.title || 'What Our Customers Say?');
  setText('testimonialsDescription', cfg.description || '');
  setHref('testimonialsGoogleLink', safeMediaHref(cfg.google_link) || '#');
  setText('testimonialsGoogleLinkLabel', cfg.google_link_label || 'Read all reviews on Google');
  const grid = document.getElementById('testimonialsGrid');
  if (!grid) return;
  const items = (Array.isArray(cfg.items) ? cfg.items : []).filter(item => item && item.enabled !== false && (item.name || item.company || item.text || item.avatar)).slice(0,3);
  grid.innerHTML = items.map((item) => {
    const rating = Math.max(1, Math.min(5, Math.round(Number(item?.rating) || 5)));
    const name = String(item?.name || '').trim();
    const company = String(item?.company || '').trim();
    const text = String(item?.text || '').trim();
    const avatarSrc = item?.avatar ? normalizeAsset(item.avatar) : '';
    const initial = escapeHtml(name.charAt(0).toUpperCase() || '?');
    const avatar = avatarSrc
      ? `<img src="${escapeHtml(avatarSrc)}" alt="${escapeHtml(name || 'Customer')}" loading="lazy" decoding="async" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"><span class="testimonial-avatar-fallback" style="display:none">${initial}</span>`
      : `<span class="testimonial-avatar-fallback">${initial}</span>`;
    const avatarLinked = mediaLinkWrap(site,item,avatar,`Open link for ${name || 'customer photo'}`);
    return `<article class="testimonial-card">
      <div class="testimonial-stars" aria-label="${rating} star rating">${'★'.repeat(rating)}${'☆'.repeat(5-rating)}</div>
      ${text ? `<p class="testimonial-text">“${escapeHtml(text)}”</p>` : ''}
      <div class="testimonial-footer"><div class="testimonial-person">${avatarLinked}<div>${name ? `<strong>${escapeHtml(name)}</strong>` : ''}${company ? `<span>${escapeHtml(company)}</span>` : ''}</div></div><span class="testimonial-quote-mark" aria-hidden="true">“</span></div>
    </article>`;
  }).join('');
}

async function requestVisitorCounter(url) {
  let lastError = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    let timeoutId = null;
    let controller = null;
    try {
      if ('AbortController' in window) {
        controller = new AbortController();
        timeoutId = window.setTimeout(() => controller.abort(), 8000);
      }
      const response = await fetch(url, {
        cache: 'no-store',
        mode: 'cors',
        ...(controller ? { signal: controller.signal } : {})
      });
      if (!response.ok) throw new Error(`CounterAPI ${response.status}`);
      const data = await response.json();
      const value = Number(data?.value);
      if (!Number.isFinite(value) || value < 0) throw new Error('Invalid visitor count');
      return value;
    } catch (error) {
      lastError = error;
    } finally {
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    }
    if (attempt === 0) await new Promise(resolve => window.setTimeout(resolve, 400));
  }
  throw lastError || new Error('Visitor counter request failed');
}

async function initVisitorCounter(site) {
  const stat = document.getElementById('visitorStat');
  const countEl = document.getElementById('visitorCount');
  if (!stat || !countEl) return;

  const cfg = site.visitor_counter || {};
  if (cfg.enabled === false) {
    stat.style.display = 'none';
    return;
  }

  // The counter is visible whenever enabled. Temporary network/API failure should
  // not silently remove the whole footer line; only the CMS toggle hides it.
  stat.style.display = '';
  stat.removeAttribute('hidden');
  countEl.textContent = 'Loading…';

  const namespace = encodeURIComponent(String(cfg.namespace || 'assurintellec.in').trim());
  const action = encodeURIComponent(String(cfg.action || 'view').trim());
  const key = encodeURIComponent(String(cfg.key || 'website-visitors').trim());
  const startValue = Math.max(0, Number(cfg.start_value) || 0);
  const baseUrl = `https://counterapi.com/api/${namespace}/${action}/${key}`;
  // Version the session key so a previously failed request from the older code
  // cannot incorrectly mark this session as counted before a successful response.
  const sessionKey = `assurintellec-counter-v2:${namespace}:${action}:${key}`;
  let alreadyCountedThisSession = false;
  try {
    alreadyCountedThisSession = window.sessionStorage.getItem(sessionKey) === '1';
  } catch (_) {
    // Storage may be restricted in privacy modes. CounterAPI's unique modifier
    // remains in place, and storage access must never prevent the request.
  }

  let url = `${baseUrl}?unique=true`;
  if (alreadyCountedThisSession) url += '&readOnly=true';

  try {
    const value = await requestVisitorCounter(url);
    countEl.textContent = (startValue + value).toLocaleString();
    if (!alreadyCountedThisSession) {
      try { window.sessionStorage.setItem(sessionKey, '1'); } catch (_) {}
    }
    stat.removeAttribute('data-counter-error');
  } catch (error) {
    console.warn('Visitor counter unavailable after retry:', error);
    countEl.textContent = 'Temporarily unavailable';
    stat.setAttribute('data-counter-error', 'true');
  }
}

function startServiceHeadingAnimation(site, services) {
  const heading = document.getElementById('heroHeading');
  const description = document.getElementById('heroDescription');
  const hero = site.hero || {};
  const text = String(hero.description || '').trim();
  if (description) description.style.display = text ? '' : 'none';
  if (!heading || hero.service_cycle_enabled === false) return;

  const configured = Array.isArray(hero.service_cycle_titles) ? hero.service_cycle_titles : [];
  const titles = configured.map(item => typeof item === 'string' ? item : item?.title).map(x => String(x || '').trim()).filter(Boolean);
  const fallbackTitles = services.map(x => String(x?.title || '').trim()).filter(Boolean);
  const cycle = titles.length ? titles : fallbackTitles;
  if (!cycle.length) return;

  heading.innerHTML = '<span class="hero-typed-text" aria-live="polite"></span><span class="typing-cursor" aria-hidden="true">|</span>';
  const typed = heading.querySelector('.hero-typed-text');
  if (!typed) return;
  let wordIndex = 0, charIndex = 0, deleting = false;
  const sizeRule = (Array.isArray(site.text_style_overrides) ? site.text_style_overrides : []).find(rule => {
    if (!rule || rule.enabled === false || !rule.selector || !Number(rule.font_size)) return false;
    try { return heading.matches(String(rule.selector)); } catch (_) { return false; }
  });
  const initialHeadingStyle = getComputedStyle(heading);
  const originalFontSize = Number(sizeRule?.font_size) || parseFloat(initialHeadingStyle.fontSize) || 66;
  const computedLineHeight = parseFloat(initialHeadingStyle.lineHeight);
  const stableHeadingHeight = Math.ceil(Number.isFinite(computedLineHeight) && computedLineHeight > 0
    ? computedLineHeight
    : originalFontSize * 1.1);
  heading.style.height = `${stableHeadingHeight}px`;
  heading.style.minHeight = `${stableHeadingHeight}px`;
  heading.dataset.baseFontSize = String(originalFontSize);
  const fitHeadingToSingleLine = word => {
    const cs = getComputedStyle(heading);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const family = cs.fontFamily || 'Arial, sans-serif';
    const weight = cs.fontWeight || '700';
    const available = Math.max(170, heading.clientWidth || heading.parentElement?.clientWidth || 700);
    const letterSpacing = Number.parseFloat(cs.letterSpacing) || 0;
    const measuredWidth = size => {
      ctx.font = `${weight} ${size}px ${family}`;
      return ctx.measureText(word).width + Math.max(0, word.length - 1) * letterSpacing;
    };
    const base = Number(heading.dataset.baseFontSize) || originalFontSize;
    const width = measuredWidth(base);
    const fitted = width > available ? Math.max(17, base * available / width) : base;
    heading.style.fontSize = `${fitted.toFixed(2)}px`;
  };
  const onHeroResize = () => fitHeadingToSingleLine(cycle[wordIndex % cycle.length] || '');
  window.__fitAssurHeroHeading = onHeroResize;
  fitHeadingToSingleLine(cycle[0]);
  if (!heading.dataset.fitResizeBound) {
    heading.dataset.fitResizeBound = '1';
    window.addEventListener('resize', onHeroResize, { passive: true });
  }
  const typeNext = () => {
    if (!typed.isConnected) return;
    const word = cycle[wordIndex % cycle.length];
    typed.textContent = word.slice(0, charIndex);
    if (!deleting && charIndex < word.length) {
      charIndex++;
      window.setTimeout(typeNext, 76);
    } else if (!deleting) {
      deleting = true;
      window.setTimeout(typeNext, 1250);
    } else if (charIndex > 0) {
      charIndex--;
      window.setTimeout(typeNext, 32);
    } else {
      deleting = false;
      wordIndex = (wordIndex + 1) % cycle.length;
      fitHeadingToSingleLine(cycle[wordIndex] || '');
      window.setTimeout(typeNext, 200);
    }
  };
  typeNext();
}

function normalizeHeroHexColor(value, fallback = '#ffffff') {
  const raw = String(value || '').trim();
  const match = raw.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!match) return fallback;
  const digits = match[1].length === 3 ? match[1].split('').map(char => char + char).join('') : match[1];
  return `#${digits.toLowerCase()}`;
}

function heroHexToRgb(hex) {
  const value = normalizeHeroHexColor(hex, '#07182d').slice(1);
  return [0, 2, 4].map(offset => parseInt(value.slice(offset, offset + 2), 16));
}

function applyHeroOptions(hero) {
  const overlay = document.querySelector('.hero-overlay');
  if (overlay) {
    const enabled = hero.overlay_enabled === true;
    overlay.style.display = enabled ? 'block' : 'none';
    if (enabled) {
      const shade = normalizeHeroHexColor(hero.overlay_color, '#07182d');
      const [red, green, blue] = heroHexToRgb(shade);
      const opacityRaw = Number(hero.overlay_opacity);
      const opacity = Number.isFinite(opacityRaw) ? Math.max(0, Math.min(1, opacityRaw)) : 0.38;
      const spreadRaw = Number(hero.overlay_spread);
      const spread = Number.isFinite(spreadRaw) ? Math.max(0, Math.min(95, spreadRaw)) : 45;
      overlay.style.background = `linear-gradient(90deg, rgba(${red}, ${green}, ${blue}, ${opacity}) 0%, rgba(${red}, ${green}, ${blue}, ${opacity}) ${spread}%, rgba(${red}, ${green}, ${blue}, 0) 100%)`;
    } else {
      overlay.style.background = 'none';
    }
  }

  const root = document.documentElement;
  const colorSettings = [
    ['--hero-company-color', hero.company_text_color, '#ffffff'],
    ['--hero-kicker-color', hero.kicker_text_color, '#e6cf74'],
    ['--hero-heading-color', hero.heading_text_color, '#ffffff'],
    ['--hero-description-color', hero.description_text_color, '#ffffff']
  ];
  colorSettings.forEach(([property, value, fallback]) => {
    root.style.setProperty(property, normalizeHeroHexColor(value, fallback));
  });
}

function renderHome(site, services) {
  const h = site.hero || {};
  const home = site.home || {};
  applyHeroOptions(h);

  setText('heroCompany', h.company_name || site.company_name);
  setText('heroKicker', h.kicker);
  setText('heroHeading', h.heading);
  setText('heroDescription', h.description);
  startServiceHeadingAnimation(site, services);
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
    video.innerHTML = `<source src="${escapeHtml(normalizeAsset(h.video || '/videos/hero-60sec.mp4'))}" type="video/mp4">`;
    video.setAttribute('aria-label', h.video_alt || 'AssurIntellec hero video');
    video.load();
  }
  setImg(poster, h.poster || '/images/uploads/hero.jpg', h.poster_alt || 'Pharmaceutical facility');
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

  renderLogoShowcases(site);
  renderTestimonials(site);

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
  setHref('profilePhone', about.profile_phone ? `tel:${telephoneHref(about.profile_phone)}` : '');
  setText('profileEmailText', about.profile_email || '');
  setHref('profileEmail', about.profile_email ? `mailto:${about.profile_email}` : '');
  setText('aboutApproachTitle', about.approach_title);
  setText('aboutApproachFlow', about.approach_flow);
  setText('aboutClosing', about.closing);
  const photo = document.getElementById('profilePhoto');
  setImg(photo,about.profile_photo || '',about.profile_photo_alt || about.profile_name || 'Profile photo');
  const ph = document.getElementById('profilePhotoPlaceholder');
  if (ph) {
    const span=ph.querySelector('span'),small=ph.querySelector('small');
    if(span)span.textContent=about.profile_missing_title || ui.profile_placeholder_title || 'Upload profile photo';
    if(small)small.textContent=about.profile_missing_help || ui.profile_placeholder_help || 'Use Decap CMS → Site Settings → About Us';
  }
  const textHolder=document.getElementById('aboutMainText');
  if(textHolder)textHolder.innerHTML=(about.main_paragraphs||[]).filter(Boolean).map(p=>`<p>${escapeHtml(p)}</p>`).join('');
  if(photo){
    photo.addEventListener('load',()=>{if(ph)ph.style.display='none';},{once:true});
    photo.addEventListener('error',()=>{if(ph)ph.style.display='flex';photo.style.display='none';},{once:true});
  }

  setText('expertTeamEyebrow', about.eyebrow || site.company_name || 'AssurIntellec™');
  setText('expertTeamTitle', about.expert_team_title || 'Expert Team');
  setText('expertTeamDescription', about.expert_team_description || '');
  const team = document.getElementById('expertTeamSection');
  const grid = document.getElementById('expertGrid');
  const experts=(Array.isArray(about.experts)?about.experts:[]).filter(item=>item && item.enabled===true && String(item.name||'').trim());
  if(team)team.style.display=experts.length?'block':'none';
  if(grid)grid.innerHTML=experts.map((expert,index)=>{
    const alt=expert.image_alt||expert.name||'Expert profile';
    const photoHtml=expert.image?`<img class="expert-photo" src="${escapeHtml(normalizeAsset(expert.image))}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async">`:`<div class="expert-photo-placeholder" aria-hidden="true"><i class="fas fa-user-tie"></i></div>`;
    const linked=mediaLinkWrap(site,expert,photoHtml,expert.name);
    return `<article class="expert-card" role="button" tabindex="0" data-expert-index="${index}"><div class="expert-card-photo">${linked}</div><div class="expert-card-copy"><h3>${escapeHtml(expert.name)}</h3>${expert.role?`<p class="expert-role">${escapeHtml(expert.role)}</p>`:''}${expert.card_text?`<p class="expert-card-text">${escapeHtml(expert.card_text)}</p>`:''}<span class="expert-view-profile">View profile <i class="fas fa-arrow-right" aria-hidden="true"></i></span></div></article>`;
  }).join('');
  const overlay=document.getElementById('expertProfileOverlay');
  const dialog=overlay?.querySelector('.expert-profile-dialog');
  const profileContent=document.getElementById('expertProfileContent');
  const close=()=>{if(overlay){overlay.classList.remove('is-open');overlay.setAttribute('aria-hidden','true');}if(profileContent)profileContent.innerHTML='';document.body.classList.remove('profile-modal-open');};
  const openProfile=(expert)=>{
    if(!overlay||!profileContent)return;
    const detailSections=(Array.isArray(expert.details)?expert.details:[]).filter(d=>d&&(d.heading||d.text||(d.bullets||[]).length)).map(d=>`<section class="expert-detail-section">${d.heading?`<h3>${escapeHtml(d.heading)}</h3>`:''}${d.text?`<p>${escapeHtml(d.text)}</p>`:''}${(d.bullets||[]).length?`<ul>${d.bullets.filter(Boolean).map(b=>`<li>${escapeHtml(typeof b==='string'?b:(b.point||''))}</li>`).join('')}</ul>`:''}</section>`).join('');
    profileContent.innerHTML=`<div class="expert-profile-heading">${expert.image?`<img src="${escapeHtml(normalizeAsset(expert.image))}" alt="${escapeHtml(expert.image_alt||expert.name)}">`:''}<div><span class="eyebrow">Expert Profile</span><h2 id="expertProfileTitle">${escapeHtml(expert.detail_title||expert.name)}</h2>${expert.role?`<p class="expert-profile-role">${escapeHtml(expert.role)}</p>`:''}${expert.detail_subtitle?`<p>${escapeHtml(expert.detail_subtitle)}</p>`:''}</div></div>${expert.card_text?`<p class="expert-profile-intro">${escapeHtml(expert.card_text)}</p>`:''}${detailSections}`;
    overlay.classList.add('is-open');overlay.setAttribute('aria-hidden','false');document.body.classList.add('profile-modal-open');dialog?.focus();
  };
  if(grid){
    grid.querySelectorAll('.expert-card').forEach(card=>{
      const index=Number(card.dataset.expertIndex);const expert=experts[index];
      const activate=event=>{if(event?.target?.closest?.('a'))return;event?.preventDefault?.();if(expert)openProfile(expert);};
      card.addEventListener('click',activate);card.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){activate(event);}});
    });
  }
  document.getElementById('expertProfileClose')?.addEventListener('click',close);
  if(overlay&&!overlay.dataset.bound){overlay.dataset.bound='1';overlay.addEventListener('click',event=>{if(event.target===overlay)close();});document.addEventListener('keydown',event=>{if(event.key==='Escape')close();});}
}

function renderWhy(site) {
  const why=site.why_us||{};
  setText('whyEyebrow',why.eyebrow);
  setText('whyPageTitle',why.page_title);
  setText('whyPageDescription',why.page_description);
  renderWhyCardGrid(site,'whyGrid',why.cards||[]);
  const process=document.getElementById('processGrid');
  if(process)process.innerHTML=(Array.isArray(why.process)?why.process:[]).filter(item=>item&&(item.title||item.text||item.image)).map(item=>{
    const img=item.image?`<img src="${escapeHtml(normalizeAsset(item.image))}" alt="${escapeHtml(item.image_alt||item.title||'')}" loading="lazy" decoding="async">`:'';
    const media=mediaLinkWrap(site,item,img,item.title||'Process image');
    return `<article class="process-card">${media}<div class="process-card-body"><div class="process-number">${escapeHtml(item.number||'')}</div>${item.title?`<h3>${escapeHtml(item.title)}</h3>`:''}${item.text?`<p>${escapeHtml(item.text)}</p>`:''}</div></article>`;
  }).join('');
}

function renderWhyDetailPage(site) {
  const params = new URLSearchParams(window.location.search);
  const requestedSlug = String(params.get('point') || '').trim();
  const why = site.why_us || {};
  const cards = (Array.isArray(why.cards) ? why.cards : []).filter(card => card && card.enabled !== false);
  const index = cards.findIndex((card, i) => whyCardSlug(card, i) === requestedSlug);
  const card = index >= 0 ? cards[index] : null;
  const eyebrow = document.getElementById('whyDetailEyebrow');
  const title = document.getElementById('whyDetailTitle');
  const description = document.getElementById('whyDetailDescription');
  const media = document.getElementById('whyDetailMedia');
  const subtitle = document.getElementById('whyDetailSubtitle');
  const intro = document.getElementById('whyDetailIntro');
  const sections = document.getElementById('whyDetailSections');
  const linkHolder = document.getElementById('whyDetailLink');
  const backLink = document.getElementById('whyDetailBack');

  if (!card) {
    setText('whyDetailEyebrow', why.eyebrow || site.company_name || 'AssurIntellec™');
    setText('whyDetailTitle', 'Why Us');
    setText('whyDetailDescription', 'This detail page could not be found. Please choose a point from the Why Us page.');
    if (media) media.style.display = 'none';
    if (subtitle) subtitle.style.display = 'none';
    if (intro) intro.style.display = 'none';
    if (sections) sections.innerHTML = '';
    if (linkHolder) linkHolder.innerHTML = '';
    if (backLink) backLink.href = './why-us.html';
    document.title = `Why Us | ${site.company_name || 'AssurIntellec™'}`;
    return;
  }

  const heading = card.detail_title || card.title || 'Why AssurIntellec';
  const pageIntro = card.detail_intro || card.text || card.home_text || '';
  setText('whyDetailEyebrow', why.eyebrow || site.company_name || 'AssurIntellec™');
  setText('whyDetailTitle', heading);
  setText('whyDetailDescription', card.detail_subtitle || card.home_text || '');
  if (subtitle) { subtitle.textContent = heading; subtitle.style.display = 'none'; }
  if (intro) { intro.textContent = pageIntro; intro.style.display = pageIntro ? '' : 'none'; }

  const videoMode = card.media_type === 'video' && card.video;
  let mediaHtml = '';
  if (videoMode) {
    mediaHtml = `<video class="why-detail-page-video" controls playsinline preload="metadata" src="${escapeHtml(normalizeAsset(card.video))}" aria-label="${escapeHtml(card.image_alt || heading)}"></video>`;
  } else if (card.image) {
    const imageHtml = `<img class="why-detail-page-image" src="${escapeHtml(normalizeAsset(card.image))}" alt="${escapeHtml(card.image_alt || heading)}" loading="eager" decoding="async">`;
    mediaHtml = mediaLinkWrap(site, card, imageHtml, heading);
  } else {
    mediaHtml = `<div class="why-detail-page-placeholder"><i class="fas ${escapeHtml(card.icon || 'fa-circle-nodes')}"></i><span>${escapeHtml(heading)}</span></div>`;
  }
  if (media) { media.innerHTML = mediaHtml; media.style.display = ''; }

  const details = (Array.isArray(card.details) ? card.details : []).filter(item => item && (item.heading || item.text || (item.bullets || []).length));
  if (sections) {
    sections.innerHTML = details.map(detail => `<article class="why-detail-page-section">${detail.heading ? `<h3>${escapeHtml(detail.heading)}</h3>` : ''}${detail.text ? `<p>${escapeHtml(detail.text)}</p>` : ''}${(detail.bullets || []).length ? `<ul>${detail.bullets.filter(Boolean).map(point => `<li>${escapeHtml(typeof point === 'string' ? point : (point.point || ''))}</li>`).join('')}</ul>` : ''}</article>`).join('');
    if (!details.length && card.text && card.text !== pageIntro) {
      sections.innerHTML = `<article class="why-detail-page-section"><h3>More information</h3><p>${escapeHtml(card.text)}</p></article>`;
    }
  }
  if (linkHolder) {
    const canLink = site.media_options?.clickable_images_enabled !== false && card.link_enabled === true && safeMediaHref(card.link_url);
    linkHolder.innerHTML = canLink ? `<a class="btn btn-primary dark-btn" href="${escapeHtml(safeMediaHref(card.link_url))}" target="_blank" rel="noopener noreferrer">Open related link <i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i></a>` : '';
  }
  if (backLink) { backLink.href = './why-us.html'; backLink.textContent = 'Back to Why Us'; }
  document.title = `${heading} | ${site.company_name || 'AssurIntellec™'}`;
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) canonical.href = `${String(site.seo?.canonical_base || window.location.origin).replace(/\/$/, '')}/why-us-detail.html?point=${encodeURIComponent(whyCardSlug(card,index))}`;
}

function renderContactLocation(site) {
  const c = site.contact || {};
  const holder = document.getElementById('contactLocation');
  if (!holder) return;
  if (c.location_enabled === false) { holder.style.display = 'none'; return; }
  const address = formatAddress(c);
  const embedUrl = String(c.map_embed_url || '').trim();
  const externalMapUrl = String(c.map_link_url || c.map_embed_url || '').trim();
  if (!address && !embedUrl && !externalMapUrl) { holder.style.display = 'none'; return; }
  holder.style.display = 'grid';
  setText('contactLocationTitle', c.location_title || 'Our Location');
  setText('contactAddress', address);
  const frame = document.getElementById('contactMapFrame');
  const openLink = document.getElementById('contactMapLink');
  if (embedUrl && /^https:\/\//i.test(embedUrl)) {
    if (frame) { frame.style.display = 'block'; frame.innerHTML = `<iframe title="${escapeHtml(c.location_title || 'Google Maps location')}" src="${escapeHtml(embedUrl)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>`; }
  } else if (frame) {
    frame.innerHTML = '';
    frame.style.display = 'none';
  }
  if (openLink && externalMapUrl && /^https:\/\//i.test(externalMapUrl)) {
    openLink.style.display = 'inline-flex';
    openLink.href = externalMapUrl;
  } else if (openLink) {
    openLink.style.display = 'none';
  }
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
  renderContactLocation(site);
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

let enquiryRequestCounter = 0;
const pendingEnquiries = new Map();

// Apps Script HTML Service sandboxes HtmlOutput in an iframe. The previous
// implementation tried to communicate with that sandbox using a direct
// parent->iframe postMessage handshake. In practice the message can terminate
// at the Apps Script wrapper instead of the sandbox document. We now submit
// the enquiry as a normal HTTP POST to a hidden iframe and let the Apps Script
// HTML response post the result back to the top-level website window.
const ENQUIRY_RESPONSE_TIMEOUT_MS = 30000;

function makeEnquiryBridgeToken() {
  try {
    if (window.crypto?.randomUUID) {
      return window.crypto.randomUUID();
    }

    if (window.crypto?.getRandomValues) {
      const bytes = new Uint8Array(16);
      window.crypto.getRandomValues(bytes);
      return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    }
  } catch (_) {}

  return `AI-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createEnquiryTransportFrame() {
  const frame = document.createElement('iframe');
  const frameName = `assurIntellecEnquiry_${Date.now()}_${++enquiryRequestCounter}`;

  frame.name = frameName;
  frame.id = frameName;
  frame.title = 'AssurIntellec enquiry service';
  frame.setAttribute('aria-hidden', 'true');
  frame.setAttribute('tabindex', '-1');
  frame.dataset.enquirySubmitted = '0';
  frame.style.position = 'fixed';
  frame.style.left = '-10000px';
  frame.style.top = '-10000px';
  frame.style.width = '1px';
  frame.style.height = '1px';
  frame.style.border = '0';
  frame.style.opacity = '0';
  frame.style.pointerEvents = 'none';

  document.body.appendChild(frame);
  return frame;
}

function removeEnquiryTransportFrame(frame) {
  if (!frame) return;
  window.setTimeout(() => {
    try {
      frame.remove();
    } catch (_) {}
  }, 1000);
}

window.addEventListener('message', event => {
  const message = event.data || {};

  if (message.type !== 'assurintellec:result') {
    return;
  }

  const bridgeToken = String(message.bridgeToken || '');
  if (!bridgeToken) return;

  const pending = pendingEnquiries.get(bridgeToken);
  if (!pending) return;

  if (pending.settled) return;

  pending.settled = true;
  clearTimeout(pending.timeoutId);
  pendingEnquiries.delete(bridgeToken);
  removeEnquiryTransportFrame(pending.frame);

  const result = message.result || {};
  pending.callback(
    result.success === true,
    result.message || '',
    result
  );
});

function appendHiddenFormField(form, name, value) {
  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = name;
  input.value = value == null ? '' : String(value);
  form.appendChild(input);
}

function submitEnquiryPost(url, payload, bridgeToken, frame) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = url;
  form.target = frame.name;
  form.acceptCharset = 'UTF-8';
  form.style.display = 'none';
  form.setAttribute('aria-hidden', 'true');

  Object.entries(payload || {}).forEach(([key, value]) => {
    appendHiddenFormField(form, key, value);
  });

  appendHiddenFormField(form, '_bridge_format', 'html');
  appendHiddenFormField(form, '_bridge_token', bridgeToken);
  appendHiddenFormField(form, '_bridge_origin', window.location.origin);
  appendHiddenFormField(form, '_bridge_request_id', `AI-WEB-${Date.now()}`);

  document.body.appendChild(form);
  frame.dataset.enquirySubmitted = '1';

  try {
    form.submit();
  } finally {
    window.setTimeout(() => {
      try {
        form.remove();
      } catch (_) {}
    }, 1500);
  }
}

function sendToGoogleAppsScript(url, data, site, callback) {
  if (!url || !/^https?:\/\//i.test(url)) {
    callback(
      false,
      'No Google Apps Script web-app URL has been configured.'
    );
    return;
  }

  const c = site.contact || {};
  const frame = createEnquiryTransportFrame();
  const bridgeToken = makeEnquiryBridgeToken();

  const payload = {
    ...data,
    source: 'AssurIntellec website',
    submitted_at: new Date().toISOString(),
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

  // The Apps Script response is loaded into a cross-origin iframe.
  // Some browsers block/ignore the postMessage from the nested Apps Script
  // sandbox, even though the POST has completed successfully. The iframe
  // `load` event is therefore used as a transport-level acknowledgement.
  // The postMessage response remains the preferred path when it is available.
  const onTransportLoad = () => {
    if (frame.dataset.enquirySubmitted !== '1') return;

    // Give the Apps Script HTML response a brief chance to deliver its
    // postMessage first. Whichever signal arrives first settles the request.
    window.setTimeout(() => {
      const pending = pendingEnquiries.get(bridgeToken);
      if (!pending || pending.settled) return;

      pending.settled = true;
      clearTimeout(pending.timeoutId);
      pendingEnquiries.delete(bridgeToken);
      removeEnquiryTransportFrame(pending.frame);
      pending.callback(
        true,
        'Enquiry submitted successfully.'
      );
    }, 250);
  };

  frame.addEventListener('load', onTransportLoad, { once: false });

  const timeoutId = window.setTimeout(() => {
    const pending = pendingEnquiries.get(bridgeToken);
    if (!pending || pending.settled) return;

    pending.settled = true;
    pendingEnquiries.delete(bridgeToken);
    removeEnquiryTransportFrame(pending.frame);
    pending.callback(
      false,
      'The enquiry service did not respond within the expected time. Please try again or use WhatsApp.'
    );
  }, ENQUIRY_RESPONSE_TIMEOUT_MS);

  pendingEnquiries.set(bridgeToken, {
    callback,
    timeoutId,
    frame,
    settled: false
  });

  try {
    submitEnquiryPost(url, payload, bridgeToken, frame);
  } catch (error) {
    clearTimeout(timeoutId);
    pendingEnquiries.delete(bridgeToken);
    removeEnquiryTransportFrame(frame);
    callback(
      false,
      error?.message ||
        'Unable to contact the enquiry service. Please try again or use WhatsApp.'
    );
  }
}

function showEnquirySuccess(site, customerName = "") {
  const c = site.contact || {};

  const overlay = document.getElementById('enquirySuccessOverlay');
  const card = overlay?.querySelector('.enquiry-success-card');
  const close = document.getElementById('enquirySuccessClose');

  if (!overlay || !card) return;

  const safeName = String(customerName || '').trim();
  const titleTemplate =
    c.enquiry_success_title ||
    'Thank You, {name}!';
  const successTitle = titleTemplate.replace(
    /\{name\}/gi,
    safeName || 'there'
  );

  setText('enquirySuccessTitle', successTitle);

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
      showEnquirySuccess(site, data.name);
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

// The same streamlined, CMS-editable player is used by all seven service details.
// Only sound can be switched by visitors: no native play, pause, fullscreen,
// timeline, picture-in-picture, or download controls are shown.
function serviceVideoMarkup(source, description, poster = '', extraClass = '') {
  const src = escapeHtml(normalizeAsset(source));
  const label = escapeHtml(description || 'Service introduction video');
  const posterAttr = poster ? ` poster="${escapeHtml(normalizeAsset(poster))}"` : '';
  const mime = serviceVideoMime(source);
  const typeAttr = mime ? ` type="${mime}"` : '';
  return `<div class="service-video-player">
    <video class="${escapeHtml(extraClass)} service-loop-video" autoplay muted loop playsinline webkit-playsinline preload="auto" disablepictureinpicture disableremoteplayback controlslist="nodownload nofullscreen noplaybackrate noremoteplayback"${posterAttr} aria-label="${label}">
      <source src="${src}"${typeAttr}>Your browser does not support this video format.
    </video>
    <button type="button" class="service-video-sound" aria-label="Unmute service video" aria-pressed="false" title="Unmute service video"></button>
  </div>`;
}

// Opening videos are genuine inline autoplay elements, just like the homepage
// hero. A CMS update changes their SOURCE; it must not destroy the video DOM
// node (which would interrupt playback or undo a manual HTML override).
function syncOpeningServiceVideo(hero, source, poster, description) {
  const video = hero?.querySelector('.ps2-hero-frame video');
  if (!video) return;
  video.setAttribute('aria-label', description || 'Service opening video');
  if (poster) video.poster = normalizeAsset(poster);
  // Advanced manual override: editors who intentionally set data-manual-video="true"
  // in the matching service-*.html keep the inline HTML source unchanged.
  if (video.dataset.manualVideo === 'true') return;
  const next = normalizeAsset(source);
  if (!next) return; // keep immediate-play HTML default if CMS value is empty
  const current = video.querySelector('source')?.getAttribute('src') || video.getAttribute('src') || '';
  try {
    if (new URL(current, location.href).href === new URL(next, location.href).href) return;
  } catch (_) { if (current === next) return; }
  // Never swap the actual <video> element: replace only the media URL and load.
  video.pause();
  video.querySelectorAll('source').forEach(el => el.remove());
  video.src = next;
  video.load();
  const attempt = video.play();
  if (attempt?.catch) attempt.catch(() => {});
}

function setupServiceVideoPlayers(root = document) {
  root.querySelectorAll('.service-video-player').forEach(player => {
    const video = player.querySelector('video');
    if (!video || player.dataset.playerReady === 'true') return;
    player.dataset.playerReady = 'true';
    // The static service HTML also has a player; create its controls exactly as
    // for the CMS-rendered player, without replacing the already-loading video.
    let sound = player.querySelector('.service-video-sound');
    if (!sound) {
      sound = document.createElement('button');
      sound.className = 'service-video-sound';
      sound.type = 'button';
      player.append(sound);
    }
    sound.setAttribute('aria-label', 'Unmute service video');
    let feedback = player.querySelector('.service-video-feedback');
    if (!feedback) {
      feedback = document.createElement('div');
      feedback.className = 'service-video-feedback';
      feedback.hidden = true;
      feedback.innerHTML = '<p class="service-video-feedback-text" role="status"></p><button type="button" class="service-video-retry">Play video</button>';
      player.append(feedback);
    }
    const retry = feedback.querySelector('.service-video-retry');
    const message = feedback.querySelector('.service-video-feedback-text');
    video.controls = false;
    video.removeAttribute('controls');
    video.autoplay = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.disablePictureInPicture = true;
    video.muted = true; // required for reliable autoplay on mobile/desktop
    video.defaultMuted = true;
    video.volume = 1;
    const icon = muted => muted
      ? '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="m16 9 5 6m0-6-5 6"/></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/></svg>';
    const updateSound = () => {
      const muted = video.muted || video.volume === 0;
      sound.innerHTML = icon(muted);
      sound.setAttribute('aria-label', muted ? 'Unmute service video' : 'Mute service video');
      sound.setAttribute('aria-pressed', String(!muted));
      sound.title = muted ? 'Unmute service video' : 'Mute service video';
    };
    const showFeedback = (txt, label = 'Play video') => {
      message.textContent = txt;
      retry.textContent = label;
      feedback.hidden = false;
    };
    const keepPlaying = () => {
      if (!video.isConnected || document.hidden || video.error) return;
      const attempt = video.play();
      if (attempt?.then) attempt.then(() => { feedback.hidden = true; }).catch(err => {
        if (err?.name === 'NotAllowedError') showFeedback('Tap Play to start the opening video.');
        else if (err?.name !== 'AbortError') showFeedback('Playback was interrupted. Tap Play to retry.');
      });
    };
    retry.addEventListener('click', () => {
      // This call originates from the visitor gesture; supported browsers can play.
      if (video.error) video.load();
      const attempt = video.play();
      if (attempt?.then) attempt.then(() => { feedback.hidden = true; }).catch(() => {
        showFeedback('This video cannot play in your browser. Upload an H.264 MP4 in Decap Turbo.', 'Retry playback');
      });
    });
    sound.addEventListener('click', () => {
      video.muted = !video.muted;
      video.volume = 1;
      updateSound();
      keepPlaying();
    });
    video.addEventListener('volumechange', updateSound);
    video.addEventListener('canplay', () => { feedback.hidden = true; keepPlaying(); });
    video.addEventListener('playing', () => { feedback.hidden = true; });
    video.addEventListener('error', () => showFeedback('Video file unavailable or unsupported. Check its Decap upload path and use H.264 MP4.', 'Retry playback'));
    video.addEventListener('pause', () => { if (!video.ended && !video.error) keepPlaying(); });
    video.addEventListener('ended', () => { video.currentTime = 0; keepPlaying(); });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) keepPlaying(); });
    updateSound();
    keepPlaying();
  });
}

function renderServiceDetail(site) {
  const slug=document.body.dataset.serviceSlug||'';
  const service=SERVICES.find(item=>item.slug===slug);
  if(!service)return;
  document.body.classList.add('premium-service-page');
  renderPremiumService(service,site);
  setText('servicePageEyebrow',service.page_eyebrow||'Service');
  setText('servicePageTitle',service.page_title||service.title);
  setText('servicePageDescription',service.page_description||service.description);
  setText('serviceIntroTitle',service.intro_title||'');
  setText('serviceIntro',service.intro||'');
  const icon=document.getElementById('serviceDetailIcon');if(icon)icon.innerHTML=iconHtml(service.icon);
  const stage=document.getElementById('serviceMediaStage');
  const caption=document.getElementById('serviceMediaCaption');
  const mode=service.primary_media_type==='video'?'video':'image';
  const videoPath=service.primary_video||service.service_video||'';
  const imagePath=serviceImageSource(service,'primary_image')||service.image_1||'';
  let mediaHtml='';
  if(mode==='video' && videoPath){
    mediaHtml=serviceVideoMarkup(videoPath,service.media_alt||service.title||'Service video','', 'service-primary-video');
  }else if(imagePath){
    mediaHtml=`<img class="service-primary-image" src="${escapeHtml(normalizeAsset(imagePath))}" alt="${escapeHtml(service.media_alt||service.image_1_alt||service.title||'Service image')}" loading="lazy" decoding="async">`;
  }else{
    mediaHtml=`<div class="service-media-placeholder"><i class="fas ${escapeHtml(service.icon||'fa-circle-nodes')}"></i><span>${escapeHtml(service.title||'Service visual')}</span></div>`;
  }
  if(stage){stage.innerHTML=(mode==='video'&&videoPath)?mediaHtml:mediaLinkWrap(site,{link_enabled:service.media_link_enabled,link_url:service.media_link_url},mediaHtml,service.title||'Service media');setupServiceVideoPlayers(stage);}
  setText('serviceCaption1',service.caption||service.gallery_caption_1||'');
  setText('serviceImageText1',service.media_text||service.image_1_text||service.description||'');
  if(caption){const cap=String(service.caption||service.gallery_caption_1||'').trim();const txt=String(service.media_text||service.image_1_text||service.description||'').trim();caption.style.display=(cap||txt)?'flex':'none';}
  const sectionHolder=document.getElementById('serviceDetailSections');
  if(sectionHolder)sectionHolder.innerHTML=(Array.isArray(service.sections)?service.sections:[]).filter(section=>section&&(section.heading||(section.paragraphs||[]).length||(section.bullets||[]).length)).map(section=>`<article class="detail-card">${section.heading?`<h3>${escapeHtml(section.heading)}</h3>`:''}${(section.paragraphs||[]).filter(Boolean).map(p=>`<p>${escapeHtml(p)}</p>`).join('')}${(section.bullets||[]).length?`<ul class="detail-list">${section.bullets.filter(Boolean).map(b=>`<li>${escapeHtml(b)}</li>`).join('')}</ul>`:''}</article>`).join('');
  setText('serviceContactLabel',site.contact?.service_contact_label||'Contact');
  const serviceContactEmail = String(service.contact_email || site.contact?.service_contact_email || '').trim();
  const isValidServiceEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(serviceContactEmail);
  setText('serviceContactEmail',isValidServiceEmail ? serviceContactEmail : '');
  setHref('serviceContactEmail',isValidServiceEmail ? `mailto:${serviceContactEmail}` : '');
  setText('serviceCta',service.cta||'Contact Us');
  setHref('serviceCta',safeMediaHref(service.cta_url)||'./contact.html');
  const back=document.querySelector('.detail-cta-row .text-link');
  if(back){back.textContent=site.home?.services_preview?.back_to_services_label||site.ui?.service_back_label||'Back to Services';back.href=site.home?.services_preview?.back_to_services_url||'./services.html';}
}

function applyTextStyleOverrides(site) {
  const overrides=Array.isArray(site.text_style_overrides)?site.text_style_overrides:[];
  overrides.filter(item=>item&&item.enabled!==false&&String(item.selector||'').trim()).forEach(item=>{
    let targets=[];
    try{targets=Array.from(document.querySelectorAll(String(item.selector).trim()));}catch(error){console.warn('Invalid text style selector skipped:',item.selector);return;}
    targets.forEach(el=>{
      const size=Number(item.font_size);
      if(Number.isFinite(size)&&size>=8&&size<=120)el.style.fontSize=`${size}px`;
      const color=String(item.color||'').trim();
      if(color && (window.CSS?.supports?.('color',color) || /^#[0-9a-f]{3,8}$/i.test(color)))el.style.color=color;
      const family=String(item.font_family||'').trim();
      if(family && /^[a-zA-Z0-9 ,_'"-]{1,80}$/.test(family))el.style.fontFamily=family;
      const weight=String(item.font_weight||'').trim();
      if(['400','500','600','700','800','normal','bold'].includes(weight))el.style.fontWeight=weight;
      const style=String(item.font_style||'').trim();
      if(['normal','italic'].includes(style))el.style.fontStyle=style;
      const align=String(item.text_align||'').trim();
      if(['left','center','right','justify'].includes(align))el.style.textAlign=align;
      const lineHeight=Number(item.line_height);
      if(Number.isFinite(lineHeight)&&lineHeight>=0.8&&lineHeight<=3)el.style.lineHeight=String(lineHeight);
      const letterSpacing=Number(item.letter_spacing);
      if(Number.isFinite(letterSpacing)&&letterSpacing>=-3&&letterSpacing<=20)el.style.letterSpacing=`${letterSpacing}px`;
      const decoration=String(item.text_decoration||'').trim();
      if(['none','underline','line-through'].includes(decoration))el.style.textDecoration=decoration;
    });
  });
  if (typeof window.__fitAssurHeroHeading === 'function') window.__fitAssurHeroHeading();
}

function applyAnimationOptions(site) {
  const options = site.animation_options || {};
  const root = document.documentElement;
  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hoverEnabled = options.hover_text_zoom_enabled !== false && !reducedMotion;
  const revealEnabled = options.reveal_animations_enabled !== false && !reducedMotion;
  const scale = Number(options.text_hover_zoom_scale);
  const duration = Number(options.reveal_animation_duration_ms);
  const distance = Number(options.reveal_animation_distance);
  root.dataset.textHoverZoom = hoverEnabled ? 'true' : 'false';
  root.dataset.revealAnimations = revealEnabled ? 'true' : 'false';
  root.dataset.cardHoverLift = options.card_hover_lift_enabled === false ? 'false' : 'true';
  root.style.setProperty('--text-hover-scale', String(Number.isFinite(scale) ? Math.min(1.10, Math.max(1.01, scale)) : 1.035));
  root.style.setProperty('--reveal-duration', `${Number.isFinite(duration) ? Math.min(1200, Math.max(200, duration)) : 650}ms`);
  root.style.setProperty('--reveal-distance', `${Number.isFinite(distance) ? Math.min(60, Math.max(0, distance)) : 18}px`);
  if (!revealEnabled) return;

  const targets = Array.from(document.querySelectorAll(
    '.hero-content > *, .section-heading, .about-content, .instagram-carousel, .service-card, .why-card, .logo-showcase-card, .testimonial-card, .process-card, .expert-card, .contact-info, .contact-form, .contact-location-copy, .contact-map-frame, .cta-inner, .footer-grid > div'
  ));
  if (!targets.length) return;
  if (!('IntersectionObserver' in window)) { targets.forEach(el => el.classList.add('animate-in', 'is-visible')); return; }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });
  targets.forEach((el, index) => {
    el.classList.add('animate-in');
    el.style.setProperty('--reveal-delay', `${Math.min(index % 5, 4) * 55}ms`);
    observer.observe(el);
  });
}

function applyVisibility(site) {
  const v = site.section_visibility || {};
  const map = {
    trust_strip: 'trust-strip',
    approval_logos_home: 'approval-showcase-section',
    client_logos_home: 'client-showcase-section',
    testimonials_home: 'testimonials-section',
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
  initVisitorCounter(SITE);
  renderWhatsApp(SITE);

  const page = document.body.dataset.page;
  if (page === 'home') renderHome(SITE, SERVICES);
  if (page === 'about') renderAbout(SITE);
  if (page === 'services') renderServicesPage(SITE);
  if (page === 'why') renderWhy(SITE);
  if (page === 'why-detail') renderWhyDetailPage(SITE);
  if (page === 'contact') renderContact(SITE, SERVICES);
  if (page === 'service') renderServiceDetail(SITE);
  applyVisibility(SITE);
  applyTextStyleOverrides(SITE);
  applyAnimationOptions(SITE);
  if (SITE.media_options?.image_hover_zoom_enabled === false) document.documentElement.classList.add('disable-image-zoom');
  if (SITE.visitor_counter?.enabled === false) {
    const stat=document.getElementById('visitorStat');
    if(stat)stat.style.display='none';
  }
}

document.addEventListener('DOMContentLoaded', init);


function renderPremiumService(service, site) {
  const main=document.querySelector('body[data-page="service"] main');
  if (!main) return;
  const e=escapeHtml, asset=normalizeAsset;
  const arr=v=>Array.isArray(v)?v.filter(Boolean):[];
  const L=(key,fallback)=>String(service.page_labels?.[key]||fallback);
  const text=v=>String(v||'').trim();
  const paras=(v,klass='')=>{
    // Preserve Decap multiline formatting: normal paragraphs remain paragraphs;
    // bullet-marked/numbered lines are rendered as semantic lists, not run-on copy.
    const chunks=text(v).replace(/\r\n?/g,'\n').split(/\n\s*\n/).filter(Boolean);
    return chunks.map(chunk=>{
      const lines=chunk.split('\n').map(s=>s.trim()).filter(Boolean);
      const listLine=/^(?:[-*•✓]\s+|\d+[.)]\s+)/;
      if(lines.length&&lines.every(s=>listLine.test(s))) {
        const ordered=lines.every(s=>/^\d+[.)]\s+/.test(s));
        const tag=ordered?'ol':'ul';
        return `<${tag} class="ps2-rich-list">${lines.map(s=>`<li>${e(s.replace(listLine,''))}</li>`).join('')}</${tag}>`;
      }
      return `<p${klass?` class="${klass}"`:''}>${e(lines.join(' '))}</p>`;
    }).join('');
  };
  // Single-use service imagery: each photo file can appear at most once per detail page.
  // If an editor selects the same file twice in Decap Turbo, subsequent occurrences
  // become a styled text visual, rather than repeating an unrelated photograph.
  const usedServiceImagePaths=new Set();
  // When the same file is selected in different service records via CMS, give
  // the first record sole ownership; others render distinct branded artwork.
  // This protects uniqueness ACROSS all seven service detail pages as well.
  const serviceImageOwner=new Map();
  const fullServiceList=Array.isArray(SERVICES)?SERVICES:[];
  for(const record of fullServiceList){
    const sources=[serviceImageSource(record,'hero_image'),serviceImageSource(record,'primary_image'),serviceImageSource(record,'resource_image')];
    for(const field of ['core_services','focus_areas','additional_information']){
      for(const entry of (Array.isArray(record[field])?record[field]:[]))sources.push(serviceImageSource(entry,'image'));
    }
    for(const src of sources){
      if(!src)continue;
      const path=asset(src);
      if(!serviceImageOwner.has(path))serviceImageOwner.set(path,record.slug);
    }
  }
  const hasUniqueImageRights=(src)=>!src||!serviceImageOwner.has(asset(src))||serviceImageOwner.get(asset(src))===service.slug;
  const image=(src,alt,klass='')=>{
    const path=src?asset(src):'';
    if(!path||usedServiceImagePaths.has(path)||!hasUniqueImageRights(src))return '';
    usedServiceImagePaths.add(path);
    return `<img class="${klass}" src="${e(path)}" alt="${e(alt||'AssurIntellec service reference image')}" loading="lazy" decoding="async">`;
  };
  const visualFallback=(title)=>`<div class="ps2-unique-fallback" aria-label="${e(title||'Service expertise')}"><span>ASSURINTELLEC™</span><strong>${e(title||'Service expertise')}</strong></div>`;
  const url=href=>safeMediaHref(href)||'./contact.html';
  const icon='<span aria-hidden="true">↗</span>';
  const validMail=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(service.contact_email||'');
  const mail=validMail?service.contact_email:(site.contact?.service_contact_email||'info@assurintellec.in');
  const subject='AssurIntellec enquiry — '+text(service.page_title||service.title);
  const mailHref=`mailto:${mail}?subject=${encodeURIComponent(subject)}`;
  const heroPhoto=serviceImageSource(service,'hero_image')||serviceImageSource(service,'primary_image')||'';
  const heroVideo=service.hero_video||''; // Opening video is independent of the legacy secondary video
  // Service videos play on repeat; only the custom sound toggle is visible.
  // The video URL and its optional poster remain individually editable in Decap Turbo.
  const licensedHeroPhoto=hasUniqueImageRights(heroPhoto)?heroPhoto:'';
  const heroMedia=heroVideo?
    serviceVideoMarkup(heroVideo,'Opening service video: '+(service.page_title||service.title||'Service'),licensedHeroPhoto,'ps2-hero-video'):
    image(licensedHeroPhoto,service.page_title,'ps2-hero-image');
  if(heroVideo&&licensedHeroPhoto)usedServiceImagePaths.add(asset(licensedHeroPhoto));
  const core=arr(service.core_services),focus=arr(service.focus_areas),workflow=arr(service.workflow),deliverables=arr(service.deliverables),audiences=arr(service.audiences),advantages=arr(service.advantages),extras=arr(service.additional_information),approach=arr(service.approach_steps);
  const introParas=text(service.intro).split(/\n\s*\n/).filter(Boolean);
  const sectionLabel=(index,title)=>`<div class="ps2-overline"><span class="ps2-overline-index">${e(index)}</span><span>${e(title)}</span></div>`;
  const nav=[['overview','Overview'],['capabilities','Capabilities']];
  if(focus.length)nav.push(['specialisms','Specialisms']);
  if(workflow.length||approach.length)nav.push(['process','Our process']);
  if(deliverables.length)nav.push(['deliverables','Deliverables']);
  if(audiences.length)nav.push(['audiences','Who we help']);
  if(advantages.length)nav.push(['why-us','Why AssurIntellec']);
  nav.push(['service-contact','Contact']);
  const related=arr((typeof SERVICES==='undefined'?[]:SERVICES)).filter(s=>s.slug!==service.slug&&s.enabled!==false).slice(0,3);
  const header=`<section class="ps2-hero" aria-labelledby="ps2-page-title"><div class="ps2-hero-frame">${heroMedia||'<div class="ps2-media-placeholder"><span>ASSURINTELLEC / EXPERTISE</span></div>'}</div><div class="ps2-hero-panel"><div class="ps2-kicker"><span class="ps2-kicker-dot"></span>${e(service.page_eyebrow||'OUR SERVICES')} <span class="ps2-kicker-slash">/</span> ${e(service.hero_kicker||'Our Expertise')}</div><h1 id="ps2-page-title">${e(service.page_title||service.title)}</h1><p class="ps2-hero-description">${e(service.page_description||service.description)}</p><div class="ps2-hero-actions"><a class="ps2-btn ps2-btn-primary" href="#service-contact">${e(L('hero_primary_cta','Discuss your requirements'))} ${icon}</a><a class="ps2-btn ps2-btn-plain" href="#capabilities">${e(L('hero_secondary_cta','Explore capabilities'))} <span aria-hidden="true">↓</span></a></div></div></section>`;
  const navigation=`<nav class="ps2-anchor-nav" aria-label="Service page navigation"><div class="container ps2-anchor-track"><span class="ps2-navigation-prefix">${e(service.page_navigation_title||'On this page')}</span>${nav.map(([href,t])=>`<a href="#${href}">${e(t)}</a>`).join('')}</div></nav>`;
  const overview=`<section class="ps2-section ps2-intro" id="overview"><div class="container ps2-editorial-grid"><div class="ps2-intro-aside ps2-animate">${sectionLabel('01',L('overview_label','THE BIG PICTURE'))}<div class="ps2-intro-mark">01<span>/ 07</span></div></div><div class="ps2-intro-copy ps2-animate"><h2>${e(service.intro_title||'An integrated approach to your requirements')}</h2>${introParas.slice(0,2).map(t=>`<p>${e(t)}</p>`).join('')}${introParas.length>2?`<details class="ps2-extend"><summary>${e(L('overview_more','More about our approach'))} <span aria-hidden="true">+</span></summary><div>${introParas.slice(2).map(t=>`<p>${e(t)}</p>`).join('')}</div></details>`:''}<div class="ps2-intro-actions"><a href="#capabilities">View ${core.length} ${e(L('overview_link_suffix','core service areas'))} <span aria-hidden="true">↘</span></a></div></div></div></section>`;
  const serviceCard=(item,i)=>{
    const hasDetails=arr(item.scope).length||text(item.overview)||text(item.outcome)||text(item.note);
    const picture=serviceImageSource(item,'image'); // Deliberately NO image fallback: a fallback repeats the same photograph.
    const preview=arr(item.scope).slice(0,2);
    return `<article class="ps2-service-card ps2-animate" style="--ps2-index:${i%4}"><div class="ps2-card-photo">${image(picture,item.image_alt||item.title)||visualFallback(item.title)}<span class="ps2-photo-index">${String(i+1).padStart(2,'0')}</span></div><div class="ps2-card-inner"><div class="ps2-card-meta">${e(item.short_label||'PHARMACEUTICAL SOLUTIONS')}</div><h3>${e(item.title)}</h3><p class="ps2-card-lead">${e(item.lead||'Explore project-specific requirements and support.')}</p>${preview.length?`<ul class="ps2-preview-list">${preview.map(s=>`<li>${e(s)}</li>`).join('')}</ul>`:''}${hasDetails?`<details class="ps2-scope" ${item.expanded?'open':''}><summary><span>${e(L('card_scope_label','Explore full scope'))}</span><span class="ps2-scope-icon" aria-hidden="true">+</span></summary><div class="ps2-scope-inner">${paras(item.overview)}${arr(item.scope).length?`<h4>${e(L('card_activities_label','Our support may include'))}</h4><ul class="ps2-detail-list">${arr(item.scope).map(a=>`<li>${e(a)}</li>`).join('')}</ul>`:''}${text(item.outcome)?`<div class="ps2-outcome"><strong>${e(L('card_outcome_label','Project objective / outcome'))}</strong>${paras(item.outcome)}</div>`:''}${text(item.note)?`<p class="ps2-scope-note">${e(item.note)}</p>`:''}${text(item.image_caption)?`<p class="ps2-image-caption">${e(item.image_caption)}</p>`:''}</div></details>`:''}</div></article>`;
  };
  const capabilities=`<section class="ps2-section ps2-capabilities" id="capabilities"><div class="container"><div class="ps2-section-header ps2-animate"><div>${sectionLabel('02',L('capabilities_label','WHAT WE DO'))}<h2>${e(service.capabilities_heading||'Our core capabilities')}</h2><p>${e(service.capabilities_description||'Explore our complete service portfolio.')}</p></div><div class="ps2-section-number">${String(core.length).padStart(2,'0')}<small>${e(L('capabilities_count_label','FOCUS AREAS'))}</small></div></div><div class="ps2-card-grid">${core.map(serviceCard).join('')}</div></div></section>`;
  const specialisms=focus.length?`<section class="ps2-section ps2-specialisms" id="specialisms"><div class="container"><div class="ps2-section-header ps2-animate">${sectionLabel('03',L('focus_label','SPECIALISED EXPERTISE'))}<h2>${e(service.focus_heading||'Areas of focus')}</h2><p>${e(L('focus_description','Explore the product categories, professional functions and opportunities relevant to this service.'))}</p></div><div class="ps2-specialism-grid">${focus.map((f,i)=>`<article class="ps2-specialism ps2-animate"><span>${String(i+1).padStart(2,'0')}</span><div>${serviceImageSource(f,'image')?`<figure class="ps2-focus-photo">${image(serviceImageSource(f,'image'),f.title)||visualFallback(f.title)}</figure>`:''}<h3>${e(f.title)}</h3>${paras(f.description)}</div></article>`).join('')}</div></div></section>`:'';
  const process=(workflow.length||approach.length)?`<section class="ps2-section ps2-process" id="process"><div class="container"><div class="ps2-section-header ps2-animate">${sectionLabel('04',L('process_label','OUR METHOD'))}<h2>${e(service.process_heading||'A clear process from brief to next steps')}</h2><p>${e(L('process_description','Every engagement is tailored to the project objectives, information available and agreed scope.'))}</p></div><div class="ps2-steps">${workflow.map((step,i)=>`<article class="ps2-step ps2-animate"><div class="ps2-step-index">${String(i+1).padStart(2,'0')}<span class="ps2-step-line"></span></div><div><h3>${e(step.title)}</h3>${paras(step.description)}</div></article>`).join('')}</div>${approach.length?`<div class="ps2-methods"><h3>${e(L('approach_heading','Our approach to every assignment'))}</h3><div class="ps2-method-grid">${approach.map(a=>`<div><strong>${e(a.title)}</strong>${paras(a.description)}</div>`).join('')}</div></div>`:''}</div></section>`:'';
  const outputs=deliverables.length?`<section class="ps2-section ps2-deliverables" id="deliverables"><div class="container ps2-output-layout"><div class="ps2-output-heading ps2-animate">${sectionLabel('05',L('deliverables_label','PROJECT OUTPUTS'))}<h2>${e(service.deliverables_heading||'Typical deliverables')}</h2><p>${e(L('deliverables_description','Examples of possible outputs. Exact deliverables are agreed separately for each project.'))}</p><a class="ps2-inline-link" href="#service-contact">${e(L('deliverables_contact_cta','Discuss your deliverables'))} ${icon}</a></div><ul class="ps2-output-list">${deliverables.map(x=>`<li class="ps2-animate"><span aria-hidden="true">✓</span>${e(x)}</li>`).join('')}</ul></div></section>`:'';
  const audience=audiences.length?`<section class="ps2-section ps2-audience" id="audiences"><div class="container ps2-audience-grid"><div class="ps2-animate">${sectionLabel('06',L('audience_label','WHO THIS IS FOR'))}<h2>${e(service.audiences_heading||'Who we work with')}</h2><p>${e(L('audience_description','Support for organisations and professionals with different technical, commercial and project needs.'))}</p><div class="ps2-audience-visual">${image(serviceImageSource(service,'resource_image'),'Pharmaceutical and life sciences solutions')||visualFallback(service.audiences_heading||'Who we support')}</div></div><div class="ps2-audience-list">${audiences.map((x,i)=>`<div class="ps2-audience-item ps2-animate"><span>${String(i+1).padStart(2,'0')}</span><p>${e(x)}</p></div>`).join('')}</div></div></section>`:'';
  const why=advantages.length?`<section class="ps2-section ps2-why" id="why-us"><div class="container"><div class="ps2-section-header ps2-animate">${sectionLabel('07',L('advantages_label','THE ASSURINTELLEC ADVANTAGE'))}<h2>${e(service.advantages_heading||'Why work with AssurIntellec™')}</h2></div><div class="ps2-value-grid">${advantages.map((x,i)=>`<article class="ps2-value ps2-animate"><div class="ps2-value-icon">${String(i+1).padStart(2,'0')}</div><h3>${e(x.title)}</h3>${paras(x.description)}</article>`).join('')}</div></div></section>`:'';
  const more=extras.filter(x=>text(x.description)).length?`<section class="ps2-section ps2-resources"><div class="container"><div class="ps2-section-header ps2-animate">${sectionLabel('+',L('additional_label','ADDITIONAL DETAILS'))}<h2>${e(L('additional_heading','Further project considerations'))}</h2><p>${e(L('additional_description','More information about the scope and boundaries of available support.'))}</p></div><div class="ps2-extra-list">${extras.filter(x=>text(x.description)).map((x,i)=>`<details class="ps2-extra"><summary><span>${e(x.title)}</span><b aria-hidden="true">+</b></summary><div>${serviceImageSource(x,'image')?`<figure class="ps2-extra-photo">${image(serviceImageSource(x,'image'),x.title)||visualFallback(x.title)}</figure>`:''}${paras(x.description)}</div></details>`).join('')}</div></div></section>`:'';
  const contact=`<section class="ps2-section ps2-contact" id="service-contact"><div class="container ps2-contact-frame"><div class="ps2-contact-content ps2-animate"><div class="ps2-contact-overline">${e(L('contact_label','NEXT STEP / START A CONVERSATION'))}</div><h2>${e(service.contact_heading||'Let’s discuss your project')}</h2><p>${e(service.contact_description||'Tell us about your requirements and project goals.')}</p><div class="ps2-contact-mail"><span>${e(L('contact_email_label','DEDICATED SERVICE EMAIL'))}</span><a href="${e(mailHref)}">${e(mail)} ${icon}</a></div></div><div class="ps2-contact-links ps2-animate"><a class="ps2-btn ps2-btn-primary" href="${e(mailHref)}">${e(L('contact_email_cta','Email the service team'))} ${icon}</a><a class="ps2-btn ps2-btn-outline" href="${e(url(service.cta_url))}">${e(L('contact_form_cta','Open enquiry form'))} ${icon}</a><a class="ps2-btn ps2-btn-outline" href="./services.html">${e(L('contact_all_cta','View all seven services'))} ${icon}</a><div class="ps2-contact-brand">${e(service.micro_tagline||'Intelligent Solutions. Assured Compliance.')}</div></div></div>${text(service.service_note)?`<div class="container ps2-legal"><details><summary>${e(L('service_note_label','Important service information'))} <span aria-hidden="true">+</span></summary><div>${paras(service.service_note)}</div></details></div>`:''}</section>`;
  const relatedSection=related.length?`<section class="ps2-related"><div class="container"><div class="ps2-related-title"><h2>${e(service.related_heading||'Explore related services')}</h2><a href="./services.html">${e(L('related_all_label','All services'))} ${icon}</a></div><div class="ps2-related-grid">${related.map(s=>`<a href="./${e(s.page_file||'services.html')}"><span>${e(L('related_card_label','ASSURINTELLEC / SERVICE'))}</span><h3>${e(s.page_title||s.title)}</h3><span class="ps2-related-arrow">↗</span></a>`).join('')}</div></div></section>`:'';
  // Keep the HTML-first opening video mounted continuously. Previously the
  // main.innerHTML assignment destroyed it after JSON loaded, causing a restart,
  // lost playback, and an HTML-edited URL being overwritten unpredictably.
  const existingHero = main.querySelector(':scope > .ps2-initial-hero');
  if (existingHero) {
    syncOpeningServiceVideo(existingHero, heroVideo, licensedHeroPhoto, 'Opening service video: ' + (service.page_title || service.title || 'Service'));
    const template = document.createElement('template');
    template.innerHTML = header;
    const updatedPanel = template.content.querySelector('.ps2-hero-panel');
    const oldPanel = existingHero.querySelector('.ps2-hero-panel');
    if (updatedPanel && oldPanel) oldPanel.replaceWith(updatedPanel);
    // Discard only content AFTER the opening hero; never remove the video node.
    while (existingHero.nextSibling) existingHero.nextSibling.remove();
    main.insertAdjacentHTML('beforeend', navigation+overview+capabilities+specialisms+process+outputs+audience+why+more+contact+relatedSection);
  } else {
    main.innerHTML=header+navigation+overview+capabilities+specialisms+process+outputs+audience+why+more+contact+relatedSection;
  }
  setupServiceVideoPlayers(main);
  main.style.setProperty('--ps2-body-size',Math.min(26,Math.max(16,Number(service.body_font_size)||19))+'px');
  main.style.setProperty('--ps2-heading-size',Math.min(46,Math.max(22,Number(service.heading_font_size)||32))+'px');
  main.style.setProperty('--ps2-body-color',/^#[0-9a-f]{3,8}$/i.test(service.text_color||'')?service.text_color:'#24344a');
  const reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealTargets=main.querySelectorAll('.ps2-animate');
  if(service.animation_enabled===false||reduced||!('IntersectionObserver' in window))revealTargets.forEach(x=>x.classList.add('ps2-shown'));
  else{const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('ps2-shown');observer.unobserve(entry.target)}}),{threshold:.06,rootMargin:'0px 0px -14px 0px'});revealTargets.forEach(x=>observer.observe(x));}
  const anchors=main.querySelectorAll('.ps2-anchor-track a');
  if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting)anchors.forEach(a=>a.classList.toggle('ps2-active',a.getAttribute('href')==='#'+entry.target.id));});},{rootMargin:'-22% 0px -65% 0px'});main.querySelectorAll('section[id]').forEach(x=>observer.observe(x));}
}

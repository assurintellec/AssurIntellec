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
  applyIndividualTextStyles(site);
}

function applyIndividualTextStyles(site) {
  const rules = Array.isArray(site.individual_text_styles) ? site.individual_text_styles : [];
  let style = document.getElementById('cmsIndividualTextStyles');
  if (!style) {
    style = document.createElement('style');
    style.id = 'cmsIndividualTextStyles';
    document.head.appendChild(style);
  }
  const safeSelector = value => {
    const selector = String(value || '').trim();
    if (!selector || selector.length > 240 || /[{};<>]/.test(selector)) return '';
    if (!/^[a-zA-Z0-9_#.>:\\[\]="'():,+*\s-]+$/.test(selector)) return '';
    return selector;
  };
  const validFamily = value => {
    const family = String(value || '').trim();
    if (!family || family.length > 80 || /[{};<>]/.test(family)) return '';
    return family;
  };
  const output = [];
  rules.forEach(rule => {
    if (!rule || rule.enabled === false) return;
    const selector = safeSelector(rule.selector);
    if (!selector) return;
    const declarations = [];
    const color = String(rule.color || '').trim();
    if (color && /^[#(),.%\w\s-]+$/.test(color) && !/[{};]/.test(color)) declarations.push(`color:${color} !important`);
    const size = Number(rule.font_size_px);
    if (Number.isFinite(size) && size >= 8 && size <= 120) declarations.push(`font-size:${size}px !important`);
    const family = validFamily(rule.font_family);
    if (family) declarations.push(`font-family:"${family.replace(/"/g, '')}",sans-serif !important`);
    if (/^(300|400|500|600|700|800|900)$/.test(String(rule.font_weight || ''))) declarations.push(`font-weight:${rule.font_weight} !important`);
    if (/^(normal|italic)$/.test(String(rule.font_style || ''))) declarations.push(`font-style:${rule.font_style} !important`);
    if (/^(left|center|right|justify)$/.test(String(rule.text_align || ''))) declarations.push(`text-align:${rule.text_align} !important`);
    const lineHeight = Number(rule.line_height);
    if (Number.isFinite(lineHeight) && lineHeight >= 0.8 && lineHeight <= 3) declarations.push(`line-height:${lineHeight} !important`);
    const letterSpacing = Number(rule.letter_spacing_px);
    if (rule.letter_spacing_px !== undefined && rule.letter_spacing_px !== null && rule.letter_spacing_px !== '' && Number.isFinite(letterSpacing) && letterSpacing >= -2 && letterSpacing <= 12) declarations.push(`letter-spacing:${letterSpacing}px !important`);
    if (declarations.length) output.push(`${selector}{${declarations.join(';')}}`);
  });
  style.textContent = output.join('\n');
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

function configureLogoMotion(root, logo, branding = {}) {
  const wrapper = root?.querySelector('.brand-logo-wrap');
  if (!wrapper) return;
  // This value is used only by CSS mask-image. Encode punctuation so CMS content cannot break the CSS declaration.
  const maskUrl = String(logo || '').trim().replace(/[\s"'()\\]/g, character => encodeURIComponent(character));
  if (maskUrl) wrapper.style.setProperty('--brand-logo-mask', `url("${maskUrl}")`);
  const sweepDuration = Math.max(4000, Math.min(15000, Number(branding.header_logo_sheen_interval_ms) || 6800));
  wrapper.style.setProperty('--brand-logo-sheen-duration', `${sweepDuration}ms`);
  wrapper.classList.toggle('brand-logo-entrance', branding.header_logo_animation !== false);
  wrapper.classList.toggle('brand-logo-shimmer', branding.header_logo_animation !== false && branding.header_logo_sheen !== false);
}

function renderHeader(site) {
  const n = site.navigation || {};
  const ui = site.ui || {};
  const visibility = site.section_visibility || {};
  const branding = site.branding || {};
  const logo = normalizeAsset(site.media_assets?.logo || '/images/uploads/logo_transparent_png_tm.png');
  const social = visibility.header_social === false ? '' : `<div class="social-top">${socialHtml(site,'header')}</div>`;
  const html = `<header><div class="container navbar">
    <a href="./index.html" class="brand" aria-label="${escapeHtml(site.company_name || 'AssurIntellec™')}">
      <span class="brand-logo-wrap">
        <img class="brand-logo" src="${escapeHtml(logo)}" alt="${escapeHtml(site.company_name || 'AssurIntellec™')}" onerror="this.closest('.brand-logo-wrap').style.display='none';this.closest('.brand')?.querySelector('.brand-fallback').style.display='block';">
      </span>
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
  const headerHolder = document.getElementById('site-header');
  headerHolder.innerHTML = html;
  configureLogoMotion(headerHolder, logo, branding);

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
  const counter = site.visitor_counter || {};
  const logo = normalizeAsset(
    site.media_assets?.logo ||
    '/images/uploads/logo_transparent_png_tm.png'
  );
  const counterPosition = ['footer-bottom', 'footer-contact', 'floating'].includes(counter.display_position)
    ? counter.display_position
    : 'footer-bottom';
  const counterMarkup = `<p class="visitor-stat${counterPosition === 'floating' ? ' visitor-stat-floating' : ''}"
    id="visitorStat" aria-live="polite" aria-atomic="true"
    data-counter-animation="${counter.counter_animation === false ? 'false' : 'true'}"
    data-counter-duration="${Math.max(0, Math.min(2000, Number(counter.animation_duration_ms) || 500))}"
    data-number-format="${escapeHtml(counter.number_format || 'thousands')}">
    ${escapeHtml(counter.label || 'Website Visitors')}: <strong id="visitorCount">—</strong>
  </p>`;
  const counterInContact = counterPosition === 'footer-contact' ? counterMarkup : '';
  const counterInBottom = counterPosition === 'footer-bottom' ? counterMarkup : '';
  const counterFloating = counterPosition === 'floating' ? counterMarkup : '';

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
            <img class="footer-logo" src="${escapeHtml(logo)}" alt="${escapeHtml(site.company_name || 'AssurIntellec™')}" loading="lazy" decoding="async">
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
            <h4 style="margin-top:20px">${escapeHtml(f.contact_title || 'Contact')}</h4>
            <div class="footer-contact">
              <span><strong>${escapeHtml(site.contact?.phone_label || 'Office No.')}</strong>
                <a href="tel:${escapeHtml(telephoneHref(site.contact?.phone))}">${escapeHtml(site.contact?.phone || '')}</a></span>
              <span><strong>${escapeHtml(site.contact?.mobile_phone_label || 'Mobile No.')}</strong>
                <a href="tel:${escapeHtml(telephoneHref(site.contact?.mobile_phone))}">${escapeHtml(site.contact?.mobile_phone || '')}</a></span>
              <span><strong>${escapeHtml(site.contact?.email_label || 'Email')}</strong>
                <a href="mailto:${escapeHtml(site.contact?.email || '')}">${escapeHtml(site.contact?.email || '')}</a></span>
              <span><strong>${escapeHtml(site.contact?.website_label || 'Website')}</strong>
                <a href="${escapeHtml(site.contact?.website || '#')}" target="_blank" rel="noopener">${escapeHtml(site.contact?.website_display || site.contact?.website || '')}</a></span>
              <span><strong>${escapeHtml(site.contact?.whatsapp_label || 'WhatsApp')}</strong>
                <a href="${escapeHtml(site.contact?.whatsapp || '#')}" target="_blank" rel="noopener">${escapeHtml(site.contact?.mobile_phone || site.contact?.phone || 'Open WhatsApp')}</a></span>
            </div>
            ${counterInContact}
          </div>
        </div>

        <div class="footer-bottom">
          <p>© ${new Date().getFullYear()} ${escapeHtml(site.company_name || 'AssurIntellec™')}. ${escapeHtml(f.copyright || '')}</p>
          <div class="footer-bottom-right">
            ${counterInBottom}
            <p>${escapeHtml(site.tagline || '')}</p>
          </div>
        </div>
      </div>
    </footer>
    ${counterFloating}
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

  // Keep the visible brand image, Open Graph image, and Organization schema logo
  // synchronized when the administrator replaces the Logo through Decap CMS.
  const logo = String(site.media_assets?.logo || site.seo?.logo_url || site.media_assets?.schema_logo || `${canonicalBase || window.location.origin}/images/uploads/logo_transparent_png_tm.png`).replace(/^\.\//, '');
  const absoluteLogo = /^https?:\/\//i.test(logo) ? logo : `${canonicalBase || window.location.origin}/${logo.replace(/^\//, '')}`;
  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage) ogImage.content = absoluteLogo;

  const schema = document.getElementById('organizationSchema');
  if (schema) {
    try {
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
          streetAddress: '88 to 92, Gate No. 3, Siddhivinayak Industrial Estate, Opp. Opera Palace, Laskana - Kholvad Road',
          addressLocality: 'Kholvad',
          addressRegion: 'Gujarat',
          postalCode: '394190',
          addressCountry: 'IN'
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
  return Array.isArray(data?.services) ? data.services : (Array.isArray(data) ? data : []);
}

function safeConfiguredLink(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  if (/^(javascript|data|vbscript):/i.test(text)) return '';
  if (/^(https?:\/\/|mailto:|tel:|\/|\.\/|\.\.\/|#)/i.test(text)) return text;
  return '';
}

function mediaClickAttributes(enabled, url, newTab, label = 'Open media') {
  const href = enabled === true ? safeConfiguredLink(url) : '';
  if (!href) return '';
  return `data-media-click-url="${escapeHtml(href)}" data-media-click-target="${newTab === false ? '_self' : '_blank'}" tabindex="0" role="link" aria-label="${escapeHtml(label)}"`;
}

function renderMediaOpenLink(enabled, url, newTab, label = 'Open media link') {
  const href = enabled === true ? safeConfiguredLink(url) : '';
  if (!href) return '';
  const newTabAttrs = newTab === false ? '' : ' target="_blank" rel="noopener noreferrer"';
  return `<a class="media-open-link" href="${escapeHtml(href)}"${newTabAttrs} aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}"><i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i><span>Open link</span></a>`;
}

function setupMediaClickHandlers() {
  if (document.documentElement.dataset.mediaClicksBound === '1') return;
  document.documentElement.dataset.mediaClicksBound = '1';
  const open = element => {
    const href = safeConfiguredLink(element?.dataset?.mediaClickUrl);
    if (!href) return;
    if (element.dataset.mediaClickTarget === '_self') window.location.assign(href);
    else window.open(href, '_blank', 'noopener,noreferrer');
  };
  document.addEventListener('click', event => {
    const target = event.target.closest('[data-media-click-url]');
    if (!target || event.target.closest('audio, button, input, textarea, select, a') || event.target.closest('video[controls]')) return;
    event.preventDefault();
    event.stopPropagation();
    open(target);
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const target = event.target.closest('[data-media-click-url]');
    if (!target || event.target.closest('audio, button, input, textarea, select, a') || event.target.closest('video[controls]')) return;
    event.preventDefault();
    open(target);
  });
  // Homepage Why Us cards and other card-level click actions. Videos/links retain their own controls.
  document.addEventListener('click', event => {
    const target = event.target.closest('[data-card-click-url]');
    if (!target || event.target.closest('video, audio, button, input, textarea, select, a, [data-media-click-url]')) return;
    const href = safeConfiguredLink(target.dataset.cardClickUrl);
    if (!href) return;
    if (target.dataset.cardClickTarget === '_blank') window.open(href, '_blank', 'noopener,noreferrer');
    else window.location.assign(href);
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const target = event.target.closest('[data-card-click-url]');
    if (!target || event.target.closest('video, audio, button, input, textarea, select, a, [data-media-click-url]')) return;
    event.preventDefault();
    const href = safeConfiguredLink(target.dataset.cardClickUrl);
    if (!href) return;
    if (target.dataset.cardClickTarget === '_blank') window.open(href, '_blank', 'noopener,noreferrer');
    else window.location.assign(href);
  });
}

function renderWhyMedia(card, context = 'detail') {
  const type = String(card?.media_type || 'image').toLowerCase();
  const src = normalizeAsset(card?.image || '');
  const alt = card?.image_alt || card?.title || 'AssurIntellec visual';
  const key = `${context}-${card?.slug || 'why-item'}`;
  const clickAttrs = mediaClickAttributes(card?.media_click_enabled, card?.media_click_url, card?.media_open_new_tab, `Open ${card?.title || 'Why Us'} media`);
  const baseClass = `why-media why-media-${escapeHtml(context)}${clickAttrs ? ' media-clickable' : ''}`;
  let media = '';
  const isVideo = type === 'video' && String(card?.video || '').trim();
  if (isVideo) {
    const video = normalizeAsset(card.video);
    media = `<video class="why-feature-video" controls playsinline preload="metadata" ${src ? `poster="${escapeHtml(src)}"` : ''} aria-label="${escapeHtml(alt)}" title="${escapeHtml(card?.title || 'AssurIntellec video')}"><source src="${escapeHtml(video)}"></video>`;
  } else if (src) {
    media = `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async" onerror="this.onerror=null;this.style.display='none';this.parentElement.classList.add('media-load-error');">`;
  } else {
    media = `<div class="why-media-placeholder" role="img" aria-label="No image or video set"><i class="fas fa-image" aria-hidden="true"></i><span>Add an image or video in Decap CMS</span></div>`;
  }
  const openLink = isVideo ? renderMediaOpenLink(card?.media_click_enabled, card?.media_click_url, card?.media_open_new_tab, `Open ${card?.title || 'Why Us'} media link`) : '';
  return `<div class="${baseClass}" data-media-key="${escapeHtml(key)}" ${clickAttrs}>${media}${openLink}</div>`;
}

function renderWhySubsections(card) {
  return (Array.isArray(card?.subsections) ? card.subsections : []).map((section, index) => {
    const slug = String(card.slug || 'why-item');
    const bullets = Array.isArray(section.bullets) ? section.bullets : [];
    return `<section class="why-detail-section" data-text-style="why-detail-section-${escapeHtml(slug)}-${index + 1}">
      <h3 data-text-style="why-detail-subtitle-${escapeHtml(slug)}-${index + 1}">${escapeHtml(section.heading || '')}</h3>
      ${section.text ? `<p data-text-style="why-detail-text-${escapeHtml(slug)}-${index + 1}">${escapeHtml(section.text)}</p>` : ''}
      ${bullets.length ? `<ul class="detail-list">${bullets.map((bullet, bulletIndex) => `<li data-text-style="why-detail-bullet-${escapeHtml(slug)}-${index + 1}-${bulletIndex + 1}">${escapeHtml(bullet)}</li>`).join('')}</ul>` : ''}
    </section>`;
  }).join('');
}

function renderServiceCards(services) {
  const grid = document.getElementById('servicesGrid');
  if (!grid) return;
  const aria = SITE?.ui?.service_read_aria || 'Open service details';
  grid.innerHTML = services.map((service, index) => {
    const file = service.page_file || `service-${service.slug}.html`;
    const href = safeConfiguredLink(service.card_click_url) || `./${file}`;
    const target = service.card_click_new_tab === true ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a class="service-card" href="${escapeHtml(href)}"${target} aria-label="${escapeHtml(`${aria}: ${service.title || ''}`)}">
      <div class="service-title-content">
        <span class="service-number">${String(index + 1).padStart(2,'0')}.</span>
        <span class="service-icon">${iconHtml(service.icon)}</span>
        <h3 data-text-style="service-card-title-${escapeHtml(service.slug || index + 1)}">${escapeHtml(service.title)}</h3>
      </div>
      <span class="service-read" aria-hidden="true"><i class="fas fa-arrow-right"></i></span>
    </a>`;
  }).join('');
}

function renderWhyPreview(site) {
  const grid = document.getElementById('whyPreviewGrid');
  if (!grid) return;
  const cards = (site.why_us?.cards || []).filter(card => card && card.enabled !== false).slice(0, 4);
  grid.innerHTML = cards.map((card, index) => {
    const slug = String(card.slug || `why-point-${index + 1}`);
    const defaultUrl = `./why-us.html?item=${encodeURIComponent(slug)}`;
    const href = safeConfiguredLink(card.home_click_url) || defaultUrl;
    const target = card.home_click_new_tab === true ? '_blank' : '_self';
    return `<article class="why-card why-card-selectable" data-card-click-url="${escapeHtml(href)}" data-card-click-target="${target}" tabindex="0" role="link" aria-label="${escapeHtml(`Read more about ${card.title || 'Why Us'}`)}">
      ${renderWhyMedia(card, 'home')}
      <div class="why-card-body"><i class="fas ${escapeHtml(card.icon || 'fa-circle-nodes')}" aria-hidden="true"></i><h3 data-text-style="why-card-title-${escapeHtml(slug)}">${escapeHtml(card.title || '')}</h3><p data-text-style="why-card-summary-${escapeHtml(slug)}">${escapeHtml(card.text || '')}</p><a class="why-card-detail-link" href="${escapeHtml(href)}"${target === '_blank' ? ' target="_blank" rel="noopener noreferrer"' : ''}>Read full details <span aria-hidden="true">→</span></a></div>
    </article>`;
  }).join('');
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
  grid.innerHTML = items.filter(item => item && item.image).map((item, index) => {
    const src = normalizeAsset(item.image);
    const alt = item.alt || item.title || `Logo ${index + 1}`;
    const errorHandler = `this.closest('article')?.classList.add('logo-image-error')`;
    const clickAttrs = mediaClickAttributes(item.click_enabled, item.click_url, item.click_new_tab, `Open ${item.title || alt}`);
    return `<article class="logo-showcase-card ${escapeHtml(cardClass)}${clickAttrs ? ' media-clickable' : ''}" ${clickAttrs}>
      <img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async" onerror="${errorHandler}">
    </article>`;
  }).join('');

  if (options.carousel) {
    setupHorizontalCarousel(
      grid,
      document.getElementById(options.prevId),
      document.getElementById(options.nextId),
      `.${cardClass}`,
      options.visibleDesktop || 5
    );
  }
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
  setHref('testimonialsGoogleLink', cfg.google_link || '#');
  setText('testimonialsGoogleLinkLabel', cfg.google_link_label || 'Read all reviews on Google');

  const grid = document.getElementById('testimonialsGrid');
  if (!grid) return;

  const items = Array.isArray(cfg.items) ? cfg.items.slice(0, 3) : [];
  grid.innerHTML = items.map((item, index) => {
    const rating = Math.max(1, Math.min(5, Math.round(Number(item?.rating) || 5)));
    const name = String(item?.name || 'Customer Name');
    const company = String(item?.company || 'Company Name');
    const text = String(item?.text || '');
    const avatarSrc = item?.avatar ? normalizeAsset(item.avatar) : '';
    const initial = escapeHtml(name.trim().charAt(0).toUpperCase() || '?');
    const avatarClickAttrs = mediaClickAttributes(item.avatar_click_enabled, item.avatar_click_url, item.avatar_click_new_tab, `Open ${name} photo`);
    const avatar = avatarSrc
      ? `<img class="${avatarClickAttrs ? 'media-clickable' : ''}" src="${escapeHtml(avatarSrc)}" alt="${escapeHtml(name)}" loading="lazy" decoding="async" ${avatarClickAttrs} onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"><span class="testimonial-avatar-fallback" style="display:none">${initial}</span>`
      : `<span class="testimonial-avatar-fallback">${initial}</span>`;
    return `<article class="testimonial-card">
      <div class="testimonial-stars" aria-label="${rating} star rating">${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}</div>
      <p class="testimonial-text">“${escapeHtml(text)}”</p>
      <div class="testimonial-footer">
        <div class="testimonial-person">${avatar}<div><strong>${escapeHtml(name)}</strong><span>${escapeHtml(company)}</span></div></div>
        <span class="testimonial-quote-mark" aria-hidden="true">“</span>
      </div>
    </article>`;
  }).join('');

  if (!items.length) {
    grid.innerHTML = '<div class="testimonial-empty">Add three testimonials in Decap CMS.</div>';
  }
}

function createVisitorToken() {
  try {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    if (window.crypto?.getRandomValues) {
      const bytes = new Uint8Array(16);
      window.crypto.getRandomValues(bytes);
      return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    }
  } catch (_) {}
  return `visit-${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

function formatVisitorCount(value, format) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 'Temporarily unavailable';
  return format === 'plain' ? String(Math.floor(n)) : Math.floor(n).toLocaleString('en-US');
}

function setVisitorCounterValue(stat, countEl, value, cfg) {
  if (!stat || !countEl) return;
  countEl.textContent = formatVisitorCount(value, cfg.number_format || stat.dataset.numberFormat || 'thousands');
  if (cfg.counter_animation !== false && stat.dataset.counterAnimation !== 'false' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    stat.style.setProperty('--counter-animation-duration', `${Math.max(0, Math.min(2000, Number(cfg.animation_duration_ms ?? stat.dataset.counterDuration) || 500))}ms`);
    stat.classList.remove('visitor-count-arrive');
    void stat.offsetWidth;
    stat.classList.add('visitor-count-arrive');
  }
}

function getVisitorToken(policy) {
  const storageKey = policy === 'daily_browser'
    ? 'assurintellec-visitor-browser-token'
    : 'assurintellec-visitor-session-token';
  const storage = policy === 'daily_browser' ? window.localStorage : window.sessionStorage;
  try {
    let token = storage.getItem(storageKey);
    if (!token || !/^[A-Za-z0-9-]{20,100}$/.test(token)) {
      token = createVisitorToken();
      storage.setItem(storageKey, token);
    }
    return token;
  } catch (_) {
    // Storage-blocked browsers are not counted, because minting a new ID on every
    // request would inflate the shared total on each refresh/navigation.
    return '';
  }
}

function getLegacyVisitorCount(site, stat, countEl, cfg) {
  const namespace = encodeURIComponent(String(cfg.namespace || 'assurintellec.in').trim());
  const action = encodeURIComponent(String(cfg.action || 'view').trim());
  const key = encodeURIComponent(String(cfg.key || 'website-visitors').trim());
  const url = `https://counterapi.com/api/${namespace}/${action}/${key}?unique=true&readOnly=true`;
  fetch(url, { cache: 'no-store', mode: 'cors' })
    .then(response => {
      if (!response.ok) throw new Error(`Legacy CounterAPI ${response.status}`);
      return response.json();
    })
    .then(data => {
      const value = Number(data?.value);
      if (!Number.isFinite(value) || value < 0) throw new Error('Legacy counter value is invalid');
      setVisitorCounterValue(stat, countEl, value, { ...cfg, counter_animation: false });
      stat.setAttribute('data-counter-state', 'legacy-read-only');
    })
    .catch(() => {
      countEl.textContent = 'Temporarily unavailable';
      stat.setAttribute('data-counter-state', 'unavailable');
    });
}

function initVisitorCounter(site) {
  const stat = document.getElementById('visitorStat');
  const countEl = document.getElementById('visitorCount');
  if (!stat || !countEl) return;

  const cfg = site.visitor_counter || {};
  if (cfg.enabled === false) {
    stat.hidden = true;
    return;
  }
  stat.hidden = false;

  const policy = cfg.counting_policy === 'daily_browser' ? 'daily_browser' : 'session';
  const visitorToken = getVisitorToken(policy);
  if (!visitorToken) {
    // Never mint a fresh token on every refresh when browser storage is blocked.
    // A read-only legacy display is still preferable to a false zero when available.
    stat.setAttribute('data-counter-state', 'storage-blocked');
    getLegacyVisitorCount(site, stat, countEl, cfg);
    return;
  }

  const endpoint = String(site.contact?.google_apps_script_url || '').trim();
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec(?:\?.*)?$/.test(endpoint)) {
    getLegacyVisitorCount(site, stat, countEl, cfg);
    return;
  }

  let completed = false;
  let timeoutId = 0;
  let script = null;
  const cleanup = () => {
    if (timeoutId) window.clearTimeout(timeoutId);
    if (script) script.remove();
    try { delete window.__assurIntellecVisitorCounterCallback; } catch (_) {}
  };
  const complete = data => {
    if (completed) return;
    completed = true;
    cleanup();
    if (data?.success === true && Number.isFinite(Number(data.count))) {
      setVisitorCounterValue(stat, countEl, data.count, { ...cfg, ...data });
      stat.setAttribute('data-counter-state', data.source || 'persistent');
      return;
    }
    getLegacyVisitorCount(site, stat, countEl, cfg);
  };

  window.__assurIntellecVisitorCounterCallback = complete;
  const request = new URL(endpoint);
  request.searchParams.set('action', 'visitor-counter');
  request.searchParams.set('session_id', visitorToken);
  request.searchParams.set('counting_policy', policy);
  request.searchParams.set('callback', '__assurIntellecVisitorCounterCallback');
  request.searchParams.set('_cb', String(Date.now()));

  script = document.createElement('script');
  script.async = true;
  script.src = request.toString();
  script.onerror = () => complete({ success: false });
  timeoutId = window.setTimeout(() => complete({ success: false }), 12000);
  document.head.appendChild(script);
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
  const heroSection = document.querySelector('.hero');
  if (heroSection) {
    const heroClick = mediaClickAttributes(h.poster_click_enabled, h.poster_click_url, h.poster_click_new_tab, 'Open hero visual');
    if (heroClick) {
      const holder = document.createElement('span'); holder.innerHTML = `<span ${heroClick}></span>`;
      const attrs = holder.firstElementChild;
      ['data-media-click-url','data-media-click-target','tabindex','role','aria-label'].forEach(name => {
        if (attrs.hasAttribute(name)) heroSection.setAttribute(name, attrs.getAttribute(name));
      });
      heroSection.classList.add('media-clickable');
    } else {
      ['data-media-click-url','data-media-click-target','tabindex','role'].forEach(name => heroSection.removeAttribute(name));
      heroSection.classList.remove('media-clickable');
    }
  }

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

function configuredInstagramReels(site) {
  return (Array.isArray(site.instagram_reels) ? site.instagram_reels : []).filter(item => {
    if (!item || item.enabled === false) return false;
    const hasLocalVideo = String(item.video || '').trim().length > 0;
    const hasInstagramUrl = Boolean(item.url && instagramId(item.url));
    return hasLocalVideo || hasInstagramUrl;
  }).slice(0, 5);
}

function instagramPlaceholder(message, href = '') {
  const safeHref = /^https:\/\/www\.instagram\.com\//i.test(href) ? href : '';
  return `<div class="instagram-placeholder" role="status">
    <i class="fab fa-instagram" aria-hidden="true"></i>
    <strong>Instagram Reel</strong>
    <span>${escapeHtml(message)}${safeHref ? ` <a href="${escapeHtml(safeHref)}" target="_blank" rel="noopener">Open on Instagram</a>` : ''}</span>
  </div>`;
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

  const list = configuredInstagramReels(site);
  if (!list.length) {
    holder.innerHTML = instagramPlaceholder(section.empty_message || 'Add a local authorized MP4 video or public Instagram Reel URL in Decap CMS.');
    if (prev) prev.disabled = true;
    if (next) next.disabled = true;
    return;
  }

  instagramIndex = Math.max(0, Math.min(instagramIndex, list.length - 1));
  const item = list[instagramIndex];
  const localVideo = String(item.video || '').trim();
  const remoteId = instagramId(item.url);

  if (prev) {
    prev.style.display = 'inline-flex';
    prev.disabled = list.length < 2;
    prev.setAttribute('aria-label', section.prev_label || 'Previous Instagram Reel');
    prev.title = section.prev_label || 'Previous Instagram Reel';
  }
  if (next) {
    next.style.display = 'inline-flex';
    next.disabled = list.length < 2;
    next.setAttribute('aria-label', section.next_label || 'Next Instagram Reel');
    next.title = section.next_label || 'Next Instagram Reel';
  }

  if (localVideo) {
    const src = normalizeAsset(localVideo);
    const poster = item.poster ? normalizeAsset(item.poster) : '';
    holder.dataset.embedUrl = '';
    holder.dataset.videoSource = src;
    holder.innerHTML = `<video class="instagram-local-video" src="${escapeHtml(src)}" ${poster ? `poster="${escapeHtml(poster)}"` : ''}
      controls playsinline preload="metadata" aria-label="${escapeHtml(item.alt || item.title || 'AssurIntellec video')}"
      title="${escapeHtml(item.title || 'AssurIntellec video')}"></video>`;
    const video = holder.querySelector('video');
    if (video) {
      video.addEventListener('error', () => {
        if (holder.dataset.videoSource !== src) return;
        holder.innerHTML = instagramPlaceholder('This video could not be loaded. Check the uploaded MP4 or use the configured Instagram URL.', item.url || '');
      }, { once: true });
    }
    return;
  }

  // Cross-origin Instagram UI cannot be modified by this page. For a true video-only view, upload an authorized MP4 above.
  const permalink = `https://www.instagram.com/reel/${encodeURIComponent(remoteId)}/`;
  const embedUrl = `${permalink}embed/`;
  holder.dataset.embedUrl = embedUrl;
  holder.dataset.videoSource = '';
  holder.innerHTML = `<blockquote class="instagram-media" data-instgrm-permalink="${escapeHtml(permalink)}"
    data-instgrm-version="14" style="background:#fff;border:0;border-radius:0;box-shadow:none;margin:0;padding:0;width:100%;"></blockquote>`;

  ensureInstagramEmbedScript()
    .then(() => {
      if (holder.dataset.embedUrl !== embedUrl) return;
      try { window.instgrm?.Embeds?.process(); } catch (_) {}
      window.setTimeout(() => {
        if (holder.dataset.embedUrl === embedUrl && !holder.querySelector('iframe')) {
          holder.innerHTML = instagramPlaceholder('Instagram did not render the Reel here. Upload an authorized MP4 for reliable video-only playback.', permalink);
        }
      }, 8000);
    })
    .catch(() => {
      if (holder.dataset.embedUrl === embedUrl) {
        holder.innerHTML = instagramPlaceholder('Unable to load the Instagram embed. Upload an authorized MP4 or open the Reel on Instagram.', permalink);
      }
    });
}

function bindInstagramButtons() {
  const prev = document.getElementById('instagramPrev');
  const next = document.getElementById('instagramNext');
  if (prev && !prev.dataset.bound) {
    prev.dataset.bound = '1';
    prev.addEventListener('click', () => {
      const list = configuredInstagramReels(SITE);
      if (list.length < 2) return;
      instagramIndex = (instagramIndex - 1 + list.length) % list.length;
      renderInstagram(SITE);
    });
  }
  if (next && !next.dataset.bound) {
    next.dataset.bound = '1';
    next.addEventListener('click', () => {
      const list = configuredInstagramReels(SITE);
      if (list.length < 2) return;
      instagramIndex = (instagramIndex + 1) % list.length;
      renderInstagram(SITE);
    });
  }
}
let expertModalPreviousFocus = null;
let expertModalPreviousOverflow = '';
let expertModalBound = false;

function expertValueBlock(label, value) {
  if (!value || (Array.isArray(value) && !value.length)) return '';
  const content = Array.isArray(value)
    ? `<ul>${value.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
    : `<p>${escapeHtml(value)}</p>`;
  return `<section class="expert-detail-block"><h3>${escapeHtml(label)}</h3>${content}</section>`;
}

function closeExpertProfile() {
  const overlay = document.getElementById('expertModalOverlay');
  if (!overlay || overlay.hidden) return;
  overlay.classList.remove('is-open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('expert-modal-open');
  document.body.style.overflow = expertModalPreviousOverflow;
  window.setTimeout(() => {
    if (!overlay.classList.contains('is-open')) overlay.hidden = true;
  }, 240);
  if (expertModalPreviousFocus && typeof expertModalPreviousFocus.focus === 'function') {
    try { expertModalPreviousFocus.focus(); } catch (_) {}
  }
  expertModalPreviousFocus = null;
}

function openExpertProfile(profile, config, opener) {
  const overlay = document.getElementById('expertModalOverlay');
  const modal = document.getElementById('expertModal');
  const content = document.getElementById('expertModalContent');
  const close = document.getElementById('expertModalClose');
  if (!overlay || !modal || !content) return;

  const image = profile.image ? normalizeAsset(profile.image) : './images/uploads/expert-profile-placeholder.svg';
  const shortIntro = String(profile.short_intro || '').trim();
  const body = [
    expertValueBlock(config.biography_label || 'Biography', profile.biography),
    expertValueBlock(config.experience_label || 'Professional Experience', profile.experience),
    expertValueBlock(config.qualifications_label || 'Qualifications & Education', profile.qualifications),
    expertValueBlock(config.expertise_label || 'Areas of Expertise', profile.expertise),
    expertValueBlock(config.achievements_label || 'Achievements', profile.achievements),
    expertValueBlock(config.additional_label || 'Additional Information', profile.additional_information)
  ].join('');

  content.innerHTML = `<div class="expert-modal-profile-head">
    <img class="expert-modal-photo" src="${escapeHtml(image)}" alt="${escapeHtml(profile.image_alt || `Illustration for ${profile.name}`)}"
      onerror="this.onerror=null;this.src='./images/uploads/expert-profile-placeholder.svg';">
    <div class="expert-modal-profile-copy">
      <span class="eyebrow">${escapeHtml(config.modal_title || 'Expert Profile')}</span>
      <h2 id="expertModalTitle" class="expert-modal-name">${escapeHtml(profile.name || '')}</h2>
      ${profile.designation ? `<p class="expert-modal-designation">${escapeHtml(profile.designation)}</p>` : ''}
      ${shortIntro ? `<p class="expert-modal-intro">${escapeHtml(shortIntro)}</p>` : ''}
    </div>
  </div>
  <div class="expert-modal-details">${body || `<p class="expert-detail-empty">Additional biography, experience and qualifications have not been supplied yet.</p>`}</div>`;

  const closeLabel = config.close_button_label || 'Close expert profile';
  if (close) {
    close.setAttribute('aria-label', closeLabel);
    close.title = closeLabel;
  }
  expertModalPreviousFocus = opener || document.activeElement;
  expertModalPreviousOverflow = document.body.style.overflow;
  overlay.hidden = false;
  overlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('expert-modal-open');
  document.body.style.overflow = 'hidden';
  window.requestAnimationFrame(() => {
    overlay.classList.add('is-open');
    close?.focus();
  });
}

function bindExpertModal() {
  if (expertModalBound) return;
  const overlay = document.getElementById('expertModalOverlay');
  const modal = document.getElementById('expertModal');
  const close = document.getElementById('expertModalClose');
  if (!overlay || !modal || !close) return;
  expertModalBound = true;
  close.addEventListener('click', closeExpertProfile);
  overlay.addEventListener('click', event => {
    if (event.target === overlay) closeExpertProfile();
  });
  document.addEventListener('keydown', event => {
    if (overlay.hidden) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeExpertProfile();
      return;
    }
    if (event.key === 'Tab') {
      const focusable = Array.from(modal.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'))
        .filter(element => element.offsetParent !== null);
      if (!focusable.length) {
        event.preventDefault();
        modal.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    }
  });
}

function renderExpertTeam(site) {
  const section = document.getElementById('expertTeamSection');
  const grid = document.getElementById('expertTeamGrid');
  if (!section || !grid) return;
  const config = site.expert_team || {};
  if (config.enabled === false) {
    section.hidden = true;
    return;
  }
  section.hidden = false;
  setText('expertTeamEyebrow', config.eyebrow || 'OUR EXPERTS');
  setText('expertTeamTitle', config.title || 'Expert Team');
  setText('expertTeamSubtitle', config.subtitle || '');
  setText('expertTeamDescription', config.description || '');
  setText('expertTeamSerialLabel', config.serial_column_label || 'SR. NO.');
  setText('expertTeamDetailsLabel', config.details_column_label || 'NAME & DESIGNATION');
  const tableHead = document.getElementById('expertTeamTableHead');

  const profiles = (Array.isArray(config.profiles) ? config.profiles : [])
    .map((profile, index) => ({ profile, index }))
    .filter(({ profile }) => profile && profile.enabled === true && String(profile.name || '').trim())
    .sort((a, b) => {
      const orderA = Number(a.profile.order);
      const orderB = Number(b.profile.order);
      const aValid = Number.isFinite(orderA) && orderA > 0;
      const bValid = Number.isFinite(orderB) && orderB > 0;
      if (aValid && bValid && orderA !== orderB) return orderA - orderB;
      if (aValid !== bValid) return aValid ? -1 : 1;
      return a.index - b.index;
    })
    .map(({ profile }) => profile);

  if (!profiles.length) {
    if (tableHead) tableHead.hidden = true;
    grid.innerHTML = `<p class="expert-team-empty">${escapeHtml(config.empty_state || 'Expert profiles will appear here when enabled and completed in Decap CMS.')}</p>`;
    return;
  }
  if (tableHead) tableHead.hidden = false;

  grid.innerHTML = profiles.map((profile, index) => {
    const image = profile.image ? normalizeAsset(profile.image) : './images/uploads/expert-profile-placeholder.svg';
    const designation = String(profile.designation || '').trim();
    const intro = String(profile.short_intro || '').trim();
    const actionLabel = String(profile.button_label || config.card_details_label || 'View Profile').trim();
    return `<button type="button" class="expert-card" data-expert-index="${index}"
      aria-label="${escapeHtml(`${actionLabel}: ${profile.name}`)}">
      <span class="expert-card-order">${String(Number(profile.order) || index + 1).padStart(2, '0')}</span>
      <img class="expert-card-photo" src="${escapeHtml(image)}" alt="${escapeHtml(profile.image_alt || `Illustration for ${profile.name}`)}"
        loading="lazy" decoding="async" onerror="this.onerror=null;this.src='./images/uploads/expert-profile-placeholder.svg';">
      <span class="expert-card-body">
        <strong class="expert-card-name">${escapeHtml(profile.name)}</strong>
        ${designation ? `<span class="expert-card-designation">${escapeHtml(designation)}</span>` : ''}
        ${intro ? `<span class="expert-card-intro">${escapeHtml(intro)}</span>` : ''}
        <span class="expert-card-action">${escapeHtml(actionLabel)} <span aria-hidden="true">↗</span></span>
      </span>
    </button>`;
  }).join('');

  grid.querySelectorAll('[data-expert-index]').forEach(button => {
    button.addEventListener('click', () => {
      const profile = profiles[Number(button.dataset.expertIndex)];
      if (!profile) return;
      const profileUrl = safeConfiguredLink(profile.profile_click_url);
      if (profileUrl) {
        if (profile.profile_click_new_tab === true) window.open(profileUrl, '_blank', 'noopener,noreferrer');
        else window.location.assign(profileUrl);
        return;
      }
      openExpertProfile(profile, config, button);
    });
  });
  bindExpertModal();
}

function initBrandSplash(site) {
  const branding = site.branding || {};
  if (branding.splash_enabled === false) return;
  try {
    if (window.sessionStorage.getItem('assurintellec-splash-seen') === '1') return;
    window.sessionStorage.setItem('assurintellec-splash-seen', '1');
  } catch (_) {}

  const splash = document.createElement('div');
  splash.className = 'site-splash';
  splash.setAttribute('role', 'status');
  splash.setAttribute('aria-live', 'polite');
  splash.setAttribute('aria-label', 'Loading AssurIntellec');
  const logo = normalizeAsset(site.media_assets?.logo || '/images/uploads/logo_transparent_png_tm.png');
  const brandMotion = site.branding || {};
  splash.innerHTML = `<div class="site-splash-content"><span class="brand-logo-wrap splash-logo-wrap"><img class="brand-logo" src="${escapeHtml(logo)}" alt="${escapeHtml(site.company_name || 'AssurIntellec™')}" decoding="async"></span><span class="site-splash-line" aria-hidden="true"></span></div>`;
  configureLogoMotion(splash, logo, brandMotion);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const displayMs = reduced ? 100 : Math.max(0, Math.min(2500, Number(branding.splash_display_ms) || 950));
  const fadeMs = reduced ? 0 : Math.max(0, Math.min(1200, Number(branding.splash_fade_ms) || 360));
  splash.style.setProperty('--splash-fade-duration', `${fadeMs}ms`);
  document.body.appendChild(splash);
  window.requestAnimationFrame(() => splash.classList.add('is-active'));

  let removed = false;
  const removeSplash = () => {
    if (removed) return;
    removed = true;
    splash.classList.add('is-leaving');
    window.setTimeout(() => splash.remove(), fadeMs + 100);
  };
  window.setTimeout(removeSplash, displayMs);
  // Hard fallback: even a later runtime error cannot leave the overlay stuck.
  window.setTimeout(removeSplash, displayMs + fadeMs + 700);
}

function initMotionSystem(site) {
  const config = site.motion || {};
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (config.enabled === false || reduced || !('IntersectionObserver' in window)) return;

  const duration = Math.max(150, Math.min(1400, Number(config.duration_ms) || 620));
  const stagger = Math.max(0, Math.min(250, Number(config.stagger_ms) || 65));
  document.documentElement.style.setProperty('--motion-duration', `${duration}ms`);
  document.documentElement.style.setProperty('--motion-distance', config.intensity === 'standard' ? '24px' : '15px');

  const candidates = document.querySelectorAll([
    '.hero-content > *', '.page-hero .container > *', '.trust-item', '.section-heading', '.expert-team-heading',
    '.service-card', '.why-card', '.process-card', '.testimonial-card', '.logo-showcase-card',
    '.logo-showcase-toolbar', '.profile-card', '.about-profile-details > *', '.about-point',
    '.service-detail-top > *', '.service-detail-section', '.contact-grid > *', '.contact-form',
    '.contact-info-card', '.cta-inner > *', '.expert-card', '.footer-grid > *', '.footer-bottom > *'
  ].join(','));
  if (!candidates.length) return;
  candidates.forEach((element, index) => {
    element.classList.add('motion-reveal');
    element.style.setProperty('--motion-delay', `${Math.min((index % 5) * stagger, 300)}ms`);
  });
  document.documentElement.classList.add('motion-ready');
  try {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -28px 0px' });
    candidates.forEach(element => observer.observe(element));
  } catch (_) {
    document.documentElement.classList.remove('motion-ready');
    candidates.forEach(element => element.classList.remove('motion-reveal'));
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
  if (photo) {
    const clickAttrs = mediaClickAttributes(about.profile_photo_click_enabled, about.profile_photo_click_url, about.profile_photo_click_new_tab, `Open ${about.profile_name || 'founder'} photo`);
    photo.classList.toggle('media-clickable', Boolean(clickAttrs));
    if (clickAttrs) {
      const wrapper = document.createElement('div'); wrapper.innerHTML = `<span ${clickAttrs}></span>`;
      const attrs = wrapper.firstElementChild;
      ['data-media-click-url','data-media-click-target','tabindex','role','aria-label'].forEach(name => {
        if (attrs.hasAttribute(name)) photo.setAttribute(name, attrs.getAttribute(name));
      });
    } else {
      ['data-media-click-url','data-media-click-target','tabindex','role'].forEach(name => photo.removeAttribute(name));
    }
  }

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

  renderExpertTeam(site);
}

function renderWhy(site) {
  const why = site.why_us || {};
  setText('whyEyebrow', why.eyebrow);
  setText('whyPageTitle', why.page_title);
  setText('whyPageDescription', why.page_description);
  const grid = document.getElementById('whyGrid');
  const detail = document.getElementById('whyDetail');
  const cards = (why.cards || []).filter(card => card && card.enabled !== false);
  if (!grid || !detail) return;
  const params = new URLSearchParams(window.location.search);
  const requested = params.get('item') || '';
  const selected = cards.find(card => card.slug === requested) || cards[0];
  grid.innerHTML = cards.map(card => {
    const slug = String(card.slug || 'why-item');
    const selectedClass = selected && selected.slug === card.slug ? ' is-selected' : '';
    const href = `./why-us.html?item=${encodeURIComponent(slug)}`;
    return `<article class="why-card why-choice-card${selectedClass}" data-card-click-url="${escapeHtml(href)}" data-card-click-target="_self" tabindex="0" role="link" aria-label="Select ${escapeHtml(card.title || 'Why Us point')}">
      <div class="why-choice-number">${String(cards.indexOf(card) + 1).padStart(2, '0')}</div>
      <div class="why-card-body"><i class="fas ${escapeHtml(card.icon || 'fa-circle-nodes')}" aria-hidden="true"></i><h3 data-text-style="why-card-title-${escapeHtml(slug)}">${escapeHtml(card.title || '')}</h3><p data-text-style="why-card-summary-${escapeHtml(slug)}">${escapeHtml(card.text || '')}</p><a href="${escapeHtml(href)}" class="why-card-detail-link" aria-current="${selected && selected.slug === card.slug ? 'page' : 'false'}">${selected && selected.slug === card.slug ? 'Selected' : 'View this point'} <span aria-hidden="true">→</span></a></div>
    </article>`;
  }).join('');
  if (!selected) {
    detail.innerHTML = '<p>Add and enable a Why Us point in Decap CMS to display details here.</p>';
    return;
  }
  const slug = String(selected.slug || 'why-item');
  const detailMedia = renderWhyMedia(selected, 'detail');
  detail.innerHTML = `<article class="why-detail-panel">
    <div class="why-detail-heading"><span class="eyebrow">${escapeHtml(selected.title || '')}</span><h2 id="whyDetailTitle" data-text-style="why-detail-title-${escapeHtml(slug)}">${escapeHtml(selected.detail_title || selected.title || '')}</h2></div>
    ${detailMedia}
    <div class="why-detail-subsections">${renderWhySubsections(selected)}</div>
    <nav class="why-detail-navigation" aria-label="Select another Why Us point">
      ${cards.map(card => `<a href="./why-us.html?item=${encodeURIComponent(card.slug || '')}" class="${card.slug === selected.slug ? 'is-current' : ''}">${escapeHtml(card.title || '')}</a>`).join('')}
    </nav>
  </article>`;
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

  // A frame load by itself is not proof that a Sheet write or an email succeeded.
  // We only treat the Apps Script bridge's explicit result message as success.

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

function showEnquirySuccess(site, customerName = "", reference = "") {
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
  const referenceEl = document.getElementById('enquirySuccessReference');
  if (referenceEl) {
    if (reference) {
      referenceEl.textContent = `Enquiry Reference: ${reference}`;
      referenceEl.hidden = false;
    } else {
      referenceEl.textContent = '';
      referenceEl.hidden = true;
    }
  }
  window.__previousEnquiryFocus = document.activeElement;

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
  const previous = window.__previousEnquiryFocus;
  if (previous && typeof previous.focus === 'function') {
    try { previous.focus(); } catch (_) {}
  }
  window.__previousEnquiryFocus = null;
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
    if (!overlay.classList.contains('show')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      hideEnquirySuccess();
      return;
    }
    if (event.key === 'Tab') {
      const focusable = Array.from(card.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'))
        .filter(element => element.offsetParent !== null);
      if (!focusable.length) {
        event.preventDefault(); card.focus(); return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
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

  const finish = (ok, errorMessage, result = {}) => {
    if (sendButton) {
      sendButton.disabled = false;
      sendButton.textContent = originalButtonText;
    }

    if (ok) {
      // Keep all visitor-entered values so they can close the confirmation
      // and use "Send on WhatsApp" without retyping the enquiry.
      showEnquirySuccess(site, data.name, result?.reference || '');
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

  finish(false, 'The enquiry service is not configured. Please use the WhatsApp option or contact info@assurintellec.in directly.');
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

  const mediaHolder = document.getElementById('serviceFeatureMedia');
  if (mediaHolder) {
    const type = String(service.feature_media_type || 'image').toLowerCase();
    const image = normalizeAsset(service.image_1 || '');
    const alt = service.image_1_alt || service.title || 'Service feature visual';
    const clickAttrs = mediaClickAttributes(service.feature_media_click_enabled, service.feature_media_click_url, service.feature_media_open_new_tab, `Open ${service.title || 'service'} media`);
    let media = '';
    const isVideo = type === 'video' && String(service.feature_video || '').trim();
    if (isVideo) {
      const video = normalizeAsset(service.feature_video);
      media = `<video controls playsinline preload="metadata" ${image ? `poster="${escapeHtml(image)}"` : ''} aria-label="${escapeHtml(alt)}"><source src="${escapeHtml(video)}"></video>`;
    } else if (image) {
      media = `<img src="${escapeHtml(image)}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async" onerror="this.onerror=null;this.style.display='none';this.parentElement.classList.add('media-load-error');">`;
    } else {
      media = '<div class="service-media-placeholder"><i class="fas fa-image" aria-hidden="true"></i><span>Upload a service image or select a video in Decap CMS.</span></div>';
    }
    const caption = String(service.gallery_caption_1 || '').trim();
    const supporting = String(service.image_1_text || '').trim();
    mediaHolder.className = `service-feature-media${clickAttrs ? ' media-clickable' : ''}`;
    mediaHolder.setAttribute('aria-label', `${service.title || 'Service'} feature media`);
    if (clickAttrs) {
      const tmp = document.createElement('div'); tmp.innerHTML = `<div ${clickAttrs}></div>`;
      const attrs = tmp.firstElementChild;
      ['data-media-click-url','data-media-click-target','tabindex','role','aria-label'].forEach(name => {
        if (attrs.hasAttribute(name)) mediaHolder.setAttribute(name, attrs.getAttribute(name));
      });
    } else {
      ['data-media-click-url','data-media-click-target','tabindex','role'].forEach(name => mediaHolder.removeAttribute(name));
    }
    const openLink = isVideo ? renderMediaOpenLink(service.feature_media_click_enabled, service.feature_media_click_url, service.feature_media_open_new_tab, `Open ${service.title || 'service'} media link`) : '';
    mediaHolder.innerHTML = `${media}${openLink}${caption || supporting ? `<figcaption>${caption ? `<strong>${escapeHtml(caption)}</strong>` : ''}${supporting ? `<span>${escapeHtml(supporting)}</span>` : ''}</figcaption>` : ''}`;
    mediaHolder.classList.remove('media-load-error');
    mediaHolder.querySelector('video')?.addEventListener('error', () => mediaHolder.classList.add('media-load-error'), { once: true });
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
    approval_logos_home: 'approval-showcase-section',
    client_logos_home: 'client-showcase-section',
    testimonials_home: 'testimonials-section',
    about_reel_home: 'about-reel-section',
    services_preview_home: 'home-services-preview',
    why_preview_home: 'home-why-preview',
    why_page_content: 'why-page-content-section',
    home_cta: 'home-cta'
  };
  Object.entries(map).forEach(([key, className]) => {
    const el = document.querySelector(`.${className}`);
    if (el) el.style.display = v[key] === false ? 'none' : '';
  });
}

async function init() {
  setupMediaClickHandlers();
  SITE = await readJson('./content/site.json', FALLBACK_SITE);
  SERVICES = normalizeServices(await readJson('./content/services.json', { services: FALLBACK_SERVICES }));
  initBrandSplash(SITE);
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
  if (page === 'contact') renderContact(SITE, SERVICES);
  if (page === 'service') renderServiceDetail(SITE);
  applyVisibility(SITE);
  initMotionSystem(SITE);
}

document.addEventListener('DOMContentLoaded', init);

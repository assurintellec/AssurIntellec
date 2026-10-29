/* Website search and a local service-information assistant. No API keys,
   external chat service, tracking, message submission or transcript storage. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AssurDiscovery = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  const defaults = {
    search_enabled: true,
    search_caption: 'Find your solution',
    search_label: 'Search website',
    search_placeholder: 'Search services, expertise or contact…',
    search_button_label: 'Search',
    search_empty: 'No matching pages found. Try a service name or contact us.',
    search_result_limit: 6,
    chatbot_enabled: true,
    chatbot_title: 'AssurIntellec™ Assistant',
    chatbot_subtitle: 'Website service guide',
    chatbot_launcher_label: 'Chat with AssurIntellec',
    chatbot_welcome: 'Hello! I can help you explore our services, find information and contact the right team. What would you like to know?',
    chatbot_placeholder: 'Ask about services or your requirement…',
    chatbot_send_label: 'Send',
    chatbot_close_label: 'Close chat',
    chatbot_reset_label: 'New chat',
    chatbot_enquiry_label: 'Send an enquiry',
    chatbot_topics_label: 'Popular questions',
    chatbot_footer_note: 'Use the enquiry form to send your requirement to our team.',
    chatbot_not_found: 'I couldn’t find an answer in the website information. Please use the enquiry form so the team can assist with your requirement.',
    chatbot_pricing_answer: 'Prices are not listed in the website information. Please send your project requirements through the enquiry form to request a quotation.',
    chatbot_hours_answer: 'Working hours are not listed in the website information. Please contact the team to confirm availability.',
    chatbot_quick_questions: [
      { question: 'What services do you offer?' },
      { question: 'Help with cleanroom and HVAC planning' },
      { question: 'How can I contact you?' },
      { question: 'I need a quotation' }
    ],
    chatbot_faqs: []
  };
  const stopWords = new Set('a an and are as at be by can could do does for from have how i in is it me my of on or our please that the their this to us want we what which who with would you your need help tell about give offer provide looking find know get'.split(' '));
  const groups = [
    ['recruitment', 'recruit', 'hiring', 'hire', 'jobs', 'job', 'vacancy', 'vacancies', 'career', 'talent'],
    ['hvac', 'cleanroom', 'cleanrooms', 'ventilation', 'airflow'],
    ['validation', 'validate', 'qualification', 'qualify'],
    ['api', 'apis', 'ingredient', 'ingredients', 'excipients', 'raw materials'],
    ['laboratory', 'lab', 'instrument', 'instruments', 'hplc', 'chromatography'],
    ['acquisition', 'acquire', 'buy', 'buying', 'divestment', 'sell', 'selling', 'transaction'],
    ['formulation', 'formulations', 'formulate', 'research'],
    ['manufacturing', 'manufacture', 'manufacturer', 'production'],
    ['contact', 'email', 'phone', 'telephone', 'call', 'whatsapp'],
    ['gmp', 'good manufacturing practice'],
    ['csv', 'computerized system validation', 'computerised system validation']
  ];
  const text = value => String(value ?? '').replace(/\s+/g, ' ').trim();
  const normal = value => text(value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const tokens = value => [...new Set(normal(value).split(' ').filter(word => word.length > 1 && !stopWords.has(word)))];
  const list = value => Array.isArray(value) ? value.filter(Boolean) : [];
  const shorten = (value, max = 220) => {
    const clean = text(value);
    if (clean.length <= max) return clean;
    const cut = clean.slice(0, max);
    return cut.slice(0, Math.max(cut.lastIndexOf(' '), max - 35)).replace(/[ ,;:]+$/, '') + '…';
  };
  function publicLink(value) {
    const raw = text(value);
    if (/^(?:https?:\/\/|mailto:|tel:)/i.test(raw)) return raw;
    if (/^(?:\.\/)?[a-z0-9][a-z0-9/_-]*\.html(?:[?#][a-z0-9_.=&%+-]*)?$/i.test(raw)) return raw.startsWith('./') ? raw : './' + raw;
    return '';
  }
  function publicText(value) {
    if (typeof value === 'string') return text(value);
    if (Array.isArray(value)) return value.map(publicText).filter(Boolean).join(' ');
    if (!value || typeof value !== 'object' || value.enabled === false) return '';
    const keys = ['title', 'name', 'heading', 'text', 'description', 'short_label', 'overview', 'intro', 'scope', 'outcome', 'note', 'bullets', 'point', 'role', 'position', 'details'];
    return keys.map(key => publicText(value[key])).filter(Boolean).join(' ');
  }
  function createEngine(site = {}, services = []) {
    const settings = { ...defaults, ...(site.site_tools || {}) };
    const records = list(services).filter(service => service.enabled !== false);
    const docs = [];
    function add(title, body, url, category, keywords = '') {
      if (!text(title) || !publicLink(url)) return;
      const entry = { title: text(title), body: text(body), url: publicLink(url), category, keywords: text(keywords) };
      entry.titleSearch = normal(entry.title);
      entry.bodySearch = normal(entry.body + ' ' + entry.keywords);
      docs.push(entry);
    }
    add(site.company_name || 'AssurIntellec™', [site.tagline, site.hero?.description].filter(Boolean).join(' '), './index.html', 'Company', 'home company pharmaceutical consulting');
    add(site.navigation?.services || 'Services', site.home?.services_preview?.description || records.map(s => s.title).join(' · '), './services.html', 'Services', 'all services solutions');
    add(site.about?.page_title || 'About Us', publicText(site.about?.main_paragraphs) + ' ' + text(site.about?.page_description) + ' ' + text(site.about?.closing), './about.html', 'Company', 'company founder about');
    if (site.about?.profile_name) add(site.about.profile_name, site.about.profile_position, './about.html', 'Expert', 'founder proprietor leadership');
    for (const expert of list(site.about?.experts).filter(x => x.enabled !== false)) {
      add(expert.name || expert.title, publicText(expert), './about.html#expertTeamSection', 'Expert', 'expert consultant experience specialist');
    }
    add(site.why_us?.page_title || 'Why Us', site.why_us?.page_description, './why-us.html', 'Company', 'approach why choose');
    for (const card of list(site.why_us?.cards).filter(x => x.enabled !== false)) {
      add(card.title, publicText(card), './why-us.html', 'Company');
    }
    const contact = site.contact || {};
    if (site.newsletter?.enabled !== false) {
      add(site.newsletter?.title || 'Newsletter & service updates', site.newsletter?.description || 'Choose your service interest and subscribe to AssurIntellec updates by email.', './index.html#assurNewsletter', 'Newsletter', 'newsletter subscribe subscription mailing list service updates');
    }
    const address = contact.address_display || [contact.address_line_1, contact.address_line_2, contact.address_city, contact.address_region, contact.address_postal_code, contact.address_country].filter(Boolean).join(', ');
    add(contact.page_title || 'Contact Us', [contact.description, contact.email, contact.phone, contact.mobile_phone, address].filter(Boolean).join(' · '), './contact.html', 'Contact', 'contact email phone telephone call whatsapp address location office enquiry quote quotation pricing price cost');
    for (const service of records) {
      const page = publicLink(service.page_file || `service-${service.slug}.html`);
      if (!page) continue;
      const title = service.title || service.page_title;
      add(title, service.page_description || service.description || service.intro, page, 'Service', [service.intro, service.description, publicText(service.card_bullets)].filter(Boolean).join(' '));
      const sections = [['core_services', 'capabilities'], ['focus_areas', 'specialisms'], ['workflow', 'process'], ['advantages', 'why-us'], ['additional_information', 'service-contact']];
      for (const [key, anchor] of sections) {
        for (const entry of list(service[key]).filter(x => x.enabled !== false)) {
          const { title: entryTitle, heading, short_label, ...entryBody } = entry;
          add(entryTitle || heading || short_label, publicText(entryBody), `${page}#${anchor}`, title, title);
        }
      }
      if (list(service.deliverables).length) add(service.deliverables_heading || `${title} deliverables`, publicText(service.deliverables), `${page}#deliverables`, title);
    }
    function search(query, limit = settings.search_result_limit) {
      const words = tokens(String(query).slice(0, 500));
      if (!words.length) return [];
      const expanded = new Set();
      for (const group of groups) if (group.some(alias => words.includes(alias))) group.forEach(alias => expanded.add(alias));
      words.forEach(word => expanded.delete(word));
      return docs.map((doc, index) => {
        let score = 0;
        let matches = 0;
        for (const word of words) {
          if (doc.titleSearch.includes(word)) { score += 14; matches++; }
          else if (doc.bodySearch.includes(word)) { score += 4; matches++; }
        }
        for (const alias of expanded) {
          if (doc.titleSearch.includes(alias)) score += 2.5;
          else if (doc.bodySearch.includes(alias)) score += .4;
        }
        if (normal(query) && doc.titleSearch.includes(normal(query))) score += 28;
        else if (words.length > 1 && doc.bodySearch.includes(normal(query))) score += 20;
        if (matches) score *= .6 + matches / words.length;
        return { ...doc, score, index };
      }).filter(doc => doc.score > 0).sort((a, b) => b.score - a.score || a.index - b.index).slice(0, Math.min(10, Math.max(1, Number(limit) || 6)));
    }
    const enquiry = { label: settings.chatbot_enquiry_label, url: './contact.html#contactForm' };
    function reply(question) {
      const raw = text(question).slice(0, 500);
      const q = normal(raw);
      if (!q || /^(hi|hello|hey|namaste|good morning|good evening|good afternoon)$/.test(q)) return { text: settings.chatbot_welcome, links: [] };
      if (/\bunsubscribe\b|opt out|stop (?:updates|emails)/.test(q)) {
        return { text: 'Use the individual unsubscribe link provided with your newsletter, or contact the team to ask to be removed from the mailing list. This chat does not change your subscription status.', links: [{ label: contact.page_title || 'Contact Us', url: './contact.html' }] };
      }
      if (/\b(newsletter|subscribe|subscription|updates)\b|mailing list/.test(q) && site.newsletter?.enabled !== false) {
        return { text: 'Use the newsletter form to enter your email, choose the service updates you want, and agree to receive those updates. The form saves your selected interest when the subscription is confirmed.', links: [{ label: site.newsletter?.submit_label || 'Subscribe to updates', url: './index.html#assurNewsletter' }] };
      }
      for (const faq of list(settings.chatbot_faqs).filter(f => f.enabled !== false && text(f.answer))) {
        const keywords = text(faq.keywords).split(',').map(normal).filter(Boolean);
        const fq = normal(faq.question);
        const same = fq && fq === q;
        const keyMatch = keywords.some(key => q.includes(key));
        if (same || keyMatch) return { text: text(faq.answer), links: publicLink(faq.link_url) ? [{ label: text(faq.link_label) || text(faq.question), url: publicLink(faq.link_url) }] : [] };
      }
      if (/\b(price|prices|pricing|quote|quotation|cost|costs|fees|charges|budget|rates)\b/.test(q)) return { text: settings.chatbot_pricing_answer, links: [enquiry] };
      if (/\b(hours|timing|timings|availability|opening)\b|working days/.test(q)) return { text: settings.chatbot_hours_answer, links: [{ label: contact.page_title || 'Contact Us', url: './contact.html' }] };
      if (/\b(address|location|located|office|visit)\b|where are you|where is/.test(q)) return { text: address ? `${site.company_name || 'AssurIntellec™'}\n\n${address}` : settings.chatbot_not_found, links: [{ label: contact.location_title || 'Our location', url: './contact.html#contactLocation' }] };
      if (/\b(contact|email|phone|telephone|call|whatsapp|human|person|team)\b|talk (?:to|with)|speak (?:to|with)/.test(q)) {
        const lines = [contact.email ? `Email: ${contact.email}` : '', contact.phone ? `Phone: ${contact.phone}` : '', contact.mobile_phone ? `Mobile: ${contact.mobile_phone}` : ''].filter(Boolean);
        const links = [enquiry];
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email || '')) links.push({ label: contact.email, url: `mailto:${contact.email}` });
        if (publicLink(contact.whatsapp)) links.push({ label: contact.whatsapp_label || 'WhatsApp', url: publicLink(contact.whatsapp) });
        return { text: lines.join('\n') || settings.chatbot_not_found, links };
      }
      if (/\b(enquiry|enquire|inquiry|inquire|request|submit)\b/.test(q) && tokens(q).every(w => ['enquiry', 'enquire', 'inquiry', 'inquire', 'request', 'submit', 'requirement', 'requirements', 'send', 'form'].includes(w))) {
        return { text: settings.chatbot_footer_note, links: [enquiry] };
      }
      const words = tokens(q);
      if (!words.length || words.every(w => ['services', 'service', 'solutions', 'solution', 'pharma', 'pharmaceutical', 'consulting'].includes(w))) {
        return { text: records.map((s, i) => `${i + 1}. ${s.title || s.page_title}`).join('\n'), links: records.map(s => ({ label: s.title || s.page_title, url: publicLink(s.page_file || `service-${s.slug}.html`) })).filter(x => x.url) };
      }
      const matches = search(q, 3);
      if (matches.length && matches[0].score >= 5) {
        const top = matches[0];
        return { text: `${top.title}\n\n${shorten(top.body, 580)}`, links: [{ label: top.title, url: top.url }, enquiry] };
      }
      return { text: settings.chatbot_not_found, links: [enquiry] };
    }
    return { settings, docs, search, reply };
  }

  function icon(name) {
    const paths = {
      search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
      chat: '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.2 10.4 10.4 0 0 1-3.6-.6L3 21l1.7-5A7.5 7.5 0 0 1 3 11.5a9 9 0 0 1 18 0Z"/><path d="M8 11h.01M12 11h.01M16 11h.01" stroke-width="3"/>',
      close: '<path d="m6 6 12 12M6 18 18 6"/>',
      send: '<path d="m3 3 18 9-18 9 4-9-4-9Zm4 9h14"/>',
      reset: '<path d="M4 9a8 8 0 1 1 0 6M4 4v5h5"/>'
    };
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.chat}</svg>`;
  }
  function init(site, services) {
    if (typeof document === 'undefined') return;
    document.getElementById('assurDiscoveryRoot')?.remove();
    document.getElementById('assurSearchStrip')?.remove();
    const engine = createEngine(site, services);
    const cfg = engine.settings;
    // Service sections are inserted after JSON loads. Restore deep-link
    // navigation once those targets exist, allowing space for the header.
    if (window.location.hash) requestAnimationFrame(() => {
      let target;
      try { target = document.getElementById(decodeURIComponent(window.location.hash.slice(1))); } catch (_) {}
      if (!target) return;
      const height = document.querySelector('#site-header header')?.getBoundingClientRect().height || 0;
      window.scrollTo({ top: Math.max(0, window.scrollY + target.getBoundingClientRect().top - height - 18), behavior: 'auto' });
    });
    const node = (tag, cls, content) => {
      const el = document.createElement(tag);
      if (cls) el.className = cls;
      if (content !== undefined) el.textContent = content;
      return el;
    };
    const button = (cls, label, symbol) => {
      const el = node('button', cls);
      el.type = 'button';
      el.setAttribute('aria-label', label);
      el.title = label;
      if (symbol) el.innerHTML = icon(symbol);
      else el.textContent = label;
      return el;
    };
    const header = document.querySelector('#site-header header');
    header?.classList.toggle('has-discovery-search', cfg.search_enabled !== false);
    if (cfg.search_enabled !== false && header) {
      const strip = node('div', 'ai-search-strip ai-discovery-ui');
      strip.id = 'assurSearchStrip';
      const inner = node('div', 'container ai-search-row');
      inner.append(node('span', 'ai-search-caption', cfg.search_caption));
      const form = node('form', 'ai-search-form');
      form.setAttribute('role', 'search');
      form.setAttribute('aria-label', cfg.search_label);
      const label = node('label', 'ai-visually-hidden', cfg.search_label);
      label.htmlFor = 'assurSiteSearch';
      const input = node('input', 'ai-search-input');
      input.id = 'assurSiteSearch';
      input.type = 'search';
      input.placeholder = cfg.search_placeholder;
      input.maxLength = 200;
      input.autocomplete = 'off';
      input.setAttribute('role', 'combobox');
      input.setAttribute('aria-autocomplete', 'list');
      input.setAttribute('aria-expanded', 'false');
      input.setAttribute('aria-controls', 'assurSearchResults');
      const submit = button('ai-search-submit', cfg.search_button_label, 'search');
      submit.type = 'submit';
      const popup = node('div', 'ai-search-popup');
      popup.hidden = true;
      const status = node('p', 'ai-search-status');
      status.setAttribute('role', 'status');
      const results = node('ul', 'ai-search-results');
      results.id = 'assurSearchResults';
      results.setAttribute('role', 'listbox');
      results.setAttribute('aria-label', cfg.search_label);
      popup.append(status, results);
      form.append(label, input, submit, popup);
      inner.append(form);
      strip.append(inner);
      header.prepend(strip);
      let matches = [];
      let selected = -1;
      const close = () => { popup.hidden = true; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); };
      const select = index => {
        selected = index;
        Array.from(results.querySelectorAll('[role="option"]')).forEach((link, i) => {
          link.setAttribute('aria-selected', i === selected ? 'true' : 'false');
          if (i === selected) { input.setAttribute('aria-activedescendant', link.id); link.scrollIntoView({ block: 'nearest' }); }
        });
      };
      const update = () => {
        const query = input.value.trim();
        results.replaceChildren();
        selected = -1;
        input.removeAttribute('aria-activedescendant');
        if (!query) { matches = []; close(); return; }
        matches = engine.search(query);
        for (const [i, match] of matches.entries()) {
          const row = node('li', '');
          row.setAttribute('role', 'presentation');
          const link = node('a', 'ai-search-result');
          link.href = match.url;
          link.id = `assurSearchOption${i}`;
          link.setAttribute('role', 'option');
          link.setAttribute('aria-selected', 'false');
          link.append(node('span', 'ai-result-category', match.category), node('strong', '', match.title), node('span', 'ai-result-snippet', shorten(match.body, 145)));
          row.append(link);
          results.append(row);
        }
        status.textContent = matches.length ? `${matches.length} result${matches.length === 1 ? '' : 's'}` : cfg.search_empty;
        popup.hidden = false;
        input.setAttribute('aria-expanded', 'true');
      };
      input.addEventListener('input', update);
      input.addEventListener('focus', () => { if (input.value.trim()) update(); });
      input.addEventListener('keydown', event => {
        if (event.key === 'Escape') { close(); return; }
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault();
          if (popup.hidden) update();
          if (matches.length) select(selected < 0 ? (event.key === 'ArrowDown' ? 0 : matches.length - 1) : (selected + (event.key === 'ArrowDown' ? 1 : -1) + matches.length) % matches.length);
        }
      });
      form.addEventListener('submit', event => {
        event.preventDefault();
        if (popup.hidden) update();
        if (matches.length) window.location.assign(matches[Math.max(0, selected)].url);
      });
      document.addEventListener('click', event => { if (!form.contains(event.target)) close(); });
      document.addEventListener('keydown', event => {
        const target = event.target;
        if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !target.closest?.('input, textarea, select, [contenteditable="true"]')) {
          event.preventDefault(); input.focus();
        }
      });
    }
    if (cfg.chatbot_enabled === false) return;
    const root = node('div', 'ai-discovery-ui');
    root.id = 'assurDiscoveryRoot';
    const launcher = button('ai-chat-launcher', cfg.chatbot_launcher_label, 'chat');
    launcher.id = 'assurChatLauncher';
    launcher.setAttribute('aria-expanded', 'false');
    launcher.setAttribute('aria-controls', 'assurChatPanel');
    const panel = node('section', 'ai-chat-panel');
    panel.id = 'assurChatPanel';
    panel.hidden = true;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'false');
    panel.setAttribute('aria-labelledby', 'assurChatTitle');
    const heading = node('div', 'ai-chat-heading');
    const headingIcon = node('span', 'ai-chat-heading-icon');
    headingIcon.innerHTML = icon('chat');
    const titles = node('div', 'ai-chat-titles');
    const title = node('h2', '', cfg.chatbot_title);
    title.id = 'assurChatTitle';
    titles.append(title, node('p', '', cfg.chatbot_subtitle));
    const reset = button('ai-chat-icon-button', cfg.chatbot_reset_label, 'reset');
    const close = button('ai-chat-icon-button', cfg.chatbot_close_label, 'close');
    heading.append(headingIcon, titles, reset, close);
    const log = node('div', 'ai-chat-log');
    log.setAttribute('role', 'log');
    log.setAttribute('aria-live', 'polite');
    log.setAttribute('aria-relevant', 'additions');
    log.setAttribute('aria-label', cfg.chatbot_title);
    const footer = node('div', 'ai-chat-footer');
    const form = node('form', 'ai-chat-form');
    const input = node('textarea', 'ai-chat-input');
    input.rows = 1;
    input.maxLength = 500;
    input.placeholder = cfg.chatbot_placeholder;
    input.setAttribute('aria-label', cfg.chatbot_placeholder);
    const send = button('ai-chat-send', cfg.chatbot_send_label, 'send');
    send.type = 'submit';
    const enquiry = node('a', 'ai-chat-enquiry', cfg.chatbot_enquiry_label + ' ↗');
    enquiry.href = './contact.html#contactForm';
    form.append(input, send);
    footer.append(form, enquiry, node('p', 'ai-chat-note', cfg.chatbot_footer_note));
    panel.append(heading, log, footer);
    root.append(launcher, panel);
    if (document.querySelector('.whatsapp-float')) root.style.setProperty('--assistant-bottom', 'calc(var(--whatsapp-bottom, 22px) + var(--whatsapp-size, 58px) + 14px)');
    document.body.append(root);
    function message(content, user = false) {
      const bubble = node('div', user ? 'ai-chat-message ai-chat-user' : 'ai-chat-message ai-chat-bot');
      bubble.append(node('p', '', typeof content === 'string' ? content : content.text));
      if (!user && Array.isArray(content.links) && content.links.length) {
        const links = node('div', 'ai-chat-links');
        for (const item of content.links) {
          if (!publicLink(item.url)) continue;
          const link = node('a', '', item.label);
          link.href = publicLink(item.url);
          if (/^https?:/i.test(link.getAttribute('href'))) { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
          links.append(link);
        }
        bubble.append(links);
      }
      log.append(bubble);
      log.scrollTop = log.scrollHeight;
      // Bound memory during long sessions. Messages remain local to this page.
      while (log.children.length > 42) log.firstElementChild.remove();
    }
    function ask(question) {
      const value = text(question).slice(0, 500);
      if (!value) return;
      log.querySelector('.ai-chat-topics')?.remove();
      message(value, true);
      message(engine.reply(value));
      input.value = '';
      input.focus();
    }
    function welcome() {
      log.replaceChildren();
      message({ text: cfg.chatbot_welcome, links: [] });
      const questions = list(cfg.chatbot_quick_questions).slice(0, 6).map(q => typeof q === 'string' ? q : q.question).filter(Boolean);
      if (questions.length) {
        const topics = node('div', 'ai-chat-topics');
        topics.append(node('p', '', cfg.chatbot_topics_label));
        for (const question of questions) {
          const quick = button('ai-chat-topic', question);
          quick.addEventListener('click', () => ask(question));
          topics.append(quick);
        }
        log.append(topics);
      }
    }
    function setOpen(open) {
      panel.hidden = !open;
      launcher.setAttribute('aria-expanded', String(open));
      if (open) input.focus();
      else launcher.focus();
    }
    launcher.addEventListener('click', () => setOpen(panel.hidden));
    close.addEventListener('click', () => setOpen(false));
    reset.addEventListener('click', () => { welcome(); input.focus(); });
    panel.addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); setOpen(false); } });
    form.addEventListener('submit', event => { event.preventDefault(); ask(input.value); });
    input.addEventListener('keydown', event => {
      if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); ask(input.value); }
    });
    welcome();
    return engine;
  }
  return { createEngine, init, publicLink, defaults };
});

/* AssurIntellec™ visual/content engine — CMS-driven */
let SITE = null;
let SERVICES = [];
let instagramIndex = 0;

const FALLBACK_SITE = {
  company_name:'AssurIntellec™', tagline:'Intelligent Solutions. Assured Compliance.',
  navigation:{home:'Home',about:'About Us',services:'Services',why_us:'Why Us',contact:'Contact Us'},
  social:{instagram:'https://www.instagram.com/assurintellec',facebook:'https://www.facebook.com/Intellegentsolution',linkedin:'https://www.linkedin.com/in/assurintellec',youtube:'https://www.youtube.com/@AssurIntellec',threads:'https://www.threads.com/@assurintellec',x:'https://x.com/AssurIntellec'},
  contact:{phone:'+91 7600 666 436',email:'info@assurintellec.com',website:'https://www.assurintellec.com',whatsapp:'https://wa.me/message/BFANWJ2N3FWOP1'},
  media_assets:{logo:'/images/uploads/logo_transparent_png_tm.png',hero_video:'/videos/hero-60sec.mp4',hero_poster:'/images/uploads/hero.jpg',profile_photo:'/images/uploads/pratik-passport.jpg'},
  hero:{company_name:'AssurIntellec™',kicker:'Pharmaceutical & Life Sciences',heading:'Pharmaceutical & Life Sciences Solutions',description:'Comprehensive solutions across pharmaceutical engineering, GMP compliance, advisory, talent, life sciences trade, technology, research and manufacturing support.',video:'/videos/hero-60sec.mp4',poster:'/images/uploads/hero.jpg'},
  instagram_reels:[]
};

const FALLBACK_SERVICES = [];

function escapeHtml(value){
  return String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

function normalizeAsset(value){
  if(!value) return '';
  const v=String(value).trim();
  if(!v) return '';
  if(/^https?:\/\//i.test(v)) return v;
  if(v.startsWith('./')) return v;
  if(v.startsWith('/')) return '.'+v;
  return './'+v;
}

function setText(id,value){const el=document.getElementById(id);if(el && value!==undefined && value!==null) el.textContent=String(value);}
function setHref(id,value){const el=document.getElementById(id);if(el && value) el.href=value;}
function setImg(img,value,alt='Image'){if(!img)return;img.alt=alt;const src=normalizeAsset(value);if(!src){img.style.display='none';return;}img.style.display='block';img.src=src;img.onerror=()=>showImageFallback(img);}
function showImageFallback(img){img.style.display='none';const holder=img.parentElement;if(holder){holder.innerHTML='<div class="image-placeholder">Image unavailable</div>';}}
function iconHtml(icon){return `<i class="fas ${escapeHtml(icon||'fa-circle-nodes')}"></i>`;}
function iconClass(name){const map={'fa-brands fa-instagram':'social-instagram'};return map[name]||'';}

async function readJson(path,fallback){
  try{
    const r=await fetch(path,{cache:'no-store'});
    if(!r.ok) throw new Error(path+' not found');
    return await r.json();
  }catch(err){console.log(err.message);return fallback;}
}

function applyTheme(site){
  const t=site?.theme||{};
  const root=document.documentElement;
  const vars={
    '--navy':t.navy,'--blue':t.blue,'--blue2':t.blue2,'--gold':t.gold,'--text':t.text,'--muted':t.muted,'--light':t.light,'--light2':t.light2,'--border':t.border,
    '--max':t.container_max?`${t.container_max}px`:null,'--logo-width':t.header_logo_width?`${t.header_logo_width}px`:null,'--hero-height':t.hero_min_height?`${t.hero_min_height}px`:null,
    '--hero-overlay':t.hero_overlay_opacity??null,'--instagram-width':t.instagram_width?`${t.instagram_width}px`:null,'--base':t.base_font_size?`${t.base_font_size}px`:null
  };
  Object.entries(vars).forEach(([k,v])=>{if(v!==null && v!==undefined && v!=='') root.style.setProperty(k,v);});
}

function socialItems(site){
  const s=site?.social||{};
  return [
    ['instagram',s.instagram,'fab fa-instagram','social-instagram','Instagram'],
    ['facebook',s.facebook,'fab fa-facebook-f','social-facebook','Facebook'],
    ['linkedin',s.linkedin,'fab fa-linkedin-in','social-linkedin','LinkedIn'],
    ['youtube',s.youtube,'fab fa-youtube','social-youtube','YouTube'],
    ['threads',s.threads,'fab fa-threads','social-threads','Threads'],
    ['x',s.x,'fab fa-x-twitter','social-x','X']
  ];
}

function socialHtml(site,footer=false){
  return socialItems(site).filter(x=>x[1]).map(x=>`<a class="${x[3]}" href="${escapeHtml(x[1])}" target="_blank" rel="noopener" aria-label="${x[4]}"><i class="${x[2]}"></i></a>`).join('');
}

function renderHeader(site){
  const holder=document.getElementById('site-header');if(!holder)return;
  const n=site.navigation||{};
  const logo=normalizeAsset(site.media_assets?.logo||site.logo||'/images/uploads/logo_transparent_png_tm.png');
  holder.innerHTML=`
  <header><div class="container navbar">
    <a href="./index.html" class="brand" aria-label="${escapeHtml(site.company_name||'AssurIntellec')} home">
      <img id="brandLogo" class="brand-logo" src="${logo}" alt="${escapeHtml(site.company_name||'AssurIntellec')}" onerror="this.style.display='none';document.getElementById('brandFallback').style.display='block';">
      <div id="brandFallback" class="brand-fallback">${escapeHtml(site.company_name||'AssurIntellec™')}</div>
    </a>
    <nav id="mainNav">
      <a href="./index.html">${escapeHtml(n.home||'Home')}</a>
      <a href="./about.html">${escapeHtml(n.about||'About Us')}</a>
      <a href="./services.html">${escapeHtml(n.services||'Services')}</a>
      <a href="./why-us.html">${escapeHtml(n.why_us||'Why Us')}</a>
      <a href="./contact.html">${escapeHtml(n.contact||'Contact Us')}</a>
      <div class="social-top">${socialHtml(site)}</div>
    </nav>
    <button class="menu-toggle" id="menuToggle" aria-label="Open navigation"><i class="fas fa-bars"></i></button>
  </div></header>`;
  const toggle=document.getElementById('menuToggle'),nav=document.getElementById('mainNav');
  toggle?.addEventListener('click',()=>{nav.classList.toggle('active');const i=toggle.querySelector('i');i.className=nav.classList.contains('active')?'fas fa-xmark':'fas fa-bars';});
  nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('active');const i=toggle?.querySelector('i');if(i)i.className='fas fa-bars';}));
}

function renderFooter(site,services){
  const holder=document.getElementById('site-footer');if(!holder)return;
  const f=site.footer||{}; const c=site.contact||{};
  const serviceLinks=services.map(s=>`<li><a href="./service-${escapeHtml(s.slug)}.html">${escapeHtml(s.title)}</a></li>`).join('');
  const social=socialHtml(site,true);
  holder.innerHTML=`
  <footer><div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <img id="footerLogo" class="footer-logo" src="${normalizeAsset(site.media_assets?.logo||'/images/uploads/logo_transparent_png_tm.png')}" alt="${escapeHtml(site.company_name||'AssurIntellec™')}" onerror="this.style.display='none'">
        <p>${escapeHtml(f.description||'')}</p>
      </div>
      <div class="footer-col"><h4>${escapeHtml(f.quick_links_title||'Quick Links')}</h4><ul class="footer-links"><li><a href="./index.html">${escapeHtml(site.navigation?.home||'Home')}</a></li><li><a href="./about.html">${escapeHtml(site.navigation?.about||'About Us')}</a></li><li><a href="./services.html">${escapeHtml(site.navigation?.services||'Services')}</a></li><li><a href="./why-us.html">${escapeHtml(site.navigation?.why_us||'Why Us')}</a></li><li><a href="./contact.html">${escapeHtml(site.navigation?.contact||'Contact Us')}</a></li></ul></div>
      <div class="footer-col"><h4>${escapeHtml(f.services_title||'Services')}</h4><ul class="footer-links">${serviceLinks}</ul></div>
      <div class="footer-col"><h4>${escapeHtml(f.contact_title||'Contact')}</h4><div class="footer-contact"><a href="tel:${escapeHtml((c.phone||'').replace(/\s+/g,''))}">${escapeHtml(c.phone||'')}</a><a href="mailto:${escapeHtml(c.email||'')}">${escapeHtml(c.email||'')}</a><a href="${escapeHtml(c.website||'#')}" target="_blank" rel="noopener">${escapeHtml(c.website||'')}</a></div><h4 style="margin-top:18px">${escapeHtml(f.social_title||'Connect')}</h4><div class="footer-social">${social}</div></div>
    </div>
    <div class="footer-bottom"><p>© <span id="year"></span> ${escapeHtml(site.company_name||'AssurIntellec™')}. ${escapeHtml(f.copyright||'All rights reserved.')}</p><p>${escapeHtml(site.tagline||'')}</p></div>
  </div></footer>`;
  const year=document.getElementById('year');if(year)year.textContent=new Date().getFullYear();
}

function renderWhatsApp(site){
  const holder=document.getElementById('whatsappFloat');if(!holder)return;
  const url=site.contact?.whatsapp||site.social?.whatsapp||''; if(!url){holder.innerHTML='';return;}
  holder.innerHTML=`<a class="whatsapp-float" href="${escapeHtml(url)}" target="_blank" rel="noopener" aria-label="WhatsApp"><i class="fab fa-whatsapp"></i></a>`;
}

function updateMeta(site){
  const seo=site.seo||{}; if(seo.title) document.title=seo.title; else if(site.company_name) document.title=site.company_name;
  let meta=document.querySelector('meta[name="description"]');
  if(!meta){meta=document.createElement('meta');meta.name='description';document.head.appendChild(meta);} if(seo.description)meta.content=seo.description;
}

function normalizeServices(data){return Array.isArray(data?.services)?data.services:(Array.isArray(data)?data:[]);}

function renderServiceCards(services){
  const grid=document.getElementById('servicesGrid');if(!grid)return;
  const list=services.length?services:[];grid.innerHTML=list.map(s=>{
    const bullets=(s.card_bullets||[]).map(b=>`<li>${escapeHtml(b)}</li>`).join('');
    return `<article class="service-card"><div class="service-icon">${iconHtml(s.icon)}</div><h3>${escapeHtml(s.title)}</h3><p>${escapeHtml(s.description||'')}</p>${bullets?`<ul class="service-list">${bullets}</ul>`:''}<a class="service-read" href="./service-${escapeHtml(s.slug)}.html">View Service Details <i class="fas fa-arrow-right"></i></a></article>`;
  }).join('');
}

function renderHome(site,services){
  const h=site.hero||{}; const home=site.home||{};
  setText('heroCompany',h.company_name||site.company_name); setText('heroKicker',h.kicker); setText('heroHeading',h.heading); setText('heroDescription',h.description); setText('heroPrimaryButton',h.button_primary||'Explore Services'); setText('heroSecondaryButton',h.button_secondary||'Discuss Your Requirement');
  const hv=document.getElementById('heroVideo'),hi=document.getElementById('heroImage'),hs=document.getElementById('heroVideoSource');
  const video=normalizeAsset(h.video||site.media_assets?.hero_video),poster=normalizeAsset(h.poster||site.media_assets?.hero_poster);
  if(hi){hi.src=poster;hi.style.display=video?'block':'block';hi.onerror=()=>showImageFallback(hi);}
  if(hv && hs && video){hs.src=video;hv.poster=poster;hv.load();hv.style.display='block';hv.addEventListener('error',()=>{hv.style.display='none';if(hi)hi.style.display='block';},{once:true});hv.addEventListener('loadeddata',()=>{if(hi)hi.style.display='none';},{once:true});}
  const sound=document.getElementById('heroSound'); if(sound){sound.setAttribute('aria-label',h.video_sound_label||'Enable hero video sound');sound.title=h.video_sound_label||'Enable hero video sound';sound.addEventListener('click',()=>{if(hv){hv.muted=!hv.muted; const i=sound.querySelector('i'); i.className=hv.muted?'fas fa-volume-xmark':'fas fa-volume-high'; if(!hv.paused)hv.play().catch(()=>{});}});}

  const trust=home.trust_items||[]; const tg=document.getElementById('trustGrid');if(tg)tg.innerHTML=trust.map(i=>`<div class="trust-item"><i class="fas ${escapeHtml(i.icon||'fa-circle-nodes')}"></i><strong>${escapeHtml(i.title)}</strong><span>${escapeHtml(i.text)}</span></div>`).join('');

  const iv=home.instagram_section||{}; setText('instagramEyebrow',iv.eyebrow||'Pharma Visual');setText('instagramDescription',iv.description||'');setText('instagramProfileLink',iv.view_profile_label||'View Instagram');setHref('instagramProfileLink',site.social?.instagram||'#');
  document.getElementById('instagramPrev')?.setAttribute('aria-label',iv.prev_label||'Previous Instagram Reel');document.getElementById('instagramNext')?.setAttribute('aria-label',iv.next_label||'Next Instagram Reel');
  renderInstagram(site);

  const ap=home.about_preview||{};setText('aboutPreviewEyebrow',ap.eyebrow);setText('aboutPreviewTitle',ap.title);setText('aboutPreviewText',ap.text);setText('aboutPreviewButton',ap.button||'About Us');
  setImg(document.getElementById('aboutPreviewImage1'),ap.image_1||site.media_assets?.about_lab,'Pharmaceutical laboratory');setImg(document.getElementById('aboutPreviewImage2'),ap.image_2||site.media_assets?.about_research,'Pharmaceutical research');
  const pts=document.getElementById('aboutPreviewPoints');if(pts)pts.innerHTML=(ap.points||[]).map(p=>`<div class="about-point"><i class="fas fa-circle-check"></i><span>${escapeHtml(p)}</span></div>`).join('');

  const sp=home.services_preview||{};setText('servicesPreviewEyebrow',sp.eyebrow);setText('servicesPreviewTitle',sp.title);setText('servicesPreviewDescription',sp.description);setText('servicesPreviewButton',sp.button||'View All Services');renderServiceCards(services);
  const wp=home.why_preview||{};setText('whyPreviewEyebrow',wp.eyebrow);setText('whyPreviewTitle',wp.title);setText('whyPreviewDescription',wp.description);setText('whyPreviewButton',wp.button||'Why Us');
  const wg=document.getElementById('whyPreviewGrid');if(wg)wg.innerHTML=(site.why_us?.cards||[]).map(c=>`<div class="why-card"><i class="fas ${escapeHtml(c.icon)}"></i><h3>${escapeHtml(c.title)}</h3><p>${escapeHtml(c.text)}</p></div>`).join('');
  const c=home.cta||{};setText('homeCtaTitle',c.title);setText('homeCtaText',c.text);setText('homeCtaButton',c.button||'Contact AssurIntellec™');
}

function instagramId(url){
  const m=String(url||'').match(/instagram\.com\/(?:reel|p)\/([^/?#]+)/i);return m?m[1]:'';
}

function renderInstagram(site){
  const holder=document.getElementById('instagramReel');if(!holder)return;
  const list=(site.instagram_reels||[]).filter(x=>x&&x.url&&instagramId(x.url));
  const prev=document.getElementById('instagramPrev'),next=document.getElementById('instagramNext');
  if(!list.length){holder.innerHTML='<div class="instagram-placeholder"><i class="fab fa-instagram"></i><strong>Instagram Reel</strong><span>Add public Reel URLs in Decap CMS → Site Settings → Instagram Reels.</span></div>';if(prev)prev.disabled=true;if(next)next.disabled=true;return;}
  if(instagramIndex>=list.length)instagramIndex=0;if(prev)prev.disabled=list.length<2;if(next)next.disabled=list.length<2;
  const item=list[instagramIndex],id=instagramId(item.url);
  holder.innerHTML=`<iframe src="https://www.instagram.com/reel/${encodeURIComponent(id)}/embed" title="${escapeHtml(item.title||'Instagram Reel')}" loading="lazy" allowtransparency="true" scrolling="no" allow="encrypted-media; fullscreen; picture-in-picture"></iframe>`;
  if(prev&&!prev.dataset.bound){prev.dataset.bound='1';prev.addEventListener('click',()=>{const l=(SITE.instagram_reels||[]).filter(x=>x&&x.url&&instagramId(x.url));if(l.length<2)return;instagramIndex=(instagramIndex-1+l.length)%l.length;renderInstagram(SITE);});}
  if(next&&!next.dataset.bound){next.dataset.bound='1';next.addEventListener('click',()=>{const l=(SITE.instagram_reels||[]).filter(x=>x&&x.url&&instagramId(x.url));if(l.length<2)return;instagramIndex=(instagramIndex+1)%l.length;renderInstagram(SITE);});}
}

function renderAbout(site){
  const a=site.about||{};setText('aboutEyebrow',a.eyebrow);setText('aboutPageTitle',a.page_title);setText('aboutPageDescription',a.page_description);setText('profileName',a.profile_name);setText('profilePosition',a.profile_position);setText('aboutApproachTitle',a.approach_title);setText('aboutApproachFlow',a.approach_flow);setText('aboutClosing',a.closing);
  const photo=document.getElementById('profilePhoto');setImg(photo,a.profile_photo||site.media_assets?.profile_photo,'Profile photo'); if(photo&&a.profile_photo||site.media_assets?.profile_photo){photo.addEventListener('error',()=>{photo.style.display='none';const p=document.getElementById('profilePhotoPlaceholder');if(p)p.style.display='flex';},{once:true});} else {photo.style.display='none';const p=document.getElementById('profilePhotoPlaceholder');if(p)p.style.display='flex';}
  const mt=document.getElementById('aboutMainText');if(mt)mt.innerHTML=(a.main_paragraphs||[]).map(p=>`<p>${escapeHtml(p)}</p>`).join('');
}

function renderWhy(site){
  const w=site.why_us||{};setText('whyEyebrow',w.eyebrow);setText('whyPageTitle',w.page_title);setText('whyPageDescription',w.page_description);
  const grid=document.getElementById('whyGrid');if(grid)grid.innerHTML=(w.cards||[]).map(c=>`<div class="why-card"><i class="fas ${escapeHtml(c.icon)}"></i><h3>${escapeHtml(c.title)}</h3><p>${escapeHtml(c.text)}</p></div>`).join('');
  const pg=document.getElementById('processGrid');if(pg)pg.innerHTML=(w.process||[]).map(p=>`<div class="process-card"><div class="process-number">${escapeHtml(p.number)}</div><h3>${escapeHtml(p.title)}</h3><p>${escapeHtml(p.text)}</p></div>`).join('');
}

function renderContact(site,services){
  const c=site.contact||{};setText('contactEyebrow',c.page_eyebrow);setText('contactPageTitle',c.page_title);setText('contactPageDescription',c.page_description);setText('contactHeading',c.heading);setText('contactDescription',c.description);setText('contactFormTitle',c.form_title);setText('labelName',c.form_name_label);setText('labelCompany',c.form_company_label);setText('labelEmail',c.form_email_label);setText('labelPhone',c.form_phone_label);setText('labelService',c.form_service_label);setText('labelMessage',c.form_message_label);setText('contactSubmitButton',c.form_button);
  [['name',c.form_name_placeholder],['company',c.form_company_placeholder],['email',c.form_email_placeholder],['phone',c.form_phone_placeholder],['message',c.form_message_placeholder]].forEach(([id,p])=>{const e=document.getElementById(id);if(e)e.placeholder=p||'';});
  const items=document.getElementById('contactItems');if(items)items.innerHTML=`<div class="contact-item"><i class="fas fa-phone"></i><div><strong>${escapeHtml(c.phone_label||'Phone')}</strong><a href="tel:${escapeHtml((c.phone||'').replace(/\s+/g,''))}">${escapeHtml(c.phone||'')}</a></div></div><div class="contact-item"><i class="fas fa-envelope"></i><div><strong>${escapeHtml(c.email_label||'Email')}</strong><a href="mailto:${escapeHtml(c.email||'')}">${escapeHtml(c.email||'')}</a></div></div><div class="contact-item"><i class="fas fa-globe"></i><div><strong>${escapeHtml(c.website_label||'Website')}</strong><a href="${escapeHtml(c.website||'#')}" target="_blank" rel="noopener">${escapeHtml(c.website||'')}</a></div></div><div class="contact-item"><i class="fab fa-whatsapp"></i><div><strong>${escapeHtml(c.whatsapp_label||'WhatsApp')}</strong><a href="${escapeHtml(c.whatsapp||'#')}" target="_blank" rel="noopener">${escapeHtml(c.whatsapp_text||'Start WhatsApp conversation')}</a></div></div>`;
  const select=document.getElementById('service');if(select)select.innerHTML='<option value="">Select requirement</option>'+services.map(s=>`<option>${escapeHtml(s.title)}</option>`).join('');
  const form=document.getElementById('contactForm');if(form&&!form.dataset.bound){form.dataset.bound='1';form.addEventListener('submit',e=>{e.preventDefault();const data=new FormData(form);const subject=encodeURIComponent('AssurIntellec website enquiry');const lines=[];for(const [k,v] of data.entries())lines.push(`${k}: ${v}`);window.location.href=`mailto:${c.email}?subject=${subject}&body=${encodeURIComponent(lines.join('\n'))}`;});}
}

function renderServicesPage(site){
  const n=site.navigation||{};setText('servicesPageEyebrow',site.company_name||'AssurIntellec™');setText('servicesPageTitle',n.services||'Services');setText('servicesPageDescription',site.home?.services_preview?.description||'');renderServiceCards(SERVICES);
}

function renderServiceDetail(site){
  const slug=document.body.dataset.serviceSlug||'';const s=SERVICES.find(x=>x.slug===slug);if(!s)return;
  setText('servicePageEyebrow',s.page_eyebrow||'Service');setText('servicePageTitle',s.page_title||s.title);setText('servicePageDescription',s.page_description||s.description);setText('serviceIntroTitle',s.intro_title||'');setText('serviceIntro',s.intro||'');
  const icon=document.getElementById('serviceDetailIcon');if(icon)icon.innerHTML=iconHtml(s.icon);
  const img=document.getElementById('serviceDetailImage');if(img && s.image){setImg(img,s.image,s.title);img.style.display='block';}
  const holder=document.getElementById('serviceDetailSections');if(holder)holder.innerHTML=(s.sections||[]).map(sec=>`<div class="detail-card"><h3>${escapeHtml(sec.heading||'')}</h3>${(sec.paragraphs||[]).map(p=>`<p>${escapeHtml(p)}</p>`).join('')}${(sec.bullets||[]).length?`<ul class="detail-list">${(sec.bullets||[]).map(b=>`<li>${escapeHtml(b)}</li>`).join('')}</ul>`:''}</div>`).join('');
  setText('serviceCta',s.cta||'Contact Us');
}

async function init(){
  SITE=await readJson('./content/site.json',FALLBACK_SITE);SERVICES=normalizeServices(await readJson('./content/services.json',{services:FALLBACK_SERVICES}));
  applyTheme(SITE);updateMeta(SITE);renderHeader(SITE);renderFooter(SITE,SERVICES);renderWhatsApp(SITE);
  const page=document.body.dataset.page;
  if(page==='home')renderHome(SITE,SERVICES);
  if(page==='about')renderAbout(SITE);
  if(page==='services')renderServicesPage(SITE);
  if(page==='why')renderWhy(SITE);
  if(page==='contact')renderContact(SITE,SERVICES);
  if(page==='service')renderServiceDetail(SITE);
}

document.addEventListener('DOMContentLoaded',init);

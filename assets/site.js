/* =========================================================
   ASSURINTELLEC SITE JAVASCRIPT
   ---------------------------------------------------------
   1) Hero video: upload a 60-second MP4 as:
      /videos/hero-60sec.mp4

   2) Instagram Reel carousel: add public Instagram Reel URLs
      inside INSTAGRAM_REEL_URLS. Only ONE Reel is embedded at
      a time; left/right arrows change the displayed Reel.
========================================================= */

const INSTAGRAM_REEL_URLS = [
  'PASTE_INSTAGRAM_REEL_URL_1_HERE',
  'PASTE_INSTAGRAM_REEL_URL_2_HERE',
  'PASTE_INSTAGRAM_REEL_URL_3_HERE',
  'PASTE_INSTAGRAM_REEL_URL_4_HERE',
  'PASTE_INSTAGRAM_REEL_URL_5_HERE'
];

let instagramIndex = 0;

function tryNextImage(img, filename){
  if(!img.dataset.fallbackTried){
    img.dataset.fallbackTried='true';
    img.src='./images/'+filename;
  }else{
    img.style.display='none';
    if(img.parentElement) img.parentElement.innerHTML='<div class="image-placeholder">Image unavailable</div>';
  }
}

function showProfilePlaceholder(img){
  img.style.display='none';
  const placeholder=document.getElementById('profilePhotoPlaceholder');
  if(placeholder) placeholder.style.display='flex';
}

function escapeHtml(value){
  return String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

function serviceIcon(title){
  const t=(title||'').toLowerCase();
  if(t.includes('gmp')||t.includes('compliance')) return 'fa-shield-halved';
  if(t.includes('advisory')||t.includes('transaction')) return 'fa-handshake';
  if(t.includes('talent')||t.includes('recruit')) return 'fa-user-group';
  if(t.includes('trade')) return 'fa-globe';
  if(t.includes('technology')||t.includes('laboratory')) return 'fa-flask';
  if(t.includes('research')||t.includes('scientific')) return 'fa-microscope';
  if(t.includes('manufacturing')||t.includes('pharma')) return 'fa-industry';
  return 'fa-circle-nodes';
}

const serviceLinks={
  'GMP Engineering & Compliance':'./service-gmp.html',
  'Advisory & Transactions':'./service-advisory.html',
  'Talent & Recruitment':'./service-talent.html',
  'Life Sciences Trade':'./service-trade.html',
  'Pharma & Laboratory Technologies':'./service-technology.html',
  'Research & Scientific Services':'./service-research.html',
  'Pharma Solutions & Manufacturing':'./service-manufacturing.html'
};

const defaultServices=[
  {title:'GMP Engineering & Compliance',description:'Technical support for GMP-focused pharmaceutical facilities and compliance requirements.',items:['Facility planning','GMP compliance','Cleanroom & HVAC','Qualification & validation']},
  {title:'Advisory & Transactions',description:'Technical and commercial support for pharmaceutical opportunities and transactions.',items:['Technical due diligence','Facility assessment','Business advisory','Acquisition support']},
  {title:'Talent & Recruitment',description:'Support for connecting life-sciences organizations with relevant professional capabilities.',items:['Pharmaceutical talent','Technical recruitment','Specialist support']},
  {title:'Life Sciences Trade',description:'Support across pharmaceutical and life-sciences products, opportunities and trade activities.',items:['Product opportunities','Market connections','Business support']},
  {title:'Pharma & Laboratory Technologies',description:'Technology and equipment-oriented support for pharmaceutical and laboratory requirements.',items:['Machinery selection','Equipment procurement','Laboratory technologies','Technical evaluation']},
  {title:'Research & Scientific Services',description:'Scientific and research support across formulation, development and laboratory activities.',items:['Formulation support','Research projects','Scientific guidance','Laboratory support']},
  {title:'Pharma Solutions & Manufacturing',description:'Integrated support for pharmaceutical manufacturing projects and operational requirements.',items:['Manufacturing support','Plant setup','Process support','Project coordination']}
];

function normalizeServices(data){
  if(Array.isArray(data)) return data;
  if(Array.isArray(data?.services)) return data.services;
  if(data && typeof data==='object') return Object.values(data).filter(v=>v&&typeof v==='object');
  return [];
}

function renderServices(services){
  const grid=document.getElementById('servicesGrid');
  if(!grid) return;
  if(!services.length) services=defaultServices;
  grid.innerHTML='';
  services.forEach(service=>{
    const title=service.title||service.name||'Service';
    const description=service.description||'';
    const items=Array.isArray(service.items)?service.items:[];
    const href=serviceLinks[title] || './contact.html';
    const card=document.createElement('article');
    card.className='service-card';
    card.innerHTML=`<div class="service-icon"><i class="fas ${serviceIcon(title)}"></i></div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(description)}</p>${items.length?`<ul class="service-list">${items.map(i=>`<li>${escapeHtml(i)}</li>`).join('')}</ul>`:''}<a class="service-read" href="${href}">View Service Details <i class="fas fa-arrow-right"></i></a>`;
    grid.appendChild(card);
  });
}

async function loadServices(){
  const grid=document.getElementById('servicesGrid');
  if(!grid) return;
  try{
    const r=await fetch('./content/services.json',{cache:'no-store'});
    if(!r.ok) throw new Error('services.json unavailable');
    const data=await r.json();
    const services=normalizeServices(data);
    renderServices(services.length?services:defaultServices);
  }catch(e){
    console.log('CMS services unavailable:',e);
    renderServices(defaultServices);
  }
}

async function loadSite(){
  try{
    const r=await fetch('./content/site.json',{cache:'no-store'});
    if(!r.ok) throw new Error('site.json unavailable');
    const site=await r.json();
    if(site.company_name){
      document.title=site.company_name+' | Pharmaceutical & Life Sciences Solutions';
      const companyEls=document.querySelectorAll('[data-company-name]');
      companyEls.forEach(el=>el.textContent=site.company_name);
    }
    if(site.hero_heading){const el=document.getElementById('heroHeading');if(el)el.textContent=site.hero_heading;}
    if(site.hero_description){const el=document.getElementById('heroDescription');if(el)el.textContent=site.hero_description;}
    if(site.about_title){const el=document.getElementById('aboutTitle');if(el)el.textContent=site.about_title;}
    if(site.about_text){const el=document.getElementById('aboutText');if(el)el.textContent=site.about_text;}
    if(site.logo && site.logo.trim()){
      const brand=document.getElementById('brandLogo');
      const foot=document.getElementById('footerLogo');
      if(brand) brand.src=site.logo.trim();
      if(foot) foot.src=site.logo.trim();
    }
  }catch(e){console.log('CMS site unavailable:',e);}
}

function renderHeader(){
  const holder=document.getElementById('site-header');
  if(!holder) return;
  holder.innerHTML=`
  <header>
    <div class="container navbar">
      <a href="./index.html" class="brand" aria-label="AssurIntellec home">
        <img id="brandLogo" class="brand-logo" src="./images/uploads/logo_transparent_png_tm.png" alt="AssurIntellec™" onerror="tryNextImage(this,'logo_transparent_png_tm.png')">
        <div class="brand-fallback">AssurIntellec™</div>
      </a>
      <nav id="mainNav">
        <a href="./index.html">Home</a>
        <a href="./about.html">About Us</a>
        <a href="./services.html">Services</a>
        <a href="./why-us.html">Why Us</a>
        <a href="./contact.html">Contact Us</a>
        <div class="social-top">
          <a class="social-facebook" href="https://www.facebook.com/Intellegentsolution" target="_blank" rel="noopener" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
          <a class="social-instagram" href="https://www.instagram.com/assurintellec?utm_source=qr&igsi=MW43Z3M2anZpbHo1" target="_blank" rel="noopener" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
          <a class="social-whatsapp" href="https://wa.me/message/BFANWJ2N3FWOP1" target="_blank" rel="noopener" aria-label="WhatsApp"><i class="fab fa-whatsapp"></i></a>
          <a class="social-x" href="https://x.com/AssurIntellec" target="_blank" rel="noopener" aria-label="X"><i class="fab fa-x-twitter"></i></a>
          <a class="social-linkedin" href="https://www.linkedin.com/in/assurintellec" target="_blank" rel="noopener" aria-label="LinkedIn"><i class="fab fa-linkedin-in"></i></a>
          <a class="social-threads" href="https://www.threads.com/@assurintellec" target="_blank" rel="noopener" aria-label="Threads"><i class="fab fa-threads"></i></a>
          <a class="social-youtube" href="https://www.youtube.com/@AssurIntellec" target="_blank" rel="noopener" aria-label="YouTube"><i class="fab fa-youtube"></i></a>
        </div>
      </nav>
      <button class="menu-toggle" id="menuToggle" aria-label="Open navigation"><i class="fas fa-bars"></i></button>
    </div>
  </header>`;
  const toggle=document.getElementById('menuToggle');
  const nav=document.getElementById('mainNav');
  if(toggle){toggle.addEventListener('click',()=>{nav.classList.toggle('active');const i=toggle.querySelector('i');i.className=nav.classList.contains('active')?'fas fa-xmark':'fas fa-bars';});}
  nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('active');const i=toggle?.querySelector('i');if(i)i.className='fas fa-bars';}));
}

function renderFooter(){
  const holder=document.getElementById('site-footer');
  if(!holder) return;
  holder.innerHTML=`
  <footer>
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <img id="footerLogo" class="footer-logo" src="./images/uploads/logo_transparent_png_tm.png" alt="AssurIntellec™" onerror="tryNextImage(this,'logo_transparent_png_tm.png')">
          <p>Pharmaceutical & life sciences solutions across engineering, compliance, advisory, scientific, technology and manufacturing support.</p>
        </div>
        <div><h4>Quick Links</h4><ul class="footer-links"><li><a href="./index.html">Home</a></li><li><a href="./about.html">About Us</a></li><li><a href="./services.html">Services</a></li><li><a href="./why-us.html">Why Us</a></li><li><a href="./contact.html">Contact Us</a></li></ul></div>
        <div><h4>Services</h4><ul class="footer-links"><li><a href="./service-gmp.html">GMP Engineering & Compliance</a></li><li><a href="./service-advisory.html">Advisory & Transactions</a></li><li><a href="./service-talent.html">Talent & Recruitment</a></li><li><a href="./service-trade.html">Life Sciences Trade</a></li><li><a href="./service-technology.html">Pharma & Laboratory Technologies</a></li><li><a href="./service-research.html">Research & Scientific Services</a></li><li><a href="./service-manufacturing.html">Pharma Solutions & Manufacturing</a></li></ul></div>
        <div><h4>Contact</h4><div class="footer-contact"><a href="tel:+917600666436">+91 7600 666 436</a><a href="mailto:info@assurintellec.com">info@assurintellec.com</a><a href="https://www.assurintellec.com" target="_blank" rel="noopener">www.assurintellec.com</a></div></div>
      </div>
      <div class="footer-bottom"><p>© <span id="year"></span> AssurIntellec™. All rights reserved.</p><p>Intelligent Solutions. Assured Compliance.</p></div>
    </div>
  </footer>`;
  const y=document.getElementById('year');if(y)y.textContent=new Date().getFullYear();
}

function validInstagramUrls(){
  return INSTAGRAM_REEL_URLS.filter(url=>url && !url.includes('PASTE_INSTAGRAM_REEL_URL'));
}

function ensureInstagramScript(callback){
  if(window.instgrm && window.instgrm.Embeds){
    callback();
    return;
  }
  let script=document.getElementById('instagram-embed-script');
  if(script){
    script.addEventListener('load',callback,{once:true});
    return;
  }
  script=document.createElement('script');
  script.id='instagram-embed-script';
  script.async=true;
  script.src='https://www.instagram.com/embed.js';
  script.onload=callback;
  document.body.appendChild(script);
}

function renderInstagramReel(){
  const holder=document.getElementById('instagramReel');
  if(!holder) return;
  const urls=validInstagramUrls();
  const prev=document.getElementById('instagramPrev');
  const next=document.getElementById('instagramNext');

  if(prev && !prev.dataset.bound){
    prev.dataset.bound='true';
    prev.addEventListener('click',()=>{
      const list=validInstagramUrls();
      if(list.length<2) return;
      instagramIndex=(instagramIndex-1+list.length)%list.length;
      renderInstagramReel();
    });
  }
  if(next && !next.dataset.bound){
    next.dataset.bound='true';
    next.addEventListener('click',()=>{
      const list=validInstagramUrls();
      if(list.length<2) return;
      instagramIndex=(instagramIndex+1)%list.length;
      renderInstagramReel();
    });
  }

  if(!urls.length){
    holder.innerHTML='<div class="instagram-placeholder"><i class="fab fa-instagram"></i><strong>Instagram Reel</strong><span>Add one or more public Reel URLs in assets/site.js inside INSTAGRAM_REEL_URLS.</span></div>';
    if(prev) prev.disabled=true;
    if(next) next.disabled=true;
    return;
  }

  if(instagramIndex>=urls.length) instagramIndex=0;

  if(prev) prev.disabled=urls.length<2;
  if(next) next.disabled=urls.length<2;

  holder.innerHTML=`<blockquote class="instagram-media" data-instgrm-permalink="${escapeHtml(urls[instagramIndex])}" data-instgrm-version="14"></blockquote>`;

  ensureInstagramScript(()=>{
    if(window.instgrm && window.instgrm.Embeds) window.instgrm.Embeds.process();
  });
}

function initHeroVideo(){
  const video=document.getElementById('heroVideo');
  const image=document.getElementById('heroImage');
  if(!video) return;

  video.addEventListener('error',()=>{
    video.style.display='none';
    if(image) image.style.display='block';
  });

  video.addEventListener('loadeddata',()=>{
    if(image) image.style.display='none';
    video.style.display='block';
  });
}

document.addEventListener('DOMContentLoaded',async()=>{
  renderHeader();
  renderFooter();
  initHeroVideo();
  renderInstagramReel();
  await loadSite();
  await loadServices();
});

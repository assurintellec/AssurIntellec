import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const source=readFileSync('website/assets/site.js','utf8');
class Element {
  constructor(){this.dataset={};this.style={};this.attrs={};this.listeners={};this.disabled=false;this.hidden=false;this.innerHTML='';}
  setAttribute(k,v){this.attrs[k]=v;}
  addEventListener(k,fn){(this.listeners[k]??=[]).push(fn);}
  click(){for(const fn of this.listeners.click||[])fn();}
  replaceChildren(){this.innerHTML='';}
  closest(){return carousel;}
}
const carousel=new Element();carousel.querySelector=()=>help;carousel.appendChild=e=>help=e;
let help=null;const holder=new Element();const prev=new Element();const next=new Element();
const document={getElementById:id=>({instagramReel:holder,instagramPrev:prev,instagramNext:next})[id],createElement:()=>new Element()};
const script=source.slice(source.indexOf('function instagramId(value)'),source.indexOf('function renderAbout(site)'));
const context=vm.createContext({document,URL,escapeHtml:s=>String(s),instagramIndex:0});vm.runInContext(script,context);
const site=JSON.parse(readFileSync('website/content/site.json'));
context.renderInstagram(site);
const has=id=>assert.match(holder.innerHTML,new RegExp(`/reel/${id}/embed/`));
has('DdriZdqshN7');assert.equal(prev.disabled,false);assert.equal(next.disabled,false);
next.click();has('DdMlN0CMnXe');next.click();has('DdbkEHhMSMH');next.click();has('Dc-XdSVuJoZ');next.click();has('DdriZdqshN7');prev.click();has('Dc-XdSVuJoZ');
assert.equal((holder.innerHTML.match(/<iframe/g)||[]).length,1);
assert.match(holder.innerHTML,/allow="autoplay; fullscreen; picture-in-picture; encrypted-media"/);
assert.doesNotMatch(holder.innerHTML,/[?&]mute|muted/);
assert.match(help.innerHTML,/Dc-XdSVuJoZ/);
for(let i=0;i<5;i++)context.renderInstagram(site);
assert.equal(next.listeners.click.length,1);assert.equal(carousel.listeners.keydown.length,1);
let prevented=false;carousel.listeners.keydown[0]({key:'ArrowRight',target:{closest:()=>false},preventDefault(){prevented=true;}});has('DdriZdqshN7');assert.ok(prevented);
const filtered={home:{},instagram_reels:[{url:'https://attacker.test/instagram.com/reel/no/'},{url:''},{url:'https://www.instagram.com/reel/valid_1/',enabled:false},{url:'https://www.instagram.com/reel/valid_2/'},{url:'https://instagram.com/p/valid_2/?duplicate=1'}]};
context.renderInstagram(filtered);assert.equal(next.disabled,true);has('valid_2');
context.renderInstagram({home:{},instagram_reels:[]});assert.equal(prev.disabled,true);assert.match(holder.innerHTML,/Add public Instagram Reel URLs/);assert.equal(help.hidden,true);
context.renderInstagram({home:{instagram_section:{enabled:false}},instagram_reels:site.instagram_reels});assert.equal(holder.innerHTML,'');assert.equal(prev.style.display,'none');
context.renderInstagram(site);assert.equal(prev.style.display,'inline-flex');assert.equal(next.disabled,false);
console.log('PASS: all configured reels, arrows, wraparound, keyboard navigation, single active iframe, sound permissions, duplicate handlers, URL filtering, disabled/empty/one-reel states, and current-reel fallback link.');

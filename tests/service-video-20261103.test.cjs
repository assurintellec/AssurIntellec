const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const api=require('../assets/service-video.js');
test('Video paths preserve CMS selection, spaces, Unicode and signed URL escapes',()=>{
 assert.equal(api.path('/videos/New clip.mp4'),'/videos/New%20clip.mp4');
 assert.equal(api.path('videos/Clip.mp4'),'/videos/Clip.mp4');assert.equal(api.path('clip.mp4'),'/videos/clip.mp4');
 assert.equal(api.path('https://media.example/a.mp4?signature=a%2Bb%2Fc'), 'https://media.example/a.mp4?signature=a%2Bb%2Fc');
 assert.equal(api.path('javascript:alert(1)'),'');assert.equal(api.path('//untrusted.example/x'),'');
 assert.deepEqual(api.candidates('/videos/new.mp4','/videos/new.mp4'),['/videos/new.mp4']);
 assert.equal(api.legacyPath('/videos/A%20clip.mp4'),'/content/videos/A%20clip.mp4');
});
test('Markup uses selected source without forcing an MP4 MIME or unrelated compatibility mapping',()=>{
 const html=api.markup('/videos/new clip.webm','Service','/images/poster.jpg','ps2-hero-video','/videos/compatible.mp4');
 assert.match(html,/src="\/videos\/new%20clip.webm"/);assert.match(html,/data-video-fallback="\/videos\/compatible.mp4"/);
 assert.doesNotMatch(html,/<source|type="video\/mp4"|hero-60sec/);
});
class Element{
 constructor(tag){this.tag=tag;this.children=[];this.attributes={};this.dataset={};this.listeners={};this.hidden=false;}
 append(...nodes){this.children.push(...nodes);for(const n of nodes)n.parent=this;}
 remove(){if(this.parent)this.parent.children=this.parent.children.filter(n=>n!==this);}
 setAttribute(k,v){this.attributes[k]=String(v);}getAttribute(k){return this.attributes[k]||null;}removeAttribute(k){delete this.attributes[k];}
 addEventListener(k,f){(this.listeners[k]||=[]).push(f);}dispatch(k){return Promise.all((this.listeners[k]||[]).map(fn=>fn()));}
 querySelector(selector){if(selector==='video')return this.children.find(n=>n.tag==='video');return this.children.find(n=>'.'+n.className===selector)||null;}
 querySelectorAll(){return [];}
}
function playerHarness({head=200,reject}={}){
 const doc={hidden:false,createElement:tag=>new Element(tag),addEventListener(){}};
 const player=new Element('div'),video=new Element('video');player.append(video);video.dataset.videoSource='/videos/selected.mp4';video.isConnected=true;video.loads=0;
 Object.defineProperty(video,'src',{get(){return this.attributes.src;},set(v){this.attributes.src=v;}});
 video.pause=()=>{};video.load=()=>{video.loads++;video.error=null;};video.play=()=>reject?Promise.reject({name:reject}):Promise.resolve();
 const fetches=[];const context=vm.createContext({module:{exports:{}},document:doc,URL,Promise,Set,AbortSignal,fetch:async url=>{fetches.push(url);return new Response(null,{status:head,headers:{'content-type':'video/mp4'}});}});
 vm.runInContext(fs.readFileSync(require.resolve('../assets/service-video.js'),'utf8'),context);
 context.module.exports.init({querySelectorAll:()=>[player]});
 return {player,video,fetches,feedback:()=>player.querySelector('.service-video-feedback')};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
test('Changing a CMS URL reuses the video element, loads the replacement and clears old errors',async()=>{
 const h=playerHarness();await settle();const original=h.video;h.video.error={code:4};
 h.video.assurServicePlayer.setSources('/videos/replacement.mp4','');await settle();
 assert.equal(h.video,original);assert.equal(h.video.src,'/videos/replacement.mp4');assert.equal(h.video.error,null);assert.equal(h.video.loads,2);assert.equal(h.feedback().hidden,true);
});
test('Missing upload path recovers only the same file in the old folder, then uses an explicit compatible copy',async()=>{
 const h=playerHarness({head:404});h.video.assurServicePlayer.setSources('/videos/selected.mp4','/videos/compatible.mp4');await settle();
 h.video.error={code:4};await h.video.dispatch('error');await settle();assert.equal(h.video.src,'/content/videos/selected.mp4');
 h.video.error={code:4};await h.video.dispatch('error');await settle();assert.equal(h.video.src,'/videos/compatible.mp4');
});
test('A reachable unsupported original tries its explicit compatible copy without substituting a different historical file',async()=>{
 const h=playerHarness();h.video.assurServicePlayer.setSources('/videos/selected.mov','/videos/compatible.mp4');await settle();
 h.video.error={code:4};await h.video.dispatch('error');await settle();assert.equal(h.video.src,'/videos/compatible.mp4');
});
test('Autoplay blocking requests a visitor gesture and does not claim a codec failure',async()=>{
 const h=playerHarness({reject:'NotAllowedError'});await settle();assert.equal(h.feedback().hidden,false);assert.match(h.feedback().children[0].textContent,/Tap Play/);assert.equal(h.fetches.length,0);
});
test('Normal AbortError during source loading does not display the error overlay',async()=>{
 const h=playerHarness({reject:'AbortError'});await settle();assert.equal(h.feedback().hidden,true);assert.equal(h.fetches.length,0);
});
test('A rejected unsupported playback request exposes retry feedback even before a MediaError event',async()=>{
 const h=playerHarness({reject:'NotSupportedError'});await settle();assert.equal(h.feedback().hidden,false);assert.match(h.feedback().children[0].textContent,/unavailable|cannot play/);
});

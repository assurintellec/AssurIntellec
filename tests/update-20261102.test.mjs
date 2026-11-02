import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { webcrypto } from 'node:crypto';
import { handleNewsletterRequest, NEWSLETTER_PROTOCOL } from '../newsletter-proxy.js';
import { normalizeAnalytics, handleAnalyticsRequest, ANALYTICS_PROTOCOL } from '../visitor-analytics.js';
const require = createRequire(import.meta.url);
const newsletterUI = require('../assets/newsletter.js');
const source = path => fs.readFileSync(new URL('../' + path, import.meta.url), 'utf8');
class Range {
  constructor(sheet, row, col, rows=1, cols=1) { Object.assign(this, {sheet,row,col,rows,cols}); }
  getValues() { return Array.from({length:this.rows},(_,r)=>Array.from({length:this.cols},(_,c)=>this.sheet.data[this.row+r-1]?.[this.col+c-1] ?? '')); }
  setValues(values) { for(let r=0;r<this.rows;r++){ this.sheet.data[this.row+r-1] ||= []; for(let c=0;c<this.cols;c++) this.sheet.data[this.row+r-1][this.col+c-1]=values[r][c]; } return this; }
  setValue(value) {return this.setValues([[value]]);}
  setFormula(value) { this.sheet.formulas.push(value); return this.setValue(value); }
  clearContent() {return this.setValues(Array.from({length:this.rows},()=>Array(this.cols).fill('')));}
  getRow() {return this.row;}
  createTextFinder(text) {return {matchEntireCell(){return this;},findNext:()=>{const i=this.sheet.data.findIndex((row,i)=>i>=this.row-1&&String(row[this.col-1])===text);return i<0?null:new Range(this.sheet,i+1,this.col);}};}
  setFontWeight(){return this;} setBackground(){return this;} setFontColor(){return this;} setNumberFormat(){return this;} createFilter(){return this;}
}
class Sheet {
  constructor(name,book,data=[]) {Object.assign(this,{name,book,data,formulas:[]});}
  getRange(r,c,rs,cs) {
    if(typeof r==='string') {
      const m=r.match(/^([A-Z]+)(\d*)?(?::([A-Z]+)(\d*)?)?$/);
      if(!m)throw new Error('Bad A1 range '+r);
      const col=x=>[...x].reduce((v,c)=>v*26+c.charCodeAt(0)-64,0);
      const first=Number(m[2])||1,last=m[3]?(Number(m[4])||this.getMaxRows()):first;
      return new Range(this,first,col(m[1]),last-first+1,(m[3]?col(m[3]):col(m[1]))-col(m[1])+1);
    }
    return new Range(this,r,c,rs,cs);
  }
  getLastRow(){let n=this.data.length;while(n&&this.data[n-1].every(v=>v===''))n--;return n;}
  getLastColumn(){return Math.max(1,...this.data.map(r=>r.length));}
  appendRow(row){this.data.push([...row]);}
  getName(){return this.name;} getParent(){return this.book;} getMaxColumns(){return 26;} getMaxRows(){return 1000;} getFilter(){return null;}
  setFrozenRows(){} hideColumns(){} autoResizeColumns(){} insertColumnsAfter(){}
  copyTo(book){const copy=book.insertSheet('Copy');copy.data=this.data.map(r=>[...r]);return copy;}
  setName(name){delete this.book.sheets[this.name];this.name=name;this.book.sheets[name]=this;return this;}
}
function gas(paths=['integrations/newsletter/Code.gs','integrations/newsletter/VisitorAnalytics.gs']) {
  const properties = new Map(), sent = [], logs = [];
  const book = {sheets:{},getId:()=> 'book',getSheetByName(name){return this.sheets[name]||null;},insertSheet(name){return this.sheets[name]=new Sheet(name,this);},setSpreadsheetTimeZone(){},setRecalculationInterval(){}};
  const props = {getProperty:k=>properties.get(k),setProperty(k,v){properties.set(k,v);return this;}};
  const lock = {waitLock(){},releaseLock(){},tryLock(){return true;}};
  const context = vm.createContext({Date,Map,Set,JSON,console:{log:x=>logs.push(x),warn(){},error(){}},SpreadsheetApp:{getActiveSpreadsheet:()=>book,openById:()=>book,flush(){},RecalculationInterval:{MINUTE:'MINUTE'}},PropertiesService:{getScriptProperties:()=>props},LockService:{getScriptLock:()=>lock},Utilities:{getUuid:()=>webcrypto.randomUUID(),base64Decode:x=>Buffer.from(x,'base64'),newBlob:(bytes,type,name)=>({bytes,type,name}),formatDate:()=> '20261102 120000'},MailApp:{getRemainingDailyQuota:()=>100,sendEmail:message=>sent.push(message)},UrlFetchApp:{fetch(){throw new Error('No external request in test');}},ScriptApp:{getService:()=>({getUrl:()=> 'https://script.google.com/macros/s/test/exec'}),getProjectTriggers:()=>[],newTrigger:()=>({timeBased(){return this;},everyHours(){return this;},everyMinutes(){return this;},create(){}})}});
  paths.forEach(path=>vm.runInContext(source(path),context,{filename:path}));
  return {context,book,properties,sent,logs,run:code=>vm.runInContext(code,context)};
}
const subscribeData = (interest='gmp-engineering')=>({action:'subscribe',email:'Test@Example.com',interest,consent:'yes',_bridge_origin:'https://www.assurintellec.in',source_page:'/services.html'});
test('Repeated signups send fresh emails, reuse one row, accumulate interests and embed nine clickable icons',()=>{
  const g=gas();g.run('setupNewsletterSheet()');
  g.context.input=subscribeData();assert.equal(g.run('nlSaveSubscriber_(input)').success,true);
  g.context.input=subscribeData('advisory-transactions');g.run('nlSaveSubscriber_(input)');
  const sheet=g.book.getSheetByName('NewsletterSubscribers');
  assert.equal(sheet.getLastRow(),2);assert.equal(g.sent.length,2);assert.equal(sheet.data[1][1],'test@example.com');
  assert.equal(sheet.data[1][13],'gmp-engineering|advisory-transactions');
  const email=g.sent[1];assert.equal(Object.keys(email.inlineImages).length,9);
  for(const key of ['facebook','instagram','linkedin','youtube','whatsapp_channel','telegram','threads','x','google'])assert.match(email.htmlBody,new RegExp('cid:assur_social_'+key));
  assert.match(email.htmlBody,/<a href="https:\/\/www.facebook.com\/Intellegentsolution"[^>]+><img/);
  assert.match(email.htmlBody,/https:\/\/www.assurintellec.in\/unsubscribe.html#token=[a-f0-9]{64}/);
  assert.doesNotMatch(email.htmlBody,/script.google.com/);
});
test('Seven numbered live service tabs include all-interest subscribers and exclude inactive rows',()=>{
  const g=gas();g.run('setupNewsletterSheet()');
  const tabs=Object.values(g.book.sheets).filter(s=>/^\d\./.test(s.name));assert.equal(tabs.length,7);
  assert.equal(tabs[0].name,'1. GMP Engineering & Compliance');assert.equal(tabs[6].name,'7. Pharma Solutions & Manufacturing');
  for(const tab of tabs){assert.match(tab.formulas[0],/D2:D="Active"/);assert.match(tab.formulas[0],/\(all\|/);assert.match(tab.formulas[0],/REGEXMATCH/);}
});
test('Migration consolidates historical duplicates, preserves old unsubscribe tokens and makes a backup without sending mail',()=>{
  const g=gas();g.run('setupNewsletterSheet()');g.context.input=subscribeData();g.run('nlSaveSubscriber_(input)');
  const sheet=g.book.getSheetByName('NewsletterSubscribers'), oldToken=sheet.data[1][9];
  const second=[...sheet.data[1]];second[1]='TEST@example.com';second[4]=new Date(Date.now()+1000);second[9]='b'.repeat(64);second[13]='advisory-transactions';second[2]='Advisory & Transactions';sheet.appendRow(second);
  const before=g.sent.length;g.run('nlMigrateSubscribers_(nlGetSheet_())');assert.equal(g.sent.length,before);assert.equal(sheet.getLastRow(),2);
  assert.equal(Object.keys(g.book.sheets).filter(n=>n.startsWith('Newsletter backup')).length,1);
  g.context.oldToken=oldToken;g.run('nlUnsubscribe_(oldToken)');assert.equal(sheet.data[1][3],'Unsubscribed');
  g.run('nlUnsubscribe_(oldToken)');assert.equal(sheet.data[1][3],'Unsubscribed');
});
test('Unsubscribe cancels pending mail; an explicit resubscribe reactivates with a fresh acknowledgement',()=>{
  const g=gas();g.run('setupNewsletterSheet()');g.context.input=subscribeData();g.run('nlSaveSubscriber_(input)');
  const sheet=g.book.getSheetByName('NewsletterSubscribers');g.context.token=sheet.data[1][9];sheet.data[1][10]='Pending';
  g.run('nlUnsubscribe_(token)');assert.equal(sheet.data[1][10],'Cancelled (unsubscribed)');
  g.context.input=subscribeData('talent-recruitment');g.run('nlSaveSubscriber_(input)');assert.equal(sheet.getLastRow(),2);assert.equal(sheet.data[1][3],'Active');assert.equal(sheet.data[1][13],'talent-recruitment');assert.equal(g.sent.length,2);
});
test('Website recovers both old account-specific links and new fragment links',()=>{
  const token='a'.repeat(64);assert.equal(newsletterUI.extractToken('https://script.google.com/macros/u/8/s/example/exec?action=unsubscribe&token='+token),token);
  assert.equal(newsletterUI.extractToken('https://www.assurintellec.in/unsubscribe.html#token='+token),token);assert.equal(newsletterUI.extractToken('bad'), '');
});
const endpoint='https://script.google.com/macros/s/example/exec';
const configEnv=site=>({ASSETS:{fetch:async()=>new Response(JSON.stringify(site),{headers:{'content-type':'application/json'}})}});
const post=(path,data,origin='https://www.assurintellec.in')=>new Request('https://www.assurintellec.in'+path,{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(data)});
test('Same-origin proxy strips Google account paths and cookies, preserves signup source, handles unsubscribe independently of signup visibility',async()=>{
  const original=globalThis.fetch;const calls=[];globalThis.fetch=async(url,options)=>{calls.push({url,options});return new Response(JSON.stringify({success:true,message:'Confirmed'}));};
  try{
    const env=configEnv({newsletter:{enabled:true,enquiry_optin_enabled:false,google_apps_script_url:endpoint.replace('/macros/s/','/macros/u/8/s/')}});
    let response=await handleNewsletterRequest(post('/api/newsletter',{...subscribeData(),source:'newsletter',source_page:'/about.html?private=x'}),env);assert.equal(response.status,200);assert.equal((await response.json()).success,true);assert.equal(calls[0].url,endpoint);assert.equal(calls[0].options.headers.cookie,undefined);assert.equal(calls[0].options.body.get('source_page'),'/about.html#newsletter');
    response=await handleNewsletterRequest(post('/api/newsletter',{...subscribeData(),source:'enquiry'}),env);assert.equal(response.status,403);
    response=await handleNewsletterRequest(post('/api/newsletter',{action:'unsubscribe',token:'a'.repeat(64)}),configEnv({newsletter:{enabled:false,google_apps_script_url:endpoint}}));assert.equal((await response.json()).success,true);
    response=await handleNewsletterRequest(post('/api/newsletter',subscribeData(),'https://evil.example'),env);assert.equal(response.status,403);
  }finally{globalThis.fetch=original;}
});
test('Proxy health flags stale deployments rather than claiming success',async()=>{
  const original=globalThis.fetch;globalThis.fetch=async()=>new Response(JSON.stringify({service:'assurintellec-newsletter',ready:true,protocol:'old'}));
  try{const response=await handleNewsletterRequest(new Request('https://www.assurintellec.in/api/newsletter?action=health'),configEnv({newsletter:{google_apps_script_url:endpoint}}));assert.equal((await response.json()).ready,false);assert.equal(NEWSLETTER_PROTOCOL,'2026-11-02-v3');}finally{globalThis.fetch=original;}
});
const analyticsData=()=>({page_id:'a'.repeat(32),session_id:'b'.repeat(32),started_at:Date.now()-60000,sequence:1,active_seconds:50,path:'/services.html?email=secret#name',title:'Services',sections:['GMP','Advisory'],referrer:'https://example.org/path?secret=yes',device:'desktop',consent:'yes',ip:'forged',city:'forged'});
test('Analytics uses edge IP/location, removes private URL details and caps time',()=>{
  const request=post('/api/visitor-analytics',{});Object.defineProperty(request,'cf',{value:{city:'Surat',region:'Gujarat',country:'IN',timezone:'Asia/Kolkata'}});request.headers.set('cf-connecting-ip','203.0.113.10');
  const data=analyticsData();data.active_seconds=999999;
  const normalized=normalizeAnalytics(data,request,{});assert.equal(normalized.ip,'203.0.113.10');assert.equal(normalized.city,'Surat');assert.equal(normalized.path,'/services.html');assert.equal(normalized.referrer,'https://example.org');assert.ok(normalized.active_seconds<=61);
  assert.equal(normalizeAnalytics(data,request,{collect_ip:false}).ip,'');assert.throws(()=>normalizeAnalytics({...data,consent:'no'},request,{}));
});
test('Analytics writes one row per page, ignores repeated/out-of-order updates, and generates all seven rolling-period reports',()=>{
  const g=gas();g.run('setupNewsletterSheet();setupVisitorAnalytics()');g.properties.set('ANALYTICS_BRIDGE_TOKEN','x'.repeat(40));
  const payload=analyticsData();delete payload.ip;g.context.input={bridge_secret:'x'.repeat(40),payload:JSON.stringify(payload)};g.run('vaRecord_(input)');
  const sheet=g.book.getSheetByName('Website Visits');assert.equal(sheet.getLastRow(),2);
  payload.sequence=3;payload.active_seconds=55;g.context.input.payload=JSON.stringify(payload);g.run('vaRecord_(input)');
  payload.sequence=2;payload.active_seconds=1;g.context.input.payload=JSON.stringify(payload);g.run('vaRecord_(input)');assert.equal(sheet.getLastRow(),2);assert.equal(sheet.data[1][6],55);assert.equal(sheet.data[1][16],3);
  g.context.input.bridge_secret='wrong';assert.throws(()=>g.run('vaRecord_(input)'));
  const dashboard=g.book.getSheetByName('Visitor Dashboard');assert.equal(dashboard.data[1][0],'All recorded visits');assert.equal(dashboard.data.slice(2,9).length,7);assert.equal(dashboard.data[8][0],'Last 365 days');assert.match(dashboard.data[8][5],/=NOW\(\)-365/);assert.match(dashboard.data[1][2],/COUNTUNIQUE/);assert.match(dashboard.data[5][1],/F6/);assert.equal(dashboard.data[5][0],'Last 24 hours');
});
test('Analytics proxy requires configured shared secret and matching origin',async()=>{
  const env=configEnv({newsletter:{google_apps_script_url:endpoint},visitor_analytics:{enabled:true}});
  assert.equal((await handleAnalyticsRequest(post('/api/visitor-analytics',analyticsData()),env)).status,503);
  assert.equal((await handleAnalyticsRequest(post('/api/visitor-analytics',analyticsData(),'https://evil.example'),env)).status,403);
});
test('Free mode disables old API jobs and never calls the WhatsApp API, even with saved credentials',()=>{
  const g=gas(['integrations/Code.gs','integrations/WhatsApp.gs']);g.properties.set('WA_ENABLED','true');
  let removed=0;
  g.context.ScriptApp.getProjectTriggers=()=>[{getHandlerFunction:()=> 'sendPendingEnquiryWhatsApp'},{getHandlerFunction:()=> 'anotherJob'}];
  g.context.ScriptApp.deleteTrigger=()=>removed++;
  g.run('setupFreeWhatsAppMode();sendPendingEnquiryWhatsApp()');
  assert.equal(g.properties.get('WA_ENABLED'),'false');assert.equal(removed,1);
  assert.doesNotMatch(source('integrations/Code.gs'),/waQueue_\(/);
  assert.doesNotMatch(source('integrations/WhatsApp.gs'),/graph\.facebook\.com/);
  assert.doesNotMatch(source('assets/enquiry-popup.js'),/whatsapp_consent/);
});
test('Enquiry SMTP MIME contains each CID image as inline PNG',()=>{
  const context=vm.createContext({crypto:webcrypto,TextEncoder,Uint8Array,btoa,console,Buffer});
  vm.runInContext(source('cloudflare-worker/src/index.js').replace("import { connect } from 'cloudflare:sockets';",'').replace('export default {','const worker = {'),context);
  const gasContext=gas();const branding=gasContext.run('aiEmailFallbackBranding_()');gasContext.context.branding=branding;
  const html=gasContext.run('aiEmailFooterHtml_(branding)');gasContext.context.html=html;
  const inline=gasContext.run('aiEmailInlinePayload_(html)');context.items=inline;context.html=html;
  const result=vm.runInContext('buildMimeBody({html,body:"Confirmation",inlineImages:normalizeInlineImages(items)},null)',context);
  assert.match(result.contentType,/multipart\/related/);
  for(const image of inline)assert.ok(result.body.includes('Content-ID: <'+image.cid+'>'));
  assert.equal(inline.length,9);
});

test('Old SMTP Worker gets public PNG URLs; upgraded Worker receives the matching CID attachments, with one email send',()=>{
  for(const upgraded of [false,true]){
    const g=gas(['integrations/Code.gs']);const sends=[];let health=0;
    g.properties.set('EMAIL_WORKER_URL','https://mail.example/send');g.properties.set('EMAIL_WORKER_TOKEN','private-test');
    g.context.UrlFetchApp.fetch=(url,options)=>{
      assert.equal(options.headers.Authorization,'Bearer private-test');
      if(url.endsWith('/health')){health++;return {getResponseCode:()=>200,getContentText:()=>JSON.stringify(upgraded?{ok:true,protocol:'2026-11-02-inline-v2',features:['inline-social-png']}:{ok:true})};}
      sends.push(JSON.parse(options.payload));return {getResponseCode:()=>200,getContentText:()=>JSON.stringify({success:true})};
    };
    g.run('sendAssurIntellecEmail({recipient:"test@example.com",subject:"Received",body:"Thanks",htmlBody:aiEmailFooterHtml_(aiEmailFallbackBranding_())})');
    assert.equal(health,1);assert.equal(sends.length,1);assert.equal(sends[0].inlineImages.length,upgraded?9:0);
    if(upgraded)assert.match(sends[0].html,/cid:assur_social_instagram/);
    else {assert.doesNotMatch(sends[0].html,/cid:assur_social_/);assert.match(sends[0].html,/images\/email-icons\/whatsapp-channel.png/);}
  }
});
test('Analytics setup preserves existing private secret, makes all-time and 24h formulas, and saves counter snapshot alongside IP',()=>{
  const g=gas();g.properties.set('ANALYTICS_BRIDGE_TOKEN','z'.repeat(40));g.run('setupNewsletterSheet();setupVisitorAnalytics()');
  assert.equal(g.properties.get('ANALYTICS_BRIDGE_TOKEN'),'z'.repeat(40));
  g.context.input={bridge_secret:'z'.repeat(40)};assert.equal(g.run('vaHealth_(input)').ready,true);
  g.context.input.bridge_secret='wrong';assert.equal(g.run('vaHealth_(input)').code,'BRIDGE_AUTH_FAILED');
  const payload=analyticsData();payload.ip='203.0.113.10';payload.counter={total:148170,start_value:148160,new_visits:10};
  g.context.input={bridge_secret:'z'.repeat(40),payload:JSON.stringify(payload)};g.run('vaRecord_(input)');
  const sheet=g.book.getSheetByName('Website Visits'),dash=g.book.getSheetByName('Visitor Dashboard');
  assert.equal(sheet.data[1][7],'203.0.113.10');assert.equal(dash.data[1][10],148170);assert.equal(dash.data[2][10],148160);assert.equal(dash.data[3][10],10);
  assert.match(dash.data[1][1],/COUNTIF\('Website Visits'!A2:A/);
  assert.equal(dash.data[5][0],'Last 24 hours');assert.equal(dash.data[5][5],'=NOW()-1');
  g.run('setupVisitorAnalytics()');assert.equal(dash.data[1][10],148170);
});
test('Analytics public health identifies missing token, stale deployment, mismatched token and ready state without exposing private values',async()=>{
  const env=configEnv({newsletter:{google_apps_script_url:endpoint},visitor_analytics:{enabled:true}});
  const request=new Request('https://www.assurintellec.in/api/visitor-analytics?action=health');
  let result=await (await handleAnalyticsRequest(request,env)).json();assert.equal(result.code,'MISSING_BRIDGE_SECRET');
  env.ANALYTICS_BRIDGE_TOKEN='secret'.repeat(8);const original=globalThis.fetch;
  try{
    for(const [backend,code] of [[{success:true},'UPDATE_GOOGLE_DEPLOYMENT'],[{ready:false,protocol:ANALYTICS_PROTOCOL,code:'BRIDGE_AUTH_FAILED'},'BRIDGE_AUTH_FAILED'],[{ready:true,protocol:ANALYTICS_PROTOCOL},'READY']]){
      globalThis.fetch=async(url,options)=>{assert.equal(options.body.get('action'),'analytics_health');return new Response(JSON.stringify({...backend,ip:'private-ip'}));};
      result=await (await handleAnalyticsRequest(request,env)).json();assert.equal(result.code,code);assert.ok(!JSON.stringify(result).includes('private-ip'));assert.ok(!JSON.stringify(result).includes(env.ANALYTICS_BRIDGE_TOKEN));
    }
  }finally{globalThis.fetch=original;}
});
test('Analytics forwarding ignores forged browser counter totals and uses the existing counter binding without incrementing it',async()=>{
  const env=configEnv({newsletter:{google_apps_script_url:endpoint},visitor_analytics:{enabled:true,collect_ip:true},visitor_counter:{start_value:148160}});env.ANALYTICS_BRIDGE_TOKEN='secret'.repeat(8);
  let counterMethod,recorded;
  env.VISITOR_COUNTER={idFromName:x=>x,get:()=>({fetch:async request=>{counterMethod=request.method;return new Response(JSON.stringify({value:10}));}})};
  const original=globalThis.fetch;globalThis.fetch=async(url,options)=>{recorded=JSON.parse(options.body.get('payload'));return new Response(JSON.stringify({success:true}));};
  try{
    const payload=analyticsData();payload.counter={total:999999999,start_value:0,new_visits:999999999};
    const request=post('/api/visitor-analytics',payload);request.headers.set('cf-connecting-ip','203.0.113.10');
    const response=await handleAnalyticsRequest(request,env);assert.equal(response.status,200);assert.equal(counterMethod,'GET');
    assert.equal(recorded.counter.total,148170);assert.equal(recorded.counter.start_value,148160);assert.equal(recorded.ip,'203.0.113.10');
  }finally{globalThis.fetch=original;}
});
test('Success WhatsApp URL uses submitted fields and reference without executing supplied text',()=>{
  const code=source('assets/site.js');const template=code.slice(code.indexOf('function templateMessage('),code.indexOf('function showToast('));const builder=code.slice(code.indexOf('function buildWhatsAppEnquiryUrl('),code.indexOf('function handleWhatsAppEnquiry('));
  const context=vm.createContext({encodeURIComponent});vm.runInContext(template+builder,context);
  context.site={contact:{whatsapp_phone:'917600666436'}};context.data={name:'Client & Co',company:'Test',email:'test@example.com',phone:'9000000000',service:'GMP',message:'A <script> string\nNext line'};
  const url=new URL(vm.runInContext('buildWhatsAppEnquiryUrl(site,data,"AI-000123")',context));
  assert.equal(url.origin,'https://wa.me');assert.equal(url.pathname,'/917600666436');assert.match(url.searchParams.get('text'),/Name: Client & Co/);assert.match(url.searchParams.get('text'),/Enquiry Reference: AI-000123/);assert.match(url.searchParams.get('text'),/<script>/);
});
test('Scheduled total-counter refresh uses a read-only request and retains the last confirmed total on failure',()=>{
  const g=gas();g.run('setupNewsletterSheet();setupVisitorAnalytics()');let method;
  g.context.UrlFetchApp.fetch=(url,options)=>{assert.equal(url,'https://www.assurintellec.in/api/visitor-count');method=options.method;return {getResponseCode:()=>200,getContentText:()=>JSON.stringify({total:148200,value:40,start_value:148160})};};
  g.run('syncWebsiteCounterSnapshot()');const dash=g.book.getSheetByName('Visitor Dashboard');assert.equal(method,'get');assert.equal(dash.data[1][10],148200);
  g.context.UrlFetchApp.fetch=()=>{throw new Error('offline');};g.run('syncWebsiteCounterSnapshot()');assert.equal(dash.data[1][10],148200);assert.match(dash.data[5][10],/previous confirmed total retained/);
});

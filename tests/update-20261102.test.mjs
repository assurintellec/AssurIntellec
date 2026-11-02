import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { webcrypto } from 'node:crypto';
import { handleNewsletterRequest, NEWSLETTER_PROTOCOL } from '../newsletter-proxy.js';
import { normalizeAnalytics, handleAnalyticsRequest } from '../visitor-analytics.js';
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
  getRange(r,c,rs,cs) {if(typeof r==='string')return new Range(this,1,1);return new Range(this,r,c,rs,cs);}
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
  const dashboard=g.book.getSheetByName('Visitor Dashboard');assert.equal(dashboard.data.slice(1,8).length,7);assert.equal(dashboard.data[7][0],'Last 365 days');assert.match(dashboard.data[7][5],/=NOW\(\)-365/);assert.match(dashboard.data[1][2],/COUNTUNIQUE/);
});
test('Analytics proxy requires configured shared secret and matching origin',async()=>{
  const env=configEnv({newsletter:{google_apps_script_url:endpoint},visitor_analytics:{enabled:true}});
  assert.equal((await handleAnalyticsRequest(post('/api/visitor-analytics',analyticsData()),env)).status,503);
  assert.equal((await handleAnalyticsRequest(post('/api/visitor-analytics',analyticsData(),'https://evil.example'),env)).status,403);
});
test('WhatsApp queues only new rows and consented customer replies; self-alert is rejected before sending',()=>{
  const g=gas(['integrations/Code.gs','integrations/WhatsApp.gs']);g.properties.set('WA_ENABLED','true');
  const sheet=g.book.insertSheet('Enquiries');g.context.sheet=sheet;g.run('ensureSheetHeaders(sheet)');sheet.appendRow(Array(13).fill(''));
  g.run('waQueue_(sheet,2,{whatsappConsent:false})');const headers=g.run('ensureSheetHeaders(sheet)');assert.equal(sheet.data[1][headers['Customer WhatsApp Status']-1],'Not requested');assert.equal(sheet.data[1][headers['Admin WhatsApp Status']-1],'Pending');
  for(const [key,value] of Object.entries({WA_API_VERSION:'v99.0',WA_PHONE_NUMBER_ID:'12345678',WA_ACCESS_TOKEN:'x'.repeat(40),WA_SENDER_NUMBER:'917600666436'}))g.properties.set(key,value);
  assert.throws(()=>g.run('waSend_(PropertiesService.getScriptProperties(),"917600666436",true,[])'),/DIFFERENT/);
  const payload=g.run('waPayload_("7600666436","assurintellec_enquiry_received","en",["Client","AI000001","GMP"])');assert.equal(payload.to,'917600666436');assert.equal(payload.type,'template');assert.equal(payload.template.components[0].parameters.length,3);
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

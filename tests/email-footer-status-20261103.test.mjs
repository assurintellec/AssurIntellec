import test from 'node:test';
import assert from 'node:assert/strict';
import { handleEmailFooterStatus, EMAIL_FOOTER_VERSION } from '../email-footer-status.js';
const endpoint=id=>'https://script.google.com/macros/s/'+id+'/exec';
const env=site=>({ASSETS:{fetch:async()=>new Response(JSON.stringify(site))}});
const request=()=>new Request('https://www.assurintellec.in/api/email-footer-status');
const config={contact:{google_apps_script_url:endpoint('enquiry').replace('/macros/s/','/macros/u/8/s/')},newsletter:{google_apps_script_url:endpoint('newsletter')}};
const metadata=service=>({service,footer:{version:EMAIL_FOOTER_VERSION,rows:3,columns:3,icons:9,visible_labels:false},private_field:'must-not-leak'});
test('Read-only checks identify both updated deployments and strip private response fields',async()=>{
 const original=globalThis.fetch,calls=[];globalThis.fetch=async(url,options)=>{calls.push({url,options});return new Response(JSON.stringify(metadata(url.includes('/enquiry/')?'assurintellec-enquiry':'assurintellec-newsletter')));};
 try{
  const response=await handleEmailFooterStatus(request(),env(config));const body=await response.json();
  assert.equal(body.ready,true);assert.equal(body.enquiry.ready,true);assert.equal(body.newsletter.ready,true);assert.equal(calls.length,2);
  for(const call of calls){assert.match(call.url,/^https:\/\/script\.google\.com\/macros\/s\/\w+\/exec\?action=email_footer_status$/);assert.equal(call.options.method,'GET');assert.equal(call.options.body,undefined);assert.equal(call.options.headers.Cookie,undefined);assert.equal(call.options.headers.Authorization,undefined);}
  assert.doesNotMatch(JSON.stringify(body),/must-not-leak|private_field|script.google/);assert.equal(response.headers.get('cache-control'),'no-store');
 }finally{globalThis.fetch=original;}
});
test('An old HTML deployment is flagged without claiming the mail template is updated',async()=>{
 const original=globalThis.fetch;globalThis.fetch=async url=>new Response(url.includes('/enquiry/')?'<html>Old bridge and private text</html>':JSON.stringify(metadata('assurintellec-newsletter')));
 try{const body=await(await handleEmailFooterStatus(request(),env(config))).json();assert.equal(body.ready,false);assert.equal(body.enquiry.code,'UPDATE_WEB_APP_DEPLOYMENT');assert.equal(body.newsletter.ready,true);assert.doesNotMatch(JSON.stringify(body),/private text/);}finally{globalThis.fetch=original;}
});
test('Missing or arbitrary external script URLs are rejected without fetching them',async()=>{
 const original=globalThis.fetch;let calls=0;globalThis.fetch=async()=>{calls++;throw new Error('must not fetch');};
 try{const body=await(await handleEmailFooterStatus(request(),env({contact:{google_apps_script_url:'https://attacker.example/exec'},newsletter:{}}))).json();assert.equal(calls,0);assert.equal(body.enquiry.code,'CHECK_CONFIGURED_URL');assert.equal(body.newsletter.code,'CHECK_CONFIGURED_URL');}finally{globalThis.fetch=original;}
});
test('Mutations are refused; unavailable or mismatched backends do not report readiness',async()=>{
 const denied=await handleEmailFooterStatus(new Request(request(),{method:'POST'}),{ASSETS:{fetch(){throw new Error('should not access')}}});assert.equal(denied.status,405);
 const original=globalThis.fetch;globalThis.fetch=async url=>{if(url.includes('/enquiry/'))throw new Error('network failure');return new Response(JSON.stringify({...metadata('assurintellec-newsletter'),footer:{version:EMAIL_FOOTER_VERSION,rows:1,columns:9,icons:9,visible_labels:true}}));};
 try{const body=await(await handleEmailFooterStatus(request(),env(config))).json();assert.equal(body.ready,false);assert.equal(body.enquiry.code,'CHECK_WEB_APP_DEPLOYMENT');assert.equal(body.newsletter.code,'UPDATE_WEB_APP_DEPLOYMENT');}finally{globalThis.fetch=original;}
});

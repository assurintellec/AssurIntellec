import fs from 'node:fs';
const read = name => fs.readFileSync(new URL('../' + name, import.meta.url), 'utf8');
const enquiry = read('integrations/Code.gs');
const newsletter = read('integrations/newsletter/Code.gs');
const part = (source, start, end) => source.slice(source.indexOf(start), source.indexOf(end)).trim();
const grid = source => part(source, 'function aiEmailSocialGrid_(', 'function aiEmailFooterHtml_(');
if (grid(enquiry) !== grid(newsletter)) throw new Error('Email grids differ between the two Apps Script projects.');
const source = [
  part(enquiry, 'function aiEmailFallbackBranding_(', 'function aiEmailFetchBranding_('),
  part(enquiry, 'function aiEmailSocialGrid_(', '// Bundled PNG bytes:'),
  part(enquiry, 'function aiEmailIconCid_(', 'function aiEmailInlinePayload_(')
].join('\n');
const output = `/* Generated from the actual Apps Script HTML. Rebuild with scripts/build_email_footer_preview.mjs. */
(function(root){'use strict';
${source}
root.AssurEmailPreview={version:'2026-11-03-icons-only-v4',render:function(site){
  const branding=aiEmailBrandingFromSite_(site||{});
  let logo=branding.logoUrl;
  try {const image=new URL(logo);if(image.origin===new URL(branding.website).origin)logo=image.pathname+image.search;}catch(_){}
  return aiEmailFooterHtml_(branding,logo).replace(/cid:assur_social_([a-z_]+)/g,function(_,key){return '/images/email-icons/'+key.replace(/_/g,'-')+'.png?v=20261103-doc10';});
}};
})(window);
`;
fs.writeFileSync(new URL('../assets/email-footer-preview.js', import.meta.url), output);
console.log('Email preview generated from matching enquiry/newsletter HTML.');

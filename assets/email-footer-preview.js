/* Generated from the actual Apps Script HTML. Rebuild with scripts/build_email_footer_preview.mjs. */
(function(root){'use strict';
function aiEmailFallbackBranding_() {
  const branding = {"companyName": "AssurIntellec™", "tagline": "Intelligent Solutions, Assured Compliance.", "website": "https://www.assurintellec.in", "websiteDisplay": "www.assurintellec.in", "phone": "+91 7600 666 436", "mobilePhone": "7405660185", "email": "info@assurintellec.in", "address": "478, Surbhi The Royal Town, Navagam, Kamrej, Surat-394185", "logoUrl": "https://www.assurintellec.in/images/uploads/logo_transparent_png_tm.png"};
  branding.social = aiEmailSocialItems_([{"key": "instagram", "label": "Instagram", "url": "https://www.instagram.com/assurintellec?utm_source=qr&igsi=MW43Z3M2anZpbHo1", "icon": "fa-brands fa-instagram", "class_name": "social-instagram", "enabled": true, "header_color": "#E4405F", "footer_color": "#E4405F"}, {"key": "facebook", "label": "Facebook", "url": "https://www.facebook.com/Intellegentsolution", "icon": "fa-brands fa-facebook-f", "class_name": "social-facebook", "enabled": true, "header_color": "#1877F2", "footer_color": "#1877F2"}, {"key": "linkedin", "label": "LinkedIn", "url": "https://www.linkedin.com/in/assurintellec", "icon": "fa-brands fa-linkedin-in", "class_name": "social-linkedin", "enabled": true, "header_color": "#0A66C2", "footer_color": "#0A66C2"}, {"key": "youtube", "label": "YouTube", "url": "https://www.youtube.com/@AssurIntellec", "icon": "fa-brands fa-youtube", "class_name": "social-youtube", "enabled": true, "header_color": "#FF0000", "footer_color": "#FF0000"}, {"key": "whatsapp-channel", "label": "WhatsApp Channel", "url": "https://whatsapp.com/channel/0029VbDxVgXFCCoU5fxRbo25", "icon": "fa-brands fa-whatsapp", "class_name": "social-whatsapp-channel", "enabled": true, "header_color": "#25D366", "footer_color": "#25D366"}, {"key": "telegram", "label": "Telegram Channel", "url": "https://t.me/assurintellec", "icon": "fa-brands fa-telegram", "class_name": "social-telegram", "enabled": true, "header_color": "#0088cc", "footer_color": "#0088cc"}, {"key": "threads", "label": "Threads", "url": "https://www.threads.com/@assurintellec", "icon": "fa-brands fa-threads", "class_name": "social-threads", "enabled": true, "header_color": "#111111", "footer_color": "#FFFFFF"}, {"key": "x", "label": "X", "url": "https://x.com/AssurIntellec", "icon": "fa-brands fa-x-twitter", "class_name": "social-x", "enabled": true, "header_color": "#111111", "footer_color": "#FFFFFF"}, {"key": "google", "label": "Google", "url": "https://share.google/BDZ7i6bRNwF4qLD3S", "icon": "fa-brands fa-google", "class_name": "social-google", "enabled": true, "header_color": "#4285F4", "footer_color": "#4285F4"}]);
  return branding;
}
// Shared footer code is included in each independent Apps Script project.
function aiEmailEscape_(value) {
  return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function aiEmailSafeUrl_(value) { return /^https:\/\/[^\s<>"']+$/i.test(String(value || '')) ? String(value) : ''; }
function aiEmailSocialItems_(items) {
  const known = ['instagram', 'facebook', 'linkedin', 'youtube', 'whatsapp-channel', 'telegram', 'threads', 'x', 'google'];
  return (Array.isArray(items) ? items : []).filter(item => item && item.enabled !== false && known.indexOf(item.key) >= 0 && aiEmailSafeUrl_(item.url))
    .map(item => ({ key: item.key, label: String(item.label || item.key), url: aiEmailSafeUrl_(item.url), iconUrl: 'https://www.assurintellec.in/images/email-icons/' + item.key + '.png' }));
}
function aiEmailBrandingFromSite_(site) {
  const fallback = aiEmailFallbackBranding_();
  const contact = site.contact || {};
  const logo = String(site.media_assets?.logo || '').trim();
  return {
    companyName: String(site.company_name || fallback.companyName), tagline: String(site.tagline || fallback.tagline),
    website: aiEmailSafeUrl_(contact.website) || fallback.website,
    websiteDisplay: String(contact.website_display || fallback.websiteDisplay),
    phone: String(contact.phone || fallback.phone), mobilePhone: String(contact.mobile_phone || fallback.mobilePhone),
    email: String(contact.email || fallback.email),
    address: String(contact.address_display || [contact.address_line_1, contact.address_line_2, contact.address_city, contact.address_region, contact.address_postal_code, contact.address_country].filter(Boolean).join(', ') || fallback.address),
    logoUrl: aiEmailSafeUrl_(logo) || (logo.startsWith('/') ? 'https://www.assurintellec.in' + logo : fallback.logoUrl),
    social: Array.isArray(site.social?.items) ? aiEmailSocialItems_(site.social.items) : fallback.social
  };
}
function aiEmailSocialGrid_(items) {
  const e = aiEmailEscape_;
  const visible = (items || []).slice(0, 9);
  const rows = [];
  for (let i = 0; i < visible.length; i += 3) {
    const cells = visible.slice(i, i + 3).map(function (item) {
      return '<td width="72" align="center" valign="middle" style="width:72px;padding:6px 10px 6px 0"><a href="' + e(item.url) + '" target="_blank" title="Open ' + e(item.label) + '" aria-label="Open ' + e(item.label) + '" style="display:inline-block;text-decoration:none"><img src="cid:' + e(aiEmailIconCid_(item.key)) + '" alt="" role="presentation" width="48" height="48" style="display:block;width:48px;height:48px;border:0;outline:none;text-decoration:none;font-size:0;line-height:0;color:transparent"></a></td>';
    });
    while (cells.length < 3) cells.push('<td width="72" style="width:72px;padding:6px 10px 6px 0"></td>');
    rows.push('<tr>' + cells.join('') + '</tr>');
  }
  return rows.length ? '<table role="presentation" class="assur-social-grid" data-footer-version="2026-11-03-icons-only-v4" width="216" cellspacing="0" cellpadding="0" border="0" style="width:216px;border-collapse:collapse;table-layout:fixed">' + rows.join('') + '</table>' : '';
}
function aiEmailFooterHtml_(branding, logoSource) {
  const e = aiEmailEscape_;
  const logo = logoSource || aiEmailSafeUrl_(branding.logoUrl);
  const social = aiEmailSocialGrid_(branding.social || []);
  const phone = String(branding.phone || '').replace(/[^+0-9]/g, '');
  const mobile = String(branding.mobilePhone || '').replace(/[^+0-9]/g, '');
  return '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f9fc;border-top:3px solid #c9a227"><tr><td style="padding:26px 28px;line-height:1.7;font-family:Arial,Helvetica,sans-serif">' +
    '<p style="margin:0 0 14px;font-size:13px;color:#52657a">Warm regards,</p>' +
    (logo ? '<a href="' + e(branding.website) + '" style="display:inline-block;text-decoration:none"><img src="' + e(logo) + '" alt="' + e(branding.companyName) + '" width="130" style="width:130px;max-width:100%;height:auto;border:0;display:block;margin:0 0 12px"></a>' : '') +
    '<p style="margin:0;font-size:18px;font-weight:bold;color:#0b1f3a">' + e(branding.companyName) + '</p>' +
    '<p style="margin:2px 0 14px;font-size:12px;color:#796219">' + e(branding.tagline) + '</p>' +
    '<p style="margin:0 0 4px;font-size:12px;color:#52657a">' + e(branding.address) + '</p>' +
    '<p style="margin:0;font-size:13px;color:#34495f"><strong>Office</strong> <a href="tel:' + e(phone) + '" style="color:#123f73;text-decoration:none">' + e(branding.phone) + '</a>' +
    (mobile ? ' &nbsp; | &nbsp; <strong>Mobile</strong> <a href="tel:' + e(mobile) + '" style="color:#123f73;text-decoration:none">' + e(branding.mobilePhone) + '</a>' : '') + '</p>' +
    '<p style="margin:2px 0 16px;font-size:13px"><a href="mailto:' + e(branding.email) + '" style="color:#123f73;text-decoration:none">' + e(branding.email) + '</a><br><a href="' + e(branding.website) + '" style="color:#123f73;text-decoration:none;font-weight:bold">' + e(branding.websiteDisplay) + '</a></p>' +
    (social ? '<p style="margin:0 0 9px;font-size:10px;font-weight:bold;letter-spacing:1.4px;color:#52657a;text-transform:uppercase">Connect with AssurIntellec</p><div style="font-size:0;line-height:1">' + social + '</div>' : '') +
    '</td></tr></table>';
}
function aiEmailIconCid_(key) { return 'assur_social_' + String(key).replace(/-/g, '_'); }
root.AssurEmailPreview={version:'2026-11-03-icons-only-v4',render:function(site){
  const branding=aiEmailBrandingFromSite_(site||{});
  let logo=branding.logoUrl;
  try {const image=new URL(logo);if(image.origin===new URL(branding.website).origin)logo=image.pathname+image.search;}catch(_){}
  return aiEmailFooterHtml_(branding,logo).replace(/cid:assur_social_([a-z_]+)/g,function(_,key){return '/images/email-icons/'+key.replace(/_/g,'-')+'.png?v=20261103-doc10';});
}};
})(window);

/* For an existing newsletter, replace Code.gs in its SAME Apps Script project,
   run setupNewsletterEmail, then update the SAME web-app deployment.
   Keep the existing enquiry script separate. */
const NL_SHEET_NAME = 'NewsletterSubscribers';
const NL_SHEET_PROPERTY = 'ASSURINTELLEC_NEWSLETTER_SHEET_ID';
const NL_ORIGINS = ['https://www.assurintellec.in', 'https://assurintellec.in'];
const NL_EMAIL = {
  senderName: 'AssurIntellec™',
  replyTo: 'info@assurintellec.in',
  subject: 'Thank you for subscribing to AssurIntellec™',
  website: 'https://www.assurintellec.in'
};
const NL_INTERESTS = {
  all: 'All service updates',
  'gmp-engineering': 'GMP Engineering & Compliance',
  'advisory-transactions': 'Advisory & Transactions',
  'talent-recruitment': 'Talent & Recruitment',
  'life-sciences-trade': 'Life Sciences Trade',
  'pharma-laboratory-technologies': 'Pharma & Laboratory Technologies',
  'research-scientific-services': 'Research & Scientific Services',
  'pharma-solutions-manufacturing': 'Pharma Solutions & Manufacturing'
};
const NL_BASE_HEADERS = ['Subscribed At', 'Email', 'Service Interest', 'Status', 'Last Updated', 'Consent', 'Consent Version', 'Source Page', 'Unsubscribe URL', 'Unsubscribe Token'];
const NL_HEADERS = NL_BASE_HEADERS.concat(['Welcome Email Status', 'Welcome Email Sent At', 'Welcome Email Error']);

/** Run ONCE from the Apps Script editor, before deploying the web app. */
function setupNewsletterSheet() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  if (!book) throw new Error('Open this script from your newsletter Google Sheet: Extensions > Apps Script.');
  PropertiesService.getScriptProperties().setProperty(NL_SHEET_PROPERTY, book.getId());
  let sheet = book.getSheetByName(NL_SHEET_NAME);
  if (!sheet) sheet = book.insertSheet(NL_SHEET_NAME);
  if (sheet.getMaxColumns() < NL_HEADERS.length) sheet.insertColumnsAfter(sheet.getMaxColumns(), NL_HEADERS.length - sheet.getMaxColumns());
  if (!sheet.getLastRow()) sheet.getRange(1, 1, 1, NL_HEADERS.length).setValues([NL_HEADERS]);
  // Append tracking columns to the old ten-column sheet without changing its data.
  const headers = sheet.getRange(1, 1, 1, NL_HEADERS.length).getValues()[0];
  if (NL_BASE_HEADERS.some((name, index) => String(headers[index] || '') !== name)) throw new Error('Newsletter column headers do not match. Keep the setup-generated headers unchanged.');
  if (headers.slice(10).every(value => !value)) {
    // Never send a surprise email to the already collected list during upgrade.
    if (sheet.getLastRow() > 1) {
      const tracking = sheet.getRange(2, 11, sheet.getLastRow() - 1, 3).getValues();
      if (tracking.some(row => row.some(value => value !== ''))) throw new Error('Columns K:M already contain data. Move that data before running setup.');
      sheet.getRange(2, 11, tracking.length, 3).setValues(tracking.map(() => ['Skipped (existing subscriber)', '', '']));
    }
    sheet.getRange(1, 11, 1, 3).setValues([NL_HEADERS.slice(10)]);
  }
  nlCheckHeaders_(sheet);
  book.setSpreadsheetTimeZone('Asia/Kolkata');
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, NL_HEADERS.length).setFontWeight('bold').setBackground('#0b1f3a').setFontColor('#ffffff');
  sheet.getRange('A:A').setNumberFormat('dd-mmm-yyyy hh:mm:ss');
  sheet.getRange('E:E').setNumberFormat('dd-mmm-yyyy hh:mm:ss');
  sheet.getRange('B:D').setNumberFormat('@');
  sheet.getRange('F:K').setNumberFormat('@');
  sheet.getRange('L:L').setNumberFormat('dd-mmm-yyyy hh:mm:ss');
  sheet.getRange('M:M').setNumberFormat('@');
  sheet.autoResizeColumns(1, NL_HEADERS.length);
  sheet.hideColumns(10);
  const filter = sheet.getFilter();
  if (filter && filter.getRange().getNumColumns() < NL_HEADERS.length) filter.remove();
  if (!sheet.getFilter()) sheet.getRange(1, 1, sheet.getMaxRows(), NL_HEADERS.length).createFilter();
  SpreadsheetApp.flush();
  console.log('NewsletterSubscribers is ready in your Google account. Deploy this script as a web app next.');
}

/** Run once after pasting this update. Authorizes mail and installs one retry job.
    This setup function does NOT send emails to existing subscribers. */
function setupNewsletterEmail() {
  setupNewsletterSheet();
  refreshNewsletterUnsubscribeLinks();
  const remaining = MailApp.getRemainingDailyQuota();
  const exists = ScriptApp.getProjectTriggers().some(trigger => trigger.getHandlerFunction() === 'retryPendingNewsletterEmails');
  if (!exists) ScriptApp.newTrigger('retryPendingNewsletterEmails').timeBased().everyHours(1).create();
  console.log('Newsletter email is ready. Remaining recipient quota today: ' + remaining + '. Now deploy a new version of the SAME web app.');
}

/** Replace old Google-facing links in column I; retain every token and status. */
function refreshNewsletterUnsubscribeLinks() {
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const sheet = nlGetSheet_();
    if (sheet.getLastRow() < 2) return;
    const rows = sheet.getRange(2, 9, sheet.getLastRow() - 1, 2).getValues();
    sheet.getRange(2, 9, rows.length, 1).setValues(rows.map(row => [/^[a-f0-9]{64}$/.test(String(row[1] || '')) ? nlUnsubscribeUrl_(row[1]) : row[0]]));
    SpreadsheetApp.flush();
  } finally { lock.releaseLock(); }
}

function nlUnsubscribeUrl_(token) {
  return NL_EMAIL.website.replace(/\/$/, '') + '/unsubscribe.html#token=' + encodeURIComponent(String(token));
}

/** The hourly trigger sends only pending welcome messages to Active subscribers. */
function retryPendingNewsletterEmails() {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sheet = nlGetSheet_();
    const rows = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, NL_HEADERS.length).getValues() : [];
    let attempts = 0;
    for (let i = 0; i < rows.length && attempts < 20; i++) {
      if (rows[i][10] !== 'Pending') continue;
      if (rows[i][3] !== 'Active') {
        sheet.getRange(i + 2, 11).setValue('Cancelled (unsubscribed)');
        continue;
      }
      attempts++;
      if (!nlSendWelcome_(sheet, i + 2, rows[i])) break;
    }
  } finally { lock.releaseLock(); }
}

function doGet(e) {
  const data = e && e.parameter ? e.parameter : {};
  if (data.action === 'unsubscribe') {
    const token = String(data.token || '');
    if (!/^[a-f0-9]{64}$/.test(token)) return nlPage_('Invalid link', 'Please use the unsubscribe link supplied with your subscription.');
    return nlPage_('Unsubscribe from updates', 'Choose Unsubscribe below to stop receiving AssurIntellec service updates.',
      '<p><a target="_top" href="' + nlEscape_(nlUnsubscribeUrl_(token)) + '">Continue to the secure unsubscribe page on our website</a></p>');
  }
  let ready = false;
  try { nlGetSheet_(); ready = true; } catch (_) {}
  return nlPage_('AssurIntellec Newsletter', ready ? 'The subscription endpoint is ready. Subscribers can join through www.assurintellec.in.' : 'Setup is not complete. Run setupNewsletterSheet in the Apps Script editor.');
}

function doPost(e) {
  const data = e && e.parameter ? e.parameter : {};
  let result;
  if (data.action === 'unsubscribe') {
    try {
      if (data._bridge_format && NL_ORIGINS.indexOf(String(data._bridge_origin || '')) === -1) throw new Error('Use the unsubscribe page on the AssurIntellec website.');
      nlUnsubscribe_(data.token);
      result = { success: true, message: 'You have been unsubscribed from service updates.' };
    } catch (error) { result = { success: false, message: error.message || 'Please contact info@assurintellec.in.' }; }
    if (!data._bridge_format) return nlPage_(result.success ? 'You have been unsubscribed' : 'Unable to unsubscribe', result.message);
  } else {
    try { result = nlSaveSubscriber_(data); }
    catch (error) { console.error(error); result = { success: false, message: error.message || 'Your subscription could not be saved.' }; }
  }
  if (String(data._bridge_format || '') !== 'html') {
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  }
  const origin = String(data._bridge_origin || '');
  if (NL_ORIGINS.indexOf(origin) === -1) return nlPage_('Invalid origin', 'Please subscribe from the AssurIntellec website.');
  const response = JSON.stringify({ type: 'assurintellec:newsletter:result', token: String(data._bridge_token || ''), result: result })
    .replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  const html = '<!doctype html><html><head><meta charset="utf-8"></head><body><script>window.top.postMessage(' + response + ',' + JSON.stringify(origin) + ');</script></body></html>';
  return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function nlSaveSubscriber_(data) {
  if (data.action !== 'subscribe') throw new Error('Invalid subscription request.');
  if (String(data.company_site_confirm || '').trim()) throw new Error('Your subscription could not be accepted.');
  const email = String(data.email || '').trim().toLowerCase();
  const interest = String(data.interest || '').trim();
  if (!nlIsEmail_(email)) throw new Error('Enter a valid email address.');
  if (!Object.prototype.hasOwnProperty.call(NL_INTERESTS, interest)) throw new Error('Choose an available service interest.');
  if (String(data.consent || '') !== 'yes') throw new Error('Please agree to receive the selected updates.');
  const origin = String(data._bridge_origin || '');
  if (NL_ORIGINS.indexOf(origin) === -1) throw new Error('Subscribe from the AssurIntellec website.');
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sheet = nlGetSheet_();
    const rows = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, NL_HEADERS.length).getValues() : [];
    const index = rows.findIndex(row => String(row[1] || '').replace(/^'/, '').trim().toLowerCase() === email);
    const previous = index >= 0 ? rows[index] : null;
    const now = new Date();
    const token = previous && /^[a-f0-9]{64}$/.test(String(previous[9] || '')) ? String(previous[9]) : Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
    const source = String(data.source_page || '/').slice(0, 200);
    const welcomeDue = !previous || previous[3] !== 'Active';
    const tracking = welcomeDue ? ['Pending', '', ''] : [previous[10] || 'Skipped (existing subscriber)', previous[11] || '', previous[12] || ''];
    const row = [previous ? previous[0] : now, nlCell_(email), NL_INTERESTS[interest], 'Active', now, 'Yes', 'newsletter-v1', nlCell_(source), nlUnsubscribeUrl_(token), token].concat(tracking);
    const rowNumber = index >= 0 ? index + 2 : sheet.getLastRow() + 1;
    if (index >= 0) sheet.getRange(rowNumber, 1, 1, NL_HEADERS.length).setValues([row]);
    else sheet.appendRow(row);
    SpreadsheetApp.flush();
    if (row[10] === 'Pending') nlSendWelcome_(sheet, rowNumber, row);
    return { success: true, message: 'Your subscription and selected interest have been saved.' };
  } finally { lock.releaseLock(); }
}

// Called with the script lock held. Email failure never loses a saved subscription.
function nlSendWelcome_(sheet, rowNumber, row) {
  try {
    if (row[3] !== 'Active' || row[10] !== 'Pending') return true;
    const email = String(row[1] || '').replace(/^'/, '').trim();
    if (!nlIsEmail_(email)) throw new Error('The subscriber email is invalid.');
    if (!/^[a-f0-9]{64}$/.test(String(row[9] || ''))) throw new Error('The unsubscribe token is missing.');
    const unsubscribe = nlUnsubscribeUrl_(row[9]);
    sheet.getRange(rowNumber, 9).setValue(unsubscribe);
    if (MailApp.getRemainingDailyQuota() < 1) throw new Error('Daily email quota reached. The hourly job will retry.');
    const branding = aiEmailFetchBranding_();
    const interest = String(row[2] || 'All service updates');
    const body = 'Thank you for subscribing to AssurIntellec™!\n\n' +
      'Your subscription is active. Your selected updates: ' + interest + '.\n\n' +
      'We look forward to sharing service news, insights and opportunities with you.\n\n' +
      'Visit our website: ' + NL_EMAIL.website + '\n' +
      'Questions? Reply to ' + NL_EMAIL.replyTo + '.\n\n' +
      'You received this email because you subscribed on our website. To stop receiving updates, open your personal link and confirm Unsubscribe:\n' + unsubscribe + '\n\n' +
      aiEmailFooterText_(branding);
    const htmlBody = '<!doctype html><html><body style="margin:0;background:#f4f7fb;color:#233247;font-family:Arial,sans-serif">' +
      '<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="padding:28px 16px">' +
      '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:auto;background:#ffffff;border:1px solid #dce5ee;border-radius:14px">' +
      '<tr><td style="padding:24px 28px;background:#0b1f3a;color:#e6cb76;font-size:23px;font-weight:bold;border-radius:14px 14px 0 0">AssurIntellec™</td></tr>' +
      '<tr><td style="padding:28px;line-height:1.7"><h1 style="margin:0 0 16px;color:#0b1f3a;font-size:25px">Thank you for subscribing!</h1>' +
      '<p>Your subscription is active. We look forward to sharing service news, insights and opportunities with you.</p>' +
      '<p style="padding:14px 16px;background:#f4f7fb;border-left:3px solid #c9a227"><strong>Your selected updates</strong><br>' + nlEscape_(interest) + '</p>' +
      '<p><a href="' + nlEscape_(NL_EMAIL.website) + '" style="color:#123f73;font-weight:bold">Visit our website</a></p>' +
      '<p>Questions? Reply to <a href="mailto:' + nlEscape_(NL_EMAIL.replyTo) + '" style="color:#123f73">' + nlEscape_(NL_EMAIL.replyTo) + '</a>.</p>' +
      '<hr style="border:0;border-top:1px solid #dce5ee;margin:24px 0"><p style="font-size:12px;color:#627287">You received this email because you subscribed on our website. ' +
      '<a href="' + nlEscape_(unsubscribe) + '" style="color:#123f73;text-decoration:underline">Unsubscribe from updates</a>. Open the link and confirm Unsubscribe to stop future updates.</p>' +
      '</td></tr><tr><td>' + aiEmailFooterHtml_(branding) + '</td></tr></table></td></tr></table></body></html>';
    MailApp.sendEmail({ to: email, subject: NL_EMAIL.subject, body: body, htmlBody: htmlBody, name: NL_EMAIL.senderName, replyTo: NL_EMAIL.replyTo });
    sheet.getRange(rowNumber, 11, 1, 3).setValues([['Sent', new Date(), '']]);
    SpreadsheetApp.flush();
    return true;
  } catch (error) {
    console.error('Newsletter welcome email: ' + (error.message || 'Delivery failed.'));
    sheet.getRange(rowNumber, 11, 1, 3).setValues([['Pending', row[11] || '', nlCell_(String(error.message || 'Delivery failed.').slice(0, 500))]]);
    SpreadsheetApp.flush();
    return false;
  }
}

function nlUnsubscribe_(token) {
  token = String(token || '');
  if (!/^[a-f0-9]{64}$/.test(token)) throw new Error('Invalid unsubscribe link.');
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sheet = nlGetSheet_();
    const rows = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, NL_HEADERS.length).getValues() : [];
    const index = rows.findIndex(row => String(row[9]) === token);
    if (index < 0) throw new Error('This subscription was not found. Please contact info@assurintellec.in.');
    sheet.getRange(index + 2, 4).setValue('Unsubscribed');
    sheet.getRange(index + 2, 5).setValue(new Date());
    if (rows[index][10] === 'Pending') sheet.getRange(index + 2, 11, 1, 3).setValues([['Cancelled (unsubscribed)', '', '']]);
    SpreadsheetApp.flush();
  } finally { lock.releaseLock(); }
}

function nlGetSheet_() {
  const id = PropertiesService.getScriptProperties().getProperty(NL_SHEET_PROPERTY);
  if (!id) throw new Error('Newsletter setup is incomplete. Please try again later.');
  const sheet = SpreadsheetApp.openById(id).getSheetByName(NL_SHEET_NAME);
  if (!sheet) throw new Error('The newsletter sheet is missing. Please contact the website team.');
  nlCheckHeaders_(sheet);
  return sheet;
}
function nlCheckHeaders_(sheet) {
  const headers = sheet.getRange(1, 1, 1, NL_HEADERS.length).getValues()[0];
  if (NL_HEADERS.some((name, index) => String(headers[index] || '') !== name)) throw new Error('Newsletter column headers do not match. Keep the setup-generated headers unchanged.');
}
function nlIsEmail_(email) {
  return email.length <= 254 && /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i.test(email) && !email.split('@')[0].startsWith('.') && !email.split('@')[0].endsWith('.') && !email.split('@')[0].includes('..');
}
function nlCell_(value) { const s = String(value || ''); return /^[=+\-@]/.test(s) ? "'" + s : s; }
function nlEscape_(value) { return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
function nlPage_(title, message, extra) {
  return HtmlService.createHtmlOutput('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + nlEscape_(title) + '</title><style>body{margin:0;padding:32px;font-family:Arial,sans-serif;background:#f4f7fb;color:#233247}main{max-width:560px;margin:40px auto;background:white;border:1px solid #dce5ee;border-radius:18px;padding:32px;line-height:1.7}h1{font-size:24px;color:#0b1f3a}button{padding:12px 20px;background:#0b1f3a;color:white;border:0;border-radius:8px;font-weight:bold;cursor:pointer}</style></head><body><main><strong>AssurIntellec™</strong><h1>' + nlEscape_(title) + '</h1><p>' + nlEscape_(message) + '</p>' + (extra || '') + '</main></body></html>');
}


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
function aiEmailFetchBranding_() {
  try {
    const response = UrlFetchApp.fetch('https://www.assurintellec.in/content/site.json', { muteHttpExceptions: true });
    if (response.getResponseCode() === 200) return aiEmailBrandingFromSite_(JSON.parse(response.getContentText()));
  } catch (_) {}
  return aiEmailFallbackBranding_();
}
function aiEmailFooterText_(branding) {
  return ['Warm regards,', branding.companyName, branding.tagline, branding.websiteDisplay,
    'Office: ' + branding.phone, branding.mobilePhone ? 'Mobile: ' + branding.mobilePhone : '', branding.email, branding.address,
    '', 'Connect with AssurIntellec', ...(branding.social || []).map(item => item.label + ': ' + item.url)].filter(Boolean).join('\n');
}
function aiEmailFooterHtml_(branding, logoSource) {
  const e = aiEmailEscape_;
  const logo = logoSource || aiEmailSafeUrl_(branding.logoUrl);
  const social = (branding.social || []).map(item => '<a href="' + e(item.url) + '" target="_blank" title="' + e(item.label) + '" style="display:inline-block;margin:0 8px 8px 0;text-decoration:none"><img src="' + e(item.iconUrl) + '" alt="' + e(item.label) + '" width="36" height="36" style="display:block;border:0;border-radius:8px;width:36px;height:36px"></a>').join('');
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

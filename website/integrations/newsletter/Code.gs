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
  if (data.action === 'health') {
    let ready = false;
    try { nlGetSheet_(); ready = true; } catch (_) {}
    return ContentService.createTextOutput(JSON.stringify({ service: 'assurintellec-newsletter', protocol: '2026-10-30-v2', ready: ready, features: ['confirmed-unsubscribe', 'embedded-social-icons'] })).setMimeType(ContentService.MimeType.JSON);
  }
  if (data.action === 'unsubscribe') {
    const token = String(data.token || '');
    if (!/^[a-f0-9]{64}$/.test(token)) return nlPage_('Invalid link', 'Please use the unsubscribe link supplied with your subscription.');
    // Old emails can complete the request here. Do not loop back to a website
    // whose Worker may not yet be installed; opening GET still changes nothing.
    const action = String(ScriptApp.getService().getUrl() || '').replace(/\/macros\/u\/\d+\/s\//, '/macros/s/');
    if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(action)) return nlPage_('Unsubscribe from updates', 'Open your personal website link to continue.', '<a target="_top" href="' + nlEscape_(nlUnsubscribeUrl_(token)) + '">Open unsubscribe page</a>');
    return nlPage_('Unsubscribe from updates', 'Select Unsubscribe to stop receiving AssurIntellec service updates.',
      '<form method="post" action="' + nlEscape_(action) + '" target="_top"><input type="hidden" name="action" value="unsubscribe"><input type="hidden" name="token" value="' + nlEscape_(token) + '"><button type="submit">Unsubscribe</button></form>');
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
    const htmlBody = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Thank you for subscribing</title></head><body style="margin:0;background:#f4f7fb;color:#233247;font-family:Arial,sans-serif">' +
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
    MailApp.sendEmail({ to: email, subject: NL_EMAIL.subject, body: body, htmlBody: htmlBody, inlineImages: aiEmailInlineBlobs_(htmlBody), name: NL_EMAIL.senderName, replyTo: NL_EMAIL.replyTo });
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
    if (rows[index][3] !== 'Unsubscribed') {
      sheet.getRange(index + 2, 4).setValue('Unsubscribed');
      sheet.getRange(index + 2, 5).setValue(new Date());
    }
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
  const social = (branding.social || []).map(item => '<a href="' + e(item.url) + '" target="_blank" title="Open ' + e(item.label) + '" style="display:inline-block;margin:0 14px 12px 0;text-decoration:none;color:#123f73;font:600 12px Arial,Helvetica,sans-serif;white-space:nowrap"><img src="cid:' + e(aiEmailIconCid_(item.key)) + '" alt="" width="32" height="32" style="display:inline-block;vertical-align:middle;border:0;border-radius:8px;width:32px;height:32px;margin-right:6px"><span style="display:inline-block;vertical-align:middle;color:#123f73">' + e(item.label) + '</span></a>').join('');
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

// Bundled PNG bytes: email icons work without fetching newly uploaded assets.
// Source and Font Awesome Free license: images/email-icons/.
function aiEmailIconData_() {
  return {"facebook":"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","google":"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","instagram":"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","linkedin":"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","telegram":"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","threads":"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","whatsapp-channel":"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","x":"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","youtube":"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"};
}
function aiEmailIconCid_(key) { return 'assur_social_' + String(key).replace(/-/g, '_'); }
function aiEmailInlinePayload_(html) {
  const icons = aiEmailIconData_();
  return Object.keys(icons).filter(key => String(html || '').indexOf('cid:' + aiEmailIconCid_(key)) >= 0)
    .map(key => ({ cid: aiEmailIconCid_(key), filename: key + '.png', contentType: 'image/png', base64: icons[key] }));
}
function aiEmailInlineBlobs_(html) {
  const result = {};
  aiEmailInlinePayload_(html).forEach(item => { result[item.cid] = Utilities.newBlob(Utilities.base64Decode(item.base64), item.contentType, item.filename); });
  return result;
}

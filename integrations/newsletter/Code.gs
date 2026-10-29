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
  const remaining = MailApp.getRemainingDailyQuota();
  const exists = ScriptApp.getProjectTriggers().some(trigger => trigger.getHandlerFunction() === 'retryPendingNewsletterEmails');
  if (!exists) ScriptApp.newTrigger('retryPendingNewsletterEmails').timeBased().everyHours(1).create();
  console.log('Newsletter email is ready. Remaining recipient quota today: ' + remaining + '. Now deploy a new version of the SAME web app.');
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
    const url = ScriptApp.getService().getUrl();
    return nlPage_('Unsubscribe from updates', 'Choose Unsubscribe below to stop receiving AssurIntellec service updates.',
      '<form method="post" target="_top" action="' + nlEscape_(url) + '"><input type="hidden" name="action" value="unsubscribe"><input type="hidden" name="token" value="' + nlEscape_(token) + '"><button type="submit">Unsubscribe</button></form>');
  }
  let ready = false;
  try { nlGetSheet_(); ready = true; } catch (_) {}
  return nlPage_('AssurIntellec Newsletter', ready ? 'The subscription endpoint is ready. Subscribers can join through www.assurintellec.in.' : 'Setup is not complete. Run setupNewsletterSheet in the Apps Script editor.');
}

function doPost(e) {
  const data = e && e.parameter ? e.parameter : {};
  if (data.action === 'unsubscribe') {
    try {
      nlUnsubscribe_(data.token);
      return nlPage_('You have been unsubscribed', 'Your subscription status is now Unsubscribed.');
    } catch (error) { return nlPage_('Unable to unsubscribe', error.message || 'Please contact info@assurintellec.in.'); }
  }
  let result;
  try { result = nlSaveSubscriber_(data); }
  catch (error) { console.error(error); result = { success: false, message: error.message || 'Your subscription could not be saved.' }; }
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
    const endpoint = ScriptApp.getService().getUrl();
    const source = String(data.source_page || '/').slice(0, 200);
    const welcomeDue = !previous || previous[3] !== 'Active';
    const tracking = welcomeDue ? ['Pending', '', ''] : [previous[10] || 'Skipped (existing subscriber)', previous[11] || '', previous[12] || ''];
    const row = [previous ? previous[0] : now, nlCell_(email), NL_INTERESTS[interest], 'Active', now, 'Yes', 'newsletter-v1', nlCell_(source), endpoint ? endpoint + '?action=unsubscribe&token=' + token : '', token].concat(tracking);
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
    const endpoint = ScriptApp.getService().getUrl();
    if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(String(endpoint || ''))) throw new Error('Deploy the newsletter web app before sending email.');
    if (!/^[a-f0-9]{64}$/.test(String(row[9] || ''))) throw new Error('The unsubscribe token is missing.');
    const unsubscribe = endpoint + '?action=unsubscribe&token=' + row[9];
    sheet.getRange(rowNumber, 9).setValue(unsubscribe);
    if (MailApp.getRemainingDailyQuota() < 1) throw new Error('Daily email quota reached. The hourly job will retry.');
    const interest = String(row[2] || 'All service updates');
    const body = 'Thank you for subscribing to AssurIntellec™!\n\n' +
      'Your subscription is active. Your selected updates: ' + interest + '.\n\n' +
      'We look forward to sharing service news, insights and opportunities with you.\n\n' +
      'Visit our website: ' + NL_EMAIL.website + '\n' +
      'Questions? Reply to ' + NL_EMAIL.replyTo + '.\n\n' +
      'You received this email because you subscribed on our website. To stop receiving updates, open your personal link and confirm Unsubscribe:\n' + unsubscribe + '\n\n' +
      'Warm regards,\nThe AssurIntellec™ Team';
    const htmlBody = '<!doctype html><html><body style="margin:0;background:#f4f7fb;color:#233247;font-family:Arial,sans-serif">' +
      '<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="padding:28px 16px">' +
      '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:auto;background:#ffffff;border:1px solid #dce5ee;border-radius:14px">' +
      '<tr><td style="padding:24px 28px;background:#0b1f3a;color:#e6cb76;font-size:23px;font-weight:bold;border-radius:14px 14px 0 0">AssurIntellec™</td></tr>' +
      '<tr><td style="padding:28px;line-height:1.7"><h1 style="margin:0 0 16px;color:#0b1f3a;font-size:25px">Thank you for subscribing!</h1>' +
      '<p>Your subscription is active. We look forward to sharing service news, insights and opportunities with you.</p>' +
      '<p style="padding:14px 16px;background:#f4f7fb;border-left:3px solid #c9a227"><strong>Your selected updates</strong><br>' + nlEscape_(interest) + '</p>' +
      '<p><a href="' + nlEscape_(NL_EMAIL.website) + '" style="color:#123f73;font-weight:bold">Visit our website</a></p>' +
      '<p>Questions? Reply to <a href="mailto:' + nlEscape_(NL_EMAIL.replyTo) + '" style="color:#123f73">' + nlEscape_(NL_EMAIL.replyTo) + '</a>.</p>' +
      '<p>Warm regards,<br><strong>The AssurIntellec™ Team</strong></p>' +
      '<hr style="border:0;border-top:1px solid #dce5ee;margin:24px 0"><p style="font-size:12px;color:#627287">You received this email because you subscribed on our website. ' +
      '<a href="' + nlEscape_(unsubscribe) + '" style="color:#123f73;text-decoration:underline">Unsubscribe from updates</a>. Open the link and confirm Unsubscribe to stop future updates.</p>' +
      '</td></tr></table></td></tr></table></body></html>';
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

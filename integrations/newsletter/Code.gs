/* Paste this file into a NEW Apps Script project opened from the dedicated
   newsletter spreadsheet. Do not replace the existing enquiry script. */
const NL_SHEET_NAME = 'NewsletterSubscribers';
const NL_SHEET_PROPERTY = 'ASSURINTELLEC_NEWSLETTER_SHEET_ID';
const NL_ORIGINS = ['https://www.assurintellec.in', 'https://assurintellec.in'];
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
const NL_HEADERS = ['Subscribed At', 'Email', 'Service Interest', 'Status', 'Last Updated', 'Consent', 'Consent Version', 'Source Page', 'Unsubscribe URL', 'Unsubscribe Token'];

/** Run ONCE from the Apps Script editor, before deploying the web app. */
function setupNewsletterSheet() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  if (!book) throw new Error('Open this script from your newsletter Google Sheet: Extensions > Apps Script.');
  PropertiesService.getScriptProperties().setProperty(NL_SHEET_PROPERTY, book.getId());
  let sheet = book.getSheetByName(NL_SHEET_NAME);
  if (!sheet) sheet = book.insertSheet(NL_SHEET_NAME);
  if (!sheet.getLastRow()) sheet.getRange(1, 1, 1, NL_HEADERS.length).setValues([NL_HEADERS]);
  nlCheckHeaders_(sheet);
  book.setSpreadsheetTimeZone('Asia/Kolkata');
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, NL_HEADERS.length).setFontWeight('bold').setBackground('#0b1f3a').setFontColor('#ffffff');
  sheet.getRange('A:A').setNumberFormat('dd-mmm-yyyy hh:mm:ss');
  sheet.getRange('E:E').setNumberFormat('dd-mmm-yyyy hh:mm:ss');
  sheet.getRange('B:D').setNumberFormat('@');
  sheet.getRange('F:J').setNumberFormat('@');
  sheet.autoResizeColumns(1, NL_HEADERS.length);
  sheet.hideColumns(10);
  if (!sheet.getFilter()) sheet.getRange(1, 1, sheet.getMaxRows(), NL_HEADERS.length).createFilter();
  SpreadsheetApp.flush();
  console.log('NewsletterSubscribers is ready in your Google account. Deploy this script as a web app next.');
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
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new Error('Enter a valid email address.');
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
    const row = [previous ? previous[0] : now, nlCell_(email), NL_INTERESTS[interest], 'Active', now, 'Yes', 'newsletter-v1', nlCell_(source), endpoint ? endpoint + '?action=unsubscribe&token=' + token : '', token];
    if (index >= 0) sheet.getRange(index + 2, 1, 1, NL_HEADERS.length).setValues([row]);
    else sheet.appendRow(row);
    SpreadsheetApp.flush();
    return { success: true, message: 'Your subscription and selected interest have been saved.' };
  } finally { lock.releaseLock(); }
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
function nlCell_(value) { const s = String(value || ''); return /^[=+\-@]/.test(s) ? "'" + s : s; }
function nlEscape_(value) { return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
function nlPage_(title, message, extra) {
  return HtmlService.createHtmlOutput('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + nlEscape_(title) + '</title><style>body{margin:0;padding:32px;font-family:Arial,sans-serif;background:#f4f7fb;color:#233247}main{max-width:560px;margin:40px auto;background:white;border:1px solid #dce5ee;border-radius:18px;padding:32px;line-height:1.7}h1{font-size:24px;color:#0b1f3a}button{padding:12px 20px;background:#0b1f3a;color:white;border:0;border-radius:8px;font-weight:bold;cursor:pointer}</style></head><body><main><strong>AssurIntellec™</strong><h1>' + nlEscape_(title) + '</h1><p>' + nlEscape_(message) + '</p>' + (extra || '') + '</main></body></html>');
}

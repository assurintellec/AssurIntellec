/* Add this as WhatsApp.gs in the existing ENQUIRY Apps Script project.
   Credentials belong only in Script Properties. See WEBSITE_UPDATE_02-11-2026.md.
   API acceptance is recorded; it is not proof of delivery or a read receipt. */
const WA_COLUMNS = ['WhatsApp Consent', 'Customer WhatsApp Status', 'Admin WhatsApp Status'];
function setupWhatsAppIntegration() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = book.getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error('Enquiries sheet is missing.');
  PropertiesService.getScriptProperties().setProperty('WA_ENQUIRY_SHEET_ID', book.getId());
  ensureSheetHeaders(sheet);
  const exists = ScriptApp.getProjectTriggers().some(t => t.getHandlerFunction() === 'sendPendingEnquiryWhatsApp');
  if (!exists) ScriptApp.newTrigger('sendPendingEnquiryWhatsApp').timeBased().everyMinutes(1).create();
  console.log('WhatsApp job installed. It processes only newly queued, consented enquiries and pending office notifications. Existing enquiries are not messaged. Set WA_ENABLED=true only after credentials/templates are ready.');
}
function waQueue_(sheet, row, data) {
  const enabled = PropertiesService.getScriptProperties().getProperty('WA_ENABLED') === 'true';
  updateEnquiryStatus(sheet, row, 'WhatsApp Consent', data.whatsappConsent ? 'Yes' : 'No');
  updateEnquiryStatus(sheet, row, 'Customer WhatsApp Status', !data.whatsappConsent ? 'Not requested' : enabled ? 'Pending' : 'Not configured');
  updateEnquiryStatus(sheet, row, 'Admin WhatsApp Status', enabled ? 'Pending' : 'Not configured');
}
function waPhone_(value) {
  let phone = String(value || '').replace(/[^0-9]/g, '');
  if (phone.length === 10) phone = '91' + phone;
  if (phone.startsWith('00')) phone = phone.slice(2);
  return /^[1-9][0-9]{7,14}$/.test(phone) ? phone : '';
}
function waText_(value, limit) { return String(value || '').replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, limit || 200) || '-'; }
function waPayload_(to, template, language, parameters) {
  if (!waPhone_(to) || !/^[a-z0-9_]{1,512}$/.test(template) || !/^[a-z]{2}(?:_[A-Z]{2})?$/.test(language)) throw new Error('Check recipient, approved template name and language.');
  return { messaging_product: 'whatsapp', recipient_type: 'individual', to: waPhone_(to), type: 'template', template: { name: template, language: { code: language }, components: [{ type: 'body', parameters: parameters.map(value => ({ type: 'text', text: value })) }] } };
}
function waSend_(properties, to, admin, parameters) {
  const version = String(properties.getProperty('WA_API_VERSION') || '');
  const primaryId = String(properties.getProperty('WA_PHONE_NUMBER_ID') || '');
  const phoneId = admin ? String(properties.getProperty('WA_ADMIN_PHONE_NUMBER_ID') || primaryId) : primaryId;
  const token = admin ? String(properties.getProperty('WA_ADMIN_ACCESS_TOKEN') || properties.getProperty('WA_ACCESS_TOKEN') || '') : String(properties.getProperty('WA_ACCESS_TOKEN') || '');
  if (!/^v\d+\.\d+$/.test(version) || !/^\d{5,30}$/.test(phoneId) || token.length < 20) throw new Error('Configure WhatsApp API version, phone number ID and access token.');
  const senderNumber = waPhone_(properties.getProperty('WA_SENDER_NUMBER') || '917600666436');
  // The desired office recipient cannot receive a notification sent by itself.
  if (admin && waPhone_(to) === senderNumber && phoneId === primaryId) throw new Error('Office alert needs a DIFFERENT registered sender (WA_ADMIN_PHONE_NUMBER_ID) or a different WA_ADMIN_TO.');
  if (!admin && waPhone_(to) === senderNumber) throw new Error('Customer recipient equals the sending number.');
  const name = properties.getProperty(admin ? 'WA_ADMIN_TEMPLATE' : 'WA_CUSTOMER_TEMPLATE') || '';
  const language = properties.getProperty('WA_TEMPLATE_LANGUAGE') || 'en';
  const payload = waPayload_(to, name, language, parameters);
  const response = UrlFetchApp.fetch('https://graph.facebook.com/' + version + '/' + phoneId + '/messages', {
    method: 'post', contentType: 'application/json', headers: { Authorization: 'Bearer ' + token }, payload: JSON.stringify(payload), muteHttpExceptions: true
  });
  let result = {}; try { result = JSON.parse(response.getContentText()); } catch (_) {}
  const messageId = result.messages && result.messages[0] && result.messages[0].id;
  if (response.getResponseCode() < 200 || response.getResponseCode() >= 300 || !messageId) {
    // Keep bearer tokens and provider response bodies out of the spreadsheet.
    throw new Error('WhatsApp API rejected request (HTTP ' + response.getResponseCode() + ', code ' + String(result.error && result.error.code || 'unknown') + '). Check template approval, language, sender and recipient permissions.');
  }
  return 'API accepted: ' + waText_(messageId, 160);
}
function sendPendingEnquiryWhatsApp() {
  const properties = PropertiesService.getScriptProperties();
  if (properties.getProperty('WA_ENABLED') !== 'true') return;
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return;
  try {
    const bookId = properties.getProperty('WA_ENQUIRY_SHEET_ID');
    if (!bookId) throw new Error('Run setupWhatsAppIntegration first.');
    const sheet = SpreadsheetApp.openById(bookId).getSheetByName(SHEET_NAME), headers = ensureSheetHeaders(sheet);
    if (sheet.getLastRow() < 2) return;
    const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
    let count = 0;
    for (let i = 0; i < rows.length && count < 10; i++) {
      const row = rows[i], get = name => row[headers[name] - 1], n = i + 2;
      for (const admin of [false, true]) {
        const status = admin ? 'Admin WhatsApp Status' : 'Customer WhatsApp Status';
        if (get(status) !== 'Pending') continue;
        if (!admin && get('WhatsApp Consent') !== 'Yes') { updateEnquiryStatus(sheet, n, status, 'Not requested'); continue; }
        count++;
        // Mark before the HTTP call: an uncertain timeout must not auto-send duplicates.
        updateEnquiryStatus(sheet, n, status, 'Sending (check before retry)'); SpreadsheetApp.flush();
        try {
          const phone = admin ? waPhone_(properties.getProperty('WA_ADMIN_TO') || '917600666436') : waPhone_(get('Phone / WhatsApp'));
          const parameters = admin ? [waText_(get('Enquiry Reference')), waText_(get('Name')), waText_(get('Phone / WhatsApp')), waText_(get('Email')), waText_(get('Service')), waText_(get('Requirement'), 1000)] : [waText_(get('Name')), waText_(get('Enquiry Reference')), waText_(get('Service'))];
          updateEnquiryStatus(sheet, n, status, waSend_(properties, phone, admin, parameters));
        } catch (error) { updateEnquiryStatus(sheet, n, status, 'Needs review: ' + waText_(error.message, 400)); }
      }
    }
  } finally { lock.releaseLock(); }
}

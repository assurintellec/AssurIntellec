const CONFIG = {
  RECIPIENT_EMAIL: 'assurintellec@gmail.com',
  SPREADSHEET_ID: 'PASTE_YOUR_GOOGLE_SHEET_ID_HERE',
  SHEET_NAME: 'Enquiries'
};

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, service: 'AssurIntellec enquiry endpoint' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const p = (e && e.parameter) ? e.parameter : {};
    const now = new Date();
    const row = [
      now,
      p.name || '',
      p.company || '',
      p.email || '',
      p.phone || '',
      p.service || '',
      p.message || '',
      p.source || 'Website',
      p.submitted_at || ''
    ];

    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sh = ss.getSheetByName(CONFIG.SHEET_NAME) || ss.insertSheet(CONFIG.SHEET_NAME);

    if (sh.getLastRow() === 0) {
      sh.appendRow(['Timestamp','Name','Company','Email','Phone','Requirement','Message','Source','Client Submitted At']);
      sh.getRange(1,1,1,9).setFontWeight('bold');
    }
    sh.appendRow(row);

    const subject = 'New AssurIntellec™ website enquiry';
    const body = [
      'New website enquiry',
      '',
      'Name: ' + (p.name || ''),
      'Company: ' + (p.company || ''),
      'Email: ' + (p.email || ''),
      'Phone: ' + (p.phone || ''),
      'Requirement: ' + (p.service || ''),
      '',
      'Message:',
      (p.message || ''),
      '',
      'Submitted: ' + now.toString()
    ].join('\n');

    MailApp.sendEmail(CONFIG.RECIPIENT_EMAIL, subject, body);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    console.error(err);
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

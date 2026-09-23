const SHEET_NAME = 'Enquiries';
const TO_EMAIL = 'info@assurintellec.in';
const FROM_EMAIL = 'info@assurintellec.in';
const WEBSITE_URL = 'https://www.assurintellec.in/';
const REFERENCE_PROPERTY = 'ASSURINTELLEC_ENQUIRY_SEQUENCE';
const REFERENCE_PREFIX = 'AI';
const REFERENCE_DIGITS = 6;

/*
 * Leave blank when this Apps Script project is bound to the
 * "AssurIntellec Website Enquiries" spreadsheet.
 * If the script is standalone, put the spreadsheet ID here.
 */
const SPREADSHEET_ID = '';

function doGet() {
  return HtmlService
    .createHtmlOutput(
      '<!doctype html><html><head><meta charset="utf-8"><title>AssurIntellec Enquiry Service</title></head><body><p>AssurIntellec Enquiry Service is active.</p></body></html>'
    )
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  try {
    const data = e && e.parameter ? e.parameter : {};
    const result = processEnquiry(data);
    return htmlResponse(result);
  } catch (error) {
    console.error(error);
    return htmlResponse({
      success: false,
      message: error && error.message
        ? error.message
        : 'Unexpected enquiry service error.'
    });
  }
}

function processEnquiry(data) {
  const normalized = normalizeEnquiryData(data || {});
  validateEnquiry(normalized);

  const sheet = getEnquiriesSheet();
  const reference = generateEnquiryReference(sheet);

  const rowNumber = appendEnquiryRow(
    sheet,
    normalized,
    reference,
    'Pending',
    normalized.confirmationEmailEnabled === false
      ? 'Disabled'
      : 'Pending'
  );

  let adminStatus = 'Failed';
  let customerStatus = normalized.confirmationEmailEnabled === false
    ? 'Disabled'
    : 'Failed';

  /* -------------------------------------------------------
     1. Send enquiry notification to AssurIntellec
  ------------------------------------------------------- */
  try {
    const adminSubject =
      'New AssurIntellec™ Website Enquiry | ' +
      reference +
      ' | ' +
      normalized.name;

    const adminBody =
`NEW ASSURINTELLEC™ WEBSITE ENQUIRY

Enquiry Reference: ${reference}

Name: ${normalized.name}
Company: ${normalized.company || '-'}
Email: ${normalized.email}
Phone / WhatsApp: ${normalized.phone}
Service / Requirement: ${normalized.service}

Requirement:
${normalized.message}

Submitted from:
${WEBSITE_URL}`;

    const adminResult = sendAssurIntellecEmail({
      recipient: TO_EMAIL,
      subject: adminSubject,
      body: adminBody,
      preferredFrom: FROM_EMAIL,
      replyTo: normalized.email,
      senderName: 'AssurIntellec™ Website'
    });

    adminStatus = adminResult.status;
  } catch (error) {
    adminStatus = 'Failed: ' + safeErrorMessage(error);
  }

  updateEnquiryStatus(
    sheet,
    rowNumber,
    'Admin Email Status',
    adminStatus
  );

  /* -------------------------------------------------------
     2. Send automatic confirmation to customer
  ------------------------------------------------------- */
  if (normalized.confirmationEmailEnabled !== false) {
    try {
      const subject =
        normalized.confirmationEmailSubject ||
        'Thank You for Contacting AssurIntellec™ | Enquiry Received';

      const template =
        normalized.confirmationEmailMessage ||
`Dear {name},

Thank you for connecting with AssurIntellec™.

We have successfully received your enquiry and appreciate your interest in our pharmaceutical, life sciences and compliance solutions.

Enquiry Reference: {reference}

Our team will carefully review your requirements and contact you shortly to discuss the most suitable solution.

Please feel free to reply to this email if you would like to provide any additional information.

We look forward to connecting with you.

Warm regards,
AssurIntellec™
Intelligent Solutions. Assured Compliance.
www.assurintellec.in
info@assurintellec.in`;

      const body = renderTemplate(template, {
        name: normalized.name,
        company: normalized.company,
        email: normalized.email,
        phone: normalized.phone,
        service: normalized.service,
        message: normalized.message,
        reference: reference
      });

      const customerResult = sendAssurIntellecEmail({
        recipient: normalized.email,
        subject: subject,
        body: body,
        preferredFrom:
          normalized.confirmationEmailFromEmail ||
          FROM_EMAIL,
        replyTo: FROM_EMAIL,
        senderName: 'AssurIntellec™'
      });

      customerStatus = customerResult.status;
    } catch (error) {
      customerStatus = 'Failed: ' + safeErrorMessage(error);
    }

    updateEnquiryStatus(
      sheet,
      rowNumber,
      'Customer Email Status',
      customerStatus
    );
  }

  /*
   * The enquiry itself is considered successfully submitted as soon as
   * it is stored in the Google Sheet. Email delivery status is recorded
   * separately so a mail problem does not cause the website to hang or
   * display a misleading submission error.
   */
  return {
    success: true,
    reference: reference,
    adminEmailStatus: adminStatus,
    customerEmailStatus: customerStatus,
    message: 'Enquiry submitted successfully.'
  };
}

function getEnquiriesSheet() {
  let spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  if (!spreadsheet && SPREADSHEET_ID) {
    spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  }

  if (!spreadsheet) {
    throw new Error(
      'No spreadsheet is connected to this Apps Script. Bind this script to the AssurIntellec Website Enquiries spreadsheet or set SPREADSHEET_ID in Code.gs.'
    );
  }

  const sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    throw new Error(
      "Sheet '" + SHEET_NAME + "' was not found in the connected spreadsheet."
    );
  }

  return sheet;
}

function normalizeEnquiryData(data) {
  return {
    name: cleanText(data.name, 160),
    company: cleanText(data.company, 200),
    email: cleanText(data.email, 254).toLowerCase(),
    phone: cleanText(data.phone, 60),
    service: cleanText(data.service, 200),
    message: cleanText(data.message, 4000),
    confirmationEmailEnabled:
      String(data.confirmation_email_enabled || 'true').toLowerCase() !== 'false',
    confirmationEmailSubject:
      cleanText(data.confirmation_email_subject, 300),
    confirmationEmailMessage:
      cleanText(data.confirmation_email_message, 8000),
    confirmationEmailFromEmail:
      cleanText(data.confirmation_email_from_email, 254)
        .toLowerCase()
  };
}

function cleanText(value, maxLength) {
  const text = String(value || '')
    .replace(/\u0000/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();

  return maxLength ? text.slice(0, maxLength) : text;
}

function validateEnquiry(data) {
  if (!data.name) {
    throw new Error('Name is required.');
  }

  if (!data.email) {
    throw new Error('Email is required.');
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    throw new Error('A valid customer email address is required.');
  }

  if (!data.phone) {
    throw new Error('Phone is required.');
  }

  if (!data.service) {
    throw new Error('Requirement is required.');
  }

  if (!data.message) {
    throw new Error('Message is required.');
  }
}

function sendAssurIntellecEmail(options) {
  const recipient = cleanText(options.recipient, 254);
  const subject = cleanText(options.subject, 300);
  const body = String(options.body || '');
  const preferredFrom = cleanText(
    options.preferredFrom || FROM_EMAIL,
    254
  ).toLowerCase();
  const replyTo = cleanText(
    options.replyTo || FROM_EMAIL,
    254
  );
  const senderName = cleanText(
    options.senderName || 'AssurIntellec™',
    200
  );

  if (!recipient) {
    throw new Error('Email recipient is missing.');
  }

  const aliases = (GmailApp.getAliases() || [])
    .map(alias => String(alias).trim().toLowerCase());

  const effectiveEmail = String(
    Session.getEffectiveUser().getEmail() || ''
  )
    .trim()
    .toLowerCase();

  const canUsePreferredFrom =
    preferredFrom === effectiveEmail ||
    aliases.indexOf(preferredFrom) !== -1;

  const optionsWithReply = {
    name: senderName,
    replyTo: replyTo
  };

  if (canUsePreferredFrom) {
    optionsWithReply.from = preferredFrom;

    GmailApp.sendEmail(
      recipient,
      subject,
      body,
      optionsWithReply
    );

    return {
      status: 'Sent from ' + preferredFrom,
      sender: preferredFrom,
      exactSender: true
    };
  }

  /*
   * Reliable fallback:
   * send the message even if info@assurintellec.in has not yet been
   * configured as a Gmail "Send mail as" alias. The Reply-To remains
   * info@assurintellec.in. Once the alias is configured, the exact
   * sender will automatically switch to info@assurintellec.in.
   */
  GmailApp.sendEmail(
    recipient,
    subject,
    body,
    optionsWithReply
  );

  return {
    status:
      'Sent using the Google account sender; configure ' +
      preferredFrom +
      ' as a Gmail Send-as alias for exact From address.',
    sender: effectiveEmail || 'Google account sender',
    exactSender: false
  };
}

function appendEnquiryRow(
  sheet,
  data,
  reference,
  adminStatus,
  customerStatus
) {
  const headers = ensureSheetHeaders(sheet);
  const lastColumn = Math.max(
    sheet.getLastColumn(),
    headers.__count || 1
  );
  const row = new Array(lastColumn).fill('');

  setRowValue(row, headers, 'Date & Time', new Date());
  setRowValue(row, headers, 'Name', data.name);
  setRowValue(row, headers, 'Company', data.company);
  setRowValue(row, headers, 'Email', data.email);
  setRowValue(row, headers, 'Phone / WhatsApp', data.phone);
  setRowValue(row, headers, 'Service', data.service);
  setRowValue(row, headers, 'Requirement', data.message);
  setRowValue(row, headers, 'Enquiry Reference', reference);
  setRowValue(row, headers, 'Admin Email Status', adminStatus);
  setRowValue(row, headers, 'Customer Email Status', customerStatus);

  sheet.appendRow(row);
  return sheet.getLastRow();
}

function setRowValue(row, headers, headerName, value) {
  const column = headers[headerName];
  if (!column) return;
  row[column - 1] = value;
}

function ensureSheetHeaders(sheet) {
  const required = [
    'Date & Time',
    'Name',
    'Company',
    'Email',
    'Phone / WhatsApp',
    'Service',
    'Requirement',
    'Enquiry Reference',
    'Admin Email Status',
    'Customer Email Status'
  ];

  const requiredColumnCount = required.length;
  const currentLastColumn = Math.max(
    sheet.getLastColumn(),
    1
  );

  let headers = sheet
    .getRange(
      1,
      1,
      1,
      currentLastColumn
    )
    .getValues()[0]
    .map(value => String(value || '').trim());

  required.forEach(name => {
    if (headers.indexOf(name) === -1) {
      headers.push(name);
    }
  });

  sheet
    .getRange(
      1,
      1,
      1,
      headers.length
    )
    .setValues([headers]);

  const map = {
    __count: headers.length
  };

  headers.forEach((name, index) => {
    if (name) {
      map[name] = index + 1;
    }
  });

  return map;
}

function updateEnquiryStatus(
  sheet,
  rowNumber,
  headerName,
  status
) {
  const headers = ensureSheetHeaders(sheet);
  const column = headers[headerName];

  if (!column) return;

  sheet
    .getRange(rowNumber, column)
    .setValue(status);
}

function generateEnquiryReference(sheet) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const properties =
      PropertiesService.getScriptProperties();

    let current = Number(
      properties.getProperty(
        REFERENCE_PROPERTY
      ) || 0
    );

    if (!current) {
      current =
        findHighestExistingReferenceNumber(
          sheet
        );
    }

    const next = current + 1;

    properties.setProperty(
      REFERENCE_PROPERTY,
      String(next)
    );

    return (
      REFERENCE_PREFIX +
      '-' +
      String(next).padStart(
        REFERENCE_DIGITS,
        '0'
      )
    );
  } finally {
    lock.releaseLock();
  }
}

function findHighestExistingReferenceNumber(sheet) {
  const headers = ensureSheetHeaders(sheet);
  const referenceColumn =
    headers['Enquiry Reference'];

  const lastRow = sheet.getLastRow();

  if (!referenceColumn || lastRow < 2) {
    return 0;
  }

  const values = sheet
    .getRange(
      2,
      referenceColumn,
      lastRow - 1,
      1
    )
    .getValues()
    .flat();

  let highest = 0;

  values.forEach(value => {
    const match = String(value || '')
      .trim()
      .match(
        new RegExp(
          '^' +
          REFERENCE_PREFIX +
          '-(\\d+)$',
          'i'
        )
      );

    if (match) {
      highest = Math.max(
        highest,
        Number(match[1])
      );
    }
  });

  return highest;
}

function renderTemplate(template, data) {
  return String(template || '')
    .replace(/\{name\}/g, data.name || '')
    .replace(/\{company\}/g, data.company || '')
    .replace(/\{email\}/g, data.email || '')
    .replace(/\{phone\}/g, data.phone || '')
    .replace(/\{service\}/g, data.service || '')
    .replace(/\{message\}/g, data.message || '')
    .replace(/\{reference\}/g, data.reference || '');
}

function safeErrorMessage(error) {
  return cleanText(
    error && error.message
      ? error.message
      : 'Unknown email error',
    500
  );
}

function htmlResponse(data) {
  const safe =
    JSON.stringify(data || {})
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  return HtmlService
    .createHtmlOutput(
      '<!doctype html><html><head><meta charset="utf-8"><title>AssurIntellec Enquiry</title></head><body><script>window.parent.postMessage({type:"assurintellec:server-response",data:' + safe + '},"*");</script><p>Enquiry processed.</p></body></html>'
    )
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function testSenderConfiguration() {
  const aliases = GmailApp.getAliases() || [];
  const effectiveEmail =
    Session.getEffectiveUser().getEmail();

  const normalizedAliases = aliases.map(alias =>
    String(alias).trim().toLowerCase()
  );

  const senderReady =
    normalizedAliases.indexOf(
      FROM_EMAIL.toLowerCase()
    ) !== -1 ||
    String(effectiveEmail)
      .trim()
      .toLowerCase() === FROM_EMAIL.toLowerCase();

  const result = {
    requiredSender: FROM_EMAIL,
    effectiveEmail: effectiveEmail,
    aliases: aliases,
    exactSenderReady: senderReady,
    note: senderReady
      ? 'info@assurintellec.in can be used as the From address.'
      : 'Add info@assurintellec.in to Gmail > Settings > Accounts and Import > Send mail as, then verify it.'
  };

  console.log(JSON.stringify(result, null, 2));
  return result;
}

function authorize() {
  getEnquiriesSheet().getName();
  GmailApp.getAliases();
  testSenderConfiguration();
}
